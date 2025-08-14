import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository } from 'typeorm';
import { DestekTalepleri } from './entities/destek-talepleri.entity';
import { DestekTalepMesajlari } from './entities/destek-talep-mesajlari.entity';
import { ProjeBasvuru } from 'src/proje-basvuru/entities/proje.basvuru.entity';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import * as fs from 'fs';
import * as path from 'path';
import * as mime from 'mime-types';
import { Personel } from 'src/personel/entities/personel.entity';

@Injectable()
export class DestekTalepleriService {
    constructor(
        @InjectRepository(DestekTalepleri)
        private readonly destekTalepleriRepository: Repository<DestekTalepleri>,
        @InjectRepository(DestekTalepMesajlari)
        private readonly destekTalepMesajlariRepository: Repository<DestekTalepMesajlari>,
        private readonly dataSource: DataSource,
    ) { }


    async getTalep(userId: number, DestekTalepID: number) {
        if (!DestekTalepID) {
            throw new BadRequestException('Destek Talep ID gereklidir');
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
            const queryBuilder = this.dataSource
                .getRepository(DestekTalepleri).createQueryBuilder('destekTalep')
                .leftJoinAndSelect('destekTalep.Kullanici', 'Kullanici')
                .leftJoinAndSelect('destekTalep.Teknokent', 'Teknokent')
                .leftJoinAndSelect('destekTalep.ProjeBasvuru', 'ProjeBasvuru')
                .leftJoinAndSelect('destekTalep.DestekTipi', 'DestekTipi')
                .leftJoinAndSelect('destekTalep.Mesajlar', 'Mesajlar')
                .leftJoinAndSelect('Mesajlar.Kullanici', 'KullaniciMesaj')
                .where('destekTalep.DestekTalepID = :DestekTalepID', { DestekTalepID: DestekTalepID });



            if (user.KullaniciTipi === 1) {
                queryBuilder.andWhere('destekTalep.KullaniciID = :KullaniciID', { KullaniciID: userId });
            }
            if (user.KullaniciTipi === 3) {
                queryBuilder.andWhere('destekTalep.Departman = :Departman', { Departman: 'Teknokent' });
                const teknokentKullanicisi = await this.dataSource.getRepository(Personel).findOne({
                    where: { KullaniciID: userId,Tip:3 },
                });
                if (!teknokentKullanicisi) {
                    throw new BadRequestException('Bu teknokent kullanıcısı bulunamadı');
                }
                queryBuilder.andWhere('destekTalep.TeknokentID = :TeknokentID', { TeknokentID: teknokentKullanicisi.IliskiID });
            }




            const destektalebi = await queryBuilder.getOne()

            if (!destektalebi) {
                throw new BadRequestException('Destek talebi bulunamadı');
            }

            return destektalebi;
        } catch (error) {
            throw error;
        }
    }


    async getTalepler(userId: number, query: any) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'DestekTalepID';
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



        const queryBuilder = this.dataSource.getRepository(DestekTalepleri).createQueryBuilder('destekTalep')
            .leftJoinAndSelect('destekTalep.Kullanici', 'Kullanici')
            .leftJoinAndSelect('destekTalep.Teknokent', 'Teknokent')
            .leftJoinAndSelect('destekTalep.ProjeBasvuru', 'ProjeBasvuru')
            .leftJoinAndSelect('destekTalep.DestekTipi', 'DestekTipi')
            .where('destekTalep.KullaniciID = :KullaniciID', { KullaniciID: userId });



        // Filtreleme işlemi
        Object.keys(filter).forEach((key) => {
            const validFilterFields = {
                'destekTalep.Departman': 'destekTalep.Departman',
                'destekTalep.Baslik': 'destekTalep.Baslik',
                'destekTalep.DestekTalepID': 'destekTalep.DestekTalepID',
                'destekTalep.SonDuzenlenmeTarihi': 'destekTalep.SonDuzenlenmeTarihi'
            };

            if (validFilterFields[key]) {
                queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
            }
        });

