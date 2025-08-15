import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { Projeler } from './entities/projeler.entity';
import { Donem } from 'src/donem/entities/donem.entity';



@Injectable()
export class ProjelerService {
    constructor(
        @InjectRepository(Projeler)
        private readonly projelerRepository: Repository<Projeler>,
        private readonly dataSource: DataSource
    ) { }

    async getProje(ProjeID: number) {
        if (!ProjeID) {
            throw new BadRequestException('Proje ID gereklidir');
        }
        try {
            const proje = await this.dataSource
                .getRepository(Projeler)
                .findOne({ where: { IsDeleted: false, ProjeID: ProjeID } });

            if (!proje) {
                throw new BadRequestException('Proje bulunamadı');
            }
            return proje;
        } catch (error) {
            throw error;
        }
    }

    async getProjeDetayAdmin(ProjeID: number) {
        if (!ProjeID) {
            throw new BadRequestException('Proje ID gereklidir');
        }
        try {
            const queryBuilder = this.dataSource.getRepository(Projeler).createQueryBuilder('projeler')
                .leftJoinAndSelect('projeler.Kullanici', 'Kullanici')
                //.leftJoinAndSelect('projeler.Teknokent', 'Teknokent')
                .leftJoinAndSelect('projeler.ProjeUzmanKullanici', 'ProjeUzmanKullanici')
                .where('projeler.ProjeID = :ProjeID', { ProjeID: ProjeID });
            

            const proje = await queryBuilder.getOne();
            return proje;
        } catch (error) {
            throw error;
        }
    }


    async getActiveProjeler() {
        // Tüm dilleri getir
        const Projelerlar = await this.dataSource
            .getRepository(Projeler)
            .find({ where: { IsDeleted: false } });
        return Projelerlar;
    }

    async getFirmaProjeler(userId:number) {
         const user = await this.dataSource.getRepository(Kullanicilar).findOne({ where: { id: userId } });
        if (!user) {
            throw new BadRequestException('Kullanıcı kimliği geçersiz');
        }
        try {
            const projeler = await this.dataSource
                .getRepository(Projeler)
                .find({ where: { IsDeleted: false, KullaniciID: userId } });

            return projeler;
        } catch (error) {
            throw new BadRequestException('Veriler çekilirken bir hata oluştu');
        }
    }





    async getProjeler(userId: number, query: any) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'ProjeID';
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



        const queryBuilder = this.dataSource.getRepository(Projeler).createQueryBuilder('projeler')
            .leftJoinAndSelect('projeler.Kullanici', 'Kullanici')
            .where('projeler.KullaniciID = :KullaniciID', { KullaniciID: userId });

        // Filtreleme işlemi
        Object.keys(filter).forEach((key) => {
            const validFilterFields = {
                'ProjeAdi': 'projeler.ProjeAdi',
                'Kullanici': 'Kullanici.FirmaAdi',
                'query': null // Genel arama için
            };

            if (key === 'query') {
                // Tüm alanlarda arama yap
                queryBuilder.andWhere(new Brackets(qb => {
                    qb.where('Kullanici.FirmaAdi LIKE :searchTerm')
                        .orWhere('CAST(projeler.ProjeAdi AS VARCHAR) LIKE :searchTerm')
                }), { searchTerm: `%${filter[key]}%` });
            } else if (validFilterFields[key]) {
                queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
            }
        });

