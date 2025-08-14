import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { Siparisler } from './entities/siparisler.entity';
import { Firma } from 'src/firmalar/entities/firma.entity';
import { AbonelikPlanlari } from 'src/abonelik-planlari/entities/abonelik-planlari.entity';
import { FaturaBilgileri } from 'src/fatura-bilgileri/entities/fatura-bilgileri.entity';
import { Personel } from 'src/personel/entities/personel.entity';

@Injectable()
export class SiparislerService {
    constructor(
        @InjectRepository(Siparisler)
        private readonly siparislerRepository: Repository<Siparisler>,
        private readonly dataSource: DataSource
    ) { }

    async getOdemeBildirimleri(userId: number, query: any) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'SiparisID';
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

        if (user.KullaniciTipi !== 2) {
            throw new ForbiddenException('Bu eylemi gerçekleştirme izniniz yok')
        }

        const queryBuilder = this.dataSource.getRepository(Siparisler).createQueryBuilder('siparis')
            .leftJoinAndSelect('siparis.Firma', 'Firma')
            .leftJoinAndSelect('siparis.AbonelikPlan', 'AbonelikPlan')
            .leftJoinAndSelect('siparis.Kullanici', 'Kullanici')
            .where('siparis.Durum = :Durum', { Durum: 'İşlem Başlatıldı' });


        // Filtreleme işlemi

        Object.keys(filter).forEach((key) => {
            if (!['Tutar', 'FirmaID'].includes(key)) return;
            queryBuilder.andWhere(`siparis.${key} LIKE :value`, { value: `%${filter[key]}%` });
        });


        const allowedSortFields = ['Tutar', 'Firma', 'AbonelikPlan', 'SiparisID'];
        if (!allowedSortFields.includes(sort)) {
            throw new BadRequestException(`Geçersiz sıralama değeri: ${sort}`);
        }
        // Sıralama işlemi
        if (sort === 'Firma') {
            queryBuilder.orderBy('Firma.FirmaAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        } else if (sort === 'AbonelikPlan') {
            queryBuilder.orderBy('AbonelikPlan.PlanAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        } else {
            queryBuilder.orderBy(`siparis.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        }

        queryBuilder.skip((page - 1) * limit).take(limit);

        const [siparis, total] = await queryBuilder.getManyAndCount();
        return {
            data: siparis,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }

    async getsiparisler(userId: number, query: any, FirmaID: number) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'SiparisID';
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



        const queryBuilder = this.dataSource.getRepository(Siparisler).createQueryBuilder('siparis')
            .leftJoinAndSelect('siparis.Firma', 'Firma')
            .leftJoinAndSelect('siparis.AbonelikPlan', 'AbonelikPlan')
            .leftJoinAndSelect('siparis.Kullanici', 'Kullanici')
            .where('siparis.FirmaID = :FirmaID', { FirmaID: FirmaID });


        // Filtreleme işlemi

        Object.keys(filter).forEach((key) => {
            if (!['Tutar', 'FirmaID'].includes(key)) return;
            queryBuilder.andWhere(`siparis.${key} LIKE :value`, { value: `%${filter[key]}%` });
        });


        const allowedSortFields = ['Tutar', 'Firma', 'AbonelikPlan', 'SiparisID'];
        if (!allowedSortFields.includes(sort)) {
            throw new BadRequestException(`Geçersiz sıralama değeri: ${sort}`);
        }
        // Sıralama işlemi
        if (sort === 'Firma') {
            queryBuilder.orderBy('Firma.FirmaAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        } else if (sort === 'AbonelikPlan') {
            queryBuilder.orderBy('AbonelikPlan.PlanAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        } else {
            queryBuilder.orderBy(`siparis.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        }

        queryBuilder.skip((page - 1) * limit).take(limit);

        const [siparis, total] = await queryBuilder.getManyAndCount();
        return {
            data: siparis,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }


    async getSiparisItem(userId: number, SiparisID: number) {
        try {
            if (!userId) {
                throw new BadRequestException(`Kullanıcı ID gereklidir`);
            }

            const user = await this.dataSource.getRepository(Kullanicilar).findOne({
                where: { id: userId },
            });

            if (!user) {
                throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
            }

            const queryBuilder = await this.dataSource.getRepository(Siparisler).createQueryBuilder('siparis')
                .leftJoinAndSelect('siparis.Firma', 'Firma')
                .leftJoinAndSelect('siparis.AbonelikPlan', 'AbonelikPlan')
                .leftJoinAndSelect('siparis.Kullanici', 'Kullanici')
                .leftJoinAndSelect('siparis.FaturaBilgi', 'FaturaBilgi')
                .where("siparis.SiparisID = :SiparisID", { SiparisID: SiparisID })
                .getOne();

            if (!queryBuilder) {
                throw new BadRequestException('Siparis kaydı bulunamadı');
            }


            const firmaYetki = await this.dataSource.getRepository(Personel).findOne({
                where: { IliskiID: queryBuilder.FirmaID, KullaniciID: userId,Tip:1 }
            });
            if (!firmaYetki) {
                throw new BadRequestException(`Kullanıcının bu firma için izni yok`);
            }

            return queryBuilder;
        } catch (error) {
            throw error;
        }
    }







    async create(userId: number, data: { FirmaID: number, AbonelikPlanID: number }) {


        if (!userId) {
            throw new BadRequestException(`Kullanıcı ID gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }

        const firma = await this.dataSource.getRepository(Firma).findOne({ where: { FirmaID: data.FirmaID } });
        if (!firma) {
            throw new BadRequestException(`Firma bulunamadı.`);
        }
        const kdv = 0.20;

        const plan = await this.dataSource.getRepository(AbonelikPlanlari).findOne({ where: { AbonelikPlanID: data.AbonelikPlanID } });
        if (!plan) {
            throw new BadRequestException(`Plan bulunamadı.`);
        }
        const sonuc = Number((plan.Fiyat * (1 + kdv)).toFixed(2));
        const siparisvarmi = await this.siparislerRepository.findOne({
            where: { FirmaID: data.FirmaID, AbonelikPlanID: data.AbonelikPlanID, Durum: In(['Bekleniyor', 'İşlem Başlatıldı']),  OdemeTarihi: IsNull(), Tutar: sonuc }
        });
        if (siparisvarmi) {
            return {
                status: 201,
                message: 'Firma ve planı aynı olan daha önce oluşturulmuş bir sipariş bulundu.',
                siparisID: siparisvarmi.SiparisID
            }
        }
        const faturabilgi = await this.dataSource.getRepository(FaturaBilgileri).findOne({ where: { FirmaID: data.FirmaID } });



        try {
            const siparis = await this.siparislerRepository.create({
                AbonelikPlanID: data.AbonelikPlanID,
                KullaniciID: userId,
                FirmaID: data.FirmaID,
                FaturaBilgiID: faturabilgi ? faturabilgi.FaturaBilgiID : null,
                OdemeTarihi: null,
                Tutar: plan.Fiyat * (1 + kdv),
                Durum: 'Bekleniyor'
            });
            await this.siparislerRepository.save(siparis);
            return {
                status: 201,
                message: 'Sipariş başarıyla oluşturuldu.',
                siparisID: siparis.SiparisID
            }

        } catch (error) {
            throw new BadRequestException(
                error.message || 'Sipariş oluşturma hatası',
            );
        }
    }
}
