import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { DestekTipi } from './entities/destek-tipleri.entity';

@Injectable()
export class DestekTipleriService {
    constructor(
        @InjectRepository(DestekTipi)
        private readonly DestekTipiRepository: Repository<DestekTipi>,
        private readonly dataSource: DataSource
    ) { }


    async getActiveTipler(Departman: string) {
        // Tüm dilleri getir
        const DestekTipleri = await this.dataSource
            .getRepository(DestekTipi)
            .find({ where: { IsDeleted: false, Departman } });
        return DestekTipleri;
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



        const queryBuilder = this.dataSource.getRepository(DestekTipi).createQueryBuilder('DestekTipleri');



        // Filtreleme işlemi

        Object.keys(filter).forEach((key) => {
            if (!['Tanim','Departman'].includes(key)) return;
            queryBuilder.andWhere(`DestekTipleri.${key} LIKE :${key}`, { [key]: `%${filter[key]}%` });
        });

        // Sıralama işlemi
        const validSortFields = ['Tanim','Departman'];
        if (sort && validSortFields.includes(sort)) {
            queryBuilder.orderBy(`DestekTipleri.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        }

        queryBuilder.skip((page - 1) * limit).take(limit);

        const [DestekTipleri, total] = await queryBuilder.getManyAndCount();
        return {
            data: DestekTipleri,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }


    async create(userId: number, data: { Tanim: string,Departman: string }) {


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
            const destekTipi = await this.DestekTipiRepository.save({
                Tanim: data.Tanim,
                Departman: data.Departman,
            });

            return await this.DestekTipiRepository.createQueryBuilder('destekTipi')
                .where('destekTipi.DestekTipiID = :DestekTipiID', { DestekTipiID: destekTipi.DestekTipiID })
                .getOne();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'DestekTipi oluşturma hatası',
            );
        }
    }

    async update(userId: number, data: { Tanim: string, Departman:string, DestekTipiID: number }) {


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

        if (!data.DestekTipiID) {
            throw new BadRequestException(`DestekTipiID bulunamadı`);
        }

        try {
            const destekTipi = await this.DestekTipiRepository.findOne({ where: { DestekTipiID: data.DestekTipiID } });

            if (!destekTipi) {
                throw new BadRequestException(`DestekTipi bulunamadı`);
            }

            destekTipi.Tanim = data.Tanim;
            destekTipi.Departman = data.Departman;

            await this.DestekTipiRepository.save(destekTipi);
            return await this.DestekTipiRepository.createQueryBuilder('destekTipi')
                .where('destekTipi.DestekTipiID = :DestekTipiID', { DestekTipiID: destekTipi.DestekTipiID })
                .getOne();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'DestekTipi düzenleme hatası',
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
            const destekTipi = await this.DestekTipiRepository.findOne({ where: { DestekTipiID: data.itemId } });
            if (destekTipi) {
                destekTipi.IsDeleted = true;
                await this.DestekTipiRepository.save(destekTipi);

                return await this.DestekTipiRepository.createQueryBuilder('destekTipi')
                    .where('destekTipi.DestekTipiID = :DestekTipiID', { DestekTipiID: data.itemId })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'DestekTipi bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'DestekTipi silme hatası',
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
            // Silinmiş DestekTipi'yı bul
            const destekTipi = await this.DestekTipiRepository
                .createQueryBuilder('destekTipi')
                .where('destekTipi.DestekTipiID = :id', { id: data.itemId })
                .getOne();

            if (destekTipi) {
                // Template'i geri yükle
                destekTipi.IsDeleted = false;

                await this.DestekTipiRepository.save(destekTipi);
                return await this.DestekTipiRepository.createQueryBuilder('destekTipi')
                    .where('destekTipi.DestekTipiID = :DestekTipiID', { DestekTipiID: data.itemId })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'DestekTipi bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'DestekTipi geri getirma hatası'
            );
        }
    }
}
