import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { GorevListesi } from './entities/gorev.listesi.entity';
import { GorevKullanicilari } from './entities/gorev-kullanicilari.entity';
import { Projeler } from 'src/projeler/entities/projeler.entity';
import { ProjeIlerlemeBilgiler } from 'src/proje-ilerleme-bilgiler/entities/proje-ilerleme-bilgiler.entity';
import { ProjeGelirBilgileri } from 'src/proje-gelir-bilgileri/entities/proje-gelir-bilgileri.entity';
import { ProjeGiderBilgileri } from 'src/proje-gider-bilgileri/entities/proje-gider-bilgileri.entity';
import { ProjeDisiGelirBilgileri } from 'src/proje-disi-gelir-bilgileri/entities/proje-disi-gelir-bilgileri.entity';
import { ProjeDisiGiderBilgileri } from 'src/proje-disi-gider-bilgileri/entities/proje-disi-gider-bilgileri.entity';
import { ProjeDisiDisTicaretBilgileri } from 'src/proje-disi-dis-ticaret-bilgileri/entities/proje-disi-dis-ticaret-bilgileri.entity';
import { ProjeDisTicaretBilgileri } from 'src/proje-dis-ticaret-bilgileri/entities/proje-dis-ticaret-bilgileri.entity';
import { FirmaMuafiyetBilgiler } from 'src/firma-muafiyet-bilgiler/entities/firma-muafiyet-bilgiler.entity';
import { Personel } from 'src/personel/entities/personel.entity';

@Injectable()
export class GorevListesiService {
    constructor(
        @InjectRepository(GorevListesi)
        private readonly gorevListesiRepository: Repository<GorevListesi>,
        private readonly dataSource: DataSource
    ) { }

