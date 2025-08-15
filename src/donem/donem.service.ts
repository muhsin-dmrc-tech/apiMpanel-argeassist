import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { Donem } from './entities/donem.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { format, subMonths } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Projeler } from 'src/projeler/entities/projeler.entity';

@Injectable()
export class DonemService {
    constructor(
        @InjectRepository(Donem)
        private readonly DonemRepository: Repository<Donem>,
        private readonly dataSource: DataSource
    ) { }


    async getActiveDonemler() {
        const currentMonth = new Date().getMonth() + 1; // Şu anki ay (0-11 olduğu için +1 eklenir)
        const currentYear = new Date().getFullYear();

        const Donemlar = await this.dataSource
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



        return Donemlar;
    }

    async getDonemler(userId: number, query: any) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'DonemAdi';
        const order = query.order || 'DESC';
        const filter = query.filter || {};

        if (isNaN(page) || isNaN(limit)) {
            throw new BadRequestException('Sayfa ve Sınır Numaralar olmalı');
        }

        if (!userId) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }



        const queryBuilder = this.dataSource.getRepository(Donem).createQueryBuilder('donem');



        // Filtreleme işlemi

        Object.keys(filter).forEach((key) => {
            if (!['DonemAdi', 'Ay', 'Yil'].includes(key)) return;
            queryBuilder.andWhere(`donem.${key} LIKE :${key}`, { [key]: `%${filter[key]}%` });
        });

        // Sıralama işlemi
        const validSortFields = ['DonemAdi', 'Ay', 'Yil'];
        if (sort && validSortFields.includes(sort)) {
            queryBuilder.orderBy(`donem.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        }

        queryBuilder.skip((page - 1) * limit).take(limit);

        const [donem, total] = await queryBuilder.getManyAndCount();
        return {
            data: donem,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }


    async create(userId: number, data: { DonemAdi: string, Ay: number, Yil: number }) {


        if (!userId) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
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
        if (!data.DonemAdi) {
            throw new BadRequestException(`Donem zorunludur`);
        }

        try {
            const donem = await this.DonemRepository.save({
                DonemAdi: data.DonemAdi,
                Ay: data.Ay,
                Yil: data.Yil
            });

            return await this.DonemRepository.createQueryBuilder('donem')
                .where('donem.DonemID = :DonemID', { DonemID: donem.DonemID })
                .getOne();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Donem create failed',
            );
        }
    }

    async update(userId: number, data: { DonemAdi: string, Ay: number, Yil: number, DonemID: number }) {


        if (!userId) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
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

        if (!data.DonemID) {
            throw new BadRequestException(`Donem ID gereklidir`);
        }

        try {
            const donem = await this.DonemRepository.findOne({ where: { DonemID: data.DonemID } });

            if (!donem) {
                throw new BadRequestException(`Donem bulunamadı`);
            }

            donem.DonemAdi = data.DonemAdi;
            donem.Ay = data.Ay;
            donem.Yil = data.Yil;

            await this.DonemRepository.save(donem);
            return await this.DonemRepository.createQueryBuilder('donem')
                .where('donem.DonemID = :DonemID', { DonemID: donem.DonemID })
                .getOne();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Donem güncelleme işlemi başarısız oldu',
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
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
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
            const donem = await this.DonemRepository.findOne({ where: { DonemID: data.itemId } });
            if (donem) {
                donem.IsDeleted = true;
                await this.DonemRepository.save(donem);

                return await this.DonemRepository.createQueryBuilder('donem')
                    .where('donem.DonemID = :DonemID', { DonemID: data.itemId })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'Donem bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Donem silme işlemi başarısız oldu',
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
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
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
            // Silinmiş Donem'yı bul
            const donem = await this.DonemRepository
                .createQueryBuilder('donem')
                .where('donem.DonemID = :id', { id: data.itemId })
                .getOne();

            if (donem) {
                // Template'i geri yükle
                donem.IsDeleted = false;

                await this.DonemRepository.save(donem);
                return await this.DonemRepository.createQueryBuilder('donem')
                    .where('donem.DonemID = :DonemID', { DonemID: data.itemId })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'Donem bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Donem geri getirme işlemi hatalı'
            );
        }
    }



    /**
        * Planlanan tarihte dönem ekle
        */
    @Cron('10 0 1 * *') // Her ayın ilk günü çalışır
    async donemOlustur(): Promise<void> {
        try {
            // Bir önceki ayın tarihini al
            const previousMonth = subMonths(new Date(), 1);

            // Ay ismini ve yılı formatla
            const donemAdi = format(previousMonth, 'MMMM yyyy', { locale: tr });

            // Ay numarası (0-11 yerine 1-12 formatında)
            const ay = previousMonth.getMonth() + 1;
            const yil = previousMonth.getFullYear();

            let donem = await this.DonemRepository.findOne({ where: { Ay: ay, Yil: yil } });

            if (!donem) {
                donem = await this.DonemRepository.save({
                    DonemAdi: donemAdi,
                    Ay: ay,
                    Yil: yil
                });
            }



            // Dönem oluşturulduktan sonra görev listesi oluştur
            //await this.gorevListesiOlustur(donem);

            console.log(`Yeni dönem oluşturuldu: ${donemAdi}`);
        } catch (error) {
            console.error('Dönem oluşturma hatası:', error);
            throw new Error('Dönem oluşturulamadı');
        }
    }

   /*  async gorevListesiOlustur(donem: Donem): Promise<void> {
        try {
            // Aktif projeleri getir
            const projeler = await this.dataSource.getRepository(Projeler).find({
                where: { IsDeleted: false },
                relations: ['Firma']
            });

            // Aktif firmaları getir
            const firmalar = await this.dataSource.getRepository(Firma).find({
                where: { IsDeleted: false }
            });


            const projeIlerlemeBilgisiSTT = 27;
            const projeGelirBilgisiSTT = 27;
            const projeGiderBilgisiSTT = 27;
            const projeDisTicaretBilgileriSTT = 27;
            const projeDisiGelirBilgisiSTT = 27;
            const projeDisiGiderBilgileriSTT = 27;
            const projeDisiDisTicaretBilgileriSTT = 27;
            const firmaMuafiyetBilgileriSTT = 27;


            if (projeler && projeler.length > 0) {
                // Her proje için görev listesi oluştur
                for (const proje of projeler) {
                    const gorevListesiData = [
                        { BolumAnahtar: 'proje-ilerleme-bilgileri', DonemID: donem.DonemID, FirmaID: proje.FirmaID, ProjeID: proje.ProjeID, SonTeslimTarihi: new Date(new Date().getFullYear(), new Date().getMonth(), projeIlerlemeBilgisiSTT) },
                        { BolumAnahtar: 'proje-gelir-bilgileri', DonemID: donem.DonemID, FirmaID: proje.FirmaID, ProjeID: proje.ProjeID, SonTeslimTarihi: new Date(new Date().getFullYear(), new Date().getMonth(), projeGelirBilgisiSTT) },
                        { BolumAnahtar: 'proje-gider-bilgileri', DonemID: donem.DonemID, FirmaID: proje.FirmaID, ProjeID: proje.ProjeID, SonTeslimTarihi: new Date(new Date().getFullYear(), new Date().getMonth(), projeGiderBilgisiSTT) },
                        { BolumAnahtar: 'proje-dis-ticaret-bilgileri', DonemID: donem.DonemID, FirmaID: proje.FirmaID, ProjeID: proje.ProjeID, SonTeslimTarihi: new Date(new Date().getFullYear(), new Date().getMonth(), projeDisTicaretBilgileriSTT) },
                    ];

                    // Görev listesi verilerini kaydet
                    for (const gorevData of gorevListesiData) {
                        const existingGorev = await this.dataSource.getRepository(GorevListesi).findOne({
                            where: {
                                DonemID: gorevData.DonemID,
                                FirmaID: gorevData.FirmaID,
                                ProjeID: gorevData.ProjeID,
                                BolumAnahtar: gorevData.BolumAnahtar
                            }
                        });
                        if (!existingGorev) {
                            await this.dataSource.getRepository(GorevListesi).save(gorevData);
                        }
                    }
                }
            }

            if (firmalar && firmalar.length > 0) {
                // Her firma için görev listesi oluştur
                for (const firma of firmalar) {
                    const gorevListesiData1 = [
                        { BolumAnahtar: 'proje-disi-gelir-bilgileri', DonemID: donem.DonemID, FirmaID: firma.FirmaID, ProjeID: null, SonTeslimTarihi: new Date(new Date().getFullYear(), new Date().getMonth(), projeDisiGelirBilgisiSTT) },
                        { BolumAnahtar: 'proje-disi-gider-bilgileri', DonemID: donem.DonemID, FirmaID: firma.FirmaID, ProjeID: null, SonTeslimTarihi: new Date(new Date().getFullYear(), new Date().getMonth(), projeDisiGiderBilgileriSTT) },
                        { BolumAnahtar: 'proje-disi-dis-ticaret-bilgileri', DonemID: donem.DonemID, FirmaID: firma.FirmaID, ProjeID: null, SonTeslimTarihi: new Date(new Date().getFullYear(), new Date().getMonth(), projeDisiDisTicaretBilgileriSTT) },
                        { BolumAnahtar: 'firma-muafiyet-bilgileri', DonemID: donem.DonemID, FirmaID: firma.FirmaID, ProjeID: null, SonTeslimTarihi: new Date(new Date().getFullYear(), new Date().getMonth(), firmaMuafiyetBilgileriSTT) },
                    ];

                    // Görev listesi verilerini kaydet
                    for (const gorevData of gorevListesiData1) {
                        const existingGorev1 = await this.dataSource.getRepository(GorevListesi).findOne({
                            where: {
                                DonemID: gorevData.DonemID,
                                FirmaID: gorevData.FirmaID,
                                ProjeID: gorevData.ProjeID,
                                BolumAnahtar: gorevData.BolumAnahtar
                            }
                        });
                        if (!existingGorev1) {
                            await this.dataSource.getRepository(GorevListesi).save(gorevData);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Görev listesi oluşturma hatası:', error);
            throw new Error('Görev listesi oluşturulamadı');
        }
    } */
}
