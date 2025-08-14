import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { Firma } from 'src/firmalar/entities/firma.entity';
import { ProjeGelirBilgileri } from './entities/proje-gelir-bilgileri.entity';
import { GorevListesi } from 'src/gorev-listesi/entities/gorev.listesi.entity';

@Injectable()
export class ProjeGelirBilgileriService {
    constructor(
        @InjectRepository(ProjeGelirBilgileri)
        private readonly projeBilgiRepository: Repository<ProjeGelirBilgileri>,
        private readonly dataSource: DataSource
    ) { }


    async getProjeBilgiItem(FirmaID: number, ItemID: number) {
        if (!FirmaID) {
            throw new BadRequestException('Firma ID gereklidir');
        }
        if (!ItemID) {
            throw new BadRequestException('Proje Bilgi ID gereklidir');
        }
        try {
            const proje = await this.dataSource
                .getRepository(ProjeGelirBilgileri)
                .createQueryBuilder("projebilgi")
                .leftJoinAndSelect("projebilgi.Proje", "proje")
                .where("projebilgi.id = :id", { id: ItemID })
                .andWhere("proje.FirmaID = :FirmaID", { FirmaID })
                .getOne();

            if (!proje) {
                throw new BadRequestException('Proje gelir bilgisi bulunamdı');
            }

            return proje;
        } catch (error) {
            throw error;
        }
    }

    async getProjeBilgi(FirmaID: number, ProjeID: number, DonemID: number, GelirTipi: string) {
        if (!FirmaID || FirmaID === 0) {
            throw new BadRequestException('Firma ID gereklidir');
        }
        if (!ProjeID || ProjeID === 0) {
            throw new BadRequestException('Proje ID gereklidir');
        }
        if (!DonemID || DonemID === 0) {
            throw new BadRequestException('Donem ID gereklidir');
        }
        if (!GelirTipi || GelirTipi.length < 1) {
            throw new BadRequestException('GelirTipi gereklidir');
        }
        try {
            const proje = await this.dataSource
                .getRepository(ProjeGelirBilgileri)
                .createQueryBuilder("projebilgi")
                .leftJoinAndSelect("projebilgi.Proje", "proje")
                .where("projebilgi.ProjeID = :ProjeID", { ProjeID: ProjeID })
                .andWhere("projebilgi.DonemID = :DonemID", { DonemID: DonemID })
                .andWhere("projebilgi.GelirTipi = :GelirTipi", { GelirTipi: GelirTipi })
                .andWhere("proje.FirmaID = :FirmaID", { FirmaID })
                .getOne();

            return proje;
        } catch (error) {
            throw new BadRequestException('Veriler çekilirken bir hata oluştu');
        }
    }



