import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Not, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { Teknokentler } from './entities/teknokentler.entity';
import { Projeler } from 'src/projeler/entities/projeler.entity';
import { Firma } from 'src/firmalar/entities/firma.entity';
import { Personel } from 'src/personel/entities/personel.entity';
import { FirmaBilgileri } from 'src/firmalar/entities/firma-bilgileri.entity';
import * as fs from 'fs';
import * as path from 'path';
import { UpdateDto } from './dto/update.dto';
import { FirmaBilgileriSubeler } from 'src/firmalar/entities/firma-bilgileri-subeler.entity';

@Injectable()
export class TeknokentlerService {
    constructor(
        @InjectRepository(Teknokentler)
        private readonly teknokentlerRepository: Repository<Teknokentler>,
        private readonly dataSource: DataSource
    ) { }
    async getKullanicilar() {

        const kullanicilar = await this.dataSource.getRepository(Kullanicilar)
            .find({ where: { isVerified: true, KullaniciTipi: 1 } });

        return kullanicilar;
    }



    async getTeknokentDetay(userId: number, TeknokentID: number) {
        try {
            const teknokent = await this.dataSource
                .getRepository(Teknokentler)
                .createQueryBuilder("teknokent")
                .leftJoinAndMapMany("teknokent.Kullanicilar", Personel, "personel",
                    "personel.IliskiID = teknokent.TeknokentID AND personel.IsDeleted != 1 AND personel.KullaniciID  IS NOT NULL")
                .leftJoinAndMapOne("teknokent.TeknokentBilgisi", FirmaBilgileri, "teknokentBilgileri",
                    "teknokentBilgileri.IliskiID = teknokent.TeknokentID AND teknokentBilgileri.Tip = 3")
                .leftJoinAndSelect("teknokentBilgileri.Subeler", "subeler")
                .where("teknokent.IsDeleted = :isDeleted", { isDeleted: false })
                .andWhere("teknokent.TeknokentID = :TeknokentID", { TeknokentID })
                .getOne();

            if (!teknokent) {
                throw new BadRequestException('Teknokent bulunamadı');
            }

            return teknokent;
        } catch (error) {
            console.log(error)
            throw error;
        }
    }






    async getActiveTeknokentler() {
        const teknokentler = await this.dataSource
            .getRepository(Teknokentler)
            .find({ where: { IsDeleted: false } });
        return teknokentler;
    }

    async teknokentDashboard(TeknokentID: number) {
        const result = await this.dataSource
            .getRepository(Teknokentler)
            .createQueryBuilder('teknokent')
            .leftJoin('teknokent.Projeler', 'projeler')
            .select([
                'COUNT(projeler.ProjeID) AS projeSayisi',
                'COUNT(DISTINCT projeler.FirmaID) AS firmaSayisi'
            ])
            .where('teknokent.IsDeleted != 1')
            .andWhere('teknokent.TeknokentID = :TeknokentID', { TeknokentID })
            .getRawOne();
        return {
            projeSayisi: Number(result.projeSayisi),
            firmaSayisi: Number(result.firmaSayisi)
        };
    }
    async teknokentDashboardUzmanlar(TeknokentID: number) {
        try {
            if (!TeknokentID || TeknokentID < 1) {
                throw new BadRequestException('Teknokent ID gereklidir');
            }

            // 1. Uzman kullanıcıları çekiyoruz
            const uzmanlar = await this.dataSource.getRepository(Personel)
                .createQueryBuilder('teknoKullanici')
                .leftJoinAndSelect('teknoKullanici.Kullanici', 'Kullanici')
                .where('teknoKullanici.IliskiID = :id', { id: TeknokentID })
                .andWhere('teknoKullanici.IsDeleted != 1')
                .andWhere('teknoKullanici.KullaniciID IS NOT NULL')
                .getMany();

            if (uzmanlar.length === 0) return [];

            const kullaniciIDList = uzmanlar.map(u => u.KullaniciID);

            // 2. Her kullanıcıya ait proje sayısını tek sorguda alıyoruz
            const projeSayilari = await this.dataSource.getRepository(Projeler)
                .createQueryBuilder('projeler')
                .select('projeler.ProjeUzmanKullaniciID', 'KullaniciID')
                .addSelect('COUNT(projeler.ProjeID)', 'projeSayisi')
                .where('projeler.ProjeUzmanKullaniciID IN (:...ids)', { ids: kullaniciIDList })
                .groupBy('projeler.ProjeUzmanKullaniciID')
                .getRawMany();

            // 3. Kullanıcılara proje sayısını ekliyoruz
            const sayiMap = new Map<number, number>();
            for (const p of projeSayilari) {
                sayiMap.set(Number(p.KullaniciID), Number(p.projeSayisi));
            }

            // 4. Her kullanıcıya proje sayısını ekle
            const enriched = uzmanlar.map(u => ({
                ...u,
                projeSayisi: sayiMap.get(u.KullaniciID) || 0
            }));

            return enriched;

        } catch (error) {
            console.error(error);
            throw new BadRequestException(
                error.message || 'Veriler çekilirken hata oluştu',
            );
        }
    }


