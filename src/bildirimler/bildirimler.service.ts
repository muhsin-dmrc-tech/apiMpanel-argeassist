import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { DataSource, LessThanOrEqual, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Bildirimler } from './entities/bildirimler.entity';
import { CreateTemplatesDto } from './dto/create.templates.dto';
import { KullaniciBildirimleri } from 'src/kullanici-bildirimleri/entities/kullanici-bildirimleri.entity';
import { UpdateTemplatesDto } from './dto/update.templates.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppGateway } from 'src/websocket.gateway';
import * as admin from 'firebase-admin';

@Injectable()
export class BildirimlerService {
    private readonly logger = new Logger(BildirimlerService.name);
    constructor(
        @InjectRepository(Bildirimler)
        private readonly bildirimlerRepository: Repository<Bildirimler>,
        private readonly dataSource: DataSource,
        private readonly appGateway: AppGateway,
    ) { }



    async sendPushNotification(
        token: string,
        title: string,
        body: string,
        data: Record<string, string> = {},
        image?: string,
        sound: string = 'default'
    ) {
        const message: admin.messaging.Message = {
            token,
            notification: {
                title,
                body,
                ...(image && { image }), // Sadece varsa
            },
            android: {
                notification: {
                    sound,
                    ...(image && { image }),
                    clickAction: 'FLUTTER_NOTIFICATION_CLICK', // React Native Firebase için gerekebilir
                },
            },
            apns: {
                payload: {
                    aps: {
                        alert: {
                            title,
                            body,
                        },
                        sound,
                        'mutable-content': 1, // iOS'ta media gösterebilmek için
                    },
                },
                headers: {
                    'apns-priority': '10', // High priority
                },
            },
            data: {
                ...data,
                ...(image ? { image } : {}), // iOS için image'ı data alanında gönderiyoruz
            },
        };

       /*  try {
            const response = await this.firebaseApp.messaging().send(message);
            console.log('✅ FCM gönderim yanıtı:', response);
            return response;
        } catch (error) {
            console.error('❌ FCM gönderim hatası:', error);
            throw error;
        } */
    }





    async getBildirim(userId: number, BildirimID: number) {
        try {
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
            const queryBuilder = this.dataSource.getRepository(Bildirimler).createQueryBuilder('bildirim')
                .withDeleted()
                .where("bildirim.BildirimID = :BildirimID", { BildirimID: BildirimID })
                .getOne();

            if (!queryBuilder) {
                throw new BadRequestException('Bildirim şablonu bulunamadı');
            }

            return queryBuilder;
        } catch (error) {
            throw error;
        }
    }


    async getBildirimler(userId: number, query: any) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'OlusturmaTarihi';
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

        if (user?.KullaniciTipi !== 2) {
            throw new BadRequestException(`Yetkisiz Kullanıcı`);
        }


        const queryBuilder = this.dataSource.getRepository(Bildirimler).createQueryBuilder('bildirimler');



        // Filtreleme işlemi
        Object.keys(filter).forEach((key) => {
            if (key === 'query') {
                queryBuilder.andWhere(`bildirimler.Baslik LIKE :${key}`, { [key]: `%${filter[key]}%` });
            } else {
                queryBuilder.andWhere(`bildirimler.${key} LIKE :${key}`, { [key]: `%${filter[key]}%` });
            }
        });


