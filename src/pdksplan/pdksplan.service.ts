import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { PDKSPlan } from './entities/pdks-plan.entity';
import { Firma } from 'src/firmalar/entities/firma.entity';

@Injectable()
export class PdksplanService {
    constructor(
        @InjectRepository(PDKSPlan)
        private readonly pdksPlanRepository: Repository<PDKSPlan>,
        private readonly dataSource: DataSource
    ) { }


    /* async getActivePlanlar() {
        // Tüm dilleri getir
        const pdksPlan = await this.dataSource
            .getRepository(PDKSPlan)
            .find({ where: { Durum: true } });
        return pdksPlan;
    } */
    async getActiveFirmalar() {
        // Tüm dilleri getir
        const firmalar = await this.dataSource
            .getRepository(Firma)
            .find({ where: { IsDeleted: false } });
        return firmalar;
    }

    async getPlanlar(userId: number, query: any) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'PDKSPlanID';
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



        const queryBuilder = this.dataSource.getRepository(PDKSPlan).createQueryBuilder('pdksPlan')
            .leftJoinAndSelect('pdksPlan.Firma', 'Firma')
            .leftJoinAndSelect('pdksPlan.Donem', 'Donem');



        // Filtreleme işlemi
        Object.keys(filter).forEach((key) => {
            const validFilterFields = {
                'Firma.FirmaAdi': 'Firma.FirmaAdi',
                'Donem.DonemAdi': 'Donem.DonemAdi'
            };

            if (validFilterFields[key]) {
                queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
            }
        });

        const allowedSortFields = ['Donem', 'Firma', 'Durum', 'PDKSPlanID'];
        if (!allowedSortFields.includes(sort)) {
            throw new BadRequestException(`Geçersiz sıralama değeri: ${sort}`);
        }
        // Sıralama işlemi
        if (sort === 'Firma') {
            queryBuilder.orderBy('Firma.FirmaAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        } else if (sort === 'Donem') {
            queryBuilder.orderBy('Donem.DonemAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        } else {
            queryBuilder.orderBy(`pdksPlan.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        }

        queryBuilder.skip((page - 1) * limit).take(limit);

        const [pdksPlan, total] = await queryBuilder.getManyAndCount();
        return {
            data: pdksPlan,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }


    async create(userId: number, data: { Durum: boolean, FirmaID: number, DonemID: number }) {


        if (!userId) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        if (!data.FirmaID || !data.DonemID) {
            throw new BadRequestException(`Firma ID ve Donem ID zorunludur`);
        }

        try {
            const pdksPlan = await this.pdksPlanRepository.save({
                Durum: data.Durum,
                FirmaID: data.FirmaID,
                DonemID: data.DonemID
            });

            return await this.pdksPlanRepository.createQueryBuilder('pdksPlan')
                .leftJoinAndSelect('pdksPlan.Firma', 'Firma')
                .leftJoinAndSelect('pdksPlan.Donem', 'Donem')
                .where('pdksPlan.PDKSPlanID = :PDKSPlanID', { PDKSPlanID: pdksPlan.PDKSPlanID })
                .getOne();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'PDKSPlan oluşturma hatası',
            );
        }
    }

    async update(userId: number, data: { Durum: boolean, FirmaID: number, DonemID: number, PDKSPlanID: number }) {


        if (!userId) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }


        if (!data.PDKSPlanID) {
            throw new BadRequestException(`PDKSPlanID gereklidir`);
        }
        if (!data.FirmaID || !data.DonemID || !data.PDKSPlanID) {
            throw new BadRequestException(`Firma ID, Donem ID ve PDKSPlan ID zorunludur`);
        }

        try {
            const pdksPlan = await this.pdksPlanRepository.findOne({ where: { PDKSPlanID: data.PDKSPlanID } });

            if (!pdksPlan) {
                throw new BadRequestException(`PDKSPlan bulunamadı`);
            }

            pdksPlan.Durum = data.Durum;
            pdksPlan.DonemID = data.DonemID;
            pdksPlan.FirmaID = data.FirmaID;

            await this.pdksPlanRepository.save(pdksPlan);
            return await this.pdksPlanRepository.createQueryBuilder('pdksPlan')
                .leftJoinAndSelect('pdksPlan.Firma', 'Firma')
                .leftJoinAndSelect('pdksPlan.Donem', 'Donem')
                .where('pdksPlan.PDKSPlanID = :PDKSPlanID', { PDKSPlanID: pdksPlan.PDKSPlanID })
                .getOne();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'PDKSPlan düzenleme hatası',
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
            const pdksPlan = await this.pdksPlanRepository.findOne({ where: { PDKSPlanID: data.itemId } });
            if (pdksPlan) {
                await this.pdksPlanRepository.delete(pdksPlan);

                return { status: 201, message: 'PDKSPlan başarıyla silindi' }
            } else {
                return {
                    status: 404,
                    message: 'PDKSPlan bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'PDKSPlan silme hatası',
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
            const pdksPlan = await this.pdksPlanRepository.findOne({ where: { PDKSPlanID: data.itemId } });
            if (pdksPlan) {
                pdksPlan.Durum = data.value;
                await this.pdksPlanRepository.save(pdksPlan);
                return this.pdksPlanRepository.createQueryBuilder('pdksPlan')
                    .leftJoinAndSelect('pdksPlan.Firma', 'Firma')
                    .leftJoinAndSelect('pdksPlan.Donem', 'Donem')
                    .where('pdksPlan.PDKSPlanID = :PDKSPlanID', { PDKSPlanID: pdksPlan.PDKSPlanID })
                    .getOne();
            } else {
                return { status: 400, message: 'pdks Plan bulunamadı' }
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Durum Update işlemi hatalı',
            );
        }


    }
}
