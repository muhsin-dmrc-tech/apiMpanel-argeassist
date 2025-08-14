import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { Brackets, DataSource, In, Repository } from 'typeorm';
import { ProjeRaporlari } from './entities/proje-raporlari.entity';
import * as fs from 'fs';
import * as path from 'path';
import * as mime from 'mime-types';
import { Projeler } from 'src/projeler/entities/projeler.entity';
import { CreateProjeRaporDto, PersonelTableData } from './dto/create.dto';
import { Personel } from 'src/personel/entities/personel.entity';
import { Firma } from 'src/firmalar/entities/firma.entity';
import { PersonelService } from 'src/personel/personel.service';
import { Bildirimler } from 'src/bildirimler/entities/bildirimler.entity';
import { KullaniciBildirimleri } from 'src/kullanici-bildirimleri/entities/kullanici-bildirimleri.entity';
import { AppGateway } from 'src/websocket.gateway';
import { Donem } from 'src/donem/entities/donem.entity';
import { SurecKayitlari } from 'src/surecler/entities/surec-kayitlari.entity';
import { Surecler } from 'src/surecler/entities/surecler.entity';
import { MailService } from 'src/mail/mail.service';
import * as tmp from 'tmp';
import { PdfAnalizService } from 'src/pdf-analiz/pdf-analiz.service';
import { PersonellerType } from 'src/pdf-analiz/dto/analiz-types.dto';
const PDFParser = require('pdf2json');

@Injectable()
export class ProjeRaporlariService {
    constructor(
        @InjectRepository(ProjeRaporlari)
        private readonly projeRaporRepository: Repository<ProjeRaporlari>,
        private readonly personelServise: PersonelService,
        private readonly dataSource: DataSource,
        private readonly appGateway: AppGateway,
        private readonly mailService: MailService,
        private readonly analizService: PdfAnalizService,
    ) { }


    async teknoUzmanVeHakemProjeler(userId: number, TeknokentID: number, IlgiliID: number) {
        if (!userId) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }
        if (!IlgiliID) {
            throw new BadRequestException(`Uzman yada hakem id gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        if (user.KullaniciTipi !== 3) {
            throw new ForbiddenException(`Yetkisiz kullanıcı işlemi 1.`);
        }


        const teknoKullanici = await this.dataSource.getRepository(Personel).findOne({ where: { KullaniciID: userId, Tip: 3 } });

        if (!teknoKullanici || teknoKullanici.IliskiID !== TeknokentID) {
            throw new ForbiddenException(`Yetkisiz kullanıcı işlemi 2.`);
        }

        if (user.id !== IlgiliID && teknoKullanici.Rol !== 'owner') {
            throw new ForbiddenException(`Yetkisiz kullanıcı işlemi 3.`);
        }

        const sonDonem = await this.dataSource.getRepository(Donem)
            .createQueryBuilder('donem')
            .where('donem.IsDeleted != 1')
            .orderBy('donem.DonemID', 'DESC')
            .take(1)
            .getOne();
        const queryBuilder = this.dataSource.getRepository(ProjeRaporlari).createQueryBuilder('raporlar')
            .leftJoinAndSelect('raporlar.Proje', 'Proje')
            .leftJoinAndSelect('raporlar.Donem', 'Donem')
            .where('Proje.TeknokentID = :TeknokentID', { TeknokentID: TeknokentID })
            //.andWhere('raporlar.DonemID = :DonemID', { DonemID: sonDonem.DonemID})
            .andWhere(
                new Brackets(qb =>
                    qb.where('Proje.ProjeUzmanKullaniciID = :id', { id: IlgiliID })
                        .orWhere('Proje.ProjeHakemKullaniciID = :id', { id: IlgiliID })
                )
            );



        const raporlar = await queryBuilder.getMany();
        const raporIDs = raporlar.map(r => r.RaporID);
        if (raporIDs.length === 0) {
            return { raporlar: [], sonDonem };
        }

        const raporAnahtarMap = new Map<number, string>();

        for (const rapor of raporlar) {
            if (rapor?.Proje?.ProjeUzmanKullaniciID === IlgiliID) {
                raporAnahtarMap.set(rapor.RaporID, 'aylik-faaliyet-on-onay');
            } else if (rapor?.Proje?.ProjeHakemKullaniciID === IlgiliID) {
                raporAnahtarMap.set(rapor.RaporID, 'aylik-faaliyet-hakem-onay');
            }
        }

        // 2. Süreç kayıtlarını topluca çek (ilgili anahtarlara göre)
        const surecKayitlari = await this.dataSource.getRepository(SurecKayitlari)
            .createQueryBuilder('kayit')
            .leftJoinAndSelect('kayit.Surec', 'surec')
            .leftJoinAndSelect('kayit.Adim', 'adim')
            .where('kayit.ItemID IN (:...ids)', { ids: raporIDs })
            .andWhere('surec.IsDeleted != 1')
            .getMany();

        // 3. Surec kayıtlarını filtrele ve eşleştir
        const groupedKayitlar = new Map<number, SurecKayitlari[]>();

        for (const kayit of surecKayitlari) {
            const itemID = Number(kayit.ItemID);
            const beklenenAnahtar = raporAnahtarMap.get(itemID);
            if (!beklenenAnahtar) continue;

            if (kayit.Surec?.Anahtar === beklenenAnahtar) {
                if (!groupedKayitlar.has(itemID)) {
                    groupedKayitlar.set(itemID, []);
                }
                groupedKayitlar.get(itemID).push(kayit);
            }
        }

        // 4. Raporlara ekle
        for (const rapor of raporlar) {
            rapor.SurecKayitlari = groupedKayitlar.get(rapor.RaporID) || [];
        }


        return { raporlar, sonDonem };
    }






    async aylikFaaliyetRaporlariTekno(userId: number, query: any, TeknokentID: number) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'RaporID';
        const order = query.order || 'DESC';
        const filter = query.filter || {};

        if (isNaN(page) || isNaN(limit)) {
            throw new BadRequestException('Sayfa ve Sınır Numaralar olmalı');
        }

        if (!userId) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        if (user.KullaniciTipi !== 3) {
            throw new ForbiddenException(`Yetkisiz kullanıcı işlemi.`);
        }

        const teknoKullanici = await this.dataSource.getRepository(Personel).findOne({ where: { KullaniciID: userId, Tip: 3 } });

        if (!teknoKullanici || teknoKullanici.IliskiID !== TeknokentID) {
            throw new ForbiddenException(`Yetkisiz kullanıcı işlemi.`);
        }
        const queryBuilder = this.dataSource.getRepository(ProjeRaporlari).createQueryBuilder('raporlar')
            .leftJoinAndSelect('raporlar.Proje', 'Proje')
            .leftJoinAndSelect('raporlar.Donem', 'Donem')
            .where('Proje.TeknokentID = :TeknokentID', { TeknokentID: TeknokentID })
            .andWhere(
                new Brackets(qb =>
                    qb.where('Proje.ProjeUzmanKullaniciID = :id', { id: userId })
                        .orWhere('Proje.ProjeHakemKullaniciID = :id', { id: userId })
                )
            );

        /*  if (teknoKullanici.Rol === 'hakem') {
             queryBuilder.andWhere('Proje.ProjeHakemKullaniciID = :id', { id: userId });
         }
         if (teknoKullanici.Rol === 'uzman') {
             queryBuilder.andWhere('Proje.ProjeUzmanKullaniciID = :id', { id: userId });
         } */




        // Filtreleme işlemi
        Object.keys(filter).forEach((key) => {
            const validFilterFields = {
                'ProjeAdi': 'Proje.ProjeAdi',
                'DonemAdi': 'Donem.DonemAdi',
                'query': null // Genel arama için
            };

            if (key === 'query') {
                // Tüm alanlarda arama yap
                queryBuilder.andWhere(new Brackets(qb => {
                    qb.where('Proje.ProjeAdi LIKE :searchTerm')
                        .orWhere('Donem.DonemAdi LIKE :searchTerm')
                        .orWhere('CAST(raporlar.Durum AS VARCHAR) LIKE :searchTerm')
                }), { searchTerm: `%${filter[key]}%` });
            } else if (validFilterFields[key]) {
                queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
            }
        });

        // Sıralama işlemi
        const allowedSortFields = ['ProjeAdi', 'DonemAdi', 'RaporID'];
        if (!allowedSortFields.includes(sort)) {
            throw new BadRequestException(`Geçersiz sıralama değeri: ${sort}`);
        }
        // Sıralama işlemi
        if (sort === 'ProjeAdi') {
            queryBuilder.orderBy('Proje.ProjeAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        } else if (sort === 'DonemAdi') {
            queryBuilder.orderBy('Donem.DonemAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        } else {
            queryBuilder.orderBy(`raporlar.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        }

        queryBuilder.skip((page - 1) * limit).take(limit);

        const [raporlar, total] = await queryBuilder.getManyAndCount();
        return {
            data: raporlar,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }

    async aylikFaaliyetRaporlari(userId: number, query: any, firmaId: number) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'RaporID';
        const order = query.order || 'DESC';
        const filter = query.filter || {};

        if (isNaN(page) || isNaN(limit)) {
            throw new BadRequestException('Sayfa ve Sınır Numaralar olmalı');
        }

        if (!userId) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }



        const queryBuilder = this.dataSource.getRepository(ProjeRaporlari).createQueryBuilder('raporlar')
            .leftJoinAndSelect('raporlar.Proje', 'Proje')
            .leftJoinAndSelect('raporlar.HazirlayanKullanici', 'HazirlayanKullanici')
            .leftJoinAndSelect('Proje.ProjeUzmanKullanici', 'ProjeUzmanKullanici')
            .leftJoinAndSelect('Proje.ProjeHakemKullanici', 'ProjeHakemKullanici')
            .leftJoinAndSelect('Proje.Firma', 'Firma')
            .leftJoinAndSelect('raporlar.Donem', 'Donem')
            .where('Proje.FirmaID = :FirmaID', { FirmaID: firmaId });

        // Filtreleme işlemi
        Object.keys(filter).forEach((key) => {
            const validFilterFields = {
                'ProjeAdi': 'Proje.ProjeAdi',
                'DonemAdi': 'Donem.DonemAdi',
                'query': null // Genel arama için
            };

            if (key === 'query') {
                queryBuilder.andWhere(new Brackets(qb => {
                    qb.where('Proje.ProjeAdi LIKE :searchTerm')
                        .orWhere('Donem.DonemAdi LIKE :searchTerm')
                        .orWhere('CAST(raporlar.Durum AS VARCHAR) LIKE :searchTerm')
                }), { searchTerm: `%${filter[key]}%` });
            } else if (validFilterFields[key]) {
                queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
            }
        });

