import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { MuafiyetTipi } from './entities/muafiyet-tipleri.entity';

@Injectable()
export class MuafiyetTipleriService {
    constructor(
            @InjectRepository(MuafiyetTipi)
            private readonly muafiyetTipiRepository: Repository<MuafiyetTipi>,
            private readonly dataSource: DataSource
        ) { }
    
    
        async getActiveTipler() {
            // Tüm dilleri getir
            const muafiyetTipleri = await this.dataSource
                .getRepository(MuafiyetTipi)
                .find({ where: { IsDeleted: false } });
            return muafiyetTipleri;
        }
    
        async getTipler(userId: number, query: any) {
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
    
    
    
            const queryBuilder = this.dataSource.getRepository(MuafiyetTipi).createQueryBuilder('muafiyetTipi');
    
    
    
            // Filtreleme işlemi
    
            Object.keys(filter).forEach((key) => {
                if (!['Tanim'].includes(key)) return;
                queryBuilder.andWhere(`muafiyetTipi.${key} LIKE :${key}`, { [key]: `%${filter[key]}%` });
            });
    
            // Sıralama işlemi
            const validSortFields = ['Tanim'];
            if (sort && validSortFields.includes(sort)) {
                queryBuilder.orderBy(`muafiyetTipi.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            }
    
            queryBuilder.skip((page - 1) * limit).take(limit);
    
            const [muafiyetTipi, total] = await queryBuilder.getManyAndCount();
            return {
                data: muafiyetTipi,
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
                const muafiyetTipi = await this.muafiyetTipiRepository.save({
                    Tanim: data.Tanim
                });
    
                return await this.muafiyetTipiRepository.createQueryBuilder('muafiyetTipi')
                    .where('muafiyetTipi.MuafiyetTipiID = :MuafiyetTipiID', { MuafiyetTipiID: muafiyetTipi.MuafiyetTipiID })
                    .getOne();
            } catch (error) {
                throw new BadRequestException(
                    error.message || 'MuafiyetTipi oluşturma hatası',
                );
            }
        }
    
        async update(userId: number, data: { Tanim: string, MuafiyetTipiID: number }) {
    
    
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
    
            if (!data.MuafiyetTipiID) {
                throw new BadRequestException(`MuafiyetTipiID bulunamadı`);
            }
    
            try {
                const muafiyetTipi = await this.muafiyetTipiRepository.findOne({ where: { MuafiyetTipiID: data.MuafiyetTipiID } });
    
                if (!muafiyetTipi) {
                    throw new BadRequestException(`MuafiyetTipi bulunamadı`);
                }
    
                muafiyetTipi.Tanim = data.Tanim;
    
                await this.muafiyetTipiRepository.save(muafiyetTipi);
                return await this.muafiyetTipiRepository.createQueryBuilder('muafiyetTipi')
                    .where('muafiyetTipi.MuafiyetTipiID = :MuafiyetTipiID', { MuafiyetTipiID: muafiyetTipi.MuafiyetTipiID })
                    .getOne();
            } catch (error) {
                throw new BadRequestException(
                    error.message || 'MuafiyetTipi düzenleme hatası',
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
                const muafiyetTipi = await this.muafiyetTipiRepository.findOne({ where: { MuafiyetTipiID: data.itemId } });
                if (muafiyetTipi) {
                    muafiyetTipi.IsDeleted = true;
                    await this.muafiyetTipiRepository.save(muafiyetTipi);
    
                    return await this.muafiyetTipiRepository.createQueryBuilder('muafiyetTipi')
                        .where('muafiyetTipi.MuafiyetTipiID = :MuafiyetTipiID', { MuafiyetTipiID: data.itemId })
                        .getOne();
                } else {
                    return {
                        status: 404,
                        message: 'MuafiyetTipi bulunamadı'
                    };
                }
            } catch (error) {
                throw new BadRequestException(
                    error.message || 'MuafiyetTipi silme hatası',
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
                // Silinmiş MuafiyetTipi'yı bul
                const muafiyetTipi = await this.muafiyetTipiRepository
                    .createQueryBuilder('muafiyetTipi')
                    .where('muafiyetTipi.MuafiyetTipiID = :id', { id: data.itemId })
                    .getOne();
    
                if (muafiyetTipi) {
                    // Template'i geri yükle
                    muafiyetTipi.IsDeleted = false;
    
                    await this.muafiyetTipiRepository.save(muafiyetTipi);
                    return await this.muafiyetTipiRepository.createQueryBuilder('muafiyetTipi')
                        .where('muafiyetTipi.MuafiyetTipiID = :MuafiyetTipiID', { MuafiyetTipiID: data.itemId })
                        .getOne();
                } else {
                    return {
                        status: 404,
                        message: 'MuafiyetTipi bulunamadı'
                    };
                }
            } catch (error) {
                throw new BadRequestException(
                    error.message || 'MuafiyetTipi geri getirma hatası'
                );
            }
        }
}
