import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { KullaniciFirmalari } from './entities/kullanici-firmalari.entity';
import { UpdateFirmaKullaniciDto } from './dto/iliskiupdate.dto';
import { GrupYetkileri } from 'src/grup-yetkileri/entities/grup-yetkileri.entity';
import { FirmaAbonelikleri } from 'src/firma-abonelikleri/entities/firma-abonelikleri.entity';

@Injectable()
export class KullaniciFirmalariService {
    constructor(
        @InjectRepository(KullaniciFirmalari)
        private readonly kullaniciFirmalariRepository: Repository<KullaniciFirmalari>,
        private readonly dataSource: DataSource
    ) { }

    async getKullaniciFirmalari(userId: number) {
        if (!userId) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }

        try {
            const aktifAbonelikler = await this.dataSource.getRepository(FirmaAbonelikleri)
                .createQueryBuilder('a')
                .where('a.BitisTarihi > :today', { today: new Date() })
                .getMany();
            // Kullanıcı firmalarını getir
            const kullaniciFirmalari = await this.dataSource.getRepository(KullaniciFirmalari)
                .createQueryBuilder('kf')
                .leftJoinAndSelect('kf.Firma', 'Firma')
                .leftJoinAndSelect('kf.Gurup', 'Gurup')
                .where('kf.KullaniciID = :KullaniciID', { KullaniciID: userId })
                .andWhere('Firma.IsDeleted = :IsDeleted', { IsDeleted: 0 })
                .getMany();

            // Her bir kullaniciFirmalari kaydı için Gurup ilişkisini kontrol edip GrupYetkileri'ni ekliyoruz
            for (const kf of kullaniciFirmalari) {
                const aktifAbonelikVarMi = aktifAbonelikler.some(
                    (a) => a.FirmaID === kf.Firma?.FirmaID
                );

                (kf as any).AbonelikAktif = aktifAbonelikVarMi;

                // Sadece abonelik aktifse yetkileri getir
                if (aktifAbonelikVarMi && kf.Gurup) {
                    const grupYetkileri = await this.dataSource.getRepository(GrupYetkileri)
                        .createQueryBuilder('yetkiler')
                        .where('yetkiler.GrupID = :GrupID', { GrupID: kf.Gurup.GrupID })
                        .getMany();

                    kf.Gurup.Yetkiler = grupYetkileri;
                }
            }

            return kullaniciFirmalari;
        } catch (error) {
            throw new BadRequestException(error.message || 'Kullanıcı firmaları getirme hatası');
        }
    }

    async fullKullaniciFirmalari(userId: number) {

        if (!userId) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }


        try {
            const queryBuilder = this.dataSource.getRepository(KullaniciFirmalari)
                .createQueryBuilder('kullaniciFirmalari')
                .leftJoinAndSelect('kullaniciFirmalari.Firma', 'Firma')
                .leftJoinAndSelect('FirmaAbonelikleri', 'Abonelik', 'Abonelik.FirmaID = Firma.FirmaID')
                .where('kullaniciFirmalari.KullaniciID = :KullaniciID', { KullaniciID: userId })
                .andWhere('kullaniciFirmalari.Rol = :Rol', { Rol: 'owner' })
                .andWhere('Firma.IsDeleted = :IsDeleted', { IsDeleted: 0 })

            const kullaniciFirmalari = await queryBuilder.getMany();


            return kullaniciFirmalari;
        } catch (error) {
            throw new BadRequestException(error.message || 'Kullanıcı firmaları getirme hatası');
        }
    }

    async getFirmaKullanicilari(userId: number, query: any, firmaId: number) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;

        if (isNaN(page) || isNaN(limit)) {
            throw new BadRequestException('Sayfa ve sınır numaraları geçerli olmalı');
        }

        if (!userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }

        // Kullanıcı doğrulama
        const user = await this.dataSource.getRepository(Kullanicilar).findOne({ where: { id: userId } });
        if (!user) {
            throw new BadRequestException('Kullanıcı kimliği geçersiz');
        }

        // Kullanıcının firmaya erişim yetkisi kontrolü
        const firmaYetki = await this.dataSource.getRepository(KullaniciFirmalari).findOne({
            where: { FirmaID: firmaId, KullaniciID: userId },
        });
        if (!firmaYetki) {
            throw new BadRequestException('Kullanıcının bu firmaya erişim yetkisi yok');
        }

        try {
            // Firma kullanıcılarını getir
            const queryBuilder = this.dataSource.getRepository(KullaniciFirmalari)
                .createQueryBuilder('kullaniciFirmalari')
                .leftJoinAndSelect('kullaniciFirmalari.Firma', 'Firma')
                .leftJoinAndSelect('kullaniciFirmalari.Kullanici', 'Kullanici')
                .leftJoinAndSelect('kullaniciFirmalari.Gurup', 'Gurup')
                .where('kullaniciFirmalari.FirmaID = :firmaId', { firmaId })
                .andWhere('Firma.IsDeleted = :IsDeleted', { IsDeleted: 0 })
                .skip((page - 1) * limit)
                .take(limit);

            const [kullaniciFirmalari, total] = await queryBuilder.getManyAndCount();

            // Kullanıcı ve firma bazlı yetkileri getir
            const kullaniciIDs = kullaniciFirmalari.map(kf => kf.KullaniciID);
            if (kullaniciIDs.length > 0) {
                const yetkiler = await this.dataSource.getRepository(GrupYetkileri)
                    .createQueryBuilder('yetkiler')
                    .leftJoin('yetkiler.Gurup', 'gurup')
                    .leftJoin('gurup.Kullanicilar', 'kullanicilar')
                    .select('kullanicilar.id', 'KullaniciID')
                    .addSelect('yetkiler.FirmaID', 'FirmaID')
                    .addSelect("STRING_AGG(yetkiler.Yetki, ', ')", 'Yetkiler')
                    .where('kullanicilar.id IN (:...kullaniciIDs)', { kullaniciIDs })
                    .andWhere('yetkiler.FirmaID = :firmaId', { firmaId })
                    .groupBy('kullanicilar.id, yetkiler.FirmaID')
                    .getRawMany();

                // Yetkileri KullaniciID ve FirmaID bazında map'le
                const yetkilerMap = new Map();
                yetkiler.forEach(yetki => {
                    const key = `${yetki.KullaniciID}-${yetki.FirmaID}`;
                    yetkilerMap.set(key, yetki.Yetkiler.split(', '));
                });

                // Kullanıcı firmalarına yetkileri ekle
                const data = kullaniciFirmalari.map(kf => ({
                    id: kf.id,
                    FirmaID: kf.FirmaID,
                    Firma: kf.Firma,
                    Rol: kf.Rol,
                    Gurup: kf.Gurup,
                    KullaniciID: kf.KullaniciID,
                    Kullanici: kf.Kullanici,
                    IsDeleted: kf.IsDeleted,
                    Yetkiler: yetkilerMap.get(`${kf.KullaniciID}-${kf.FirmaID}`) || [],
                }));

                return {
                    data,
                    total,
                    page,
                    lastPage: Math.ceil(total / limit),
                };
            } else {
                // Eğer kullanıcı yoksa boş bir sonuç döndür
                return {
                    data: [],
                    total: 0,
                    page,
                    lastPage: 0,
                };
            }
        } catch (error) {
            throw new BadRequestException(error.message || 'Firma kullanıcılarını getirme hatası');
        }
    }


    async update(userId: number, data: UpdateFirmaKullaniciDto) {
        if (!userId) throw new BadRequestException(`Kullanıcı kimliği gereklidir`);

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({ where: { id: userId } });
        if (!user) throw new BadRequestException(`Kullanıcı kimliği gereklidir`);

        const userRole = await this.dataSource.getRepository(KullaniciFirmalari).findOne({ where: { KullaniciID: userId } });
        if (!userRole || userRole.Rol !== 'owner') throw new BadRequestException(`Bu işlem için yetkiniz yok`);

        if (!data.KullaniciID || !data.FirmaID || !data.GrupID) {
            throw new BadRequestException('Geçersiz kullanıcı, grup veya firma bilgisi');
        }

        const idsorgu = await this.dataSource.getRepository(Kullanicilar).findOne({ where: { id: data.KullaniciID } });
        if (!idsorgu) throw new BadRequestException(`Kullanıcı bulunamadı`);

        const userfirma = await this.dataSource.getRepository(KullaniciFirmalari).findOne({
            where: { FirmaID: data.FirmaID, KullaniciID: data.KullaniciID }
        });
        if (!userfirma) throw new BadRequestException(`Bu firmaya ait kullanıcı bulunamadı`);

        const islemuserRole = await this.dataSource.getRepository(KullaniciFirmalari).findOne({ where: { KullaniciID: data.KullaniciID } });
        if (!islemuserRole || islemuserRole.Rol === 'owner') throw new BadRequestException(`Ovner yetkisi olan kullanıcılar üzerinde güncelleme işlemi yapılamaz`);

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Kullanıcı rolünü güncelle
            await queryRunner.manager.getRepository(KullaniciFirmalari).update({ id: userfirma.id }, { GrupID: data.GrupID });

            await queryRunner.commitTransaction();
            const firmaKullanici = await this.kullaniciFirmalariRepository.createQueryBuilder('firmakullanici')
                .leftJoinAndSelect('firmakullanici.Firma', 'Firma')
                .leftJoinAndSelect('firmakullanici.Kullanici', 'Kullanici')
                .leftJoinAndSelect('firmakullanici.Gurup', 'Gurup')
                .where('firmakullanici.id = :id', { id: userfirma.id })
                .getOne();

            return firmaKullanici;
        } catch (error) {
            if (queryRunner.isTransactionActive) {
                await queryRunner.rollbackTransaction();
            }
            throw new BadRequestException(error.message || 'Firma kullanici güncelleme hatası');
        } finally {
            await queryRunner.release();
        }
    }



    async delete(userId: number, data: any) {
        if (!userId) throw new BadRequestException(`Kullanıcı kimliği gereklidir`);

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({ where: { id: userId } });
        if (!user) throw new BadRequestException(`Kullanıcı kimliği gereklidir`);

        const userRole = await this.dataSource.getRepository(KullaniciFirmalari).findOne({ where: { KullaniciID: userId } });
        if (!userRole || userRole.Rol !== 'owner') throw new BadRequestException(`Bu işlem için yetkiniz yok`);

        if (!data || !data.itemId) {
            throw new BadRequestException('Geçersiz kullanıcı veya firma bilgisi');
        }



        const userfirma = await this.dataSource.getRepository(KullaniciFirmalari).findOne({
            where: { id: data.itemId }
        });
        if (!userfirma) throw new BadRequestException(`Bu firmaya ait kullanıcı bulunamadı`);
        if (!userfirma || userfirma.Rol === 'owner') throw new BadRequestException(`Owner yetkisi olan kullanıcılar üzerinde silme işlemi yapılamaz`);

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {

            // Kullanıcıyı sil
            await queryRunner.manager.getRepository(KullaniciFirmalari).delete({ id: userfirma.id });

            await queryRunner.commitTransaction();
            return {
                message: 'Kullanıcı başarıyla silindi',
            };
        } catch (error) {
            if (queryRunner.isTransactionActive) {
                await queryRunner.rollbackTransaction();
            }
            throw new BadRequestException(error.message || 'Firma kullanici silme hatası');
        } finally {
            await queryRunner.release();
        }
    }

}
