import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { RotaIzinleri } from './entities/rota-izinleri.entity';

@Injectable()
export class RotaIzinleriService {
    constructor(
        @InjectRepository(RotaIzinleri)
        private readonly rotaIzinleriRepository: Repository<RotaIzinleri>,
        private readonly dataSource: DataSource
    ) { }


    async getActiveIzinler(userId: number) {
        if (!userId) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        // QueryBuilder ile filtreleme
        const queryBuilder = this.dataSource
            .getRepository(RotaIzinleri)
            .createQueryBuilder('rotaIzinleri')
            .where('rotaIzinleri.IsDeleted = :isDeleted', { isDeleted: false });

        if (user.KullaniciTipi === 3) {
            queryBuilder.andWhere(new Brackets(qb => {
                qb.where('rotaIzinleri.Type = :type', { type: 'tekno' })
                    .orWhere('rotaIzinleri.Type = :type', { type: 'ortak' })
            }
            ));
        } else {
            queryBuilder.andWhere(new Brackets(qb => {
                qb.where('rotaIzinleri.Type = :type', { type: 'firma' })
                    .orWhere('rotaIzinleri.Type = :type', { type: 'ortak' })
            }
            ));
        }

        const rotaIzinleri = await queryBuilder.getMany();
        return rotaIzinleri;
    }

    async getIzinler(userId: number, query: any) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'id';
        const order = query.order || 'DESC';
        const filter = query.filter || {};

        if (isNaN(page) || isNaN(limit)) {
            throw new BadRequestException('Sayfa ve Sınır Numaralar olmalı');
        }

        if (!userId) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }



        const queryBuilder = this.dataSource.getRepository(RotaIzinleri).createQueryBuilder('rotaIzinleri');



        // Filtreleme işlemi

        Object.keys(filter).forEach((key) => {
            if (!['Tanim', 'Anahtar'].includes(key)) return;
            queryBuilder.andWhere(`rotaIzinleri.${key} LIKE :${key}`, { [key]: `%${filter[key]}%` });
        });

        // Sıralama işlemi
        const validSortFields = ['Tanim', 'Anahtar'];
        if (sort && validSortFields.includes(sort)) {
            queryBuilder.orderBy(`rotaIzinleri.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        }

        queryBuilder.skip((page - 1) * limit).take(limit);

        const [rotaIzinleri, total] = await queryBuilder.getManyAndCount();
        return {
            data: rotaIzinleri,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }


    async create(userId: number, data: { Tanim: string, Anahtar: string, Type: string, Bolum: string }) {


        if (!userId) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        if (!data.Tanim || !data.Anahtar) {
            throw new BadRequestException(`Tanım ve Anahtar zorunludur`);
        }

        try {
            const rotaIzinleri = await this.rotaIzinleriRepository.save({
                Tanim: data.Tanim,
                Anahtar: data.Anahtar,
                Type: data.Type,
                Bolum: data.Bolum
            });

            return await this.rotaIzinleriRepository.createQueryBuilder('rotaIzinleri')
                .where('rotaIzinleri.id = :id', { id: rotaIzinleri.id })
                .getOne();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'RotaIzinleri oluşturma hatası',
            );
        }
    }

    async update(userId: number, data: { Tanim: string, Anahtar: string, Type: string, Bolum: string, id: number }) {


        if (!userId) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }


        if (!data.id) {
            throw new BadRequestException(`RotaIzinleriID gereklidir`);
        }
        if (!data.Tanim || !data.Anahtar) {
            throw new BadRequestException(`Tanım ve Anahtar zorunludur`);
        }

        try {
            const rotaIzinleri = await this.rotaIzinleriRepository.findOne({ where: { id: data.id } });

            if (!rotaIzinleri) {
                throw new BadRequestException(`RotaIzinleri bulunamadı`);
            }

            rotaIzinleri.Tanim = data.Tanim;
            rotaIzinleri.Anahtar = data.Anahtar;
            rotaIzinleri.Type = data.Type;
            rotaIzinleri.Bolum = data.Bolum;

            await this.rotaIzinleriRepository.save(rotaIzinleri);
            return await this.rotaIzinleriRepository.createQueryBuilder('rotaIzinleri')
                .where('rotaIzinleri.id = :id', { id: rotaIzinleri.id })
                .getOne();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'RotaIzinleri düzenleme hatası',
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
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }




        try {
            const rotaIzinleri = await this.rotaIzinleriRepository.findOne({ where: { id: data.itemId } });
            if (rotaIzinleri) {
                rotaIzinleri.IsDeleted = true;
                await this.rotaIzinleriRepository.save(rotaIzinleri);

                return await this.rotaIzinleriRepository.createQueryBuilder('rotaIzinleri')
                    .where('rotaIzinleri.id = :id', { id: data.itemId })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'RotaIzinleri bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'RotaIzinleri silme hatası',
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
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }


        try {
            // Silinmiş RotaIzinleri'yı bul
            const rotaIzinleri = await this.rotaIzinleriRepository
                .createQueryBuilder('rotaIzinleri')
                .where('rotaIzinleri.id = :id', { id: data.itemId })
                .getOne();

            if (rotaIzinleri) {
                // Template'i geri yükle
                rotaIzinleri.IsDeleted = false;

                await this.rotaIzinleriRepository.save(rotaIzinleri);
                return await this.rotaIzinleriRepository.createQueryBuilder('rotaIzinleri')
                    .where('rotaIzinleri.id = :id', { id: data.itemId })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'RotaIzinleri bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'RotaIzinleri geri getirme hatası'
            );
        }
    }
}
