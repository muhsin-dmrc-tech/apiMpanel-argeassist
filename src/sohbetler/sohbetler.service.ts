import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { DataSource, IsNull, LessThanOrEqual, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AppGateway } from 'src/websocket.gateway';
import { Sohbetler } from './entities/sohbetler.entity';
import { SohbetMesajlari } from './entities/sohbet-mesajlari.entity';
import { SohbetKullanicilari } from './entities/sohbet-kullanicilari.entity';
import { Projeler } from 'src/projeler/entities/projeler.entity';
import { Firma } from 'src/firmalar/entities/firma.entity';
import { Teknokentler } from 'src/teknokentler/entities/teknokentler.entity';
import { randomInt } from 'crypto';
import { SohbetTeknokentler } from './entities/sohbet-teknokentler.entity';
import { SohbetFirmalar } from './entities/sohbet-firmalar.entity';
import { SohbetDosyalar } from './entities/sohbet-dosyalar.entity';
import * as fs from 'fs';
import { Cron } from '@nestjs/schedule';
import { Personel } from 'src/personel/entities/personel.entity';
import { FirmaBilgileri } from 'src/firmalar/entities/firma-bilgileri.entity';
import { BildirimlerService } from 'src/bildirimler/bildirimler.service';

@Injectable()
export class SohbetlerService {
    constructor(
        @InjectRepository(Sohbetler)
        private readonly sohbetlerRepository: Repository<Sohbetler>,
        private readonly dataSource: DataSource,
        private readonly appGateway: AppGateway,
        private readonly bildirimler: BildirimlerService,
    ) { }




    async getSonSohbetler(userId: number, query: any) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const offset = (page - 1) * limit;

        if (!userId || isNaN(page) || isNaN(limit)) {
            throw new Error('Geçersiz kullanıcı ID, sayfa veya limit');
        }

