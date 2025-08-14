import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { Firma } from 'src/firmalar/entities/firma.entity';
import { ProjeDisiDisTicaretBilgileri } from './entities/proje-disi-dis-ticaret-bilgileri.entity';
import { GorevListesi } from 'src/gorev-listesi/entities/gorev.listesi.entity';

@Injectable()
export class ProjeDisiDisTicaretBilgileriService {
    constructor(
        @InjectRepository(ProjeDisiDisTicaretBilgileri)
        private readonly projeDisiBilgiRepository: Repository<ProjeDisiDisTicaretBilgileri>,
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
                .getRepository(ProjeDisiDisTicaretBilgileri)
                .createQueryBuilder("projeDisiBilgi")
                .leftJoinAndSelect("projeDisiBilgi.Firma", "firma")
                .where("projeDisiBilgi.id = :id", { id: ItemID })
                .andWhere("projeDisiBilgi.FirmaID = :FirmaID", { FirmaID })
                .getOne();

            if (!proje) {
                throw new BadRequestException('Proje dışı Dış Ticaret bilgisi bulunamdı');
            }

            return proje;
        } catch (error) {
            throw error;
        }
    }

    async getprojeDisiBilgi(FirmaID: number, DonemID: number, Ulke: string) {
        if (!FirmaID || FirmaID === 0) {
            throw new BadRequestException('Firma ID gereklidir');
        }

        if (!DonemID || DonemID === 0) {
            throw new BadRequestException('Donem ID gereklidir');
        }
        if (!Ulke || Ulke.length < 1) {
            throw new BadRequestException('Ulke gereklidir');
        }
        try {
            const proje = await this.dataSource
                .getRepository(ProjeDisiDisTicaretBilgileri)
                .createQueryBuilder("projeDisiBilgi")
                .leftJoinAndSelect("projeDisiBilgi.Firma", "firma")
                .where("projeDisiBilgi.FirmaID = :FirmaID", { FirmaID: FirmaID })
                .andWhere("projeDisiBilgi.DonemID = :DonemID", { DonemID: DonemID })
                .andWhere("projeDisiBilgi.Ulke = :Ulke", { Ulke: Ulke })
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
            .getRepository(ProjeDisiDisTicaretBilgileri)
            .createQueryBuilder("projeGelirBilgiler")
            .leftJoinAndSelect("projeGelirBilgiler.Firma", "Firma")
            .leftJoinAndSelect("projeGelirBilgiler.Donem", "Donem")
            .where('projeGelirBilgiler.FirmaID = :FirmaID', { FirmaID: firmaId });


        // Filtreleme işlemi
        Object.keys(filter).forEach((key) => {
            const validFilterFields = {
                'Firma': 'Firma.FirmaAdi',
                'Donem': 'Donem.DonemAdi',
                'Ithalat': 'projeGelirBilgiler.Ithalat',
                'Ihracat': 'projeGelirBilgiler.Ihracat',
                'Ulke': 'projeGelirBilgiler.Ulke',
                'query': null // Genel arama için
            };

            if (key === 'query') {
                // Tüm alanlarda arama yap
                queryBuilder.andWhere(new Brackets(qb => {
                    qb.where('Firma.FirmaAdi LIKE :searchTerm')
                        .orWhere('Donem.DonemAdi LIKE :searchTerm')
                        .orWhere('CAST(projeGelirBilgiler.Ithalat AS VARCHAR) LIKE :searchTerm')
                        .orWhere('CAST(projeGelirBilgiler.Ihracat AS VARCHAR) LIKE :searchTerm')
                        .orWhere('CAST(projeGelirBilgiler.Ulke AS VARCHAR) LIKE :searchTerm');
                }), { searchTerm: `%${filter[key]}%` });
            } else if (validFilterFields[key]) {
                queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
            }
        });

        // Sıralama işlemi
        const validSortFields = ['Firma', 'Donem', 'Ulke', 'Ithalat', 'Ihracat'];
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


    async upload(userId: number, data: { Ithalat: string, Ihracat: string, FirmaID: number, DonemID: number, LisansGelirimi: boolean, Ulke: string, islemTipi: 1 | 2 }) {
        if (!userId) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı bulunamadı`);
        }

        if (!data.FirmaID || !data.DonemID || !data.Ulke) {
            throw new BadRequestException(`Firma ID, Dönem ID ve Ülke alanlarının tamamı zorunludur.`);
        }
        if (!data.islemTipi) {
            throw new BadRequestException(`İşlem tipi alanı zorunludur.`);
        }

        const ihracat = data.Ihracat ? parseFloat(data.Ihracat) : 0;
        const ithalat = data.Ithalat ? parseFloat(data.Ithalat) : 0;

        if (data.Ihracat) {
            if (isNaN(ihracat) || ihracat < 0) {
                throw new BadRequestException("Geçerli bir ihracat değeri girin (0 veya 0'dan büyük bir sayı).");
            }
        }
        if (data.Ithalat) {
            if (isNaN(ithalat) || ithalat < 0) {
                throw new BadRequestException("Geçerli bir ithalat değeri girin (0 veya 0'dan büyük bir sayı).");
            }
        }

        if ((!data.Ithalat && !data.Ihracat) || (data.Ithalat.length < 1 && data.Ihracat.length < 1)) {
            throw new BadRequestException("İthalat veya ihracat değerlerinden en az biri gereklidir");
        }

        let projeDisiBilgi = await this.dataSource.getRepository(ProjeDisiDisTicaretBilgileri).findOne({
            where: { FirmaID: data.FirmaID, DonemID: data.DonemID, Ulke: data.Ulke },
        });

        try {

            const gorevDurum = await this.dataSource.getRepository(GorevListesi).findOne({
                where: { BolumAnahtar: 'proje-disi-dis-ticaret-bilgileri', DonemID: data.DonemID, FirmaID: data.FirmaID }
            })
            if (!gorevDurum) {
                throw new BadRequestException("İlgili görev bulunamadı");
            }
            if (gorevDurum.Tamamlandimi === true) {
                throw new BadRequestException("Bu dönem ait Proje Dışı dış ticaret bilgisi oluşturma görevi tamamlanmış. Değişiklik yapılamaz");
            }
            if (new Date(gorevDurum.SonTeslimTarihi).getTime() < Date.now()) {
                throw new BadRequestException("Bu dönem ait Proje Dışı dış ticaret bilgisi oluşturma görevi son teslim süresi geçmiş. Değişiklik yapılamaz");
            }

            if (projeDisiBilgi) {
                projeDisiBilgi.Ihracat = ihracat;
                projeDisiBilgi.Ithalat = ithalat;
                projeDisiBilgi.LisansGelirimi = data.LisansGelirimi;
                projeDisiBilgi.Ulke = data.Ulke;
                await this.projeDisiBilgiRepository.save(projeDisiBilgi);
            } else {
                projeDisiBilgi = await this.projeDisiBilgiRepository.save({
                    FirmaID: data.FirmaID,
                    DonemID: data.DonemID,
                    Ihracat: ihracat,
                    Ithalat: ithalat,
                    LisansGelirimi: data.LisansGelirimi,
                    Ulke: data.Ulke
                });
            }
            if (data.islemTipi === 1) {
                await this.dataSource.getRepository(GorevListesi).update(gorevDurum.GorevID, {
                    Tamamlandimi: true,
                    TamamlanmaTarihi: new Date(),
                    TamamlayanKullaniciID:user.id
                });
            }

            return {
                id: projeDisiBilgi.id,
                FirmaID: projeDisiBilgi.FirmaID,
                DonemID: projeDisiBilgi.DonemID,
                Ithalat: projeDisiBilgi.Ithalat,
                Ihracat: projeDisiBilgi.Ihracat,
                LisansGelirimi: projeDisiBilgi.LisansGelirimi,
                Ulke: projeDisiBilgi.Ulke
            };
        } catch (error) {
            console.error('Proje Dışı Dış Ticaret bilgisi kaydedilirken bir hata oluştu:', error);
            throw new BadRequestException(
                error.message || 'Proje Dışı Dış Ticaret bilgisi oluşturulurken bir hata meydana geldi.'
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
                    message: 'Proje Dışı Dış Ticaret bilgisi başarıyla silindi'
                };
            } else {
                return {
                    status: 404,
                    success: false,
                    message: 'Proje Dışı Dış Ticaret bilgisi bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Proje Dışı Dış Ticaret bilgisi silme hatası'
            );
        }



    }
}
