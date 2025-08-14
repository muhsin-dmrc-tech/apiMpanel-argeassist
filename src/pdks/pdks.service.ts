import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PDKS } from './entities/pdks.entity';
import { Brackets, DataSource, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { Personel } from 'src/personel/entities/personel.entity';

@Injectable()
export class PdksService {
    constructor(
        @InjectRepository(PDKS)
        private readonly pdksRepository: Repository<PDKS>,
        private readonly dataSource: DataSource
    ) { }


    async getPdks(userId: number, query: any, FirmaID: number) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'PDKSID';
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



        const queryBuilder = this.dataSource.getRepository(PDKS).createQueryBuilder('pdks')
            .leftJoinAndSelect('pdks.Firma', 'Firma')
            .leftJoinAndSelect('pdks.Donem', 'Donem')
            .leftJoinAndSelect('pdks.Personel', 'Personel')
            .where('pdks.FirmaID = :FirmaID', { FirmaID: FirmaID });

        // Filtreleme işlemi
        Object.keys(filter).forEach((key) => {
            const validFilterFields = {
                'Firma.FirmaAdi': 'Firma.FirmaAdi',
                'Donem.DonemAdi': 'Donem.DonemAdi',
                'Personel.AdSoyad': 'Personel.AdSoyad',
                'query': null // Genel arama için
            };

            if (key === 'query') {
                // Tüm alanlarda arama yap
                queryBuilder.andWhere(new Brackets(qb => {
                    qb.where('Firma.FirmaAdi LIKE :searchTerm')
                        .orWhere('Donem.DonemAdi LIKE :searchTerm')
                        .orWhere('Personel.AdSoyad LIKE :searchTerm')
                }), { searchTerm: `%${filter[key]}%` });
            } else if (validFilterFields[key]) {
                queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
            }
        });

        // Sıralama işlemi
        const validSortFields = ['Firma', 'Donem', 'Personel'];
        if (sort && validSortFields.includes(sort)) {
            if (sort === 'Firma') {
                queryBuilder.orderBy('Firma.FirmaAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            } else if (sort === 'Donem') {
                queryBuilder.orderBy('Donem.DonemAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            } else if (sort === 'Personel') {
                queryBuilder.orderBy('Personel.AdSoyad', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            } else {
                queryBuilder.orderBy(`pdks.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            }
        }
        queryBuilder.skip((page - 1) * limit).take(limit);

        const [pdks, total] = await queryBuilder.getManyAndCount();
        return {
            data: pdks,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }


}
