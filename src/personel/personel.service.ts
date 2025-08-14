import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { Personel } from './entities/personel.entity';
import { CreatePersonelDto } from './dto/create.dto';
import { UpdatePersonelDto } from './dto/update.dto';
import { IzinSureleri } from 'src/izin-sureleri/entities/izin-sureleri.entity';
import { DisaridaGecirilenSureler } from 'src/disarida-gecirilen-sureler/entities/disarida-gecirilen-sureler.entity';
import { Donem } from 'src/donem/entities/donem.entity';
import { UpdateIliskiDto } from './dto/iliskiupdate.dto';
import { GrupYetkileri } from 'src/grup-yetkileri/entities/grup-yetkileri.entity';
import { Teknokentler } from 'src/teknokentler/entities/teknokentler.entity';
import { Firma } from 'src/firmalar/entities/firma.entity';
import { LoginKayitlari } from 'src/login-kayitlari/entities/login-kayitlari.entity';
import { isNumber } from 'class-validator';

@Injectable()
export class PersonelService {
    constructor(
        @InjectRepository(Personel)
        private readonly personelRepository: Repository<Personel>,
        private readonly dataSource: DataSource
    ) { }


    async fullKullaniciFirmalari(userId: number) {

        if (!userId) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }


        try {
            const queryBuilder = this.dataSource.getRepository(Personel)
                .createQueryBuilder('kullaniciFirmalari')
                .where('kullaniciFirmalari.KullaniciID = :KullaniciID', { KullaniciID: userId })
                .andWhere('kullaniciFirmalari.Rol = :Rol', { Rol: 'owner' })
                .andWhere('kullaniciFirmalari.Tip = :Tip', { Tip: 1 })
                .leftJoinAndMapOne('kullaniciFirmalari.Firma', Firma, 'Firma', 'Firma.FirmaID = kullaniciFirmalari.IliskiID')
                .andWhere('Firma.IsDeleted != :IsDeleted', { IsDeleted: 1 })





            const kullaniciFirmalari = await queryBuilder.getMany();


            return kullaniciFirmalari;
        } catch (error) {
            throw new BadRequestException(error.message || 'Kullanıcı firmaları getirme hatası');
        }
    }


    async firmaDisindaKayitlar(IliskiID: number, PersonelID: number, query: any) {
        let IzinTalepID = parseInt(query.izintalepId) || null;
        let DonemID = parseInt(query.donemId) || null;
        let DisaridaGecirilenFormID = parseInt(query.disgorevformId) || null;

        if (isNaN(IzinTalepID)) {
            IzinTalepID = null;
        }

        if (isNaN(DonemID)) {
            DonemID = null;
        }

        if (isNaN(DisaridaGecirilenFormID)) {
            DisaridaGecirilenFormID = null;
        }



        if (!IliskiID || !PersonelID) {
            throw new BadRequestException('Iliski ID ve Personel ID gereklidir');
        }

        try {
            const izinlerquery = this.dataSource
                .getRepository(IzinSureleri)
                .createQueryBuilder('izinSure')
                .leftJoinAndSelect('izinSure.IzinTalep', 'IzinTalep')
                .where('IzinTalep.PersonelID = :PersonelID', { PersonelID: PersonelID })
                .andWhere('IzinTalep.IsDeleted = :isDeleted', { isDeleted: false });
            if (IzinTalepID !== null) {
                izinlerquery.andWhere('izinSure.IzinTalepID != :IzinTalepID', { IzinTalepID });
            }
            if (DonemID !== null) {
                izinlerquery.andWhere('IzinTalep.DonemID = :DonemID', { DonemID });
            }

            const izinler = await izinlerquery.getMany();
            const disgorevlerquery = this.dataSource
                .getRepository(DisaridaGecirilenSureler)
                .createQueryBuilder('disgorev')
                .leftJoinAndSelect('disgorev.disaridaGecirilenForm', 'disaridaGecirilenForm')
                .where('disaridaGecirilenForm.PersonelID = :PersonelID', { PersonelID: PersonelID })
                .andWhere('disaridaGecirilenForm.IsDeleted = :isDeleted', { isDeleted: false });
            if (DisaridaGecirilenFormID !== null) {
                disgorevlerquery.andWhere('disgorev.DisaridaGecirilenFormID != :DisaridaGecirilenFormID', { DisaridaGecirilenFormID });
            }
            if (DonemID !== null) {
                disgorevlerquery.andWhere('disaridaGecirilenForm.DonemID = :DonemID', { DonemID });
            }

            const disgorevler = await disgorevlerquery.getMany();

            return { izinler, disgorevler };
        } catch (error) {
            throw error;
        }
    }

    async getPersonel(IliskiID: number, PersonelID: number, query: any) {
        if (!IliskiID || !PersonelID) {
            throw new BadRequestException('İliski ID ve Personel ID gereklidir');
        }
        try {
            let data = null;
            const queryBuilder = this.dataSource
                .getRepository(Personel).createQueryBuilder('personel')
                .where('personel.IsDeleted != :IsDeleted', { IsDeleted: true })
                .leftJoinAndSelect('personel.Kullanici', 'Kullanici')
                .leftJoinAndSelect('personel.Grup', 'Grup')

            if (query.iliskiId && query.tip && isNumber(parseInt(query.iliskiId)) && isNumber(parseInt(query.tip))) {
                queryBuilder.andWhere('personel.IliskiID = :IliskiID', { IliskiID: parseInt(query.iliskiId) })
                queryBuilder.andWhere('personel.KullaniciID = :KullaniciID', { KullaniciID: PersonelID })
                queryBuilder.andWhere('personel.Tip = :Tip', { Tip: isNumber(parseInt(query.tip)) })
            } else {
                queryBuilder.andWhere('personel.IliskiID = :IliskiID', { IliskiID })
                queryBuilder.andWhere('personel.PersonelID = :PersonelID', { PersonelID })
            }

            const personel = await queryBuilder.getOne();


            if (!personel) {
                throw new BadRequestException('Personel bulunamadı');
            }
            if (personel.KullaniciID) {
                const sonLoginKaydi = await this.dataSource.getRepository(LoginKayitlari).findOne({
                    where: { KullaniciId: personel.KullaniciID, BasariliMi: true },
                    order: { id: 'DESC' } // veya LoginZamani
                });
                data = { ...personel, SonLoginKaydi: sonLoginKaydi }
            } else {
                data = { ...personel, SonLoginKaydi: {} }
            }


            return data;
        } catch (error) {
            throw error;
        }
    }

    async personellerIzinBilgisi(IliskiID: number, DonemID: number) {
        if (!IliskiID || !DonemID) {
            throw new BadRequestException('Iliski ID ve Donem ID gereklidir');
        }
        try {
            // Önce tüm aktif personelleri getir
            const queryBuilder = this.dataSource.getRepository(Personel)
                .createQueryBuilder('personel')
                .leftJoinAndSelect('personel.IzinTalepleri', 'IzinTalepleri',
                    'IzinTalepleri.DonemID = :DonemID', { DonemID }) // Sadece ilgili dönemin izinlerini getir
                .leftJoinAndSelect('IzinTalepleri.IzinSureleri', 'IzinSureleri')
                .leftJoinAndSelect('IzinTalepleri.IzinTuru', 'IzinTuru')
                .where('personel.IliskiID = :IliskiID', { IliskiID })
                .andWhere('personel.IsDeleted = :isDeleted', { isDeleted: false });

            const results = await queryBuilder.getMany();

            // Her personel için izin günlerini hesapla
            const enrichedResults = results.map((personel) => {
                let gunsayisi = 0;

                // Eğer izin talepleri varsa hesapla
                if (personel.IzinTalepleri) {
                    personel.IzinTalepleri.forEach(talep => {
                        if (talep.IzinSureleri) {
                            gunsayisi += talep.IzinSureleri.length;
                        }
                    });
                }

                return {
                    ...personel,
                    IzinliGunSayisi: gunsayisi
                };
            });

            return enrichedResults;
        } catch (error) {
            console.error('Personel izin bilgisi getirme hatası:', error);
            throw new BadRequestException(
                'Personel izin bilgileri alınırken bir hata oluştu'
            );
        }
    }


    async getPersoneller(IliskiID: number) {
        if (!IliskiID) {
            throw new BadRequestException('Iliski ID gereklidir');
        }
        try {
            const personeller = await this.dataSource
                .getRepository(Personel)
                .find({ where: { IsDeleted: false, IliskiID: IliskiID } });

            return personeller;
        } catch (error) {
            throw new BadRequestException('Veriler çekilirken bir hata oluştu');
        }
    }


    async getPersonellerQuery(userId: number, query: any, IliskiID: number) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'PersonelID';
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
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        const queryBuilder = this.dataSource.getRepository(Personel).createQueryBuilder('personel')
            .where('personel.IliskiID = :id', { id: IliskiID })
            .andWhere('personel.Tip = :Tip', { Tip: user.KullaniciTipi === 3 ? 3 : 1 })
            .leftJoinAndSelect('personel.Kullanici', 'Kullanici')
            .leftJoinAndSelect('personel.Grup', 'Grup');


        if (user.KullaniciTipi === 1) {
            queryBuilder.leftJoinAndMapOne('personel.Firma', Firma, 'Firma', 'Firma.FirmaID = personel.IliskiID');
        } else if (user.KullaniciTipi === 3) {
            queryBuilder.leftJoinAndMapOne('personel.Teknokent', Teknokentler, 'Teknokent', 'Teknokent.TeknokentID = personel.IliskiID');
        }

        if (query['search']) {

            const searchTerm = `%${query['search']}%`;
            queryBuilder.andWhere(new Brackets(qb => {
                qb.where('personel.AdSoyad LIKE :searchTerm')
                    .orWhere('Kullanici.Email LIKE :searchTerm');
            }), { searchTerm });
        }

        // Belirli alanlara göre filtreleme
        Object.keys(filter).forEach((key) => {
            if (key !== 'query') {
                const validFilterFields = {
                    AdSoyad: 'personel.AdSoyad',
                    // başka filtre alanları eklenebilir
                };

                if (validFilterFields[key]) {
                    queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
                }
            }
        });


        const allowedSortFields = ['AdSoyad', 'PersonelID', 'TCNo',];
        if (!allowedSortFields.includes(sort)) {
            throw new BadRequestException(`Geçersiz sıralama değeri: ${sort}`);
        }
        // Sıralama işlemi
        if (sort) {
            queryBuilder.orderBy(`personel.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        }

        queryBuilder.skip((page - 1) * limit).take(limit);

        const [personel, total] = await queryBuilder.getManyAndCount();
        return {
            data: personel,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }


    async create(userId: number, data: CreatePersonelDto) {
        if (!userId) {
            throw new BadRequestException(`Kullanıcı ID gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }
        let netMaas = null;
        if ((data.NetMaas.length > 0 && data.NetMaas !== '0') || user.KullaniciTipi === 1) {
            netMaas = parseFloat(data.NetMaas);

            if (isNaN(netMaas) || netMaas < 1) {
                throw new BadRequestException("Geçerli bir net maaş tutarı girin (0'dan büyük bir sayı).");
            }
        }


        function formatTime(timeString: string): string {
            const [hours, minutes] = timeString.split(':');
            return `${hours}:${minutes}:00`; // Saniyeyi sıfır olarak ekleyelim
        }

        try {

            const personel = await this.personelRepository.save({
                AdSoyad: data.AdSoyad,
                TCNo: String(data.TCNo).trim(),
                IliskiID: data.IliskiID,
                BilisimPersoneli: data.BilisimPersoneli,
                MesaiBaslangic: data.MesaiBaslangic ? formatTime(data.MesaiBaslangic) : null,
                MesaiBitis: data.MesaiBitis ? formatTime(data.MesaiBitis) : null,
                IseGirisTarihi: data.IseGirisTarihi ? new Date(data.IseGirisTarihi) : null,
                IstenCikisTarihi: data.IstenCikisTarihi ? new Date(data.IstenCikisTarihi) : null,
                NetMaas: netMaas,
                Tip: user.KullaniciTipi === 3 ? 3 : 1
            });

            const queryBuilder = this.personelRepository.createQueryBuilder('personel')
                .where('personel.PersonelID = :PersonelID', { PersonelID: personel.PersonelID })
                .andWhere('personel.Tip = :Tip', { Tip: user.KullaniciTipi === 3 ? 3 : 1 });
            if (user.KullaniciTipi === 1) {
                queryBuilder
                    .leftJoinAndMapOne('personel.Firma', Firma, 'Firma', 'Firma.FirmaID = personel.IliskiID');
            } else if (user.KullaniciTipi === 3) {
                queryBuilder
                    .leftJoinAndMapOne('personel.Teknokent', Teknokentler, 'Teknokent', 'Teknokent.TeknokentID = personel.IliskiID');
            }
            return await queryBuilder.getOne();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'personel oluşturma hatası',
            );
        }
    }

    async update(userId: number, data: UpdatePersonelDto) {


        if (!userId) {
            throw new BadRequestException(`Kullanıcı ID gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        let netMaas = null;
        if ((data.NetMaas.length > 0 && data.NetMaas !== '0') || user.KullaniciTipi === 1) {
            netMaas = parseFloat(data.NetMaas);

            if (isNaN(netMaas) || netMaas < 1) {
                throw new BadRequestException("Geçerli bir net maaş tutarı girin (0'dan büyük bir sayı).");
            }
        }

        function formatTime(timeString: string): string {
            const [hours, minutes] = timeString.split(':');
            return `${hours}:${minutes}:00`; // Saniyeyi sıfır olarak ekleyelim
        }

        try {

            const personel = await this.personelRepository.findOne({ where: { PersonelID: data.PersonelID } });

            if (!personel) {
                throw new BadRequestException(`personel bulunamadı`);
            }
            personel.AdSoyad = data.AdSoyad;
            personel.TCNo = String(data.TCNo).trim()
            personel.IliskiID = data.IliskiID;
            personel.Tip = user.KullaniciTipi === 3 ? 3 : 1;
            personel.KullaniciID = data.KullaniciID;
            personel.BilisimPersoneli = data.BilisimPersoneli;
            personel.MesaiBaslangic = data.MesaiBaslangic ? formatTime(data.MesaiBaslangic) : null;
            personel.MesaiBitis = data.MesaiBitis ? formatTime(data.MesaiBitis) : null;
            personel.IseGirisTarihi = data.IseGirisTarihi ? new Date(data.IseGirisTarihi) : null;
            personel.IstenCikisTarihi = data.IstenCikisTarihi ? new Date(data.IstenCikisTarihi) : null;
            personel.NetMaas = netMaas;

            await this.personelRepository.save(personel);
            const queryBuilder = this.personelRepository.createQueryBuilder('personel')
                .where('personel.PersonelID = :PersonelID', { PersonelID: personel.PersonelID })
                .andWhere('personel.Tip = :Tip', { Tip: user.KullaniciTipi === 3 ? 3 : 1 });
            if (user.KullaniciTipi === 1) {
                queryBuilder.leftJoinAndMapOne('personel.Firma', Firma, 'Firma', 'Firma.FirmaID = personel.IliskiID');
            } else if (user.KullaniciTipi === 3) {
                queryBuilder.leftJoinAndMapOne('personel.Teknokent', Teknokentler, 'Teknokent', 'Teknokent.TeknokentID = personel.IliskiID');
            }

            return await queryBuilder.getOne();
        } catch (error) {
            console.log(error)
            throw new BadRequestException(
                error.message || 'personel düzenleme hatası',
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
            throw new BadRequestException(`Kullanıcı ID gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }




        try {
            const personel = await this.personelRepository.findOne({ where: { PersonelID: data.itemId } });
            if (personel) {
                personel.IsDeleted = true;
                await this.personelRepository.save(personel);

                const queryBuilder = this.personelRepository.createQueryBuilder('personel')
                    .where('personel.PersonelID = :PersonelID', { PersonelID: data.itemId })
                    .andWhere('personel.Tip = :Tip', { Tip: user.KullaniciTipi === 3 ? 3 : 1 });
                if (user.KullaniciTipi === 1) {
                    queryBuilder
                        .leftJoinAndMapOne('personel.Firma', Firma, 'Firma', 'Firma.FirmaID = personel.IliskiID');
                } else if (user.KullaniciTipi === 3) {
                    queryBuilder
                        .leftJoinAndMapOne('personel.Teknokent', Teknokentler, 'Teknokent', 'Teknokent.TeknokentID = personel.IliskiID');
                }
                return await queryBuilder.getOne();
            } else {
                return {
                    status: 404,
                    message: 'personel bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'personel silme hatası',
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
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }


        try {
            // Silinmiş personel'i bul
            const personel = await this.personelRepository
                .createQueryBuilder('personel')
                .where('personel.PersonelID = :id', { id: data.itemId })
                .getOne();

            if (personel) {
                // Template'i geri yükle
                personel.IsDeleted = false;

                await this.personelRepository.save(personel);
                const queryBuilder = this.personelRepository.createQueryBuilder('personel')
                    .where('personel.PersonelID = :PersonelID', { PersonelID: data.itemId })
                    .andWhere('personel.Tip = :Tip', { Tip: user.KullaniciTipi === 3 ? 3 : 1 });
                if (user.KullaniciTipi === 1) {
                    queryBuilder
                        .leftJoinAndMapOne('personel.Firma', Firma, 'Firma', 'Firma.FirmaID = personel.IliskiID');
                } else if (user.KullaniciTipi === 3) {
                    queryBuilder
                        .leftJoinAndMapOne('personel.Teknokent', Teknokentler, 'Teknokent', 'Teknokent.TeknokentID = personel.IliskiID');
                }
                return await queryBuilder.getOne();
            } else {
                return {
                    status: 404,
                    message: 'personel bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'personel geri getirme hatası'
            );
        }
    }







    async iliskiUpdate(userId: number, data: UpdateIliskiDto) {
        if (!userId) throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        if (!data.KullaniciID || !data.IliskiID || !data.GrupID || !data.PersonelID) {
            throw new BadRequestException('Geçersiz kullanıcı, grup veya ilişki bilgisi');
        }
        const user = await this.dataSource.getRepository(Kullanicilar).findOne({ where: { id: userId } });
        if (!user) throw new BadRequestException(`Kullanıcı kimliği gereklidir`);

        const userRole = await this.dataSource.getRepository(Personel).findOne({ where: { KullaniciID: userId, IliskiID: data.IliskiID, Tip: user.KullaniciTipi === 3 ? 3 : 1 } });
        if (!userRole || userRole.Rol !== 'owner') throw new BadRequestException(`Bu işlem için yetkiniz yok`);

        const idsorgu = await this.dataSource.getRepository(Kullanicilar).findOne({ where: { id: data.KullaniciID } });
        if (!idsorgu) throw new BadRequestException(`Kullanıcı bulunamadı`);

        const userIliski = await this.dataSource.getRepository(Personel).findOne({
            where: { IliskiID: data.IliskiID, KullaniciID: data.KullaniciID, Tip: user.KullaniciTipi === 3 ? 3 : 1 }
        });
        if (!userIliski) throw new BadRequestException(`Bu ilişkiye ait kullanıcı bulunamadı`);

        if (!userIliski || userIliski.Rol === 'owner') throw new BadRequestException(`Owner yetkisi olan kullanıcılar üzerinde güncelleme işlemi yapılamaz`);

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Kullanıcı rolünü güncelle
            await queryRunner.manager.getRepository(Personel).update({ PersonelID: userIliski.PersonelID }, { GrupID: data.GrupID });

            await queryRunner.commitTransaction();

            const queryBuilder = this.personelRepository.createQueryBuilder('personel')
                .leftJoinAndSelect('personel.Kullanici', 'Kullanici')
                .leftJoinAndSelect('personel.Grup', 'Grup')
                .where('personel.PersonelID = :id', { id: userIliski.PersonelID })
            if (user.KullaniciTipi === 1) {
                queryBuilder
                    .leftJoinAndSelect('Firma', 'Firma', 'Firma.FirmaID = personel.IliskiID');
            } else if (user.KullaniciTipi === 3) {
                queryBuilder
                    .leftJoinAndSelect('Teknokentler', 'Teknokent', 'Teknokent.TeknokentID = personel.IliskiID');
            }
            return await queryBuilder.getOne();
        } catch (error) {
            if (queryRunner.isTransactionActive) {
                await queryRunner.rollbackTransaction();
            }
            throw new BadRequestException(error.message || 'İlişkili kullanici güncelleme hatası');
        } finally {
            await queryRunner.release();
        }
    }



    async iliskiDelete(userId: number, data: any) {
        if (!userId) throw new BadRequestException(`Kullanıcı kimliği gereklidir`);

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({ where: { id: userId } });
        if (!user) throw new BadRequestException(`Kullanıcı kimliği gereklidir`);

        const userRole = await this.dataSource.getRepository(Personel).findOne({ where: { KullaniciID: userId, Tip: user.KullaniciTipi === 3 ? 3 : 1 } });
        if (!userRole || userRole.Rol !== 'owner') throw new BadRequestException(`Bu işlem için yetkiniz yok`);

        if (!data || !data.itemId) {
            throw new BadRequestException('Geçersiz kullanıcı veya ilişki bilgisi');
        }



        const userIliski = await this.dataSource.getRepository(Personel).findOne({
            where: { PersonelID: data.itemId, Tip: user.KullaniciTipi === 3 ? 3 : 1 }
        });
        if (!userIliski) throw new BadRequestException(`Bu ilişkiye ait kullanıcı bulunamadı`);
        if (!userIliski || userIliski.Rol === 'owner') throw new BadRequestException(`Owner yetkisi olan kullanıcılar üzerinde silme işlemi yapılamaz`);

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {

            // Kullanıcıyı sil
            await queryRunner.manager.getRepository(Personel).update(
                { PersonelID: userIliski.PersonelID },
                { GrupID: null, KullaniciID: null, Rol: null });

            await queryRunner.commitTransaction();
            return {
                message: 'Kullanıcı ilişkisi başarıyla silindi',
            };
        } catch (error) {
            if (queryRunner.isTransactionActive) {
                await queryRunner.rollbackTransaction();
            }
            throw new BadRequestException(error.message || 'Kullanıcı ilişkisi silme hatası');
        } finally {
            await queryRunner.release();
        }
    }


    async getIliskiKullanicilari(userId: number) {
        if (!userId) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }

        try {
            /* const aktifAbonelikler = await this.dataSource.getRepository(FirmaAbonelikleri)
                .createQueryBuilder('a')
                .where('a.BitisTarihi > :today', { today: new Date() })
                .getMany(); */
            // Kullanıcı firmalarını getir
            const queryBuilder = this.dataSource.getRepository(Personel)
                .createQueryBuilder('kf')
                .leftJoinAndSelect('kf.Grup', 'Grup')
                .where('kf.KullaniciID = :KullaniciID', { KullaniciID: userId })
                .andWhere('kf.Tip = :Tip', { Tip: user.KullaniciTipi === 3 ? 3 : 1 });


            let kullaniciIliskileri = [];
            let kullaniciIliskisi = null;

            if (user.KullaniciTipi === 3) {
                queryBuilder.leftJoinAndSelect('Teknokentler', 'Teknokent', 'Teknokent.TeknokentID = kf.IliskiID');
                queryBuilder.andWhere('Teknokent.IsDeleted != :IsDeleted', { IsDeleted: true })
                kullaniciIliskisi = await queryBuilder.getRawOne();
            } else {
                queryBuilder.leftJoinAndSelect('Firma', 'Firma', 'Firma.FirmaID = kf.IliskiID')
                queryBuilder.andWhere('Firma.IsDeleted != :IsDeleted', { IsDeleted: true })
                kullaniciIliskileri = await queryBuilder.getRawMany();
            }

            let grup = {};
            // Her bir kullanici kaydı için Gurup ilişkisini kontrol edip GrupYetkileri'ni ekliyoruz
            if (kullaniciIliskileri.length > 0 && user.KullaniciTipi !== 3) {
                for (const kf of kullaniciIliskileri) {
                    /* const aktifAbonelikVarMi = aktifAbonelikler.some(
                        (a) => a.FirmaID === kf.Firma?.FirmaID
                    );
    
                    (kf as any).AbonelikAktif = aktifAbonelikVarMi; */

                    // Sadece abonelik aktifse yetkileri getir
                    if (kf.Grup) {
                        const grupYetkileri = await this.dataSource.getRepository(GrupYetkileri)
                            .createQueryBuilder('yetkiler')
                            .where('yetkiler.GrupID = :GrupID', { GrupID: kf.Grup.GrupID })
                            .getMany();

                        grup = {
                            GrupID: kf.Grup_GrupID,
                            IliskiID: kf.Grup_IliskiID,
                            GrupAdi: kf.Grup_GrupAdi,
                            Tip: kf.Grup_Tip,
                            Yetkiler: grupYetkileri ? grupYetkileri.map((g) => g.Yetki) : []
                        }
                    }
                }
                return kullaniciIliskileri.map(ky => ({
                    id: ky.kf_PersonelID,
                    FirmaID: ky.kf_IliskiID,
                    Firma: {
                        FirmaID: ky.Firma_FirmaID,
                        FirmaAdi: ky.Firma_FirmaAdi,
                        PortalLinki: ky.Firma_PortalLinki,
                        PortalKullaniciAdi: ky.Firma_PortalKullaniciAdi,
                        MesaiBaslangic: ky.Firma_MesaiBaslangic,
                        MesaiBitis: ky.Firma_MesaiBitis,
                        CalismaGunleri: ky.Firma_CalismaGunleri,
                        IsDeleted: ky.Firma_IsDeleted
                    },
                    Rol: ky.kf_Rol,
                    AbonelikAktif: ky.AbonelikAktif ?? true,
                    Grup: grup
                }));
            }

            if (kullaniciIliskisi && user.KullaniciTipi === 3) {
                if (kullaniciIliskisi.Grup_GrupID) {
                    const grupYetkileri = await this.dataSource.getRepository(GrupYetkileri)
                        .createQueryBuilder('yetkiler')
                        .where('yetkiler.GrupID = :GrupID', { GrupID: kullaniciIliskisi.Grup_GrupID })
                        .getMany();

                    grup = {
                        GrupID: kullaniciIliskisi.Grup_GrupID,
                        IliskiID: kullaniciIliskisi.Grup_IliskiID,
                        GrupAdi: kullaniciIliskisi.Grup_GrupAdi,
                        Tip: kullaniciIliskisi.Grup_Tip,
                        Yetkiler: grupYetkileri ? grupYetkileri.map((g) => g.Yetki) : []
                    }
                }
                return {
                    id: kullaniciIliskisi.kf_PersonelID,
                    TeknokentID: kullaniciIliskisi.kf_IliskiID,
                    Teknokent: {
                        TeknokentID: kullaniciIliskisi.Teknokent_TeknokentID,
                        TeknokentAdi: kullaniciIliskisi.Teknokent_TeknokentAdi,
                        Sehir: kullaniciIliskisi.Teknokent_Sehir,
                        Ilce: kullaniciIliskisi.Teknokent_Ilce,
                        Telefon: kullaniciIliskisi.Teknokent_Telefon,
                        Eposta: kullaniciIliskisi.Teknokent_Eposta,
                        WebSitesi: kullaniciIliskisi.Teknokent_WebSitesi,
                        Adres: kullaniciIliskisi.Teknokent_Adres,
                        IsDeleted: kullaniciIliskisi.Teknokent_IsDeleted,
                    },
                    Rol: kullaniciIliskisi.kf_Rol,
                    Grup: grup
                };
            }

        } catch (error) {
            throw new BadRequestException(error.message || 'Kullanıcı ilişkileri getirme hatası');
        }
    }



    async iliskiKullanicilariQuery(userId: number, query: any, iliskiId: number) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;

        if (isNaN(page) || isNaN(limit)) {
            throw new BadRequestException('Sayfa ve sınır numaraları geçerli olmalı');
        }

        if (!userId) {
            throw new BadRequestException('Kullanıcı kimliği gereklidir');
        }

        // Kullanıcı doğrulama
        const user = await this.dataSource.getRepository(Kullanicilar).findOne({ where: { id: userId } });
        if (!user) {
            throw new BadRequestException('Kullanıcı kimliği geçersiz');
        }

        // Kullanıcının firmaya erişim yetkisi kontrolü
        const firmaYetki = await this.dataSource.getRepository(Personel).findOne({
            where: { IliskiID: iliskiId, KullaniciID: userId },
        });
        if (!firmaYetki) {
            throw new BadRequestException('Kullanıcının erişim yetkisi yok');
        }

        try {
            // Firma kullanıcılarını getir
            const queryBuilder = this.dataSource.getRepository(Personel)
                .createQueryBuilder('prs')
                .leftJoinAndSelect('prs.Kullanici', 'Kullanici')
                .leftJoinAndSelect('prs.Grup', 'Grup')
                .where('prs.IliskiID = :IliskiID', { IliskiID: iliskiId })
                .andWhere('prs.Tip = :Tip', { Tip: user.KullaniciTipi === 3 ? 3 : 1 })
                .andWhere('prs.KullaniciID IS NOT NULL')
                .andWhere('prs.IsDeleted != :IsDeleted', { IsDeleted: true });


            if (user.KullaniciTipi === 3) {
                queryBuilder.leftJoinAndMapOne(
                    'prs.Teknokent',
                    Teknokentler,
                    'Teknokent',
                    'Teknokent.TeknokentID = prs.IliskiID'
                );
                queryBuilder.andWhere('Teknokent.IsDeleted != :IsDeleted', { IsDeleted: true });
            } else {
                queryBuilder.leftJoinAndMapOne(
                    'prs.Firma',
                    Firma,
                    'Firma',
                    'Firma.FirmaID = prs.IliskiID'
                );
                queryBuilder.andWhere('Firma.IsDeleted != :IsDeleted', { IsDeleted: true });
            }


            const [kullaniciIliskileri, total] = await queryBuilder.getManyAndCount();

            // Kullanıcı ve firma bazlı yetkileri getir
            const kullaniciIDs = kullaniciIliskileri.map(kf => kf.KullaniciID);
            if (kullaniciIDs.length > 0) {
                const yetkiler = await this.dataSource.getRepository(GrupYetkileri)
                    .createQueryBuilder('yetkiler')
                    .leftJoin('yetkiler.Grup', 'grup')
                    .leftJoin('grup.Kullanicilar', 'kullanicilar')
                    .select('kullanicilar.KullaniciID', 'KullaniciID')
                    .addSelect('yetkiler.IliskiID', 'IliskiID')
                    .addSelect("STRING_AGG(yetkiler.Yetki, ', ')", 'Yetkiler')
                    .where('kullanicilar.KullaniciID IN (:...kullaniciIDs)', { kullaniciIDs })
                    .andWhere('yetkiler.IliskiID = :IliskiID', { IliskiID: iliskiId })
                    .groupBy('kullanicilar.KullaniciID, yetkiler.IliskiID')
                    .getRawMany();

                // Yetkileri KullaniciID ve FirmaID bazında map'le
                const yetkilerMap = new Map();
                yetkiler.forEach(yetki => {
                    const key = `${yetki.KullaniciID}-${yetki.IliskiID}`;
                    yetkilerMap.set(key, yetki.Yetkiler.split(', '));
                });

                // Kullanıcı firmalarına yetkileri ekle
                const data = kullaniciIliskileri.map(kf => {
                    const ortakAlanlar = {
                        PersonelID: kf.PersonelID,
                        IliskiID: kf.IliskiID,
                        Rol: kf.Rol,
                        Grup: kf.Grup,
                        KullaniciID: kf.KullaniciID,
                        Kullanici: kf.Kullanici,
                        IsDeleted: kf.IsDeleted,
                        Yetkiler: yetkilerMap.get(`${kf.KullaniciID}-${kf.IliskiID}`) || [],
                    };

                    if (kf.Tip === 3) {
                        return {
                            ...ortakAlanlar,
                            Teknokent: kf.Teknokent
                        };
                    } else {
                        return {
                            ...ortakAlanlar,
                            Firma: kf.Firma
                        };
                    }
                });


                return {
                    data,
                    total,
                    page,
                    lastPage: Math.ceil(total / limit),
                };
            } else {
                // Eğer kullanıcı yoksa boş bir sonuç döndür
                return {
                    data: [],
                    total: 0,
                    page,
                    lastPage: 0,
                };
            }
        } catch (error) {
            throw new BadRequestException(error.message || 'Firma kullanıcılarını getirme hatası');
        }
    }
}
