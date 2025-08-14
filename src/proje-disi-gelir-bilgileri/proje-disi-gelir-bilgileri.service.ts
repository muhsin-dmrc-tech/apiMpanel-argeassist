import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { Firma } from 'src/firmalar/entities/firma.entity';
import { ProjeDisiGelirBilgileri } from './entities/proje-disi-gelir-bilgileri.entity';
import { GorevListesi } from 'src/gorev-listesi/entities/gorev.listesi.entity';

@Injectable()
export class ProjeDisiGelirBilgileriService {
    constructor(
        @InjectRepository(ProjeDisiGelirBilgileri)
        private readonly projeDisiBilgiRepository: Repository<ProjeDisiGelirBilgileri>,
        private readonly dataSource: DataSource
    ) { }


    async getprojeDisiBilgiItem(FirmaID: number, ItemID: number) {
        if (!FirmaID) {
            throw new BadRequestException('Firma ID gereklidir');
        }
        if (!ItemID) {
            throw new BadRequestException('Proje Dışı Bilgi ID gereklidir');
        }
        try {
            const proje = await this.dataSource
                .getRepository(ProjeDisiGelirBilgileri)
                .createQueryBuilder("projeDisiBilgi")
                .leftJoinAndSelect("projeDisiBilgi.Firma", "firma")
                .where("projeDisiBilgi.id = :id", { id: ItemID })
                .andWhere("projeDisiBilgi.FirmaID = :FirmaID", { FirmaID })
                .getOne();

            if (!proje) {
                throw new BadRequestException('Proje dışı gelir bilgisi bulunamdı');
            }

            return proje;
        } catch (error) {
            throw error;
        }
    }

    async getprojeDisiBilgi(FirmaID: number, DonemID: number, GelirTipi: string) {
        if (!FirmaID || FirmaID === 0) {
            throw new BadRequestException('Firma ID gereklidir');
        }

        if (!DonemID || DonemID === 0) {
            throw new BadRequestException('Donem ID gereklidir');
        }
        if (!GelirTipi || GelirTipi.length < 1) {
            throw new BadRequestException('GelirTipi gereklidir');
        }
        try {
            const proje = await this.dataSource
                .getRepository(ProjeDisiGelirBilgileri)
                .createQueryBuilder("projeDisiBilgi")
                .leftJoinAndSelect("projeDisiBilgi.Firma", "firma")
                .where("projeDisiBilgi.FirmaID = :FirmaID", { FirmaID: FirmaID })
                .andWhere("projeDisiBilgi.DonemID = :DonemID", { DonemID: DonemID })
                .andWhere("projeDisiBilgi.GelirTipi = :GelirTipi", { GelirTipi: GelirTipi })
                .getOne();

            return proje;
        } catch (error) {
            throw new BadRequestException('Veriler çekilirken bir hata oluştu');
        }
    }



    async getprojeDisiBilgiler(userId: number, query: any, firmaId: number) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'id';
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



        const queryBuilder = await this.dataSource
            .getRepository(ProjeDisiGelirBilgileri)
            .createQueryBuilder("projeGelirBilgiler")
            .leftJoinAndSelect("projeGelirBilgiler.Firma", "Firma")
            .leftJoinAndSelect("projeGelirBilgiler.Donem", "Donem")
            .where('projeGelirBilgiler.FirmaID = :FirmaID', { FirmaID: firmaId });



        // Filtreleme işlemi
        Object.keys(filter).forEach((key) => {
            const validFilterFields = {
                'Firma': 'Firma.FirmaAdi',
                'Donem': 'Donem.DonemAdi',
                'GelirTipi': 'projeGelirBilgiler.GelirTipi',
                'Gelir': 'projeGelirBilgiler.Gelir',
                'query': null // Genel arama için
            };

            if (key === 'query') {
                // Tüm alanlarda arama yap
                queryBuilder.andWhere(new Brackets(qb => {
                    qb.where('Firma.FirmaAdi LIKE :searchTerm')
                        .orWhere('Donem.DonemAdi LIKE :searchTerm')
                        .orWhere('CAST(projeGelirBilgiler.GelirTipi AS VARCHAR) LIKE :searchTerm')
                        .orWhere('CAST(projeGelirBilgiler.Gelir AS VARCHAR) LIKE :searchTerm');
                }), { searchTerm: `%${filter[key]}%` });
            } else if (validFilterFields[key]) {
                queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
            }
        });

