import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { AbonelikPlanlari } from './entities/abonelik-planlari.entity';
import { CreatePlanDto } from './dto/create.plan.dto';
import { UpdatePlanDto } from './dto/update.plan.dto';

@Injectable()
export class AbonelikPlanlariService {
    constructor(
        @InjectRepository(AbonelikPlanlari)
        private readonly abonelikPlaniRepository: Repository<AbonelikPlanlari>,
        private readonly dataSource: DataSource
    ) { }


    async getActivePlanlar() {
        const abonelikPlanlari = await this.dataSource
            .getRepository(AbonelikPlanlari)
            .find({ where: { Aktifmi: true } });
        return abonelikPlanlari;
    }

    async getPlanlar(userId: number, query: any) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'AbonelikPlanID';
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



        const queryBuilder = this.dataSource.getRepository(AbonelikPlanlari).createQueryBuilder('abonelikPlani').withDeleted();



        // Filtreleme işlemi

        Object.keys(filter).forEach((key) => {
            if (!['PlanAdi'].includes(key)) return;
            queryBuilder.andWhere(`abonelikPlani.${key} LIKE :${key}`, { [key]: `%${filter[key]}%` });
        });

        // Sıralama işlemi
        const validSortFields = ['PlanAdi'];
        if (sort && validSortFields.includes(sort)) {
            queryBuilder.orderBy(`abonelikPlani.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        }

        queryBuilder.skip((page - 1) * limit).take(limit);

        const [abonelikPlani, total] = await queryBuilder.getManyAndCount();
        return {
            data: abonelikPlani,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }


    async isActiveUpdate(userId: number, data: any) {

        if (isNaN(data.itemId) || isNaN(data.value)) {
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
            const abonelikPlani = await this.abonelikPlaniRepository.findOne({ where: { AbonelikPlanID: data.itemId } });
            if (abonelikPlani) {
                abonelikPlani.Aktifmi = data.value;
                await this.abonelikPlaniRepository.save(abonelikPlani);
                return this.abonelikPlaniRepository.createQueryBuilder('abonelikPlani')
                    .where('abonelikPlani.AbonelikPlanID = :AbonelikPlanID', { AbonelikPlanID: abonelikPlani.AbonelikPlanID })
                    .getOne();
            } else {
                return { status: 400, message: 'Plan bulunamadı' }
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Aktifmi Update işlemi hatalı',
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
            const abonelikPlani = await this.abonelikPlaniRepository.findOne({ where: { AbonelikPlanID: data.itemId } });
            if (abonelikPlani) {
                abonelikPlani.IsDeleted = true;
                abonelikPlani.DeletedAt = new Date();
                await this.abonelikPlaniRepository.save(abonelikPlani);
                return this.abonelikPlaniRepository.createQueryBuilder('abonelikPlani')
                    .withDeleted()
                    .where('abonelikPlani.AbonelikPlanID = :AbonelikPlanID', { AbonelikPlanID: abonelikPlani.AbonelikPlanID })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'Plan bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Plan silme hatası',
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
            // Silinmiş abonelikPlani'i bul
            const abonelikPlani = await this.abonelikPlaniRepository
                .createQueryBuilder('abonelikPlani')
                .withDeleted()
                .where('abonelikPlani.AbonelikPlanID = :id', { id: data.itemId })
                .getOne();

            if (abonelikPlani) {
                // abonelikPlani'i geri yükle
                abonelikPlani.IsDeleted = false;
                abonelikPlani.DeletedAt = null;

                await this.abonelikPlaniRepository.save(abonelikPlani);
                return this.abonelikPlaniRepository.createQueryBuilder('abonelikPlani')
                    .withDeleted()
                    .where('abonelikPlani.AbonelikPlanID = :AbonelikPlanID', { AbonelikPlanID: abonelikPlani.AbonelikPlanID })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'Plan bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Plan geri getirme hatası'
            );
        }
    }

    async create(userId: number, data: CreatePlanDto) {


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
        const fiyat = parseFloat(data.Fiyat);

        if (isNaN(fiyat) || fiyat <= 0) {
            throw new BadRequestException("Geçerli bir fiyat girin (0'dan büyük bir sayı).");
        }

        try {

            const abonelikPlani = await this.abonelikPlaniRepository.save({
                PlanAdi: data.PlanAdi,
                Fiyat: fiyat,
                Aciklama: data.Aciklama
            });
            return this.abonelikPlaniRepository.createQueryBuilder('abonelikPlani')
                .where('abonelikPlani.AbonelikPlanID = :AbonelikPlanID', { AbonelikPlanID: abonelikPlani.AbonelikPlanID })
                .getOne();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Plan oluşturma hatası',
            );
        }
    }

    async update(userId: number, data: UpdatePlanDto) {


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
        if (!data.AbonelikPlanID) {
            throw new BadRequestException(`AbonelikPlanID gereklidir`);
        }
        const fiyat = parseFloat(data.Fiyat);

        if (isNaN(fiyat) || fiyat <= 0) {
            throw new BadRequestException("Geçerli bir fiyat girin (0'dan büyük bir sayı).");
        }

        try {
            const abonelikPlani = await this.abonelikPlaniRepository.findOne({ where: { AbonelikPlanID: data.AbonelikPlanID } });

            if (!abonelikPlani) {
                throw new BadRequestException(`Plan bulunamadı`);
            }

            abonelikPlani.PlanAdi = data.PlanAdi;
            abonelikPlani.Fiyat = fiyat;
            abonelikPlani.Aciklama = data.Aciklama;

            await this.abonelikPlaniRepository.save(abonelikPlani);
            return this.abonelikPlaniRepository.createQueryBuilder('abonelikPlani')
                .withDeleted()
                .where('abonelikPlani.AbonelikPlanID = :AbonelikPlanID', { AbonelikPlanID: abonelikPlani.AbonelikPlanID })
                .getOne();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Plan güncelleme hatası',
            );
        }
    }
}