        try {
            // Önce her sohbet için son mesajları alalım
            const sonMesajlar = await this.dataSource
                .getRepository(SohbetMesajlari)
                .createQueryBuilder('sm1')
                .select('sm1.SohbetID', 'SohbetID')
                .addSelect('sm1.MesajID', 'MesajID')
                .addSelect('sm1.MesajIcerigi', 'MesajIcerigi')
                .addSelect('sm1.GonderimTarihi', 'GonderimTarihi')
                .addSelect('sm1.GonderenKullaniciID', 'GonderenKullaniciID')
                .leftJoinAndSelect('sm1.GonderenKullanici', 'GonderenKullanici')
                .leftJoinAndSelect('sm1.Dosyalar', 'Dosyalar')
                .innerJoin(
                    qb => qb
                        .select('SohbetID')
                        .addSelect('MAX(GonderimTarihi)', 'MaxTarih')
                        .from(SohbetMesajlari, 'sm2')
                        .groupBy('SohbetID'),
                    'maxDates',
                    'sm1.SohbetID = maxDates.SohbetID AND sm1.GonderimTarihi = maxDates.MaxTarih'
                )
                .getRawMany();


            // Sohbet ID'lerini alalım
            const sohbetIDs = sonMesajlar.map(sm => sm.SohbetID);

            // Ana sohbet sorgusunu çalıştıralım
            const queryBuilder = this.dataSource
                .getRepository(Sohbetler)
                .createQueryBuilder('s')
                .innerJoin('s.Kullanicilar', 'sk', 'sk.KullaniciID = :userId AND sk.AyrildiMi = :ayrildiMi', {
                    userId,
                    ayrildiMi: false
                })
                .select([
                    's.SohbetID',
                    's.GrupAdi',
                    's.SohbetTipi',
                    's.OlusturanKullaniciID',
                    's.OlusturmaTarihi',
                    's.SonDuzenlenmeTarihi'
                ])
                .leftJoinAndSelect('s.SohbetTeknokentler', 'SohbetTeknokentler')
                .leftJoinAndSelect('s.SohbetFirmalar', 'SohbetFirmalar');

            // Eğer sohbet ID'leri varsa filtrele
            if (sohbetIDs.length > 0) {
                queryBuilder.where('s.SohbetID IN (:...sohbetIDs)', { sohbetIDs });
            }

            const sohbetler = await queryBuilder
                .orderBy('s.OlusturmaTarihi', 'DESC')
                .offset(offset)
                .limit(limit)
                .getMany();

            // Son mesajları sohbetlerle eşleştir
            const sonMesajMap = new Map();
            for (const mesaj of sonMesajlar) {
                sonMesajMap.set(mesaj.SohbetID, mesaj);
            }

            // Kullanıcı bilgilerini al
            const mesajKullaniciIDs = sonMesajlar.map(sm => sm.GonderenKullaniciID).filter(id => id);
            let mesajKullanicilari = [];
            if (mesajKullaniciIDs.length > 0) {
                mesajKullanicilari = await this.dataSource
                    .getRepository(Kullanicilar)
                    .createQueryBuilder('k')
                    .where('k.id IN (:...ids)', { ids: mesajKullaniciIDs })
                    .getMany();
            }
            const kullaniciMap = new Map(mesajKullanicilari.map(k => [k.id, k]));

            // Sohbet kullanıcılarını al
            const actualSohbetIDs = sohbetler.map(s => s.SohbetID);
            let sohbetKullanicilari = [];
            if (actualSohbetIDs.length > 0) {
                sohbetKullanicilari = await this.dataSource
                    .getRepository(SohbetKullanicilari)
                    .createQueryBuilder('sk')
                    .innerJoinAndSelect('sk.Kullanici', 'k')
                    .where('sk.SohbetID IN (:...ids)', { ids: actualSohbetIDs })
                    .getMany();
            }

            // Okunmamış mesaj sayısı
            let unreadCounts = [];
            if (actualSohbetIDs.length > 0) {
                unreadCounts = await this.dataSource
                    .getRepository(SohbetMesajlari)
                    .createQueryBuilder('m')
                    .select('m.SohbetID', 'SohbetID')
                    .addSelect('COUNT(*)', 'count')
                    .leftJoin('m.OkunmaBilgileri', 'ob')
                    .where('m.SohbetID IN (:...ids)', { ids: actualSohbetIDs })
                    .andWhere('m.GonderenKullaniciID != :userId', { userId })
                    .andWhere('m.SilindiMi != :silindimi', { silindimi: true })
                    .andWhere(qb => {
                        const subQuery = qb
                            .subQuery()
                            .select('1')
                            .from('SohbetOkunmaBilgileri', 'sob')
                            .where('sob.MesajID = m.MesajID')
                            .andWhere('sob.KullaniciID = :userId', { userId })
                            .getQuery();
                        return 'NOT EXISTS (' + subQuery + ')';
                    })
                    .groupBy('m.SohbetID')
                    .getRawMany();
            }

            const unreadMap = new Map(unreadCounts.map(row => [row.SohbetID, Number(row.count)]));

            // Sonuçları formatla
            const formatted = sohbetler.map(s => {
                const id = s.SohbetID;
                const users = sohbetKullanicilari.filter(sk => sk.SohbetID === id);
                const sonMesaj = sonMesajMap.get(id);
                const mesajKullanici = sonMesaj ? kullaniciMap.get(sonMesaj.GonderenKullaniciID) : null;

                return {
                    SohbetID: id,
                    SohbetTeknokentler: s.SohbetTeknokentler,
                    SohbetFirmalar: s.SohbetFirmalar,
                    GrupAdi: s.GrupAdi,
                    OlusturanKullaniciID: s.OlusturanKullaniciID,
                    OlusturmaTarihi: s.OlusturmaTarihi,
                    SonDuzenlenmeTarihi: s.SonDuzenlenmeTarihi,
                    OkunmayanMesajSayisi: unreadMap.get(id) || 0,
                    Kullanicilar: users.map(u => ({
                        Kullanici: {
                            id: u.Kullanici.id,
                            AdSoyad: u.Kullanici.AdSoyad,
                            Email: u.Kullanici.Email,
                            Telefon: u.Kullanici.Telefon,
                            ProfilResmi: u.Kullanici.ProfilResmi,
                            SonAktiflik: u.Kullanici.updatedAt,
                            KullaniciTipi: u.Kullanici.KullaniciTipi,
                            isActive: u.Kullanici.isActive
                        }
                    })),
                    SonMesaj: sonMesaj ? {
                        MesajID: sonMesaj.MesajID,
                        MesajIcerigi: sonMesaj.MesajIcerigi,
                        Dosyalar: sonMesaj.Dosyalar,
                        GonderimTarihi: sonMesaj.GonderimTarihi,
                        DuzenlenmeTarihi: sonMesaj.DuzenlenmeTarihi,
                        SilindiMi: sonMesaj.SilindiMi,
                        GonderenKullanici: mesajKullanici ? {
                            id: mesajKullanici.id,
                            AdSoyad: mesajKullanici.AdSoyad,
                            Email: mesajKullanici.Email,
                            ProfilResmi: mesajKullanici.ProfilResmi,
                            KullaniciTipi: mesajKullanici.KullaniciTipi,
                            isActive: mesajKullanici.isActive
                        } : null
                    } : null
                };
            });

            return {
                data: formatted,
                page,
                lastPage: Math.ceil(formatted.length / limit),
                total: formatted.length,
            };
        } catch (error) {
            console.log(error)
        }
    }



    async getSohbetKisileri(userId: number) {
        if (!userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId }
        });
        if (!user) {
            throw new BadRequestException('Kullanıcı bulunamadı');
        }

        const gruplar = [];

        // Kullanıcı tipi: 3 = teknokent
        const isTeknokentUser = user.KullaniciTipi === 3;

        try {
            if (isTeknokentUser) {
                const teknokentYetkisi = await this.dataSource.getRepository(Personel)
                    .createQueryBuilder('tk')
                    .where('tk.KullaniciID IS NOT NULL')
                    .andWhere('tk.KullaniciID = :userId', { userId })
                    .andWhere('tk.Tip = 3')
                    .andWhere('tk.IsDeleted != 1')
                    .leftJoinAndMapOne('tk.Teknokent', Teknokentler, 'Teknokent',
                        'Teknokent.TeknokentID = tk.IliskiID AND Teknokent.IsDeleted != 1')
                    .getOne();


                if (!teknokentYetkisi || !teknokentYetkisi?.Teknokent) return [];

                // 1. Teknokent grubunu ekle
                const teknokentKullanicilari = await this.dataSource.getRepository(Personel)
                    .createQueryBuilder('tk')
                    .where('tk.KullaniciID IS NOT NULL')
                    .andWhere('tk.KullaniciID != :userId', { userId })
                    .andWhere('tk.IliskiID = :tid', { tid: teknokentYetkisi.IliskiID })
                    .andWhere('tk.Tip = 3')
                    .leftJoinAndSelect('tk.Kullanici', 'k')
                    .getMany();


                gruplar.push({
                    grupTipi: 'teknokent',
                    grupID: teknokentYetkisi?.IliskiID,
                    grupAdi: teknokentYetkisi?.Teknokent?.TeknokentAdi,
                    kullanicilar: teknokentKullanicilari.map(tk => ({
                        id: tk.Kullanici.id,
                        adSoyad: tk.Kullanici.AdSoyad,
                        email: tk.Kullanici.Email,
                        telefon: tk.Kullanici.Telefon,
                        profilResmi: tk.Kullanici.ProfilResmi,
                        kullaniciTipi: tk.Kullanici.KullaniciTipi
                    }))
                });

                // 2. Projelerden firma kullanıcılarını topla
                let projeler = [];

                if (teknokentYetkisi.Rol === 'owner') {
                    projeler = await this.dataSource.getRepository(Projeler)
                        .createQueryBuilder('p')
                        .where('p.TeknokentID = :tid', { tid: teknokentYetkisi.IliskiID })
                        .getMany();
                } else {
                    projeler = await this.dataSource.getRepository(Projeler)
                        .createQueryBuilder('p')
                        .where('p.ProjeUzmanKullaniciID = :uid', { uid: userId })
                        .getMany();
                }

                const firmaIDs = [...new Set(projeler.map(p => p.FirmaID).filter(Boolean))];

                for (const firmaID of firmaIDs) {
                    const firma = await this.dataSource.getRepository(Firma).createQueryBuilder('firma')
                        .leftJoinAndMapOne('firma.FirmaBilgisi', FirmaBilgileri, 'firmaBilgileri', 'firma.FirmaID = firmaBilgileri.IliskiID AND firmaBilgileri.Tip = 1')
                        .where('firma.FirmaID = :firmaID', { firmaID }).getOne();

                    const kullaniciFirmalari = await this.dataSource.getRepository(Personel)
                        .createQueryBuilder('kf')
                        .where('kf.IliskiID = :firmaID', { firmaID })
                        .andWhere('kf.Tip = :Tip', { Tip: 1 })
                        .andWhere('kf.KullaniciID IS NOT NULL')
                        .leftJoinAndSelect('kf.Kullanici', 'k')
                        .getMany();

                    gruplar.push({
                        grupTipi: 'firma',
                        grupID: firmaID,
                        grupAdi: firma?.FirmaAdi || '',
                        logo: firma?.FirmaBilgisi?.Logo || '',
                        kullanicilar: kullaniciFirmalari?.map(kf => ({
                            id: kf.Kullanici.id,
                            adSoyad: kf.Kullanici.AdSoyad,
                            email: kf.Kullanici.Email,
                            telefon: kf.Kullanici.Telefon,
                            profilResmi: kf.Kullanici.ProfilResmi,
                            kullaniciTipi: kf.Kullanici.KullaniciTipi
                        }))
                    });
                }

            } else {
                // Firma kullanıcısı
                const kullaniciFirmalari = await this.dataSource.getRepository(Personel)
                    .createQueryBuilder('kf')
                    .where('kf.KullaniciID = :userId', { userId })
                    .getMany();

                const firmaIDs = [...new Set(kullaniciFirmalari.map(kf => kf.IliskiID))];

                // 1. Firma gruplarını ekle
                for (const firmaID of firmaIDs) {
                    const firma = await this.dataSource.getRepository(Firma).createQueryBuilder('firma')
                        .leftJoinAndMapOne('firma.FirmaBilgisi', FirmaBilgileri, 'firmaBilgileri', 'firma.FirmaID = firmaBilgileri.IliskiID AND firmaBilgileri.Tip = 1')
                        .where('firma.FirmaID = :firmaID', { firmaID }).getOne();

                    const kullaniciFirmalari = await this.dataSource.getRepository(Personel)
                        .createQueryBuilder('kf')
                        .where('kf.IliskiID = :firmaID', { firmaID })
                        .andWhere('kf.Tip = :Tip', { Tip: 1 })
                        .andWhere('kf.KullaniciID IS NOT NULL')
                        .leftJoinAndSelect('kf.Kullanici', 'k')
                        .getMany();

                    gruplar.push({
                        grupTipi: 'firma',
                        grupID: firmaID,
                        grupAdi: firma?.FirmaAdi || '',
                        logo: firma?.FirmaBilgisi?.Logo || '',
                        kullanicilar: kullaniciFirmalari?.map(kf => ({
                            id: kf.Kullanici.id,
                            adSoyad: kf.Kullanici.AdSoyad,
                            email: kf.Kullanici.Email,
                            telefon: kf.Kullanici.Telefon,
                            profilResmi: kf.Kullanici.ProfilResmi,
                            kullaniciTipi: kf.Kullanici.KullaniciTipi
                        }))
                    });
                }

                // 2. Bu firmaların bağlı olduğu teknokentleri bul
                const projeler = await this.dataSource.getRepository(Projeler)
                    .createQueryBuilder('p')
                    .where('p.FirmaID IN (:...firmaIDs)', { firmaIDs })
                    .getMany();

                const teknokentIDs = [...new Set(projeler.map(p => p.TeknokentID).filter(Boolean))];

                for (const teknokentID of teknokentIDs) {
                    const teknokent = await this.dataSource.getRepository(Teknokentler).createQueryBuilder('teknokent')
                        .leftJoinAndMapOne('teknokent.TeknokentBilgisi', FirmaBilgileri, 'teknokentBilgileri', 'teknokent.TeknokentID = teknokentBilgileri.IliskiID AND teknokentBilgileri.Tip = 3')
                        .where('teknokent.TeknokentID = :teknokentID', { teknokentID }).getOne();

                    const teknokentKullanicilari = await this.dataSource.getRepository(Personel)
                        .createQueryBuilder('tk')
                        .where('tk.IliskiID = :tid', { tid: teknokentID })
                        .andWhere('tk.Tip = :Tip', { Tip: 3 })
                        .andWhere('tk.KullaniciID IS NOT NULL')
                        .leftJoinAndSelect('tk.Kullanici', 'k')
                        .getMany();

                    gruplar.push({
                        grupTipi: 'teknokent',
                        grupID: teknokentID,
                        grupAdi: teknokent?.TeknokentAdi || '',
                        logo: teknokent?.TeknokentBilgisi?.Logo || '',
                        kullanicilar: teknokentKullanicilari.map(tk => ({
                            id: tk.Kullanici.id,
                            adSoyad: tk.Kullanici.AdSoyad,
                            email: tk.Kullanici.Email,
                            telefon: tk.Kullanici.Telefon,
                            profilResmi: tk.Kullanici.ProfilResmi,
                            kullaniciTipi: tk.Kullanici.KullaniciTipi
                        }))
                    });
                }
            }

            return gruplar;

        } catch (error) {
            console.error(error);
            throw new BadRequestException(error.message || 'Veriler alınırken hata oluştu');
        }
    }

    private async sohbetItem(SohbetID: number, query: any) {
        const page = parseInt(query.page) || 1;
        const limit = 50;


        const queryBuilder = this.dataSource
            .getRepository(SohbetMesajlari).createQueryBuilder('sm')
            .where('sm.SohbetID = :SohbetID', { SohbetID })
            .leftJoinAndSelect('sm.AltMesajlar', 'altMesajlar')
            .leftJoinAndSelect('sm.OkunmaBilgileri', 'OkunmaBilgileri')
            .leftJoinAndSelect('sm.Dosyalar', 'Dosyalar')
            .leftJoinAndSelect('sm.GonderenKullanici', 'mk')
            .leftJoinAndSelect('altMesajlar.GonderenKullanici', 'amk');

        queryBuilder.orderBy('sm.MesajID', 'DESC');
        queryBuilder.skip((page - 1) * limit).take(limit);

        const [mesajlar, total] = await queryBuilder.getManyAndCount();
        return {
            data: mesajlar,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }


    async getSohbetItem(userId: number, SohbetID: number, query: any) {
        if (!userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }

        // Kullanıcı varlığı kontrolü
        const user = await this.dataSource.getRepository(Kullanicilar).findOne({ where: { id: userId } });
        if (!user) {
            throw new BadRequestException('Kullanıcı bulunamadı');
        }

        try {

            const sohbet = await this.dataSource
                .getRepository(Sohbetler).createQueryBuilder('s')
                .where('s.SohbetID = :SohbetID', { SohbetID })
                .leftJoinAndSelect('s.Kullanicilar', 'kullanicilar')
                .leftJoinAndSelect('s.SohbetTeknokentler', 'SohbetTeknokentler')
                .leftJoinAndSelect('s.SohbetFirmalar', 'SohbetFirmalar')
                .leftJoinAndSelect('kullanicilar.Kullanici', 'kk')
                .getOne();

            if (sohbet) {
                const mesajlar = await this.sohbetItem(SohbetID, query);
                return { mesajlar, sohbet }
            } else {
                throw new BadRequestException('Sohbet Bulunamadı.')
            }


        } catch (error) {
            throw new BadRequestException(
                error.message || 'Veriler alınırken hata oluştu',
            );
        }
    }

    async postSohbetItem(userId: number, SohbetIDS: number[]) {
        if (!userId) {
            throw new BadRequestException('Kullanıcı ID gereklidir');
        }

        // Kullanıcı varlığı kontrolü
        const user = await this.dataSource.getRepository(Kullanicilar).findOne({ where: { id: userId } });
        if (!user) {
            throw new BadRequestException('Kullanıcı bulunamadı');
        }

        const newSohbetIds = [userId, ...SohbetIDS];

        try {
            const idsStr = newSohbetIds.join(',');

            const [sohbet] = await this.dataSource.query(`
                    SELECT s.*
                    FROM Sohbetler s
                    WHERE s.SohbetID IN (
                        SELECT sk.SohbetID
                        FROM SohbetKullanicilari sk
                        GROUP BY sk.SohbetID
                        HAVING COUNT(DISTINCT sk.KullaniciID) = ${newSohbetIds.length}
                        AND COUNT(CASE WHEN sk.KullaniciID IN (${idsStr}) THEN 1 END) = ${newSohbetIds.length}
                        AND COUNT(CASE WHEN sk.KullaniciID NOT IN (${idsStr}) THEN 1 END) = 0
                    )
                    AND (
                        s.OlusturanKullaniciID = ${userId}
                        OR EXISTS (
                            SELECT 1
                            FROM SohbetKullanicilari sk
                            WHERE sk.SohbetID = s.SohbetID
                            AND sk.KullaniciID = ${userId}
                            AND sk.AyrildiMi = 0
                        )
                    )
                `);



            let mesajlar = null;
            if (sohbet) {
                mesajlar = await this.sohbetItem(sohbet.SohbetID, { page: 1 })
            }

            return { mesajlar, sohbet };

        } catch (error) {
            throw new BadRequestException(
                error.message || 'Veriler alınırken hata oluştu',
            );
        }
    }


    async postYeniMesaj(
        userId: number,
        mesaj: string | null,
        SohbetIDS: number[],
        UstMesajID?: number,
        GrupAdi?: string,
        TeknokentIDler?: number[],
        FirmaIDler?: number[],
        SohbetID?: number,
        dosyalar?: any[]
    ) {
        if (!userId) throw new BadRequestException('Kullanıcı ID gereklidir');

        if (dosyalar.length < 1 && (!mesaj || mesaj.length < 1)) {
            throw new BadRequestException('Mesaj içeriği boş olamaz.');
        }


        const user = await this.dataSource.getRepository(Kullanicilar).findOneBy({ id: userId });
        if (!user) throw new BadRequestException('Kullanıcı bulunamadı');

        const newSohbetIds = [userId, ...SohbetIDS];
        let socketUsers = [];
        try {
            return await this.dataSource.transaction(async (manager) => {
                const idsStr = newSohbetIds.join(',');

                let sohbet = null;
                if (SohbetID && SohbetID > 0) {
                    sohbet = await this.dataSource
                        .getRepository(Sohbetler).createQueryBuilder('s')
                        .where('s.SohbetID = :SohbetID', { SohbetID })
                        .leftJoinAndSelect('s.Kullanicilar', 'kullanicilar')
                        .leftJoinAndSelect('s.SohbetTeknokentler', 'SohbetTeknokentler')
                        .leftJoinAndSelect('s.SohbetFirmalar', 'SohbetFirmalar')
                        .leftJoinAndSelect('kullanicilar.Kullanici', 'kk')
                        .getOne();


                    socketUsers = sohbet.Kullanicilar
                        .map(k => k.KullaniciID)
                        .filter(id => id !== userId);
                } else {
                    /* [sohbet] = await this.dataSource.query(`
                        SELECT s.*
                        FROM Sohbetler s
                        WHERE s.SohbetID IN (
                            SELECT sk.SohbetID
                            FROM SohbetKullanicilari sk
                            GROUP BY sk.SohbetID
                            HAVING COUNT(DISTINCT sk.KullaniciID) = ${newSohbetIds.length}
                            AND COUNT(CASE WHEN sk.KullaniciID IN (${idsStr}) THEN 1 END) = ${newSohbetIds.length}
                            AND COUNT(CASE WHEN sk.KullaniciID NOT IN (${idsStr}) THEN 1 END) = 0
                        )
                    `); */

                    [sohbet] = await this.dataSource.query(`
                            SELECT s.*
                            FROM Sohbetler s
                            WHERE s.SohbetID IN (
                                SELECT sk.SohbetID
                                FROM SohbetKullanicilari sk
                                GROUP BY sk.SohbetID
                                HAVING COUNT(DISTINCT sk.KullaniciID) = ${newSohbetIds.length}
                                AND COUNT(CASE WHEN sk.KullaniciID IN (${idsStr}) THEN 1 END) = ${newSohbetIds.length}
                                AND COUNT(CASE WHEN sk.KullaniciID NOT IN (${idsStr}) THEN 1 END) = 0
                            )
                            AND (
                                s.OlusturanKullaniciID = ${userId}
                                OR EXISTS (
                                    SELECT 1
                                    FROM SohbetKullanicilari sk
                                    WHERE sk.SohbetID = s.SohbetID
                                    AND sk.KullaniciID = ${userId}
                                    AND sk.AyrildiMi = 0
                                )
                            )
                        `);

                    socketUsers = SohbetIDS;
                }



                let sohbetID: number;

                if (sohbet) {
                    sohbetID = sohbet.SohbetID;
                } else {
                    const newChat = await manager.getRepository(Sohbetler).save({
                        OlusturanKullaniciID: userId,
                        SohbetTipi: newSohbetIds.length > 2 ? 'grup' : 'birebir',
                        GrupAdi: newSohbetIds.length > 2 ? GrupAdi ? GrupAdi : 'Yeni Grup ' + randomInt(10) : null,
                    });

                    sohbetID = newChat.SohbetID;

                    const participants = newSohbetIds.map((id) => ({
                        SohbetID: sohbetID,
                        KullaniciID: id,
                    }));

                    await manager.getRepository(SohbetKullanicilari).save(participants);

                    if (TeknokentIDler && TeknokentIDler.length > 0) {
                        const tekokentkayitlar = TeknokentIDler.map((id) => ({
                            SohbetID: sohbetID,
                            TeknokentID: id,
                        }));
                        await manager.getRepository(SohbetTeknokentler).save(tekokentkayitlar);
                    }

                    if (FirmaIDler && FirmaIDler.length > 0) {
                        const firmakayitlar = FirmaIDler.map((id) => ({
                            SohbetID: sohbetID,
                            FirmaID: id,
                        }));
                        await manager.getRepository(SohbetFirmalar).save(firmakayitlar);
                    }
                }

                const newMessage = await manager.getRepository(SohbetMesajlari).save({
                    SohbetID: sohbetID,
                    MesajIcerigi: mesaj,
                    GonderenKullaniciID: userId,
                    UstMesajID: UstMesajID ?? null,
                });

                if (dosyalar && dosyalar.length > 0) {
                    await Promise.all(
                        dosyalar.map(dosya =>
                            manager.getRepository(SohbetDosyalar).update(
                                { DosyaID: dosya.DosyaID },
                                {
                                    MesajID: newMessage.MesajID,
                                    SohbetID: sohbetID,
                                }
                            )
                        )
                    );
                }

                const sonmesaj = await manager.getRepository(SohbetMesajlari).findOne({
                    where: { MesajID: newMessage.MesajID },
                    relations: {
                        GonderenKullanici: true,
                        Dosyalar: true,
                        OkunmaBilgileri: {
                            Kullanici: true
                        },
                        Sohbet: {
                            Kullanicilar: {
                                Kullanici: true
                            }
                        },
                        AltMesajlar: {
                            GonderenKullanici: true,
                        },
                    },
                });


                socketUsers.map(s => this.appGateway.sendMessageToUser(s, { sohbet, mesaj: sonmesaj }));
                const title = `${sonmesaj.GonderenKullanici.AdSoyad} kişisinden mesaj`;
                const body = sonmesaj.MesajIcerigi;
                const aliciIds = sonmesaj.Sohbet.Kullanicilar.filter(k => k.KullaniciID !== userId);
                const imageUrl = sonmesaj.Dosyalar &&
                    sonmesaj.Dosyalar.length === 1 &&
                    sonmesaj.Dosyalar[0].DosyaTipi.startsWith('image') ?
                    `${process.env.FRONTEND_URL}${sonmesaj.Dosyalar[0].DosyaURL}` : null;

                const mesajIcerigi = sonmesaj.Dosyalar &&
                    sonmesaj.Dosyalar.length > 0 ? `Bir dosya gönderdi. ${body}` : body;

                aliciIds.map(s => this.pushNotification(s.KullaniciID, title, mesajIcerigi, sonmesaj.MesajID, imageUrl));

                return sonmesaj;
            });
        } catch (error) {
            console.error('Mesaj gönderilirken hata oluştu:', error);
            throw new BadRequestException(
                error.message || 'Mesaj gönderilirken hata oluştu',
            );
        }
    }


    async pushNotification(userId: number, title: string, body: string, itemId: number, imageUrl?: string) {
        try {
            const user = await this.dataSource.getRepository(Kullanicilar).findOne({
                where: { id: userId },
                relations: ['Cihazlar'],
            });

            if (!user || !user.Cihazlar || user.Cihazlar.length === 0) return;

            const aktifCihazVar = user.Cihazlar.some(c => c.isActive);
            if (aktifCihazVar) return;

            const cihazlar = user.Cihazlar.filter(c => !c.isActive && c.Token);

            for (const cihaz of cihazlar) {
                const page =
                    cihaz.Platform === 'android'
                        ? 'SohbetMesajlari'
                        : cihaz.Platform === 'ios'
                            ? 'SohbetMesajlari'
                            : 'https://panel.argeassist.com/sohbetler';

                const data = {
                    page,
                    itemId: itemId.toString(),
                };

                await this.bildirimler.sendPushNotification(
                    cihaz.Token,
                    title,
                    body,
                    data,
                    imageUrl // resim varsa gönder
                );
            }
        } catch (error) {
            console.error(`Push gönderilemedi`);
        }
    }





    async saveDosya(dosyaBilgisi: any) {
        try {
            const sohbetDosya = this.dataSource
                .getRepository(SohbetDosyalar)
                .create({
                    DosyaTipi: dosyaBilgisi.DosyaTipi,
                    DosyaURL: dosyaBilgisi.DosyaYolu,
                    YuklenmeTarihi: new Date(),
                });

            const kaydedilenDosya = await this.dataSource
                .getRepository(SohbetDosyalar)
                .save(sohbetDosya);

            return kaydedilenDosya;
        } catch (error) {
            throw new Error('Dosya kaydedilemedi: ' + error.message);
        }
    }


    async getDosyaBilgileri(dosyaYolu: string) {
        try {
            const dosya = await this.dataSource
                .getRepository(SohbetDosyalar)
                .createQueryBuilder('dosya')
                .where('dosya.DosyaURL LIKE :dosyaYolu', {
                    dosyaYolu: `%${dosyaYolu}`
                })
                .getOne();

            if (!dosya) {
                throw new Error('Dosya bulunamadı');
            }

            return dosya;

        } catch (error) {
            throw new Error('Dosya bilgileri alınamadı: ' + error.message);
        }
    }

    async checkFileAccess(userId: number, sohbetId: number): Promise<boolean> {
        const sohbetKullanici = await this.dataSource
            .getRepository(SohbetKullanicilari).find({
                where: {
                    KullaniciID: userId,
                    SohbetID: sohbetId,
                    AyrildiMi: false
                }
            });

        return !!sohbetKullanici;
    }



    async dosyaSil(
        userId: number,
        dosyaId: number,
        sohbetId?: number
    ): Promise<boolean> {
        if (!userId || !dosyaId) {
            throw new BadRequestException('Kullanıcı ID ve Dosya ID gereklidir');
        }
        if (sohbetId && sohbetId > 0) {
            const sohbetKullanici = await this.dataSource
                .getRepository(SohbetKullanicilari)
                .findOne({
                    where: {
                        KullaniciID: userId,
                        SohbetID: sohbetId,
                        AyrildiMi: false
                    }
                });

            if (!sohbetKullanici) {
                throw new BadRequestException('Kullanıcı bu sohbete katılmamış');
            }
        }

        const dosya = await this.dataSource
            .getRepository(SohbetDosyalar)
            .findOne({ where: { DosyaID: dosyaId } });

        if (!dosya) {
            throw new BadRequestException('Dosya bulunamadı');
        }
        const isImage = dosya.DosyaTipi.startsWith('image/');
        const dosyayolu = isImage ? `public/${dosya.DosyaURL}` : dosya.DosyaURL;

        if (dosyayolu && fs.existsSync(dosyayolu)) {
            fs.unlinkSync(dosyayolu);
        }

        await this.dataSource.getRepository(SohbetDosyalar).remove(dosya);

        return true;
    }


    async silMesaj(
        userId: number,
        mesajId: number,
        sohbetId: number
    ): Promise<boolean> {
        if (!userId || !mesajId || !sohbetId) {
            throw new BadRequestException('Kullanıcı ID, Mesaj ID ve Sohbet ID gereklidir');
        }
        try {
            const sohbetKullanicilari = await this.dataSource
                .getRepository(SohbetKullanicilari)
                .find({
                    where: {
                        SohbetID: sohbetId,
                        AyrildiMi: false
                    }
                });

            const sohbetKullanici = sohbetKullanicilari.find(i => i.KullaniciID === userId);
            if (!sohbetKullanici) {
                throw new BadRequestException('Kullanıcı bu sohbete katılmamış yada ayrılmış.');
            }

            const mesaj = await this.dataSource
                .getRepository(SohbetMesajlari)
                .findOne({ where: { MesajID: mesajId, GonderenKullaniciID: userId } });

            if (!mesaj) {
                throw new BadRequestException('Mesaj bulunamadı');
            }
            mesaj.SilindiMi = true;

            await this.dataSource.getRepository(SohbetMesajlari).save(mesaj);

            sohbetKullanicilari.filter(i => i.KullaniciID !== userId).map(s => this.appGateway.deleteMesajToUser(s.KullaniciID, mesaj.MesajID));

            return true;
        } catch (error) {
            throw new Error('Mesaj silinirken hata oluştu: ' + error.message);
        }
    }



    async gruptanAyril(
        userId: number,
        sohbetId: number
    ): Promise<boolean> {
        if (!userId || !sohbetId) {
            throw new BadRequestException('Kullanıcı ID ve Sohbet ID gereklidir');
        }
        try {
            const sohbetKullanicilari = await this.dataSource
                .getRepository(SohbetKullanicilari)
                .find({
                    where: {
                        SohbetID: sohbetId,
                        AyrildiMi: false
                    },
                    relations: { Sohbet: true }
                });


            const sohbetKullanici = sohbetKullanicilari.find(i => i.KullaniciID === userId);
            if (!sohbetKullanici) {
                throw new BadRequestException('Kullanıcı bu sohbete katılmamış yada ayrılmış.');
            }
            if (sohbetKullanici.Sohbet.SohbetTipi === 'birebir') {
                throw new BadRequestException('Bu sohbet grup tipinde değil birebir sohbetlerde sohbetten ayrılamazsınız.');
            }
            const ayrilmaTarihi = new Date();

            sohbetKullanici.AyrildiMi = true;
            sohbetKullanici.AyrilmaTarihi = ayrilmaTarihi;

            await this.dataSource.getRepository(SohbetKullanicilari).save(sohbetKullanici);

            sohbetKullanicilari.filter(i => i.KullaniciID !== userId).map(s => this.appGateway.gruptanAyril(s.KullaniciID, { sohbetId: sohbetId, ayrilanKullaniciID: userId, tarih: ayrilmaTarihi }));

            return true;
        } catch (error) {
            throw new Error('Kullanıcı gruptan ayrılırken hata oluştu: ' + error.message);
        }
    }


    @Cron('30 3 * * *') // Her gün saat 03:30'da çalışır
    async temizleDosyalar() {
        console.log('Kullanılmayan dosyaları temizleme görevi başladı...');

        try {
            // MesajID ve SohbetID'si boş olan dosyaları bul
            const kullanilmayanDosyalar = await this.dataSource
                .getRepository(SohbetDosyalar)
                .createQueryBuilder('dosya')
                .where('dosya.MesajID IS NULL')
                .andWhere('dosya.SohbetID IS NULL')
                .getMany();

            if (kullanilmayanDosyalar.length === 0) {
                console.log('Temizlenecek dosya bulunamadı');
                return;
            }

            let silinenDosyaSayisi = 0;
            let hataliDosyaSayisi = 0;

            for (const dosya of kullanilmayanDosyalar) {
                try {
                    // Dosya sisteminden sil
                    const isImage = dosya.DosyaTipi.startsWith('image/');
                    const dosyayolu = isImage ? `public/${dosya.DosyaURL}` : dosya.DosyaURL;

                    if (dosyayolu && fs.existsSync(dosyayolu)) {
                        fs.unlinkSync(dosyayolu);
                    }

                    // Veritabanından sil
                    await this.dataSource
                        .getRepository(SohbetDosyalar)
                        .remove(dosya);

                    silinenDosyaSayisi++;

                } catch (error) {
                    hataliDosyaSayisi++;
                    console.error(`Dosya silinirken hata: ${dosya.DosyaID}`, error.message);
                }
            }

            console.log(`Temizlik tamamlandı. Silinen: ${silinenDosyaSayisi}, Hatalı: ${hataliDosyaSayisi}`);

        } catch (error) {
            console.error('Dosya temizleme görevi sırasında hata oluştu:', error.message);
        }
    }

}
