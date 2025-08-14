import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { GorevlendirmeTuru } from './entities/gorevlendirme-turu.entity';

@Injectable()
export class GorevlendirmeTuruService {
    constructor(
        @InjectRepository(GorevlendirmeTuru)
        private readonly gorevlendirmeTuruRepository: Repository<GorevlendirmeTuru>,
        private readonly dataSource: DataSource
    ) { }


    async getActiveTurler() {
        // Tüm dilleri getir
        const gorevlendirmeTurleri = await this.dataSource
            .getRepository(GorevlendirmeTuru)
            .find({ where: { IsDeleted: false } });
        return gorevlendirmeTurleri;
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



        const queryBuilder = this.dataSource.getRepository(GorevlendirmeTuru).createQueryBuilder('gorevlendirmeTuru');



        // Filtreleme işlemi

        Object.keys(filter).forEach((key) => {
            if (!['Tanim'].includes(key)) return;
            queryBuilder.andWhere(`gorevlendirmeTuru.${key} LIKE :${key}`, { [key]: `%${filter[key]}%` });
        });

        // Sıralama işlemi
        const validSortFields = ['Tanim'];
        if (sort && validSortFields.includes(sort)) {
            queryBuilder.orderBy(`gorevlendirmeTuru.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        }

        queryBuilder.skip((page - 1) * limit).take(limit);

        const [gorevlendirmeTuru, total] = await queryBuilder.getManyAndCount();
        return {
            data: gorevlendirmeTuru,
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
            const gorevlendirmeTuru = await this.gorevlendirmeTuruRepository.save({
                Tanim: data.Tanim
            });

            return await this.gorevlendirmeTuruRepository.createQueryBuilder('gorevlendirmeTuru')
                .where('gorevlendirmeTuru.GorevlendirmeTuruID = :GorevlendirmeTuruID', { GorevlendirmeTuruID: gorevlendirmeTuru.GorevlendirmeTuruID })
                .getOne();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'GorevlendirmeTuru oluşturma hatası',
            );
        }
    }

    async update(userId: number, data: { Tanim: string, GorevlendirmeTuruID: number }) {


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

        if (!data.GorevlendirmeTuruID) {
            throw new BadRequestException(`GorevlendirmeTuruID bulunamadı`);
        }

        try {
            const gorevlendirmeTuru = await this.gorevlendirmeTuruRepository.findOne({ where: { GorevlendirmeTuruID: data.GorevlendirmeTuruID } });

            if (!gorevlendirmeTuru) {
                throw new BadRequestException(`GorevlendirmeTuru bulunamadı`);
            }

            gorevlendirmeTuru.Tanim = data.Tanim;

            await this.gorevlendirmeTuruRepository.save(gorevlendirmeTuru);
            return await this.gorevlendirmeTuruRepository.createQueryBuilder('gorevlendirmeTuru')
                .where('gorevlendirmeTuru.GorevlendirmeTuruID = :GorevlendirmeTuruID', { GorevlendirmeTuruID: gorevlendirmeTuru.GorevlendirmeTuruID })
                .getOne();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'GorevlendirmeTuru düzenleme hatası',
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
            const gorevlendirmeTuru = await this.gorevlendirmeTuruRepository.findOne({ where: { GorevlendirmeTuruID: data.itemId } });
            if (gorevlendirmeTuru) {
                gorevlendirmeTuru.IsDeleted = true;
                await this.gorevlendirmeTuruRepository.save(gorevlendirmeTuru);

                return await this.gorevlendirmeTuruRepository.createQueryBuilder('gorevlendirmeTuru')
                    .where('gorevlendirmeTuru.GorevlendirmeTuruID = :GorevlendirmeTuruID', { GorevlendirmeTuruID: data.itemId })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'GorevlendirmeTuru bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'GorevlendirmeTuru silme hatası',
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
            // Silinmiş GorevlendirmeTuru'yı bul
            const gorevlendirmeTuru = await this.gorevlendirmeTuruRepository
                .createQueryBuilder('gorevlendirmeTuru')
                .where('gorevlendirmeTuru.GorevlendirmeTuruID = :id', { id: data.itemId })
                .getOne();

            if (gorevlendirmeTuru) {
                // Template'i geri yükle
                gorevlendirmeTuru.IsDeleted = false;

                await this.gorevlendirmeTuruRepository.save(gorevlendirmeTuru);
                return await this.gorevlendirmeTuruRepository.createQueryBuilder('gorevlendirmeTuru')
                    .where('gorevlendirmeTuru.GorevlendirmeTuruID = :GorevlendirmeTuruID', { GorevlendirmeTuruID: data.itemId })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'GorevlendirmeTuru bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'GorevlendirmeTuru geri getirma hatası'
            );
        }
    }
}
