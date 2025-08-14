import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { GiderTipi } from './entities/gider-tipleri.entity';

@Injectable()
export class GiderTipleriService {
    constructor(
        @InjectRepository(GiderTipi)
        private readonly giderTipiRepository: Repository<GiderTipi>,
        private readonly dataSource: DataSource
    ) { }


    async getActiveTipler() {
        // Tüm dilleri getir
        const giderTipleri = await this.dataSource
            .getRepository(GiderTipi)
            .find({ where: { IsDeleted: false } });
        return giderTipleri;
    }

    async getTipler(userId: number, query: any) {
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



        const queryBuilder = this.dataSource.getRepository(GiderTipi).createQueryBuilder('giderTipleri');



        // Filtreleme işlemi

        Object.keys(filter).forEach((key) => {
            if (!['Tanim'].includes(key)) return;
            queryBuilder.andWhere(`giderTipleri.${key} LIKE :${key}`, { [key]: `%${filter[key]}%` });
        });

        // Sıralama işlemi
        const validSortFields = ['Tanim'];
        if (sort && validSortFields.includes(sort)) {
            queryBuilder.orderBy(`giderTipleri.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        }

        queryBuilder.skip((page - 1) * limit).take(limit);

        const [giderTipleri, total] = await queryBuilder.getManyAndCount();
        return {
            data: giderTipleri,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }


    async create(userId: number, data: { Tanim: string }) {


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

        try {
            const giderTipi = await this.giderTipiRepository.save({
                Tanim: data.Tanim
            });

            return await this.giderTipiRepository.createQueryBuilder('giderTipi')
                .where('giderTipi.GiderTipiID = :GiderTipiID', { GiderTipiID: giderTipi.GiderTipiID })
                .getOne();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'giderTipi oluşturma hatası',
            );
        }
    }

    async update(userId: number, data: { Tanim: string, GiderTipiID: number }) {


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

        if (!data.GiderTipiID) {
            throw new BadRequestException(`giderTipiID bulunamadı`);
        }

        try {
            const giderTipi = await this.giderTipiRepository.findOne({ where: { GiderTipiID: data.GiderTipiID } });

            if (!giderTipi) {
                throw new BadRequestException(`giderTipi bulunamadı`);
            }

            giderTipi.Tanim = data.Tanim;

            await this.giderTipiRepository.save(giderTipi);
            return await this.giderTipiRepository.createQueryBuilder('giderTipi')
                .where('giderTipi.GiderTipiID = :GiderTipiID', { GiderTipiID: giderTipi.GiderTipiID })
                .getOne();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'giderTipi düzenleme hatası',
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
            const giderTipi = await this.giderTipiRepository.findOne({ where: { GiderTipiID: data.itemId } });
            if (giderTipi) {
                giderTipi.IsDeleted = true;
                await this.giderTipiRepository.save(giderTipi);

                return await this.giderTipiRepository.createQueryBuilder('giderTipi')
                    .where('giderTipi.GiderTipiID = :GiderTipiID', { GiderTipiID: data.itemId })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'giderTipi bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'giderTipi silme hatası',
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
            // Silinmiş giderTipi'yı bul
            const giderTipi = await this.giderTipiRepository
                .createQueryBuilder('giderTipi')
                .where('giderTipi.GiderTipiID = :id', { id: data.itemId })
                .getOne();

            if (giderTipi) {
                // Template'i geri yükle
                giderTipi.IsDeleted = false;

                await this.giderTipiRepository.save(giderTipi);
                return await this.giderTipiRepository.createQueryBuilder('giderTipi')
                    .where('giderTipi.GiderTipiID = :GiderTipiID', { GiderTipiID: data.itemId })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'giderTipi bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'giderTipi geri getirma hatası'
            );
        }
    }
}
