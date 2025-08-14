import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { IzinTalepleri } from './entities/izin-talepleri.entity';
import { IzinTuru } from 'src/izin-turu/entities/izin-turu.entity';
import { Donem } from 'src/donem/entities/donem.entity';
import { CheckedItemDto, CreateIzinDto, GunlerCheckedDto, UpdateIzinDto } from './dto/create.dto';
import { IzinSureleri } from 'src/izin-sureleri/entities/izin-sureleri.entity';
import * as path from 'path';
import * as fs from 'fs';
import { ResmiTatiller } from 'src/resmitatiller/entities/resmitatiller.entity';
import { Personel } from 'src/personel/entities/personel.entity';
import { DisaridaGecirilenForm } from 'src/disarida-gecirilen-form/entities/disarida-gecirilen-form.entity';

@Injectable()
export class IzinTalepleriService {
    constructor(
        @InjectRepository(IzinTalepleri)
        private readonly izinTalepRepository: Repository<IzinTalepleri>,
        private readonly dataSource: DataSource
    ) { }

    async getUploadDataes() {
        try {

            const izinturleri = await this.dataSource
                .getRepository(IzinTuru)
                .find({ where: { IsDeleted: false } });
            const currentMonth = new Date().getMonth() + 1; // Şu anki ay (0-11 olduğu için +1 eklenir)
            const currentYear = new Date().getFullYear();

            const donemler = await this.dataSource
                .getRepository(Donem)
                .createQueryBuilder('donem')
                .where('donem.IsDeleted = :isDeleted', { isDeleted: false })
                .orderBy(
                    `CASE 
                                WHEN donem.Yil = :currentYear THEN 
                                    CASE 
                                        WHEN donem.Ay >= :currentMonth THEN 1 
                                        ELSE 2 
                                    END
                                ELSE 3 
                            END`, 'ASC'
                )
                .addOrderBy('donem.Yil', 'DESC') // Yıl sıralaması (önce büyük yıllar)
                .addOrderBy('donem.Ay', 'DESC')  // Ay sıralaması (önce büyük aylar)
                .setParameters({ currentMonth, currentYear })
                .getMany();
            const resmiTatiller = await this.dataSource
                .getRepository(ResmiTatiller)
                .find();

            return { izinturleri, donemler, resmiTatiller };
        } catch (error) {
            throw new BadRequestException('Veriler çekilirken bir hata oluştu');
        }
    }


    async getTalep(userId: number, IzinTalepID: number) {
        if (!IzinTalepID) {
            throw new BadRequestException('Izin Talep ID gereklidir');
        }
        try {
            const izintalebi = await this.dataSource
                .getRepository(IzinTalepleri)
                .createQueryBuilder('izinTalep')
                .leftJoinAndSelect('izinTalep.Firma', 'Firma')
                .leftJoinAndSelect('izinTalep.Donem', 'Donem')
                .leftJoinAndSelect('izinTalep.IzinTuru', 'IzinTuru')
                .leftJoinAndSelect('izinTalep.IzinSureleri', 'IzinSureleri')
                .leftJoinAndSelect('izinTalep.Personel', 'Personel')
                .where('izinTalep.IzinTalepID = :IzinTalepID', { IzinTalepID: IzinTalepID })
                .getOne()
            if (!izintalebi) {
                throw new BadRequestException('İzintalebi bulunamadı');
            }


            
            const yetkiler = await this.dataSource.getRepository(Personel).findOne({
                where: { KullaniciID: userId, IliskiID: izintalebi.FirmaID,Tip:1 },
                relations: ['Grup', 'Grup.Yetkiler'],
            });
            if(yetkiler.Rol !== 'owner'){
                if (!yetkiler || !yetkiler.Grup || !yetkiler.Grup.Yetkiler) {
                    throw new BadRequestException('Kullanıcının yetkileri bulunamadı');
                }
                
                const userPermissions = yetkiler.Grup.Yetkiler.map((rolePermission) => rolePermission.Yetki);
                
                // Kullanıcının gerekli izinlerden birine sahip olup olmadığını kontrol et
                const hasPermission = userPermissions.includes('izin-talepleri-seeing');
                
                if (!hasPermission) {
                    throw new BadRequestException('Kullanıcı yetkisi yok');
                }
            }

            return izintalebi;
        } catch (error) {
            throw error;
        }
    }


