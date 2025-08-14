import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { Surecler } from './entities/surecler.entity';
import { SurecAdimlari } from './entities/surec-adimlari.entity';
import { SurecAdimBaglantilari } from './entities/surec-adim-baglantilari.entity';

@Injectable()
export class SureclerService {
    constructor(
        @InjectRepository(Surecler)
        private readonly sureclerRepository: Repository<Surecler>,
        private readonly dataSource: DataSource
    ) { }


    async getActiveSurecler() {
        // Tüm dilleri getir
        const sureclerlar = await this.dataSource
            .getRepository(Surecler)
            .find({
                where: { IsDeleted: false },
                relations: {
                    Adimlar: {
                        HedefAdimBaglantilari: true,
                        KaynakAdimBaglantilari: true
                    }
                }
            });
        return sureclerlar;
    }

    async getActiveSurecAdimlari() {
        // Tüm dilleri getir
        const sureclerlar = await this.dataSource
            .getRepository(SurecAdimlari)
            .find({
                relations: {
                    Surec: true,
                    HedefAdimBaglantilari: true,
                    KaynakAdimBaglantilari: true,
                }
            });
        return sureclerlar;
    }

    async getSurecler(userId: number, query: any) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'Tanim';
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



        const queryBuilder = this.dataSource.getRepository(Surecler).createQueryBuilder('surec')
            .leftJoinAndSelect('surec.Adimlar', 'adimlar')
            .leftJoinAndSelect('adimlar.HedefAdimBaglantilari', 'kaynaklar')
            .leftJoinAndSelect('adimlar.KaynakAdimBaglantilari', 'hedefler');



        // Filtreleme işlemi

        Object.keys(filter).forEach((key) => {
            if (!['SurecAdi'].includes(key)) return;
            queryBuilder.andWhere(`surec.${key} LIKE :${key}`, { [key]: `%${filter[key]}%` });
        });

        // Sıralama işlemi
        const validSortFields = ['SurecAdi'];
        if (sort && validSortFields.includes(sort)) {
            queryBuilder.orderBy(`surec.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        }

        queryBuilder.skip((page - 1) * limit).take(limit);

        const [surec, total] = await queryBuilder.getManyAndCount();
        return {
            data: surec,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }


    async adimlarUpload(userId: number, data: any) {
        if (!userId) {
            throw new BadRequestException(`Kullanıcı ID gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı bulunamadı`);
        }

        if (user?.KullaniciTipi !== 2) {
            throw new BadRequestException(`Yetkisiz Kullanıcı`);
        }

        if (!data || !data.SurecID) {
            throw new BadRequestException(`Adım verisi gönderilmedi`);
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const adimRepo = queryRunner.manager.getRepository(SurecAdimlari);
            const baglantiRepo = queryRunner.manager.getRepository(SurecAdimBaglantilari);

            let currentAdimId: number;

            if (parseInt(data.ID) > 0) {
                // Mevcut adımı güncelle
                await baglantiRepo.delete({ KaynakAdimID: parseInt(data.ID) });

                await adimRepo.update(parseInt(data.ID), {
                    SurecID: data.SurecID,
                    AdimAdi: data.AdimAdi,
                    SiraNo: data.SiraNo,
                });

                currentAdimId = parseInt(data.ID);
            } else {
                // Yeni adım oluştur
                const yeniAdim = await adimRepo.save({
                    SurecID: data.SurecID,
                    AdimAdi: data.AdimAdi,
                    SiraNo: data.SiraNo,
                });

                currentAdimId = yeniAdim.ID;
            }

            // Bağlantıları ekle
            if (data.HedefAdimBaglantilari?.length > 0) {
                for (const bag of data.HedefAdimBaglantilari) {
                    await baglantiRepo.save({
                        BaglantiTuru:bag.BaglantiTuru,
                        SiraNo:bag.SiraNo,
                        KaynakAdimID: currentAdimId,
                        HedefAdimID: bag.HedefAdimID > 0 ? bag.HedefAdimID : null,
                        SurecID: data.SurecID
                    });
                }
            }

            await queryRunner.commitTransaction();

            // Transaction dışında sorgu yap
            return await this.dataSource.getRepository(SurecAdimlari)
                .createQueryBuilder('surec')
                .where('surec.ID = :ID', { ID: currentAdimId })
                .leftJoinAndSelect('surec.HedefAdimBaglantilari', 'hedefler')
                .leftJoinAndSelect('surec.KaynakAdimBaglantilari', 'kaynaklar')
                .getOne();

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw new BadRequestException(error.message || 'Süreç adımları yükleme hatası');
        } finally {
            await queryRunner.release();
        }
    }



    async upload(userId: number, data: { SurecAdi: string, Anahtar: string, ID: number }) {


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

        if (!data.Anahtar || !data.SurecAdi) {
            throw new BadRequestException('Süreç adı ve anahtar zorunludur');
        }

        try {
            let surec = null;
            if (data.ID && data.ID > 0) {
                surec = await this.sureclerRepository.findOne({ where: { ID: data.ID } });

                if (!surec) {
                    throw new BadRequestException(`surec bulunamadı`);
                }

                surec.SurecAdi = data.SurecAdi;
                surec.Anahtar = data.Anahtar;

                await this.sureclerRepository.save(surec);
            } else {
                surec = await this.sureclerRepository.save({
                    SurecAdi: data.SurecAdi,
                    Anahtar: data.Anahtar,
                });
            }

            return await this.sureclerRepository.createQueryBuilder('surec')
                .where('surec.ID = :ID', { ID: surec.ID })
                .leftJoinAndSelect('surec.Adimlar', 'adimlar')
                .leftJoinAndSelect('adimlar.HedefAdimBaglantilari', 'kaynaklar')
                .leftJoinAndSelect('adimlar.KaynakAdimBaglantilari', 'hedefler')
                .getOne();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'surecler düzenleme hatası',
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
            const surecler = await this.sureclerRepository.findOne({ where: { ID: data.itemId } });
            if (surecler) {
                surecler.IsDeleted = true;
                await this.sureclerRepository.save(surecler);

                return await this.sureclerRepository.createQueryBuilder('surec')
                    .where('surec.ID = :ID', { ID: data.itemId })
                    .leftJoinAndSelect('surec.Adimlar', 'adimlar')
                    .leftJoinAndSelect('adimlar.HedefAdimBaglantilari', 'kaynaklar')
                    .leftJoinAndSelect('adimlar.KaynakAdimBaglantilari', 'hedefler')
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'surecler bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'surecler silme hatası',
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
            // Silinmiş surecler'yı bul
            const surec = await this.sureclerRepository
                .createQueryBuilder('surec')
                .where('surec.ID = :id', { id: data.itemId })
                .getOne();

            if (surec) {
                // Template'i geri yükle
                surec.IsDeleted = false;

                await this.sureclerRepository.save(surec);
                return await this.sureclerRepository.createQueryBuilder('surec')
                    .where('surec.ID = :ID', { ID: data.itemId })
                    .leftJoinAndSelect('surec.Adimlar', 'adimlar')
                    .leftJoinAndSelect('adimlar.HedefAdimBaglantilari', 'kaynaklar')
                    .leftJoinAndSelect('adimlar.KaynakAdimBaglantilari', 'hedefler')
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'surecler bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'surecler geri getirma hatası'
            );
        }
    }
}
