import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { CalismaTuru } from './entities/calisma-turu.entity';

@Injectable()
export class CalismaTuruService {
    constructor(
        @InjectRepository(CalismaTuru)
        private readonly calismaTuruRepository: Repository<CalismaTuru>,
        private readonly dataSource: DataSource
    ) { }


    async getActiveTurler() {
        // Tüm dilleri getir
        const calismaTurular = await this.dataSource
            .getRepository(CalismaTuru)
            .find({ where: { IsDeleted: false } });
        return calismaTurular;
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



        const queryBuilder = this.dataSource.getRepository(CalismaTuru).createQueryBuilder('calismaTuru');



        // Filtreleme işlemi

        Object.keys(filter).forEach((key) => {
            if (!['Tanim'].includes(key)) return;
            queryBuilder.andWhere(`calismaTuru.${key} LIKE :${key}`, { [key]: `%${filter[key]}%` });
        });

        // Sıralama işlemi
        const validSortFields = ['Tanim'];
        if (sort && validSortFields.includes(sort)) {
            queryBuilder.orderBy(`calismaTuru.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        }

        queryBuilder.skip((page - 1) * limit).take(limit);

        const [calismaTuru, total] = await queryBuilder.getManyAndCount();
        return {
            data: calismaTuru,
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
            const calismaTuru = await this.calismaTuruRepository.save({
                Tanim: data.Tanim
            });

            return await this.calismaTuruRepository.createQueryBuilder('calismaTuru')
                .where('calismaTuru.CalismaTuruID = :CalismaTuruID', { CalismaTuruID: calismaTuru.CalismaTuruID })
                .getOne();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'calismaTuru oluşturma hatası',
            );
        }
    }

    async update(userId: number, data: { Tanim: string, CalismaTuruID: number }) {


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

        if (!data.CalismaTuruID) {
            throw new BadRequestException(`CalismaTuruID bulunamadı`);
        }

        try {
            const calismaTuru = await this.calismaTuruRepository.findOne({ where: { CalismaTuruID: data.CalismaTuruID } });

            if (!calismaTuru) {
                throw new BadRequestException(`calismaTuru bulunamadı`);
            }

            calismaTuru.Tanim = data.Tanim;

            await this.calismaTuruRepository.save(calismaTuru);
            return await this.calismaTuruRepository.createQueryBuilder('calismaTuru')
                .where('calismaTuru.CalismaTuruID = :CalismaTuruID', { CalismaTuruID: calismaTuru.CalismaTuruID })
                .getOne();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'calismaTuru düzenleme hatası',
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
            const calismaTuru = await this.calismaTuruRepository.findOne({ where: { CalismaTuruID: data.itemId } });
            if (calismaTuru) {
                calismaTuru.IsDeleted = true;
                await this.calismaTuruRepository.save(calismaTuru);

                return await this.calismaTuruRepository.createQueryBuilder('calismaTuru')
                    .where('calismaTuru.CalismaTuruID = :CalismaTuruID', { CalismaTuruID: data.itemId })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'calismaTuru bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'calismaTuru silme hatası',
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
            // Silinmiş calismaTuru'yı bul
            const calismaTuru = await this.calismaTuruRepository
                .createQueryBuilder('calismaTuru')
                .where('calismaTuru.CalismaTuruID = :id', { id: data.itemId })
                .getOne();

            if (calismaTuru) {
                // Template'i geri yükle
                calismaTuru.IsDeleted = false;

                await this.calismaTuruRepository.save(calismaTuru);
                return await this.calismaTuruRepository.createQueryBuilder('calismaTuru')
                    .where('calismaTuru.CalismaTuruID = :CalismaTuruID', { CalismaTuruID: data.itemId })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'calismaTuru bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'calismaTuru geri getirma hatası'
            );
        }
    }
}