    async getUzmanYonetimi(teknokentId: number) {

        try {
            if (!teknokentId && teknokentId < 1) {
                throw new BadRequestException('Teknokent ID gereklidir');
            }

            const kullanicilar = await this.dataSource.getRepository(Personel)
                .createQueryBuilder('teknoKullanici')
                .leftJoinAndSelect('teknoKullanici.Kullanici', 'Kullanici')
                .where('teknoKullanici.IliskiID = :id', { id: teknokentId })
                .andWhere('teknoKullanici.IsDeleted = :IsDeleted', { IsDeleted: false })
                .andWhere('teknoKullanici.KullaniciID IS NOT NULL')
                .getMany();

            const projeler = await this.dataSource.getRepository(Projeler)
                .createQueryBuilder('proje')
                .where('proje.TeknokentID = :id', { id: teknokentId })
                .andWhere('proje.IsDeleted = :IsDeleted', { IsDeleted: false })
                .getMany();

            return { kullanicilar, projeler };
        } catch (error) {
            console.log(error)
            throw new BadRequestException(
                error.message || 'Veriler çekilirken hata oluştu',
            );
        }
    }


    async getProjeler(userId: number, teknokentId: number) {

        if (!teknokentId && teknokentId < 1) {
            throw new BadRequestException('Teknokent ID gereklidir');
        }
        const projeler = await this.dataSource.getRepository(Projeler)
            .createQueryBuilder('proje')
            .leftJoinAndSelect('proje.Firma', 'Firma')
            .leftJoinAndSelect('proje.ProjeUzmanKullanici', 'ProjeUzmanKullanici')
            .leftJoinAndSelect('proje.ProjeHakemKullanici', 'ProjeHakemKullanici')
            .where('proje.TeknokentID = :id', { id: teknokentId })
            .andWhere('proje.IsDeleted = :IsDeleted', { IsDeleted: false })
            .getMany();

        return projeler;
    }

    async getFirmalar(userId: number, query: any, iliskiId: number) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'FirmaID';
        const order = query.order || 'DESC';
        const filter = query.filter || {};

        if (isNaN(page) || isNaN(limit)) {
            throw new BadRequestException('Sayfa ve Sınır Numaralar olmalı');
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

        if (user.KullaniciTipi === 3) {
            return await this.getFirmalarTeknoKullanici(iliskiId, filter, sort, order, limit, page)
        } else {

            // ...existing code...
            const firma = await this.dataSource.getRepository(Firma).createQueryBuilder('firma')
                .where('firma.FirmaID = :FirmaID', { FirmaID: iliskiId })
                .leftJoinAndSelect('firma.Projeler', 'projeler')
                .leftJoinAndSelect('firma.ProjeBasvurulari', 'projeBasvurulari')
                .getOne();

            let teknokentIDS: number[] = [];
            if (firma) {
                const projeTeknokentIDs = (firma.Projeler || []).map(p => p.TeknokentID).filter(Boolean);
                const basvuruTeknokentIDs = (firma.ProjeBasvurulari || []).map(pb => pb.TeknokentID).filter(Boolean);
                teknokentIDS = Array.from(new Set([...projeTeknokentIDs, ...basvuruTeknokentIDs]));
            }

            return await this.getFirmalarFirmaKullanici(teknokentIDS, filter, sort, order, limit, page);
        }



    }