    async getImportFile(userId: number, IzinTalepID: number) {
        if (!IzinTalepID) {
            throw new BadRequestException('Izin Talep ID gereklidir');
        }
        try {
            const izintalebi = await this.dataSource
                .getRepository(IzinTalepleri)
                .createQueryBuilder('izinTalep')
                .where('izinTalep.IzinTalepID = :IzinTalepID', { IzinTalepID: IzinTalepID })
                .getOne()
            if (!izintalebi) {
                throw new BadRequestException('İzintalebi bulunamadı');
            }
            let base64PDF = null;
            if (izintalebi.EkDosya && izintalebi.EkDosya.length > 0) {
                const dirPath = path.join(__dirname, '..', '..', 'uploads', 'izin-talepleri');
                const filepath = path.join(dirPath, izintalebi.EkDosya);

                if (!fs.existsSync('uploads/izin-talepleri/' + izintalebi.EkDosya)) {
                    base64PDF = null;
                } else {
                    /* const pdfBuffer = fs.readFileSync(filepath);
                    base64PDF = pdfBuffer.toString('base64'); */
                    base64PDF = fs.readFileSync(filepath);
                }
            }


            const yetkiler = await this.dataSource.getRepository(Personel).findOne({
                where: { KullaniciID: userId, IliskiID: izintalebi.FirmaID,Tip:1 },
                relations: ['Grup', 'Grup.Yetkiler'],
            });
            if(yetkiler.Rol !== 'owner'){
                if (!yetkiler || !yetkiler.Grup || !yetkiler.Grup.Yetkiler) {
                    throw new BadRequestException('Kullanıcının yetkileri bulunamadı');
                }
                
                const userPermissions = yetkiler.Grup.Yetkiler.map((rolePermission) => rolePermission.Yetki);
                
                // Kullanıcının gerekli izinlerden birine sahip olup olmadığını kontrol et
                const hasPermission = userPermissions.includes('izin-talepleri-seeing');
                
                if (!hasPermission) {
                    throw new BadRequestException('Kullanıcı yetkisi yok');
                }
            }

            return { base64PDF, EkDosya: izintalebi.EkDosya };
        } catch (error) {
            throw error;
        }
    }


    async getTalepler(userId: number, query: any, FirmaID: number) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'IzinTalepID';
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



        const queryBuilder = this.dataSource.getRepository(IzinTalepleri).createQueryBuilder('izinTalep')
            .leftJoinAndSelect('izinTalep.Firma', 'Firma')
            .leftJoinAndSelect('izinTalep.Donem', 'Donem')
            .leftJoinAndSelect('izinTalep.IzinTuru', 'IzinTuru')
            .leftJoinAndSelect('izinTalep.IzinSureleri', 'IzinSureleri')
            .leftJoinAndSelect('izinTalep.Personel', 'Personel')
            .where('izinTalep.FirmaID = :FirmaID', { FirmaID: FirmaID });



        // Filtreleme işlemi
        Object.keys(filter).forEach((key) => {
            const validFilterFields = {
                'IzinTuru.Tanim': 'IzinTuru.Tanim',
                'Firma.FirmaAdi': 'Firma.FirmaAdi',
                'Donem.DonemAdi': 'Donem.DonemAdi',
                'Personel.AdSoyad': 'Personel.AdSoyad'
            };

            if (validFilterFields[key]) {
                queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
            }
        });

