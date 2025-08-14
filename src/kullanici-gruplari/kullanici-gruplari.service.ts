import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { RotaIzinleri } from 'src/rota-izinleri/entities/rota-izinleri.entity';
import { KullaniciGruplari } from './entities/kullanici-gruplari.entity';
import { CreateGrupKullaniciDto } from './dto/create.dto';
import { Firma } from 'src/firmalar/entities/firma.entity';
import { GrupYetkileri } from 'src/grup-yetkileri/entities/grup-yetkileri.entity';
import { UpdateGrupKullaniciDto } from './dto/update.dto';
import { Personel } from 'src/personel/entities/personel.entity';
import { Teknokentler } from 'src/teknokentler/entities/teknokentler.entity';

@Injectable()
export class KullaniciGruplariService {
    constructor(
        @InjectRepository(KullaniciGruplari)
        private readonly kullaniciGruplariRepository: Repository<KullaniciGruplari>,
        private readonly dataSource: DataSource
    ) { }

    async getGruplar(userId: number, query: any, IliskiID: number) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;

        if (isNaN(page) || isNaN(limit)) {
            throw new BadRequestException('Sayfa ve Sınır Numaralar olmalı');
        }

        if (!userId) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }


        const queryBuilder = this.dataSource.getRepository(KullaniciGruplari)
            .createQueryBuilder('kullaniciGruplari')
            .leftJoinAndSelect('kullaniciGruplari.Yetkiler', 'Yetkiler')
            .loadRelationCountAndMap('kullaniciGruplari.KullaniciSayisi', 'kullaniciGruplari.Kullanicilar')
            .where('kullaniciGruplari.IliskiID = :IliskiID', { IliskiID });


        if (user.KullaniciTipi === 3) {
            queryBuilder.leftJoinAndMapOne(
                'kullaniciGruplari.Teknokent',
                Teknokentler,
                'Teknokent',
                'Teknokent.TeknokentID = kullaniciGruplari.IliskiID'
            );
            queryBuilder.andWhere('Teknokent.IsDeleted != :IsDeleted', { IsDeleted: true });
        } else {
            queryBuilder.leftJoinAndMapOne(
                'kullaniciGruplari.Firma',
                Firma,
                'Firma',
                'Firma.FirmaID = kullaniciGruplari.IliskiID'
            );
            queryBuilder.andWhere('Firma.IsDeleted != :IsDeleted', { IsDeleted: true });
        }

        queryBuilder.skip((page - 1) * limit).take(limit);

        const [kullaniciGruplari, total] = await queryBuilder.getManyAndCount();

        return {
            data: kullaniciGruplari,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }

    async create(userId: number, data: CreateGrupKullaniciDto) {

        if (!userId) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId }
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }
        const userRole = await this.dataSource.getRepository(Personel).findOne({
            where: { KullaniciID: userId, IliskiID: data.itemValue.IliskiID, Tip: user.KullaniciTipi === 3 ? 3 : 1 }
        });
        if (!userRole || userRole.Rol !== 'owner') {
            throw new BadRequestException(`Bu işlem için yetkiniz yok`);
        }

        if (userRole.Tip === 1) {
            const firma = await this.dataSource.getRepository(Firma).findOne({ where: { FirmaID: data.itemValue.IliskiID } });
            if (!firma) {
                throw new BadRequestException(`Firma bulunamdı`);
            }
        }
        if (userRole.Tip === 3) {
            const teknokent = await this.dataSource.getRepository(Teknokentler).findOne({ where: { TeknokentID: data.itemValue.IliskiID } });
            if (!teknokent) {
                throw new BadRequestException(`Teknokent bulunamdı`);
            }
        }





        const yetkilerArray = [];
        for (const checkedItem of data.selectIzinler) {
            const isKey = await this.dataSource.getRepository(RotaIzinleri).findOne({ where: { Anahtar: checkedItem.Anahtar } });
            if (!isKey) throw new BadRequestException(`Geçersiz izin anahtarı`);
            yetkilerArray.push(checkedItem.Anahtar);
        }

        if (yetkilerArray.length < 1) throw new BadRequestException(`En az bir adet izin seçmelisiniz.`);


        const selectIzinler = yetkilerArray;

        if (!Array.isArray(selectIzinler) || selectIzinler.length === 0) {
            throw new BadRequestException(`İzin anahtarları eksik tanımlanmış`);
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const kullanicigrup = await queryRunner.manager.save(KullaniciGruplari, {
                IliskiID: data.itemValue.IliskiID,
                GrupAdi: data.itemValue.GrupAdi
            });

            for (const checkedItem of selectIzinler) {
                try {
                    const isKey = await this.dataSource.getRepository(RotaIzinleri).findOne({
                        where: { Anahtar: checkedItem }
                    });

                    if (!isKey) {
                        continue;
                    }

                    await queryRunner.manager.getRepository(GrupYetkileri).save({
                        IliskiID: data.itemValue.IliskiID,
                        Tip: user.KullaniciTipi === 3 ? 3 : 1,
                        GrupID: kullanicigrup.GrupID,
                        Yetki: checkedItem,
                    });
                } catch (error) {
                    console.log(`Geçersiz izin anahtarı: ${checkedItem}`);
                }
            }



            // İşlemi Tamamla (Commit)
            await queryRunner.commitTransaction();
            const queryBuilder = this.kullaniciGruplariRepository.createQueryBuilder('kullaniciGruplari')
                .leftJoinAndSelect('kullaniciGruplari.Yetkiler', 'Yetkiler')
                .loadRelationCountAndMap('kullaniciGruplari.KullaniciSayisi', 'kullaniciGruplari.Kullanicilar')
                .where('kullaniciGruplari.GrupID = :id', { id: kullanicigrup.GrupID })

            if (user.KullaniciTipi === 3) {
                queryBuilder.leftJoinAndMapOne(
                    'kullaniciGruplari.Teknokent',
                    Teknokentler,
                    'Teknokent',
                    'Teknokent.TeknokentID = kullaniciGruplari.IliskiID'
                );
                queryBuilder.andWhere('Teknokent.IsDeleted != :IsDeleted', { IsDeleted: true });
            } else {
                queryBuilder.leftJoinAndMapOne(
                    'kullaniciGruplari.Firma',
                    Firma,
                    'Firma',
                    'Firma.FirmaID = kullaniciGruplari.IliskiID'
                );
                queryBuilder.andWhere('Firma.IsDeleted != :IsDeleted', { IsDeleted: true });
            }
            const item = await queryBuilder.getOne();
            return item;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Firma kullanıcı gurubu oluşturma işlemi sırasında bir hata oluştu.');
        } finally {
            await queryRunner.release();
        }

    }


    async update(userId: number, data: UpdateGrupKullaniciDto) {
        if (!userId) throw new BadRequestException(`Kullanıcı kimliği gereklidir`);

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({ where: { id: userId } });
        if (!user) throw new BadRequestException(`Kullanıcı kimliği gereklidir`);

        const userRole = await this.dataSource.getRepository(Personel).findOne({
            where: { KullaniciID: userId, IliskiID: data.itemValue.IliskiID, Tip: user.KullaniciTipi === 3 ? 3 : 1 }
        });
        if (!userRole || userRole.Rol !== 'owner') throw new BadRequestException(`Bu işlem için yetkiniz yok`);

        if (!data.itemValue || !data.itemValue.IliskiID) {
            throw new BadRequestException('Geçersiz ilişki bilgisi');
        }

        const idsorgu = await this.dataSource.getRepository(KullaniciGruplari).findOne({ where: { GrupID: data.itemValue.GrupID } });
        if (!idsorgu) throw new BadRequestException(`Grup bulunamadı`);

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Yetkileri sil
            const deleteResult = await queryRunner.manager.getRepository(GrupYetkileri)
                .delete({ GrupID: data.itemValue.GrupID });
            if (!deleteResult.affected || deleteResult.affected === 0) {
                console.warn(`Silinecek bir grup yetkisi bulunamadı.`);
            }

            // Grup adını güncelle
            const updateResult = await queryRunner.manager.getRepository(KullaniciGruplari)
                .update({ GrupID: data.itemValue.GrupID }, { GrupAdi: data.itemValue.GrupAdi });
            if (updateResult.affected === 0) {
                throw new BadRequestException(`Grup adı güncellenemedi.`);
            }

            // Yeni yetkileri ekle
            for (const checkedItem of data.selectIzinler) {
                const isKey = await this.dataSource.getRepository(RotaIzinleri).findOne({ where: { Anahtar: checkedItem.Anahtar } });
                if (!isKey) {
                    console.log(`Geçersiz izin anahtarı: ${checkedItem.Anahtar}`);
                    continue;
                }
                await queryRunner.manager.getRepository(GrupYetkileri).save({
                    IliskiID: data.itemValue.IliskiID,
                    Tip: user.KullaniciTipi === 3 ? 3 : 1,
                    GrupID: data.itemValue.GrupID,
                    Yetki: checkedItem.Anahtar,
                });
            }

            await queryRunner.commitTransaction();

            const queryBuilder = this.kullaniciGruplariRepository.createQueryBuilder('kullaniciGruplari')
                .leftJoinAndSelect('kullaniciGruplari.Yetkiler', 'Yetkiler')
                .loadRelationCountAndMap('kullaniciGruplari.KullaniciSayisi', 'kullaniciGruplari.Kullanicilar')
                .where('kullaniciGruplari.GrupID = :id', { id: data.itemValue.GrupID })

            if (user.KullaniciTipi === 3) {
                queryBuilder.leftJoinAndMapOne(
                    'kullaniciGruplari.Teknokent',
                    Teknokentler,
                    'Teknokent',
                    'Teknokent.TeknokentID = kullaniciGruplari.IliskiID'
                );
                queryBuilder.andWhere('Teknokent.IsDeleted != :IsDeleted', { IsDeleted: true });
            } else {
                queryBuilder.leftJoinAndMapOne(
                    'kullaniciGruplari.Firma',
                    Firma,
                    'Firma',
                    'Firma.FirmaID = kullaniciGruplari.IliskiID'
                );
                queryBuilder.andWhere('Firma.IsDeleted != :IsDeleted', { IsDeleted: true });
            }
            const item = await queryBuilder.getOne();
            return item;
        } catch (error) {
            console.error('Transaction hatası:', error);
            if (queryRunner.isTransactionActive) {
                await queryRunner.rollbackTransaction();
            }
            throw new BadRequestException(error.message || 'Kullanıcı grup güncelleme hatası');
        } finally {
            await queryRunner.release();
        }
    }


    async delete(userId: number, data: any) {
        if (!userId) throw new BadRequestException(`Kullanıcı kimliği gereklidir`);

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({ where: { id: userId } });
        if (!user) throw new BadRequestException(`Kullanıcı kimliği gereklidir`);

        if (!data || !data.itemId) {
            throw new BadRequestException('Geçersiz kullanıcı veya firma bilgisi');
        }
        const userfirma = await this.dataSource.getRepository(KullaniciGruplari).findOne({
            where: { GrupID: data.itemId },
            relations: ['Kullanicilar']
        });
        if (!userfirma) throw new BadRequestException(`Bu ilişkiye ait kullanıcı grubu bulunamadı`);
        if (!userfirma || userfirma.Kullanicilar?.length > 0) throw new BadRequestException(`Bu gruptaki kullanıcıları başka bir gruba aktarıp tekrar deneyin.`);

        const userRole = await this.dataSource.getRepository(Personel).findOne({
            where: { KullaniciID: userId,IliskiID:userfirma.IliskiID, Tip: user.KullaniciTipi === 3 ? 3 : 1 }
        });
        if (!userRole || userRole.Rol !== 'owner') throw new BadRequestException(`Bu işlem için yetkiniz yok`);


        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Yetkileri sil
            const deleteResult = await queryRunner.manager.getRepository(GrupYetkileri)
                .delete({ IliskiID: userfirma.IliskiID, GrupID: userfirma.GrupID, Tip: user.KullaniciTipi === 3 ? 3 : 1 });
            if (!deleteResult.affected) throw new BadRequestException(`Kullanıcı grubu yetkileri silinemedi`);

            // gurubu sil
            await queryRunner.manager.getRepository(KullaniciGruplari).delete({ GrupID: userfirma.GrupID });

            await queryRunner.commitTransaction();
            return {
                message: 'Kullanıcı grubu başarıyla silindi',
            };
        } catch (error) {
            if (queryRunner.isTransactionActive) {
                await queryRunner.rollbackTransaction();
            }
            throw new BadRequestException(error.message || 'İlişki kullanici grubu silme hatası');
        } finally {
            await queryRunner.release();
        }
    }
}