    async getProjeBilgiler(userId: number, query: any, firmaId: number) {
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

        const firmalar = await this.dataSource
            .getRepository(Firma)
            .createQueryBuilder("firma")
            .leftJoinAndSelect("firma.Projeler", "Projeler")
            .where("firma.IsDeleted = :isDeleted", { isDeleted: false })
            .andWhere("firma.FirmaID = :FirmaID", { FirmaID: firmaId })
            .getMany();

        if (!firmalar || firmalar.length === 0) {
            return {
                data: [],
                total: 0,
                page,
                lastPage: Math.ceil(0 / limit),
            };
        }

        const projeIDs = firmalar
            .flatMap((firma) => firma.Projeler)
            .map((proje) => proje.ProjeID);

        if (projeIDs.length === 0) {
            return {
                data: [],
                total: 0,
                page,
                lastPage: Math.ceil(0 / limit),
            };
        }

        const queryBuilder = await this.dataSource
            .getRepository(ProjeGelirBilgileri)
            .createQueryBuilder("projeGelirBilgiler")
            .leftJoinAndSelect("projeGelirBilgiler.Proje", "Proje")
            .leftJoinAndSelect("projeGelirBilgiler.Donem", "Donem")
            .where("projeGelirBilgiler.ProjeID IN (:...projeIDs)", { projeIDs });



        // Filtreleme işlemi
        Object.keys(filter).forEach((key) => {
            const validFilterFields = {
                'Proje': 'Proje.ProjeAdi',
                'Donem': 'Donem.DonemAdi',
                'GelirTipi': 'projeGelirBilgiler.GelirTipi',
                'Gelir': 'projeGelirBilgiler.Gelir',
                'query': null // Genel arama için
            };

            if (key === 'query') {
                // Tüm alanlarda arama yap
                queryBuilder.andWhere(new Brackets(qb => {
                    qb.where('Proje.ProjeAdi LIKE :searchTerm')
                        .orWhere('Donem.DonemAdi LIKE :searchTerm')
                        .orWhere('CAST(projeGelirBilgiler.GelirTipi AS VARCHAR) LIKE :searchTerm')
                        .orWhere('CAST(projeGelirBilgiler.Gelir AS VARCHAR) LIKE :searchTerm');
                }), { searchTerm: `%${filter[key]}%` });
            } else if (validFilterFields[key]) {
                queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
            }
        });

        // Sıralama işlemi
        const validSortFields = ['Proje', 'Firma', 'Donem', 'GelirTipi', 'Gelir'];
        if (sort && validSortFields.includes(sort)) {
            if (sort === 'Proje') {
                queryBuilder.orderBy('Proje.ProjeAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
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


    async upload(userId: number, data: { Gelir: string, ProjeID: number, DonemID: number, FSMHLisansGelirimi: boolean, TTOGelirimi: boolean, GelirTipi: string, islemTipi: 1 | 2 }) {
        if (!userId) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı bulunamadı`);
        }

        if (!data.ProjeID || !data.DonemID || !data.GelirTipi || !data.Gelir) {
            throw new BadRequestException(`Proje ID, Dönem ID, Gelir ve Gelir Tipi alanlarının tamamı zorunludur.`);
        }
        if (!data.islemTipi) {
            throw new BadRequestException(`İşlem tipi alanı zorunludur.`);
        }

        const gelir = parseFloat(data.Gelir);

        if (isNaN(gelir) || gelir < 0) {
            throw new BadRequestException("Geçerli bir gelir girin (0 veya 0'dan büyük bir sayı).");
        }

        let projebilgi = await this.dataSource.getRepository(ProjeGelirBilgileri).findOne({
            where: { ProjeID: data.ProjeID, DonemID: data.DonemID, GelirTipi: data.GelirTipi },
        });

        try {
            const gorevDurum = await this.dataSource.getRepository(GorevListesi).findOne({
                where: { BolumAnahtar: 'proje-gelir-bilgileri', DonemID: data.DonemID, ProjeID: data.ProjeID }
            })
            if (!gorevDurum) {
                throw new BadRequestException("İlgili görev bulunamadı");
            }
            if (gorevDurum.Tamamlandimi === true) {
                throw new BadRequestException("Bu dönem ait Proje gelir bilgisi oluşturma görevi tamamlanmış. Değişiklik yapılamaz");
            }
            if (new Date(gorevDurum.SonTeslimTarihi).getTime() < Date.now()) {
                throw new BadRequestException("Bu dönem ait Proje gelir bilgisi oluşturma görevi son teslim süresi geçmiş. Değişiklik yapılamaz");
            }
            if (projebilgi) {
                projebilgi.Gelir = gelir;
                projebilgi.FSMHLisansGelirimi = data.FSMHLisansGelirimi;
                projebilgi.TTOGelirimi = data.TTOGelirimi;
                projebilgi.GelirTipi = data.GelirTipi;
                await this.projeBilgiRepository.save(projebilgi);
            } else {
                projebilgi = await this.projeBilgiRepository.save({
                    ProjeID: data.ProjeID,
                    DonemID: data.DonemID,
                    Gelir: gelir,
                    FSMHLisansGelirimi: data.FSMHLisansGelirimi,
                    TTOGelirimi: data.TTOGelirimi,
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
                id: projebilgi.id,
                ProjeID: projebilgi.ProjeID,
                DonemID: projebilgi.DonemID,
                Gelir: projebilgi.Gelir,
                FSMHLisansGelirimi: projebilgi.FSMHLisansGelirimi,
                TTOGelirimi: projebilgi.TTOGelirimi,
                GelirTipi: projebilgi.GelirTipi
            };
        } catch (error) {
            console.error('Proje Gelir bilgisi kaydedilirken bir hata oluştu:', error);
            throw new BadRequestException(
                error.message || 'Proje Gelir bilgisi oluşturulurken bir hata meydana geldi.'
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
            const projeBilgiler = await this.projeBilgiRepository.findOne({ where: { id: data.itemId } });

            if (projeBilgiler) {
                await this.projeBilgiRepository.remove(projeBilgiler);

                return {
                    status: 200,
                    success: true,
                    message: 'Proje Gelir bilgisi başarıyla silindi'
                };
            } else {
                return {
                    status: 404,
                    success: false,
                    message: 'Proje Gelir bilgisi bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Proje Gelir bilgisi silme hatası'
            );
        }



    }
}
