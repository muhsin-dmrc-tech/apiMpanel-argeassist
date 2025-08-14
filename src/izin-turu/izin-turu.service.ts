import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { IzinTuru } from './entities/izin-turu.entity';

@Injectable()
export class IzinTuruService {
    constructor(
        @InjectRepository(IzinTuru)
        private readonly izinTuruRepository: Repository<IzinTuru>,
        private readonly dataSource: DataSource
    ) { }


    async getActiveTurler() {
        // Tüm dilleri getir
        const izinTurular = await this.dataSource
            .getRepository(IzinTuru)
            .find({ where: { IsDeleted: false } });
        return izinTurular;
    }

    async getTurler(userId: number, query: any) {
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



        const queryBuilder = this.dataSource.getRepository(IzinTuru).createQueryBuilder('izinTuru');



        // Filtreleme işlemi

        Object.keys(filter).forEach((key) => {
            if (!['Tanim'].includes(key)) return;
            queryBuilder.andWhere(`izinTuru.${key} LIKE :${key}`, { [key]: `%${filter[key]}%` });
        });

        // Sıralama işlemi
        const validSortFields = ['Tanim'];
        if (sort && validSortFields.includes(sort)) {
            queryBuilder.orderBy(`izinTuru.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        }

        queryBuilder.skip((page - 1) * limit).take(limit);

        const [izinTuru, total] = await queryBuilder.getManyAndCount();
        return {
            data: izinTuru,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }


    async create(userId: number, data: { Tanim: string,EkAdi: string,Ek: boolean }) {


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
        if (!data.Tanim) {
            throw new BadRequestException(`Tanım zorunludur`);
        }

        if (data.Ek === true) {
            if (!data.EkAdi) {
                throw new BadRequestException(`Ek Adı zorunludur`);
            }
        }

        try {
            const izinTuru = await this.izinTuruRepository.save({
                Tanim: data.Tanim,
                EkAdi: data.EkAdi,
                Ek: data.Ek
            });

            return await this.izinTuruRepository.createQueryBuilder('izinTuru')
                .where('izinTuru.IzinTuruID = :IzinTuruID', { IzinTuruID: izinTuru.IzinTuruID })
                .getOne();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'izinTuru oluşturma hatası',
            );
        }
    }

    async update(userId: number, data: { Tanim: string,EkAdi: string,Ek: boolean, IzinTuruID: number }) {


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

        if (!data.IzinTuruID) {
            throw new BadRequestException(`izinTuruID bulunamadı`);
        }

        if (data.Ek === true) {
            if (!data.EkAdi) {
                throw new BadRequestException(`Ek Adı zorunludur`);
            }
        }

        try {
            const izinTuru = await this.izinTuruRepository.findOne({ where: { IzinTuruID: data.IzinTuruID } });

            if (!izinTuru) {
                throw new BadRequestException(`izinTuru bulunamadı`);
            }

            izinTuru.Tanim = data.Tanim;
            izinTuru.EkAdi = data.EkAdi;
            izinTuru.Ek = data.Ek;

            await this.izinTuruRepository.save(izinTuru);
            return await this.izinTuruRepository.createQueryBuilder('izinTuru')
                .where('izinTuru.IzinTuruID = :IzinTuruID', { IzinTuruID: izinTuru.IzinTuruID })
                .getOne();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'izinTuru düzenleme hatası',
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
            const izinTuru = await this.izinTuruRepository.findOne({ where: { IzinTuruID: data.itemId } });
            if (izinTuru) {
                izinTuru.IsDeleted = true;
                await this.izinTuruRepository.save(izinTuru);

                return await this.izinTuruRepository.createQueryBuilder('izinTuru')
                    .where('izinTuru.IzinTuruID = :IzinTuruID', { IzinTuruID: data.itemId })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'izinTuru bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'izinTuru silme hatası',
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
            // Silinmiş izinTuru'yı bul
            const izinTuru = await this.izinTuruRepository
                .createQueryBuilder('izinTuru')
                .where('izinTuru.IzinTuruID = :id', { id: data.itemId })
                .getOne();

            if (izinTuru) {
                // Template'i geri yükle
                izinTuru.IsDeleted = false;

                await this.izinTuruRepository.save(izinTuru);
                return await this.izinTuruRepository.createQueryBuilder('izinTuru')
                    .where('izinTuru.IzinTuruID = :IzinTuruID', { IzinTuruID: data.itemId })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'izinTuru bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'izinTuru geri getirma hatası'
            );
        }
    }
}
