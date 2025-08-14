import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { KullaniciDavetleri } from './entities/kullanici-davetleri.entity';
import { CreateFirmaKullaniciDto } from './dto/create.dto';
import { MailService } from 'src/mail/mail.service';
import { Firma } from 'src/firmalar/entities/firma.entity';
import { Bildirimler } from 'src/bildirimler/entities/bildirimler.entity';
import { KullaniciBildirimleri } from 'src/kullanici-bildirimleri/entities/kullanici-bildirimleri.entity';
import { AppGateway } from 'src/websocket.gateway';
import { Personel } from 'src/personel/entities/personel.entity';
import { Teknokentler } from 'src/teknokentler/entities/teknokentler.entity';

@Injectable()
export class KullaniciDavetleriService {
    constructor(
        @InjectRepository(KullaniciDavetleri)
        private readonly kullaniciDavetleriRepository: Repository<KullaniciDavetleri>,
        private readonly mailService: MailService,
        private readonly dataSource: DataSource,
        private readonly appGateway: AppGateway,
    ) { }

    async getIliskiDavetleri(userId: number, query: any, iliskiId: number) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;

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

        const iliskiYetki = await this.dataSource.getRepository(Personel).findOne({
            where: { IliskiID: iliskiId, KullaniciID: userId }
        });
        if (!iliskiYetki) {
            throw new BadRequestException(`Kullanıcının bu ilişki için izni yok`);
        }

        const queryBuilder = this.dataSource.getRepository(KullaniciDavetleri)
            .createQueryBuilder('kullaniciDavetleri')
            .leftJoinAndSelect('kullaniciDavetleri.Grup', 'Grup')
            .where('kullaniciDavetleri.IliskiID = :IliskiID', { IliskiID: iliskiId });

        if (user.KullaniciTipi === 3) {
            queryBuilder.leftJoinAndMapOne(
                'kullaniciDavetleri.Teknokent',
                Teknokentler,
                'Teknokent',
                'Teknokent.TeknokentID = kullaniciDavetleri.IliskiID'
            );
            queryBuilder.andWhere('Teknokent.IsDeleted != :IsDeleted', { IsDeleted: true });
        } else {
            queryBuilder.leftJoinAndMapOne(
                'kullaniciDavetleri.Firma',
                Firma,
                'Firma',
                'Firma.FirmaID = kullaniciDavetleri.IliskiID'
            );
            queryBuilder.andWhere('Firma.IsDeleted != :IsDeleted', { IsDeleted: true });
        }

        queryBuilder.skip((page - 1) * limit).take(limit);

        const [kullaniciDavetleri, total] = await queryBuilder.getManyAndCount();
        return {
            data: kullaniciDavetleri,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }





