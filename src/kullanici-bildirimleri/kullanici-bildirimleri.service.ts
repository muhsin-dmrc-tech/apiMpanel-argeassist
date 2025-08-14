import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { DataSource, LessThanOrEqual, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { KullaniciBildirimleri } from 'src/kullanici-bildirimleri/entities/kullanici-bildirimleri.entity';
import { AppGateway } from 'src/websocket.gateway';

@Injectable()
export class KullaniciBildirimleriService {
    constructor(
        @InjectRepository(KullaniciBildirimleri)
        private readonly bildirimlerRepository: Repository<KullaniciBildirimleri>,
        private readonly dataSource: DataSource,
        private readonly appGateway: AppGateway,
    ) { }

    async getBildirimler(userId: number, query: any) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'KullaniciBildirimID';
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

        if (user?.KullaniciTipi !== 2) {
            throw new BadRequestException(`Yetkisiz Kullanıcı`);
        }


        const queryBuilder = this.dataSource.getRepository(KullaniciBildirimleri).createQueryBuilder('bildirimler');



        // Filtreleme işlemi
        Object.keys(filter).forEach((key) => {
            if (key === 'query') {
                queryBuilder.andWhere(`bildirimler.Baslik LIKE :${key}`, { [key]: `%${filter[key]}%` });
            } else {
                queryBuilder.andWhere(`bildirimler.${key} LIKE :${key}`, { [key]: `%${filter[key]}%` });
            }
        });


        // Sıralama işlemi
        if (sort) {
            queryBuilder.orderBy(`bildirimler.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        }

        queryBuilder.skip((page - 1) * limit).take(limit);

        const [bildirimler, total] = await queryBuilder.getManyAndCount();
        return {
            data: bildirimler,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }






    async getUserBildirimler(userId: number, query: any) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const sort = query.sort || 'KullaniciBildirimID';
        const order = query.order || 'DESC';

        try {
            if (isNaN(page) || isNaN(limit)) {
                throw new BadRequestException('Sayfa ve Sınır Numaralar olmalı');
            }


            if (!userId) {
                throw new BadRequestException(`Kullanıcı ID gereklidir`);
            }

            // Kullanıcıyı kontrol et
            const user = await this.dataSource.getRepository(Kullanicilar).findOne({
                where: { id: userId },
            });

            if (!user) {
                throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
            }

            // Kullanıcıya ait bildirimleri getir
            const bildirimRepo = this.dataSource.getRepository(KullaniciBildirimleri);


            // Okunmamış bildirimleri say
            const totalOkunmamis = await bildirimRepo
                .createQueryBuilder('bildirim')
                .where("bildirim.KullaniciID = :KullaniciID", { KullaniciID: userId })
                .andWhere("bildirim.Okundumu = :Okundumu", { Okundumu: false })
                .getCount();

            const queryBuilder = bildirimRepo
                .createQueryBuilder('bildirim')
                .where("bildirim.KullaniciID = :KullaniciID", { KullaniciID: userId });

            if (sort) {
                queryBuilder.orderBy(`bildirim.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            }

            queryBuilder.skip((page - 1) * limit).take(limit);

            const [bildirim, total] = await queryBuilder.getManyAndCount();
            return {
                data: bildirim,
                total,
                totalOkunmamis,
                page,
                lastPage: Math.ceil(total / limit),
            };

        } catch (error) {
            throw error;
        }
    }

    async getUserBildirimArsiv(userId: number, query: any) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 100;
        const sort = query.sort || 'KullaniciBildirimID';
        const order = query.order || 'DESC';

        try {
            if (isNaN(page) || isNaN(limit)) {
                throw new BadRequestException('Sayfa ve Sınır Numaralar olmalı');
            }


            if (!userId) {
                throw new BadRequestException(`Kullanıcı ID gereklidir`);
            }

            // Kullanıcıyı kontrol et
            const user = await this.dataSource.getRepository(Kullanicilar).findOne({
                where: { id: userId },
            });

            if (!user) {
                throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
            }

            // Kullanıcıya ait bildirimleri getir
            const bildirimRepo = this.dataSource.getRepository(KullaniciBildirimleri);


            // Okunmamış bildirimleri say
            const yillar = await bildirimRepo
                .createQueryBuilder('bildirim')
                .select('DISTINCT YEAR(bildirim.OlusturmaTarihi)', 'Yil')
                .where('bildirim.KullaniciID = :KullaniciID', { KullaniciID: userId })
                .orderBy('Yil', 'DESC')
                .getRawMany();

            const selectyear = query.selectyear || (yillar.length > 0 ? yillar[0].Yil : null);


            const queryBuilder = bildirimRepo
                .createQueryBuilder('kbildirim')
                .leftJoinAndSelect('kbildirim.Bildirim','Bildirim')
                .where("kbildirim.KullaniciID = :KullaniciID", { KullaniciID: userId });

            if (selectyear) {
               queryBuilder.andWhere('YEAR(kbildirim.OlusturmaTarihi) = :Yil', { Yil: selectyear });
            }


            if (sort) {
                queryBuilder.orderBy(`kbildirim.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            }

            queryBuilder.skip((page - 1) * limit).take(limit);

            const [kbildirim, total] = await queryBuilder.getManyAndCount();

            return {
                data: kbildirim,
                total,
                yillar,
                selectedYear: selectyear,
                page,
                lastPage: Math.ceil(total / limit),
            };

        } catch (error) {
            throw error;
        }
    }

    async allAsRead(userId: number) {
        try {
            const bildirimRepo = this.dataSource.getRepository(KullaniciBildirimleri);
            const bildirimler = await bildirimRepo
                .createQueryBuilder('bildirim')
                .where("bildirim.KullaniciID = :KullaniciID", { KullaniciID: userId })
                .andWhere("bildirim.Okundumu = :Okundumu", { Okundumu: false })
                .getMany();


            if (bildirimler.length > 0) {
                for (const bildirim of bildirimler) {
                    bildirim.OkunduMu = true;
                    bildirim.Durum = "Okundu";
                    bildirim.OkunmaTarihi = new Date();
                    await bildirimRepo.save(bildirim);
                }
            }

            return { status: 201, success: true }
        } catch (error) {
            return error
        }
    }

}