        // Sıralama işlemi
        const allowedSortFields = ['ProjeAdi', 'Firma', 'ProjeID'];
        if (!allowedSortFields.includes(sort)) {
            throw new BadRequestException(`Geçersiz sıralama değeri: ${sort}`);
        }
        // Sıralama işlemi
        if (sort === 'Firma') {
            queryBuilder.orderBy('Kullanici.FirmaAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        } else {
            queryBuilder.orderBy(`projeler.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        }

        queryBuilder.skip((page - 1) * limit).take(limit);

        const [projeler, total] = await queryBuilder.getManyAndCount();
        return {
            data: projeler,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }


    /* async getProjelerTeknoAdmin(userId: number, query: any, teknokentId: number | null) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 20;
        const sort = query.sort || 'ProjeID';
        const order = query.order || 'DESC';
        let seciliDonemId = query.donemId || '';
        const filter = query.filter || {};

        if (isNaN(page) || isNaN(limit)) {
            throw new BadRequestException('Sayfa ve Sınır Numaralar olmalı');
        }

        if (!userId) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        if (seciliDonemId) {
            const donemId1 = parseInt(seciliDonemId);
            if (isNaN(donemId1)) {
                const ensondonem = await this.dataSource.getRepository(Donem).findOne({
                    where: { IsDeleted: false },
                    order: { DonemID: 'DESC' }
                });
                seciliDonemId = ensondonem.DonemID
            } else {
                seciliDonemId = donemId1;
            }
        }


        const queryBuilder = this.dataSource.getRepository(Projeler).createQueryBuilder('projeler')
            .leftJoin('projeler.Firma', 'Firma')
            .addSelect(['Firma.FirmaID', 'Firma.FirmaAdi'])
            .leftJoinAndSelect('projeler.ProjeUzmanKullanici', 'ProjeUzmanKullanici')
            .leftJoinAndSelect('projeler.Teknokent', 'Teknokent');

        if (teknokentId) {
            queryBuilder.where('projeler.TeknokentID = :TeknokentID', { TeknokentID: teknokentId })
                .leftJoinAndSelect('Firma.GorevListesi', 'firmaGorevListesi')
                .leftJoinAndSelect('firmaGorevListesi.Donem', 'firmaGorevListesiDonem')
                .leftJoin('Firma.Personeller', 'personeller')
                .where('personeller.IsDeleted = :IsDeleted', { IsDeleted: false })
                .addSelect(['personeller.PersonelID'])
                .andWhere(new Brackets(qb => {
                    qb.where('firmaGorevListesi.ProjeID = projeler.ProjeID')
                        .orWhere('firmaGorevListesi.ProjeID IS NULL')
                }));
        }

        if (!filter.eksikDonem) {
            queryBuilder.andWhere('firmaGorevListesi.DonemID = :DonemID', { DonemID: seciliDonemId });
        }

        // Filtreleme işlemi
        Object.keys(filter).forEach((key) => {
            const validFilterFields = {
                'ProjeAdi': 'projeler.ProjeAdi',
                'Firma': 'Firma.FirmaAdi',
                'Teknokent': 'Teknokent.TeknokentAdi',
                'query': null,// Genel arama için
                'eksikDonem': null,
                'tamDonem': null
            };
            if (key === 'uzman') {
                queryBuilder.andWhere('projeler.ProjeUzmanKullaniciID = :ProjeUzmanKullaniciID', { ProjeUzmanKullaniciID: filter[key] });
            } else if (key === 'eksikDonem') {
                const donemId = parseInt(filter[key]);
                if (!isNaN(donemId)) {
                    queryBuilder.andWhere('firmaGorevListesi.DonemID = :DonemID', { DonemID: donemId });
                    queryBuilder.andWhere(qb => {
                        return `
                                EXISTS (
                                    SELECT 1 FROM GorevListesi gl
                                    WHERE gl.FirmaID = Firma.FirmaID
                                    AND (gl.ProjeID = projeler.ProjeID OR gl.ProjeID IS NULL)
                                    AND gl.DonemID = :donemId
                                    AND (gl.Tamamlandimi IS NULL OR gl.Tamamlandimi = 0)
                                )
                            `;
                    });
                    queryBuilder.setParameter('donemId', donemId);
                }
            } else if (key === 'tamDonem') {
                const donemId = parseInt(filter[key]);
                if (!isNaN(donemId)) {
                    queryBuilder.andWhere(
                        `
            EXISTS (
                SELECT 1 FROM GorevListesi gl1
                WHERE (gl1.ProjeID = projeler.ProjeID OR (gl1.ProjeID IS NULL AND gl1.FirmaID = projeler.FirmaID))
                AND gl1.DonemID = :tamDonemId
            )
            AND NOT EXISTS (
                SELECT 1 FROM GorevListesi gl2
                WHERE (gl2.ProjeID = projeler.ProjeID OR (gl2.ProjeID IS NULL AND gl2.FirmaID = projeler.FirmaID))
                AND gl2.DonemID = :tamDonemId
                AND (gl2.Tamamlandimi IS NULL OR gl2.Tamamlandimi != 1)
            )
            `,
                        { tamDonemId: donemId }
                    );
                }
            } else if (key === 'query') {
                // Tüm alanlarda arama yap
                queryBuilder.andWhere(new Brackets(qb => {
                    qb.where('Firma.FirmaAdi LIKE :searchTerm')
                        .orWhere('ProjeUzmanKullanici.AdSoyad LIKE :searchTerm')
                        .orWhere('CAST(projeler.ProjeAdi AS VARCHAR) LIKE :searchTerm')
                }), { searchTerm: `%${filter[key]}%` });
            } else if (validFilterFields[key]) {
                queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
            }
        });

        // Sıralama işlemi
        const allowedSortFields = ['ProjeAdi', 'Firma', 'ProjeID', 'Teknokent'];
        if (!allowedSortFields.includes(sort)) {
            throw new BadRequestException(`Geçersiz sıralama değeri: ${sort}`);
        }
        // Sıralama işlemi
        if (sort === 'Firma') {
            queryBuilder.orderBy('Firma.FirmaAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        } else if (sort === 'Teknokent') {
            queryBuilder.orderBy('Teknokent.TeknokentAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        } else {
            queryBuilder.orderBy(`projeler.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        }

        queryBuilder.skip((page - 1) * limit).take(limit);

        const [projeler, total] = await queryBuilder.getManyAndCount();
        return {
            data: projeler,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    } */




    async getProjelerAdmin(userId: number, query: any) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'ProjeID';
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



        const queryBuilder = this.dataSource.getRepository(Projeler).createQueryBuilder('projeler')
            .leftJoinAndSelect('projeler.Kullanici', 'Kullanici')

        // Filtreleme işlemi
        Object.keys(filter).forEach((key) => {
            const validFilterFields = {
                'ProjeAdi': 'projeler.ProjeAdi',
                'Kullanici': 'Kullanici.FirmaAdi',
                'query': null // Genel arama için
            };

            if (key === 'query') {
                // Tüm alanlarda arama yap
                queryBuilder.andWhere(new Brackets(qb => {
                    qb.where('Kullanici.FirmaAdi LIKE :searchTerm')
                        .orWhere('CAST(projeler.ProjeAdi AS VARCHAR) LIKE :searchTerm')
                }), { searchTerm: `%${filter[key]}%` });
            } else if (validFilterFields[key]) {
                queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
            }
        });

        // Sıralama işlemi
        const allowedSortFields = ['ProjeAdi', 'Firma', 'ProjeID'];
        if (!allowedSortFields.includes(sort)) {
            throw new BadRequestException(`Geçersiz sıralama değeri: ${sort}`);
        }
        // Sıralama işlemi
        if (sort === 'Firma') {
            queryBuilder.orderBy('Kullanici.FirmaAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        } else {
            queryBuilder.orderBy(`projeler.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        }

        queryBuilder.skip((page - 1) * limit).take(limit);

        const [projeler, total] = await queryBuilder.getManyAndCount();
        return {
            data: projeler,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }










    async getAktifProjelerAdmin(userId: number) {
        if (!userId) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }



        try {
            const queryBuilder = this.dataSource.getRepository(Projeler).createQueryBuilder('projeler')
                .leftJoinAndSelect('projeler.Kullanici', 'Kullanici')
                //.leftJoinAndSelect('projeler.Teknokent', 'Teknokent');
           
            const [projeler, total] = await queryBuilder.getManyAndCount();
            return projeler
        } catch (error) {
            throw new BadRequestException('Veriler çekilirken bir hata oluştu');
        }
    }


    async create(userId: number, data: { ProjeAdi: string, TeknokentID: number, ProjeKodu: string, STBProjeKodu: string, BaslangicTarihi: string, BitisTarihi: string }) {


        if (!userId) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        if (!data.ProjeAdi && !data.TeknokentID) {
            throw new BadRequestException(`Proje adı, Teknokent ID zorunludur`);
        }
        if (!data.ProjeKodu && !data.STBProjeKodu && !data.BaslangicTarihi) {
            throw new BadRequestException(`Proje Kodu, STB Proje Kodu ve Baslangic Tarihi zorunludur`);
        }

        try {
            const projeler = await this.projelerRepository.save({
                ProjeAdi: data.ProjeAdi,
                KullaniciID: userId,
                TeknokentID: data.TeknokentID,
                ProjeKodu: data.ProjeKodu,
                STBProjeKodu: data.STBProjeKodu,
                BaslangicTarihi: new Date(data.BaslangicTarihi),
                BitisTarihi: data.BitisTarihi ? new Date(data.BitisTarihi) : null
            });

            return await this.projelerRepository.createQueryBuilder('proje')
                .leftJoinAndSelect('proje.Kullanici', 'Kullanici')
                .where('proje.ProjeID = :ProjeID', { ProjeID: projeler.ProjeID })
                .getOne();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Projeler oluşturma hatası',
            );
        }
    }

    async update(userId: number, data: { ProjeAdi: string, ProjeID: number, TeknokentID: number, ProjeKodu: string, STBProjeKodu: string, BaslangicTarihi: string, BitisTarihi: string }) {


        if (!userId) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }


        if (!data.ProjeID && !data.ProjeAdi && !data.TeknokentID) {
            throw new BadRequestException(`ProjeID , Teknokent ID, Proje adı zorunludur`);
        }
        if (!data.ProjeKodu && !data.STBProjeKodu && !data.BaslangicTarihi) {
            throw new BadRequestException(`Proje Kodu, STB Proje Kodu ve Baslangic Tarihi zorunludur`);
        }

        try {
            const proje = await this.projelerRepository.findOne({ where: { ProjeID: data.ProjeID,KullaniciID:userId } });

            if (!proje) {
                throw new BadRequestException(`proje bulunamadı`);
            }

            proje.ProjeAdi = data.ProjeAdi;
            proje.TeknokentID = data.TeknokentID;
            proje.ProjeKodu = data.ProjeKodu,
            proje.STBProjeKodu = data.STBProjeKodu,
            proje.BaslangicTarihi = new Date(data.BaslangicTarihi),
            proje.BitisTarihi = data.BitisTarihi ? new Date(data.BitisTarihi) : null

            await this.projelerRepository.save(proje);
            return await this.projelerRepository.createQueryBuilder('proje')
                .leftJoinAndSelect('proje.Kullanici', 'Kullanici')
                .where('proje.ProjeID = :ProjeID', { ProjeID: proje.ProjeID })
                .getOne();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Projeler düzenleme haatsı',
            );
        }
    }

    async uzmanUpdate(userId: number, data: { itemValue: number[], TeknokentID: number, ProjeUzmanKullaniciID: number }) {
        if (!userId) throw new BadRequestException('Kullanıcı Kimliği gereklidir');

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({ where: { id: userId } });
        if (!user) throw new BadRequestException('Kullanıcı Kimliği gereklidir');

        if (!data.TeknokentID || !data.ProjeUzmanKullaniciID || !data.itemValue)
            throw new BadRequestException('TeknokentID, Proje Uzman Kullanici ID ve Proje seçimi zorunludur');

        const uzmanuser = await this.dataSource.getRepository(Kullanicilar).findOne({ where: { id: data.ProjeUzmanKullaniciID } });
        if (!uzmanuser || uzmanuser.KullaniciTipi !== 2)
            throw new BadRequestException('Uzman kullanıcı kimliği geçersiz');

        try {
            // Önce tüm projelerden bu uzmanı kaldır
            await this.projelerRepository
                .createQueryBuilder()
                .update(Projeler)
                .set({ ProjeUzmanKullaniciID: null })
                .where('ProjeUzmanKullaniciID = :uzmanId', { uzmanId: data.ProjeUzmanKullaniciID })
                .execute();


            if (data.itemValue.length > 0) {
                // Sonra seçili projelere uzmanı ata
                await this.projelerRepository
                    .createQueryBuilder()
                    .update(Projeler)
                    .set({ ProjeUzmanKullaniciID: data.ProjeUzmanKullaniciID })
                    .whereInIds(data.itemValue)
                    .execute();
            }
            const projeSayisi = await this.projelerRepository.count({
                where: { ProjeUzmanKullaniciID: data.ProjeUzmanKullaniciID }
            });

            return { success: 'Başarılı', projeSayisi };
        } catch (error) {
            throw new BadRequestException(error.message || 'Projeler düzenleme hatası');
        }
    }

    async hakemUpdate(
        userId: number,
        data: { itemValue: number[]; TeknokentID: number; ProjeHakemKullaniciID: number }
    ) {
        if (!userId) throw new BadRequestException('Kullanıcı Kimliği gereklidir');

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({ where: { id: userId } });
        if (!user) throw new BadRequestException('Kullanıcı Kimliği gereklidir');

        if (!data.TeknokentID || !data.ProjeHakemKullaniciID || !data.itemValue)
            throw new BadRequestException('TeknokentID, Proje Hakem Kullanici ID ve Proje seçimi zorunludur');

        const hakemuser = await this.dataSource.getRepository(Kullanicilar).findOne({ where: { id: data.ProjeHakemKullaniciID } });
        if (!hakemuser || hakemuser.KullaniciTipi !== 3)
            throw new BadRequestException('Hakem kullanıcı kimliği geçersiz');

        try {
            // Önce tüm projelerden bu hakemi kaldır
            await this.projelerRepository
                .createQueryBuilder()
                .update(Projeler)
                .set({ ProjeHakemKullaniciID: null })
                .where('ProjeHakemKullaniciID = :hakemId', { hakemId: data.ProjeHakemKullaniciID })
                .execute();

            // Eğer yeni atanacak proje yoksa (itemValue boşsa), sadece kaldırma işlemi yapılır
            if (data.itemValue.length > 0) {
                // Seçili projelere hakemi ata
                await this.projelerRepository
                    .createQueryBuilder()
                    .update(Projeler)
                    .set({ ProjeHakemKullaniciID: data.ProjeHakemKullaniciID })
                    .whereInIds(data.itemValue)
                    .execute();
            }

            const projeSayisi = await this.projelerRepository.count({
                where: { ProjeHakemKullaniciID: data.ProjeHakemKullaniciID }
            });

            return { success: 'Başarılı', projeSayisi };
        } catch (error) {
            throw new BadRequestException(error.message || 'Projeler düzenleme hatası');
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

        if (user.KullaniciTipi !== 2) {
            throw new ForbiddenException(`Bu işlem için yetkiniz yok.`);
        }




        try {
            const proje = await this.projelerRepository.findOne({ where: { ProjeID: data.itemId } });
            if (proje) {
                proje.IsDeleted = true;
                await this.projelerRepository.save(proje);

                return await this.projelerRepository.createQueryBuilder('proje')
                    .leftJoinAndSelect('proje.Kullanici', 'Kullanici')
                    .where('proje.ProjeID = :ProjeID', { ProjeID: data.itemId })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'Projeler bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Projeler silem hatası',
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
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }
        if (user.KullaniciTipi !== 2) {
            throw new ForbiddenException(`Bu işlem için yetkiniz yok.`);
        }


        try {
            const proje = await this.projelerRepository
                .createQueryBuilder('proje')
                .where('proje.ProjeID = :id', { id: data.itemId })
                .getOne();

            if (proje) {
                proje.IsDeleted = false;

                await this.projelerRepository.save(proje);
                return await this.projelerRepository.createQueryBuilder('proje')
                    .leftJoinAndSelect('proje.Kullanici', 'Kullanici')
                    .where('proje.ProjeID = :ProjeID', { ProjeID: data.itemId })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'Projeler bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Projeler geri getirme hatası'
            );
        }
    }
}
