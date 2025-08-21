import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { FirmaAbonelikleri } from './entities/firma-abonelikleri.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Bildirimler } from 'src/bildirimler/entities/bildirimler.entity';
import { AppGateway } from 'src/websocket.gateway';
import { KullaniciBildirimleri } from 'src/kullanici-bildirimleri/entities/kullanici-bildirimleri.entity';

@Injectable()
export class FirmaAbonelikleriService {
    constructor(
        @InjectRepository(FirmaAbonelikleri)
        private readonly firmaAbonelikRepository: Repository<FirmaAbonelikleri>,
        private readonly dataSource: DataSource,
        private readonly appGateway: AppGateway,
    ) { }

   
    async getAktifAbonelikler(userId: number) {

        if (!userId) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }



        const queryBuilder = this.dataSource.getRepository(FirmaAbonelikleri).createQueryBuilder('firmaAbonelikler')
            .leftJoinAndSelect('firmaAbonelikler.Kullanici', 'Kullanici')
            .leftJoinAndSelect('firmaAbonelikler.AbonelikPlan', 'AbonelikPlan')
            .where('firmaAbonelikler.KullaniciID = :KullaniciID', { KullaniciID: userId });

        const firmaAbonelikler = await queryBuilder.getOne();
        return {
            data: firmaAbonelikler
        };
    }


    async create(userId: number, data: { AbonelikPlanID: number; Durum: string }) {
        try {
            const eskiabonelik = await this.firmaAbonelikRepository.findOne({
                where: { AbonelikPlanID: data.AbonelikPlanID, KullaniciID: userId },
            });

            if (eskiabonelik) {
                // BitisTarihi'ne 30 gün ekle
                eskiabonelik.BitisTarihi = new Date(eskiabonelik.BitisTarihi);
                eskiabonelik.BitisTarihi.setDate(eskiabonelik.BitisTarihi.getDate() + 30);

                // Durumu güncelle
                eskiabonelik.Durum = data.Durum;

                // Güncellenmiş aboneliği kaydet
                return await this.firmaAbonelikRepository.save(eskiabonelik);
            } else {
                // Yeni abonelik oluştur
                const abonelik = this.firmaAbonelikRepository.create({
                    KullaniciID: userId,
                    AbonelikPlanID: data.AbonelikPlanID,
                    BaslangicTarihi: new Date(),
                    BitisTarihi: new Date(new Date().setDate(new Date().getDate() + 30)),
                    Durum: data.Durum,
                });

                // Yeni aboneliği kaydet
                return await this.firmaAbonelikRepository.save(abonelik);
            }
        } catch (error) {
            console.error("Abonelik oluşturma hatası:", error);
            throw error;
        }
    }



    async sendNotificationToAllUsers(template: Bildirimler, KullaniciID: number, BitisTarihi: Date): Promise<void> {

        if (!KullaniciID) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: KullaniciID },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }


        let body = template.Icerik;
        let subject = template.Baslik;
        if (!body || !subject) {
            console.error('Bildirim şablonunun içeriği eksik.');
        }


        const bitisTarihi = new Date(BitisTarihi);
        const formatliTarih = bitisTarihi.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const replacements = {
            FirmaAdi: user.FirmaAdi,
            BitisTarihi: formatliTarih
        }
        for (const [key, value] of Object.entries(replacements)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            body = body.replace(regex, value || 'N/A');
            subject = subject.replace(regex, value || 'N/A');
        }
        const newNotification = await this.dataSource.getRepository(KullaniciBildirimleri).save({
            KullaniciID: user.id,
            BildirimID: template.BildirimID,
            Baslik: subject,
            Link: template.Link,
            MobilLink: template.MobilLink,
            Icerik: body,
            Durum: 'Gönderildi',
        });

        // Kullanıcıya anlık bildirim gönder
        this.appGateway.sendNotificationToUser(user.id, newNotification);
    }



    /**
     * Abonelik süresi dolmasına 3 gün kalan Firmalara Bildirim ve E-posta gönder
     */
    @Cron(CronExpression.EVERY_DAY_AT_10AM) // Her gün saat 10'da çalışsın
    async kontrolVeGonder3GunKalan(): Promise<void> {
        console.log('Abonelik süresi dolmasına 3 gün kalan Firmalara Bildirim gönderildi')
        const startOfDay = new Date();
        startOfDay.setDate(startOfDay.getDate() + 3);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(startOfDay);
        endOfDay.setHours(23, 59, 59, 999);

        const abonelikler = await this.dataSource.getRepository(FirmaAbonelikleri)
            .createQueryBuilder('firmaAbonelikler')
            .where('firmaAbonelikler.BitisTarihi BETWEEN :startOfDay AND :endOfDay', { startOfDay, endOfDay })
            .getMany();


        if (abonelikler.length === 0) return;

        const bildirim = await this.dataSource.getRepository(Bildirimler)
            .findOne({ where: { Anahtar: 'abonelik-bitimine-3-gun-kaldi' } });

        if (!bildirim) return;

        for (const abonelik of abonelikler) {
            try {
                await this.sendNotificationToAllUsers(bildirim, abonelik.KullaniciID, abonelik.BitisTarihi);
                console.log(`Bildirim gönderildi: FirmaID ${abonelik.KullaniciID}`);
            } catch (error) {
                console.error(`Bildirim gönderme hatası: ${error.message}`);
            }
        }
    }

    /**
 * Abonelik süresi dolan Firmalara Bildirim gönder ve durumlarını güncelle
 */
    @Cron(CronExpression.EVERY_DAY_AT_11AM)
    async kontrolVeGonderBiten(): Promise<void> {
        try {
            console.log('Abonelik süresi dolan Firmalar kontrol ediliyor...');

            // Dün saat 11'den bugün saat 11'e kadar olan süreyi hesapla
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(11, 0, 0, 0);

            const today = new Date();
            today.setHours(11, 0, 0, 0);

            // Süresi dolan ve durumu hala aktif olan abonelikleri bul
            const abonelikler = await this.dataSource.getRepository(FirmaAbonelikleri)
                .createQueryBuilder('firmaAbonelikler')
                .where('firmaAbonelikler.BitisTarihi BETWEEN :yesterday AND :today', {
                    yesterday,
                    today
                })
                .andWhere('firmaAbonelikler.Durum != :durum', { durum: 'Bitti' })
                .getMany();

            if (abonelikler.length === 0) return;

            const bildirim = await this.dataSource.getRepository(Bildirimler)
                .findOne({ where: { Anahtar: 'abonelik-suresi-doldu' } });

            if (!bildirim) return;

            // Her abonelik için işlem yap
            for (const abonelik of abonelikler) {
                try {
                    // Abonelik durumunu güncelle
                    await this.dataSource.getRepository(FirmaAbonelikleri)
                        .update(
                            { AbonelikID: abonelik.AbonelikID },
                            { Durum: 'Bitti' }
                        );

                    // Bildirim gönder
                    await this.sendNotificationToAllUsers(
                        bildirim,
                        abonelik.KullaniciID,
                        abonelik.BitisTarihi
                    );

                } catch (error) {
                    console.error(`Hata: FirmaID için işlem başarısız:`, error.message);
                }
            }
        } catch (error) {
            console.error('Abonelik kontrol işlemi sırasında hata:', error);
        }
    }


}