        // Sıralama işlemi
        const allowedSortFields = ['ProjeAdi', 'DonemAdi', 'RaporID'];
        if (!allowedSortFields.includes(sort)) {
            throw new BadRequestException(`Geçersiz sıralama değeri: ${sort}`);
        }
        // Sıralama işlemi
        if (sort === 'ProjeAdi') {
            queryBuilder.orderBy('Proje.ProjeAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        } else if (sort === 'DonemAdi') {
            queryBuilder.orderBy('Donem.DonemAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        } else {
            queryBuilder.orderBy(`raporlar.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        }

        queryBuilder.skip((page - 1) * limit).take(limit);

        const [raporlar, total] = await queryBuilder.getManyAndCount();
        return {
            data: raporlar,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }





    async getRaporlarTeknoAdmin(userId: number, query: any, IliskiID: number) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 20;
        const sort = query.sort || 'ProjeID';
        const order = query.order || 'DESC';
        const filter = query.filter || {};


        if (isNaN(page) || isNaN(limit)) {
            throw new BadRequestException('Sayfa ve Sınır Numaralar olmalı');
        }

        if (!userId) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }
        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        if (user.KullaniciTipi === 1) {
            throw new ForbiddenException(`Yetkisiz kullanıcı`);
        }
        if (user.KullaniciTipi !== 2) {
            if (!IliskiID) {
                throw new BadRequestException('Teknokent ID gereklidir');
            }
        }
        const teknokentKullanici = await this.dataSource.getRepository(Personel).findOne({
            where: { KullaniciID: userId, Tip: 3, IliskiID },
        });
        if (user.KullaniciTipi !== 2) {
            if (!teknokentKullanici) {
                throw new BadRequestException('Teknokent ID gereklidir');
            }
        }

        const sonDonemler = await this.dataSource.getRepository(Donem)
            .createQueryBuilder('donem')
            .where('donem.IsDeleted != 1')
            .orderBy('donem.DonemID', 'DESC')
            .limit(8)
            .getMany();
        const sonDonemIdler = sonDonemler.map(d => d.DonemID);

        const queryBuilder = this.dataSource.getRepository(Projeler).createQueryBuilder('projeler')
            .leftJoinAndSelect('projeler.Firma', 'Firma')
            .leftJoinAndSelect('projeler.ProjeUzmanKullanici', 'ProjeUzmanKullanici')
            .leftJoinAndSelect('projeler.Teknokent', 'Teknokent')
            .leftJoinAndSelect('projeler.ProjeRaporlari', 'projeRaporlari', 'projeRaporlari.DonemID IN (:...sonDonemIdler)', { sonDonemIdler })
            .leftJoinAndSelect('projeRaporlari.Donem', 'projeRaporlariDonem');
        if (user.KullaniciTipi === 2) {
            queryBuilder.where('projeler.TeknokentID = :TeknokentID', { TeknokentID: teknokentKullanici.IliskiID });
        }


        if (teknokentKullanici && teknokentKullanici.Rol !== 'owner') {
            queryBuilder.andWhere('projeler.ProjeUzmanKullaniciID = :ProjeUzmanKullaniciID', { ProjeUzmanKullaniciID: userId });
        }

        // Filtreler
        if (filter.sonDonem) {
            const sonDonem = sonDonemIdler[0];
            queryBuilder.andWhere(new Brackets(qb => {
                qb.where(`NOT EXISTS (
            SELECT 1 FROM ProjeRaporlari pr
            WHERE pr.ProjeID = projeler.ProjeID
            AND pr.DonemID = :sonDonem
        )`, { sonDonem })
                    .orWhere(`EXISTS (
            SELECT 1 FROM ProjeRaporlari pr2
            WHERE pr2.ProjeID = projeler.ProjeID
            AND pr2.DonemID = :sonDonem
            AND (pr2.Durum IS NULL OR pr2.Durum != 'Tamamlandı')
        )`, { sonDonem });
            }));
        }

        if (filter.son3Donem) {
            const son3DonemIdler = sonDonemIdler.slice(0, 3);
            queryBuilder.andWhere(new Brackets(qb => {
                qb.where(`EXISTS (
            SELECT 1 FROM Donem d
            WHERE d.DonemID IN (:...son3DonemIdler)
            AND (
                NOT EXISTS (
                    SELECT 1 FROM ProjeRaporlari pr
                    WHERE pr.ProjeID = projeler.ProjeID
                    AND pr.DonemID = d.DonemID
                )
                OR EXISTS (
                    SELECT 1 FROM ProjeRaporlari pr2
                    WHERE pr2.ProjeID = projeler.ProjeID
                    AND pr2.DonemID = d.DonemID
                    AND (pr2.Durum IS NULL OR pr2.Durum != 'Tamamlandı')
                )
            )
        )`, { son3DonemIdler });
            }));
        }


        Object.keys(filter).forEach((key) => {
            const validFilterFields = {
                'ProjeAdi': 'projeler.ProjeAdi',
                'Firma': 'Firma.FirmaAdi',
                'Teknokent': 'Teknokent.TeknokentAdi',
                'query': null,
                'eksikDonem': null,
                'tamDonem': null
            };
            if (key === 'uzman') {
                queryBuilder.andWhere('projeler.ProjeUzmanKullaniciID = :ProjeUzmanKullaniciID', { ProjeUzmanKullaniciID: filter[key] });
            } else if (key === 'query') {
                queryBuilder.andWhere(new Brackets(qb => {
                    qb.where('Firma.FirmaAdi LIKE :searchTerm')
                        .orWhere('ProjeUzmanKullanici.AdSoyad LIKE :searchTerm')
                        .orWhere('CAST(projeler.ProjeAdi AS VARCHAR) LIKE :searchTerm')
                }), { searchTerm: `%${filter[key]}%` });
            } else if (validFilterFields[key]) {
                queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
            }
        });

        // Sıralama işlemi
        const allowedSortFields = ['ProjeAdi', 'Firma', 'ProjeID', 'Teknokent'];
        if (!allowedSortFields.includes(sort)) {
            throw new BadRequestException(`Geçersiz sıralama değeri: ${sort}`);
        }
        if (sort === 'Firma') {
            queryBuilder.orderBy('Firma.FirmaAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        } else if (sort === 'Teknokent') {
            queryBuilder.orderBy('Teknokent.TeknokentAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        } else {
            queryBuilder.orderBy(`projeler.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        }

        queryBuilder.skip((page - 1) * limit).take(limit);

        const [projeler, total] = await queryBuilder.getManyAndCount();
        return {
            data: projeler,
            total,
            page,
            lastPage: Math.ceil(total / limit),
            sonDonemler: filter.sonDonem
                ? sonDonemler.slice(0, 1)
                : filter.son3Donem
                    ? sonDonemler.slice(0, 3)
                    : sonDonemler
        };
    }



    async getSeciliProjeRaporlari(userId: number, ProjeID: number, IliskiID: number | null) {
        if (!ProjeID) {
            throw new BadRequestException('Proje ID zorunludur');
        }

        if (!userId) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }
        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        if (user.KullaniciTipi === 1) {
            throw new ForbiddenException(`Yetkisiz kullanıcı`);
        }
        if (user.KullaniciTipi !== 2) {
            if (!IliskiID) {
                throw new BadRequestException('Teknokent ID gereklidir');
            }
        }
        const teknokentKullanici = await this.dataSource.getRepository(Personel).findOne({
            where: { KullaniciID: userId, Tip: 3, IliskiID },
        });
        if (user.KullaniciTipi !== 2) {
            if (!teknokentKullanici) {
                throw new BadRequestException('Teknokent ID gereklidir');
            }
        }

        const sonDonemler = await this.dataSource.getRepository(Donem)
            .createQueryBuilder('donem')
            .where('donem.IsDeleted != 1')
            .orderBy('donem.DonemID', 'DESC')
            .limit(12)
            .getMany();
        const sonDonemIdler = sonDonemler.map(d => d.DonemID);

        const queryBuilder = this.dataSource.getRepository(Projeler).createQueryBuilder('projeler')
            .where('projeler.ProjeID = :ProjeID', { ProjeID })
            .leftJoinAndSelect('projeler.ProjeRaporlari', 'projeRaporlari')
            .leftJoinAndSelect('projeRaporlari.Donem', 'projeRaporlariDonem');


        if (user.KullaniciTipi === 2) {
            queryBuilder.where('projeler.TeknokentID = :TeknokentID', { TeknokentID: teknokentKullanici.IliskiID });
        }


        if (teknokentKullanici && teknokentKullanici.Rol !== 'owner') {
            queryBuilder.andWhere('projeler.ProjeUzmanKullaniciID = :ProjeUzmanKullaniciID', { ProjeUzmanKullaniciID: userId });
        }

        const proje = await queryBuilder.getOne();
        if (!proje) {
            throw new BadRequestException(`Proje bulunamadı`);
        }

        return proje.ProjeRaporlari ? proje.ProjeRaporlari.filter(p => sonDonemIdler.includes(p.DonemID)) : [];

    }






    async getRaporItem(userId: number, ProjeID: number, DonemID: number, RaporID: number) {
        if (!RaporID && (!ProjeID || !DonemID)) {
            throw new BadRequestException('Proje ID ve Donem ID yada RaporID gereklidir');
        }
        if (!RaporID && !ProjeID && !DonemID) {
            throw new BadRequestException('Proje ID ve Donem ID yada Rapor ID gereklidir');
        }

        if (!userId) {
            throw new BadRequestException(`Kullanıcı ID gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }
        try {
            const queryBuilder = this.projeRaporRepository
                .createQueryBuilder('rapor')
                .leftJoinAndSelect('rapor.HazirlayanKullanici', 'HazirlayanKullanici');

            if (!RaporID) {
                queryBuilder.where('rapor.DonemID = :DonemID', { DonemID: DonemID });
                queryBuilder.andWhere('rapor.ProjeID = :ProjeID', { ProjeID: ProjeID });
            } else {
                if (RaporID === undefined) {
                    throw new BadRequestException(`RaporID geçerli bir değer olmalıdır`);
                }
                queryBuilder.where('rapor.RaporID = :RaporID', { RaporID: RaporID });
                queryBuilder.leftJoinAndSelect('rapor.Proje', 'proje');
                queryBuilder.leftJoinAndSelect('proje.Firma', 'firma');
                queryBuilder.leftJoinAndSelect('rapor.Donem', 'donem');
            }





            const projerapor = await queryBuilder.getOne();

            if (!projerapor) return null;

            if (user.KullaniciTipi === 1 && projerapor.HazirlayanKullaniciID !== userId) {
                throw new BadRequestException('Bu rapor size ait değil.');
            }

            if (user.KullaniciTipi === 3) {
                if (projerapor?.Proje?.ProjeHakemKullaniciID === user.id) {
                    await this.createOrGetSurecKaydi('aylik-faaliyet-hakem-onay', userId, projerapor.RaporID);
                } else if (projerapor?.Proje?.ProjeUzmanKullaniciID === user.id) {
                    await this.createOrGetSurecKaydi('aylik-faaliyet-on-onay', userId, projerapor.RaporID);
                }
            }
            return projerapor
        } catch (error) {
            throw error;
        }
    }

    private async createOrGetSurecKaydi(surecAnahtar: string, userId: number, itemId: number) {
        const kayitRepo = this.dataSource.getRepository(SurecKayitlari);

        const mevcutKayit = await kayitRepo.createQueryBuilder('kayit')
            .leftJoinAndSelect('kayit.Surec', 'surec')
            .where('surec.Anahtar = :anahtar', { anahtar: surecAnahtar })
            .andWhere('kayit.ItemID = :itemId', { itemId })
            .orderBy('kayit.ID', 'DESC')
            .getOne();

        if (mevcutKayit && mevcutKayit.KullaniciID === userId) {
            return;
        }
        if (mevcutKayit && mevcutKayit.KullaniciID !== userId && mevcutKayit.Durum !== 'Tamamlandı') {
            return;
        }

        const surec = await this.dataSource.getRepository(Surecler).findOne({
            where: { Anahtar: surecAnahtar, IsDeleted: false },
            relations: { Adimlar: true }
        });

        const adimId = surec?.Adimlar.find(a => a.SiraNo === 2)?.ID;
        if (!surec || !adimId) return;

        await kayitRepo.save({
            SurecID: surec.ID,
            AdimID: adimId,
            ItemID: itemId,
            KullaniciID: userId,
            Durum: 'İncelemede',
            Aciklama: '',
            BaslamaZamani: new Date(),
            BitirmeZamani: null
        });
    }


    async getSurecKayitlari(userId: number, RaporID: number, Surec: 'onOnay' | 'hakemOnay', Zaman: 'ay' | 'yil') {
        if (!RaporID && !Surec && !Zaman) {
            throw new BadRequestException('Rapor ID ve sürec adı ve zaman dilimi gereklidir');
        }

        if (!userId) {
            throw new BadRequestException(`Kullanıcı ID gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }
        try {
            const projerapor = await this.projeRaporRepository
                .createQueryBuilder('rapor')
                .leftJoinAndSelect('rapor.HazirlayanKullanici', 'HazirlayanKullanici')
                .where('rapor.RaporID = :RaporID', { RaporID: RaporID }).getOne();


            if (projerapor) {
                if (projerapor.HazirlayanKullaniciID !== userId && user.KullaniciTipi === 1) {
                    throw new BadRequestException(`Bu rapor size ait değil.`);
                }
            }

            const queryBuilder = this.dataSource.getRepository(SurecKayitlari).createQueryBuilder('kayit')
                .leftJoinAndSelect('kayit.Surec', 'surec')
                .where('surec.IsDeleted != :isDeleted', { isDeleted: true });

            if (Zaman === 'ay') {
                if (Surec === 'onOnay') {
                    queryBuilder.andWhere('surec.Anahtar = :anahtar', { anahtar: 'aylik-faaliyet-on-onay' });
                } else {
                    queryBuilder.andWhere('surec.Anahtar = :anahtar', { anahtar: 'aylik-faaliyet-hakem-onay' });
                }
            } else {
                {
                    if (Surec === 'onOnay') {
                        queryBuilder.andWhere('surec.Anahtar = :anahtar', { anahtar: 'yillik-faaliyet-on-onay' });
                    } else {
                        queryBuilder.andWhere('surec.Anahtar = :anahtar', { anahtar: 'yillik-faaliyet-hakem-onay' });
                    }
                }
            }
            queryBuilder.leftJoinAndSelect('kayit.Kullanici', 'kullanici');
            queryBuilder.leftJoinAndSelect('kayit.Adim', 'adim');
            queryBuilder.andWhere('kayit.ItemID = :itemid', { itemid: RaporID });


            const surecKayitlari = await queryBuilder.getMany();
            return surecKayitlari;
        } catch (error) {
            throw error;
        }
    }



    async sendNotificationToUser(Anahtar: string, userId: number,
        data: { DonemAdi: string, ProjeAdi: string, FirmaAdi: string, RaporID: string, Durum?: string, YonlendirmeURL?: string }): Promise<void> {
        const template = await this.dataSource.getRepository(Bildirimler)
            .findOne({ where: { Anahtar: Anahtar, IsDeleted: false } });
        if (!template) {
            throw new BadRequestException('Bildirim şablonu bulunamadı.');
        }
        if (!userId) {
            throw new BadRequestException('Bildirim gönderilecek kullanıcı bulunamadı. Lütfen destek talebi oluşturun.');
        }
        const user = await this.dataSource.getRepository(Kullanicilar).findOne({ where: { id: userId } });
        if (!user) {
            throw new BadRequestException('Bildirim gönderilecek kullanıcı bulunamadı. Lütfen destek talebi oluşturun.');
        }
        let body = template.Icerik;
        let subject = template.Baslik;
        let link = template.Link;
        if (!body || !subject || !link) {
            console.error('Bildirim şablonunun içeriği eksik.');
            return
        }

        for (const [key, value] of Object.entries(data)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            body = body.replace(regex, value || 'N/A');
            subject = subject.replace(regex, value || 'N/A');
            link = link.replace(regex, value || 'N/A');
        }
        const newNotification = await this.dataSource.getRepository(KullaniciBildirimleri).save({
            KullaniciID: user.id,
            BildirimID: template.BildirimID,
            Baslik: subject,
            Link: link,
            MobilLink: template.MobilLink,
            Icerik: body,
            Durum: 'Gönderildi',
        });

        // Kullanıcıya anlık bildirim gönder
        this.appGateway.sendNotificationToUser(user.id, newNotification);

        try {
            await this.mailService.sendEmailWithTemplate(
                Anahtar, // Şablon ismi
                {
                    KullaniciAdi: user.AdSoyad,
                    RaporID: data.RaporID,
                    ProjeAdi: data.ProjeAdi,
                    DonemAdi: data.DonemAdi,
                    FirmaAdi: data.FirmaAdi,
                    Durum: data.Durum,
                    YonlendirmeURL: data.YonlendirmeURL
                },
                user.Email
            );
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            console.log(error)
            throw new InternalServerErrorException('E-posta gönderme işlemi sırasında bir hata oluştu.');
        }
    }


    async onayUpload(userId: number, data: { RaporID: number, durum: string, surecAnahtar: string, aciklama?: string }) {
        const { RaporID, durum, surecAnahtar, aciklama } = data;
        try {
            const user = await this.validateUser(userId);
            if (!RaporID || !durum || !surecAnahtar) {
                throw new BadRequestException('Rapor ID, Süreç anahatarı ve durum zorunludur.');
            }
            if (durum === 'reddedildi' && !aciklama) {
                throw new BadRequestException('Açıklama alanı boş bırakılamaz');
            }
            const projeRaporu = await this.projeRaporRepository.findOne({
                where: { RaporID },
                relations: { Proje: { Firma: true }, Donem: true }
            });
            if (!projeRaporu) {
                throw new BadRequestException('Proje raporu bulunamadı.');
            }

            const kayitRepo = this.dataSource.getRepository(SurecKayitlari);

            const mevcutKayit = await kayitRepo.createQueryBuilder('kayit')
                .leftJoinAndSelect('kayit.Surec', 'surec')
                .where('surec.Anahtar = :anahtar', { anahtar: surecAnahtar })
                .andWhere('kayit.ItemID = :itemId', { itemId: RaporID })
                .orderBy('kayit.ID', 'DESC')
                .getOne();

            if (mevcutKayit && mevcutKayit.KullaniciID === userId) {
                if (mevcutKayit.Durum !== 'İncelemede') {
                    throw new BadRequestException(`Bu sürecin durumu daha önce ${mevcutKayit.Durum} olarak ayarlandı.`);
                }

                await kayitRepo.save({
                    ...mevcutKayit,
                    Aciklama: aciklama,
                    Durum: durum === 'reddedildi' ? 'Reddedildi' : 'Tamamlandı',
                    BitirmeZamani: new Date()
                });
                if (durum === 'onaylandi') {
                    await this.projeRaporRepository.save({ ...projeRaporu, OnOnay: true, Durum: 'Hazırlanıyor' })
                } else {
                    await this.projeRaporRepository.save({ ...projeRaporu, Durum: 'Hazırlanıyor' })
                }
            } else if (mevcutKayit && mevcutKayit.KullaniciID !== userId) {
                if (mevcutKayit.Durum !== 'Tamamlandı') {
                    throw new BadRequestException(`Bu süreç henüz onay için gönderilmemiş. Kullanıcı hazırlamaya devam ediyor.`);
                }
                const surec = await this.dataSource.getRepository(Surecler).findOne({
                    where: { Anahtar: surecAnahtar, IsDeleted: false },
                    relations: { Adimlar: true }
                });

                const adimId = surec?.Adimlar.find(a => a.SiraNo === 2)?.ID;
                if (!surec || !adimId) return;

                await kayitRepo.save({
                    SurecID: surec.ID,
                    AdimID: adimId,
                    ItemID: RaporID,
                    KullaniciID: userId,
                    Durum: 'Tamamlandı',
                    Aciklama: aciklama,
                    BaslamaZamani: new Date(),
                    BitirmeZamani: new Date()
                });
                if (durum === 'onaylandi') {
                    await this.projeRaporRepository.save({ ...projeRaporu, OnOnay: true, Durum: 'Hazırlanıyor' })
                } else {
                    await this.projeRaporRepository.save({ ...projeRaporu, Durum: 'Hazırlanıyor' })
                }
            }

            await this.sendNotificationToUser(
                projeRaporu.OnOnay ? 'hakem-onay-icin-sonuc-bildirimi' : 'on-onay-icin-sonuc-bildirimi',
                projeRaporu.HazirlayanKullaniciID,
                {
                    FirmaAdi: projeRaporu.Proje?.Firma?.FirmaAdi || '',
                    ProjeAdi: projeRaporu.Proje?.ProjeAdi || '',
                    DonemAdi: projeRaporu.Donem?.DonemAdi || '',
                    RaporID: projeRaporu.RaporID.toString() || '',
                    Durum: durum === 'onaylandi' ? 'Onaylandı' : 'Reddedildi',
                    YonlendirmeURL: `${process.env.FRONTEND_URL}/${projeRaporu.Proje?.FirmaID.toString()}/aylik-faaliyet-raporlari/edit/${projeRaporu.RaporID.toString()}`
                }
            );
            return await kayitRepo.createQueryBuilder('kayit')
                .leftJoinAndSelect('kayit.Surec', 'surec')
                .leftJoinAndSelect('kayit.Kullanici', 'kullanici')
                .leftJoinAndSelect('kayit.Adim', 'adim')
                .where('surec.Anahtar = :anahtar', { anahtar: surecAnahtar })
                .andWhere('kayit.ItemID = :itemId', { itemId: RaporID })
                .getMany();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Onay veya Revize işlemi sırasında hata.'
            );
        }
    }




    async upload(
        userId: number,
        data: CreateProjeRaporDto,
        personelList?: PersonelTableData[] | null,
        filePath?: string | null,
        isOrtagiList?: any
    ) {
        // Kullanıcı kontrolü
        const user = await this.validateUser(userId);

        // Veri doğrulama
        this.validateData(data);

        if ((data.SiraNo === 6 ? data.adim !== 'c' : !data.BelgesizIslem) && (!personelList?.length || personelList?.length < 1)) {
            throw new BadRequestException('Personel listesi boş olamaz');
        }

        try {
            let projeRaporu: ProjeRaporlari;

            if (data.RaporID && data.RaporID > 0) {
                if (data.BelgesizIslem) {
                    projeRaporu = await this.updateStatusReport(data, userId, data.BelgesizIslem);
                    if (!projeRaporu.HakemOnay && (projeRaporu.SurecSirasi === 5 || projeRaporu.SurecSirasi === 7)) {
                        const hedefKullaniciId = projeRaporu.OnOnay
                            ? projeRaporu.Proje?.ProjeHakemKullaniciID
                            : projeRaporu.Proje?.ProjeUzmanKullaniciID;

                        await this.sendNotificationToUser(
                            projeRaporu.OnOnay ? 'hakem-onay-icin-rapor-gonderildi' : 'on-onay-icin-rapor-gonderildi',
                            hedefKullaniciId,
                            {
                                FirmaAdi: projeRaporu.Proje?.Firma?.FirmaAdi || '',
                                ProjeAdi: projeRaporu.Proje?.ProjeAdi || '',
                                DonemAdi: projeRaporu.Donem?.DonemAdi || '',
                                RaporID: projeRaporu.RaporID.toString() || '',
                                YonlendirmeURL: `${process.env.FRONTEND_URL}/tekno-aylik-faaliyet-raporlari/detay/${projeRaporu.RaporID.toString()}`
                            }
                        );
                        const surec = await this.dataSource.getRepository(Surecler).findOne(
                            {
                                where: { Anahtar: projeRaporu.OnOnay ? 'aylik-faaliyet-hakem-onay' : 'aylik-faaliyet-on-onay', IsDeleted: false },
                                relations: { Adimlar: true }
                            });

                        const adimId = surec?.Adimlar.find(a => a.SiraNo === 1).ID ?? null;
                        if (surec && adimId) {
                            await this.dataSource.getRepository(SurecKayitlari).save({
                                SurecID: surec.ID,
                                AdimID: adimId,
                                ItemID: data.RaporID,
                                KullaniciID: userId,
                                Durum: 'Tamamlandı',
                                Aciklama: 'Ön Onaya gönderildi',
                                BaslamaZamani: new Date(),
                                BitirmeZamani: new Date()
                            });
                        } else {
                            throw new BadRequestException('Onay süreci başlatılamadı.');
                        }
                    } else if (!projeRaporu.HakemOnay && projeRaporu.SurecSirasi === 8) {
                        throw new BadRequestException('Hakem onay süreci tamamlanmamış.');
                    }

                } else {
                    projeRaporu = await this.updateExistingReport(data, userId, filePath);
                }

            } else {
                projeRaporu = await this.createNewReport(data, userId, filePath);
            }

            // Raporu kaydet
            const savedRapor = await this.projeRaporRepository.save(projeRaporu);
            // Sonra ilişkilerle birlikte getir
            const raporWithRelations = await this.getUpdatedReport(savedRapor.RaporID);
            const sorguprojeRaporu = raporWithRelations;


            let personeller = [];
            // personelList işlemlerini raporWithRelations ile yap
            if (personelList?.length > 0) {
                await this.handlePersonelOperations(personelList, sorguprojeRaporu, isOrtagiList);
                personeller = await this.personelServise.personellerIzinBilgisi(sorguprojeRaporu.Proje.FirmaID, sorguprojeRaporu.DonemID);
            }
            // Güncellenmiş raporu getir
            return {
                projeRaporu: sorguprojeRaporu,
                personeller
            };
        } catch (error) {
            console.log('upload', error)
            throw new BadRequestException(
                error.message || 'Proje raporu işlemi sırasında hata oluştu'
            );

        }
    }

    private async handlePersonelOperations(personelList: PersonelTableData[], savedRapor: ProjeRaporlari, isOrtagiList: any) {
        if (!personelList.length) return;

        try {
            const firma = await this.dataSource.getRepository(Firma).findOne({
                where: { FirmaID: savedRapor.Proje.FirmaID }
            });

            if (!firma) {
                throw new BadRequestException('Firma bilgileri bulunamadı');
            }

            const personeller = await this.dataSource.getRepository(Personel).find({
                where: { IliskiID: firma.FirmaID, Tip: 1 }
            });

            // isOrtagiList'i kontrol et
            const ortaklar = isOrtagiList && Object.keys(isOrtagiList).length > 0
                ? Object.keys(isOrtagiList).filter(tcNo => isOrtagiList[tcNo] === true)
                : [];

            for (const item of personelList) {
                let matchedPersonel = null;
                const isOrtak = ortaklar.includes(item.tcKimlikNo);
                // TC Kimlik No kontrolü (ilk 2 ve son 2 hane)
                if (!item.tcKimlikNo.includes('*')) {
                    matchedPersonel = personeller.find(p =>
                        p.TCNo.slice(0, 2) === item.tcKimlikNo.slice(0, 2) &&
                        p.TCNo.slice(-2) === item.tcKimlikNo.slice(-2)
                    );
                }

                // Ad Soyad kontrolü
                if (!matchedPersonel) {
                    const fullName = `${item.ad} ${item.soyAd}`.trim().toUpperCase();
                    matchedPersonel = personeller.find(p =>
                        p.AdSoyad.trim().toUpperCase() === fullName
                    );
                }

                if (matchedPersonel) {
                    const iseGirisTarihi = item.baslangicTarihi ? this.parseDate(item.baslangicTarihi) : null;

                    // Güncelleme verilerini hazırla
                    const updateData: any = {
                        SirketOrtagi: isOrtak // Ortak durumunu güncelle
                    };

                    // TC Kimlik No kontrolü
                    if (!item.tcKimlikNo.includes('*') && matchedPersonel.TCNo.includes('*')) {
                        updateData.TCNo = item.tcKimlikNo;
                    }

                    // Ad Soyad kontrolü
                    const yeniAdSoyad = `${item.ad} ${item.soyAd}`.trim();
                    if (matchedPersonel.AdSoyad.trim() !== yeniAdSoyad) {
                        updateData.AdSoyad = yeniAdSoyad;
                    }

                    // İşe başlama tarihi kontrolü
                    if (iseGirisTarihi) {
                        const mevcutTarih = this.parseDate(matchedPersonel.IseGirisTarihi);
                        if (iseGirisTarihi.getTime() !== mevcutTarih.getTime()) {
                            updateData.IseGirisTarihi = iseGirisTarihi;
                        }
                    }

                    // Güncelleme yap
                    await this.dataSource.getRepository(Personel).update(
                        { PersonelID: matchedPersonel.PersonelID },
                        updateData
                    );
                } else {
                    // Yeni personel ekleme işlemi
                    const iseGirisTarihi = item.baslangicTarihi ? this.parseDate(item.baslangicTarihi) : new Date();
                    if (!iseGirisTarihi) {
                        throw new BadRequestException(`Geçersiz tarih formatı: ${item.baslangicTarihi}`);
                    }

                    const yeniPersonel = this.dataSource.getRepository(Personel).create({
                        IliskiID: firma.FirmaID,
                        Tip: 1,
                        AdSoyad: `${item.ad} ${item.soyAd}`.trim(),
                        TCNo: item.tcKimlikNo,
                        IseGirisTarihi: iseGirisTarihi,
                        MesaiBaslangic: firma.MesaiBaslangic || '09:00',
                        MesaiBitis: firma.MesaiBitis || '18:00',
                        SirketOrtagi: isOrtak // Yeni personel eklerken ortak durumunu ayarla
                    });

                    await this.dataSource.getRepository(Personel).save(yeniPersonel);
                }
            }
        } catch (error) {
            console.error('Personel işlemleri hatası:', error);
            throw new BadRequestException('Personel işlemleri sırasında bir hata oluştu');
        }
    }

    // Tarih parse yardımcı metodu
    private parseDate(dateString: string): Date | null {
        try {
            if (!dateString) return null;

            // Farklı tarih formatlarını kontrol et
            let date = new Date(dateString);

            if (isNaN(date.getTime())) {
                // Eğer tarih geçersizse, farklı formatları dene
                const formats = [
                    'DD.MM.YYYY',
                    'DD-MM-YYYY',
                    'YYYY-MM-DD',
                    'DD/MM/YYYY'
                ];

                for (const format of formats) {
                    const parts = dateString.split(/[-/.]/);
                    if (parts.length === 3) {
                        if (format.startsWith('YYYY')) {
                            date = new Date(
                                parseInt(parts[0]),
                                parseInt(parts[1]) - 1,
                                parseInt(parts[2])
                            );
                        } else {
                            date = new Date(
                                parseInt(parts[2]),
                                parseInt(parts[1]) - 1,
                                parseInt(parts[0])
                            );
                        }

                        if (!isNaN(date.getTime())) {
                            return date;
                        }
                    }
                }
                return null;
            }

            return date;
        } catch (error) {
            console.error('Tarih parse hatası:', error);
            return null;
        }
    }


    private async validateUser(userId: number) {
        if (!userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException('Kullanıcı bulunamadı');
        }

        return user;
    }

    private validateData(data: { DonemID: number, ProjeID: number, SiraNo: number, adim?: string }) {

        if (!data.ProjeID || !data.SiraNo || !data.DonemID) {
            throw new BadRequestException('ProjeID, Dönem ID ve Sıra No zorunludur');
        }
        if (data.SiraNo === 6 && !data.adim) {
            throw new BadRequestException('ProjeID, Dönem ID ve Sıra No zorunludur');
        }
    }

    private async updateExistingReport(data: any, userId: number, filePath: string | null) {
        const projeRaporu = await this.projeRaporRepository.findOne({
            where: { RaporID: data.RaporID }
        });

        if (!projeRaporu) {
            throw new BadRequestException('Proje raporu bulunamadı');
        }

        // Eski dosyayı sil
        if (filePath) {
            await this.deleteOldFile(data.SiraNo, projeRaporu, data.adim);
        }


        // Rapor bilgilerini güncelle
        return this.updateReportFields(projeRaporu, data, userId, filePath, data.adim);
    }

    private async updateStatusReport(data: any, userId: number, BelgesizIslem: boolean) {
        const projeRaporu = await this.projeRaporRepository.findOne({
            where: { RaporID: data.RaporID },
            relations: {
                Proje: {
                    Firma: true
                },
                Donem: true
            }
        });

        if (!projeRaporu) {
            throw new BadRequestException('Proje raporu bulunamadı');
        }


        // Rapor bilgilerini güncelle
        projeRaporu.Durum = projeRaporu.HakemOnay ? 'Tamamlandı' : (projeRaporu.OnOnay && projeRaporu.MuafiyetRaporu) ? 'Hakem Onay Sürecinde' : ((projeRaporu.SurecSirasi === 4 && BelgesizIslem) || projeRaporu.SurecSirasi === 5) ? 'Ön Onay Sürecinde' : 'Hazırlanıyor';
        projeRaporu.SurecSirasi = projeRaporu.HakemOnay ? (!projeRaporu.MuafiyetRaporu ? 6 : 8) : (projeRaporu.OnOnay ? 7 : 5);
        return projeRaporu
    }

    private async createNewReport(data: any, userId: number, filePath: string) {
        const proje = await this.dataSource.getRepository(Projeler).findOne({
            where: { ProjeID: data.ProjeID }
        });

        if (!proje) {
            throw new BadRequestException('Proje bulunamadı');
        }
        const projeRaporu = new ProjeRaporlari();
        return this.updateReportFields(projeRaporu, { ...data, TeknokentID: proje.TeknokentID }, userId, filePath);
    }

    private async deleteOldFile(siraNo: number, projeRaporu: ProjeRaporlari, adim?: string) {
        const fileMap = {
            4: projeRaporu.MuhtasarVePrim,
            3: projeRaporu.SGKHizmet,
            2: projeRaporu.GunDetayliRapor,
            6: {
                'a': projeRaporu.OnayliSGKHizmet,
                'b': projeRaporu.OnayliMuhtasarVePrim,
                'c': projeRaporu.SGKTahakkuk,
                'd': projeRaporu.MuafiyetRaporu
            }
        };

        const oldFile = siraNo === 6 ? fileMap[siraNo][adim] : fileMap[siraNo];
        if (oldFile && fs.existsSync(oldFile)) {
            await fs.promises.unlink(oldFile);
        }
    }

    private updateReportFields(
        projeRaporu: ProjeRaporlari,
        data: any,
        userId: number,
        filePath: string | null,
        adim?: string,
    ) {
        projeRaporu.ProjeID = data.ProjeID;
        projeRaporu.DonemID = data.DonemID;
        projeRaporu.TeknokentID = data.TeknokentID;
        if (data.SiraNo > projeRaporu.SurecSirasi || !projeRaporu.RaporID) {
            projeRaporu.SurecSirasi = data.SiraNo;
        }
        projeRaporu.Durum = data.SiraNo === 8 ? 'Tamamlandı' : 'Hazırlanıyor';
        projeRaporu.HazirlayanKullaniciID = userId;


        const newTamamlananlar = projeRaporu.Tamamlananlar ? JSON.parse(projeRaporu.Tamamlananlar) : [] as number[];
        projeRaporu.Tamamlananlar = JSON.stringify([...newTamamlananlar.filter(i => i !== data.SiraNo), data.SiraNo]);

        const newHatalar = projeRaporu.Hatalar ? JSON.parse(projeRaporu.Hatalar) : [] as { siraNo: number, error: string }[];
        projeRaporu.Hatalar = JSON.stringify([...newHatalar.filter(i => i.siraNo !== data.SiraNo)]);

        const fileMap = {
            2: 'GunDetayliRapor',
            3: 'SGKHizmet',
            4: 'MuhtasarVePrim',
            6: {
                'a': 'OnayliSGKHizmet',
                'b': 'OnayliMuhtasarVePrim',
                'c': 'SGKTahakkuk',
                'd': 'MuafiyetRaporu'
            }
        };

        if (filePath && data.SiraNo === 6 ? fileMap[data.SiraNo][adim] : fileMap[data.SiraNo]) {
            projeRaporu[data.SiraNo === 6 ? fileMap[data.SiraNo][adim] : fileMap[data.SiraNo]] = filePath;
        }

        return projeRaporu;
    }


    private updateReportHatalar(
        projeRaporu: ProjeRaporlari,
        SiraNo: number,
        error: string,
    ) {
        const newTamamlananlar = projeRaporu.Tamamlananlar ? JSON.parse(projeRaporu.Tamamlananlar) : [] as number[];
        projeRaporu.Tamamlananlar = JSON.stringify([...newTamamlananlar.filter(i => i !== SiraNo)]);

        const newHatalar = projeRaporu.Hatalar ? JSON.parse(projeRaporu.Hatalar) : [] as { siraNo: number, error: string }[];
        projeRaporu.Hatalar = JSON.stringify([...newHatalar.filter(i => i.siraNo !== SiraNo), { siraNo: SiraNo, error: error }]);
        return projeRaporu;
    }



    private async getUpdatedReport(raporId: number) {
        const projeRaporu = await this.projeRaporRepository
            .createQueryBuilder('rapor')
            .leftJoinAndSelect('rapor.HazirlayanKullanici', 'HazirlayanKullanici')
            .leftJoinAndSelect('rapor.Proje', 'Proje')
            .where('rapor.RaporID = :raporId', { raporId })
            .getOne();


        return projeRaporu;
    }






    async getFile(filePath: string) {
        if (!filePath) {
            throw new BadRequestException('Dosya yolu gereklidir');
        }

        try {
            filePath = filePath.replace(/\\/g, '/');
            if (!fs.existsSync(filePath)) {
                throw new BadRequestException('Dosya bulunamadı');
            }

            // Dosyayı oku
            const fileBuffer = fs.readFileSync(filePath);

            // Dosya tipini belirle
            const mimeType = mime.lookup(filePath) || 'application/octet-stream';

            // Base64'e çevir
            const base64File = fileBuffer.toString('base64');

            return {
                success: true,
                data: {
                    content: base64File,
                    mimeType: mimeType,
                    fileName: path.basename(filePath)
                }
            };
        } catch (error) {
            throw new BadRequestException(error.message || 'Dosya okunurken bir hata oluştu');
        }
    }






    //pdf yi tek parça parse atmek için
    private async parsePDF(filePath: string): Promise<{ texts: string[], rawData: any }> {
        return new Promise((resolve, reject) => {
            const pdfParser = new PDFParser();

            pdfParser.on('pdfParser_dataError', errData => {
                reject(new BadRequestException('PDF işlenemedi: ' + errData.parserError));
            });

            pdfParser.on('pdfParser_dataReady', (pdfData) => {
                try {
                    // Tüm metinleri birleştir
                    const allTexts: string[] = [];

                    pdfData.Pages?.forEach((page: any) => {
                        page.Texts?.forEach((textItem: any) => {
                            textItem.R?.forEach((run: any) => {
                                if (run.T) {
                                    allTexts.push(decodeURIComponent(run.T));
                                }
                            });
                        });
                    });

                    resolve({
                        texts: allTexts,
                        rawData: pdfData
                    });
                } catch (parseError) {
                    reject(new BadRequestException('PDF veri çıkarma hatası'));
                }
            });

            pdfParser.loadPDF(filePath);
        });
    }
    //pdf yi sayfa sayfa parse atmek için
    private async parsePDFPages(filePath: string): Promise<{
        pageCount: number;
        pages: {
            page: number;
            texts: { str: string; x: number; y: number }[];
        }[];
    }> {
        try {
            return new Promise((resolve, reject) => {
                const pdfParser = new PDFParser();

                pdfParser.on('pdfParser_dataError', errData => {
                    reject(new BadRequestException('PDF işlenemedi: ' + errData.parserError));
                });

                pdfParser.on('pdfParser_dataReady', (pdfData) => {
                    const pages = pdfData?.Pages;

                    if (!pages || pages.length === 0) {
                        reject(new BadRequestException('PDF sayfaları bulunamadı.'));
                        return;
                    }

                    const allPages = pages.map((page, index) => {
                        const pageTexts = page.Texts?.map(t => ({
                            str: decodeURIComponent(t.R[0].T),
                            x: t.x,
                            y: t.y
                        })) || [];

                        return {
                            page: index + 1,
                            texts: pageTexts
                        };
                    });

                    resolve({
                        pageCount: pages.length,
                        pages: allPages
                    });
                });

                pdfParser.loadPDF(filePath);
            });
        } catch (error) {
            console.log(error)
        }
    }







    async getFileMobil(
        userId: number,
        raporID: number,
        belgeAdi: string
    ) {
        try {
            const user = await this.validateUser(userId);

            const projeRaporu = await this.projeRaporRepository
                .createQueryBuilder('rapor')
                .leftJoinAndSelect('rapor.HazirlayanKullanici', 'HazirlayanKullanici')
                .leftJoinAndSelect('rapor.Donem', 'Donem')
                .leftJoinAndSelect('rapor.Proje', 'Proje')
                .where('rapor.RaporID = :raporId', { raporId: raporID })
                .getOne();


            if (!projeRaporu) {
                throw new BadRequestException('Rapor bulunamadı.');
            }

            let pdfDataAnaliz = null;
            if (belgeAdi === 'GunDetayliRapor') {
                pdfDataAnaliz = await this.parsePDF(projeRaporu.GunDetayliRapor);
            }
            if (belgeAdi === 'SGKHizmet') {
                pdfDataAnaliz = await this.parsePDF(projeRaporu.SGKHizmet);
            }

            if (belgeAdi === 'MuhtasarVePrim') {
                pdfDataAnaliz = await this.getPdfBuffer(projeRaporu.MuhtasarVePrim);
            }



            if (!pdfDataAnaliz) {
                throw new BadRequestException('Dosya okunamadı.');
            }

            if (belgeAdi === 'GunDetayliRapor') {
                // 1. Gün Detaylı Rapor PDF'ini analiz et
                const gunDetayliRapor: any = await this.analizService.gunDetayliRaporAnaliz(pdfDataAnaliz.texts, projeRaporu.Donem, projeRaporu.Proje.FirmaID, false);
                if (gunDetayliRapor.error) {
                    return { ...gunDetayliRapor, belge: belgeAdi }
                }
                return gunDetayliRapor;
            }

            if (belgeAdi === 'SGKHizmet') {
                // 1. Gün Detaylı Rapor PDF'ini analiz et
                const pdfDataAnalizGunDetay = await this.parsePDF(projeRaporu.GunDetayliRapor);
                let gunDetayliRapor: any = await this.analizService.gunDetayliRaporAnaliz(pdfDataAnalizGunDetay.texts, projeRaporu.Donem, projeRaporu.Proje.FirmaID, false);
                if ('error' in gunDetayliRapor) {
                    return await this.returnWithError(projeRaporu, gunDetayliRapor.error, 2, 'GunDetayliRapor');
                }
                // 2. SGK Hizmet PDF'ini analiz et
                const sgkHizmet: any = await this.analizService.sgkHizmet(pdfDataAnaliz.texts, projeRaporu.Donem, projeRaporu.Proje.FirmaID, gunDetayliRapor, false);
                if ('error' in sgkHizmet || ('farklilar' in sgkHizmet && sgkHizmet.farklilar.length > 0)) {
                    return await this.returnWithError(projeRaporu, 'error' in sgkHizmet ? sgkHizmet.error : 'Personel listesinde uyuşmazlıklar tespit edildi', 3, 'SGKHizmet');
                }
                return { sgkHizmet, gunDetayliRapor };
            }

            if (belgeAdi === 'MuhtasarVePrim') {
                // 1. Gün Detaylı Rapor PDF'ini analiz et
                const pdfDataAnalizGunDetay = await this.parsePDF(projeRaporu.GunDetayliRapor);
                const gunDetayliRapor: any = await this.analizService.gunDetayliRaporAnaliz(pdfDataAnalizGunDetay.texts, projeRaporu.Donem, projeRaporu.Proje.FirmaID, false);
                if ('error' in gunDetayliRapor) {
                    return await this.returnWithError(projeRaporu, gunDetayliRapor.error, 2, 'GunDetayliRapor');
                }

                // 2. SGK Hizmet PDF'ini analiz et
                const sgkParsed = await this.parsePDF(projeRaporu.SGKHizmet);
                const sgkHizmet = await this.analizService.sgkHizmet(sgkParsed.texts, projeRaporu.Donem, projeRaporu.Proje.FirmaID, gunDetayliRapor, false);
                if ('error' in sgkHizmet || ('farklilar' in sgkHizmet && sgkHizmet.farklilar.length > 0)) {
                    return await this.returnWithError(projeRaporu, 'error' in sgkHizmet ? sgkHizmet.error : 'Personel listesinde uyuşmazlıklar tespit edildi', 3, 'SGKHizmet');
                }

                // 3. Muhtasar Ve Prim PDF'ini analiz et
                const muhtasarParsed = await this.parseBufferToPages(pdfDataAnaliz);
                const muhtasar = await this.analizService.muhtasarVePrim(muhtasarParsed, projeRaporu.Donem, projeRaporu.Proje.FirmaID, sgkHizmet.geciciListe ?? [], true);
                if ('error' in muhtasar || ('personelListesi' in muhtasar && 'farklilar' in muhtasar.personelListesi && muhtasar.personelListesi.farklilar.length > 0)) {
                    const sonuc = await this.returnWithError(projeRaporu, 'error' in muhtasar ? muhtasar.error : 'Personel listesinde uyuşmazlıklar tespit edildi', 4, 'MuhtasarVePrim');
                    return { ...sonuc, muhtasar }
                }

                return { sgkHizmet, gunDetayliRapor, muhtasar };
            }




        } catch (error) {
            console.log('getFileMobil', error)
            throw new BadRequestException(
                error.message || 'Proje raporu çekme işlemi sırasında hata oluştu'
            );
        }

    }




    async newupload(
        userId: number,
        data: CreateProjeRaporDto,
        firmaID: number,
        filePath?: string | null,
        isOrtagiList?: any
    ) {
        try {
            const user = await this.validateUser(userId);
            this.validateData(data);

            const buffer = filePath ? await this.getPdfBuffer(filePath) : null;
            const projeRaporu = await this.getOrCreateProjeRaporu(data);

            const seciliDonem = await this.getDonem(projeRaporu ?? null, data);

            switch (data.belgeAdi) {
                case 'GunDetayliRapor':
                    return await this.handleGunDetayliRapor(buffer, data, userId, filePath, projeRaporu ?? null, seciliDonem);
                case 'SGKHizmet':
                    return await this.handleSGKHizmet(buffer, data, userId, filePath, projeRaporu, seciliDonem);
                case 'MuhtasarVePrim':
                    return await this.handleMuhtasarVePrim(buffer, data, userId, filePath, projeRaporu, seciliDonem, isOrtagiList);
                case 'OnOnay':
                    return await this.handleOnOnay(data, userId, projeRaporu);
                case 'OnayliSGKHizmet':
                    return await this.handleOnayliSGKHizmet(buffer, data, userId, filePath, projeRaporu, seciliDonem);
                case 'OnayliMuhtasarVePrim':
                    return await this.handleOnayliMuhtasarVePrim(buffer, data, userId, filePath, projeRaporu, seciliDonem, isOrtagiList);
                default:
                    throw new BadRequestException('Geçersiz belge adı.');
            }
        } catch (error) {
            console.error('upload error', error);
            throw new BadRequestException(error.message || 'Proje raporu işlemi sırasında hata oluştu');
        }
    }


    private async getPdfBuffer(filePath?: string | null): Promise<Buffer> {
        if (!filePath) throw new BadRequestException('PDF yolu belirtilmedi.');

        const result = await this.getFile(filePath);
        if (!result || result.data?.mimeType !== 'application/pdf') {
            throw new BadRequestException('PDF dosyası geçersiz.');
        }

        if (!result.data?.content) {
            throw new BadRequestException('PDF içeriği bulunamadı.');
        }

        return Buffer.from(result.data.content, 'base64');
    }



    private async getOrCreateProjeRaporu(data: CreateProjeRaporDto): Promise<ProjeRaporlari | null> {
        if (data.RaporID && data.RaporID > 0) {
            return this.projeRaporRepository.findOne({
                where: { RaporID: data.RaporID },
                relations: ['HazirlayanKullanici', 'Donem', 'Proje'],
            });
        } else {
            return await this.projeRaporRepository.findOne({
                where: {
                    ProjeID: data.ProjeID,
                    DonemID: data.DonemID,
                },
                relations: ['HazirlayanKullanici', 'Donem', 'Proje'],
            });
        }
    }


    private async getDonem(projeRaporu: ProjeRaporlari | null, data: CreateProjeRaporDto): Promise<Donem> {
        if (projeRaporu?.Donem) return projeRaporu.Donem;
        const donem = await this.dataSource.getRepository(Donem).findOne({ where: { DonemID: data.DonemID } });
        if (!donem) throw new BadRequestException('Dönem bulunamadı');
        return donem;
    }



    private async handleGunDetayliRapor(
        buffer: Buffer,
        data: CreateProjeRaporDto,
        userId: number,
        filePath: string | null,
        projeRaporu: ProjeRaporlari | null,
        seciliDonem: Donem
    ) {
        if (!buffer) {
            return { error: 'PDF içeriği alınamadı', belge: 'GunDetayliRapor' };
        }
        const FirmaID = projeRaporu?.Proje?.FirmaID ?? null;
        if (projeRaporu && !FirmaID) {
            return { error: 'Firma ID bulunamadı', belge: 'GunDetayliRapor' };
        }

        if (projeRaporu?.SGKHizmet) {
            // Ön onay kontrolü
            if (projeRaporu.OnOnay) {
                return { error: 'Ön Onay işlemi tamamlanmış, değişiklik yapılamaz', belge: 'GunDetayliRapor' };
            }

            // PDF parse & analiz
            const gunDetayliRapor = await this.analyzeGunDetayliRapor(buffer, seciliDonem, FirmaID, true);
            if ('error' in gunDetayliRapor) {
                return await this.returnWithError(projeRaporu, gunDetayliRapor.error, 2, 'GunDetayliRapor');
            }

            // SGK PDF tekrar analiz et
            const sgkHizmet = await this.analyzeSGKHizmet(projeRaporu.SGKHizmet, seciliDonem, gunDetayliRapor, FirmaID, false);
            if ('error' in sgkHizmet) {
                return await this.returnWithError(projeRaporu, sgkHizmet.error, 3, 'SGKHizmet');
            }

            // Raporu güncelle ve dön
            const updatedRapor = await this.updateExistingReport(data, userId, filePath);
            const savedRapor = await this.saveAndFetchReport(updatedRapor.RaporID);
            return { personelListesi: gunDetayliRapor, projeRaporu: savedRapor };
        }

        // Yeni kayıt
        const gunDetayliRapor = await this.analyzeGunDetayliRapor(buffer, seciliDonem, FirmaID, true);
        if ('error' in gunDetayliRapor) {
            projeRaporu = this.updateReportHatalar(projeRaporu, data.SiraNo, gunDetayliRapor.error);
            const saved = await this.saveAndFetchReport((await this.projeRaporRepository.save(projeRaporu)).RaporID);
            return { ...gunDetayliRapor, belge: 'GunDetayliRapor', projeRaporu: saved };
        }

        const newRapor = await this.createNewReport(data, userId, filePath);
        const savedRapor = await this.saveAndFetchReport((await this.projeRaporRepository.save(newRapor)).RaporID);
        return { personelListesi: gunDetayliRapor, projeRaporu: savedRapor };
    }



    private async analyzeGunDetayliRapor(buffer: Buffer, donem: Donem, FirmaID: number, personelGuncelle: boolean) {
        const tmpFile = tmp.fileSync({ postfix: '.pdf' });
        fs.writeFileSync(tmpFile.name, buffer);
        const parsed = await this.parsePDF(tmpFile.name);
        return this.analizService.gunDetayliRaporAnaliz(parsed.texts, donem, FirmaID, personelGuncelle);
    }


    private async analyzeSGKHizmet(
        sgkFilePath: string,
        donem: Donem,
        gunDetayliRapor: any,
        FirmaID: number,
        personelGuncelle: boolean
    ) {
        const parsed = await this.parsePDF(sgkFilePath);
        return this.analizService.sgkHizmet(parsed.texts, donem, FirmaID, gunDetayliRapor, personelGuncelle);
    }


    private async returnWithError(
        projeRaporu: ProjeRaporlari,
        errorMsg: string,
        siraNo: number,
        belgeAdi: string
    ) {
        projeRaporu = this.updateReportHatalar(projeRaporu, siraNo, errorMsg);
        const saved = await this.saveAndFetchReport((await this.projeRaporRepository.save(projeRaporu)).RaporID);
        return { error: errorMsg, belge: belgeAdi, projeRaporu: saved };
    }


    private async saveAndFetchReport(raporId: number) {
        return this.getUpdatedReport(raporId);
    }


    private async handleSGKHizmet(
        buffer: Buffer,
        data: CreateProjeRaporDto,
        userId: number,
        filePath: string | null,
        projeRaporu: ProjeRaporlari | null,
        seciliDonem: Donem
    ) {
        if (!projeRaporu) {
            return { error: 'Proje raporu bulunamadı', belge: 'SGKHizmet' };
        }

        if (!buffer) {
            return { error: 'PDF içeriği alınamadı', belge: 'SGKHizmet' };
        }
        const FirmaID = projeRaporu.Proje?.FirmaID ?? null;
        if (!FirmaID) {
            return { error: 'Firma ID bulunamadı', belge: 'SGKHizmet' };
        }

        const sgkParsed = await this.parseBufferToText(buffer);

        // Eğer önceden rapor ve Muhtasar yüklenmişse
        if (projeRaporu?.MuhtasarVePrim) {
            if (projeRaporu.OnOnay) {
                return { error: 'Ön Onay işlemi tamamlanmış, değişiklik yapılamaz', belge: 'SGKHizmet' };
            }

            const gunDetayliRapor = await this.analyzeGunDetayliFromFile(projeRaporu.GunDetayliRapor, seciliDonem, FirmaID, false);
            if ('error' in gunDetayliRapor) {
                return await this.returnWithError(projeRaporu, gunDetayliRapor.error, 2, 'GunDetayliRapor');
            }

            const sgkHizmet = await this.analizService.sgkHizmet(sgkParsed.texts, seciliDonem, FirmaID, gunDetayliRapor, true);
            if ('error' in sgkHizmet || ('farklilar' in sgkHizmet && sgkHizmet.farklilar.length > 0)) {
                return await this.returnWithError(projeRaporu, 'error' in sgkHizmet ? sgkHizmet.error : 'Personel listesinde uyuşmazlıklar tespit edildi', 3, 'SGKHizmet');
            }

            const muhtasarParsed = await this.parsePDFPages(projeRaporu.MuhtasarVePrim);
            const muhtasar = await this.analizService.muhtasarVePrim(muhtasarParsed, seciliDonem, FirmaID, sgkHizmet.geciciListe ?? [], false);
            if ('error' in muhtasar || ('personelListesi' in muhtasar && 'farklilar' in muhtasar.personelListesi && muhtasar.personelListesi.farklilar.length > 0)) {
                return await this.returnWithError(projeRaporu, 'error' in muhtasar ? muhtasar.error : 'Personel listesinde uyuşmazlıklar tespit edildi', 4, 'MuhtasarVePrim');
            }

            const updated = await this.updateExistingReport(data, userId, filePath);
            const saved = await this.saveAndFetchReport((await this.projeRaporRepository.save(updated)).RaporID);
            return { personelListesi: sgkHizmet, projeRaporu: saved };
        }

        // Yeni kayıt
        const gunDetayliRapor = await this.analyzeGunDetayliFromFile(projeRaporu.GunDetayliRapor, seciliDonem, FirmaID, false);
        if ('error' in gunDetayliRapor) {
            return await this.returnWithError(projeRaporu, gunDetayliRapor.error, 2, 'GunDetayliRapor');
        }

        const sgkHizmet = await this.analizService.sgkHizmet(sgkParsed.texts, seciliDonem, FirmaID, gunDetayliRapor, true);
        if ('error' in sgkHizmet || ('farklilar' in sgkHizmet && sgkHizmet.farklilar.length > 0)) {
            return await this.returnWithError(projeRaporu, 'error' in sgkHizmet ? sgkHizmet.error : 'Personel listesinde uyuşmazlıklar tespit edildi', 3, 'SGKHizmet');
        }

        const updated = await this.updateExistingReport(data, userId, filePath);
        const saved = await this.saveAndFetchReport((await this.projeRaporRepository.save(updated)).RaporID);
        return { personelListesi: sgkHizmet, projeRaporu: saved };
    }


    private async parseBufferToText(buffer: Buffer) {
        const tmpFile = tmp.fileSync({ postfix: '.pdf' });
        fs.writeFileSync(tmpFile.name, buffer);
        return await this.parsePDF(tmpFile.name);
    }

    private async analyzeGunDetayliFromFile(filePath: string, donem: Donem, FirmaID: number, personelGuncelle: boolean) {
        const parsed = await this.parsePDF(filePath);
        return await this.analizService.gunDetayliRaporAnaliz(parsed.texts, donem, FirmaID, personelGuncelle);
    }



    private async handleMuhtasarVePrim(
        buffer: Buffer,
        data: CreateProjeRaporDto,
        userId: number,
        filePath: string | null,
        projeRaporu: ProjeRaporlari | null,
        seciliDonem: Donem,
        isOrtagiList?: any
    ) {
        if (!projeRaporu) {
            return { error: 'Proje raporu bulunamadı', belge: 'MuhtasarVePrim' };
        }

        if (projeRaporu.OnOnay) {
            return { error: 'Ön Onay işlemi tamamlanmış, değişiklik yapılamaz', belge: 'MuhtasarVePrim' };
        }

        if (!buffer) {
            return { error: 'PDF içeriği alınamadı', belge: 'MuhtasarVePrim' };
        }
        const FirmaID = projeRaporu.Proje?.FirmaID ?? null;
        if (!FirmaID) {
            return { error: 'Firma ID bulunamadı', belge: 'MuhtasarVePrim' };
        }

        // 1. Gün Detaylı Raporu analiz et
        const gunDetayliRapor = await this.analyzeGunDetayliFromFile(projeRaporu.GunDetayliRapor, seciliDonem, FirmaID, false);
        if ('error' in gunDetayliRapor) {
            return await this.returnWithError(projeRaporu, gunDetayliRapor.error, 2, 'GunDetayliRapor');
        }

        // 2. SGK Hizmet PDF'ini analiz et
        const sgkParsed = await this.parsePDF(projeRaporu.SGKHizmet);
        const sgkHizmet = await this.analizService.sgkHizmet(sgkParsed.texts, seciliDonem, FirmaID, gunDetayliRapor, false);
        if ('error' in sgkHizmet || ('farklilar' in sgkHizmet && sgkHizmet.farklilar.length > 0)) {
            return await this.returnWithError(projeRaporu, 'error' in sgkHizmet ? sgkHizmet.error : 'Personel listesinde uyuşmazlıklar tespit edildi', 3, 'SGKHizmet');
        }

        // 3. Muhtasar Ve Prim PDF'ini analiz et
        const muhtasarParsed = await this.parseBufferToPages(buffer);
        const muhtasar = await this.analizService.muhtasarVePrim(muhtasarParsed, seciliDonem, FirmaID, sgkHizmet.geciciListe ?? [], true, isOrtagiList);
        if ('error' in muhtasar || ('personelListesi' in muhtasar && 'farklilar' in muhtasar.personelListesi && muhtasar.personelListesi.farklilar.length > 0)) {
            const sonuc = await this.returnWithError(projeRaporu, 'error' in muhtasar ? muhtasar.error : 'Personel listesinde uyuşmazlıklar tespit edildi', 4, 'MuhtasarVePrim');
            return { ...sonuc, muhtasar }
        }

        const updated = await this.updateExistingReport(data, userId, filePath);
        const saved = await this.saveAndFetchReport((await this.projeRaporRepository.save(updated)).RaporID);
        return { personelListesi: muhtasar, projeRaporu: saved };
    }


    private async parseBufferToPages(buffer: Buffer) {
        const tmpFile = tmp.fileSync({ postfix: '.pdf' });
        fs.writeFileSync(tmpFile.name, buffer);
        return await this.parsePDFPages(tmpFile.name);
    }



    private async handleOnOnay(
        data: CreateProjeRaporDto,
        userId: number,
        projeRaporu: ProjeRaporlari
    ) {
        if (!projeRaporu) {
            return { error: 'Proje raporu bulunamadı', belge: 'OnOnay' };
        }

        if (projeRaporu.OnOnay || projeRaporu.HakemOnay) {
            return { error: 'Ön Onay işlemi tamamlanmış, değişiklik yapılamaz', belge: 'OnOnay' };
        }
        try {
            projeRaporu = await this.updateStatusReport1(projeRaporu, data.belgeAdi);

            const hedefKullaniciId = projeRaporu.Proje?.ProjeUzmanKullaniciID;

            await this.sendNotificationToUser(
                'on-onay-icin-rapor-gonderildi',
                hedefKullaniciId,
                {
                    FirmaAdi: projeRaporu.Proje?.Firma?.FirmaAdi || '',
                    ProjeAdi: projeRaporu.Proje?.ProjeAdi || '',
                    DonemAdi: projeRaporu.Donem?.DonemAdi || '',
                    RaporID: projeRaporu.RaporID.toString() || '',
                    YonlendirmeURL: `${process.env.FRONTEND_URL}/tekno-aylik-faaliyet-raporlari/detay/${projeRaporu.RaporID.toString()}`
                }
            );
            const surec = await this.dataSource.getRepository(Surecler).findOne(
                {
                    where: { Anahtar: 'aylik-faaliyet-on-onay', IsDeleted: false },
                    relations: { Adimlar: true }
                });

            const adimId = surec?.Adimlar.find(a => a.SiraNo === 1).ID ?? null;
            if (surec && adimId) {
                await this.dataSource.getRepository(SurecKayitlari).save({
                    SurecID: surec.ID,
                    AdimID: adimId,
                    ItemID: data.RaporID,
                    KullaniciID: userId,
                    Durum: 'Tamamlandı',
                    Aciklama: 'Ön Onaya gönderildi',
                    BaslamaZamani: new Date(),
                    BitirmeZamani: new Date()
                });
            } else {
                throw new BadRequestException('Onay süreci başlatılamadı.');
            }


            const saved = await this.saveAndFetchReport((await this.projeRaporRepository.save(projeRaporu)).RaporID);
            return { personelListesi: { farklilar: [] }, projeRaporu: saved };

        } catch (error) {
            throw error
        }
    }

    private async handleHakemOnay(
        data: CreateProjeRaporDto,
        userId: number,
        projeRaporu: ProjeRaporlari,
        seciliDonem: Donem,
    ) {
        if (!projeRaporu) {
            return { error: 'Proje raporu bulunamadı', belge: 'OnOnay' };
        }

        if (projeRaporu.OnOnay) {
            return { error: 'Ön Onay işlemi tamamlanmış, değişiklik yapılamaz', belge: 'OnOnay' };
        }
        try {
            projeRaporu = await this.updateStatusReport1(projeRaporu, data.belgeAdi);



            if (!projeRaporu.HakemOnay && (projeRaporu.SurecSirasi === 5 || projeRaporu.SurecSirasi === 7)) {
                const hedefKullaniciId = projeRaporu.OnOnay
                    ? projeRaporu.Proje?.ProjeHakemKullaniciID
                    : projeRaporu.Proje?.ProjeUzmanKullaniciID;

                await this.sendNotificationToUser(
                    projeRaporu.OnOnay ? 'hakem-onay-icin-rapor-gonderildi' : 'on-onay-icin-rapor-gonderildi',
                    hedefKullaniciId,
                    {
                        FirmaAdi: projeRaporu.Proje?.Firma?.FirmaAdi || '',
                        ProjeAdi: projeRaporu.Proje?.ProjeAdi || '',
                        DonemAdi: projeRaporu.Donem?.DonemAdi || '',
                        RaporID: projeRaporu.RaporID.toString() || '',
                        YonlendirmeURL: `${process.env.FRONTEND_URL}/tekno-aylik-faaliyet-raporlari/detay/${projeRaporu.RaporID.toString()}`
                    }
                );
                const surec = await this.dataSource.getRepository(Surecler).findOne(
                    {
                        where: { Anahtar: projeRaporu.OnOnay ? 'aylik-faaliyet-hakem-onay' : 'aylik-faaliyet-on-onay', IsDeleted: false },
                        relations: { Adimlar: true }
                    });

                const adimId = surec?.Adimlar.find(a => a.SiraNo === 1).ID ?? null;
                if (surec && adimId) {
                    await this.dataSource.getRepository(SurecKayitlari).save({
                        SurecID: surec.ID,
                        AdimID: adimId,
                        ItemID: data.RaporID,
                        KullaniciID: userId,
                        Durum: 'Tamamlandı',
                        Aciklama: 'Ön Onaya gönderildi',
                        BaslamaZamani: new Date(),
                        BitirmeZamani: new Date()
                    });
                } else {
                    throw new BadRequestException('Onay süreci başlatılamadı.');
                }
            } else if (!projeRaporu.HakemOnay && projeRaporu.SurecSirasi === 8) {
                throw new BadRequestException('Hakem onay süreci tamamlanmamış.');
            }
        } catch (error) {
            throw error
        }
    }


    private async updateStatusReport1(projeRaporu: ProjeRaporlari, belgeAdi: string) {
        if (!projeRaporu) {
            throw new BadRequestException('Proje raporu bulunamadı');
        }


        // Rapor bilgilerini güncelle
        projeRaporu.Durum = projeRaporu.HakemOnay ? 'Tamamlandı' : (projeRaporu.OnOnay && projeRaporu.MuafiyetRaporu && belgeAdi === 'HakemOnay') ? 'Hakem Onay Sürecinde' : (belgeAdi === 'OnOnay') ? 'Ön Onay Sürecinde' : 'Hazırlanıyor';
        projeRaporu.SurecSirasi = projeRaporu.HakemOnay ? (!projeRaporu.MuafiyetRaporu ? 6 : 8) : (projeRaporu.OnOnay ? 7 : 5);
        return projeRaporu
    }


    private async handleOnayliSGKHizmet(
        buffer: Buffer,
        data: CreateProjeRaporDto,
        userId: number,
        filePath: string | null,
        projeRaporu: ProjeRaporlari | null,
        seciliDonem: Donem
    ) {
        if (!projeRaporu) {
            return { error: 'Proje raporu bulunamadı', belge: 'OnayliSGKHizmet' };
        }

        if (!buffer) {
            return { error: 'PDF içeriği alınamadı', belge: 'OnayliSGKHizmet' };
        }
        const FirmaID = projeRaporu.Proje?.FirmaID ?? null;
        if (!FirmaID) {
            return { error: 'Firma ID bulunamadı', belge: 'OnayliSGKHizmet' };
        }

        const sgkParsed = await this.parseBufferToText(buffer);

        // Eğer önceden rapor ve Muhtasar yüklenmişse
        if (projeRaporu?.MuhtasarVePrim) {
            if (projeRaporu.HakemOnay) {
                return { error: 'Hakem Onay işlemi tamamlanmış, değişiklik yapılamaz', belge: 'OnayliSGKHizmet' };
            }

            const sgkHizmet = await this.analizService.onayliSgkHizmet(sgkParsed.texts, seciliDonem, FirmaID, true);
            if ('error' in sgkHizmet) {
                return await this.returnWithError(projeRaporu, sgkHizmet.error, 6, 'OnayliSGKHizmet');
            }

            const muhtasarParsed = await this.parsePDFPages(projeRaporu.MuhtasarVePrim);
            const muhtasar = await this.analizService.muhtasarVePrim(muhtasarParsed, seciliDonem, FirmaID, sgkHizmet.geciciListe ?? [], false);
            if ('error' in muhtasar || ('personelListesi' in muhtasar && 'farklilar' in muhtasar.personelListesi && muhtasar.personelListesi.farklilar.length > 0)) {
                return await this.returnWithError(projeRaporu, 'error' in muhtasar ? muhtasar.error : 'Personel listesinde uyuşmazlıklar tespit edildi', 6, 'OnayliMuhtasarVePrim');
            }

            const updated = await this.updateExistingReport({ ...data, adim: 'a' }, userId, filePath);
            const saved = await this.saveAndFetchReport((await this.projeRaporRepository.save(updated)).RaporID);
            return { personelListesi: sgkHizmet, projeRaporu: saved };
        }

        // Yeni kayıt
        const sgkHizmet = await this.analizService.onayliSgkHizmet(sgkParsed.texts, seciliDonem, FirmaID, true);
        if ('error' in sgkHizmet) {
            return await this.returnWithError(projeRaporu, sgkHizmet.error, 6, 'OnayliSGKHizmet');
        }

        const updated = await this.updateExistingReport({ ...data, adim: 'a' }, userId, filePath);
        const saved = await this.saveAndFetchReport((await this.projeRaporRepository.save(updated)).RaporID);
        return { personelListesi: sgkHizmet, projeRaporu: saved };
    }


    private async handleOnayliMuhtasarVePrim(
        buffer: Buffer,
        data: CreateProjeRaporDto,
        userId: number,
        filePath: string | null,
        projeRaporu: ProjeRaporlari | null,
        seciliDonem: Donem,
        isOrtagiList?: any
    ) {
        if (!projeRaporu) {
            return { error: 'Proje raporu bulunamadı', belge: 'OnayliMuhtasarVePrim' };
        }

        if (projeRaporu.HakemOnay) {
            return { error: 'Hakem Onay işlemi tamamlanmış, değişiklik yapılamaz', belge: 'OnayliMuhtasarVePrim' };
        }

        if (!buffer) {
            return { error: 'PDF içeriği alınamadı', belge: 'OnayliMuhtasarVePrim' };
        }
        const FirmaID = projeRaporu.Proje?.FirmaID ?? null;
        if (!FirmaID) {
            return { error: 'Firma ID bulunamadı', belge: 'OnayliMuhtasarVePrim' };
        }
        // 1. SGK Hizmet PDF'ini analiz et
        const sgkParsed = await this.parsePDF(projeRaporu.SGKHizmet);
        const sgkHizmet = await this.analizService.onayliSgkHizmet(sgkParsed.texts, seciliDonem, FirmaID, false);
        if ('error' in sgkHizmet) {
            return await this.returnWithError(projeRaporu, sgkHizmet.error, 6, 'OnayliSGKHizmet');
        }

        // 2. Muhtasar Ve Prim PDF'ini analiz et
        const muhtasarParsed = await this.parseBufferToPages(buffer);
        const muhtasar = await this.analizService.muhtasarVePrim(muhtasarParsed, seciliDonem, FirmaID, sgkHizmet.geciciListe ?? [], true, isOrtagiList);
        if ('error' in muhtasar || ('personelListesi' in muhtasar && 'farklilar' in muhtasar.personelListesi && muhtasar.personelListesi.farklilar.length > 0)) {
            const sonuc = await this.returnWithError(projeRaporu, 'error' in muhtasar ? muhtasar.error : 'Personel listesinde uyuşmazlıklar tespit edildi', 6, 'OnayliMuhtasarVePrim');
            return { ...sonuc, muhtasar }
        }

        const updated = await this.updateExistingReport({ ...data, adim: 'b' }, userId, filePath);
        const saved = await this.saveAndFetchReport((await this.projeRaporRepository.save(updated)).RaporID);
        return { personelListesi: muhtasar, projeRaporu: saved };
    }


}