        // Sıralama işlemi
        const validSortFields = ['Firma', 'Donem', 'GelirTipi', 'Gelir'];
        if (sort && validSortFields.includes(sort)) {
            if (sort === 'Firma') {
                queryBuilder.orderBy('Firma.FirmaAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            } else if (sort === 'Donem') {
                queryBuilder.orderBy('Donem.DonemAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            } else {
                queryBuilder.orderBy(`projeGelirBilgiler.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            }
        }

        queryBuilder.skip((page - 1) * limit).take(limit);

        const [projeGelirBilgiler, total] = await queryBuilder.getManyAndCount();
        return {
            data: projeGelirBilgiler,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }


    async upload(userId: number, data: { Gelir: string, FirmaID: number, DonemID: number, LisansGelirimi: boolean, GelirTipi: string, islemTipi: 1 | 2 }) {
        if (!userId) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı bulunamadı`);
        }

        if (!data.FirmaID || !data.DonemID || !data.GelirTipi || !data.Gelir) {
            throw new BadRequestException(`Firma ID, Dönem ID, Gelir ve Gelir Tipi alanlarının tamamı zorunludur.`);
        }
        if (!data.islemTipi) {
            throw new BadRequestException(`İşlem tipi alanı zorunludur.`);
        }

        const gelir = parseFloat(data.Gelir);

        if (isNaN(gelir) || gelir < 0) {
            throw new BadRequestException("Geçerli bir gelir girin (0 veya 0'dan büyük bir sayı).");
        }

        let projeDisiBilgi = await this.dataSource.getRepository(ProjeDisiGelirBilgileri).findOne({
            where: { FirmaID: data.FirmaID, DonemID: data.DonemID, GelirTipi: data.GelirTipi },
        });

        try {
            const gorevDurum = await this.dataSource.getRepository(GorevListesi).findOne({
                where: { BolumAnahtar: 'proje-disi-gelir-bilgileri', DonemID: data.DonemID, FirmaID: data.FirmaID }
            })
            if (!gorevDurum) {
                throw new BadRequestException("İlgili görev bulunamadı");
            }
            if (gorevDurum.Tamamlandimi === true) {
                throw new BadRequestException("Bu dönem ait Proje dışı gelir bilgisi oluşturma görevi tamamlanmış. Değişiklik yapılamaz");
            }
            if (new Date(gorevDurum.SonTeslimTarihi).getTime() < Date.now()) {
                throw new BadRequestException("Bu dönem ait Proje dışı gelir bilgisi oluşturma görevi son teslim süresi geçmiş. Değişiklik yapılamaz");
            }
            if (projeDisiBilgi) {
                projeDisiBilgi.Gelir = gelir;
                projeDisiBilgi.LisansGelirimi = data.LisansGelirimi;
                projeDisiBilgi.GelirTipi = data.GelirTipi;
                await this.projeDisiBilgiRepository.save(projeDisiBilgi);
            } else {
                projeDisiBilgi = await this.projeDisiBilgiRepository.save({
                    FirmaID: data.FirmaID,
                    DonemID: data.DonemID,
                    Gelir: gelir,
                    LisansGelirimi: data.LisansGelirimi,
                    GelirTipi: data.GelirTipi
                });
            }
            if (data.islemTipi === 1) {
                await this.dataSource.getRepository(GorevListesi).update(gorevDurum.GorevID, {
                    Tamamlandimi: true,
                    TamamlanmaTarihi: new Date(),
                    TamamlayanKullaniciID: user.id
                });
            }

            return {
                id: projeDisiBilgi.id,
                FirmaID: projeDisiBilgi.FirmaID,
                DonemID: projeDisiBilgi.DonemID,
                Gelir: projeDisiBilgi.Gelir,
                LisansGelirimi: projeDisiBilgi.LisansGelirimi,
                GelirTipi: projeDisiBilgi.GelirTipi
            };
        } catch (error) {
            console.error('Proje Dışı Gelir bilgisi kaydedilirken bir hata oluştu:', error);
            throw new BadRequestException(
                error.message || 'Proje Dışı Gelir bilgisi oluşturulurken bir hata meydana geldi.'
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
            const projeDisiBilgiler = await this.projeDisiBilgiRepository.findOne({ where: { id: data.itemId } });

            if (projeDisiBilgiler) {
                await this.projeDisiBilgiRepository.remove(projeDisiBilgiler);

                return {
                    status: 200,
                    success: true,
                    message: 'Proje Dışı Gelir bilgisi başarıyla silindi'
                };
            } else {
                return {
                    status: 404,
                    success: false,
                    message: 'Proje Dışı Gelir bilgisi bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Proje Dışı Gelir bilgisi silme hatası'
            );
        }



    }
}
