import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { Sozlesmeler } from './entities/sozlesmeler.entity';

@Injectable()
export class SozlesmelerService {
    constructor(
        @InjectRepository(Sozlesmeler)
        private readonly sozlesmelerRepository: Repository<Sozlesmeler>,
        private readonly dataSource: DataSource
    ) { }


    async getSozlesmeItem(anahtar: string) {
        if (typeof anahtar !== 'string') {
            throw new BadRequestException('Geçersiz anahtar');
        }
        const turkishMap: Record<string, string> = {
            'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
            'Ç': 'C', 'Ğ': 'G', 'İ': 'I', 'Ö': 'O', 'Ş': 'S', 'Ü': 'U'
        };

        const newAnahtar = anahtar.trim().toLowerCase().replace(/[çğıöşüÇĞİÖŞÜ]/g, char => turkishMap[char]).replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
        try {
            const sozlesme = this.sozlesmelerRepository.findOne({ where: { Anahtar: newAnahtar } });
            if (!sozlesme) {
                return {
                    status: 404,
                    message: 'Sözleşme bulunamadı'
                }
            }
            return sozlesme;
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Sozleşme bulunamadı',
            );
        }
    }



    async getSozlesmeler(userId: number, query: any) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'SozlesmeID';
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



        const queryBuilder = this.dataSource.getRepository(Sozlesmeler).createQueryBuilder('sozlesmeler')
            .withDeleted();



        // Filtreleme işlemi

        Object.keys(filter).forEach((key) => {
            if (!['Anahatar', 'Baslik'].includes(key)) return;
            queryBuilder.andWhere(`sozlesmeler.${key} LIKE :${key}`, { [key]: `%${filter[key]}%` });
        });

        // Sıralama işlemi
        const validSortFields = ['Anahatar', 'Baslik'];
        if (sort && validSortFields.includes(sort)) {
            queryBuilder.orderBy(`sozlesmeler.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        }

        queryBuilder.skip((page - 1) * limit).take(limit);

        const [sozlesmeler, total] = await queryBuilder.getManyAndCount();
        return {
            data: sozlesmeler,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }


    async create(userId: number, data: { Anahtar: string, Aciklama: string, Baslik: string }) {


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
        if (!data.Aciklama && !data.Baslik && !data.Anahtar) {
            throw new BadRequestException(`Aciklama, Anahtar ve Başlık zorunludur`);
        }
        const turkishMap: Record<string, string> = {
            'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
            'Ç': 'C', 'Ğ': 'G', 'İ': 'I', 'Ö': 'O', 'Ş': 'S', 'Ü': 'U'
        };

        const newAnahtar = data.Anahtar.trim().toLowerCase().replace(/[çğıöşüÇĞİÖŞÜ]/g, char => turkishMap[char]).replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
        const AnahtarVarmi = await this.sozlesmelerRepository.findOne({ where: { Anahtar: newAnahtar } });
        if (AnahtarVarmi) {
            throw new BadRequestException(`Bu Anahtar Daha önce Kullanılmış`);
        }

        try {
            const sozlesmeler = await this.sozlesmelerRepository.save({
                Anahtar: newAnahtar,
                Baslik: data.Baslik,
                Aciklama: data.Aciklama,
            });

            return await this.sozlesmelerRepository.createQueryBuilder('sozlesmeler')
                .where('sozlesmeler.SozlesmeID = :SozlesmeID', { SozlesmeID: sozlesmeler.SozlesmeID })
                .getOne();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Sözleşme oluşturma hatası',
            );
        }
    }

    async update(userId: number, data: { Anahtar: string, Aciklama: string, Baslik: string, SozlesmeID: number }) {
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

        if (!data.SozlesmeID) {
            throw new BadRequestException(`SozlesmeID bulunamadı`);
        }

        if (!data.Aciklama && !data.Baslik && !data.Anahtar) {
            throw new BadRequestException(`Aciklama, Anahtar ve Başlık zorunludur`);
        }
        const turkishMap: Record<string, string> = {
            'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
            'Ç': 'C', 'Ğ': 'G', 'İ': 'I', 'Ö': 'O', 'Ş': 'S', 'Ü': 'U'
        };

        const newAnahtar = data.Anahtar.trim().toLowerCase().replace(/[çğıöşüÇĞİÖŞÜ]/g, char => turkishMap[char]).replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
        try {
            const sozlesmeler = await this.sozlesmelerRepository.findOne({ where: { SozlesmeID: data.SozlesmeID } });

            if (!sozlesmeler) {
                throw new BadRequestException(`Sözleşme bulunamadı`);
            }
            const AnahtarVarmi = await this.sozlesmelerRepository.findOne({ where: { Anahtar: newAnahtar } });
            if (AnahtarVarmi && AnahtarVarmi.SozlesmeID !== data.SozlesmeID) {
                throw new BadRequestException(`Bu Anahtar Daha önce Kullanılmış`);
            }

            sozlesmeler.Aciklama = data.Aciklama;
            sozlesmeler.Baslik = data.Baslik;
            sozlesmeler.Anahtar = newAnahtar;

            await this.sozlesmelerRepository.save(sozlesmeler);
            return await this.sozlesmelerRepository.createQueryBuilder('sozlesmeler')
                .where('sozlesmeler.SozlesmeID = :SozlesmeID', { SozlesmeID: sozlesmeler.SozlesmeID })
                .getOne();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Sözleşme düzenleme hatası',
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
            const sozlesmeler = await this.sozlesmelerRepository
                .createQueryBuilder('sozlesmeler')
                .where('sozlesmeler.SozlesmeID = :id', { id: data.itemId })
                .getOne();
            if (sozlesmeler) {
                sozlesmeler.IsDeleted = true;
                sozlesmeler.DeletedAt = new Date();

                await this.sozlesmelerRepository.save(sozlesmeler);
                return await this.sozlesmelerRepository.createQueryBuilder('sozlesmeler')
                    .withDeleted()
                    .where('sozlesmeler.SozlesmeID = :SozlesmeID', { SozlesmeID: data.itemId })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'sozlesme bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'sozlesme silme hatası',
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
            // Silinmiş sozlesmeler'yı bul
            const sozlesmeler = await this.sozlesmelerRepository
                .createQueryBuilder('sozlesmeler')
                .withDeleted()
                .where('sozlesmeler.SozlesmeID = :id', { id: data.itemId })
                .getOne();

            if (sozlesmeler) {
                // Template'i geri yükle
                sozlesmeler.IsDeleted = false;
                sozlesmeler.DeletedAt = null;

                await this.sozlesmelerRepository.save(sozlesmeler);
                return await this.sozlesmelerRepository.createQueryBuilder('sozlesmeler')
                    .where('sozlesmeler.SozlesmeID = :SozlesmeID', { SozlesmeID: data.itemId })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'sozlesme bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'sozlesme geri getirma hatası'
            );
        }
    }
}