    async getGorevListesi(userId: number, projeId: number, firmaId: number, donemId: number) {
        if (isNaN(projeId) || isNaN(firmaId) || isNaN(donemId)) {
            throw new BadRequestException('Proje ID, Firma ID ve Donem ID sayısal değer olmalıdır');
        }

        if (!userId) {
            throw new BadRequestException('Kullanıcı Kimliği gereklidir');
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOneBy({ id: userId });
        if (!user) {
            throw new BadRequestException('Kullanıcı bulunamadı');
        }

        const [gorevListesi, total] = await this.dataSource.getRepository(GorevListesi)
            .createQueryBuilder('gorevListesi')
            .leftJoinAndSelect('gorevListesi.Firma', 'Firma')
            .leftJoinAndSelect('gorevListesi.Donem', 'Donem')
            .leftJoinAndSelect('gorevListesi.Proje', 'Proje')
            .leftJoinAndSelect('gorevListesi.TamamlayanKullanici', 'TamamlayanKullanici')
            .leftJoinAndSelect('gorevListesi.Kullanicilar', 'Kullanicilar')
            .leftJoinAndSelect('Kullanicilar.Kullanici', 'Kullanici')
            .where('gorevListesi.FirmaID = :FirmaID', { FirmaID: firmaId })
            .andWhere('gorevListesi.DonemID = :DonemID', { DonemID: donemId })
            .andWhere(new Brackets(qb => {
                qb.where('gorevListesi.ProjeID = :ProjeID', { ProjeID: projeId })
                    .orWhere('gorevListesi.ProjeID IS NULL');
            }))
            .getManyAndCount();
        return { data: gorevListesi, total };
    }


    async getGorevListesiTeknoAdmin(userId: number, projeId: number, donemId: number, teknokentId: number | null) {
        if (isNaN(projeId) || isNaN(donemId)) {
            throw new BadRequestException('Proje ID ve Donem ID sayısal değer olmalıdır');
        }

        if (!userId) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        // 1. Proje'yi getir ve FirmaID'yi al
        const proje = await this.dataSource.getRepository(Projeler).findOne({
            where: { ProjeID: projeId }
        });

        if (!proje || !proje.FirmaID) {
            throw new NotFoundException('Proje bulunamadı veya ilişkili firma yok');
        }

        if (teknokentId && proje.TeknokentID !== teknokentId) {
            throw new NotFoundException('Bu proje seçili teknokent e ait değil');
        }

        const firmaId = proje.FirmaID;

        // 2. Görevleri getir (ProjeID eşit olan VEYA null olanlar)
        const queryBuilder = this.dataSource.getRepository(GorevListesi).createQueryBuilder('gorevListesi')
            .leftJoinAndSelect('gorevListesi.Firma', 'Firma')
            .leftJoinAndSelect('gorevListesi.Donem', 'Donem')
            .leftJoinAndSelect('gorevListesi.Proje', 'Proje')
            .where('gorevListesi.FirmaID = :FirmaID', { FirmaID: firmaId })
            .andWhere('gorevListesi.DonemID = :DonemID', { DonemID: donemId })
            .andWhere(new Brackets(qb => {
                qb.where('gorevListesi.ProjeID = :ProjeID', { ProjeID: projeId })
                    .orWhere('gorevListesi.ProjeID IS NULL');
            }))

        const [gorevListesi, total] = await queryBuilder.getManyAndCount();

        return {
            data: gorevListesi,
            total,
        };
    }

    async teknoAdminGorevDetay(userId: number, projeId: number, donemId: number, teknokentId: number | null, anahtar: string) {
        if (isNaN(projeId) || isNaN(donemId)) {
            throw new BadRequestException('Proje ID ve Donem ID sayısal değer olmalıdır');
        }

        if (!anahtar) {
            throw new BadRequestException('Anahtar gereklidir');
        }

        if (!userId) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        // 1. Proje'yi getir ve FirmaID'yi al
        const proje = await this.dataSource.getRepository(Projeler).findOne({
            where: { ProjeID: projeId }
        });

        if (!proje || !proje.FirmaID) {
            throw new NotFoundException('Proje bulunamadı veya ilişkili firma yok');
        }

        if (teknokentId && proje.TeknokentID !== teknokentId) {
            throw new NotFoundException('Bu proje seçili teknokent e ait değil');
        }

        const firmaId = proje.FirmaID;


        try {
            let gorev = null;
            switch (anahtar) {
                case 'proje-ilerleme-bilgileri':
                    gorev = await this.dataSource.getRepository(ProjeIlerlemeBilgiler).find({
                        where: { ProjeID: projeId, DonemID: donemId }
                    });
                    if (!gorev) {
                        throw new NotFoundException('Görev bilgileri bulunamadı');
                    }
                    return gorev;
                case 'proje-gelir-bilgileri':
                    gorev = await this.dataSource.getRepository(ProjeGelirBilgileri).find({
                        where: { ProjeID: projeId, DonemID: donemId }
                    });
                    if (!gorev) {
                        throw new NotFoundException('Görev bilgileri bulunamadı');
                    }
                    return gorev;
                case 'proje-gider-bilgileri':
                    gorev = await this.dataSource.getRepository(ProjeGiderBilgileri).find({
                        where: { ProjeID: projeId, DonemID: donemId },
                        relations:['GiderTipi']
                    });
                    if (!gorev) {
                        throw new NotFoundException('Görev bilgileri bulunamadı');
                    }
                    return gorev;
                case 'proje-disi-gelir-bilgileri':
                    gorev = await this.dataSource.getRepository(ProjeDisiGelirBilgileri).find({
                        where: { FirmaID: firmaId, DonemID: donemId }
                    });
                    if (!gorev) {
                        throw new NotFoundException('Görev bilgileri bulunamadı');
                    }
                    return gorev;
                case 'proje-disi-gider-bilgileri':
                    gorev = await this.dataSource.getRepository(ProjeDisiGiderBilgileri).find({
                        where: { FirmaID: firmaId, DonemID: donemId },
                        relations:['GiderTipi']
                    });
                    if (!gorev) {
                        throw new NotFoundException('Görev bilgileri bulunamadı');
                    }
                    return gorev;
                case 'proje-dis-ticaret-bilgileri':
                    gorev = await this.dataSource.getRepository(ProjeDisTicaretBilgileri).find({
                        where: { ProjeID: projeId, DonemID: donemId }
                    });
                    if (!gorev) {
                        throw new NotFoundException('Görev bilgileri bulunamadı');
                    }
                    return gorev;
                case 'proje-disi-dis-ticaret-bilgileri':
                    gorev = await this.dataSource.getRepository(ProjeDisiDisTicaretBilgileri).find({
                        where: { FirmaID: firmaId, DonemID: donemId }
                    });
                    if (!gorev) {
                        throw new NotFoundException('Görev bilgileri bulunamadı');
                    }
                    return gorev;
                case 'firma-muafiyet-bilgileri':
                    gorev = await this.dataSource.getRepository(FirmaMuafiyetBilgiler).find({
                        where: { FirmaID: firmaId, DonemID: donemId,IsDeleted:false },
                        relations: ['MuafiyetTipi']
                    });
                    if (!gorev) {
                        throw new NotFoundException('Görev bilgileri bulunamadı');
                    }
                    return gorev;
                default:
                    return anahtar;
            }
        } catch (error) {
            throw new BadRequestException(error.message || 'Görev detay alma hatası');
        }


    }



    async addGorevKullanici(userId: number, data: { GorevID: number, FirmaID: number, KullaniciID: number }) {
        if (!userId) throw new BadRequestException(`Kullanıcı kimliği gereklidir`);

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({ where: { id: userId } });
        if (!user) throw new BadRequestException(`Kullanıcı kimliği gereklidir`);

        if (!data.GorevID || !data.KullaniciID || !data.FirmaID) {
            throw new BadRequestException('Geçersiz kullanıcı, firma veya görev bilgisi');
        }
        const userRole = await this.dataSource.getRepository(Personel).findOne({ where: { KullaniciID: userId,Tip:1,IliskiID: data.FirmaID} });
        if (!userRole || userRole.Rol !== 'owner') throw new BadRequestException(`Bu işlem için yetkiniz yok`);

        try {

            const gorev = await this.dataSource.getRepository(GorevListesi).findOne({ where: { GorevID: data.GorevID, FirmaID: data.FirmaID } });
            if (!gorev) {
                throw new BadRequestException('Görev bulunamadı');
            }

            const kullanici = await this.dataSource.getRepository(Kullanicilar).findOne({ where: { id: data.KullaniciID } });
            if (!kullanici) {
                throw new BadRequestException('Kullanıcı bulunamadı');
            }

            const gorevkullanici = await this.dataSource.getRepository(GorevKullanicilari).findOne({ where: { KullaniciID: data.KullaniciID, GorevID: data.GorevID } });
            if (gorevkullanici) {
                throw new BadRequestException('Bu Kullanıcı bu Göreve daha önce atanmış');
            }


            const gorevKullanicisi = await this.dataSource.getRepository(GorevKullanicilari).save({
                Kullanici: kullanici,
                Gorev: gorev
            });

            return {
                message: 'Kullanıcı başarıyla atandı',
                data: gorevKullanicisi,
            };

        } catch (error) {
            throw new BadRequestException(error.message || 'Görev kullanici atama hatası');
        }

    }

}