        // Sıralama işlemi
        const validSortFields = ['Departman', 'Baslik', 'SonDuzenlenmeTarihi', 'DestekTalepID'];
        if (sort && validSortFields.includes(sort)) {
            queryBuilder.orderBy(`destekTalep.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        }
        queryBuilder.skip((page - 1) * limit).take(limit);

        const [disGorevTalep, total] = await queryBuilder.getManyAndCount();
        return {
            data: disGorevTalep,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }


    async getYonetimTalepler(userId: number, query: any, departman: string, teknokentID: number | null) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'DestekTalepID';
        const order = query.order || 'DESC';
        const listType = query.listType || 'Bekleyen';
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

        const durumType = listType === 'Bekleyen' ? 'Beklemede' : listType === 'Devameden' ? 'Cevaplandı' : 'Kapandı';

        const queryBuilder = this.dataSource.getRepository(DestekTalepleri).createQueryBuilder('destekTalep')
            .leftJoinAndSelect('destekTalep.Kullanici', 'Kullanici')
            .leftJoinAndSelect('destekTalep.Teknokent', 'Teknokent')
            .leftJoinAndSelect('destekTalep.ProjeBasvuru', 'ProjeBasvuru')
            .leftJoinAndSelect('destekTalep.DestekTipi', 'DestekTipi')
            .where('destekTalep.Durum = :Durum', { Durum: durumType });

        if (departman === 'teknokent') {
            queryBuilder.andWhere('destekTalep.Departman = :Departman', { Departman: 'Teknokent' });
            queryBuilder.andWhere('destekTalep.TeknokentID = :TeknokentID', { TeknokentID: teknokentID });
            /* if (user.KullaniciTipi === 3) {
                const teknokentKullanicisi = await this.dataSource.getRepository(TeknokentKullanicilari).findOne({
                    where: { KullaniciID: userId, TeknokentID: teknokentID },
                });
                if (!teknokentKullanicisi) {
                    throw new BadRequestException('Bu teknokent kullanıcısı bulunamadı');
                }
                if (teknokentKullanicisi.Rol !== 'owner') {
                    queryBuilder.andWhere('ProjeBasvuru.ProjeID = :ProjeID', { ProjeID: teknokentKullanicisi.KullaniciID });
                }

            } */
        } else {
            queryBuilder.andWhere('destekTalep.Departman = :Departman', { Departman: 'Sistem' });
        }


        // Filtreleme işlemi
        Object.keys(filter).forEach((key) => {
            const validFilterFields = {
                'destekTalep.Departman': 'destekTalep.Departman',
                'destekTalep.Baslik': 'destekTalep.Baslik',
                'destekTalep.DestekTalepID': 'destekTalep.DestekTalepID',
                'destekTalep.SonDuzenlenmeTarihi': 'destekTalep.SonDuzenlenmeTarihi'
            };

            if (validFilterFields[key]) {
                queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
            }
        });

        // Sıralama işlemi
        const validSortFields = ['Departman', 'Baslik', 'SonDuzenlenmeTarihi', 'DestekTalepID'];
        if (sort && validSortFields.includes(sort)) {
            queryBuilder.orderBy(`destekTalep.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        }
        queryBuilder.skip((page - 1) * limit).take(limit);

        const [disGorevTalep, total] = await queryBuilder.getManyAndCount();
        return {
            data: disGorevTalep,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }





    async create(userId: number, data: any, dosyalar?: string[]) {
        if (!userId) {
            throw new BadRequestException(`Kullanıcı ID gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }
        let teknokentId = null;
        let DestekTalepID = null;



        if (data.ProjeID > 0 && data.Departman === 'Teknokent') {
            const projeBasvuru = await this.dataSource.getRepository(ProjeBasvuru).findOne({
                where: {
                    BasvuruID: data.ProjeID,
                }
            })
            if (!projeBasvuru) {
                throw new BadRequestException('Proje bulunamadı');
            }
            teknokentId = projeBasvuru.TeknokentID;
        }
        let destekTalebi = null;

        try {

            if (data.DestekTalepID) {
                DestekTalepID = data.DestekTalepID;
                destekTalebi = await this.destekTalepleriRepository.findOne({
                    where: {
                        DestekTalepID: DestekTalepID,
                    }
                });
                if (!destekTalebi) {
                    throw new BadRequestException('Destek talebi bulunamadı');
                }
                if (data.KullaniciTipi !== 'user') {
                    if (data.KonuyuKapat && data.KonuyuKapat === 'kaydetvekapat') {
                        destekTalebi.Durum = 'Kapandı';
                    } else {
                        destekTalebi.Durum = 'Cevaplandı';
                    }
                } else {
                    destekTalebi.Durum = 'Beklemede';
                }
                await this.destekTalepleriRepository.save(destekTalebi);
            } else {

                const destekTalebiVarmi = await this.destekTalepleriRepository.findOne({
                    where: {
                        DestekTipi: data.DestekTipiID,
                        ProjeBasvuruID: data.ProjeID || null,
                        Departman: data.Departman,
                        KullaniciID: userId,
                        Durum: Not('Kapandı')
                    }
                });
                if (destekTalebiVarmi) {
                    throw new BadRequestException(
                        'Bu destek tipinde açık bir destek talebiniz var. Mevcut destek talebiniz kapanmadan yeni bir destek talebi oluşturamazsınız.'
                    );
                }




                // Yeni destek talebi oluştur
                const destekTalebicreate = this.destekTalepleriRepository.create({
                    DestekTipiID: data.DestekTipiID,
                    ProjeBasvuruID: data.ProjeID || null,
                    TeknokentID: teknokentId,
                    KullaniciID: userId,
                    Departman: data.Departman,
                    Baslik: data.Baslik,
                    Durum: 'Beklemede'
                });

                // Destek talebini kaydet
                const kaydedilenTalep = await this.destekTalepleriRepository.save(destekTalebicreate);

                DestekTalepID = kaydedilenTalep.DestekTalepID;
                destekTalebi = kaydedilenTalep;

            }




            // İlk mesajı oluştur
            const ilkMesaj = this.destekTalepMesajlariRepository.create({
                DestekTalepID: DestekTalepID,
                KullaniciID: userId,
                Mesaj: data.Mesaj,
                DosyaEki: dosyalar?.join(','),
                KullaniciTipi: data.KullaniciTipi,
            });

            // İlk mesajı kaydet
            await this.destekTalepMesajlariRepository.save(ilkMesaj);


            const yenimesaj = await this.destekTalepMesajlariRepository.findOne({
                where: { MesajID: ilkMesaj.MesajID },
                relations: {
                    Kullanici: true,
                    DestekTalebi: true,
                },
            })

            return {
                success: true,
                data: { mesaj: yenimesaj },
            };
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Destek talebi oluşturulurken bir hata oluştu'
            );
        }
    }



    async getFile(filePath: string, destekTalepId: number) {
        if (!filePath || !destekTalepId) {
            throw new BadRequestException('Dosya yolu ve destek talep ID gereklidir');
        }

        try {
            // Destek talebinin var olduğunu kontrol et
            const destekTalebi = await this.destekTalepleriRepository.findOne({
                where: { DestekTalepID: destekTalepId }
            });

            if (!destekTalebi) {
                throw new BadRequestException('Destek talebi bulunamadı');
            }

            // Dosyanın var olduğunu kontrol et
            if (!fs.existsSync(filePath)) {
                throw new BadRequestException('Dosya bulunamadı');
            }

            // Dosyayı oku
            const fileBuffer = fs.readFileSync(filePath);

            // Dosya tipini belirle
            const mimeType = mime.lookup(filePath) || 'application/octet-stream';

            // Base64'e çevir
            const base64File = fileBuffer.toString('base64');

            return {
                success: true,
                data: {
                    content: base64File,
                    mimeType: mimeType,
                    fileName: path.basename(filePath)
                }
            };
        } catch (error) {
            throw new BadRequestException(error.message || 'Dosya okunurken bir hata oluştu');
        }
    }
}
