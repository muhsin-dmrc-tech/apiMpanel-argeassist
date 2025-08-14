import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Firma } from './entities/firma.entity';
import { Brackets, DataSource, Not, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { CreateFirmaDto } from './dto/create.dto';
import { UpdateFirmaDto } from './dto/update.dto';
import { FirmaAbonelikleri } from 'src/firma-abonelikleri/entities/firma-abonelikleri.entity';
import { Personel } from 'src/personel/entities/personel.entity';
import * as fs from 'fs';
import * as path from 'path';
import { FirmaBilgileri } from './entities/firma-bilgileri.entity';
import { FirmaBilgileriSubeler } from './entities/firma-bilgileri-subeler.entity';

@Injectable()
export class FirmalarService {
    constructor(
        @InjectRepository(Firma)
        private readonly firmaRepository: Repository<Firma>,
        private readonly dataSource: DataSource
    ) { }


    async getTeknoFirmaDetay(userId: number, FirmaID: number, IliskiID: number | null) {
        if (!FirmaID) {
            throw new BadRequestException('Firma ID zorunludur');
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
            if (!IliskiID) {
                throw new BadRequestException('İlişki ID gereklidir');
            }
        }

        if (user.KullaniciTipi !== 2) {
            const teknokentKullanici = await this.dataSource.getRepository(Personel).findOne({
                where: { KullaniciID: userId, Tip: user.KullaniciTipi === 3 ? 3 : 1, IliskiID },
            });
            if (!teknokentKullanici) {
                throw new BadRequestException('İlişki ID gereklidir');
            }
        }

        try {
            const rows = await this.dataSource
                .getRepository(Firma)
                .createQueryBuilder("firma")
                .where("firma.IsDeleted = :isDeleted", { isDeleted: false })
                .andWhere("firma.FirmaID = :FirmaID", { FirmaID: FirmaID })
                .leftJoinAndMapOne('firma.FirmaBilgisi', FirmaBilgileri, 'firmaBilgileri', 'firmaBilgileri.IliskiID = firma.FirmaID')
                .leftJoinAndSelect('firmaBilgileri.Subeler', 'subeler')
                .addSelect(
                    `(SELECT COUNT(*) FROM Personel WHERE Personel.KullaniciID IS NOT NULL AND Personel.IliskiID = firma.FirmaID AND Personel.IsDeleted != 1)`,
                    'KullaniciSayisi'
                )
                .addSelect(
                    `(SELECT COUNT(*) FROM Projeler WHERE Projeler.FirmaID = firma.FirmaID AND Projeler.IsDeleted != 1)`,
                    'ProjeSayisi'
                )
                .addSelect(
                    `(SELECT COUNT(*) FROM ProjeBasvuru WHERE ProjeBasvuru.FirmaID = firma.FirmaID AND ProjeBasvuru.IsDeleted != 1)`,
                    'ProjeBasvuruSayisi'
                )
                .getRawMany();

            if (!rows || rows.length === 0) {
                throw new BadRequestException("Firma bulunamadı");
            }
            const first = rows[0];
            // Şubeleri gruplandır
            const subeler = rows.map((row) => ({
                SubeID: row.subeler_SubeID,
                SubeAdi: row.subeler_SubeAdi,
                Adres: row.subeler_Adres,
                Telefon: row.subeler_Telefon,
                Email: row.subeler_Email,
                Il: row.subeler_Il,
                Ilce: row.subeler_Ilce,
                Ulke: row.subeler_Ulke,
                AnaSubemi: row.subeler_AnaSubemi,
            }));
            return {
                FirmaID: first.firma_FirmaID,
                FirmaAdi: first.firma_FirmaAdi,
                PortalKullaniciAdi: first.firma_PortalKullaniciAdi,
                PortalLinki: first.firma_PortalLinki,
                PortalSifre: first.firma_PortalSifre,
                IsDeleted: first.firma_IsDeleted,
                MesaiBaslangic: first.firma_MesaiBaslangic,
                MesaiBitis: first.firma_MesaiBitis,
                CalismaGunleri: first.firma_CalismaGunleri,
                KullaniciSayisi: first.KullaniciSayisi,
                ProjeSayisi: first.ProjeSayisi,
                ProjeBasvuruSayisi: first.ProjeBasvuruSayisi,
                FirmaBilgisi: {
                    IliskiID: first.firmaBilgileri_IliskiID,
                    Tip: first.firmaBilgileri_Tip,
                    WebSitesi: first.firmaBilgileri_WebSitesi,
                    TemsilciAdi: first.firmaBilgileri_TemsilciAdi,
                    TemsilciUnvani: first.firmaBilgileri_TemsilciUnvani,
                    TemsilciTelefon: first.firmaBilgileri_TemsilciTelefon,
                    TemsilciEmail: first.firmaBilgileri_TemsilciEmail,
                    Sektor: first.firmaBilgileri_Sektor,
                    KurulusYili: first.firmaBilgileri_KurulusYili,
                    CalisanSayisi: first.firmaBilgileri_CalisanSayisi,
                    KisaTanitim: first.firmaBilgileri_KisaTanitim,
                    FirmaAciklamasi: first.firmaBilgileri_FirmaAciklamasi,
                    Linkedin: first.firmaBilgileri_Linkedin,
                    Logo: first.firmaBilgileri_Logo,
                    Subeler: subeler.filter(s => s.SubeID != null), // null olmayanları filtrele
                },

            }



        } catch (error) {
            throw error;
        }

    }








    async getFirma(userId: number, FirmaID: number) {
        try {
            const firma = await this.dataSource
                .getRepository(Firma)
                .createQueryBuilder("firma")
                .leftJoinAndMapMany("firma.Kullanicilar", Personel, "personel",
                    "personel.IliskiID = firma.FirmaID AND personel.IsDeleted != 1 AND personel.KullaniciID  IS NOT NULL")
                .leftJoinAndMapOne("firma.FirmaBilgisi", FirmaBilgileri, "firmaBilgileri",
                    "firmaBilgileri.IliskiID = firma.FirmaID AND firmaBilgileri.Tip = 1")
                .leftJoinAndSelect("firmaBilgileri.Subeler", "subeler")
                .where("firma.IsDeleted = :isDeleted", { isDeleted: false })
                .andWhere("firma.FirmaID = :FirmaID", { FirmaID: FirmaID })
                .andWhere("personel.KullaniciID = :KullaniciID", { KullaniciID: userId })
                .getOne();

            if (!firma) {
                throw new BadRequestException('Firma bulunamadı');
            }

            return firma;
        } catch (error) {
            throw error;
        }
    }

    async getFirmaKullanicilari(userId: number, FirmaID: number) {
        try {
            const kullanicilar = await this.dataSource.getRepository(Personel)
                .createQueryBuilder('kullaniciFirmalari')
                .leftJoinAndMapOne('kullaniciFirmalari.Firma', Firma, 'Firma', 'Firma.FirmaID = kullaniciFirmalari.IliskiID AND Firma.IsDeleted != 1')
                .leftJoinAndSelect('kullaniciFirmalari.Kullanici', 'Kullanici')
                .where('kullaniciFirmalari.IliskiID = :FirmaID', { FirmaID: FirmaID })
                .getMany();

            if (!kullanicilar) {
                throw new BadRequestException('Kullanıcı bulunamadı');
            }

            return kullanicilar;
        } catch (error) {
            throw error;
        }
    }


    async getActiveFirmalar(userId: number) {
        try {
            const firmalar = await this.dataSource
                .getRepository(Firma)
                .createQueryBuilder("firma")
                .leftJoinAndMapMany('firma.Kullanicilar', Personel, 'ownerPersonel',
                    'ownerPersonel.KullaniciID IS NOT NULL AND ownerPersonel.IliskiID = firma.FirmaID AND ownerPersonel.IsDeleted != 1')
                .leftJoinAndSelect('ownerPersonel.Kullanici', 'Kullanicilar')
                .where("firma.IsDeleted != :isDeleted", { isDeleted: true })
                .andWhere("Kullanicilar.KullaniciID = :KullaniciID", { KullaniciID: userId })
                .getMany();
            return firmalar;
        } catch (error) {
            throw new Error(error)
        }
    }

    async teknokentActiveFirmalar(userId: number, TeknokentID: number) {
        if (!TeknokentID) {
            throw new BadRequestException('Teknokent ID gereklidir');
        }
        try {
            const firmalar = await this.dataSource
                .getRepository(Firma)
                .createQueryBuilder("firma")
                .leftJoin("firma.Projeler", "projeler")
                .leftJoin("firma.ProjeBasvurulari", "projeBasvurulari")
                .where("firma.IsDeleted != :isDeleted", { isDeleted: true })
                .andWhere(
                    new Brackets(qb => {
                        qb.where("projeler.TeknokentID = :TeknokentID", { TeknokentID })
                            .orWhere("projeBasvurulari.TeknokentID = :TeknokentID", { TeknokentID });
                    })
                )
                .getMany();

            return firmalar;
        } catch (error) {
            throw new Error(error)
        }
    }

    async getFirmalar(userId: number, query: any) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'FirmaAdi';
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

            const queryBuilder = this.dataSource.getRepository(Firma)
                .createQueryBuilder('firma')
                .select([
                    'firma.FirmaID',
                    'firma.FirmaAdi',
                    'firma.PortalLinki',
                    'firma.PortalKullaniciAdi',
                    'firma.PortalSifre',
                    'firma.IsDeleted',
                    'firma.CalismaGunleri'
                ])
                .addSelect(
                    `(SELECT COUNT(*) FROM Personel WHERE Personel.KullaniciID IS NOT NULL AND Personel.IliskiID = firma.FirmaID AND Personel.IsDeleted != 1)`,
                    'KullaniciSayisi'
                )
                .addSelect(`CONVERT(VARCHAR, firma.MesaiBaslangic, 108)`, 'MesaiBaslangic')
                .addSelect(`CONVERT(VARCHAR, firma.MesaiBitis, 108)`, 'MesaiBitis')

                // Kullanıcı ile firma arasında ilişki kur
                .leftJoinAndMapMany('firma.Kullanicilar', Personel, 'ownerPersonel',
                    'ownerPersonel.KullaniciID IS NOT NULL AND ownerPersonel.IliskiID = firma.FirmaID AND ownerPersonel.IsDeleted != 1')
                .innerJoin('ownerPersonel.Kullanici', 'kullanici')
                .where('ownerPersonel.KullaniciID = :KullaniciID', { KullaniciID: userId });





            // Filtreleme işlemi
            Object.keys(filter).forEach((key) => {
                const validFilterFields = {
                    'FirmaAdi': 'firma.FirmaAdi',
                    'PortalLinki': 'firma.PortalLinki',
                    'PortalKullaniciAdi': 'firma.PortalKullaniciAdi',
                    'query': null // Genel arama için
                };

                if (key === 'query') {
                    // Tüm alanlarda arama yap
                    queryBuilder.andWhere(new Brackets(qb => {
                        qb.where('CAST(firma.FirmaAdi AS VARCHAR) LIKE :searchTerm')
                            .orWhere('CAST(firma.PortalLinki AS VARCHAR) LIKE :searchTerm')
                            .orWhere('CAST(firma.PortalKullaniciAdi AS VARCHAR) LIKE :searchTerm')
                    }), { searchTerm: `%${filter[key]}%` });
                } else if (validFilterFields[key]) {
                    queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
                }
            });

            // Sıralama işlemi
            const validSortFields = ['FirmaAdi', 'PortalLinki', 'PortalKullaniciAdi'];
            if (sort && validSortFields.includes(sort)) {
                queryBuilder.orderBy(`firma.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            }

            queryBuilder.skip((page - 1) * limit).take(limit);

            const { raw } = await queryBuilder.getRawAndEntities();
            const firma = raw;
            const total = await queryBuilder.getCount();
            return {
                data: firma.map(f => ({
                    FirmaID: f.firma_FirmaID,
                    FirmaAdi: f.firma_FirmaAdi,
                    PortalKullaniciAdi: f.firma_PortalKullaniciAdi,
                    PortalLinki: f.firma_PortalLinki,
                    PortalSifre: f.firma_PortalSifre,
                    IsDeleted: f.firma_IsDeleted,
                    MesaiBaslangic: f.MesaiBaslangic,
                    MesaiBitis: f.MesaiBitis,
                    KullaniciSayisi: f.KullaniciSayisi,
                    CalismaGunleri: f.firma_CalismaGunleri
                })),
                total,
                page,
                lastPage: Math.ceil(total / limit),
            };
        } catch (error) {
            throw new Error(error)
        }

    }

    async getFirmaSubeleri(userId: number, BilgiID: number, query: any) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'FirmaAdi';
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

        if (!BilgiID || BilgiID < 1) {
            throw new BadRequestException('Bilgi ID gereklidir');
        }

        const firmaBilgisi = await this.dataSource.getRepository(FirmaBilgileri).findOne({
            where: { BilgiID: BilgiID },
        });
        if (!firmaBilgisi) {
            throw new BadRequestException('Firma bilgisi bulunamadı');
        }

        /*  const firmaKullanici = await this.dataSource.getRepository(Personel).findOne({
             where: { KullaniciID: userId, Tip: 1, IliskiID: firmaBilgisi.IliskiID },
         });
         if (!firmaKullanici || firmaKullanici.Rol !== 'owner') {
             throw new ForbiddenException('Yetkisiz kullanıcı');
         } */


        try {

            const queryBuilder = this.dataSource.getRepository(FirmaBilgileriSubeler)
                .createQueryBuilder('sube')
                .leftJoinAndSelect('sube.FirmaBilgisi', 'firmaBilgisi')
                .where('sube.BilgiID = :BilgiID', { BilgiID });





            // Filtreleme işlemi
            Object.keys(filter).forEach((key) => {
                const validFilterFields = {
                    'SubeAdi': 'sube.SubeAdi',
                    'Il': 'sube.Il',
                    'Ilce': 'sube.Ilce',
                    'query': null // Genel arama için
                };

                if (key === 'query') {
                    // Tüm alanlarda arama yap
                    queryBuilder.andWhere(new Brackets(qb => {
                        qb.where('CAST(sube.SubeAdi AS VARCHAR) LIKE :searchTerm')
                            .orWhere('CAST(sube.Il AS VARCHAR) LIKE :searchTerm')
                            .orWhere('CAST(sube.Ilce AS VARCHAR) LIKE :searchTerm')
                    }), { searchTerm: `%${filter[key]}%` });
                } else if (validFilterFields[key]) {
                    queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
                }
            });

            // Sıralama işlemi
            const validSortFields = ['SubeAdi', 'Il', 'Ilce'];
            if (sort && validSortFields.includes(sort)) {
                queryBuilder.orderBy(`sube.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            }

            queryBuilder.skip((page - 1) * limit).take(limit);

            const [sube, total] = await queryBuilder.getManyAndCount();
            return {
                data: sube,
                total,
                page,
                lastPage: Math.ceil(total / limit),
            };
        } catch (error) {
            throw new Error(error)
        }

    }


    async upload(userId: number, data: UpdateFirmaDto, filePath: string | null) {
        if (!userId) {
            throw new BadRequestException(`Kullanıcı ID gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let oldImagePath: string | null = null;
        let firma: Firma | null = null;
        try {
            // Firma oluşturma
            if (!data.FirmaID || data.FirmaID < 1) {
                firma = await queryRunner.manager.save(Firma, {
                    FirmaAdi: data.FirmaAdi,
                    PortalKullaniciAdi: data.PortalKullaniciAdi,
                    PortalLinki: data.PortalLinki,
                    PortalSifre: data.PortalSifre,
                    MesaiBaslangic: data.MesaiBaslangic,
                    MesaiBitis: data.MesaiBitis,
                    CalismaGunleri: data.CalismaGunleri
                });
                // Kullanıcı Firma Bağlantısını Kaydetme
                await queryRunner.manager.save(Personel, {
                    IliskiID: firma.FirmaID,
                    KullaniciID: userId,
                    Rol: 'owner',
                    AdSoyad: user.AdSoyad,
                    IseGirisTarihi: new Date(),
                    MesaiBaslangic: data.MesaiBaslangic,
                    MesaiBitis: data.MesaiBitis,
                    Tip: 1 // Firma tipi
                });
            } else {
                firma = await this.firmaRepository.createQueryBuilder('firma')
                    .where('firma.FirmaID = :FirmaID', { FirmaID: data.FirmaID })
                    .leftJoinAndMapOne('firma.FirmaBilgisi', FirmaBilgileri, 'firmaBilgisi',
                        'firmaBilgisi.IliskiID = firma.FirmaID AND firmaBilgisi.Tip = 1')
                    .leftJoinAndMapMany('firma.Kullanicilar', Personel, 'ownerPersonel',
                        'ownerPersonel.KullaniciID IS NOT NULL AND ownerPersonel.IliskiID = firma.FirmaID AND ownerPersonel.IsDeleted != 1')
                    .getOne();

                if (!firma) {
                    throw new BadRequestException(`Firma bulunamadı`);
                }
                // Kullanıcının bu firmaya yetkisi olup olmadığını kontrol et
                const kullaniciYetkili = firma.Kullanicilar.some(kullanici => kullanici.KullaniciID === userId);
                if (!kullaniciYetkili) {
                    throw new BadRequestException(`Bu firma üzerinde yetkiniz yok`);
                }
                try {
                    // Firma güncelle
                    await queryRunner.manager.getRepository(Firma).update({ FirmaID: firma.FirmaID }, {
                        FirmaAdi: data.FirmaAdi,
                        PortalKullaniciAdi: data.PortalKullaniciAdi,
                        PortalLinki: data.PortalLinki,
                        PortalSifre: data.PortalSifre,
                        MesaiBaslangic: data.MesaiBaslangic,
                        MesaiBitis: data.MesaiBitis,
                        CalismaGunleri: data.CalismaGunleri
                    });
                } catch (error) {
                    console.error('Firma güncelleme hatası:', error);
                }
            }

            // FirmaBilgisi işlemleri
            let logoimage = firma?.FirmaBilgisi?.Logo || null;
            if (filePath) {
                if (firma?.FirmaBilgisi?.Logo) {
                    oldImagePath = firma.FirmaBilgisi.Logo.replace('/public/', '');
                }
                logoimage = `${filePath}`;
            }

            const firmaBilgisiRepo = queryRunner.manager.getRepository(FirmaBilgileri);
            let firmaBilgisi = await firmaBilgisiRepo.findOne({ where: { IliskiID: firma.FirmaID, Tip: 1 } });
            function temizle(obj: any) {
                const temizObj = {};
                for (const key in obj) {
                    const value = obj[key];

                    // 0, false, '0' gibi değerler korunmalı ama boş string veya null/undefined temizlenmeli
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
                IliskiID: firma.FirmaID,
                Tip: 1,
                Logo: logoimage,
                Linkedin: data.Linkedin,
                Sektor: data.Sektor,
                KurulusYili: data.KurulusYili ? new Date(data.KurulusYili) : null,
                WebSitesi: data.WebSitesi,
                CalisanSayisi: data.CalisanSayisi,
                KisaTanitim: data.KisaTanitim,
                FirmaAciklamasi: data.FirmaAciklamasi,
                TemsilciAdi: data.TemsilciAdi,
                TemsilciUnvani: data.TemsilciUnvani,
                TemsilciEmail: data.TemsilciEmail,
                TemsilciTelefon: data.TemsilciTelefon,
            });
            let yeniFirmaBilgisi = null;
            if (firmaBilgisi) {
                if (!yeniBilgi || Object.keys(yeniBilgi).length === 0) {
                    console.log('Güncellenecek bilgi yok, update atlanıyor');
                } else {
                    await firmaBilgisiRepo.save({ ...firmaBilgisi, ...yeniBilgi });
                }
            } else {
                yeniFirmaBilgisi = await firmaBilgisiRepo.save(yeniBilgi);
            }

            if (yeniFirmaBilgisi?.BilgiID) {
                const firmaSubesiRepo = queryRunner.manager.getRepository(FirmaBilgileriSubeler);
                const merkezSube = {
                    SubeAdi: 'Merkez',
                    BilgiID: yeniFirmaBilgisi.BilgiID,
                    Il: '-',
                    Ilce: '-',
                    Ulke: 'Türkiye',
                    AnaSubemi: true // Merkez şube olarak işaretle
                };

                await firmaSubesiRepo.save(merkezSube);
            }


            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw new BadRequestException(error.message || 'Firma düzenleme hatası');
        } finally {
            await queryRunner.release();
        }

        // Transaction başarılı ise eski logo dosyasını sil
        if (oldImagePath) {
            const fullPath = path.join(process.cwd(), 'public', oldImagePath);
            try {
                if (fs.existsSync(fullPath)) {
                    await fs.promises.unlink(fullPath);
                }
            } catch (err) {
                console.error('Dosya silme hatası:', err);
            }
        }

        // Sonuç döndür
        const queyfirma = await this.firmaRepository.createQueryBuilder('firma')
            .where('firma.FirmaID = :FirmaID', { FirmaID: firma.FirmaID })
            .leftJoinAndMapOne('firma.FirmaBilgisi', FirmaBilgileri, 'firmaBilgisi', 'firmaBilgisi.IliskiID = firma.FirmaID AND firmaBilgisi.Tip = 1')
            .getOne();

        return queyfirma;
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




        try {
            const firma = await this.firmaRepository.findOne({
                where: { FirmaID: data.itemId },
                relations: ['Kullanicilar']
            });
            if (firma) {
                const kullaniciYetkili = firma.Kullanicilar.some(kullanici => kullanici.KullaniciID === userId);
                if (!kullaniciYetkili) {
                    throw new BadRequestException(`Bu firma üzerinde yetkiniz yok`);
                }
                /* const firmaAboneligi = await this.dataSource.getRepository(FirmaAbonelikleri).findOne({ where: { FirmaID: data.itemId, Durum: 'Aktif' } });
 
                if (firmaAboneligi && !data.AbonelikSil) {
                    return {
                        status: 217,
                        abonelikBulundu: true,
                        message: 'Aktif Abonelik Bulundu. Firma Silme İşlemi Devam Ettirilsinmi ?'
                    };
                }
 
                if (firmaAboneligi) {
                    firmaAboneligi.Durum = 'Durduruldu';
                    firmaAboneligi.BitisTarihi = new Date();
 
                    await this.dataSource.getRepository(FirmaAbonelikleri).save(firmaAboneligi)
                } */




                firma.IsDeleted = true;
                await this.firmaRepository.save(firma);
                const queyfirma = await this.firmaRepository.createQueryBuilder('firma')
                    .where('firma.FirmaID = :FirmaID', { FirmaID: data.itemId })
                    .addSelect(
                        `(SELECT COUNT(*) FROM Personel WHERE Personel.KullaniciID IS NOT NULL AND Personel.IliskiID = firma.FirmaID AND Personel.IsDeleted != 1')`,
                        'KullaniciSayisi'
                    )
                    .getRawOne();

                return {
                    FirmaID: queyfirma.firma_FirmaID,
                    FirmaAdi: queyfirma.firma_FirmaAdi,
                    PortalKullaniciAdi: queyfirma.firma_PortalKullaniciAdi,
                    PortalLinki: queyfirma.firma_PortalLinki,
                    PortalSifre: queyfirma.firma_PortalSifre,
                    IsDeleted: queyfirma.firma_IsDeleted,
                    MesaiBaslangic: queyfirma.firma_MesaiBaslangic,
                    MesaiBitis: queyfirma.firma_MesaiBitis,
                    KullaniciSayisi: queyfirma.KullaniciSayisi,
                    CalismaGunleri: queyfirma.CalismaGunleri
                };
            } else {
                return {
                    status: 404,
                    message: 'firma bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'firma silme hatası',
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


        try {
            // Silinmiş firma'yı bul
            const firma = await this.firmaRepository
                .createQueryBuilder('firma')
                .where('firma.FirmaID = :id', { id: data.itemId })
                .getOne();

            if (firma) {
                // Template'i geri yükle
                firma.IsDeleted = false;

                await this.firmaRepository.save(firma);
                const queyfirma = await this.firmaRepository.createQueryBuilder('firma')
                    .where('firma.FirmaID = :FirmaID', { FirmaID: data.itemId })
                    .addSelect(
                        `(SELECT COUNT(*) FROM Personel WHERE Personel.KullaniciID IS NOT NULL AND Personel.IliskiID = firma.FirmaID AND Personel.IsDeleted != 1')`,
                        'KullaniciSayisi'
                    )
                    .getRawOne();

                return {
                    FirmaID: queyfirma.firma_FirmaID,
                    FirmaAdi: queyfirma.firma_FirmaAdi,
                    PortalKullaniciAdi: queyfirma.firma_PortalKullaniciAdi,
                    PortalLinki: queyfirma.firma_PortalLinki,
                    PortalSifre: queyfirma.firma_PortalSifre,
                    IsDeleted: queyfirma.firma_IsDeleted,
                    MesaiBaslangic: queyfirma.firma_MesaiBaslangic,
                    MesaiBitis: queyfirma.firma_MesaiBitis,
                    KullaniciSayisi: queyfirma.KullaniciSayisi,
                    CalismaGunleri: queyfirma.CalismaGunleri
                };
            } else {
                return {
                    status: 404,
                    message: 'Firma bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'firma geri getirme hatası'
            );
        }
    }


    async updateFirmaLogo(filePath: string, firmaId: number) {
        try {
            const firma = await this.firmaRepository.createQueryBuilder('firma')
                .leftJoinAndMapOne('firma.FirmaBilgisi', FirmaBilgileri, 'firmaBilgisi', 'firmaBilgisi.IliskiID = firma.FirmaID AND firmaBilgisi.Tip = 1')
                .where('firma.FirmaID = :FirmaID', { FirmaID: firmaId })
                .getOne();

            if (!firma) {
                throw new BadRequestException('Firma bulunamadı');
            }
            let logo = firma.FirmaBilgisi ? firma.FirmaBilgisi.Logo : null;
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
                if (firma.FirmaBilgisi && firma.FirmaBilgisi.BilgiID) {
                    await this.dataSource.getRepository(FirmaBilgileri).update(firma.FirmaBilgisi.BilgiID, { Logo: logo });
                } else {
                    // Eğer FirmaBilgisi yoksa yeni bir kayıt oluştur
                    const yeniFirmaBilgisi = this.dataSource.getRepository(FirmaBilgileri).create({
                        IliskiID: firma.FirmaID,
                        Tip: 1,
                        Logo: logo,
                        KisaTanitim: '-',
                        FirmaAciklamasi: '-',
                    });
                    await this.dataSource.getRepository(FirmaBilgileri).save(yeniFirmaBilgisi);
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
            throw new InternalServerErrorException('Kullanıcı bilgileri güncelleme işlemi sırasında bir hata oluştu.');
        }

    }


    async logoDelete(firmaId: number) {
        try {
            const firma = await this.firmaRepository.createQueryBuilder('firma')
                .leftJoinAndMapOne('firma.FirmaBilgisi', FirmaBilgileri, 'firmaBilgisi', 'firmaBilgisi.IliskiID = firma.FirmaID AND firmaBilgisi.Tip = 1')
                .where('firma.FirmaID = :FirmaID', { FirmaID: firmaId })
                .getOne();

            if (!firma) {
                throw new BadRequestException('Firma bulunamadı');
            }
            // URL'den dosya yolunu ayıkla
            const oldImagePath = firma.FirmaBilgisi.Logo ?
                firma.FirmaBilgisi.Logo.replace('/public/', '') : null;
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
                if (!firma.FirmaBilgisi || !firma.FirmaBilgisi.BilgiID) {
                    throw new BadRequestException('Firma bilgileri bulunamadı');
                }
                await this.dataSource.getRepository(FirmaBilgileri).update(firma.FirmaBilgisi.BilgiID, { Logo: null });
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



    async subeUpload(userId: number, data: {
        SubeID?: number;
        BilgiID: number;
        SubeAdi: string;
        Il: string;
        Ilce: string;
        Ulke: string;
        Adres: string;
        Telefon: string;
        Email: string;
        AnaSubemi: boolean;
    }) {
        if (!userId) {
            throw new BadRequestException(`Kullanıcı ID gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }

        if (!data.BilgiID || data.BilgiID < 1) {
            throw new BadRequestException('Bilgi ID gereklidir');
        }

        const firmaBilgisi = await this.dataSource.getRepository(FirmaBilgileri).findOne({
            where: { BilgiID: data.BilgiID },
        });

        if (!firmaBilgisi) {
            throw new BadRequestException('Firma bilgisi bulunamadı');
        }

        if (user.KullaniciTipi !== 2) {
            const ownerKullanici = await this.dataSource.getRepository(Personel).findOne({
                where: { KullaniciID: userId, Tip: 1, IliskiID: firmaBilgisi.IliskiID },
            });
            if (!ownerKullanici) {
                throw new BadRequestException('Yetkisiz kullanıcı');
            }
        }

        try {
            const subeRepo = this.dataSource.getRepository(FirmaBilgileriSubeler);

            // Ana şube kontrolü
            if (data.AnaSubemi) {
                const eskiAnaSube = await subeRepo.findOne({
                    where: { AnaSubemi: true, BilgiID: data.BilgiID },
                });

                if (eskiAnaSube && eskiAnaSube.SubeID !== data.SubeID) {
                    // Başka bir ana şube varsa onu pasifleştir
                    await subeRepo.update({ SubeID: eskiAnaSube.SubeID }, { AnaSubemi: false });
                }
            }

            // Güncellenecek mi yoksa eklenecek mi?
            if (data.SubeID) {
                const mevcutSube = await subeRepo.findOne({ where: { SubeID: data.SubeID } });

                if (!mevcutSube) {
                    throw new BadRequestException('Şube bulunamadı');
                }

                const guncelSube = subeRepo.merge(mevcutSube, {
                    ...data,
                    Ulke: 'Türkiye',
                    AnaSubemi: data.AnaSubemi ?? false
                });

                return await subeRepo.save(guncelSube);
            } else {
                const yeniSube = subeRepo.create({
                    ...data,
                    Ulke: 'Türkiye',
                    AnaSubemi: data.AnaSubemi ?? false
                });

                return await subeRepo.save(yeniSube);
            }

        } catch (error) {
            console.error('Firma şube ekleme hatası:', error);
            throw new BadRequestException('Firma şube ekleme işlemi sırasında bir hata oluştu.');
        }
    }




    async subeDelete(userId: number, data: { SubeID: number }) {
        if (!userId) {
            throw new BadRequestException(`Kullanıcı ID gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }

        if (!data.SubeID || data.SubeID < 1) {
            throw new BadRequestException('Sube ID gereklidir');
        }

        const sube = await this.dataSource.getRepository(FirmaBilgileriSubeler).findOne({
            where: { SubeID: data.SubeID },
            relations: ['FirmaBilgisi'],
        });
        if (!sube) {
            throw new BadRequestException('Sube bulunamadı');
        }
        if (user.KullaniciTipi !== 2) {
            const ownerKullanici = await this.dataSource.getRepository(Personel).findOne({
                where: { KullaniciID: userId, Tip: 1, IliskiID: sube.FirmaBilgisi.IliskiID, Rol: 'owner' },
            });
            if (!ownerKullanici) {
                throw new BadRequestException('Yetkisiz kullanıcı');
            }
        }

        try {
            if (sube.AnaSubemi === true) {
                const baskasubeVarmi = await this.dataSource.getRepository(FirmaBilgileriSubeler).findOne({
                    where: { BilgiID: sube.BilgiID, SubeID: Not(data.SubeID) }
                });
                if (!baskasubeVarmi) {
                    throw new BadRequestException('Ana şube silinemez, başka bir şube bulunmalıdır.');
                }
                // Eğer başka bir şube varsa, ana şubeyi true yap
                await this.dataSource.getRepository(FirmaBilgileriSubeler).save({ ...baskasubeVarmi, AnaSubemi: true });
            }
            await this.dataSource.getRepository(FirmaBilgileriSubeler).remove(sube);

            return data;
        } catch (error) {
            console.error('Firma sube silme hatası:', error);
            throw new BadRequestException('Firma sube silme işlemi sırasında bir hata oluştu.');
        }
    }
}
