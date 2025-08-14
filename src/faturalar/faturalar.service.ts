import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { Faturalar } from './entities/faturalar.entity';
import { CreateFaturaDto } from './dto/create.dto';

@Injectable()
export class FaturalarService {
    constructor(
        @InjectRepository(Faturalar)
        private readonly faturalarRepository: Repository<Faturalar>,
        private readonly dataSource: DataSource
    ) { }

    async getFaturalar(userId: number, query: any, FirmaID: number) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'FaturaID';
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
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }



        const queryBuilder = this.dataSource.getRepository(Faturalar).createQueryBuilder('fatura')
            .leftJoinAndSelect('fatura.Firma', 'Firma')
            .leftJoinAndSelect('fatura.Kullanici', 'Kullanici')
            .where('fatura.FirmaID = :FirmaID', { FirmaID: FirmaID });


        // Filtreleme işlemi

        Object.keys(filter).forEach((key) => {
            if (!['Tutar', 'FirmaID'].includes(key)) return;
            queryBuilder.andWhere(`fatura.${key} LIKE :value`, { value: `%${filter[key]}%` });
        });


        const allowedSortFields = ['Tutar', 'Firma', 'FaturaID'];
        if (!allowedSortFields.includes(sort)) {
            throw new BadRequestException(`Geçersiz sıralama değeri: ${sort}`);
        }
        // Sıralama işlemi
        if (sort === 'Firma') {
            queryBuilder.orderBy('Firma.FirmaAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        } else {
            queryBuilder.orderBy(`fatura.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        }

        queryBuilder.skip((page - 1) * limit).take(limit);

        const [fatura, total] = await queryBuilder.getManyAndCount();
        return {
            data: fatura,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }


    async create(userId: number, data: CreateFaturaDto) {
        if (!userId) {
            throw new BadRequestException(`Kullanıcı ID gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }
        try {
            const fatura = this.faturalarRepository.create({
                FirmaID: data.FirmaID,
                AbonelikID: data.AbonelikID,
                KullaniciID: data.KullaniciID,
                FaturaBilgiID: data.FaturaBilgiID,
                FaturaTarihi: new Date(),
                SonOdemeTarihi: null,
                Tutar: Number(data.Tutar),
                Durum: 'Ödendi',
            });

            //Burda Mail gönderecez 

            // Yeni aboneliği kaydet
            return await this.faturalarRepository.save(fatura);
        } catch (error) {
            console.error("Fatura oluşturma hatası:", error);
            throw error;
        }
    }

}