    async create(userId: number, data: CreateFirmaKullaniciDto) {

        if (!userId) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId }
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }
        const userRole = await this.dataSource.getRepository(Personel).findOne({
            where: { KullaniciID: userId }
        });
        if (!userRole || userRole.Rol !== 'owner') {
            throw new BadRequestException(`Bu işlem için yetkiniz yok`);
        }

        let firma = null;
        if (userRole.Tip === 1 || userRole.Tip === 2) {
            firma = await this.dataSource.getRepository(Firma).findOne({ where: { FirmaID: data.IliskiID } });
            if (!firma) {
                throw new BadRequestException(`Firma bulunamdı`);
            }
        }
        let teknokent = null;
        if (userRole.Tip === 3) {
            teknokent = await this.dataSource.getRepository(Teknokentler).findOne({ where: { TeknokentID: data.IliskiID } });
            if (!teknokent) {
                throw new BadRequestException(`Teknokent bulunamdı`);
            }
        }

        const emailsorgu = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { Email: data.email }
        });
        if (emailsorgu && emailsorgu.id) {
            if (emailsorgu.KullaniciTipi !== 1) {
                throw new BadRequestException(`Bu kullanıcının başka bir aktif görevi var. Eklenemez.`);
            }
            const userfirma = await this.dataSource.getRepository(Personel).findOne({
                where: { IliskiID: data.IliskiID, KullaniciID: emailsorgu.id, Tip: userRole.Tip === 3 ? 3 : 1 }
            });

            if (userfirma) {
                throw new BadRequestException(`Bu kullanıcı bu ${userRole.Tip === 3 ? 'teknokente' : 'firmaya'} zaten ekli`);
            }
        }

        const davetlimi = await this.dataSource.getRepository(KullaniciDavetleri).findOne({
            where: { IliskiID: data.IliskiID, Email: data.email }
        });

        if (davetlimi) {
            throw new BadRequestException(`Bu kullanıcı bu ${userRole.Tip === 3 ? 'teknokente' : 'firmaya'} zaten davet edilmiş`);
        }


        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const firmakullanici = await queryRunner.manager.save(KullaniciDavetleri, {
                IliskiID: data.IliskiID,
                Tip: user.KullaniciTipi === 3 ? 3 : 1,
                PersonelID: data.PersonelID,
                Email: data.email,
                DavetciKullaniciID: userId,
                GrupID: data.GrupID
            });

            const redirectlink = `${process.env.FRONTEND_URL}`;

            try {
                if (user.KullaniciTipi === 3) {
                    await this.mailService.sendEmailWithTemplate(
                        'tekno-kullanici-davet',
                        {
                            DavetciKullaniciAdi: user.AdSoyad,
                            TeknokentAdi: teknokent.TeknokentAdi,
                            YonlendirmeLinki: redirectlink,
                        },
                        data.email
                    );
                } else {
                    await this.mailService.sendEmailWithTemplate(
                        'firma-kullanici-davet',
                        {
                            DavetciKullaniciAdi: user.AdSoyad,
                            FirmaAdi: firma.FirmaAdi,
                            YonlendirmeLinki: redirectlink,
                        },
                        data.email
                    );
                }

            } catch (error) {
                if (error instanceof BadRequestException) {
                    throw error;
                }
                throw new InternalServerErrorException('E-posta gönderme işlemi sırasında bir hata oluştu.');
            }
            // İşlemi Tamamla (Commit)
            await queryRunner.commitTransaction();
            const queryBuilder = this.kullaniciDavetleriRepository.createQueryBuilder('kullanicidavet')
                .leftJoinAndSelect('kullanicidavet.Grup', 'Grup')
                .where('kullanicidavet.id = :id', { id: firmakullanici.id });

            if (user.KullaniciTipi === 3) {
                queryBuilder.leftJoinAndMapOne(
                    'kullanicidavet.Teknokent',
                    Teknokentler,
                    'Teknokent',
                    'Teknokent.TeknokentID = kullanicidavet.IliskiID'
                );
                queryBuilder.andWhere('Teknokent.IsDeleted != :IsDeleted', { IsDeleted: true });
                return await queryBuilder.getOne();
            } else {
                queryBuilder.leftJoinAndMapOne(
                    'kullanicidavet.Firma',
                    Firma,
                    'Firma',
                    'Firma.FirmaID = kullanicidavet.IliskiID'
                );
                queryBuilder.andWhere('Firma.IsDeleted != :IsDeleted', { IsDeleted: true });
                return await queryBuilder.getOne();
            }
        } catch (error) {
            await queryRunner.rollbackTransaction();
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Kullanıcı daveti işlemi sırasında bir hata oluştu.');
        } finally {
            await queryRunner.release();
        }

    }




    async cevap(userId: number, data: { DavetID: number, Cevap: string }) {
        if (!userId) throw new BadRequestException(`Kullanıcı kimliği gereklidir`);

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({ where: { id: userId } });
        if (!user) throw new BadRequestException(`Kullanıcı bulunamadı`);

        const davet = await this.dataSource.getRepository(KullaniciDavetleri).findOne({ where: { id: data.DavetID } });
        if (!davet) throw new BadRequestException(`Davet bulunamadı`);

        if (!['Onaylandı', 'Reddedildi'].includes(data.Cevap)) {
            throw new BadRequestException(`Cevap yanlış formatta geldi`);
        }

        if (user.Email.toLocaleLowerCase() !== davet.Email.toLocaleLowerCase()) {
            throw new BadRequestException(`Davet edilen kullanıcı işlem yapanla aynı olmalı.`);
        }

        const queryBuilder = this.dataSource.getRepository(Personel)
            .createQueryBuilder('personel')
            .where('personel.IliskiID = :IliskiID', { IliskiID: davet.IliskiID })
            .andWhere('personel.KullaniciID = :KullaniciID', { KullaniciID: davet.DavetciKullaniciID })
            .andWhere('personel.IsDeleted != :IsDeleted', { IsDeleted: true });

        if (davet.Tip === 3) {
            queryBuilder.leftJoinAndMapOne('personel.Teknokent', Teknokentler, 'Teknokent', 'Teknokent.TeknokentID = personel.IliskiID')
                .andWhere('Teknokent.IsDeleted != :IsDeleted', { IsDeleted: true });
        } else {
            queryBuilder.leftJoinAndMapOne('personel.Firma', Firma, 'Firma', 'Firma.FirmaID = personel.IliskiID')
                .andWhere('Firma.IsDeleted != :IsDeleted', { IsDeleted: true });
        }

        const davetiliski = await queryBuilder.getOne();
        if (!davetiliski) throw new BadRequestException(`Davet eden kullanıcı bulunamadı`);

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const result = await this.dataSource.getRepository(KullaniciDavetleri).update(
                { id: data.DavetID },
                { Durum: data.Cevap }
            );

            if (result.affected === 0) throw new BadRequestException(`Davet güncellenemedi veya zaten bu durumda`);

            if (data.Cevap === 'Onaylandı') {
                await this.handlePersonelAtama(queryRunner, user, davet);
            }

            const isTeknokent = davet.Tip === 3;

            const bildirimAnahtar = isTeknokent
                ? (data.Cevap === 'Onaylandı' ? 'tekno-kullanici-daveti-kabul' : 'tekno-kullanici-daveti-red')
                : (data.Cevap === 'Onaylandı' ? 'firma-kullanici-daveti-kabul' : 'firma-kullanici-daveti-red');

            const replacements = {
                DavetliKullaniciAdi: user.AdSoyad,
                ...(isTeknokent
                    ? { TeknokentAdi: davetiliski.Teknokent?.TeknokentAdi }
                    : { FirmaAdi: davetiliski.Firma?.FirmaAdi })
            };

            await this.sendNotification(replacements, davet.DavetciKullaniciID, bildirimAnahtar);
            await queryRunner.commitTransaction();

            return { status: 201, success: true };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw new BadRequestException(error.message || 'Kullanıcı daveti cevaplama hatası');
        } finally {
            await queryRunner.release();
        }
    }


    private async handlePersonelAtama(queryRunner: QueryRunner, user: Kullanicilar, davet: KullaniciDavetleri) {
        const personelRepo = this.dataSource.getRepository(Personel);

        const firma = davet.Tip !== 3
            ? await this.dataSource.getRepository(Firma).findOne({ where: { FirmaID: davet.IliskiID } })
            : null;

        if (davet.Tip !== 3 && !firma) throw new BadRequestException('Firma bulunamadı');

        const ortakAlanlar = {
            IliskiID: davet.IliskiID,
            KullaniciID: user.id,
            Rol: 'kullanici',
            GrupID: davet.GrupID,
            AdSoyad: user.AdSoyad,
            ...(firma ? {
                MesaiBaslangic: firma.MesaiBaslangic,
                MesaiBitis: firma.MesaiBitis,
                IseGirisTarihi: new Date()
            } : {})
        };

        const personel = davet.PersonelID
            ? await personelRepo.findOne({ where: { PersonelID: davet.PersonelID } })
            : null;

        if (personel) {
            Object.assign(personel, ortakAlanlar);
            await personelRepo.save(personel);
        } else {
            await queryRunner.manager.save(Personel, ortakAlanlar);
        }
    }


    async sendNotification(replacements: Record<string, string>, KullaniciID: number, bildirimAnahtar: string): Promise<void> {
        const template = await this.dataSource.getRepository(Bildirimler).findOne({ where: { Anahtar: bildirimAnahtar } });
        let body = template.Icerik;
        let subject = template.Baslik;
        if (!body || !subject) {
            console.error('Bildirim şablonunun içeriği eksik.');
        }

        for (const [key, value] of Object.entries(replacements)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            body = body.replace(regex, value || 'N/A');
            subject = subject.replace(regex, value || 'N/A');
        }


        const bildirim = {
            KullaniciID: KullaniciID,
            BildirimID: template.BildirimID,
            Baslik: subject,
            Link: template.Link,
            MobilLink: template.MobilLink,
            Icerik: body,
            Durum: 'Gönderildi',
        }

        const newNotification = await this.dataSource.getRepository(KullaniciBildirimleri).save(bildirim);

        // Kullanıcıya anlık bildirim gönder
        this.appGateway.sendNotificationToUser(KullaniciID, newNotification);

    }

}
