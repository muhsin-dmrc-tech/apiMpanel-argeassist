import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { ProjeDisTicaretBilgilerPlan } from './entities/proje-dis-ticaret-bilgiler-plan.entity';

@Injectable()
export class ProjeDisTicaretBilgilerPlanService {
    constructor(
        @InjectRepository(ProjeDisTicaretBilgilerPlan)
        private readonly PlanRepository: Repository<ProjeDisTicaretBilgilerPlan>,
        private readonly dataSource: DataSource
    ) { }


    /* async getActivePlanlar() {
        // Tüm dilleri getir
        const plan = await this.dataSource
            .getRepository(ProjeDisTicaretBilgilerPlan)
            .find({ where: { Durum: true } });
        return plan;
    } */


    async getPlanlar(userId: number, query: any) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'ProjeDisTicaretBilgilerPlanID';
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



        const queryBuilder = this.dataSource.getRepository(ProjeDisTicaretBilgilerPlan).createQueryBuilder('plan')
            .leftJoinAndSelect('plan.Firma', 'Firma')
            .leftJoinAndSelect('plan.Donem', 'Donem')
            .leftJoinAndSelect('plan.Proje', 'Proje');



        // Filtreleme işlemi
        Object.keys(filter).forEach((key) => {
            const validFilterFields = {
                'Firma.FirmaAdi': 'Firma.FirmaAdi',
                'Donem.DonemAdi': 'Donem.DonemAdi',
                'Proje.ProjeAdi': 'Proje.ProjeAdi',
            };

            if (validFilterFields[key]) {
                queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
            }
        });

        const allowedSortFields = ['Donem', 'Firma', 'Proje', 'Durum', 'ProjeDisTicaretBilgilerPlanID'];
        if (!allowedSortFields.includes(sort)) {
            throw new BadRequestException(`Geçersiz sıralama değeri: ${sort}`);
        }
        // Sıralama işlemi
        if (sort === 'Firma') {
            queryBuilder.orderBy('Firma.FirmaAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        } else if (sort === 'Proje') {
            queryBuilder.orderBy('Proje.ProjeAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        } else if (sort === 'Donem') {
            queryBuilder.orderBy('Donem.DonemAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        } else {
            queryBuilder.orderBy(`plan.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        }

        queryBuilder.skip((page - 1) * limit).take(limit);

        const [plan, total] = await queryBuilder.getManyAndCount();
        return {
            data: plan,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }


    async create(userId: number, data: { Durum: boolean, FirmaID: number, DonemID: number, ProjeID: number }) {


        if (!userId) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        if (!data.FirmaID || !data.DonemID || !data.ProjeID) {
            throw new BadRequestException(`Firma ID, ProjeID ve Donem ID zorunludur`);
        }

        try {
            const plan = await this.PlanRepository.save({
                Durum: data.Durum,
                FirmaID: data.FirmaID,
                DonemID: data.DonemID,
                ProjeID: data.ProjeID
            });

            return await this.PlanRepository.createQueryBuilder('plan')
                .leftJoinAndSelect('plan.Firma', 'Firma')
                .leftJoinAndSelect('plan.Donem', 'Donem')
                .leftJoinAndSelect('plan.Proje', 'Proje')
                .where('plan.ProjeDisTicaretBilgilerPlanID = :ProjeDisTicaretBilgilerPlanID', { ProjeDisTicaretBilgilerPlanID: plan.ProjeDisTicaretBilgilerPlanID })
                .getOne();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'plan oluşturma hatası',
            );
        }
    }

    async update(userId: number, data: { Durum: boolean, FirmaID: number, DonemID: number, ProjeDisTicaretBilgilerPlanID: number, ProjeID: number }) {


        if (!userId) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }


        if (!data.ProjeDisTicaretBilgilerPlanID) {
            throw new BadRequestException(`ProjeDisTicaretBilgilerPlanID gereklidir`);
        }
        if (!data.FirmaID || !data.DonemID || !data.ProjeID || !data.ProjeDisTicaretBilgilerPlanID) {
            throw new BadRequestException(`Firma ID, Proje ID, Donem ID ve ProjeDisTicaretBilgilerPlan ID zorunludur`);
        }

        try {
            const plan = await this.PlanRepository.findOne({ where: { ProjeDisTicaretBilgilerPlanID: data.ProjeDisTicaretBilgilerPlanID } });

            if (!plan) {
                throw new BadRequestException(`Plan bulunamadı`);
            }

            plan.Durum = data.Durum;
            plan.DonemID = data.DonemID;
            plan.FirmaID = data.FirmaID;
            plan.ProjeID = data.ProjeID;

            await this.PlanRepository.save(plan);
            return await this.PlanRepository.createQueryBuilder('plan')
                .leftJoinAndSelect('plan.Firma', 'Firma')
                .leftJoinAndSelect('plan.Donem', 'Donem')
                .leftJoinAndSelect('plan.Proje', 'Proje')
                .where('plan.ProjeDisTicaretBilgilerPlanID = :ProjeDisTicaretBilgilerPlanID', { ProjeDisTicaretBilgilerPlanID: plan.ProjeDisTicaretBilgilerPlanID })
                .getOne();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'plan düzenleme hatası',
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
            const plan = await this.PlanRepository.findOne({ where: { ProjeDisTicaretBilgilerPlanID: data.itemId } });
            if (plan) {
                await this.PlanRepository.delete(plan);

                return { status: 201, message: 'plan başarıyla silindi' }
            } else {
                return {
                    status: 404,
                    message: 'plan bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'plan silme hatası',
            );
        }


    }

    async durumUpdate(userId: number, data: any) {

        if (isNaN(data.itemId) || isNaN(data.value)) {
            throw new BadRequestException('itemId ve değer gereklidir');
        }
        if (!data.itemId || !data.value) {
            throw new BadRequestException('itemId ve değer gereklidir');
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
            const plan = await this.PlanRepository.findOne({ where: { ProjeDisTicaretBilgilerPlanID: data.itemId } });
            if (plan) {
                plan.Durum = data.value;
                await this.PlanRepository.save(plan);
                return this.PlanRepository.createQueryBuilder('plan')
                    .leftJoinAndSelect('plan.Firma', 'Firma')
                    .leftJoinAndSelect('plan.Donem', 'Donem')
                    .leftJoinAndSelect('plan.Proje', 'Proje')
                    .where('plan.ProjeDisTicaretBilgilerPlanID = :ProjeDisTicaretBilgilerPlanID', { ProjeDisTicaretBilgilerPlanID: plan.ProjeDisTicaretBilgilerPlanID })
                    .getOne();
            } else {
                return { status: 400, message: 'Plan bulunamadı' }
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Durum Update işlemi hatalı',
            );
        }


    }
}
