import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { ProjeBasvuru } from './entities/proje.basvuru.entity';
import { CreateBasvuruDto } from './dto/create.dto';
import * as path from 'path';
import * as fs from 'fs';
import { UpdateBasvuruDto } from './dto/update.dto';
import { Personel } from 'src/personel/entities/personel.entity';

@Injectable()
export class ProjeBasvuruService {
    constructor(
        @InjectRepository(ProjeBasvuru)
        private readonly basvuruRepository: Repository<ProjeBasvuru>,
        private readonly dataSource: DataSource
    ) { }


    async getBasvurular(userId: number, query: any) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'BasvuruID';
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



        const queryBuilder = this.dataSource.getRepository(ProjeBasvuru).createQueryBuilder('basvuru')
            .leftJoinAndSelect('basvuru.Firma', 'Firma')
            .leftJoinAndSelect('basvuru.Teknokent', 'Teknokent')
            .leftJoinAndSelect('basvuru.Kullanici', 'Kullanici')
            .where('basvuru.KullaniciID = :KullaniciID', { KullaniciID: userId });



        // Filtreleme işlemi
        Object.keys(filter).forEach((key) => {
            const validFilterFields = {
                'Firma.FirmaAdi': 'Firma.FirmaAdi',
                'Teknokent.TeknokentAdi': 'Teknokent.TeknokentAdi',
                'OnerilenProjeIsmi': 'basvuru.OnerilenProjeIsmi'
            };

            if (validFilterFields[key]) {
                queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
            }
        });

