import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { Firma } from 'src/firmalar/entities/firma.entity';
import { AbonelikPlanlari } from 'src/abonelik-planlari/entities/abonelik-planlari.entity';
import { FaturaBilgileri } from 'src/fatura-bilgileri/entities/fatura-bilgileri.entity';
import { Odemeler } from './entities/odemeler.entity';
import { CreateOdemeDto } from './dto/create.dto';
import { Siparisler } from 'src/siparisler/entities/siparisler.entity';
import { FaturaBilgileriService } from 'src/fatura-bilgileri/fatura-bilgileri.service';
import { FaturalarService } from 'src/faturalar/faturalar.service';
import { FirmaAbonelikleriService } from 'src/firma-abonelikleri/firma-abonelikleri.service';
import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { Bildirimler } from 'src/bildirimler/entities/bildirimler.entity';
import { KullaniciBildirimleri } from 'src/kullanici-bildirimleri/entities/kullanici-bildirimleri.entity';
import { AppGateway } from 'src/websocket.gateway';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class OdemelerService {
    constructor(
        @InjectRepository(Odemeler)
        private readonly odemelerRepository: Repository<Odemeler>,
        private readonly dataSource: DataSource,
        private readonly faturaBilgiService: FaturaBilgileriService,
        private readonly faturaService: FaturalarService,
        private readonly firmaAbonelikleriService: FirmaAbonelikleriService,
        private readonly appGateway: AppGateway,
    ) { }

    async create(userId: number, data: CreateOdemeDto) {
        if (!userId) {
            throw new BadRequestException(`Kullanıcı ID gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı bulunamadı.`);
        }

        const siparis = await this.dataSource.getRepository(Siparisler).findOne({
            where: { SiparisID: data.SiparisID },
            relations: ['Firma', 'AbonelikPlan']
        });

        if (!siparis) {
            throw new BadRequestException(`Sipariş bulunamadı.`);
        }

        if (siparis.Durum.toLowerCase() === 'ödendi') {
            throw new BadRequestException(`Bu siparişin ödemesi zaten yapılmış.`);
        }

        if (siparis.Durum === 'İşlem Başlatıldı') {
            return {
                status: 213,
                devamEdenIslem: true,
                message: `Bu siparişin ödeme işlemi başlatılmış. Lütfen ödeme işlemini tamamlayınız.`
            };
        }

        const firma = await this.dataSource.getRepository(Firma).findOne({
            where: { FirmaID: siparis.FirmaID },
        });

        if (!firma) {
            throw new BadRequestException(`Firma bulunamadı.`);
        }

        const plan = await this.dataSource.getRepository(AbonelikPlanlari).findOne({
            where: { AbonelikPlanID: siparis.AbonelikPlanID },
        });

        if (!plan) {
            throw new BadRequestException(`Abonelik planı bulunamadı.`);
        }




        try {
            // Fatura Bilgisi Güncelleme
            const faturabilgi = await this.faturaBilgiService.upload(userId, { ...data.faturaBilgi, FirmaID: siparis.FirmaID });

            // Sipariş Güncelleme
            siparis.Durum = 'İşlem Başlatıldı';
            siparis.FaturaBilgiID = faturabilgi.FaturaBilgiID;

            await this.dataSource.getRepository(Siparisler).save(siparis);




            //Geçici işlem değişecek
            //await this.basarilisonuc(siparis.SiparisID);


            //Havale Eft işlemi
            if (data.odemeYontemi === 'Havale/EFT') {
                const adminler = await this.dataSource.getRepository(Kullanicilar).find({
                    where: { KullaniciTipi: 2 }
                });


                if (adminler.length === 0) return;

                const bildirim = await this.dataSource.getRepository(Bildirimler)
                    .findOne({ where: { Anahtar: 'havale-eft-bildirimi' } });

                if (!bildirim) return;

                for (const admin of adminler) {
                    try {
                        await this.sendNotificationToAdminUsers(admin.id, bildirim, siparis)
                    } catch (error) {
                        console.error(`Bildirim gönderme hatası: ${error.message}`);
                    }
                }

                return {
                    status: 201,
                    FirmaID: siparis.FirmaID,
                    message: 'Ödeme bildirimi alındı.',
                };
            }


            return {
                status: 201,
                FirmaID: siparis.FirmaID,
                message: 'Ödeme işlemi başarıyla tamamlandı.',
            };
        } catch (error) {
            console.error("Ödeme işlemi sırasında hata oluştu:", error);
            throw new BadRequestException(
                error.message || 'Ödeme işlemi gerçekleştirilemedi.'
            );
        }
    }


    // Ödeme onaylama işlemi
    async odemeOnay(userId: number, siparisID: number) {
        if (!userId) {
            throw new BadRequestException(`Kullanıcı ID gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı bulunamadı.`);
        }

        if (user.KullaniciTipi !== 2) {
            throw new ForbiddenException('Bu eylemi gerçekleştirme izniniz yok')
        }

        try {
            await this.basarilisonuc(siparisID, 'Havale/EFT');

            return {
                status: 201,
                message: 'Ödeme onaylama işlemi başarıyla tamamlandı.',
            };
        } catch (error) {
            console.error("Ödeme onaylama işlemi sırasında hata oluştu:", error);
            throw new BadRequestException(
                error.message || 'Ödeme onaylama işlemi gerçekleştirilemedi.'
            );
        }

    }


    async sonuc(req: Request, res: Response) {

        const callback = req.body;
        const merchant_salt = 'ZZZZZZZZZZZZZZ';
        const merchant_id = 'XXXXXX';
        const merchant_key = 'YYYYYYYYYYYYYY';
        // POST değerleri ile hash oluştur.
        const paytr_token = callback.merchant_oid + merchant_salt + callback.status + callback.total_amount;
        let token = crypto.createHmac('sha256', merchant_key).update(paytr_token).digest('base64');

        // Oluşturulan hash'i, paytr'dan gelen post içindeki hash ile karşılaştır (isteğin paytr'dan geldiğine ve değişmediğine emin olmak için)
        // Bu işlemi yapmazsanız maddi zarara uğramanız olasıdır.

        if (token != callback.hash) {
            throw new Error("PAYTR notification failed: bad hash");
        }

        if (callback.status == 'success') {
            //basarili
            this.basarilisonuc(callback.merchant_oid, 'Kredi Kartı');
        } else {
            //basarisiz
            const basarisizdurum = `${callback.failed_reason_code} - ${callback.failed_reason_msg}`;
            this.basarisizsonuc(callback.merchant_oid, basarisizdurum);
        }

        return res.send('OK');

    }



    private async basarilisonuc(SiparisID: number, OdemeYontemi: string) {
        const siparis = await this.dataSource.getRepository(Siparisler).findOne({
            where: { SiparisID: SiparisID },
        });

        if (!siparis) {
            throw new BadRequestException(`Sipariş bulunamadı.`);
        }
        if (siparis.Durum === 'Ödendi' && siparis.OdemeTarihi !== null) {
            throw new BadRequestException(`Sipariş kaydı daha önce onaylanmış.`);
        }
        try {
            const odeme = this.odemelerRepository.create({
                SiparisID: siparis.SiparisID,
                KullaniciID: siparis.KullaniciID,
                OdemeTarihi: new Date(),
                Tutar: siparis.Tutar,
                OdemeYontemi: OdemeYontemi,
            });

            await this.odemelerRepository.save(odeme);

            // Fatura Bilgisi ve Abonelik Paralel Çalıştırılıyor

            const abonelik = await this.firmaAbonelikleriService.create(siparis.FirmaID, {
                AbonelikPlanID: siparis.AbonelikPlanID,
                Durum: 'Aktif',
            });

            const fatura = await this.faturaService.create(siparis.KullaniciID, {
                AbonelikID: abonelik.AbonelikID,
                KullaniciID: siparis.KullaniciID,
                FirmaID: siparis.FirmaID,
                FaturaBilgiID: siparis.FaturaBilgiID,
                Tutar: odeme.Tutar.toString(),
            });

            // Sipariş Güncelleme
            siparis.Durum = 'Ödendi';
            siparis.OdemeTarihi = new Date();
            siparis.FaturaID = fatura.FaturaID;

            await this.dataSource.getRepository(Siparisler).save(siparis);
        } catch (error) {
            console.log('Başarılı sonuç işlenirken hata oluştu', error)
        }
    }


    private async basarisizsonuc(SiparisID: number, basarisizdurum: string) {
        const siparis = await this.dataSource.getRepository(Siparisler).findOne({
            where: { SiparisID: SiparisID },
        });

        if (!siparis) {
            throw new BadRequestException(`Sipariş bulunamadı.`);
        }
        try {
            siparis.Durum = 'Ödenmedi';
            siparis.OdemeTarihi = new Date();
            siparis.OdenmemeSebebi = basarisizdurum;

            await this.dataSource.getRepository(Siparisler).save(siparis);
        } catch (error) {
            console.log('Başarısız sonuç işlenirken hata oluştu', error)
        }
    }



    async sendNotificationToAdminUsers(KullaniciID: number, template: Bildirimler, siparis: any): Promise<void> {
        let body = template.Icerik;
        let subject = template.Baslik;
        if (!body || !subject) {
            console.error('Bildirim şablonunun içeriği eksik.');
        }
        const replacements = {
            FirmaAdi: siparis.Firma.FirmaAdi,
            AbonelikPaketi: siparis.AbonelikPlan.PlanAdi,
            Tutar: siparis.Tutar,
            SiparisId: siparis.SiparisID
        }
        for (const [key, value] of Object.entries(replacements)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            body = body.replace(regex, value || 'N/A');
            subject = subject.replace(regex, value || 'N/A');
        }
        const newNotification = await this.dataSource.getRepository(KullaniciBildirimleri).save({
            KullaniciID: KullaniciID,
            BildirimID: template.BildirimID,
            Baslik: subject,
            Link: template.Link,
            MobilLink: template.MobilLink,
            Icerik: body,
            Durum: 'Gönderildi',
        });

        // Kullanıcıya anlık bildirim gönder
        this.appGateway.sendNotificationToUser(KullaniciID, newNotification);

    }


    /**
* Sipariş Durumu 'İşlem başlatıldı' olanları 24 saat sonra 'Ödenmedi' olarak işaretle
*/
    @Cron(CronExpression.EVERY_HOUR) // Her saat kontrol et
    async odemeDurumKontrol(): Promise<void> {
        try {
            console.log('Ödeme durumu kontrol ediliyor...');

            // 24 saat öncesinin tarihini hesapla
            const yirmidortSaatOnce = new Date();
            yirmidortSaatOnce.setHours(yirmidortSaatOnce.getHours() - 24);

            // Durumu Ödendi olmayan ve oluşturma tarihi 24 saat önce olan siparişleri bul
            const siparisler = await this.dataSource.getRepository(Siparisler)
                .createQueryBuilder('siparisler')
                .where('siparisler.Durum != :durum', { durum: 'Ödendi' })
                .andWhere('siparisler.Durum != :durum', { durum: 'Ödenmedi' })
                .andWhere('siparisler.OlusturmaTarihi <= :yirmidortSaatOnce', {
                    yirmidortSaatOnce
                })
                .getMany();

            console.log(`${siparisler.length} adet işlem bekleyen sipariş bulundu`);

            if (siparisler.length === 0) return;

            // Siparişleri toplu güncelle
            await this.dataSource.getRepository(Siparisler)
                .createQueryBuilder()
                .update(Siparisler)
                .set({
                    Durum: 'Ödenmedi',
                    OdenmemeSebebi: '24 saat içinde ödeme yapılmadı'
                })
                .whereInIds(siparisler.map(s => s.SiparisID))
                .execute();

            console.log(`${siparisler.length} adet sipariş Ödenmedi olarak işaretlendi`);

        } catch (error) {
            console.error('Sipariş durumu kontrol işlemi sırasında hata:', error);
        }
    }

}
