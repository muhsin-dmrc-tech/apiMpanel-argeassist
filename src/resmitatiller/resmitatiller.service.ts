import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { ResmiTatiller } from './entities/resmitatiller.entity';

@Injectable()
export class ResmitatillerService {
    constructor(
        @InjectRepository(ResmiTatiller)
        private readonly resmiTatillerRepository: Repository<ResmiTatiller>,
        private readonly dataSource: DataSource
    ) { }



    async getResmiTatiller(userId: number, query: any) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'ResmiTatilID';
        const order = query.order || 'DESC';
        const filter = query.filter || {};

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



        const queryBuilder = this.dataSource.getRepository(ResmiTatiller).createQueryBuilder('resmiTatiller');



        // Filtreleme işlemi

        Object.keys(filter).forEach((key) => {
            if (!['ResmiTatil', 'Tarih'].includes(key)) return;
            queryBuilder.andWhere(`resmiTatiller.${key} LIKE :${key}`, { [key]: `%${filter[key]}%` });
        });

        // Sıralama işlemi
        const validSortFields = ['ResmiTatil', 'Tarih'];
        if (sort && validSortFields.includes(sort)) {
            queryBuilder.orderBy(`resmiTatiller.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        }

        queryBuilder.skip((page - 1) * limit).take(limit);

        const [resmiTatiller, total] = await queryBuilder.getManyAndCount();
        return {
            data: resmiTatiller,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }


    async create(userId: number, data: { ResmiTatil: string, Tarih: string }) {


        if (!userId) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
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
        if (!data.ResmiTatil) {
            throw new BadRequestException(`ResmiTatil zorunludur`);
        }

        try {
            /* function convertDate(dateString: string): string {
                const [day, month, year] = dateString.split('/');
                const date = new Date(`${year}-${month}-${day}`);
                
                if (isNaN(date.getTime())) {
                  throw new Error('Geçersiz tarih formatı');
                }
                
                return date.toISOString().split('T')[0]; // YYYY-MM-DD formatı
              } */
            const resmiTatiller = await this.resmiTatillerRepository.save({
                ResmiTatil: data.ResmiTatil,
                Tarih: new Date(data.Tarih)
            });

            return await this.resmiTatillerRepository.createQueryBuilder('resmiTatil')
                .where('resmiTatil.ResmiTatilID = :ResmiTatilID', { ResmiTatilID: resmiTatiller.ResmiTatilID })
                .getOne();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'ResmiTatiller create failed',
            );
        }
    }

    async update(userId: number, data: { ResmiTatil: string, Tarih: string, ResmiTatilID: number }) {


        if (!userId) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
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

        if (!data.ResmiTatilID) {
            throw new BadRequestException(`ResmiTatil ID gereklidir`);
        }

        try {
            const resmiTatiller = await this.resmiTatillerRepository.findOne({ where: { ResmiTatilID: data.ResmiTatilID } });

            if (!resmiTatiller) {
                throw new BadRequestException(`ResmiTatil bulunamadı`);
            }
            /* function convertDate(dateString: string): string {
                const [day, month, year] = dateString.split('/');
                const date = new Date(`${year}-${month}-${day}`);
                
                if (isNaN(date.getTime())) {
                  throw new Error('Geçersiz tarih formatı');
                }
                
                return date.toISOString().split('T')[0]; // YYYY-MM-DD formatı
              } */

            resmiTatiller.ResmiTatil = data.ResmiTatil;
            resmiTatiller.Tarih = new Date(data.Tarih);

            await this.resmiTatillerRepository.save(resmiTatiller);
            return await this.resmiTatillerRepository.createQueryBuilder('resmiTatil')
                .where('resmiTatil.ResmiTatilID = :ResmiTatilID', { ResmiTatilID: resmiTatiller.ResmiTatilID })
                .getOne();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'ResmiTatil güncelleme işlemi başarısız oldu',
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
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
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
            const deleteResult = await this.resmiTatillerRepository.delete({ ResmiTatilID: data.itemId });

            if (deleteResult.affected && deleteResult.affected > 0) {
                return { status: 200, message: 'İşlem başarılı' };
            } else {
                throw new BadRequestException('Resmi tatil silinemedi veya bulunamadı');
            }
        } catch (error) {
            throw new BadRequestException(error.message || 'Resmi tatil silme işlemi başarısız oldu');
        }


    }

}
