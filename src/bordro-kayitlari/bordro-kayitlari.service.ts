import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BordroKayitlari } from './entities/bordro-kayitlari.entity';
import { DataSource, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { Personel } from 'src/personel/entities/personel.entity';

@Injectable()
export class BordroKayitlariService {
    constructor(
        @InjectRepository(BordroKayitlari)
        private readonly bordroRepository: Repository<BordroKayitlari>,
        private readonly dataSource: DataSource
    ) { }

    async getBordroKayit(userId: number, FirmaID: number | null, DonemID: number, PersonelID: number | 'all') {
        if (!userId) {
            throw new BadRequestException(`Kullanıcı ID gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
        }

        if (!DonemID) {
            throw new BadRequestException(`Dönem ID gereklidir`);
        }
        if (!PersonelID) {
            throw new BadRequestException(`Personel ID gereklidir`);
        }

        try {
            if (PersonelID !== 'all') {
               /*  const bordroKayit = await this.bordroRepository.findOne({
                    where: { DonemID, PersonelID },
                    relations: ['Personel', 'Firma']
                }); */
                const bordroKayit = await this.dataSource
                .getRepository(BordroKayitlari)
                .createQueryBuilder('bordro')
                .leftJoinAndSelect('bordro.Personel', 'personel')
                .leftJoinAndSelect('bordro.Firma', 'firma')
                .leftJoinAndSelect('personel.PdksKayitlari', 'pdks')
                .leftJoinAndSelect('personel.BordroKayitlari', 'pbordro')
                .leftJoinAndSelect('pbordro.Donem', 'donem')
                .leftJoinAndSelect(
                    'personel.IzinTalepleri', 
                    'izin', 
                    'izin.IsDeleted = :isDeleted AND izin.DonemID = :donemId', 
                    { 
                        isDeleted: false,
                        donemId: DonemID 
                    }
                )
                .where('bordro.PersonelID = :personelId', { personelId: PersonelID })
                .andWhere('bordro.DonemID = :donemId', { donemId: DonemID })
                .getOne();


                // Bordro kaydı bulunamadıysa hata fırlat
                if (!bordroKayit) {
                    return null
                }

                const manuelHesaplama = await this.hesaplaTeknoKentUcreti(
                    bordroKayit.Personel,
                    DonemID,
                    bordroKayit.NetOdenen,
                    bordroKayit.CalisilanGunSayisi,
                    bordroKayit.ArgeGunSayisi,
                    bordroKayit.VergiIstisnasiUygula,
                    bordroKayit.BesPuanlikIndirimUygula,
                );

                return [{ ...manuelHesaplama, ExstraUcret: bordroKayit.ExstraOdenen, Not: bordroKayit.Not }];

            } else {
                const bordroKayitlari = await this.bordroRepository.find({
                    where: { DonemID, FirmaID: FirmaID },
                    relations: ['Personel', 'Firma']
                });

                // Bordro kaydı bulunamadıysa hata fırlat
                if (!bordroKayitlari || bordroKayitlari.length === 0) {
                    return null
                }

                const manuelHesaplamaList = await Promise.all(bordroKayitlari.map(async (bordroKayit) => {

                    const manuelHesaplama = await this.hesaplaTeknoKentUcreti(
                        bordroKayit.Personel,
                        DonemID,
                        bordroKayit.NetOdenen,
                        bordroKayit.CalisilanGunSayisi,
                        bordroKayit.ArgeGunSayisi,
                        bordroKayit.VergiIstisnasiUygula,
                        bordroKayit.BesPuanlikIndirimUygula,
                    );
                    return [{ ...manuelHesaplama, ExstraUcret: bordroKayit.ExstraOdenen, Not: bordroKayit.Not, PersonelAdi: bordroKayit.Personel.AdSoyad }];
                }));

                return manuelHesaplamaList.flat();

            }
        } catch (error) {
            console.error("Bordro kayıt çekilirken hata oluştu:", error);
            throw new BadRequestException(
                error.message || 'Bordro kayıt çekme işlemi gerçekleştirilemedi.'
            );
        }
    }


    async upload(userId: number, data: {
        PersonelID: number,
        DonemID: number,
        ExstraUcret: number,
        Not?: string,
        ArgeGunSayisi: number,
        VergiIstisnasiUygula?: boolean,
        BesPuanlikIndirimUygula?: boolean,
    }) {


        if (!userId) {
            throw new BadRequestException(`Kullanıcı ID gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }
        if (!data.ExstraUcret) {
            data.ExstraUcret = 0;
        }


        try {

            const personel = await this.dataSource
                .getRepository(Personel)
                .createQueryBuilder('personel')
                .leftJoinAndSelect('personel.PdksKayitlari', 'pdks')
                .leftJoinAndSelect('personel.BordroKayitlari', 'bordro')
                .leftJoinAndSelect('bordro.Donem', 'donem')
                .leftJoinAndSelect(
                    'personel.IzinTalepleri',
                    'izin',
                    'izin.IsDeleted = :isDeleted AND izin.DonemID = :donemId',
                    {
                        isDeleted: false,
                        donemId: data.DonemID
                    }
                )
                .where('personel.PersonelID = :personelId', { personelId: data.PersonelID })
                .getOne();

            if (!personel) {
                throw new BadRequestException(`personel bulunamadı`);
            }


            const bordrokayit = await this.bordroRepository.findOne({
                where: {
                    PersonelID: data.PersonelID,
                    DonemID: data.DonemID
                }
            });
            const personelizinligunsayisi = personel.IzinTalepleri?.filter(i => i.DonemID === data.DonemID)?.reduce((toplam, izin) => toplam + (izin.ToplamGun || 0), 0) || 0;

            const personelGunlukNetUcreti = personel.NetMaas / 30;
            const personelizinliGunUcreti = personelizinligunsayisi * personelGunlukNetUcreti;

            const odenenNetUcret = data.ExstraUcret + (personel.NetMaas - personelizinliGunUcreti);
            const hesaplananGunSayisi = 30 - personelizinligunsayisi;



            if (bordrokayit) {
                // Bordro kaydı varsa güncelle
                await this.bordroRepository.update(bordrokayit.BordroKayitID, {
                    CalisilanGunSayisi: hesaplananGunSayisi,
                    NetOdenen: odenenNetUcret,
                    ExstraOdenen: data.ExstraUcret,
                    IzinliGunSayisi: personelizinligunsayisi,
                    Not: data.Not,
                    ArgeGunSayisi: hesaplananGunSayisi > data.ArgeGunSayisi ? data.ArgeGunSayisi : hesaplananGunSayisi,
                    VergiIstisnasiUygula: data.VergiIstisnasiUygula,
                    BesPuanlikIndirimUygula: data.BesPuanlikIndirimUygula
                });
            } else {
                // Bordro kaydı yoksa yeni kayıt oluştur
                await this.bordroRepository.save({
                    PersonelID: data.PersonelID,
                    FirmaID: personel.IliskiID,
                    DonemID: data.DonemID,
                    CalisilanGunSayisi: hesaplananGunSayisi,
                    NetOdenen: odenenNetUcret,
                    ExstraOdenen: data.ExstraUcret,
                    IzinliGunSayisi: personelizinligunsayisi,
                    Not: data.Not,
                    ArgeGunSayisi: hesaplananGunSayisi > data.ArgeGunSayisi ? data.ArgeGunSayisi : hesaplananGunSayisi,
                    VergiIstisnasiUygula: data.VergiIstisnasiUygula,
                    BesPuanlikIndirimUygula: data.BesPuanlikIndirimUygula
                });
            }

            const manuelHesaplama = await this.hesaplaTeknoKentUcreti(
                personel,
                data.DonemID,
                odenenNetUcret,
                hesaplananGunSayisi,
                hesaplananGunSayisi > data.ArgeGunSayisi ? data.ArgeGunSayisi : hesaplananGunSayisi,
                data.VergiIstisnasiUygula,
                data.BesPuanlikIndirimUygula
            );

            return [manuelHesaplama];


        } catch (error) {
            throw new BadRequestException(
                error.message || 'bordro kaydı düzenleme hatası',
            );
        }
    }

    // Hesaplama utility fonksiyonları


    private async hesaplaTeknoKentUcreti(personel: Personel,
        donemId: number,
        netMaas: number,
        gunSayisi: number,
        argeGunSayisi: number = 0,
        vergiIstisnasiUygula: boolean = false,
        besPuanlikIndirimUygula: boolean = false) {

        // Yıl başından itibaren toplam kazancı hesapla
        const yilBasiKazanc = await this.getYilBasindanItiberenKazanc(personel, donemId, netMaas);
        const vergiDilimi = this.hesaplaVergiDilimi(yilBasiKazanc);
      
        const veriler = await this.hesaplaTeknokent({
            gunSayisi,
            argeGunSayisi: gunSayisi > argeGunSayisi ? argeGunSayisi : gunSayisi,
            personel,
            netUcret: netMaas,
            vergiDilimiYuzde: vergiDilimi,
            vergiIstisnasiUygula, // veya dışarıdan gelen boolean
            besPuanlikIndirimUygula
        });

        return veriler

    }

    private async hesaplaTeknokent({
        gunSayisi,
        argeGunSayisi,
        personel,
        netUcret,
        vergiDilimiYuzde,
        vergiIstisnasiUygula,
        besPuanlikIndirimUygula
    }) {
        const sgkIsci = 0.14;
        const issizlikIsci = 0.01;
        const sgkIsverenNormal = 0.205;
        const sgkIsverenIndirimli = besPuanlikIndirimUygula ? (0.205 - 0.05) : 0.205;
        const issizlikIsveren = 0.02;
        const damgaVergisiOrani = 0.00759;
        const vergiDilimi = vergiDilimiYuzde / 100;
        const brutUcret = netUcret / (1 - sgkIsci - issizlikIsci);
        const sgkIsciTutari = brutUcret * sgkIsci;
        const issizlikIsciTutari = brutUcret * issizlikIsci;
        const sgkIsverenTutari = brutUcret * sgkIsverenIndirimli;
        const issizlikIsverenTutari = brutUcret * issizlikIsveren;
        const toplamSGK = sgkIsverenTutari + issizlikIsverenTutari;

        // İstisna oranı = arge süresi / toplam süre
        const istisnaOrani = vergiIstisnasiUygula && gunSayisi > 0 ? argeGunSayisi / gunSayisi : 0;

        const gelirVergisi = brutUcret * vergiDilimi * (1 - istisnaOrani);
        const damgaVergisi = brutUcret * damgaVergisiOrani * (1 - istisnaOrani);

        const sgkIsverenDestegi = toplamSGK * 0.5;
        const toplamMaliyet =
            brutUcret +
            (toplamSGK - sgkIsverenDestegi) +
            gelirVergisi +
            damgaVergisi;

        return {
            gunSayisi,
            argeGunSayisi,
            bordroEsasBrut: brutUcret,
            calisanSGKPrimi: sgkIsciTutari,
            calisanIssizlikSigortasi: issizlikIsciTutari,
            vergiDilimi: vergiDilimiYuzde,
            gelirVergisi,
            damgaVergisi,
            asgariUcretVergiIstisnasi: +(sgkIsciTutari + issizlikIsciTutari),
            netUcret,
            maas: personel.NetMaas,
            sgkPayi: sgkIsverenTutari,
            issizlikPayi: issizlikIsverenTutari,
            toplamSGKIstisna: sgkIsverenDestegi,
            gelirVergisiIstisnasi: brutUcret * vergiDilimi * istisnaOrani,
            damgaVergisiIstisnasi: brutUcret * damgaVergisiOrani * istisnaOrani,
            toplamSGKOdemesi: toplamSGK - sgkIsverenDestegi,
            damgaVergiOdemesi: damgaVergisi,
            gelirVergisiOdemesi: gelirVergisi,
            toplamMaliyet,
            vergiIstisnasiUygula,
            besPuanlikIndirimUygula
        };
    }


    private async getYilBasindanItiberenKazanc(personel: Personel, donemId: number, aylikTutar: number): Promise<number> {
        // Dönem ve personel bilgilerini al
        const donem = await this.dataSource.getRepository('Donem').findOne({
            where: { DonemID: donemId }
        });

        if (!donem || !personel) {
            throw new BadRequestException('Dönem veya personel bilgisi bulunamadı');
        }



        // Tarihleri Türkiye saatine göre ayarla
        const yilBaslangic = new Date(donem.Yil, 0, 1);
        const iseGirisTarihi = new Date(personel.IseGirisTarihi);

        // UTC offset düzeltmesi
        yilBaslangic.setHours(0, 0, 0, 0);
        iseGirisTarihi.setHours(0, 0, 0, 0);

        // İşe giriş tarihi o yıldan önceyse 1 Ocak'ı al, değilse işe giriş tarihini al
        const baslangicTarihi = iseGirisTarihi < yilBaslangic ? yilBaslangic : iseGirisTarihi;
        if (personel.BordroKayitlari && personel.BordroKayitlari.length > 0) {
            let toplamKazanc = 0;

            // Seçili döneme kadar olan ayları kontrol et
            for (let ay = 1; ay < donem.Ay; ay++) {
                // O ay için bordro kaydı var mı kontrol et
                const bordroKaydi = personel.BordroKayitlari.find(kayit => {
                    // Dönem tablosundan ilgili dönem kaydını bul
                    const kayitDonem = kayit.Donem;
                    return kayitDonem.Yil === donem.Yil && kayitDonem.Ay === ay;
                });

                if (bordroKaydi) {
                    // Bordro kaydı varsa NetOdenen'i ekle
                    toplamKazanc += bordroKaydi.NetOdenen;
                } else {
                    // Bordro kaydı yoksa personelin maaşını ekle
                    // Eğer işe giriş tarihi o aydan sonra ise ekleme
                    const ayBaslangic = new Date(donem.Yil, ay - 1, 1);
                    if (iseGirisTarihi <= ayBaslangic) {
                        toplamKazanc += personel.NetMaas;
                    }
                }
            }

            // Şu anki dönem için aylik tutarı da ekle
            toplamKazanc += aylikTutar;
            return toplamKazanc;
        }


        // Seçili dönemin son günü
        const donemSonu = new Date(donem.Yil, donem.Ay - 1, this.getAyinSonGunu(donem.Yil, donem.Ay));
        donemSonu.setHours(23, 59, 59, 999);

        // Ay farkını hesapla (sadece 2024 yılı için)
        const ayFarki = this.hesaplaAyFarki(baslangicTarihi, donemSonu);

        return aylikTutar * ayFarki;
    }

    private hesaplaAyFarki(baslangic: Date, bitis: Date): number {
        let ayFarki = (bitis.getFullYear() - baslangic.getFullYear()) * 12 + (bitis.getMonth() - baslangic.getMonth());

        const baslangicGun = baslangic.getDate();
        const bitisGun = bitis.getDate();

        if (bitisGun >= 15) ayFarki += 0.5;
        if (baslangicGun >= 15) ayFarki -= 0.5;

        return Math.max(0, Math.round(ayFarki * 2) / 2); // Yarım ay hassasiyetinde döndür
    }

    // Ayın son gününü bulan yardımcı fonksiyon
    private getAyinSonGunu(yil: number, ay: number): number {
        return new Date(yil, ay, 0).getDate();
    }

    private hesaplaVergiDilimi(yilBasindanKazanc: number): number {
        const VERGI_DILIMLERI = [
            { limit: 150000, oran: 15 },
            { limit: 350000, oran: 20 },
            { limit: 1200000, oran: 27 },
            { limit: 2000000, oran: 35 },
            { limit: Infinity, oran: 40 },
        ];

        for (const dilim of VERGI_DILIMLERI) {
            if (yilBasindanKazanc <= dilim.limit) {
                return dilim.oran;
            }
        }

        return VERGI_DILIMLERI[VERGI_DILIMLERI.length - 1].oran;
    }





}
