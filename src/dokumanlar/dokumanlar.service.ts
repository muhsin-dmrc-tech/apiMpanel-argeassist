import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as mime from 'mime-types';
import { CreateProjeRaporDto } from './dto/create.dto';
import { AppGateway } from 'src/websocket.gateway';
import { Donem } from 'src/donem/entities/donem.entity';
import { MailService } from 'src/mail/mail.service';
import * as tmp from 'tmp';
import { PdfAnalizService } from 'src/pdf-analiz/pdf-analiz.service';
import { Dokumanlar } from './entities/dokumanlar.entity';
import { SurecKayitlari } from 'src/surecler/entities/surec-kayitlari.entity';
import { Surecler } from 'src/surecler/entities/surecler.entity';
import { Bildirimler } from 'src/bildirimler/entities/bildirimler.entity';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
const PDFParser = require('pdf2json');

@Injectable()
export class DokumanlarService {
    constructor(
        @InjectRepository(Dokumanlar)
        private readonly DokumanlarRepository: Repository<Dokumanlar>,
        private readonly dataSource: DataSource,
        private readonly appGateway: AppGateway,
        private readonly mailService: MailService,
        private readonly analizService: PdfAnalizService,
    ) { }


    async aylikFaaliyetRaporlari(userId: number, query: any) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'ID';
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



        const queryBuilder = this.dataSource.getRepository(Dokumanlar).createQueryBuilder('raporlar')
            //.leftJoinAndSelect('raporlar.Proje', 'Proje')
            .leftJoinAndSelect('raporlar.Kullanici', 'Kullanici')
            //.leftJoinAndSelect('Proje.ProjeUzmanKullanici', 'ProjeUzmanKullanici')
            //.leftJoinAndSelect('Proje.ProjeHakemKullanici', 'ProjeHakemKullanici')
            .leftJoinAndSelect('raporlar.Donem', 'Donem')
            .where('raporlar.KullaniciID = :KullaniciID', { KullaniciID: userId });

        // Filtreleme işlemi
        Object.keys(filter).forEach((key) => {
            const validFilterFields = {
                //'ProjeAdi': 'Proje.ProjeAdi',
                'DonemAdi': 'Donem.DonemAdi',
                'query': null // Genel arama için
            };

            if (key === 'query') {
                queryBuilder.andWhere(new Brackets(qb => {
                    qb.where('Donem.DonemAdi LIKE :searchTerm')
                        //.orWhere('Proje.ProjeAdi LIKE :searchTerm')
                        .orWhere('CAST(raporlar.Durum AS VARCHAR) LIKE :searchTerm')
                }), { searchTerm: `%${filter[key]}%` });
            } else if (validFilterFields[key]) {
                queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
            }
        });

