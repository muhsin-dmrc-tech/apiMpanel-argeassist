import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { Donem } from 'src/donem/entities/donem.entity';
import { DisaridaGecirilenForm } from './entities/disarida-gecirilen-form.entity';
import { CalismaTuru } from 'src/calisma-turu/entities/calisma-turu.entity';
import { ResmiTatiller } from 'src/resmitatiller/entities/resmitatiller.entity';
import { CreateDisGorevDto } from './dto/create.dto';
import { DisaridaGecirilenSureler } from 'src/disarida-gecirilen-sureler/entities/disarida-gecirilen-sureler.entity';
import { UpdateDisGorevDto } from './dto/update.dto';
import { GorevlendirmeTuru } from 'src/gorevlendirme-turu/entities/gorevlendirme-turu.entity';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import { format } from 'date-fns';
import * as path from 'path';
import { Personel } from 'src/personel/entities/personel.entity';
import { CheckedItemDto, GunlerCheckedDto } from 'src/izin-talepleri/dto/create.dto';
import { IzinTalepleri } from 'src/izin-talepleri/entities/izin-talepleri.entity';

@Injectable()
export class DisaridaGecirilenFormService {
    constructor(
        @InjectRepository(DisaridaGecirilenForm)
        private readonly disGorevTalepRepository: Repository<DisaridaGecirilenForm>,
        private readonly dataSource: DataSource
    ) { }

    async getUploadDataes() {
        try {

            const calismaTurleri = await this.dataSource
                .getRepository(CalismaTuru)
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
            const gorevlendirmeTurleri = await this.dataSource
                .getRepository(GorevlendirmeTuru)
                .find({ where: { IsDeleted: false } });

            return { calismaTurleri, donemler, resmiTatiller, gorevlendirmeTurleri };
        } catch (error) {
            throw new BadRequestException('Veriler çekilirken bir hata oluştu');
        }
    }

    async getTalep(userId: number, DisGorevTalepID: number) {
        if (!DisGorevTalepID) {
            throw new BadRequestException('Dıs Görev Talep ID gereklidir');
        }
        try {
            const gorevtalebi = await this.dataSource
                .getRepository(DisaridaGecirilenForm).createQueryBuilder('disGorevTalep')
                .leftJoinAndSelect('disGorevTalep.Firma', 'Firma')
                .leftJoinAndSelect('disGorevTalep.Donem', 'Donem')
                .leftJoinAndSelect('disGorevTalep.CalismaTuru', 'CalismaTuru')
                .leftJoinAndSelect('disGorevTalep.GorevlendirmeTuru', 'GorevlendirmeTuru')
                .leftJoinAndSelect('disGorevTalep.DisaridaGecirilenSureler', 'DisaridaGecirilenSureler')
                .leftJoinAndSelect('disGorevTalep.Personel', 'Personel')
                .leftJoinAndSelect('disGorevTalep.Proje', 'Proje')
                .where('disGorevTalep.DisaridaGecirilenFormID = :DisaridaGecirilenFormID', { DisaridaGecirilenFormID: DisGorevTalepID })
                .getOne()

            if (!gorevtalebi) {
                throw new BadRequestException('Görev talebi bulunamadı');
            }


            const yetkiler = await this.dataSource.getRepository(Personel).findOne({
                where: { KullaniciID: userId, IliskiID: gorevtalebi.FirmaID,Tip:1 },
                relations: ['Grup', 'Grup.Yetkiler'],
            });
            if(yetkiler.Rol !== 'owner'){
                if (!yetkiler || !yetkiler.Grup || !yetkiler.Grup.Yetkiler) {
                    throw new BadRequestException('Kullanıcının yetkileri bulunamadı');
                }
                
                const userPermissions = yetkiler.Grup.Yetkiler.map((rolePermission) => rolePermission.Yetki);
                
                // Kullanıcının gerekli izinlerden birine sahip olup olmadığını kontrol et
                const hasPermission = userPermissions.includes('dis-gorev-talepleri-seeing');
                
                if (!hasPermission) {
                    throw new BadRequestException('Kullanıcı yetkisi yok');
                }
            }
            

            return gorevtalebi;
        } catch (error) {
            throw error;
        }
    }