        // Sıralama işlemi
        const validSortFields = ['IzinTuru', 'Firma', 'Donem', 'Personel'];
        if (sort && validSortFields.includes(sort)) {
            if (sort === 'Firma') {
                queryBuilder.orderBy('Firma.FirmaAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            } else if (sort === 'IzinTuru') {
                queryBuilder.orderBy('IzinTuru.Tanim', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            } else if (sort === 'Donem') {
                queryBuilder.orderBy('Donem.DonemAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            } else if (sort === 'Personel') {
                queryBuilder.orderBy('Personel.AdSoyad', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            } else {
                queryBuilder.orderBy(`izinTalep.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            }
        }
        queryBuilder.skip((page - 1) * limit).take(limit);

        const [izinTalep, total] = await queryBuilder.getManyAndCount();
        return {
            data: izinTalep,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }



    async create(userId: number, data: CreateIzinDto, file: string) {

        if (!userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
            select: ['id']
        });

        if (!user) {
            throw new BadRequestException('Kullanıcı bulunamadı');
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let filePath = null;

        const izinligunler = await this.dataSource.getRepository(IzinTalepleri).find({
            where: { PersonelID: data.itemValue.PersonelID, DonemID: data.itemValue.DonemID },
            relations: ['IzinSureleri']
        });

        const disardakigunler = await this.dataSource.getRepository(DisaridaGecirilenForm).find({
            where: { PersonelID: data.itemValue.PersonelID, DonemID: data.itemValue.DonemID },
            relations: ['DisaridaGecirilenSureler']
        });



        try {
            if (file) {
                filePath = this.moveFileToUploads(file);
            }


            let seciliGunler = await this.filterSelectedDays(
                data.checkedItems,
                data.gunlerChecked,
                data.itemValue.PersonelID
            );

            if (seciliGunler.length === 0) {
                throw new BadRequestException('En az bir izin günü seçilmelidir. Resmi Tatil günleri dışında ve personelin işe başlama ve işten ayrılma tarihleri arasında olmalıdır.');
            }

            seciliGunler = await this.disardaYadaIzinlimi(
                seciliGunler,
                izinligunler,
                disardakigunler
            )
            if (seciliGunler.length === 0) {
                throw new BadRequestException('En az bir izin günü seçilmelidir. Dış görevde yada izinli olduğu günler kabul edilmez.');
            }
            const talep = await queryRunner.manager.save(IzinTalepleri, {
                FirmaID: data.itemValue.FirmaID,
                DonemID: data.itemValue.DonemID,
                IzinTuruID: data.itemValue.IzinTuruID,
                PersonelID: data.itemValue.PersonelID,
                Notlar: data.itemValue.Notlar,
                HaftaIciGunuDahil: data.gunlerChecked.HaftaIciGunuDahil,
                CumartesiDahil: data.gunlerChecked.CumartesiDahil,
                PazarDahil: data.gunlerChecked.PazarDahil,
                EkDosya: filePath,
                ToplamGun: seciliGunler.length
            });

            const izinSureleriData = seciliGunler.map(checkedItem => ({
                IzinTalepID: talep.IzinTalepID,
                Tarih: checkedItem.Tarih,
                BaslangicSaati: checkedItem.Baslangic,
                BitisSaati: checkedItem.Bitis,
                ToplamSure: checkedItem.ToplamSure,
                Aciklama: checkedItem.Aciklama
            }));
            await queryRunner.manager.save(IzinSureleri, izinSureleriData);

            await queryRunner.commitTransaction();
            const result = await this.izinTalepRepository
                .createQueryBuilder('izinTalep')
                .leftJoinAndSelect('izinTalep.Firma', 'Firma')
                .leftJoinAndSelect('izinTalep.Donem', 'Donem')
                .leftJoinAndSelect('izinTalep.IzinTuru', 'IzinTuru')
                .leftJoinAndSelect('izinTalep.Personel', 'Personel')
                .leftJoinAndSelect('izinTalep.IzinSureleri', 'IzinSureleri')
                .where('izinTalep.IzinTalepID = :IzinTalepID', { IzinTalepID: talep.IzinTalepID })
                .getOne();
            return result;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw new BadRequestException(error.message || 'İzin talebi oluşturma hatası');
        } finally {
            await queryRunner.release();
        }
    }


    async update(userId: number, data: UpdateIzinDto, file: string) {
        if (!userId) {
            throw new BadRequestException(`Kullanıcı ID gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }

        if (!data.itemValue.IzinTalepID) {
            throw new BadRequestException(`IzinTalepID gereklidir`);
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let filePath = null;

        const izinligunler = await this.dataSource.getRepository(IzinTalepleri).find({
            where: {
                PersonelID: data.itemValue.PersonelID,
                DonemID: data.itemValue.DonemID,
                IzinTalepID: Not(data.itemValue.IzinTalepID), // TypeORM'un Not operatörü kullanılıyor
            },
            relations: ['IzinSureleri'],
        });

        const disardakigunler = await this.dataSource.getRepository(DisaridaGecirilenForm).find({
            where: { PersonelID: data.itemValue.PersonelID, DonemID: data.itemValue.DonemID },
            relations: ['DisaridaGecirilenSureler']
        });

        try {
            // İzin talebini bul
            const talep = await queryRunner.manager.getRepository(IzinTalepleri).findOne({
                where: { IzinTalepID: data.itemValue.IzinTalepID }
            });

            if (!talep) {
                throw new BadRequestException(`IzinTalep bulunamadı`);
            }
            if (file) {
                filePath = this.moveFileToUploads(file);
                if (!fs.existsSync('uploads/izin-talepleri/' + talep.EkDosya)) {
                    if (talep.EkDosya) {
                        fs.unlinkSync('uploads/izin-talepleri/' + talep.EkDosya);
                    }
                }
            }

            // Mevcut izin sürelerini sil
            await queryRunner.manager.getRepository(IzinSureleri)
                .delete({ IzinTalepID: talep.IzinTalepID });



            // Günlerin filtrelenmesi
            let seciliGunler = await this.filterSelectedDays(data.checkedItems, data.gunlerChecked, data.itemValue.PersonelID);
            if (seciliGunler.length === 0) {
                throw new BadRequestException('En az bir izin günü seçilmelidir. Resmi Tatil günleri dışında ve personelin işe başlama ve işten ayrılma tarihleri arasında olmalıdır.');
            }
            seciliGunler = await this.disardaYadaIzinlimi(
                seciliGunler,
                izinligunler,
                disardakigunler
            )
            if (seciliGunler.length === 0) {
                throw new BadRequestException('En az bir izin günü seçilmelidir. Dış görevde yada izinli olduğu günler kabul edilmez.');
            }

            // İzin talebini güncelle
            await queryRunner.manager.getRepository(IzinTalepleri).update(
                { IzinTalepID: talep.IzinTalepID },
                {
                    FirmaID: data.itemValue.FirmaID,
                    DonemID: data.itemValue.DonemID,
                    IzinTuruID: data.itemValue.IzinTuruID,
                    PersonelID: data.itemValue.PersonelID,
                    Notlar: data.itemValue.Notlar,
                    HaftaIciGunuDahil: data.gunlerChecked.HaftaIciGunuDahil,
                    CumartesiDahil: data.gunlerChecked.CumartesiDahil,
                    PazarDahil: data.gunlerChecked.PazarDahil,
                    EkDosya: filePath,
                    ToplamGun: seciliGunler.length
                }
            );


            for (const checkedItem of seciliGunler) {
                await queryRunner.manager.getRepository(IzinSureleri).save({
                    IzinTalepID: talep.IzinTalepID,
                    Tarih: checkedItem.Tarih,
                    BaslangicSaati: checkedItem.Baslangic,
                    BitisSaati: checkedItem.Bitis,
                    ToplamSure: checkedItem.ToplamSure,
                    Aciklama: checkedItem.Aciklama,
                });
            }

            await queryRunner.commitTransaction();

            return await this.izinTalepRepository.createQueryBuilder('izinTalep')
                .leftJoinAndSelect('izinTalep.Firma', 'Firma')
                .leftJoinAndSelect('izinTalep.Donem', 'Donem')
                .leftJoinAndSelect('izinTalep.IzinTuru', 'IzinTuru')
                .leftJoinAndSelect('izinTalep.Personel', 'Personel')
                .leftJoinAndSelect('izinTalep.IzinSureleri', 'IzinSureleri')
                .where('izinTalep.IzinTalepID = :IzinTalepID', { IzinTalepID: talep.IzinTalepID })
                .getOne();

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw new BadRequestException(error.message || 'IzinTalep düzenleme hatası');
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * **Dosyayı hedef klasöre taşır ve yeni yolunu döndürür.**
     */
    private moveFileToUploads(file: string): string {
        const dirPath = path.join(__dirname, '..', '..', 'uploads', 'izin-talepleri');
        const newFilePath = path.join(dirPath, path.basename(file));

        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        fs.renameSync(file, newFilePath);

        if (!fs.existsSync(newFilePath)) {
            throw new BadRequestException('Dosya bulunamadı');
        }

        return path.basename(newFilePath);
    }

    /**
     * **Seçilen günleri hafta içi, cumartesi ve pazar durumuna göre filtreler.**
     */
    private async filterSelectedDays(
        checkedItems: CheckedItemDto[],
        gunlerChecked: GunlerCheckedDto,
        PersonelID: number
    ) {
        try {

            const [personel, resmiTatiller] = await Promise.all([
                this.dataSource.getRepository(Personel).findOne({ where: { PersonelID } }),
                this.dataSource.getRepository(ResmiTatiller).find()
            ]);


            if (!personel) {
                throw new BadRequestException('Firma ve Personel bulunamadı lütfen tekrar deneyin');
            }
            //const firmaCalismaGunleri = firma.CalismaGunleri?.split(',') || [];



            return checkedItems.filter((item) => {
                const parts = item.Tarih.split('.');
                const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                const date = new Date(formattedDate);

                item.Tarih = formattedDate;

                if (isNaN(date.getTime())) return false; // Geçersiz tarihleri hariç tut

                const dayOfWeek = date.getDay();
                //const weekDays = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
                //const currentDayName = weekDays[dayOfWeek];

                // Seçilen günler filtreleme
                if ((dayOfWeek === 0 && !gunlerChecked.PazarDahil) ||
                    (dayOfWeek === 6 && !gunlerChecked.CumartesiDahil)) {
                    return false;
                }



                // Resmi tatil kontrolü (varsa)
                if (resmiTatiller.some(tatil => new Date(tatil.Tarih) === new Date(item.Tarih))) {
                    return false;
                }

                // Personel işe başlama ve işten ayrılma tarihleri kontrolü
                const iseBaslamaTarihi = personel?.IseGirisTarihi ? new Date(personel.IseGirisTarihi) : null;
                const istenAyrilmaTarihi = personel?.IstenCikisTarihi ? new Date(personel.IstenCikisTarihi) : null;

                if (iseBaslamaTarihi && date < iseBaslamaTarihi) {
                    return false; // Personel işe başlamadan önceki günler hariç
                }

                if (istenAyrilmaTarihi && date > istenAyrilmaTarihi) {
                    return false; // Personel işten ayrıldıktan sonraki günler hariç
                }

                return true;
            });
        } catch (error) {
            throw error
        }
    }


    /**
     * **Seçilen günleri dışarda geçirilen günler yada izinli günler varsa hata döner**
     */
    private async disardaYadaIzinlimi(checkedItems: CheckedItemDto[], izinligunler: IzinTalepleri[], disardakigunler: DisaridaGecirilenForm[]) {
        try {
            return checkedItems.filter((item) => {
                // İzinlimi kontrolü (varsa)
                izinligunler.map(i => {
                    if (i.IzinSureleri.some(sure => new Date(sure.Tarih) === new Date(item.Tarih))) {
                        return false;
                    }
                })

                //Dışardamı kontrolü
                disardakigunler.map(i => {
                    if (i.DisaridaGecirilenSureler.some(sure => new Date(sure.Tarih) === new Date(item.Tarih))) {
                        return false;
                    }
                })


                return true;
            });
        } catch (error) {
            throw error
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




        try {
            const talep = await this.izinTalepRepository.findOne({ where: { IzinTalepID: data.itemId } });
            if (talep) {
                talep.IsDeleted = true;
                await this.izinTalepRepository.save(talep);

                return await this.izinTalepRepository.createQueryBuilder('izinTalep')
                    .leftJoinAndSelect('izinTalep.Firma', 'Firma')
                    .leftJoinAndSelect('izinTalep.Donem', 'Donem')
                    .leftJoinAndSelect('izinTalep.IzinTuru', 'IzinTuru')
                    .leftJoinAndSelect('izinTalep.Personel', 'Personel')
                    .leftJoinAndSelect('izinTalep.IzinSureleri', 'IzinSureleri')
                    .where('izinTalep.IzinTalepID = :IzinTalepID', { IzinTalepID: data.itemId })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'IzinTalep bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'IzinTalep silme hatası',
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
            const talep = await this.izinTalepRepository
                .createQueryBuilder('talep')
                .where('talep.IzinTalepID = :id', { id: data.itemId })
                .getOne();

            if (talep) {
                talep.IsDeleted = false;

                await this.izinTalepRepository.save(talep);
                return await this.izinTalepRepository.createQueryBuilder('izinTalep')
                    .leftJoinAndSelect('izinTalep.Firma', 'Firma')
                    .leftJoinAndSelect('izinTalep.Donem', 'Donem')
                    .leftJoinAndSelect('izinTalep.IzinTuru', 'IzinTuru')
                    .leftJoinAndSelect('izinTalep.Personel', 'Personel')
                    .leftJoinAndSelect('izinTalep.IzinSureleri', 'IzinSureleri')
                    .where('izinTalep.IzinTalepID = :IzinTalepID', { IzinTalepID: data.itemId })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'Deleted IzinTalep not found'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'IzinTalep geri getirme hatası'
            );
        }
    }


}