        // Sıralama işlemi
        const allowedSortFields = ['DonemAdi', 'ID'];
        if (!allowedSortFields.includes(sort)) {
            throw new BadRequestException(`Geçersiz sıralama değeri: ${sort}`);
        }
        // Sıralama işlemi
        /* if (sort === 'ProjeAdi') {
            queryBuilder.orderBy('Proje.ProjeAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        } else  */
        if (sort === 'DonemAdi') {
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




    async aylikFaaliyetRaporlariAdmin(userId: number, query: any) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'ID';
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

        if (user.KullaniciTipi !== 2) {
            throw new ForbiddenException(`Yetkisiz kullanıcı işlemi.`);
        }


        const queryBuilder = this.dataSource.getRepository(Dokumanlar).createQueryBuilder('raporlar')
            //.leftJoinAndSelect('raporlar.Proje', 'Proje')
            .leftJoinAndSelect('raporlar.Donem', 'Donem')
            .leftJoinAndSelect('raporlar.Kullanici', 'Kullanici')


        // Filtreleme işlemi
        Object.keys(filter).forEach((key) => {
            const validFilterFields = {
                //'ProjeAdi': 'Proje.ProjeAdi',
                'DonemAdi': 'Donem.DonemAdi',
                'query': null // Genel arama için
            };

            if (key === 'query') {
                // Tüm alanlarda arama yap
                queryBuilder.andWhere(new Brackets(qb => {
                    qb.where('Donem.DonemAdi LIKE :searchTerm')
                        //.orWhere('Proje.ProjeAdi LIKE :searchTerm')
                        .orWhere('CAST(raporlar.Durum AS VARCHAR) LIKE :searchTerm')
                }), { searchTerm: `%${filter[key]}%` });
            } else if (validFilterFields[key]) {
                queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
            }
        });

        // Sıralama işlemi
        const allowedSortFields = ['DonemAdi', 'ID'];
        if (!allowedSortFields.includes(sort)) {
            throw new BadRequestException(`Geçersiz sıralama değeri: ${sort}`);
        }
        // Sıralama işlemi
        /*  if (sort === 'ProjeAdi') {
             queryBuilder.orderBy('Proje.ProjeAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
         } else  */

        if (sort === 'DonemAdi') {
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









    async getSurecKayitlari(userId: number, ID: number, Surec: 'Onay', Zaman: 'ay' | 'yil') {
        if (!ID && !Surec && !Zaman) {
            throw new BadRequestException('Döküman ID, sürec adı ve zaman dilimi gereklidir');
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
            const projerapor = await this.DokumanlarRepository
                .createQueryBuilder('rapor')
                .leftJoinAndSelect('rapor.Kullanici', 'Kullanici')
                .where('rapor.ID = :ID', { ID: ID }).getOne();


            if (projerapor) {
                if (projerapor.KullaniciID !== userId && user.KullaniciTipi === 1) {
                    throw new BadRequestException(`Bu rapor size ait değil.`);
                }
            }

            const queryBuilder = this.dataSource.getRepository(SurecKayitlari).createQueryBuilder('kayit')
                .leftJoinAndSelect('kayit.Surec', 'surec')
                .where('surec.IsDeleted != :isDeleted', { isDeleted: true });

            if (Zaman === 'ay') {
                if (Surec === 'Onay') {
                    queryBuilder.andWhere('surec.Anahtar = :anahtar', { anahtar: 'aylik-mp-dokuman-onay' });
                }
            } else {
                {
                    if (Surec === 'Onay') {
                        queryBuilder.andWhere('surec.Anahtar = :anahtar', { anahtar: 'yillik-mp-dokuman-onay' });
                    }
                }
            }
            queryBuilder.leftJoinAndSelect('kayit.Kullanici', 'kullanici');
            queryBuilder.leftJoinAndSelect('kayit.Adim', 'adim');
            queryBuilder.andWhere('kayit.ItemID = :itemid', { itemid: ID });


            const surecKayitlari = await queryBuilder.getMany();
            return surecKayitlari;
        } catch (error) {
            throw error;
        }
    }




    async getRaporItem(userId: number, ID: number, DonemID: number) {
        if (!ID && !DonemID) {
            throw new BadRequestException('Donem ID ve Dokuman ID gereklidir');
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
            const queryBuilder = this.DokumanlarRepository
                .createQueryBuilder('rapor')

            if (!ID) {
                queryBuilder.where('rapor.DonemID = :DonemID', { DonemID: DonemID });
                queryBuilder.andWhere('rapor.KullaniciID = :KullaniciID', { KullaniciID: userId });
            } else {
                if (ID === undefined) {
                    throw new BadRequestException(`ID geçerli bir değer olmalıdır`);
                }
                queryBuilder.where('rapor.ID = :ID', { ID: ID });
            }

            queryBuilder.leftJoinAndSelect('rapor.Kullanici', 'Kullanici');
            queryBuilder.leftJoinAndSelect('rapor.Donem', 'donem');




            const dokuman = await queryBuilder.getOne();

            if (!dokuman) return null;

            /*  if (user.KullaniciTipi === 3) {
                 if (projerapor?.KullaniciID === user.id) {
                     await this.createOrGetSurecKaydi('aylik-faaliyet-hakem-onay', userId, projerapor.ID);
                 } else if (projerapor?.KullaniciID === user.id) {
                     await this.createOrGetSurecKaydi('aylik-faaliyet-on-onay', userId, projerapor.RaporID);
                 }
             } */
            return dokuman
        } catch (error) {
            throw error;
        }
    }

    async getFileApi(
        userId: number,
        ID: number,
        belgeAdi: string
    ) {
        try {
            const user = await this.validateUser(userId);

            const dokuman = await this.DokumanlarRepository
                .createQueryBuilder('rapor')
                .leftJoinAndSelect('rapor.Kullanici', 'Kullanici')
                .leftJoinAndSelect('rapor.Donem', 'Donem')
                .where('rapor.ID = :raporId', { raporId: ID })
                .getOne();


            if (!dokuman) {
                throw new BadRequestException('Döküman kaydı bulunamadı.');
            }

            let pdfDataAnaliz = null;
            if (belgeAdi === 'SGKHizmet') {
                pdfDataAnaliz = await this.parsePDF(dokuman.SGKHizmet);
            }

            if (belgeAdi === 'MuhtasarVePrim') {
                pdfDataAnaliz = await this.getPdfBuffer(dokuman.MuhtasarVePrim);
            }

            if (belgeAdi === 'OnayliSGKHizmet') {
                pdfDataAnaliz = await this.parsePDF(dokuman.OnayliSGKHizmet);
            }

            if (belgeAdi === 'OnayliMuhtasarVePrim') {
                pdfDataAnaliz = await this.getPdfBuffer(dokuman.OnayliMuhtasarVePrim);
            }

            if (belgeAdi === 'SGKTahakkuk') {
                pdfDataAnaliz = await this.parsePDF(dokuman.SGKTahakkuk);
            }



            if (!pdfDataAnaliz) {
                throw new BadRequestException('Dosya okunamadı.');
            }

            if (belgeAdi === 'SGKHizmet') {
                const sgkHizmet: any = await this.analizService.sgkHizmetMp(pdfDataAnaliz.texts, dokuman.Donem);
                if ('error' in sgkHizmet) {
                    return await this.returnWithError(dokuman, 'error' in sgkHizmet ? sgkHizmet.error : 'Personel listesinde uyuşmazlıklar tespit edildi', 1, 'SGKHizmet');
                }
                return { sgkHizmet };
            }

            if (belgeAdi === 'MuhtasarVePrim') {
                const sgkParsed = await this.parsePDF(dokuman.SGKHizmet);
                const sgkHizmet = await this.analizService.sgkHizmetMp(sgkParsed.texts, dokuman.Donem);
                if ('error' in sgkHizmet) {
                    return await this.returnWithError(dokuman, 'error' in sgkHizmet ? sgkHizmet.error : 'Personel listesinde uyuşmazlıklar tespit edildi', 1, 'SGKHizmet');
                }

                // 3. Muhtasar Ve Prim PDF'ini analiz et
                const muhtasarParsed = await this.parseBufferToPages(pdfDataAnaliz);
                const muhtasar = await this.analizService.muhtasarVePrimMp(muhtasarParsed, dokuman.Donem, sgkHizmet.geciciListe ?? []);
                /*  if ('error' in muhtasar || ('personelListesi' in muhtasar && 'farklilar' in muhtasar.personelListesi && muhtasar.personelListesi.farklilar.length > 0)) {
                     const sonuc = await this.returnWithError(dokuman, 'error' in muhtasar ? muhtasar.error : 'Personel listesinde uyuşmazlıklar tespit edildi', 2, 'MuhtasarVePrim');
                     return { ...sonuc, muhtasar }
                 }
  */
                return { sgkHizmet, muhtasar };
            }

            if (belgeAdi === 'OnayliSGKHizmet') {
                const onayliSgkHizmet: any = await this.analizService.sgkHizmetMp(pdfDataAnaliz.texts, dokuman.Donem);
                if ('error' in onayliSgkHizmet) {
                    return await this.returnWithError(dokuman, 'error' in onayliSgkHizmet ? onayliSgkHizmet.error : 'Personel listesinde uyuşmazlıklar tespit edildi', 3, 'OnayliSGKHizmet');
                }
                return { onayliSgkHizmet };
            }

            if (belgeAdi === 'OnayliMuhtasarVePrim') {
                const sgkParsed = await this.parsePDF(dokuman.OnayliSGKHizmet);
                const sgkHizmet = await this.analizService.sgkHizmetMp(sgkParsed.texts, dokuman.Donem);
                if ('error' in sgkHizmet) {
                    return await this.returnWithError(dokuman, 'error' in sgkHizmet ? sgkHizmet.error : 'Personel listesinde uyuşmazlıklar tespit edildi', 3, 'OnayliSGKHizmet');
                }

                // 3. Muhtasar Ve Prim PDF'ini analiz et
                const muhtasarParsed = await this.parseBufferToPages(pdfDataAnaliz);
                const muhtasar = await this.analizService.muhtasarVePrimMp(muhtasarParsed, dokuman.Donem, sgkHizmet.geciciListe ?? []);
                /*  if ('error' in muhtasar || ('personelListesi' in muhtasar && 'farklilar' in muhtasar.personelListesi && muhtasar.personelListesi.farklilar.length > 0)) {
                     const sonuc = await this.returnWithError(dokuman, 'error' in muhtasar ? muhtasar.error : 'Personel listesinde uyuşmazlıklar tespit edildi', 4, 'OnayliMuhtasarVePrim');
                     return { ...sonuc, muhtasar }
                 }
  */
                return { sgkHizmet, muhtasar };
            }

            if (belgeAdi === 'SGKTahakkuk') {
                const sgkTahakkuk: any = await this.analizService.tahakkukFisiMp(pdfDataAnaliz.texts, dokuman.Donem);
                if ('error' in sgkTahakkuk) {
                    return await this.returnWithError(dokuman, sgkTahakkuk.error, 5, 'SGKTahakkuk');
                }
                return { sgkTahakkuk };
            }




        } catch (error) {
            throw new BadRequestException(
                error.message || 'Döküman kaydı çekme işlemi sırasında hata oluştu'
            );
        }

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

    private validateData(data: { DonemID: number, SiraNo: number, adim?: string }) {

        if (!data.DonemID || !data.SiraNo) {
            throw new BadRequestException('Dönem ID ve Sıra No zorunludur');
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



    private async getOrCreateProjeRaporu(data: CreateProjeRaporDto): Promise<Dokumanlar | null> {
        if (data.ID && data.ID > 0) {
            return this.DokumanlarRepository.findOne({
                where: { ID: data.ID },
                relations: ['Kullanici', 'Donem'],
            });

        } else {
            return await this.DokumanlarRepository.findOne({
                where: {
                    KullaniciID: data.KullaniciID,
                    DonemID: data.DonemID,
                },
                relations: ['Kullanici', 'Donem'],
            });
        }
    }


    private async getDonem(dokuman: Dokumanlar | null, data: CreateProjeRaporDto): Promise<Donem> {
        if (dokuman?.Donem) return dokuman.Donem;
        const donem = await this.dataSource.getRepository(Donem).findOne({ where: { DonemID: data.DonemID } });
        if (!donem) throw new BadRequestException('Dönem bulunamadı');
        return donem;
    }

    async newupload(
        userId: number,
        data: CreateProjeRaporDto,
        filePath?: string | null,
        isOrtagiList?: any
    ) {
        try {
            const user = await this.validateUser(userId);
            this.validateData(data);
            const buffer = filePath ? await this.getPdfBuffer(filePath) : null;
            const dokuman = await this.getOrCreateProjeRaporu(data);

            const seciliDonem = await this.getDonem(dokuman ?? null, data);

            switch (data.belgeAdi) {
                case 'SGKHizmet':
                    return await this.handleSGKHizmet(buffer, data, userId, filePath, dokuman ?? null, seciliDonem);
                case 'MuhtasarVePrim':
                    return await this.handleMuhtasarVePrim(buffer, data, userId, filePath, dokuman, seciliDonem, isOrtagiList);
                case 'OnayliSGKHizmet':
                    return await this.handleOnayliSGKHizmet(buffer, data, userId, filePath, dokuman, seciliDonem);
                case 'OnayliMuhtasarVePrim':
                    return await this.handleOnayliMuhtasarVePrim(buffer, data, userId, filePath, dokuman, seciliDonem, isOrtagiList);
                case 'SGKTahakkuk':
                    return await this.handleSGKTahakkuk(buffer, data, userId, filePath, dokuman, seciliDonem);
                case 'OnOnay':
                    return await this.handleOnOnay(data, userId, dokuman);
                default:
                    throw new BadRequestException('Geçersiz belge adı.');
            }
        } catch (error) {
            console.error('upload error', error);
            throw new BadRequestException(error.message || 'Döküman yükleme işlemi sırasında hata oluştu');
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

    private async getUpdatedReport(raporId: number) {
        const dokuman = await this.DokumanlarRepository
            .createQueryBuilder('dokuman')
            .leftJoinAndSelect('dokuman.Kullanici', 'Kullanici')
            .where('dokuman.ID = :raporId', { raporId })
            .getOne();

        return dokuman;
    }

    private async saveAndFetchReport(raporId: number) {
        return this.getUpdatedReport(raporId);
    }

    private async deleteOldFile(siraNo: number, dokuman: Dokumanlar) {
        const fileMap = {
            1: dokuman.SGKHizmet,
            2: dokuman.MuhtasarVePrim,
            3: dokuman.OnayliSGKHizmet,
            4: dokuman.OnayliMuhtasarVePrim,
            5: dokuman.SGKTahakkuk,

        };

        const oldFile = fileMap[siraNo];
        if (oldFile && fs.existsSync(oldFile)) {
            await fs.promises.unlink(oldFile);
        }
    }

    private updateReportFields(
        dokuman: Dokumanlar,
        data: any,
        userId: number,
        filePath: string | null
    ) {
        dokuman.DonemID = data.DonemID;
        if (data.SiraNo > dokuman.SurecSirasi || !dokuman.ID) {
            dokuman.SurecSirasi = data.SiraNo;
        }
        dokuman.Durum = data.SiraNo === 3 ? 'Tamamlandı' : 'Hazırlanıyor';
        dokuman.KullaniciID = userId;


        const newTamamlananlar = dokuman.Tamamlananlar ? JSON.parse(dokuman.Tamamlananlar) : [] as number[];
        dokuman.Tamamlananlar = JSON.stringify([...newTamamlananlar.filter(i => i !== data.islemSiraNo), data.islemSiraNo]);

        const newHatalar = dokuman.Hatalar ? JSON.parse(dokuman.Hatalar) : [] as { siraNo: number, error: string }[];
        dokuman.Hatalar = JSON.stringify([...newHatalar.filter(i => i.siraNo !== data.islemSiraNo)]);

        const fileMap = {
            1: 'SGKHizmet',
            2: 'MuhtasarVePrim',
            3: 'OnayliSGKHizmet',
            4: 'OnayliMuhtasarVePrim',
            5: 'SGKTahakkuk'
        };

        if (filePath && fileMap[data.islemSiraNo]) {
            dokuman[fileMap[data.islemSiraNo]] = filePath;
        }


        return dokuman;
    }

    private updateReportHatalar(
        dokuman: Dokumanlar,
        SiraNo: number,
        error: string,
    ) {
        const newTamamlananlar = dokuman && dokuman?.Tamamlananlar ? JSON.parse(dokuman.Tamamlananlar) : [] as number[];
        dokuman.Tamamlananlar = JSON.stringify([...newTamamlananlar.filter(i => i !== SiraNo)]);

        const newHatalar = dokuman && dokuman.Hatalar ? JSON.parse(dokuman.Hatalar) : [] as { siraNo: number, error: string }[];
        dokuman.Hatalar = JSON.stringify([...newHatalar.filter(i => i.siraNo !== SiraNo), { siraNo: SiraNo, error: error }]);
        return dokuman;
    }

    private async createNewReport(data: any, userId: number, filePath: string | null) {
        const kullanici = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: data.KullaniciID }
        });

        if (!kullanici) {
            throw new BadRequestException('Kullanıcı bulunamadı');
        }
        const dokuman = new Dokumanlar();
        return this.updateReportFields(dokuman, data, userId, filePath);
    }

    private async updateExistingReport(data: any, userId: number, filePath: string | null) {
        const dokuman = await this.DokumanlarRepository.findOne({
            where: { ID: data.ID }
        });

        if (!dokuman) {
            throw new BadRequestException('Döküman kaydı bulunamadı');
        }

        // Eski dosyayı sil
        if (filePath) {
            await this.deleteOldFile(data.islemSiraNo, dokuman);
        }


        // Rapor bilgilerini güncelle
        return this.updateReportFields(dokuman, data, userId, filePath);
    }


    private async returnWithError(
        dokuman: Dokumanlar,
        errorMsg: string,
        siraNo: number,
        belgeAdi: string
    ) {
        dokuman = this.updateReportHatalar(dokuman, siraNo, errorMsg);
        const saved = await this.saveAndFetchReport((await this.DokumanlarRepository.save(dokuman)).ID);
        return { error: errorMsg, belge: belgeAdi, dokuman: saved };
    }


    private async parseBufferToText(buffer: Buffer) {
        const tmpFile = tmp.fileSync({ postfix: '.pdf' });
        fs.writeFileSync(tmpFile.name, buffer);
        return await this.parsePDF(tmpFile.name);
    }
    private async handleSGKHizmet(
        buffer: Buffer,
        data: CreateProjeRaporDto,
        userId: number,
        filePath: string | null,
        dokuman: Dokumanlar | null,
        seciliDonem: Donem
    ) {

        if (!buffer) {
            return { error: 'PDF içeriği alınamadı', belge: 'SGKHizmet' };
        }


        const sgkParsed = await this.parseBufferToText(buffer);

        // Eğer önceden rapor ve Muhtasar yüklenmişse
        if (dokuman && dokuman?.MuhtasarVePrim) {
            if (dokuman.Onaylimi) {
                return { error: 'Onay işlemi tamamlanmış, değişiklik yapılamaz', belge: 'SGKHizmet' };
            }

            const sgkHizmet = await this.analizService.sgkHizmetMp(sgkParsed.texts, seciliDonem);
            if ('error' in sgkHizmet) {
                return await this.returnWithError(dokuman, 'error' in sgkHizmet ? sgkHizmet.error : 'Personel listesinde uyuşmazlıklar tespit edildi', 1, 'SGKHizmet');
            }

            const muhtasarParsed = await this.parsePDFPages(dokuman.MuhtasarVePrim);
            const muhtasar = await this.analizService.muhtasarVePrimMp(muhtasarParsed, seciliDonem, sgkHizmet.geciciListe ?? [], false);
            if ('error' in muhtasar || ('personelListesi' in muhtasar && 'farklilar' in muhtasar.personelListesi && muhtasar.personelListesi.farklilar.length > 0)) {
                return await this.returnWithError(dokuman, 'error' in muhtasar ? muhtasar.error : 'Personel listesinde uyuşmazlıklar tespit edildi', 2, 'MuhtasarVePrim');
            }

            const updated = await this.updateExistingReport({ ...data, islemSiraNo: 1 }, userId, filePath);
            const saved = await this.saveAndFetchReport((await this.DokumanlarRepository.save(updated)).ID);
            return { personelListesi: sgkHizmet, dokuman: saved };
        }

        const sgkHizmet = await this.analizService.sgkHizmetMp(sgkParsed.texts, seciliDonem);
        if ('error' in sgkHizmet) {
            const newRapor = dokuman ? dokuman : await this.createNewReport({ ...data, islemSiraNo: 1 }, userId, null);
            return await this.returnWithError(newRapor, 'error' in sgkHizmet ? sgkHizmet.error : 'Personel listesinde uyuşmazlıklar tespit edildi', 1, 'SGKHizmet');
        }

        const newRapor = await this.createNewReport({ ...data, islemSiraNo: 1 }, userId, filePath);
        const saved = await this.saveAndFetchReport((await this.DokumanlarRepository.save(newRapor)).ID);
        return { personelListesi: sgkHizmet, dokuman: saved };
    }

    private async parseBufferToPages(buffer: Buffer) {
        const tmpFile = tmp.fileSync({ postfix: '.pdf' });
        fs.writeFileSync(tmpFile.name, buffer);
        return await this.parsePDFPages(tmpFile.name);
    }

    private async handleMuhtasarVePrim(
        buffer: Buffer,
        data: CreateProjeRaporDto,
        userId: number,
        filePath: string | null,
        dokuman: Dokumanlar | null,
        seciliDonem: Donem,
        isOrtagiList?: any
    ) {
        if (!dokuman) {
            return { error: 'Doküman bulunamadı', belge: 'MuhtasarVePrim' };
        }

        if (dokuman.Onaylimi) {
            return { error: 'Onay işlemi tamamlanmış, değişiklik yapılamaz', belge: 'MuhtasarVePrim' };
        }

        if (!buffer) {
            return { error: 'PDF içeriği alınamadı', belge: 'MuhtasarVePrim' };
        }



        // 2. SGK Hizmet PDF'ini analiz et
        const sgkParsed = await this.parsePDF(dokuman.SGKHizmet);
        const sgkHizmet = await this.analizService.sgkHizmetMp(sgkParsed.texts, seciliDonem);
        if ('error' in sgkHizmet) {
            return await this.returnWithError(dokuman, 'error' in sgkHizmet ? sgkHizmet.error : 'Personel listesinde uyuşmazlıklar tespit edildi', 1, 'SGKHizmet');
        }

        // 3. Muhtasar Ve Prim PDF'ini analiz et
        const muhtasarParsed = await this.parseBufferToPages(buffer);
        const muhtasar = await this.analizService.muhtasarVePrimMp(muhtasarParsed, seciliDonem, sgkHizmet.geciciListe ?? [], isOrtagiList);
        if ('error' in muhtasar || ('personelListesi' in muhtasar && 'farklilar' in muhtasar.personelListesi && muhtasar.personelListesi.farklilar.length > 0)) {
            const sonuc = await this.returnWithError(dokuman, 'error' in muhtasar ? muhtasar.error : 'Personel listesinde uyuşmazlıklar tespit edildi', 2, 'MuhtasarVePrim');
            return { ...sonuc, muhtasar }
        }

        const updated = await this.updateExistingReport({ ...data, islemSiraNo: 2 }, userId, filePath);
        const saved = await this.saveAndFetchReport((await this.DokumanlarRepository.save(updated)).ID);
        return { personelListesi: muhtasar, projeRaporu: saved };
    }

    private async handleOnayliSGKHizmet(
        buffer: Buffer,
        data: CreateProjeRaporDto,
        userId: number,
        filePath: string | null,
        dokuman: Dokumanlar | null,
        seciliDonem: Donem
    ) {

        if (!buffer) {
            return { error: 'PDF içeriği alınamadı', belge: 'OnayliSGKHizmet' };
        }


        const sgkParsed = await this.parseBufferToText(buffer);

        // Eğer önceden rapor ve Muhtasar yüklenmişse
        if (dokuman && dokuman?.OnayliMuhtasarVePrim) {
            if (dokuman.Onaylimi) {
                return { error: 'Onay işlemi tamamlanmış, değişiklik yapılamaz', belge: 'OnayliSGKHizmet' };
            }

            const sgkHizmet = await this.analizService.sgkHizmetMp(sgkParsed.texts, seciliDonem);
            if ('error' in sgkHizmet) {
                return await this.returnWithError(dokuman, 'error' in sgkHizmet ? sgkHizmet.error : 'Personel listesinde uyuşmazlıklar tespit edildi', 3, 'OnayliSGKHizmet');
            }

            const muhtasarParsed = await this.parsePDFPages(dokuman.OnayliMuhtasarVePrim);
            const muhtasar = await this.analizService.muhtasarVePrimMp(muhtasarParsed, seciliDonem, sgkHizmet.geciciListe ?? [], false);
            if ('error' in muhtasar || ('personelListesi' in muhtasar && 'farklilar' in muhtasar.personelListesi && muhtasar.personelListesi.farklilar.length > 0)) {
                return await this.returnWithError(dokuman, 'error' in muhtasar ? muhtasar.error : 'Personel listesinde uyuşmazlıklar tespit edildi', 4, 'OnayliMuhtasarVePrim');
            }

            const updated = await this.updateExistingReport({ ...data, islemSiraNo: 3 }, userId, filePath);
            const saved = await this.saveAndFetchReport((await this.DokumanlarRepository.save(updated)).ID);
            return { personelListesi: sgkHizmet, dokuman: saved };
        }

        const sgkHizmet = await this.analizService.sgkHizmetMp(sgkParsed.texts, seciliDonem);
        if ('error' in sgkHizmet) {
            return await this.returnWithError(dokuman, 'error' in sgkHizmet ? sgkHizmet.error : 'Personel listesinde uyuşmazlıklar tespit edildi', 3, 'OnayliSGKHizmet');
        }

        const updated = await this.updateExistingReport({ ...data, islemSiraNo: 3 }, userId, filePath);
        const saved = await this.saveAndFetchReport((await this.DokumanlarRepository.save(updated)).ID);
        return { personelListesi: sgkHizmet, dokuman: saved };
    }

    private async handleOnayliMuhtasarVePrim(
        buffer: Buffer,
        data: CreateProjeRaporDto,
        userId: number,
        filePath: string | null,
        dokuman: Dokumanlar | null,
        seciliDonem: Donem,
        isOrtagiList?: any
    ) {
        if (!dokuman) {
            return { error: 'Doküman bulunamadı', belge: 'OnayliMuhtasarVePrim' };
        }

        if (dokuman.Onaylimi) {
            return { error: 'Onay işlemi tamamlanmış, değişiklik yapılamaz', belge: 'OnayliMuhtasarVePrim' };
        }

        if (!buffer) {
            return { error: 'PDF içeriği alınamadı', belge: 'OnayliMuhtasarVePrim' };
        }



        // 2. SGK Hizmet PDF'ini analiz et
        const sgkParsed = await this.parsePDF(dokuman.OnayliSGKHizmet);
        const sgkHizmet = await this.analizService.sgkHizmetMp(sgkParsed.texts, seciliDonem);
        if ('error' in sgkHizmet) {
            return await this.returnWithError(dokuman, 'error' in sgkHizmet ? sgkHizmet.error : 'Personel listesinde uyuşmazlıklar tespit edildi', 3, 'OnayliSGKHizmet');
        }

        // 3. Muhtasar Ve Prim PDF'ini analiz et
        const muhtasarParsed = await this.parseBufferToPages(buffer);
        const muhtasar = await this.analizService.muhtasarVePrimMp(muhtasarParsed, seciliDonem, sgkHizmet.geciciListe ?? [], isOrtagiList);
        if ('error' in muhtasar || ('personelListesi' in muhtasar && 'farklilar' in muhtasar.personelListesi && muhtasar.personelListesi.farklilar.length > 0)) {
            const sonuc = await this.returnWithError(dokuman, 'error' in muhtasar ? muhtasar.error : 'Personel listesinde uyuşmazlıklar tespit edildi', 4, 'OnayliMuhtasarVePrim');
            return { ...sonuc, muhtasar }
        }

        const updated = await this.updateExistingReport({ ...data, islemSiraNo: 4 }, userId, filePath);
        const saved = await this.saveAndFetchReport((await this.DokumanlarRepository.save(updated)).ID);
        return { personelListesi: muhtasar, projeRaporu: saved };
    }

    private async handleSGKTahakkuk(
        buffer: Buffer,
        data: CreateProjeRaporDto,
        userId: number,
        filePath: string | null,
        dokuman: Dokumanlar | null,
        seciliDonem: Donem
    ) {

        if (!buffer) {
            return { error: 'PDF içeriği alınamadı', belge: 'SGKTahakkuk' };
        }


        const sgkTahakkukParsed = await this.parseBufferToText(buffer);

        if (dokuman.Onaylimi) {
            return { error: 'Onay işlemi tamamlanmış, değişiklik yapılamaz', belge: 'SGKTahakkuk' };
        }


        const sgkTahakkuk = await this.analizService.tahakkukFisiMp(sgkTahakkukParsed.texts, seciliDonem);
        if ('error' in sgkTahakkuk) {
            return await this.returnWithError(dokuman, sgkTahakkuk.error, 5, 'SGKTahakkuk');
        }

        const updated = await this.updateExistingReport({ ...data, islemSiraNo: 5 }, userId, filePath);
        const saved = await this.saveAndFetchReport((await this.DokumanlarRepository.save(updated)).ID);
        return { data: sgkTahakkuk, dokuman: saved };
    }

    private async handleOnOnay(
        data: CreateProjeRaporDto,
        userId: number,
        dokuman: Dokumanlar
    ) {
        if (!dokuman) {
            return { error: 'Döküman kaydı bulunamadı', belge: 'Onay' };
        }

        if (dokuman.Onaylimi) {
            return { error: 'Onay işlemi tamamlanmış, değişiklik yapılamaz', belge: 'Onay' };
        }
        try {
            dokuman = await this.updateStatusReport1(dokuman, data.belgeAdi);

            const hedefKullaniciId = (await this.dataSource.getRepository(Kullanicilar).findOne({ where: { KullaniciTipi: 2 } }))?.id ?? null;
            if (hedefKullaniciId) {
                await this.sendNotificationToUser(
                    'onay-icin-dokuman-gonderildi',
                    hedefKullaniciId,
                    {
                        FirmaAdi: dokuman.Kullanici?.FirmaAdi || '',
                        DonemAdi: dokuman.Donem?.DonemAdi || '',
                        ProjeAdi: 'Eklenecek',
                        DokumanKaydiID: dokuman.ID.toString() || '',
                        YonlendirmeURL: `${process.env.FRONTEND_URL}/dokuman-yukleme-kayitlari/detay/${dokuman.ID.toString()}`
                    }
                );
            }

            const surec = await this.dataSource.getRepository(Surecler).findOne(
                {
                    where: { Anahtar: 'aylik-mp-dokuman-onay', IsDeleted: false },
                    relations: { Adimlar: true }
                });

            const adimId = surec?.Adimlar.find(a => a.SiraNo === 1).ID ?? null;
            if (surec && adimId) {
                await this.dataSource.getRepository(SurecKayitlari).save({
                    SurecID: surec.ID,
                    AdimID: adimId,
                    ItemID: data.ID,
                    KullaniciID: userId,
                    Durum: 'Tamamlandı',
                    Aciklama: 'Onaya gönderildi',
                    BaslamaZamani: new Date(),
                    BitirmeZamani: new Date()
                });
            } else {
                throw new BadRequestException('Onay süreci başlatılamadı.');
            }


            const saved = await this.saveAndFetchReport((await this.DokumanlarRepository.save(dokuman)).ID);
            return { dokuman: saved };

        } catch (error) {
            throw error
        }
    }

    private async updateStatusReport1(dokuman: Dokumanlar, belgeAdi: string) {
        if (!dokuman) {
            throw new BadRequestException('Döküman kaydı bulunamadı');
        }


        // Rapor bilgilerini güncelle
        dokuman.Durum = (belgeAdi === 'Onay') ? 'Onay Sürecinde' : 'Hazırlanıyor';
        dokuman.SurecSirasi = 3;
        return dokuman
    }

    async sendNotificationToUser(Anahtar: string, userId: number,
        data: { DonemAdi: string, FirmaAdi: string, ProjeAdi: string, DokumanKaydiID: string, Durum?: string, YonlendirmeURL?: string }): Promise<void> {
        /* const template = await this.dataSource.getRepository(Bildirimler)
            .findOne({ where: { Anahtar: Anahtar, IsDeleted: false } });
        if (!template) {
            throw new BadRequestException('Bildirim şablonu bulunamadı.');
        } */
        if (!userId) {
            throw new BadRequestException('Bildirim gönderilecek kullanıcı bulunamadı. Lütfen destek talebi oluşturun.');
        }
        const user = await this.dataSource.getRepository(Kullanicilar).findOne({ where: { id: userId } });
        if (!user) {
            throw new BadRequestException('Bildirim gönderilecek kullanıcı bulunamadı. Lütfen destek talebi oluşturun.');
        }
        /* let body = template.Icerik;
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
        } */
        /* const newNotification = await this.dataSource.getRepository(KullaniciBildirimleri).save({
            KullaniciID: user.id,
            BildirimID: template.BildirimID,
            Baslik: subject,
            Link: link,
            MobilLink: template.MobilLink,
            Icerik: body,
            Durum: 'Gönderildi',
        }); */

        // Kullanıcıya anlık bildirim gönder
        /* this.appGateway.sendNotificationToUser(user.id, newNotification); */

        try {
            await this.mailService.sendEmailWithTemplate(
                Anahtar, // Şablon ismi
                {
                    KullaniciAdi: user.AdSoyad,
                    DokumanKaydiID: data.DokumanKaydiID,
                    DonemAdi: data.DonemAdi,
                    FirmaAdi: data.FirmaAdi,
                    ProjeAdi: data.ProjeAdi,
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
            const projeRaporu = await this.DokumanlarRepository.findOne({
                where: { ID:RaporID },
                relations: { Donem: true }
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
                    await this.DokumanlarRepository.save({ ...projeRaporu, OnOnay: true, Durum: 'Hazırlanıyor' })
                } else {
                    await this.DokumanlarRepository.save({ ...projeRaporu, Durum: 'Hazırlanıyor' })
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
                    await this.DokumanlarRepository.save({ ...projeRaporu, OnOnay: true, Durum: 'Hazırlanıyor' })
                } else {
                    await this.DokumanlarRepository.save({ ...projeRaporu, Durum: 'Hazırlanıyor' })
                }
            }

            await this.sendNotificationToUser(
                'onay-icin-sonuc-bildirimi',
                projeRaporu.KullaniciID,
                {
                    FirmaAdi: projeRaporu.Kullanici?.FirmaAdi || '',
                    ProjeAdi: 'Proje Eklenecek --',
                    DonemAdi: projeRaporu.Donem?.DonemAdi || '',
                    DokumanKaydiID: projeRaporu.ID.toString() || '',
                    Durum: durum === 'onaylandi' ? 'Onaylandı' : 'Reddedildi',
                    YonlendirmeURL: `${process.env.FRONTEND_URL}/aylik-faaliyet-raporlari/edit/${projeRaporu.ID.toString()}`
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
}