    async pdfImport(userId: number, DisGorevTalepID: number) {
        if (!userId) {
            throw new BadRequestException(`Kullanıcı ID gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }

        if (!DisGorevTalepID) {
            throw new BadRequestException('Dış görev talebi ID gereklidir');
        }

        const savedData = await this.disGorevTalepRepository.createQueryBuilder('disGorev')
            .leftJoinAndSelect('disGorev.Firma', 'Firma')
            .leftJoinAndSelect('disGorev.Donem', 'Donem')
            .leftJoinAndSelect('disGorev.CalismaTuru', 'CalismaTuru')
            .leftJoinAndSelect('disGorev.GorevlendirmeTuru', 'GorevlendirmeTuru')
            .leftJoinAndSelect('disGorev.Personel', 'Personel')
            .leftJoinAndSelect('disGorev.Proje', 'Proje')
            .leftJoinAndSelect('Proje.Teknokent', 'Teknokent')
            .leftJoinAndSelect('disGorev.DisaridaGecirilenSureler', 'DisaridaGecirilenSureler')
            .where('disGorev.DisaridaGecirilenFormID = :DisaridaGecirilenFormID',
                { DisaridaGecirilenFormID: DisGorevTalepID })
            .getOne();
        const pdfBuffer = await this.generatePDF(savedData);

        // PDF'i base64'e çevir
        const base64PDF = pdfBuffer.toString('base64');

        return {
            success: true,
            data: savedData,
            pdf: base64PDF
        };
    }


    async getTalepler(userId: number, query: any, FirmaID: number) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'DisaridaGecirilenFormID';
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



        const queryBuilder = this.dataSource.getRepository(DisaridaGecirilenForm).createQueryBuilder('disGorevTalep')
            .leftJoinAndSelect('disGorevTalep.Firma', 'Firma')
            .leftJoinAndSelect('disGorevTalep.Donem', 'Donem')
            .leftJoinAndSelect('disGorevTalep.CalismaTuru', 'CalismaTuru')
            .leftJoinAndSelect('disGorevTalep.GorevlendirmeTuru', 'GorevlendirmeTuru')
            .leftJoinAndSelect('disGorevTalep.DisaridaGecirilenSureler', 'DisaridaGecirilenSureler')
            .leftJoinAndSelect('disGorevTalep.Personel', 'Personel')
            .leftJoinAndSelect('disGorevTalep.Proje', 'Proje')
            .where('disGorevTalep.FirmaID = :FirmaID', { FirmaID: FirmaID });



        // Filtreleme işlemi
        Object.keys(filter).forEach((key) => {
            const validFilterFields = {
                'CalismaTuru.Tanim': 'CalismaTuru.Tanim',
                'GorevlendirmeTuru.Tanim': 'GorevlendirmeTuru.Tanim',
                'Firma.FirmaAdi': 'Firma.FirmaAdi',
                'Donem.DonemAdi': 'Donem.DonemAdi',
                'Personel.AdSoyad': 'Personel.AdSoyad',
                'Proje.ProjeAdi': 'Proje.ProjeAdi',
                'disGorevTalep.CalisilacakKurum': 'disGorevTalep.CalisilacakKurum'
            };

            if (validFilterFields[key]) {
                queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
            }
        });

        // Sıralama işlemi
        const validSortFields = ['CalismaTuru', 'Proje', 'Donem', 'Personel', 'CalisilacakKurum'];
        if (sort && validSortFields.includes(sort)) {
            if (sort === 'Proje') {
                queryBuilder.orderBy('Proje.ProjeAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            } else if (sort === 'CalismaTuru') {
                queryBuilder.orderBy('CalismaTuru.Tanim', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            } else if (sort === 'GorevlendirmeTuru') {
                queryBuilder.orderBy('GorevlendirmeTuru.Tanim', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            } else if (sort === 'Donem') {
                queryBuilder.orderBy('Donem.DonemAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            } else if (sort === 'Personel') {
                queryBuilder.orderBy('Personel.AdSoyad', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            } else {
                queryBuilder.orderBy(`disGorevTalep.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            }
        }
        queryBuilder.skip((page - 1) * limit).take(limit);

        const [disGorevTalep, total] = await queryBuilder.getManyAndCount();
        return {
            data: disGorevTalep,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }



    async create(userId: number, data: CreateDisGorevDto) {
        if (!userId) {
            throw new BadRequestException(`Kullanıcı ID gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }

        // Transaction başlat
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();


        const izinligunler = await this.dataSource.getRepository(IzinTalepleri).find({
            where: { PersonelID: data.itemValue.PersonelID, DonemID: data.itemValue.DonemID },
            relations: ['IzinSureleri']
        });

        const disardakigunler = await this.dataSource.getRepository(DisaridaGecirilenForm).find({
            where: { PersonelID: data.itemValue.PersonelID, DonemID: data.itemValue.DonemID },
            relations: ['DisaridaGecirilenSureler']
        });

        try {


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
            const talep = await queryRunner.manager.getRepository(DisaridaGecirilenForm).save({
                FirmaID: data.itemValue.FirmaID,
                DonemID: data.itemValue.DonemID,
                CalismaTuruID: data.itemValue.CalismaTuruID,
                PersonelID: data.itemValue.PersonelID,
                ProjeID: data.itemValue.ProjeID,
                CalisilacakKurum: data.itemValue.CalisilacakKurum,
                HaftaIciGunuDahil: data.gunlerChecked.HaftaIciGunuDahil,
                CumartesiDahil: data.gunlerChecked.CumartesiDahil,
                PazarDahil: data.gunlerChecked.PazarDahil,
                GorevlendirmeTuruID: data.itemValue.GorevlendirmeTuruID
            });

            const dgSureleriData = seciliGunler.map(checkedItem => ({
                DisaridaGecirilenFormID: talep.DisaridaGecirilenFormID,
                Tarih: checkedItem.Tarih,
                BaslangicSaati: checkedItem.Baslangic,
                BitisSaati: checkedItem.Bitis,
                ToplamSure: checkedItem.ToplamSure,
                Aciklama: checkedItem.Aciklama,
            }));
            await queryRunner.manager.save(DisaridaGecirilenSureler, dgSureleriData);

            await queryRunner.commitTransaction();

            const savedData = await this.disGorevTalepRepository.createQueryBuilder('disGorev')
                .leftJoinAndSelect('disGorev.Firma', 'Firma')
                .leftJoinAndSelect('disGorev.Donem', 'Donem')
                .leftJoinAndSelect('disGorev.CalismaTuru', 'CalismaTuru')
                .leftJoinAndSelect('disGorev.GorevlendirmeTuru', 'GorevlendirmeTuru')
                .leftJoinAndSelect('disGorev.Personel', 'Personel')
                .leftJoinAndSelect('disGorev.Proje', 'Proje')
                .leftJoinAndSelect('Proje.Teknokent', 'Teknokent')
                .leftJoinAndSelect('disGorev.DisaridaGecirilenSureler', 'DisaridaGecirilenSureler')
                .where('disGorev.DisaridaGecirilenFormID = :DisaridaGecirilenFormID',
                    { DisaridaGecirilenFormID: talep.DisaridaGecirilenFormID })
                .getOne();
            const pdfBuffer = await this.generatePDF(savedData);

            // PDF'i base64'e çevir
            const base64PDF = pdfBuffer.toString('base64');

            return {
                success: true,
                data: savedData,
                pdf: base64PDF
            };

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw new BadRequestException(error.message || 'disGorev oluşturma hatası');
        } finally {
            await queryRunner.release();
        }
    }


    async update(userId: number, data: UpdateDisGorevDto) {
        if (!userId) {
            throw new BadRequestException(`Kullanıcı ID gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }

        if (!data.itemValue.DisaridaGecirilenFormID) {
            throw new BadRequestException(`disGorevID gereklidir`);
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        const izinligunler = await this.dataSource.getRepository(IzinTalepleri).find({
            where: {
                PersonelID: data.itemValue.PersonelID,
                DonemID: data.itemValue.DonemID // TypeORM'un Not operatörü kullanılıyor
            },
            relations: ['IzinSureleri'],
        });

        const disardakigunler = await this.dataSource.getRepository(DisaridaGecirilenForm).find({
            where: {
                PersonelID: data.itemValue.PersonelID, DonemID: data.itemValue.DonemID,
                DisaridaGecirilenFormID: Not(data.itemValue.DisaridaGecirilenFormID)
            },
            relations: ['DisaridaGecirilenSureler']
        });

        try {
            const talep = await queryRunner.manager.getRepository(DisaridaGecirilenForm).findOne({
                where: { DisaridaGecirilenFormID: data.itemValue.DisaridaGecirilenFormID }
            });

            if (!talep) {
                throw new BadRequestException(`disGorev bulunamadı`);
            }

            // Mevcut izin sürelerini sil
            await queryRunner.manager.getRepository(DisaridaGecirilenSureler)
                .delete({ DisaridaGecirilenFormID: talep.DisaridaGecirilenFormID });


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

            // İzin talebini güncelle
            await queryRunner.manager.getRepository(DisaridaGecirilenForm).update(
                { DisaridaGecirilenFormID: talep.DisaridaGecirilenFormID },
                {
                    FirmaID: data.itemValue.FirmaID,
                    DonemID: data.itemValue.DonemID,
                    CalismaTuruID: data.itemValue.CalismaTuruID,
                    PersonelID: data.itemValue.PersonelID,
                    ProjeID: data.itemValue.ProjeID,
                    CalisilacakKurum: data.itemValue.CalisilacakKurum,
                    HaftaIciGunuDahil: data.gunlerChecked.HaftaIciGunuDahil,
                    CumartesiDahil: data.gunlerChecked.CumartesiDahil,
                    PazarDahil: data.gunlerChecked.PazarDahil,
                    GorevlendirmeTuruID: data.itemValue.GorevlendirmeTuruID
                }
            );

            const dgSureleriData = seciliGunler.map(checkedItem => ({
                DisaridaGecirilenFormID: talep.DisaridaGecirilenFormID,
                Tarih: checkedItem.Tarih,
                BaslangicSaati: checkedItem.Baslangic,
                BitisSaati: checkedItem.Bitis,
                ToplamSure: checkedItem.ToplamSure,
                Aciklama: checkedItem.Aciklama,
            }));
            await queryRunner.manager.save(DisaridaGecirilenSureler, dgSureleriData);

            await queryRunner.commitTransaction();


            const savedData = await this.disGorevTalepRepository.createQueryBuilder('disGorev')
                .leftJoinAndSelect('disGorev.Firma', 'Firma')
                .leftJoinAndSelect('disGorev.Donem', 'Donem')
                .leftJoinAndSelect('disGorev.CalismaTuru', 'CalismaTuru')
                .leftJoinAndSelect('disGorev.GorevlendirmeTuru', 'GorevlendirmeTuru')
                .leftJoinAndSelect('disGorev.Personel', 'Personel')
                .leftJoinAndSelect('disGorev.Proje', 'Proje')
                .leftJoinAndSelect('Proje.Teknokent', 'Teknokent')
                .leftJoinAndSelect('disGorev.DisaridaGecirilenSureler', 'DisaridaGecirilenSureler')
                .where('disGorev.DisaridaGecirilenFormID = :DisaridaGecirilenFormID',
                    { DisaridaGecirilenFormID: talep.DisaridaGecirilenFormID })
                .getOne();
            const pdfBuffer = await this.generatePDF(savedData);

            // PDF'i kaydet ve dosya adını al
            /* const fileName = await this.savePDFAndGetFileName(pdfBuffer, savedData.DisaridaGecirilenFormID); */

            // PDF'i base64'e çevir
            const base64PDF = pdfBuffer.toString('base64');

            return {
                success: true,
                data: savedData,
                pdf: base64PDF
            };

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw new BadRequestException(error.message || 'disGorev düzenleme hatası');
        } finally {
            await queryRunner.release();
        }
    }


    /**
         * **Seçilen günleri hafta içi, cumartesi ve pazar durumuna göre filtreler.**
         */
    private async filterSelectedDays(
        checkedItems: CheckedItemDto[],
        gunlerChecked: GunlerCheckedDto,
        PersonelID: number,
    ) {
        try {

            const [personel, resmiTatiller] = await Promise.all([
                this.dataSource.getRepository(Personel).findOne({ where: { PersonelID } }),
                this.dataSource.getRepository(ResmiTatiller).find()
            ]);


            return checkedItems.filter((item) => {
                const parts = item.Tarih.split('.');
                const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                const date = new Date(formattedDate);

                item.Tarih = formattedDate;

                if (isNaN(date.getTime())) return false; // Geçersiz tarihleri hariç tut

                const dayOfWeek = date.getDay();
                /* const weekDays = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
                const currentDayName = weekDays[dayOfWeek]; */

                // Seçilen günler filtreleme
                if ((dayOfWeek === 0 && !gunlerChecked.PazarDahil) ||
                    (dayOfWeek === 6 && !gunlerChecked.CumartesiDahil)) {
                    return false;
                }

                // Firma çalışma günleri kontrolü
                /*  if (!firmaCalismaGunleri.includes(currentDayName)) {
                     return false;
                 } */

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
            const talep = await this.disGorevTalepRepository.findOne({ where: { DisaridaGecirilenFormID: data.itemId } });
            if (talep) {
                talep.IsDeleted = true;
                await this.disGorevTalepRepository.save(talep);


                return await this.disGorevTalepRepository.createQueryBuilder('disGorev')
                    .leftJoinAndSelect('disGorev.Firma', 'Firma')
                    .leftJoinAndSelect('disGorev.Donem', 'Donem')
                    .leftJoinAndSelect('disGorev.CalismaTuru', 'CalismaTuru')
                    .leftJoinAndSelect('disGorev.GorevlendirmeTuru', 'GorevlendirmeTuru')
                    .leftJoinAndSelect('disGorev.Personel', 'Personel')
                    .leftJoinAndSelect('disGorev.Proje', 'Proje')
                    .leftJoinAndSelect('disGorev.DisaridaGecirilenSureler', 'DisaridaGecirilenSureler')
                    .where('disGorev.DisaridaGecirilenFormID = :DisaridaGecirilenFormID', { DisaridaGecirilenFormID: data.itemId })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'disGorev bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'disGorev silme hatası',
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
            const talep = await this.disGorevTalepRepository
                .createQueryBuilder('talep')
                .where('talep.DisaridaGecirilenFormID = :id', { id: data.itemId })
                .getOne();

            if (talep) {
                talep.IsDeleted = false;

                await this.disGorevTalepRepository.save(talep);
                return await this.disGorevTalepRepository.createQueryBuilder('disGorev')
                    .leftJoinAndSelect('disGorev.Firma', 'Firma')
                    .leftJoinAndSelect('disGorev.Donem', 'Donem')
                    .leftJoinAndSelect('disGorev.CalismaTuru', 'CalismaTuru')
                    .leftJoinAndSelect('disGorev.GorevlendirmeTuru', 'GorevlendirmeTuru')
                    .leftJoinAndSelect('disGorev.Personel', 'Personel')
                    .leftJoinAndSelect('disGorev.Proje', 'Proje')
                    .leftJoinAndSelect('disGorev.DisaridaGecirilenSureler', 'DisaridaGecirilenSureler')
                    .where('disGorev.DisaridaGecirilenFormID = :DisaridaGecirilenFormID', { DisaridaGecirilenFormID: data.itemId })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'Deleted disGorev not found'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'disGorev geri getirme hatası'
            );
        }
    }



    //Tek sayfalık hali
    /* private async generatePDF(data: DisaridaGecirilenForm): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    margins: { top: 50, bottom: 50, left: 50, right: 50 },
                });

                const chunks: any[] = [];
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));

                // Default font ayarları
                const fontPath = path.join(process.cwd(), 'src', 'assets', 'fonts', 'arial.ttf');
                const boldFontPath = path.join(process.cwd(), 'src', 'assets', 'fonts', 'arial-bold.ttf');
                try {
                    doc.font(fontPath);
                } catch (fontError) {
                    console.warn('Font yüklenemedi, varsayılan font kullanılıyor:', fontError);
                    doc.font('Helvetica');
                }
                // Ek-1
                doc.fontSize(12)
                    .text('EK: 1', {
                        align: 'left'
                    });

                doc.moveDown(1);

                // Başlık
                doc.fontSize(12)
                    .text(`SAĞLIK BİLİMLERİ ÜNİVERSİTESİ TEKNOLOJİ GELİŞTİRME BÖLGESİ SAĞLIK TEKNOKENTİ A.Ş.(TEKNOPOL İSTANBUL) GENEL MÜDÜRLÜĞÜ'NE`, {
                        align: 'center'
                    });

                doc.moveDown();
                // Üst kısım - Tarih
                doc.fontSize(12)
                    .text(format(new Date(), 'dd.MM.yyyy'), {
                        align: 'right'
                    });


                doc.moveDown();

                // Görevlendirme detayları
                doc.fontSize(12).text(`${data.Proje.ProjeAdi} projesi kapsamında ${data.Firma.FirmaAdi}
                firması personeli olan ${data.Personel.AdSoyad}, aşağıda belirtilen tarihlerde firmamızda çalışmalarını
                gerçekleştirmiştir.`, {
                    align: 'justify',
                    wordSpacing: 10,
                    lineGap: 14
                });
                doc.moveDown(0.5);
                doc.fontSize(12).text('Gereğini bilgilerinize sunarız.', {
                    align: 'left'
                });
                doc.moveDown(1);
                doc.fontSize(12).text('Saygılarımızla,', {
                    align: 'left'
                });
                doc.moveDown();
                doc.fontSize(12).text('Chemfleet', {
                    align: 'left'
                });

                doc.moveDown(2);
                doc.font(boldFontPath).fontSize(12)
                    .text('ALIŞMA SÜRELER', {
                        align: 'center',
                    });
                doc.moveDown();

                // Tablo çizimi
                const startX = 50;
                const startY = doc.y + 20;
                const headerHeight = 50;  // Başlık yüksekliği
                const minRowHeight = 25;  // Minimum satır yüksekliği
                const colWidths = [85, 75, 75, 75, 185];
                const totalWidth = colWidths.reduce((a, b) => a + b, 0);

                // Tablo başlığı çerçevesi
                doc.lineWidth(1)
                    .rect(startX, startY, totalWidth, headerHeight)
                    .stroke();

                // Sütun başlıkları
                let currentX = startX;
                ['Tarih', 'Başlangıç Saati', 'Bitiş Saati', 'Çalışma Süresi', 'Çalışma Türü'].forEach((header, i) => {
                    // Başlık metninin yüksekliğini hesapla
                    const textHeight = doc.heightOfString(header, {
                        width: colWidths[i] - 10,
                        align: 'center'
                    });

                    // Dikey ortalama için Y pozisyonunu hesapla
                    const verticalCenter = startY + (headerHeight - textHeight) / 2;

                    // Sütun başlığı
                    doc.fontSize(10)
                    .text(header, currentX + 5, verticalCenter, {
                        width: colWidths[i] - 10,
                        align: 'center'
                    });

                    // Dikey çizgi
                    if (i < colWidths.length - 1) {
                        currentX += colWidths[i];
                        doc.moveTo(currentX, startY)
                            .lineTo(currentX, startY + headerHeight)
                            .stroke();
                    }
                });

                // Tablo içeriği
                let currentY = startY + headerHeight;

                for (const sure of data.DisaridaGecirilenSureler) {
                    currentX = startX;

                    // Her hücredeki içeriği ve yüksekliğini hesapla
                    const cellContents = [
                        format(new Date(sure.Tarih), 'dd.MM.yyyy'),
                        `${sure.BaslangicSaati}`,
                        `${sure.BitisSaati}`,
                        `${sure.ToplamSure}`,
                        `${data.CalismaTuru.Tanim}`
                    ];

                    // Bu satır için en yüksek hücreyi bul
                    const rowHeight = Math.max(
                        ...cellContents.map((text, i) => {
                            return Math.max(
                                minRowHeight,
                                doc.heightOfString(text, {
                                    width: colWidths[i] - 10,
                                    align: 'center'
                                }) + 20 // Padding için extra alan
                            );
                        })
                    );

                    // Satır çerçevesi
                    doc.rect(startX, currentY, totalWidth, rowHeight).stroke();

                    // Hücre içeriklerini yaz
                    cellContents.forEach((text, i) => {
                        const textHeight = doc.heightOfString(text, {
                            width: colWidths[i] - 10,
                            align: 'center'
                        });

                        // Dikey ortalama için Y pozisyonunu hesapla
                        const verticalCenter = currentY + (rowHeight - textHeight) / 2;

                        // Metin
                        doc.fontSize(10)
                        .text(text, currentX + 5, verticalCenter, {
                            width: colWidths[i] - 10,
                            align: 'center'
                        });

                        // Dikey çizgi
                        if (i < colWidths.length - 1) {
                            currentX += colWidths[i];
                            doc.moveTo(currentX, currentY)
                                .lineTo(currentX, currentY + rowHeight)
                                .stroke();
                        }
                    });

                    currentY += rowHeight;
                }




                doc.end();
            } catch (error) {
                console.log(error)
                reject(error);
            }
        });
    } */

    private async savePDFAndGetFileName(pdfBuffer: Buffer, gorevID: number): Promise<string> {
        // PDF'leri kaydedeceğimiz klasörü oluştur
        const uploadDir = path.join(process.cwd(), 'uploads', 'dis-gorev-pdfs');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Benzersiz dosya adı oluştur
        const fileName = `dis-gorev-${gorevID}-${Date.now()}.pdf`;
        const filePath = path.join(uploadDir, fileName);

        // PDF'i kaydet
        fs.writeFileSync(filePath, pdfBuffer);

        return fileName;
    }


    private async generatePDF(data: DisaridaGecirilenForm): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    margins: { top: 50, bottom: 50, left: 50, right: 50 },
                    autoFirstPage: false
                });

                const chunks: any[] = [];
                let currentPage = 0;

                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));

                // Sayfa eklendiğinde
                doc.on('pageAdded', () => {
                    currentPage++;
                    // Her yeni sayfada header'ı tekrar çiz
                    if (currentPage > 1) {
                        doc.fontSize(12).text(`Sayfa ${currentPage}`, 50, 50);
                        doc.moveDown(2);
                    }
                });

                // İlk sayfayı oluştur
                doc.addPage();

                // Default font ayarları
                const fontPath = path.join(process.cwd(), 'src', 'assets', 'fonts', 'arial.ttf');
                const boldFontPath = path.join(process.cwd(), 'src', 'assets', 'fonts', 'arial-bold.ttf');
                try {
                    doc.font(fontPath);
                } catch (fontError) {
                    console.warn('Font yüklenemedi, varsayılan font kullanılıyor:', fontError);
                    doc.font('Helvetica');
                }
                // Ek-1
                doc.fontSize(12)
                    .text('EK: 1', {
                        align: 'left'
                    });

                doc.moveDown(1);

                // Başlık
                doc.fontSize(12)
                    .text(`${data.Proje.Teknokent.TeknokentAdi} GENEL MÜDÜRLÜĞÜ'NE`, {
                        align: 'center'
                    });

                doc.moveDown();
                // Üst kısım - Tarih
                doc.fontSize(12)
                    .text(format(new Date(), 'dd.MM.yyyy'), {
                        align: 'right'
                    });


                doc.moveDown();

                // Görevlendirme detayları
                doc.fontSize(12).text(`${data.Proje.ProjeAdi} projesi kapsamında ${data.Firma.FirmaAdi}
                firması personeli olan ${data.Personel.AdSoyad}, aşağıda belirtilen tarihlerde firmamızda çalışmalarını
                gerçekleştirmiştir.`, {
                    align: 'justify',
                    wordSpacing: 10,
                    lineGap: 12
                });
                doc.moveDown(0.5);
                doc.fontSize(12).text('Gereğini bilgilerinize sunarız.', {
                    align: 'left'
                });
                doc.moveDown(1.5);
                doc.fontSize(12).text('Saygılarımızla,', {
                    align: 'left'
                });
                doc.moveDown();
                doc.fontSize(12).text(data.CalisilacakKurum, {
                    align: 'left'
                });

                doc.moveDown(3);
                doc.font(boldFontPath).fontSize(12)
                    .text('ÇALIŞMA SÜRELERİ', {
                        align: 'center',
                    });
                doc.moveDown();

                // Tablo çizimi için değişkenler
                const startX = 50;
                let startY = doc.y + 20;
                const headerHeight = 50;
                const minRowHeight = 25;
                const colWidths = [75, 65, 65, 65, 225];
                const totalWidth = colWidths.reduce((a, b) => a + b, 0);
                const pageHeight = doc.page.height - doc.page.margins.bottom;

                // Tablo başlığını çiz
                this.drawTableHeader(doc, startX, startY, headerHeight, colWidths, totalWidth, boldFontPath);
                let currentY = startY + headerHeight;

                // Tablo içeriğini çiz
                for (const sure of data.DisaridaGecirilenSureler) {
                    const rowContent = [
                        format(new Date(sure.Tarih), 'dd.MM.yyyy'),
                        sure.BaslangicSaati.slice(0, 5),
                        sure.BitisSaati.slice(0, 5),
                        sure.ToplamSure.slice(0, 5),
                        data.CalismaTuru.Tanim
                    ];

                    // Satır yüksekliğini hesapla
                    const rowHeight = this.calculateRowHeight(doc, rowContent, colWidths, minRowHeight);

                    // Sayfa kontrolü
                    if (currentY + rowHeight > pageHeight - 30) { // 30px margin for "devamı..." text
                        // Mevcut sayfaya "devamı..." yaz
                        doc.font(fontPath).fontSize(10)
                            .text(`(Devamı sayfa ${currentPage + 1}'de)`,
                                doc.page.width - 150,
                                pageHeight - 20,
                                { align: 'right' });

                        // Yeni sayfa oluştur
                        doc.addPage();
                        startY = doc.page.margins.top + 50;
                        this.drawTableHeader(doc, startX, startY, headerHeight, colWidths, totalWidth, boldFontPath);
                        currentY = startY + headerHeight;
                    }

                    // Satırı çiz
                    this.drawTableRow(doc, startX, currentY, rowHeight, rowContent, colWidths, fontPath);
                    currentY += rowHeight;
                }

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    // Yardımcı fonksiyonlar
    private drawTableHeader(doc: PDFKit.PDFDocument, x: number, y: number, headerHeight: number, colWidths: number[], totalWidth: number, boldFontPath: any): void {
        // Başlık çerçevesi
        doc.lineWidth(1)
            .rect(x, y, totalWidth, headerHeight)
            .stroke();

        // Sütun başlıkları
        let currentX = x;
        ['Tarih', 'Başlangıç Saati', 'Bitiş Saati', 'Çalışma Süresi', 'Çalışma Türü']
            .forEach((header, i) => {
                const textHeight = doc.heightOfString(header, {
                    width: colWidths[i] - 10,
                    align: 'center'
                });

                const verticalCenter = y + (headerHeight - textHeight) / 2;

                doc.font(boldFontPath).fontSize(11)
                    .text(header, currentX + 5, verticalCenter, {
                        width: colWidths[i] - 10,
                        align: 'center'
                    });

                if (i < colWidths.length - 1) {
                    currentX += colWidths[i];
                    doc.moveTo(currentX, y)
                        .lineTo(currentX, y + headerHeight)
                        .stroke();
                }
            });
    }

    private calculateRowHeight(doc: PDFKit.PDFDocument, contents: string[], colWidths: number[], minHeight: number): number {
        return Math.max(
            minHeight,
            ...contents.map((text, i) =>
                doc.heightOfString(text, {
                    width: colWidths[i] - 10,
                    align: 'center'
                }) + 20
            )
        );
    }

    private drawTableRow(doc: PDFKit.PDFDocument, x: number, y: number, height: number, contents: string[], colWidths: number[], fontPath: any): void {
        // Satır çerçevesi
        doc.rect(x, y, colWidths.reduce((a, b) => a + b, 0), height).stroke();

        let currentX = x;
        contents.forEach((text, i) => {
            const textHeight = doc.heightOfString(text, {
                width: colWidths[i] - 10,
                align: 'center'
            });

            const verticalCenter = y + (height - textHeight) / 2;

            doc.font(fontPath).fontSize(10)
                .text(text, currentX + 5, verticalCenter, {
                    width: colWidths[i] - 10,
                    align: 'center'
                });

            if (i < contents.length - 1) {
                currentX += colWidths[i];
                doc.moveTo(currentX, y)
                    .lineTo(currentX, y + height)
                    .stroke();
            }
        });
    }
}