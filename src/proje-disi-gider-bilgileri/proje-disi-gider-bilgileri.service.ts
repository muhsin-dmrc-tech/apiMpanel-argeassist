import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { Firma } from 'src/firmalar/entities/firma.entity';
import { ProjeDisiGiderBilgileri } from './entities/proje-disi-gider-bilgileri.entity';
import { GorevListesi } from 'src/gorev-listesi/entities/gorev.listesi.entity';

@Injectable()
export class ProjeDisiGiderBilgileriService {
    constructor(
        @InjectRepository(ProjeDisiGiderBilgileri)
        private readonly projeDisiBilgiRepository: Repository<ProjeDisiGiderBilgileri>,
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
                .getRepository(ProjeDisiGiderBilgileri)
                .createQueryBuilder("projeDisiBilgi")
                .leftJoinAndSelect("projeDisiBilgi.Firma", "Firma")
                .where("projeDisiBilgi.id = :id", { id: ItemID })
                .andWhere("projeDisiBilgi.FirmaID = :FirmaID", { FirmaID })
                .getOne();

            if (!proje) {
                throw new BadRequestException('Proje Dışı Gider bilgisi bulunamdı');
            }

            return proje;
        } catch (error) {
            throw error;
        }
    }

    async getprojeDisiBilgi(FirmaID: number, DonemID: number, GiderTipiID: number) {
        if (!FirmaID || FirmaID === 0) {
            throw new BadRequestException('Firma ID gereklidir');
        }
        if (!DonemID || DonemID === 0) {
            throw new BadRequestException('Donem ID gereklidir');
        }
        if (!GiderTipiID || GiderTipiID === 0) {
            throw new BadRequestException('GiderTipi ID gereklidir');
        }
        try {
            const proje = await this.dataSource
                .getRepository(ProjeDisiGiderBilgileri)
                .createQueryBuilder("projeDisiBilgi")
                .leftJoinAndSelect("projeDisiBilgi.Firma", "Firma")
                .where("projeDisiBilgi.FirmaID = :FirmaID", { FirmaID: FirmaID })
                .andWhere("projeDisiBilgi.DonemID = :DonemID", { DonemID: DonemID })
                .andWhere("projeDisiBilgi.GiderTipiID = :GiderTipiID", { GiderTipiID: GiderTipiID })
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
            .getRepository(ProjeDisiGiderBilgileri)
            .createQueryBuilder("projeGiderBilgiler")
            .leftJoinAndSelect("projeGiderBilgiler.Firma", "Firma")
            .leftJoinAndSelect("projeGiderBilgiler.Donem", "Donem")
            .leftJoinAndSelect("projeGiderBilgiler.GiderTipi", "GiderTipi")
            .where('projeGiderBilgiler.FirmaID = :FirmaID', { FirmaID: firmaId });



        // Filtreleme işlemi
        Object.keys(filter).forEach((key) => {
            const validFilterFields = {
                'Firma': 'Firma.FirmaAdi',
                'Donem': 'Donem.DonemAdi',
                'GiderTipi': 'GiderTipi.Tanim',
                'Gider': 'projeGiderBilgiler.Gider',
                'query': null // Genel arama için
            };

            if (key === 'query') {
                // Tüm alanlarda arama yap
                queryBuilder.andWhere(new Brackets(qb => {
                    qb.where('Firma.FirmaAdi LIKE :searchTerm')
                        .orWhere('Donem.DonemAdi LIKE :searchTerm')
                        .orWhere('GiderTipi.Tanim LIKE :searchTerm')
                        .orWhere('CAST(projeGiderBilgiler.Gider AS VARCHAR) LIKE :searchTerm');
                }), { searchTerm: `%${filter[key]}%` });
            } else if (validFilterFields[key]) {
                queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
            }
        });

        // Sıralama işlemi
        const validSortFields = ['Firma', 'Donem', 'GiderTipi', 'Gider'];
        if (sort && validSortFields.includes(sort)) {
            if (sort === 'Firma') {
                queryBuilder.orderBy('Firma.FirmaAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            } else if (sort === 'Donem') {
                queryBuilder.orderBy('Donem.DonemAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            } else if (sort === 'GiderTipi') {
                queryBuilder.orderBy('GiderTipi.Tanim', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            } else {
                queryBuilder.orderBy(`projeGiderBilgiler.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            }
        }

        queryBuilder.skip((page - 1) * limit).take(limit);

        const [projeGiderBilgiler, total] = await queryBuilder.getManyAndCount();
        return {
            data: projeGiderBilgiler,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }


    async upload(userId: number, data: { Gider: string, FirmaID: number, DonemID: number, TTOGiderimi: boolean, GiderTipiID: number, islemTipi: 1 | 2 }) {
        if (!userId) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı bulunamadı`);
        }

        if (!data.FirmaID || !data.DonemID || !data.GiderTipiID || !data.Gider) {
            throw new BadRequestException(`Firma ID, Dönem ID, Gider ve Gider Tipi alanlarının tamamı zorunludur.`);
        }
        if (!data.islemTipi) {
            throw new BadRequestException(`İşlem tipi alanı zorunludur.`);
        }

        const Gider = parseFloat(data.Gider);

        if (isNaN(Gider) || Gider < 0) {
            throw new BadRequestException("Geçerli bir Gider girin (0 veya 0'dan büyük bir sayı).");
        }

        let projeDisiBilgi = await this.dataSource.getRepository(ProjeDisiGiderBilgileri).findOne({
            where: { FirmaID: data.FirmaID, DonemID: data.DonemID, GiderTipiID: data.GiderTipiID },
        });

        try {
            const gorevDurum = await this.dataSource.getRepository(GorevListesi).findOne({
                where: { BolumAnahtar: 'proje-disi-gider-bilgileri', DonemID: data.DonemID, FirmaID: data.FirmaID }
            })
            if (!gorevDurum) {
                throw new BadRequestException("İlgili görev bulunamadı");
            }
            if (gorevDurum.Tamamlandimi === true) {
                throw new BadRequestException("Bu dönem ait Proje dışı gider bilgisi oluşturma görevi tamamlanmış. Değişiklik yapılamaz");
            }
            if (new Date(gorevDurum.SonTeslimTarihi).getTime() < Date.now()) {
                throw new BadRequestException("Bu dönem ait Proje dışı gider bilgisi oluşturma görevi son teslim süresi geçmiş. Değişiklik yapılamaz");
            }
            if (projeDisiBilgi) {
                projeDisiBilgi.Gider = Gider;
                projeDisiBilgi.GiderTipiID = data.GiderTipiID;
                projeDisiBilgi.TTOGiderimi = data.TTOGiderimi;
                await this.projeDisiBilgiRepository.save(projeDisiBilgi);
            } else {
                projeDisiBilgi = await this.projeDisiBilgiRepository.save({
                    FirmaID: data.FirmaID,
                    DonemID: data.DonemID,
                    Gider: Gider,
                    TTOGiderimi: data.TTOGiderimi,
                    GiderTipiID: data.GiderTipiID
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
                Gider: projeDisiBilgi.Gider,
                TTOGiderimi: projeDisiBilgi.TTOGiderimi,
                GiderTipiID: projeDisiBilgi.GiderTipiID
            };
        } catch (error) {
            console.error('Proje Dışı Gider bilgisi kaydedilirken bir hata oluştu:', error);
            throw new BadRequestException(
                error.message || 'Proje Dışı Gider bilgisi oluşturulurken bir hata meydana geldi.'
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
                    message: 'Proje Dışı Gider bilgisi başarıyla silindi'
                };
            } else {
                return {
                    status: 404,
                    success: false,
                    message: 'Proje Dışı Gider bilgisi bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Proje Dışı Gider bilgisi silme hatası'
            );
        }



    }
}