    private async getFirmalarFirmaKullanici(teknokentIds: number[], filter: object, sort: string, order: string, limit: number, page: number) {
        try {

            const queryBuilder = this.dataSource.getRepository(Firma)
                .createQueryBuilder('firma')
                .where('firma.IsDeleted != 1')
                .distinct(true)
                .leftJoinAndSelect('firma.Projeler', 'proje')
                .leftJoinAndSelect('proje.Teknokent', 'teknokent')
                .leftJoinAndMapMany('firma.Personeller', Personel, 'personel', 'personel.IliskiID = firma.FirmaID AND personel.IsDeleted != 1')
                .leftJoinAndSelect('personel.Kullanici', 'personelKullanici')
                .leftJoinAndMapMany('firma.Kullanicilar', Personel, 'ownerPersonel',
                    'ownerPersonel.KullaniciID IS NOT NULL AND ownerPersonel.IliskiID = firma.FirmaID AND ownerPersonel.IsDeleted != 1')
                .leftJoinAndSelect('ownerPersonel.Kullanici', 'ownerKullanici')
                .leftJoinAndMapOne('firma.FirmaBilgisi', FirmaBilgileri, 'firmaBilgisi', 'firmaBilgisi.IliskiID = firma.FirmaID AND firmaBilgisi.Tip = 1')
                .leftJoinAndSelect("firmaBilgisi.Subeler", "subeler")
                .andWhere('teknokent.TeknokentID IN (:...ids)', { ids: teknokentIds })
                .andWhere('teknokent.IsDeleted != 1');


            // Filtreleme
            // Filtreleme işlemi
            Object.keys(filter).forEach((key) => {
                const validFilterFields = {
                    'FirmaAdi': 'firma.FirmaAdi',
                    'Kullanici': 'ownerKullanici.AdSoyad',
                    'query': null // Genel arama için
                };

                if (key === 'query') {
                    // Tüm alanlarda arama yap
                    queryBuilder.andWhere(new Brackets(qb => {
                        qb.where('firma.FirmaAdi LIKE :searchTerm')
                            .orWhere('ownerKullanici.AdSoyad LIKE :searchTerm')
                    }), { searchTerm: `%${filter[key]}%` });
                } else if (validFilterFields[key]) {
                    queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
                }
            });

            // Sıralama işlemi
            const allowedSortFields = ['FirmaID', 'Kullanici', 'id'];
            if (!allowedSortFields.includes(sort)) {
                throw new BadRequestException(`Geçersiz sıralama değeri: ${sort}`);
            }
            // Sıralama işlemi
            if (sort === 'Kullanici') {
                queryBuilder.orderBy('ownerKullanici.AdSoyad', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            } else {
                queryBuilder.orderBy(`firma.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            }

            queryBuilder.skip((page - 1) * limit).take(limit);

            // Sadece ilk listeyi alalım
            const [teknokentList, total] = await queryBuilder.getManyAndCount();



            return {
                data: teknokentList,
                total,
                page,
                lastPage: Math.ceil(total / limit),
            };
        } catch (error) {
            console.log(error)
        }
    }



    private async getFirmalarTeknoKullanici(teknokentId: number, filter: object, sort: string, order: string, limit: number, page: number) {
        try {

            const queryBuilder = this.dataSource.getRepository(Firma)
                .createQueryBuilder('firma')
                .where('firma.IsDeleted != 1')
                .distinct(true)
                .leftJoinAndSelect('firma.Projeler', 'proje')
                .innerJoin('proje.Teknokent', 'teknokent')
                .leftJoinAndMapMany('firma.Personeller', Personel, 'personel', 'personel.IliskiID = firma.FirmaID AND personel.IsDeleted != 1')
                .leftJoinAndSelect('personel.Kullanici', 'personelKullanici')
                .leftJoinAndMapMany('firma.Kullanicilar', Personel, 'ownerPersonel',
                    'ownerPersonel.KullaniciID IS NOT NULL AND ownerPersonel.IliskiID = firma.FirmaID AND ownerPersonel.IsDeleted != 1')
                .leftJoinAndSelect('ownerPersonel.Kullanici', 'ownerKullanici')
                .leftJoinAndMapOne('firma.FirmaBilgisi', FirmaBilgileri, 'firmaBilgisi', 'firmaBilgisi.IliskiID = firma.FirmaID AND firmaBilgisi.Tip = 1')
                .leftJoinAndSelect("firmaBilgisi.Subeler", "subeler")
                .andWhere('teknokent.TeknokentID = :id', { id: teknokentId })
                .andWhere('teknokent.IsDeleted != 1');


            // Filtreleme
            // Filtreleme işlemi
            Object.keys(filter).forEach((key) => {
                const validFilterFields = {
                    'FirmaAdi': 'firma.FirmaAdi',
                    'Kullanici': 'ownerKullanici.AdSoyad',
                    'query': null // Genel arama için
                };

                if (key === 'query') {
                    // Tüm alanlarda arama yap
                    queryBuilder.andWhere(new Brackets(qb => {
                        qb.where('firma.FirmaAdi LIKE :searchTerm')
                            .orWhere('ownerKullanici.AdSoyad LIKE :searchTerm')
                    }), { searchTerm: `%${filter[key]}%` });
                } else if (validFilterFields[key]) {
                    queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
                }
            });

            // Sıralama işlemi
            const allowedSortFields = ['FirmaID', 'Kullanici', 'id'];
            if (!allowedSortFields.includes(sort)) {
                throw new BadRequestException(`Geçersiz sıralama değeri: ${sort}`);
            }
            // Sıralama işlemi
            if (sort === 'Kullanici') {
                queryBuilder.orderBy('ownerKullanici.AdSoyad', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            } else {
                queryBuilder.orderBy(`firma.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            }

            queryBuilder.skip((page - 1) * limit).take(limit);

            // Sadece ilk listeyi alalım
            const [teknokentList, total] = await queryBuilder.getManyAndCount();



            return {
                data: teknokentList,
                total,
                page,
                lastPage: Math.ceil(total / limit),
            };
        } catch (error) {
            console.log(error)
        }
    }










    async getUzmanlar(userId: number, query: any, teknokentId: number) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'PersonelID';
        const order = query.order || 'DESC';
        const filter = query.filter || {};

        if (isNaN(page) || isNaN(limit)) {
            throw new BadRequestException('Sayfa ve Sınır Numaralar olmalı');
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
            const queryBuilder = this.dataSource.getRepository(Personel)
                .createQueryBuilder('teknoKullanici')
                .leftJoinAndSelect('teknoKullanici.Kullanici', 'Kullanici')
                .leftJoinAndMapOne('teknoKullanici.Teknokent', Teknokentler, 'Teknokent',
                    'Teknokent.TeknokentID = teknoKullanici.IliskiID AND Teknokent.IsDeleted != 1')
                .where('teknoKullanici.IliskiID = :id', { id: teknokentId })
                .andWhere('teknoKullanici.IsDeleted != :IsDeleted', { IsDeleted: true })
                .andWhere('teknoKullanici.KullaniciID IS NOT NULL');

            // Filtreleme işlemi
            Object.keys(filter).forEach((key) => {
                const validFilterFields = {
                    'Teknokent': 'Teknokent.TeknokentAdi',
                    'Kullanici': 'Kullanici.AdSoyad',
                    'query': null // Genel arama için
                };

                if (key === 'query') {
                    // Tüm alanlarda arama yap
                    queryBuilder.andWhere(new Brackets(qb => {
                        qb.where('Teknokent.TeknokentAdi LIKE :searchTerm')
                            .orWhere('Kullanici.AdSoyad LIKE :searchTerm')
                    }), { searchTerm: `%${filter[key]}%` });
                } else if (validFilterFields[key]) {
                    queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
                }
            });

            // Sıralama işlemi
            const allowedSortFields = ['Teknokent', 'Kullanici', 'PersonelID'];
            if (!allowedSortFields.includes(sort)) {
                throw new BadRequestException(`Geçersiz sıralama değeri: ${sort}`);
            }
            // Sıralama işlemi
            if (sort === 'Teknokent') {
                queryBuilder.orderBy('Teknokent.TeknokentAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            } else if (sort === 'Kullanici') {
                queryBuilder.orderBy('Kullanici.AdSoyad', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            } else {
                queryBuilder.orderBy(`teknoKullanici.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            }

            queryBuilder.skip((page - 1) * limit).take(limit);

            // Sadece ilk listeyi alalım
            //const [teknokentList, total] = await queryBuilder.getManyAndCount();
            // Projeleri ayrı bir sorgu ile alalım
            const results = await queryBuilder.getMany();

            // Her bir TeknokentKullanicisi için projeleri bulalım
            const enrichedResults = await Promise.all(results.map(async (teknoKullanici) => {
                const projeler = await this.dataSource.getRepository(Projeler)
                    .createQueryBuilder('proje')
                    .leftJoinAndSelect('proje.Firma', 'firma')
                    .where('proje.ProjeUzmanKullaniciID = :kullaniciId', {
                        kullaniciId: teknoKullanici.KullaniciID
                    })
                    .andWhere('proje.IsDeleted = :isDeleted', { isDeleted: false })
                    .getMany();

                return {
                    ...teknoKullanici,
                    ProjeSayisi: projeler.length || 0,
                    Projeler: projeler || []
                };
            }));
            // Sayfalama ve toplam sayı için
            const total = enrichedResults.length;

            const paginatedResults = enrichedResults.slice(
                (page - 1) * limit,
                page * limit
            );

            return {
                data: paginatedResults,
                total,
                page,
                lastPage: Math.ceil(total / limit),
            };
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Veriler çekilirken hata oluştu',
            );
        }

    }

    async getHakemler(userId: number, query: any, teknokentId: number) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'PersonelID';
        const order = query.order || 'DESC';
        const filter = query.filter || {};

        if (isNaN(page) || isNaN(limit)) {
            throw new BadRequestException('Sayfa ve Sınır Numaralar olmalı');
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

            const queryBuilder = this.dataSource.getRepository(Personel)
                .createQueryBuilder('teknoKullanici')
                .leftJoinAndSelect('teknoKullanici.Kullanici', 'Kullanici')
                .leftJoinAndMapOne('teknoKullanici.Teknokent', Teknokentler, 'Teknokent',
                    'Teknokent.TeknokentID = teknoKullanici.IliskiID AND Teknokent.IsDeleted != 1')
                .where('teknoKullanici.IliskiID = :id', { id: teknokentId })
                .andWhere('teknoKullanici.IsDeleted = :IsDeleted', { IsDeleted: false })
                .andWhere('teknoKullanici.KullaniciID IS NOT NULL');

            // Filtreleme işlemi
            Object.keys(filter).forEach((key) => {
                const validFilterFields = {
                    'Teknokent': 'Teknokent.TeknokentAdi',
                    'Kullanici': 'Kullanici.AdSoyad',
                    'query': null // Genel arama için
                };

                if (key === 'query') {
                    // Tüm alanlarda arama yap
                    queryBuilder.andWhere(new Brackets(qb => {
                        qb.where('Teknokent.TeknokentAdi LIKE :searchTerm')
                            .orWhere('Kullanici.AdSoyad LIKE :searchTerm')
                    }), { searchTerm: `%${filter[key]}%` });
                } else if (validFilterFields[key]) {
                    queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
                }
            });

            // Sıralama işlemi
            const allowedSortFields = ['Teknokent', 'Kullanici', 'PersonelID'];
            if (!allowedSortFields.includes(sort)) {
                throw new BadRequestException(`Geçersiz sıralama değeri: ${sort}`);
            }
            // Sıralama işlemi
            if (sort === 'Teknokent') {
                queryBuilder.orderBy('Teknokent.TeknokentAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            } else if (sort === 'Kullanici') {
                queryBuilder.orderBy('Kullanici.AdSoyad', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            } else {
                queryBuilder.orderBy(`teknoKullanici.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            }

            queryBuilder.skip((page - 1) * limit).take(limit);

            // Sadece ilk listeyi alalım
            //const [teknokentList, total] = await queryBuilder.getManyAndCount();
            // Projeleri ayrı bir sorgu ile alalım
            const results = await queryBuilder.getMany();

            // Her bir TeknokentKullanicisi için projeleri bulalım
            const enrichedResults = await Promise.all(results.map(async (teknoKullanici) => {
                const projeler = await this.dataSource.getRepository(Projeler)
                    .createQueryBuilder('proje')
                    .leftJoinAndSelect('proje.Firma', 'firma')
                    .where('proje.ProjeHakemKullaniciID = :kullaniciId', {
                        kullaniciId: teknoKullanici.KullaniciID
                    })
                    .andWhere('proje.IsDeleted = :isDeleted', { isDeleted: false })
                    .getMany();

                return {
                    ...teknoKullanici,
                    ProjeSayisi: projeler.length || 0,
                    Projeler: projeler || []
                };
            }));
            // Sayfalama ve toplam sayı için
            const total = enrichedResults.length;

            const paginatedResults = enrichedResults.slice(
                (page - 1) * limit,
                page * limit
            );

            return {
                data: paginatedResults,
                total,
                page,
                lastPage: Math.ceil(total / limit),
            };

        } catch (error) {
            throw new BadRequestException(
                error.message || 'Veriler çekilirken hata oluştu',
            );
        }
    }

    async getTeknokentler(userId: number, query: any) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'TeknokentAdi';
        const order = query.order || 'DESC';
        const filter = query.filter || {};


        if (isNaN(page) || isNaN(limit)) {
            throw new BadRequestException('Sayfa ve Sınır Numaralar olmalı');
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
            const queryBuilder = this.dataSource.getRepository(Teknokentler).createQueryBuilder('teknokent');

            // Filtreleme       
            Object.keys(filter).forEach((key) => {
                const validFilterFields = {
                    'TeknokentAdi': 'teknokent.TeknokentAdi',
                    'query': null // Genel arama için
                };

                if (key === 'query') {
                    // Tüm alanlarda arama yap
                    queryBuilder.andWhere(new Brackets(qb => {
                        qb.where('CAST(teknokent.TeknokentAdi AS VARCHAR) LIKE :searchTerm')
                            .orWhere('CAST(teknokent.Ilce AS VARCHAR) LIKE :searchTerm')
                            .orWhere('CAST(teknokent.Sehir AS VARCHAR) LIKE :searchTerm')
                    }), { searchTerm: `%${filter[key]}%` });
                } else if (validFilterFields[key]) {
                    queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
                }
            });

            // Sıralama
            const validSortFields = ['TeknokentAdi'];
            if (sort && validSortFields.includes(sort)) {
                queryBuilder.orderBy(`teknokent.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            }

            queryBuilder.skip((page - 1) * limit).take(limit);

            // Sadece ilk listeyi alalım
            const [teknokentList, total] = await queryBuilder.getManyAndCount();

            // Şimdi owner'ları paralel olarak bulalım
            const teknokentKullaniciRepo = this.dataSource.getRepository(Personel);

            const enriched = await Promise.all(
                teknokentList.map(async (teknokent) => {
                    const owner = await teknokentKullaniciRepo.findOne({
                        where: {
                            IliskiID: teknokent.TeknokentID,
                            Rol: 'owner',
                            Tip: 3
                        },
                        relations: ['Kullanici']
                    });

                    return {
                        ...teknokent,
                        OwnerKullanici: owner?.Kullanici || null
                    };
                })
            );

            return {
                data: enriched,
                total,
                page,
                lastPage: Math.ceil(total / limit),
            };
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Veriler çekilirken hata oluştu',
            );
        }

    }


    async create(userId: number, data: { TeknokentAdi: string, Sehir: string, Ilce: string, KullaniciID: number }) {


        if (!userId) {
            throw new BadRequestException(`Kullanıcı ID gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }

        if (user?.KullaniciTipi !== 2) {
            throw new BadRequestException(`Yetkisiz Kullanıcı`);
        }
        if (!data.TeknokentAdi) {
            throw new BadRequestException(`Teknokent Adı zorunludur`);
        }

        try {
            if (data.KullaniciID > 0) {
                const kullanici = await this.dataSource.getRepository(Kullanicilar).findOne({
                    where: { id: data.KullaniciID },
                });

                if (!kullanici) {
                    throw new BadRequestException(`Atanmak istenilen Kullanıcı bulunamadı`);
                }
            }

            const teknokent = await this.teknokentlerRepository.save({
                TeknokentAdi: data.TeknokentAdi,
                Sehir: data.Sehir,
                Ilce: data.Ilce
            });
            if (data.KullaniciID > 0) {
                const teknokentKullanici = await this.dataSource.getRepository(Personel).findOne({
                    where: { KullaniciID: data.KullaniciID, Tip: 3 }
                })
                if (teknokentKullanici) {
                    throw new BadRequestException(`Atanmak istenilen Kullanıcı başka bir teknokentin kullanıcısı olarak eklenmiş`);
                }
                const kullanici = await this.dataSource.getRepository(Kullanicilar).findOne({
                    where: { id: data.KullaniciID },
                });
                const yeniTeknokentKullanici = this.dataSource.getRepository(Personel).create({
                    IliskiID: teknokent.TeknokentID,
                    AdSoyad: kullanici.AdSoyad,
                    KullaniciID: data.KullaniciID,
                    Rol: 'owner',
                    Tip: 3
                });
                await this.dataSource.getRepository(Personel).save(yeniTeknokentKullanici);

                await this.dataSource.getRepository(Kullanicilar).update({ id: data.KullaniciID }, { KullaniciTipi: 3 });
            }

            return await this.teknokentlerRepository.createQueryBuilder('teknokent')
                .where('teknokent.TeknokentID = :TeknokentID', { TeknokentID: teknokent.TeknokentID })
                .getOne();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Teknokent oluşturma hatası',
            );
        }
    }

    async update(userId: number, data: UpdateDto) {
        if (!userId) throw new BadRequestException(`Kullanıcı ID gereklidir`);

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({ where: { id: userId } });
        if (!user) throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        if (user.KullaniciTipi == 1) throw new BadRequestException(`Yetkisiz Kullanıcı`);

        if (!data.TeknokentID) throw new BadRequestException(`TeknokentID bulunamadı`);
        if (!data.TeknokentAdi) throw new BadRequestException(`Teknokent Adı zorunludur`);

        try {
            // Teknokent güncelle
            const teknokent = await this.teknokentlerRepository.findOne({ where: { TeknokentID: data.TeknokentID } });
            if (!teknokent) throw new BadRequestException(`Teknokent bulunamadı`);

            teknokent.TeknokentAdi = data.TeknokentAdi;
            teknokent.Sehir = data.Il;
            teknokent.Ilce = data.Ilce;
            teknokent.Adres = data.Adres;
            teknokent.WebSitesi = data.WebSitesi;
            teknokent.Eposta = data.Eposta;
            teknokent.Telefon = data.Telefon;
            await this.teknokentlerRepository.save(teknokent);

            // Teknokent Bilgisi güncelle
            const firmaBilgisiRepo = this.dataSource.getRepository(FirmaBilgileri);
            let teknokentBilgisi = await firmaBilgisiRepo.findOne({
                where: { IliskiID: data.TeknokentID, Tip: 3 }
            });

            // Logo güncellemesi
            let logoimage = teknokentBilgisi?.Logo || null;

            // Temizle fonksiyonu
            function temizle(obj: any) {
                const temizObj = {};
                for (const key in obj) {
                    const value = obj[key];
                    if (
                        value !== undefined &&
                        value !== null &&
                        !(typeof value === 'string' && value.trim() === '')
                    ) {
                        temizObj[key] = value;
                    }
                }
                return temizObj;
            }

            const yeniBilgi = temizle({
                IliskiID: data.TeknokentID,
                Tip: 3,
                Logo: logoimage,
                KisaTanitim: data.KisaTanitim ?? '--',
                FirmaAciklamasi: data.FirmaAciklamasi ?? '--',
                TemsilciAdi: data.TemsilciAdi,
                TemsilciUnvani: data.TemsilciUnvani,
                TemsilciEmail: data.TemsilciEmail,
                TemsilciTelefon: data.TemsilciTelefon,
                WebSitesi: data.WebSitesi
            });
            if (teknokentBilgisi.BilgiID) {
                if (Object.keys(yeniBilgi).length > 0) {
                    await firmaBilgisiRepo.update(teknokentBilgisi.BilgiID, yeniBilgi);
                }
            } else {
                await firmaBilgisiRepo.save(yeniBilgi);
            }

            const firmaBilgisi = await this.dataSource.getRepository(FirmaBilgileri).findOne({
                where: { IliskiID: data.TeknokentID, Tip: 3 },
                relations: ['Subeler'],
            });
            if (firmaBilgisi) {
                const subeRepo = this.dataSource.getRepository(FirmaBilgileriSubeler);
                let sube = firmaBilgisi.Subeler && firmaBilgisi.Subeler.length > 0 ? firmaBilgisi.Subeler[0] : null;

                if (sube) {
                    // Şube güncelle
                    sube.Il = data.Il;
                    sube.SubeAdi = 'Merkez',
                        sube.Ilce = data.Ilce;
                    sube.Ulke = 'Türkiye',
                        sube.Adres = data.Adres;
                    sube.Email = data.Eposta;
                    sube.Telefon = data.Telefon;
                    await subeRepo.save(sube);
                } else {
                    // Şube oluştur
                    await subeRepo.save({
                        BilgiID: firmaBilgisi.BilgiID,
                        SubeAdi: 'Merkez',
                        Ilce: data.Ilce,
                        Il: data.Il,
                        Ulke: 'Türkiye',
                        Adres: data.Adres,
                        Email: data.Eposta,
                        Telefon: data.Telefon,
                    });
                }
            }

            // Kullanıcı atama işlemleri (varsa)
            if (data.KullaniciID && data.KullaniciID > 0) {
                const kullanici = await this.dataSource.getRepository(Kullanicilar).findOne({
                    where: { id: data.KullaniciID },
                });
                if (!kullanici) throw new BadRequestException(`Atanmak istenilen Kullanıcı bulunamadı`);

                let teknokentKullanici = await this.dataSource.getRepository(Personel).findOne({
                    where: { IliskiID: data.TeknokentID, Tip: 3, Rol: 'owner' }
                });

                if (!teknokentKullanici) {
                    teknokentKullanici = this.dataSource.getRepository(Personel).create({
                        IliskiID: teknokent.TeknokentID,
                        AdSoyad: kullanici.AdSoyad,
                        KullaniciID: data.KullaniciID,
                        Rol: 'owner',
                        Tip: 3
                    });
                    await this.dataSource.getRepository(Personel).save(teknokentKullanici);
                    await this.dataSource.getRepository(Kullanicilar).update({ id: data.KullaniciID }, { KullaniciTipi: 3 });
                } else if (teknokentKullanici.KullaniciID !== data.KullaniciID) {
                    const teknokentKullaniciVarmi = await this.dataSource.getRepository(Personel).findOne({
                        where: { KullaniciID: data.KullaniciID, IliskiID: data.TeknokentID, Tip: 3, IsDeleted: false }
                    });
                    if (teknokentKullaniciVarmi) {
                        throw new BadRequestException(`Atanmak istenilen Kullanıcı başka bir teknokentin kullanıcısı olarak eklenmiş`);
                    }
                    teknokentKullanici.KullaniciID = data.KullaniciID;
                    await this.dataSource.getRepository(Personel).save(teknokentKullanici);
                    await this.dataSource.getRepository(Kullanicilar).update({ id: data.KullaniciID }, { KullaniciTipi: 3 });
                }
            }

            return await this.dataSource
                .getRepository(Teknokentler)
                .createQueryBuilder("teknokent")
                .leftJoinAndMapMany("teknokent.Kullanicilar", Personel, "personel",
                    "personel.IliskiID = teknokent.TeknokentID AND personel.IsDeleted != 1 AND personel.KullaniciID  IS NOT NULL")
                .leftJoinAndMapOne("teknokent.TeknokentBilgisi", FirmaBilgileri, "teknokentBilgileri",
                    "teknokentBilgileri.IliskiID = teknokent.TeknokentID AND teknokentBilgileri.Tip = 3")
                .leftJoinAndSelect("teknokentBilgileri.Subeler", "subeler")
                .where("teknokent.IsDeleted = :isDeleted", { isDeleted: false })
                .andWhere("teknokent.TeknokentID = :TeknokentID", { TeknokentID: teknokent.TeknokentID })
                .getOne();

        } catch (error) {
            throw new BadRequestException(
                error.message || 'Teknokentler düzenleme hatası',
            );
        }
    }

    async delete(userId: number, data: any) {

        if (!data.itemId) {
            throw new BadRequestException('itemId gereklidir');
        }
        if (isNaN(data.itemId)) {
            throw new BadRequestException('itemId numara türünde olmalıdır');
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

        if (user?.KullaniciTipi !== 2) {
            throw new BadRequestException(`Yetkisiz Kullanıcı`);
        }


        try {
            const teknokent = await this.teknokentlerRepository.findOne({ where: { TeknokentID: data.itemId } });
            if (teknokent) {
                teknokent.IsDeleted = true;
                await this.teknokentlerRepository.save(teknokent);

                return await this.teknokentlerRepository.createQueryBuilder('teknokent')
                    .where('teknokent.TeknokentID = :TeknokentID', { TeknokentID: data.itemId })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'Teknokent bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Teknokent silme hatası',
            );
        }


    }

    async reload(userId: number, data: any) {
        if (!data.itemId) {
            throw new BadRequestException('itemId gereklidir');
        }
        if (isNaN(data.itemId)) {
            throw new BadRequestException('itemId numara türünde olmalıdır');
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
        if (user?.KullaniciTipi !== 2) {
            throw new BadRequestException(`Yetkisiz Kullanıcı`);
        }


        try {
            // Silinmiş Teknokentler'yı bul
            const teknokent = await this.teknokentlerRepository
                .createQueryBuilder('teknokent')
                .where('teknokent.TeknokentID = :id', { id: data.itemId })
                .getOne();

            if (teknokent) {
                // Template'i geri yükle
                teknokent.IsDeleted = false;

                await this.teknokentlerRepository.save(teknokent);
                return await this.teknokentlerRepository.createQueryBuilder('teknokent')
                    .where('teknokent.TeknokentID = :TeknokentID', { TeknokentID: data.itemId })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'Teknokent bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Teknokent geri getirme hatası'
            );
        }
    }


    async updateTeknokentLogo(filePath: string, TeknokentID: number) {
        try {
            const teknokent = await this.teknokentlerRepository.createQueryBuilder('teknokent')
                .leftJoinAndMapOne('teknokent.TeknokentBilgisi', FirmaBilgileri, 'teknokentBilgisi', 'teknokentBilgisi.IliskiID = teknokent.TeknokentID AND teknokentBilgisi.Tip = 3')
                .where('teknokent.TeknokentID = :TeknokentID', { TeknokentID: TeknokentID })
                .getOne();

            if (!teknokent) {
                throw new BadRequestException('teknokent bulunamadı');
            }
            let logo = teknokent.TeknokentBilgisi ? teknokent.TeknokentBilgisi.Logo : null;
            if (filePath) {
                // URL'den dosya yolunu ayıkla
                const oldImagePath = logo ? logo.replace('/public/', '') : null;
                if (oldImagePath) {
                    const fullPath = path.join(process.cwd(), 'public', oldImagePath);

                    try {
                        if (fs.existsSync(fullPath)) {
                            await fs.promises.unlink(fullPath);
                        } else {
                            console.log('Dosya bulunamadı:', fullPath);
                        }
                    } catch (err) {
                        console.error('Dosya silme hatası:', err);
                    }
                }
                logo = `${filePath}`;
            }

            try {
                if (teknokent.TeknokentBilgisi && teknokent.TeknokentBilgisi.BilgiID) {
                    await this.dataSource.getRepository(FirmaBilgileri).update(teknokent.TeknokentBilgisi.BilgiID, { Logo: logo });
                } else {
                    // Eğer FirmaBilgisi yoksa yeni bir kayıt oluştur
                    const yeniTeknokentBilgisi = this.dataSource.getRepository(FirmaBilgileri).create({
                        IliskiID: teknokent.TeknokentID,
                        Tip: 3,
                        Logo: logo,
                        KisaTanitim: '-',
                        FirmaAciklamasi: '-',
                    });
                    await this.dataSource.getRepository(FirmaBilgileri).save(yeniTeknokentBilgisi);
                }
                const firmaBilgisi = await this.dataSource.getRepository(FirmaBilgileri).findOne({
                    where: { IliskiID: teknokent.TeknokentID, Tip: 3 },
                    relations: ['Subeler'],
                });

                if (firmaBilgisi) {
                    const subeRepo = this.dataSource.getRepository(FirmaBilgileriSubeler);
                    let sube = firmaBilgisi.Subeler && firmaBilgisi.Subeler.length > 0 ? firmaBilgisi.Subeler[0] : null;

                    if (!sube) {
                        // Şube oluştur
                        await subeRepo.save({
                            BilgiID: firmaBilgisi.BilgiID,
                            SubeAdi: 'Merkez',
                            Ilce: null,
                            Il: null,
                            Ulke: 'Türkiye',
                            Adres: null,
                            Email: null,
                            Telefon: null,
                        });
                    }
                }


            } catch (error) {
                throw new Error(error)
            }

            return logo;
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error; // NestJS hata yönetimini koru
            }
            console.log(error)
            throw new InternalServerErrorException('Teknokent bilgileri güncelleme işlemi sırasında bir hata oluştu.');
        }

    }


    async logoDelete(TeknokentID: number) {
        try {
            const teknokent = await this.teknokentlerRepository.createQueryBuilder('teknokent')
                .leftJoinAndMapOne('teknokent.TeknokentBilgisi', FirmaBilgileri, 'teknokentBilgisi', 'teknokentBilgisi.IliskiID = teknokent.TeknokentID AND teknokentBilgisi.Tip = 3')
                .where('teknokent.TeknokentID = :TeknokentID', { TeknokentID: TeknokentID })
                .getOne();

            if (!teknokent) {
                throw new BadRequestException('teknokent bulunamadı');
            }
            // URL'den dosya yolunu ayıkla
            const oldImagePath = teknokent.TeknokentBilgisi.Logo ?
                teknokent.TeknokentBilgisi.Logo.replace('/public/', '') : null;
            if (oldImagePath) {
                const fullPath = path.join(process.cwd(), 'public', oldImagePath);

                try {
                    if (fs.existsSync(fullPath)) {
                        await fs.promises.unlink(fullPath);
                    } else {
                        console.log('Dosya bulunamadı:', fullPath);
                    }
                } catch (err) {
                    console.error('Dosya silme hatası:', err);
                }
            }

            // Profil resmini veritabanından kaldır
            try {
                if (!teknokent.TeknokentBilgisi || !teknokent.TeknokentBilgisi.BilgiID) {
                    throw new BadRequestException('teknokent bilgileri bulunamadı');
                }
                await this.dataSource.getRepository(FirmaBilgileri).update(teknokent.TeknokentBilgisi.BilgiID, { Logo: null });
            } catch (error) {
                console.error('Veritabanı güncelleme hatası:', error);
                throw new BadRequestException('Logo güncellenemedi');
            }

            return { status: 201, message: 'Logo silindi' };
        } catch (error) {
            console.log(error)
            if (error instanceof BadRequestException) {
                throw error; // NestJS hata yönetimini koru
            }
            throw new InternalServerErrorException('Logo silme işlemi sırasında bir hata oluştu.');
        }

    }
}