        // Sıralama işlemi
        if (sort) {
            queryBuilder.orderBy(`bildirimler.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        }

        queryBuilder.skip((page - 1) * limit).take(limit);

        const [bildirimler, total] = await queryBuilder.getManyAndCount();
        return {
            data: bildirimler,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
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
            const template = await this.bildirimlerRepository.findOne({ where: { BildirimID: data.itemId } });
            if (template) {
                template.IsDeleted = true;
                await this.bildirimlerRepository.save(template);
                return this.bildirimlerRepository.createQueryBuilder('bildirim')
                    .where('bildirim.BildirimID = :BildirimID', { BildirimID: template.BildirimID })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'Şablon bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Şablon silme hatası',
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
            // Silinmiş template'i bul
            const template = await this.bildirimlerRepository
                .createQueryBuilder('bildirim')
                .withDeleted()
                .where('bildirim.BildirimID = :id', { id: data.itemId })
                .getOne();

            if (template) {
                // Template'i geri yükle
                template.IsDeleted = false;

                await this.bildirimlerRepository.save(template);
                return this.bildirimlerRepository.createQueryBuilder('bildirim')
                    .where('bildirim.BildirimID = :BildirimID', { BildirimID: template.BildirimID })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'Şablon bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Şablon geri getirme hatası'
            );
        }
    }




    async create(userId: number, data: CreateTemplatesDto) {
        if (!userId) throw new BadRequestException('Kullanıcı ID gereklidir');

        // Kullanıcıyı bul
        const user = await this.getUser(userId);
        if (!user) throw new BadRequestException('Kullanıcı kimliği gereklidir');
        if (user.KullaniciTipi !== 2) throw new BadRequestException('Yetkisiz Kullanıcı');

        // Anahtar benzersiz mi kontrol et
        const existingTemplate = await this.bildirimlerRepository.findOne({ where: { Anahtar: data.Anahtar } });
        if (existingTemplate) throw new BadRequestException('Anahtar benzersiz olmalıdır');

        try {
            // Yeni bildirim kaydı oluştur
            const template = await this.bildirimlerRepository.save({
                Baslik: data.Baslik,
                Anahtar: data.Anahtar,
                Icerik: data.Icerik,
                Link: data.Link,
                MobilLink: data.MobilLink,
                Tur: data.Tur,
                TumKullanicilar: data.TumKullanicilar,
                PlanlananTarih: data.PlanlananTarih ? new Date(data.PlanlananTarih) : null,
                Durum: data.PlanlananTarih ? 'Beklemede' : data.HemenGonder === true ? 'Gönderildi' : 'Beklemede'
            });

            if (data.PlanlananTarih) {
                if (!data.TumKullanicilar) throw new BadRequestException('Planlanan tarih seçildiğinde tüm kullanıcılar da seçilmelidir.');
                this.validatePlannedDate(data.PlanlananTarih);
            } else {
                if (data.HemenGonder) {
                    if (!data.TumKullanicilar) throw new BadRequestException('Hemen gönder seçildiğinde tüm kullanıcılar da seçilmelidir.');
                    await this.sendNotificationToAllUsers(template);
                }
            }
            return { status: 201, success: true };
        } catch (error) {
            throw new BadRequestException(error.message || 'Şablon oluşturma hatası');
        }
    }




    async update(userId: number, data: UpdateTemplatesDto) {
        if (!userId) throw new BadRequestException('Kullanıcı ID gereklidir');

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) throw new BadRequestException('Kullanıcı kimliği gereklidir');
        if (user.KullaniciTipi !== 2) throw new BadRequestException('Yetkisiz Kullanıcı');
        if (!data.BildirimID) throw new BadRequestException('Bildirim ID gereklidir');

        try {
            const template = await this.bildirimlerRepository.findOne({ where: { BildirimID: data.BildirimID } });

            if (!template) throw new BadRequestException('Şablon bulunamadı');

            // Anahtar benzersizliği kontrolü (Eğer Anahtar değiştirildiyse)
            if (data.Anahtar && data.Anahtar !== template.Anahtar) {
                const exectemplate = await this.bildirimlerRepository.findOne({ where: { Anahtar: data.Anahtar } });
                if (exectemplate) throw new BadRequestException('Anahtar benzersiz olmalıdır');
            }

            // Şablon güncelleniyor
            Object.assign(template, {
                Baslik: data.Baslik,
                Anahtar: data.Anahtar,
                Icerik: data.Icerik,
                Link: data.Link,
                MobilLink: data.MobilLink,
                Tur: data.Tur,
                TumKullanicilar: data.TumKullanicilar,
                PlanlananTarih: data.PlanlananTarih ? new Date(data.PlanlananTarih) : null,
                Durum: data.PlanlananTarih ? 'Beklemede' : data.HemenGonder === true ? 'Gönderildi' : 'Beklemede'
            });

            await this.bildirimlerRepository.save(template);

            // Planlanan tarih varsa ve geçmiş bir tarih değilse işlemi planla
            if (data.PlanlananTarih) {
                this.validatePlannedDate(data.PlanlananTarih);
                if (!data.TumKullanicilar) throw new BadRequestException('Planlanan tarih seçildiğinde tüm kullanıcılar da seçilmelidir.');
            }
            // Hemen gönder seçeneği işaretlenmişse bildirimi anında gönder
            else if (data.HemenGonder) {
                if (!data.TumKullanicilar) throw new BadRequestException('Hemen gönder seçildiğinde tüm kullanıcılar da seçilmelidir.');
                await this.sendNotificationToAllUsers(template);
            }

            return { status: 201, success: true };
        } catch (error) {
            throw new BadRequestException(error.message || 'Şablon güncelleme hatası');
        }
    }



    /**
   * Kullanıcıyı getir
   */
    private async getUser(userId: number): Promise<Kullanicilar | null> {
        return await this.dataSource.getRepository(Kullanicilar).findOne({ where: { id: userId } });
    }

    /**
     * Planlanan tarihin geçerli olup olmadığını kontrol et
     */
    private validatePlannedDate(planlananTarih: string): void {
        const now = new Date();
        const plannedDate = new Date(planlananTarih);
        if (plannedDate < now) {
            throw new BadRequestException('Planlanan tarih daha ileri bir tarih olmalıdır.');
        }
    }

    /**
     * Tüm kullanıcılara bildirimi hemen gönder
     */
    async sendNotificationToAllUsers(template: Bildirimler): Promise<void> {
        const kullanicilar = await this.dataSource.getRepository(Kullanicilar).find({ where: { KullaniciTipi: 1 } });

        for (const user of kullanicilar) {
            const newNotification = await this.dataSource.getRepository(KullaniciBildirimleri).save({
                KullaniciID: user.id,
                BildirimID: template.BildirimID,
                Baslik: template.Baslik,
                Link: template.Link,
                MobilLink: template.MobilLink,
                Icerik: template.Icerik,
                Durum: 'Gönderildi',
            });

            // Kullanıcıya anlık bildirim gönder
            this.appGateway.sendNotificationToUser(user.id, newNotification);
        }
    }

    /**
     * Planlanan tarihte bildirimi gönder
     */
    @Cron(CronExpression.EVERY_MINUTE) // Her dakika çalıştır
    async kontrolVeGonder(): Promise<void> {
        /*  this.logger.log('Zamanlanan bildirimler kontrol ediliyor...'); */

        const now = new Date();

        // Şu anki zamanı geçmiş ve gönderilmemiş bildirimleri al
        const bildirimler = await this.bildirimlerRepository.find({
            where: {
                PlanlananTarih: LessThanOrEqual(now),
                Durum: 'Beklemede',
                IsDeleted: false
            },
        });

        if (bildirimler.length === 0) return;

        for (const bildirim of bildirimler) {
            try {
                await this.sendNotificationToAllUsers(bildirim);
                bildirim.Durum = 'Gönderildi';
                await this.bildirimlerRepository.save(bildirim);
                this.logger.log(`Bildirim gönderildi: ${bildirim.Baslik}`);
            } catch (error) {
                this.logger.error(`Bildirim gönderme hatası: ${error.message}`);
            }
        }
    }


}