        // Sıralama işlemi
        const validSortFields = ['Teknokent', 'Firma', 'BasvuruID', 'OnerilenProjeIsmi'];
        if (sort && validSortFields.includes(sort)) {
            if (sort === 'Firma') {
                queryBuilder.orderBy('Firma.FirmaAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            } else if (sort === 'Teknokent') {
                queryBuilder.orderBy('Teknokent.TeknokentAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            } else {
                queryBuilder.orderBy(`basvuru.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            }
        }
        queryBuilder.skip((page - 1) * limit).take(limit);

        const [basvuru, total] = await queryBuilder.getManyAndCount();
        return {
            data: basvuru,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }

    async getDestekBasvurular(userId: number) {


        if (!userId) {
            throw new BadRequestException(`Kullanıcı ID gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }



        const queryBuilder = this.dataSource.getRepository(ProjeBasvuru)
            .createQueryBuilder('basvuru')
            .innerJoin('basvuru.Firma', 'Firma')
            .innerJoin('basvuru.Teknokent', 'Teknokent')
            .innerJoin('basvuru.Kullanici', 'Kullanici')
            .innerJoin('Firma.Kullanicilar', 'Kullanicilar')
            .where(new Brackets(qb => {
                qb.where('basvuru.KullaniciID = :userId', { userId })
                    .orWhere('Kullanicilar.id IN (:...userIds)', { userIds: [userId] });
            }))
            .andWhere('basvuru.IsDeleted = :IsDeleted', { IsDeleted: false });



        const basvuru = await queryBuilder.getMany();
        return basvuru
    }

    async getBasvurularAdmin(userId: number, query: any) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'BasvuruID';
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



        const queryBuilder = this.dataSource.getRepository(ProjeBasvuru).createQueryBuilder('basvuru')
            .leftJoinAndSelect('basvuru.Firma', 'Firma')
            .leftJoinAndSelect('basvuru.Teknokent', 'Teknokent')
            .leftJoinAndSelect('basvuru.Kullanici', 'Kullanici')
            .andWhere('basvuru.IsDeleted = :IsDeleted', { IsDeleted: false })
            .andWhere('basvuru.Durum = :Durum', { Durum: 'Bekliyor' });



        // Filtreleme işlemi
        Object.keys(filter).forEach((key) => {
            const validFilterFields = {
                'Firma.FirmaAdi': 'Firma.FirmaAdi',
                'Teknokent.TeknokentAdi': 'Teknokent.TeknokentAdi',
                'OnerilenProjeIsmi': 'basvuru.OnerilenProjeIsmi'
            };

            if (validFilterFields[key]) {
                queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
            }
        });

        // Sıralama işlemi
        const validSortFields = ['Teknokent', 'Firma', 'BasvuruID', 'OnerilenProjeIsmi'];
        if (sort && validSortFields.includes(sort)) {
            if (sort === 'Firma') {
                queryBuilder.orderBy('Firma.FirmaAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            } else if (sort === 'Teknokent') {
                queryBuilder.orderBy('Teknokent.TeknokentAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            } else {
                queryBuilder.orderBy(`basvuru.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            }
        }
        queryBuilder.skip((page - 1) * limit).take(limit);

        const [basvuru, total] = await queryBuilder.getManyAndCount();
        return {
            data: basvuru,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }


    async getBasvurularTeknoAdmin(userId: number, query: any) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'BasvuruID';
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

        const teknoUser = await this.dataSource.getRepository(Personel).findOne({
            where: { KullaniciID: userId,Tip:3 },
            relations: ['Grup']
        });

        if (!teknoUser) {
            throw new BadRequestException(`Kullanıcı yetkisi bulunamadı`);
        }

        if (teknoUser.Rol !== 'owner') {
            if (!teknoUser.Grup || !teknoUser.Grup.Yetkiler.find(y=> y.Yetki === 'proje-basvuru-seeing')) {
                throw new BadRequestException(`Kullanıcı yetkisi bulunamadı`);
            }
        }



        const queryBuilder = this.dataSource.getRepository(ProjeBasvuru).createQueryBuilder('basvuru')
            .leftJoinAndSelect('basvuru.Firma', 'Firma')
            .leftJoinAndSelect('basvuru.Teknokent', 'Teknokent')
            .leftJoinAndSelect('basvuru.Kullanici', 'Kullanici')
            .where('Teknokent.TeknokentID = :TeknokentID', { TeknokentID: teknoUser.IliskiID })
            .andWhere('basvuru.IsDeleted = :IsDeleted', { IsDeleted: false })
            .andWhere('basvuru.Durum = :Durum', { Durum: 'Bekliyor' });



        // Filtreleme işlemi
        Object.keys(filter).forEach((key) => {
            const validFilterFields = {
                'Firma.FirmaAdi': 'Firma.FirmaAdi',
                'Teknokent.TeknokentAdi': 'Teknokent.TeknokentAdi',
                'OnerilenProjeIsmi': 'basvuru.OnerilenProjeIsmi'
            };

            if (validFilterFields[key]) {
                queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
            }
        });

        // Sıralama işlemi
        const validSortFields = ['Teknokent', 'Firma', 'BasvuruID', 'OnerilenProjeIsmi'];
        if (sort && validSortFields.includes(sort)) {
            if (sort === 'Firma') {
                queryBuilder.orderBy('Firma.FirmaAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            } else if (sort === 'Teknokent') {
                queryBuilder.orderBy('Teknokent.TeknokentAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            } else {
                queryBuilder.orderBy(`basvuru.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            }
        }
        queryBuilder.skip((page - 1) * limit).take(limit);

        const [basvuru, total] = await queryBuilder.getManyAndCount();
        return {
            data: basvuru,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }


    async getBasvuru(userId: number, BasvuruID: number) {
        if (!BasvuruID) {
            throw new BadRequestException('Basvuru ID gereklidir');
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }

        try {
            const queryBuilder = this.dataSource
                .getRepository(ProjeBasvuru)
                .createQueryBuilder('basvuru')
                .leftJoinAndSelect('basvuru.Firma', 'Firma')
                .leftJoinAndSelect('basvuru.Teknokent', 'Teknokent')
                .leftJoinAndSelect('basvuru.Kullanici', 'Kullanici')
                .where('basvuru.BasvuruID = :BasvuruID', { BasvuruID });

            // Eğer kullanıcı admin değilse, sadece kendi başvurularını görebilir
            if (user.KullaniciTipi !== 2) {
                queryBuilder.andWhere('basvuru.KullaniciID = :KullaniciID', { KullaniciID: userId });
            }

            const basvuru = await queryBuilder.getOne();

            if (!basvuru) {
                throw new BadRequestException('Başvuru bulunamadı');
            }

            return basvuru;

        } catch (error) {
            throw new BadRequestException(error.message || 'Başvuru getirme hatası');
        }
    }


    async getImportFile(userId: number, BasvuruID: number) {
        if (!BasvuruID) {
            throw new BadRequestException('Basvuru ID gereklidir');
        }
        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }
        try {
            const queryBuilder = await this.dataSource
                .getRepository(ProjeBasvuru)
                .createQueryBuilder('basvuru')
                .where('basvuru.BasvuruID = :BasvuruID', { BasvuruID: BasvuruID })

            // Eğer kullanıcı admin değilse, sadece kendi başvurularını görebilir
            if (user.KullaniciTipi !== 2) {
                queryBuilder.andWhere('basvuru.KullaniciID = :KullaniciID', { KullaniciID: userId });
            }

            const basvuru = await queryBuilder.getOne();
            if (!basvuru) {
                throw new BadRequestException('Başvuru bulunamadı');
            }
            let base64PDF = null;
            if (basvuru.DosyaEki && basvuru.DosyaEki.length > 0) {
                const dirPath = path.join(__dirname, '..', '..', 'uploads', 'proje-basvurulari');
                const filepath = path.join(dirPath, basvuru.DosyaEki);

                if (!fs.existsSync('uploads/proje-basvurulari/' + basvuru.DosyaEki)) {
                    base64PDF = null;
                } else {
                    /* const pdfBuffer = fs.readFileSync(filepath);
                    base64PDF = pdfBuffer.toString('base64'); */
                    // Dosyayı oku
                    base64PDF = fs.readFileSync(filepath);
                }
            }


            return { base64PDF, EkDosya: basvuru.DosyaEki };
        } catch (error) {
            throw error;
        }
    }


    async create(userId: number, data: CreateBasvuruDto, file: string) {
        if (!userId) {
            throw new BadRequestException(`Kullanıcı ID gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let filePath = null;

        try {
            if (file) {
                filePath = this.moveFileToUploads(file);
            }
            const basvuru = await queryRunner.manager.save(ProjeBasvuru, {
                FirmaID: data.FirmaID,
                KullaniciID: userId,
                TeknokentID: data.TeknokentID,
                OnerilenProjeIsmi: data.OnerilenProjeIsmi,
                ProjeKonusuVeAmaci: data.ProjeKonusuVeAmaci,
                ProjeyiOrtayaCikaranProblem: data.ProjeyiOrtayaCikaranProblem,
                ProjeKapsamindakiCozum: data.ProjeKapsamindakiCozum,
                ProjeninIcerdigiYenilikler: data.ProjeninIcerdigiYenilikler,
                RakipAnalizi: data.RakipAnalizi,
                TicariBasariPotansiyeli: data.TicariBasariPotansiyeli,
                DosyaEki: filePath,
                Durum: 'Bekliyor'
            });

            await queryRunner.commitTransaction();

            return await this.basvuruRepository.createQueryBuilder('basvuru')
                .leftJoinAndSelect('basvuru.Firma', 'Firma')
                .leftJoinAndSelect('basvuru.Teknokent', 'Teknokent')
                .leftJoinAndSelect('basvuru.Kullanici', 'Kullanici')
                .where('basvuru.BasvuruID = :BasvuruID', { BasvuruID: basvuru.BasvuruID })
                .getOne();

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw new BadRequestException(
                error.message || 'Proje başvurusu oluşturma hatası',
            );
        } finally {
            await queryRunner.release();
        }
    }

    async update(userId: number, data: UpdateBasvuruDto, file: string) {
        // Kullanıcı kontrolü
        if (!userId) {
            throw new BadRequestException(`Kullanıcı ID gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }

        if (!data.BasvuruID) {
            throw new BadRequestException(`BasvuruID gereklidir`);
        }

        // Transaction dışında kontrol
        const talepvarmi = await this.dataSource.getRepository(ProjeBasvuru).findOne({
            where: { BasvuruID: data.BasvuruID, KullaniciID: userId }
        });

        if (!talepvarmi) {
            throw new BadRequestException(`Başvuru bulunamadı`);
        }
        if (talepvarmi.DegerlendirmedeMi) {
            throw new BadRequestException(`Proje başvurun şuanda değerlendirme aşamasında düzenleme yapılamaz.`);
        }
        if (talepvarmi.Durum === 'Onaylandı') {
            throw new BadRequestException(`Proje başvurun onaylanmış düzenleme yapılamaz.`);
        }

        // Transaction başlat
        const queryRunner = this.dataSource.createQueryRunner();

        try {
            // Önce bağlan ve transaction'ı başlat
            await queryRunner.connect();
            await queryRunner.startTransaction();

            let filePath = null;

            // Dosya işlemleri
            if (file) {
                filePath = this.moveFileToUploads(file);
                const oldFilePath = path.join('uploads', 'proje-basvurulari', talepvarmi.DosyaEki);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }

            // Güncelleme işlemi
            await queryRunner.manager.update(
                ProjeBasvuru,
                { BasvuruID: data.BasvuruID, KullaniciID: userId },
                {
                    FirmaID: data.FirmaID,
                    TeknokentID: data.TeknokentID,
                    OnerilenProjeIsmi: data.OnerilenProjeIsmi,
                    ProjeKapsamindakiCozum: data.ProjeKapsamindakiCozum,
                    ProjeKonusuVeAmaci: data.ProjeKonusuVeAmaci,
                    ProjeninIcerdigiYenilikler: data.ProjeninIcerdigiYenilikler,
                    ProjeyiOrtayaCikaranProblem: data.ProjeyiOrtayaCikaranProblem,
                    RakipAnalizi: data.RakipAnalizi,
                    DosyaEki: filePath || talepvarmi.DosyaEki,
                    TicariBasariPotansiyeli: data.TicariBasariPotansiyeli,
                    Durum: 'Bekliyor'
                }
            );

            // Transaction'ı tamamla
            await queryRunner.commitTransaction();

            // Güncellenmiş veriyi getir
            return await this.basvuruRepository.createQueryBuilder('basvuru')
                .leftJoinAndSelect('basvuru.Firma', 'Firma')
                .leftJoinAndSelect('basvuru.Teknokent', 'Teknokent')
                .leftJoinAndSelect('basvuru.Kullanici', 'Kullanici')
                .where('basvuru.BasvuruID = :BasvuruID', { BasvuruID: data.BasvuruID })
                .getOne();

        } catch (error) {
            // Hata durumunda geri al
            await queryRunner.rollbackTransaction();
            throw new BadRequestException(error.message || 'Proje Başvurusu düzenleme hatası');
        } finally {
            // Her durumda bağlantıyı kapat
            await queryRunner.release();
        }
    }


    /**
         * **Dosyayı hedef klasöre taşır ve yeni yolunu döndürür.**
         */
    private moveFileToUploads(file: string): string {
        const dirPath = path.join(__dirname, '..', '..', 'uploads', 'proje-basvurulari');
        const newFilePath = path.join(dirPath, path.basename(file));

        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        fs.renameSync(file, newFilePath);

        if (!fs.existsSync(newFilePath)) {
            throw new BadRequestException('Dosya bulunamadı');
        }

        return path.basename(newFilePath);
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




        try {
            const talep = await this.basvuruRepository.findOne({ where: { BasvuruID: data.itemId, KullaniciID: userId } });

            if (talep) {
                if (talep.DegerlendirmedeMi) {
                    throw new BadRequestException(`Proje başvurun şuanda değerlendirme aşamasında silinemez.`);
                }
                if (talep.Durum === 'Onaylandı') {
                    throw new BadRequestException(`Proje başvurun onaylanmış silinemez.`);
                }
                talep.IsDeleted = true;
                await this.basvuruRepository.save(talep);

                return await this.basvuruRepository.createQueryBuilder('basvuru')
                    .leftJoinAndSelect('basvuru.Firma', 'Firma')
                    .leftJoinAndSelect('basvuru.Teknokent', 'Teknokent')
                    .leftJoinAndSelect('basvuru.Kullanici', 'Kullanici')
                    .where('basvuru.BasvuruID = :BasvuruID', { BasvuruID: data.itemId })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'Basvuru bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Basvuru silme hatası',
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


        try {
            const talep = await this.basvuruRepository.findOne({ where: { BasvuruID: data.itemId, KullaniciID: userId } });

            if (talep) {
                talep.IsDeleted = false;

                await this.basvuruRepository.save(talep);
                return await this.basvuruRepository.createQueryBuilder('basvuru')
                    .leftJoinAndSelect('basvuru.Firma', 'Firma')
                    .leftJoinAndSelect('basvuru.Teknokent', 'Teknokent')
                    .leftJoinAndSelect('basvuru.Kullanici', 'Kullanici')
                    .where('basvuru.BasvuruID = :BasvuruID', { BasvuruID: data.itemId })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'Silinmiş Basvuru bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Basvuru geri getirme hatası'
            );
        }
    }

    async degerlendir(userId: number, data: any) {
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

        if (user.KullaniciTipi !== 2) {
            throw new BadRequestException(`Bu işlem için yetkiniz yok.`);
        }


        try {
            const talep = await this.basvuruRepository.findOne({ where: { BasvuruID: data.itemId } });
            if (talep) {
                if (data.DegerlendirmedeMi) {
                    talep.DegerlendirmedeMi = true;
                } else if (data.degerlendirmeSonuc) {
                    talep.Durum = data.degerlendirmeSonuc;
                    talep.DegerlendirmedeMi = false;
                }


                await this.basvuruRepository.save(talep);
                return await this.basvuruRepository.createQueryBuilder('basvuru')
                    .leftJoinAndSelect('basvuru.Firma', 'Firma')
                    .leftJoinAndSelect('basvuru.Teknokent', 'Teknokent')
                    .leftJoinAndSelect('basvuru.Kullanici', 'Kullanici')
                    .where('basvuru.BasvuruID = :BasvuruID', { BasvuruID: data.itemId })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'Basvuru bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Basvuru değerlendirme işlem hatası'
            );
        }
    }
}
