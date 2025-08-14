import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { FirmaMuafiyetBilgiler } from './entities/firma-muafiyet-bilgiler.entity';
import { GorevListesi } from 'src/gorev-listesi/entities/gorev.listesi.entity';

@Injectable()
export class FirmaMuafiyetBilgilerService {
    constructor(
        @InjectRepository(FirmaMuafiyetBilgiler)
        private readonly firmaMuafiyetlerRepository: Repository<FirmaMuafiyetBilgiler>,
        private readonly dataSource: DataSource
    ) { }


    async getMuafiyetBilgi(FirmaID: number, MuafiyetBilgiID: number) {
        if (!FirmaID || !MuafiyetBilgiID) {
            throw new BadRequestException('Firma ID ve Muafiyet Bilgi ID gereklidir');
        }
        try {
            const proje = await this.dataSource
                .getRepository(FirmaMuafiyetBilgiler)
                .findOne({ where: { IsDeleted: false, FirmaID: FirmaID, id: MuafiyetBilgiID } });

            if (!proje) {
                throw new BadRequestException('Muafiyet Bilgisi bulunamadı');
            }
            return proje;
        } catch (error) {
            throw error;
        }
    }

    async getFirmaMuafiyetler(userId: number, query: any, firmaId: number) {
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



        const queryBuilder = this.dataSource.getRepository(FirmaMuafiyetBilgiler).createQueryBuilder('FirmaMuafiyetler')
            .leftJoinAndSelect('FirmaMuafiyetler.Firma', 'Firma')
            .leftJoinAndSelect('FirmaMuafiyetler.Donem', 'Donem')
            .leftJoinAndSelect('FirmaMuafiyetler.MuafiyetTipi', 'MuafiyetTipi')
            .where('FirmaMuafiyetler.FirmaID = :FirmaID', { FirmaID: firmaId });


        // Filtreleme işlemi
        Object.keys(filter).forEach((key) => {
            const validFilterFields = {
                'MuafiyetTipi.Tanim': 'MuafiyetTipi.Tanim',
                'Donem.DonemAdi': 'Donem.DonemAdi',
                'Matrah': 'FirmaMuafiyetler.Matrah',
                'MuafiyetTutari': 'FirmaMuafiyetler.MuafiyetTutari',
                'query': null // Genel arama için
            };

            if (key === 'query') {
                // Tüm alanlarda arama yap
                queryBuilder.andWhere(new Brackets(qb => {
                    qb.where('MuafiyetTipi.Tanim LIKE :searchTerm')
                        .orWhere('Donem.DonemAdi LIKE :searchTerm')
                        .orWhere('CAST(FirmaMuafiyetler.Matrah AS VARCHAR) LIKE :searchTerm')
                        .orWhere('CAST(FirmaMuafiyetler.MuafiyetTutari AS VARCHAR) LIKE :searchTerm');
                }), { searchTerm: `%${filter[key]}%` });
            } else if (validFilterFields[key]) {
                queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
            }
        });

        // Sıralama işlemi
        const validSortFields = ['MuafiyetTipi', 'Firma', 'Donem'];
        if (sort && validSortFields.includes(sort)) {
            if (sort === 'Firma') {
                queryBuilder.orderBy('Firma.FirmaAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            } else if (sort === 'MuafiyetTipi') {
                queryBuilder.orderBy('MuafiyetTipi.Tanim', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            } else if (sort === 'Donem') {
                queryBuilder.orderBy('Donem.DonemAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            } else {
                queryBuilder.orderBy(`FirmaMuafiyetler.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
            }
        }

        queryBuilder.skip((page - 1) * limit).take(limit);

        const [FirmaMuafiyetler, total] = await queryBuilder.getManyAndCount();
        return {
            data: FirmaMuafiyetler,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }


    async create(userId: number, data: { DonemID: number, FirmaID: number, MuafiyetTipiID: number, MuafiyetTutari: string, Matrah: string, islemTipi: 1 | 2 }) {


        if (!userId) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        if (!data.DonemID && !data.FirmaID && !data.MuafiyetTipiID) {
            throw new BadRequestException(`Dönem, Muafiyet Tipi ve Firma zorunludur`);
        }
        if (!data.islemTipi) {
            throw new BadRequestException(`İşlem tipi alanı zorunludur.`);
        }

        const muafiyetTutari = parseFloat(data.MuafiyetTutari);
        const matrah = parseFloat(data.Matrah);

        if (isNaN(muafiyetTutari) || muafiyetTutari <= 0) {
            throw new BadRequestException("Geçerli bir muafiyet tutarı girin (0'dan büyük bir sayı).");
        }
        if (isNaN(matrah) || matrah <= 0) {
            throw new BadRequestException("Geçerli bir matrah girin (0'dan büyük bir sayı).");
        }


        try {
            const gorevDurum = await this.dataSource.getRepository(GorevListesi).findOne({
                where: { BolumAnahtar: 'firma-muafiyet-bilgileri', DonemID: data.DonemID, FirmaID: data.FirmaID }
            })
            if (!gorevDurum) {
                throw new BadRequestException("İlgili görev bulunamadı");
            }
            if (gorevDurum.Tamamlandimi === true) {
                throw new BadRequestException("Bu dönem ait Firma muafiyet bilgisi oluşturma görevi tamamlanmış. Değişiklik yapılamaz");
            }
            if (new Date(gorevDurum.SonTeslimTarihi).getTime() < Date.now()) {
                throw new BadRequestException("Bu dönem ait Firma muafiyet bilgisi oluşturma görevi son teslim süresi geçmiş. Değişiklik yapılamaz");
            }
            const firmaMuafiyetler = await this.firmaMuafiyetlerRepository.save({
                DonemID: data.DonemID,
                FirmaID: data.FirmaID,
                MuafiyetTipiID: data.MuafiyetTipiID,
                MuafiyetTutari: muafiyetTutari,
                Matrah: matrah
            });

            if (data.islemTipi === 1) {
                await this.dataSource.getRepository(GorevListesi).update(gorevDurum.GorevID, {
                    Tamamlandimi: true,
                    TamamlanmaTarihi: new Date(),
                    TamamlayanKullaniciID: user.id
                });
            }

            return await this.firmaMuafiyetlerRepository.createQueryBuilder('FirmaMuafiyetler')
                .leftJoinAndSelect('FirmaMuafiyetler.Firma', 'Firma')
                .leftJoinAndSelect('FirmaMuafiyetler.Donem', 'Donem')
                .leftJoinAndSelect('FirmaMuafiyetler.MuafiyetTipi', 'MuafiyetTipi')
                .where('FirmaMuafiyetler.id = :id', { id: firmaMuafiyetler.id })
                .getOne();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'firmaMuafiyetlerler oluşturma hatası',
            );
        }
    }

    async update(userId: number, data: { DonemID: number, FirmaID: number, MuafiyetTipiID: number, MuafiyetTutari: string, Matrah: string, id: number, islemTipi: 1 | 2 }) {


        if (!userId) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }


        if (!data.id && !!data.DonemID && !data.FirmaID && !data.MuafiyetTipiID) {
            throw new BadRequestException(`item id, Muafiyet Tipi, Dönem ve Firma zorunludur`);
        }
        if (!data.islemTipi) {
            throw new BadRequestException(`İşlem tipi alanı zorunludur.`);
        }

        const muafiyetTutari = parseFloat(data.MuafiyetTutari);
        const matrah = parseFloat(data.Matrah);

        if (isNaN(muafiyetTutari) || muafiyetTutari < 0) {
            throw new BadRequestException("Geçerli bir muafiyet tutarı girin (0 veya 0'dan büyük bir sayı).");
        }
        if (isNaN(matrah) || matrah < 0) {
            throw new BadRequestException("Geçerli bir matrah girin (0 veya 0'dan büyük bir sayı).");
        }


        try {
            const gorevDurum = await this.dataSource.getRepository(GorevListesi).findOne({
                where: { BolumAnahtar: 'firma-muafiyet-bilgileri', DonemID: data.DonemID, FirmaID: data.FirmaID }
            })
            if (!gorevDurum) {
                throw new BadRequestException("İlgili görev bulunamadı");
            }
            if (gorevDurum.Tamamlandimi === true) {
                throw new BadRequestException("Bu dönem ait Firma muafiyet bilgisi oluşturma görevi tamamlanmış. Değişiklik yapılamaz");
            }
            if (new Date(gorevDurum.SonTeslimTarihi).getTime() < Date.now()) {
                throw new BadRequestException("Bu dönem ait Firma muafiyet bilgisi oluşturma görevi son teslim süresi geçmiş. Değişiklik yapılamaz");
            }
            const firmaMuafiyetler = await this.firmaMuafiyetlerRepository.findOne({ where: { id: data.id } });

            if (!firmaMuafiyetler) {
                throw new BadRequestException(`firma Muafiyetleri bulunamadı`);
            }

            firmaMuafiyetler.DonemID = data.DonemID;
            firmaMuafiyetler.FirmaID = data.FirmaID;
            firmaMuafiyetler.MuafiyetTipiID = data.MuafiyetTipiID;
            firmaMuafiyetler.MuafiyetTutari = muafiyetTutari;
            firmaMuafiyetler.Matrah = matrah;

            await this.firmaMuafiyetlerRepository.save(firmaMuafiyetler);

            if (data.islemTipi === 1) {
                await this.dataSource.getRepository(GorevListesi).update(gorevDurum.GorevID, {
                    Tamamlandimi: true,
                    TamamlanmaTarihi: new Date(),
                    TamamlayanKullaniciID: user.id
                });
            }
            return await this.firmaMuafiyetlerRepository.createQueryBuilder('FirmaMuafiyetler')
                .leftJoinAndSelect('FirmaMuafiyetler.Firma', 'Firma')
                .leftJoinAndSelect('FirmaMuafiyetler.Donem', 'Donem')
                .leftJoinAndSelect('FirmaMuafiyetler.MuafiyetTipi', 'MuafiyetTipi')
                .where('FirmaMuafiyetler.id = :id', { id: firmaMuafiyetler.id })
                .getOne();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'firma Muafiyetleri düzenleme haatsı',
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
            const firmaMuafiyetler = await this.firmaMuafiyetlerRepository.findOne({ where: { id: data.itemId } });
            if (firmaMuafiyetler) {
                firmaMuafiyetler.IsDeleted = true;
                await this.firmaMuafiyetlerRepository.save(firmaMuafiyetler);

                return await this.firmaMuafiyetlerRepository.createQueryBuilder('FirmaMuafiyetler')
                    .leftJoinAndSelect('FirmaMuafiyetler.Firma', 'Firma')
                    .leftJoinAndSelect('FirmaMuafiyetler.Donem', 'Donem')
                    .leftJoinAndSelect('FirmaMuafiyetler.MuafiyetTipi', 'MuafiyetTipi')
                    .where('FirmaMuafiyetler.id = :id', { id: data.itemId })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'Firma Muafiyet bilgisi bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Firma Muafiyet bilgisi silme hatası',
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


        try {
            const firmaMuafiyetler = await this.firmaMuafiyetlerRepository
                .createQueryBuilder('FirmaMuafiyetler')
                .where('FirmaMuafiyetler.id = :id', { id: data.itemId })
                .getOne();

            if (firmaMuafiyetler) {
                firmaMuafiyetler.IsDeleted = false;

                await this.firmaMuafiyetlerRepository.save(firmaMuafiyetler);
                return await this.firmaMuafiyetlerRepository.createQueryBuilder('FirmaMuafiyetler')
                    .leftJoinAndSelect('FirmaMuafiyetler.Firma', 'Firma')
                    .leftJoinAndSelect('FirmaMuafiyetler.Donem', 'Donem')
                    .leftJoinAndSelect('FirmaMuafiyetler.MuafiyetTipi', 'MuafiyetTipi')
                    .where('FirmaMuafiyetler.id = :id', { id: data.itemId })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'Firma Muafiyet bilgisi bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Firma Muafiyet bilgisi geri getirme hatası'
            );
        }
    }
}
