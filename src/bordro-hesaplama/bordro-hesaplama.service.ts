import { BadRequestException, Injectable } from '@nestjs/common';
import { AylikBordroSonucData, HesaplamaDataDto } from './dto/hesaplamaData.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BordroHesaplamaService {


    async bordroHesapla(userId: number, data: HesaplamaDataDto) {
        const filePath = path.join(process.cwd(), 'year-parameters.json');
        const raw = fs.readFileSync(filePath, 'utf8');
        const yearParameters = JSON.parse(raw);

        const seciliYil = yearParameters?.yearParameters?.find(y => y.year == data.Yil) ?? null;

        if (!seciliYil) {
            throw new BadRequestException('Seçili yıl bulunamadı')
        }


        if (data.HesaplamaSekli === 'brutten-nete') {
            const bordrolar = this.bruttenNeteHesapla(data, seciliYil)

            return {
                id: data.id,
                PersonelAdi: data.PersonelAdi,
                ayliklar: bordrolar
            }
        } else if (data.HesaplamaSekli === 'netten-brute') {
            const bordrolar = this.nettenBruteHesaplaAyAy(data, seciliYil)
            return {
                id: data.id,
                PersonelAdi: data.PersonelAdi,
                ayliklar: bordrolar
            }
        } else {
            throw new BadRequestException('Seçilen değer yanlış girilmiş.')
        }
    }

    private stringToRenderNumber(value: string): number {
        if (!value) return 0;

        value = value.replace(/\s/g, ''); // boşlukları sil

        // Hem nokta hem virgül varsa → nokta binlik, virgül ondalık
        if (value.includes('.') && value.includes(',')) {
            value = value.replace(/\./g, '');
            value = value.replace(/,/g, '.');
        }
        // Sadece nokta varsa
        else if (value.includes('.') && !value.includes(',')) {
            const parts = value.split('.');
            // son kısım 3 haneli ise binliktir → tüm noktaları sil
            if (parts[parts.length - 1].length === 3) {
                value = value.replace(/\./g, '');
            }
        }
        // Sadece virgül varsa → ondalık
        else if (value.includes(',')) {
            value = value.replace(/\./g, '');
            value = value.replace(/,/g, '.');
        }

        return parseFloat(value);
    }



    private bruttenNeteHesapla(data: HesaplamaDataDto, seciliYil: any) {
        let GirilenDeger = data.GirilenDeger.replace(/\s/g, '');
        const aylikBrutUcret = data.UcretTuru === 'aylik'
            ? this.stringToRenderNumber(GirilenDeger)   // doğrudan aylık brüt
            : this.stringToRenderNumber(GirilenDeger) * 30; // günlük girildiyse 30 ile çarp

        const gunlukUcret = aylikBrutUcret / 30;
        const brutUcret = gunlukUcret * data.BordroGunSayisi;


        let gelenKumulatifGelirVergiMatrahi = data.KumGelirVergiMatrahi.replace(/\s/g, '');
        const dataKumulatifGelirVergiMatrahi = this.stringToRenderNumber(gelenKumulatifGelirVergiMatrahi);
        let gelenAsgUcretKumIstisnaMatrahi = data.AsgUcretKumIstisnaMatrahi.replace(/\s/g, '');
        const dataAsgUcretKumIstisnaMatrahi = this.stringToRenderNumber(gelenAsgUcretKumIstisnaMatrahi);

        const gelenGelirVergisi = this.gelirVergisiHesapla(
            dataKumulatifGelirVergiMatrahi,
            seciliYil.GelirVergiDilimiOranlari
        );
        const gelenAsgariUcretGelirVergisi = this.gelirVergisiHesapla(
            dataAsgUcretKumIstisnaMatrahi,
            seciliYil.GelirVergiDilimiOranlari
        );

        const dataGelirVergiMatrahi = Math.round(gelenGelirVergisi * 100) / 100;

        const dataAsgariGelirVergiMatrahi = Math.round(gelenAsgariUcretGelirVergisi * 100) / 100;

        // SGK Matrahı
        let sgkMatrahi = brutUcret;
        if (sgkMatrahi < seciliYil.SGKAltSiniri) sgkMatrahi = seciliYil.SGKAltSiniri;
        if (sgkMatrahi > seciliYil.SGKUstSiniri) sgkMatrahi = seciliYil.SGKUstSiniri;


        let isciSgkPrimi = 0;
        let isciIssizlikSigortaPrimi = 0;
        let isverenSgkPrimi = 0;
        let isverenIssizlikSigortaPrimi = 0;
        let sgdpIsverenDestekPrimi = 0;


        // SGK Primleri
        if (data.SSKGrup === "tum-sigorta-kollarina-tabi") {
            isciSgkPrimi = data.SirketOrtagi ? 0 : sgkMatrahi * seciliYil.SGKPrimiIsci;
            isciIssizlikSigortaPrimi = data.SirketOrtagi ? 0 : sgkMatrahi * seciliYil.IssizlikSigortaIsci;
            isverenSgkPrimi = data.SirketOrtagi ? 0 : sgkMatrahi * seciliYil.SGKPrimiIsveren;
            isverenIssizlikSigortaPrimi = data.SirketOrtagi ? 0 : sgkMatrahi * seciliYil.IssizlikSigortaIsveren;
        }
        else if (data.SSKGrup === "s-g-destek-primine-tabi" || data.SSKGrup === "s-g-destek-primine-tabi-eytli") {
            // Emekli çalışanda sadece işveren destek primi var
            sgdpIsverenDestekPrimi = data.SirketOrtagi ? 0 : sgkMatrahi * seciliYil.SGDPIsverenOrani;
        }

        // Engelli indirimi tablosu
        const engelliIndirimiTablosu: Record<string, number> = seciliYil.engelliIndirimiTablosu;

        // İndirim tutarını bul
        let engelliIndirimiTutari = 0;
        if (data.EngelliIndirimi && engelliIndirimiTablosu[data.EngelliIndirimi]) {
            // Gün bazında orantıla (ör: 25 gün çalıştıysa 25/30)
            engelliIndirimiTutari = engelliIndirimiTablosu[data.EngelliIndirimi] * (data.BordroGunSayisi / 30);
        }



        let asgariBrut = seciliYil.asgariUcret.brutUcret;
        let asgariSgkIsci = asgariBrut * seciliYil.SGKPrimiIsci;
        let asgariIssizlikIsci = asgariBrut * seciliYil.IssizlikSigortaIsci;

        let asgariVergiMatrahi = asgariBrut - (asgariSgkIsci + asgariIssizlikIsci) - engelliIndirimiTutari;


        let vergiMatrahi = brutUcret - (isciSgkPrimi + isciIssizlikSigortaPrimi);
        vergiMatrahi = Math.max(0, vergiMatrahi - engelliIndirimiTutari);
        const hesaplananDamgaVergisi = brutUcret * seciliYil.DamgaVergisiIsci;

        const argeOrani = data.ArgeGunSayisi > data.BordroGunSayisi ? 1 : Math.max(0, Math.min(1, data.ArgeGunSayisi / data.BordroGunSayisi));
        const teknokentOrani = data.TeknoparkGunSayisi > data.BordroGunSayisi ? 1 : Math.max(0, Math.min(1, data.TeknoparkGunSayisi / data.BordroGunSayisi));
        const sonuclar: AylikBordroSonucData[] = [];
        let kumulatifVergiMatrahi = data.BaslangicAyi !== 'Ocak' ? dataKumulatifGelirVergiMatrahi : 0;
        let oncekiKumulatifVergi = data.BaslangicAyi !== 'Ocak' ? dataGelirVergiMatrahi : 0;
        let oncekiAsgariVergi = data.BaslangicAyi !== 'Ocak' ? dataAsgariGelirVergiMatrahi : 0;
        let asgariUcretKumuleIstisnaMatrahi = data.BaslangicAyi !== 'Ocak' ? dataAsgUcretKumIstisnaMatrahi : 0;
        let duzenlenenSgkPrimIsverenOrani = seciliYil.SGKPrimiIsveren - (data.BesPuanlikIndirimUygula ? 0.05 : data.DortPuanlikIndirimUygula ? 0.04 : 0);

        const tumAylar = [
            'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
        ];




        // Başlangıç ayı (1-12) ve kaç aylık bordro
        const baslangicIndex = tumAylar.findIndex(a => a === data.BaslangicAyi);
        const bordroAySayisi = data.KacAylikBordro;

        for (let i = 0; i < bordroAySayisi; i++) {
            const ayIndex = baslangicIndex + i;
            if (ayIndex >= tumAylar.length) break; // 12. aydan sonrası yok
            const ay = tumAylar[ayIndex];

            kumulatifVergiMatrahi += vergiMatrahi;
            asgariUcretKumuleIstisnaMatrahi += asgariVergiMatrahi;

            const toplamGelirVergisi = this.gelirVergisiHesapla(
                kumulatifVergiMatrahi,
                seciliYil.GelirVergiDilimiOranlari
            );


            const toplamAsgariUcretGelirVergisi = this.gelirVergisiHesapla(
                asgariUcretKumuleIstisnaMatrahi,
                seciliYil.GelirVergiDilimiOranlari
            );
            const aylikGelirVergi = toplamGelirVergisi - oncekiKumulatifVergi;
            oncekiKumulatifVergi += aylikGelirVergi;

            const aylikAsgariUcretGelirVergi = toplamAsgariUcretGelirVergisi - oncekiAsgariVergi;
            oncekiAsgariVergi += aylikAsgariUcretGelirVergi;

            const SGK5510Tesvigi = Math.max(0, data.SirketOrtagi ? 0 : isverenSgkPrimi - (sgkMatrahi * duzenlenenSgkPrimIsverenOrani));
            const SGK4691Tesvigi = Math.max(0, (data.KanunSecimi === 'standart' || data.SirketOrtagi) ? 0 : sgkMatrahi * (duzenlenenSgkPrimIsverenOrani / 2));
            const asgariVergiIstisnasi = aylikAsgariUcretGelirVergi;
            const asgUcretIstisnaMatrahi = seciliYil.asgariUcret.netUcret;
            const asgUcretDamgaVergiIstisnasi = data.AsgUcretIstisnaUygula ? seciliYil.AsgariUcretinDamgaVergisi : 0;

            let kalanSGKIsverenPrimi = isverenSgkPrimi;
            let gelirVergisi = aylikGelirVergi;
            let damgaVergisi = hesaplananDamgaVergisi;

            let gelirVergisiTesviki = 0;
            let damgaVergisiTesviki = 0;
            let SGKTesvigi = 0;

            if (data.KanunSecimi === '5746') {
                // Eğitim durumuna göre teşvik oranı
                let egitimOrani = 0.80;
                if (data.EgitimDurumu === 'doktora') egitimOrani = 0.95;
                else if (data.EgitimDurumu === 'yuksek-lisans') egitimOrani = 0.90;

                const toplamOran = (argeOrani * egitimOrani);

                // Gelir vergisi teşviki (oran kadar indirim)
                gelirVergisiTesviki = Math.round(((gelirVergisi * toplamOran) - asgariVergiIstisnasi) * 100) / 100;
                gelirVergisi = gelirVergisi - gelirVergisiTesviki;

                // Damga vergisi teşviki (tamamı)
                damgaVergisiTesviki = damgaVergisi - asgUcretDamgaVergiIstisnasi;
                damgaVergisi = 0;

                duzenlenenSgkPrimIsverenOrani = 0.075;
                // SGK işveren primi indirimi
                SGKTesvigi = SGK4691Tesvigi + SGK5510Tesvigi;
                kalanSGKIsverenPrimi = Math.max(0, kalanSGKIsverenPrimi - SGKTesvigi);
            } else if (data.KanunSecimi === '4691') {
                // Teknokent personeli için tam teşvik
                const toplamOran = teknokentOrani;


                gelirVergisiTesviki = (gelirVergisi * toplamOran) - asgariVergiIstisnasi;
                damgaVergisiTesviki = hesaplananDamgaVergisi - asgUcretDamgaVergiIstisnasi;
                SGKTesvigi = SGK4691Tesvigi + SGK5510Tesvigi;
                kalanSGKIsverenPrimi = Math.max(0, kalanSGKIsverenPrimi - SGKTesvigi);

                gelirVergisi = gelirVergisi - gelirVergisiTesviki;
                damgaVergisi = 0;
            } else if (data.BesPuanlikIndirimUygula || data.DortPuanlikIndirimUygula) {
                SGKTesvigi = data.SSKTesvigiUygula ? SGK5510Tesvigi : 0;
                kalanSGKIsverenPrimi = Math.max(0, kalanSGKIsverenPrimi - SGKTesvigi);
            }

            const odenecekSGKPrimi = isciSgkPrimi + isciIssizlikSigortaPrimi + kalanSGKIsverenPrimi + isverenIssizlikSigortaPrimi - sgdpIsverenDestekPrimi;


            const uygulanacakGelirVergisi = Math.max(0, gelirVergisi - asgariVergiIstisnasi);
            const uygulanacakDamgaVergisi = Math.max(0, damgaVergisi - asgUcretDamgaVergiIstisnasi);


            const besOrani = Math.max(3, data.BesYuzdesi ?? 3) / 100; // minimum %3
            const besKesintisi = data.BESKesintisiUygula ? brutUcret * besOrani : 0;
            const netOdenen = brutUcret
                - isciSgkPrimi
                - isciIssizlikSigortaPrimi
                - aylikGelirVergi
                - hesaplananDamgaVergisi
                - besKesintisi
                + asgariVergiIstisnasi
                + asgUcretDamgaVergiIstisnasi
                + damgaVergisiTesviki;

            const netTesviksizMaas = brutUcret
                - isciSgkPrimi
                - isciIssizlikSigortaPrimi
                - uygulanacakGelirVergisi
                - uygulanacakDamgaVergisi
                - besKesintisi;

            const toplamMaliyet = brutUcret + isverenIssizlikSigortaPrimi + isverenSgkPrimi - SGKTesvigi - gelirVergisiTesviki;

            sonuclar.push({
                Ay: ay,
                BordroGunSayisi: data.BordroGunSayisi,
                TeknoGunSayisi: data.TeknoparkGunSayisi,
                ArgeGunSayisi: data.ArgeGunSayisi,
                KanunNo: data.KanunSecimi,
                BESOrani: data.BESKesintisiUygula ? besOrani : 0,
                BESKEsintisi: Math.round(besKesintisi * 100) / 100,
                AylikBrutUcret: Math.round(aylikBrutUcret * 100) / 100,
                BrutUcret: Math.round(brutUcret * 100) / 100,
                SGKMatrahi: Math.round(sgkMatrahi * 100) / 100,
                SGKIsciPayi: Math.round(isciSgkPrimi * 100) / 100,
                SGKIsverenPayi: Math.round(isverenSgkPrimi * 100) / 100,
                SGK5510Tesvigi: Math.round(SGK5510Tesvigi * 100) / 100,
                SGK4691Tesvigi: Math.round(SGK4691Tesvigi * 100) / 100,
                SGKTesvigi: Math.round(SGKTesvigi * 100) / 100,
                KalanSGKIsverenPrimi: Math.round(kalanSGKIsverenPrimi * 100) / 100,
                IssizlikIsciPrimi: Math.round(isciIssizlikSigortaPrimi * 100) / 100,
                IssizlikIsverenPrimi: Math.round(isverenIssizlikSigortaPrimi * 100) / 100,
                OdenecekSGKPrimi: Math.round(odenecekSGKPrimi * 100) / 100,
                GelirVergisiMatrahi: Math.round(vergiMatrahi * 100) / 100,
                KumGelirVergisiMatrahi: Math.round(kumulatifVergiMatrahi * 100) / 100,
                GelirVergisi: Math.round(aylikGelirVergi * 100) / 100,
                AsgUcretIstisnaMatrahi: Math.round(asgUcretIstisnaMatrahi * 100) / 100,
                AsgUcretKumuleIstisnaMatrahi: Math.round(asgariUcretKumuleIstisnaMatrahi * 100) / 100,
                AsgUcretVergiIstisnasi: Math.round(asgariVergiIstisnasi * 100) / 100,
                GelirVergisiTesvigi: Math.round(gelirVergisiTesviki * 100) / 100,
                KalanGelirVergisi: Math.round(uygulanacakGelirVergisi * 100) / 100,
                AsgUcretDamgaVergiIstisnasi: Math.round(asgUcretDamgaVergiIstisnasi * 100) / 100,
                DamgaVergisiTesvigi: Math.round(damgaVergisiTesviki * 100) / 100,
                OdenecekDamgaVergisi: Math.round(uygulanacakDamgaVergisi * 100) / 100,
                NetTesviksizMaas: Math.round(netTesviksizMaas * 100) / 100,
                NetOdenen: Math.round(netOdenen * 100) / 100,
                ToplamMaliyet: Math.round(toplamMaliyet * 100) / 100,
                ToplamTesvik: Math.round((gelirVergisiTesviki + damgaVergisiTesviki + SGK4691Tesvigi) * 100) / 100
            })
        }
        return sonuclar
    }




    private gelirVergisiHesapla(kumulatifMatrah: number, dilimler: any[]): number {
        let kalan = kumulatifMatrah;
        let toplamVergi = 0;
        for (const d of dilimler) {
            const [min, max] = d.Aralik;
            const oran = d.Oran / 100;

            const ustSinir = max === 0 ? Number.MAX_SAFE_INTEGER : max;

            if (kalan > min) {
                const vergilenecek = Math.min(kalan, ustSinir) - min;
                toplamVergi += vergilenecek * oran;
            }

            if (kalan <= ustSinir) {
                break; // bundan sonrası yok
            }
        }

        return toplamVergi;
    }


    /* private nettenBruteHesapla(data: HesaplamaDataDto, seciliYil: any) {
        const GirilenDeger = data.GirilenDeger.replace(/\s/g, '');
        const hedeflenenNetMaas = this.stringToRenderNumber(GirilenDeger);

        // Daha geniş başlangıç aralığı
        let altSinir = hedeflenenNetMaas * 0.8; // Çok düşük başlama
        let ustSinir = hedeflenenNetMaas * 3.0; // Yüksek başlangıç

        // Önce üst sınırın yeterli olduğundan emin olalım
        let testIterasyon = 0;
        while (testIterasyon < 10) {
            try {
                const testData = { ...data, GirilenDeger: ustSinir.toString() };
                const testHesaplama = this.bruttenNeteHesapla(testData, seciliYil);

                if (testHesaplama && testHesaplama.length > 0) {
                    const testNet = testHesaplama[0].NetOdenen;

                    if (testNet >= hedeflenenNetMaas) {
                        break; // Üst sınır yeterli
                    }
                }

                ustSinir *= 1.5; // Üst sınırı artır
                testIterasyon++;
            } catch (error) {
                ustSinir *= 1.5;
                testIterasyon++;
            }
        }


        // Binary search
        let iterasyon = 0;
        const maxIterasyon = 100;
        const hassasiyet = 0.5; // Daha gevşek hassasiyet
        let enIyiBrut = 0;
        let enIyiFark = Number.POSITIVE_INFINITY;
        let sonBrut = 0;
        let sonNet = 0;
        let sonSonuc = null;
        while (iterasyon < maxIterasyon && (ustSinir - altSinir) > hassasiyet) {
            const ortaBrut = (altSinir + ustSinir) / 2;

            try {
                const testData = { ...data, GirilenDeger: ortaBrut.toFixed(2).toString() };
                const hesaplama = this.bruttenNeteHesapla(testData, seciliYil);

                if (!hesaplama || hesaplama.length === 0) {
                    break;
                }

                const hesaplananNet = hesaplama[0].NetOdenen;
                const fark = hesaplananNet - hedeflenenNetMaas;

                // En iyi sonucu kaydet
                if (Math.abs(fark) < Math.abs(enIyiFark)) {
                    enIyiBrut = ortaBrut;
                    enIyiFark = fark;
                }

                // Son sonucu kaydet
                sonBrut = ortaBrut;
                sonNet = hesaplananNet;
                sonSonuc = hesaplama;

                // Yeterince yakın mı?
                if (Math.abs(fark) == 0) {
                    return hesaplama;
                }

                // Binary search mantığı
                if (fark > 0) {
                    ustSinir = ortaBrut; // Net fazla, brütü azalt
                } else {
                    altSinir = ortaBrut; // Net az, brütü artır
                }

            } catch (error) {
                break;
            }

            iterasyon++;
        }
        // Son sonucu hassasiyetle düzelt
        if (sonSonuc && Math.abs(sonNet - hedeflenenNetMaas) <= 10.0) {
            let hassasBrut = sonBrut;
            let hassasNet = sonNet;
            let hassasSonuc = sonSonuc;
            // Yüksekse azalt
            if (hassasNet > hedeflenenNetMaas) {
                let oncekiBrut = hassasBrut;
                let oncekiNet = hassasNet;
                let oncekiSonuc = hassasSonuc;
                while (true) {
                    oncekiBrut = hassasBrut;
                    oncekiNet = hassasNet;
                    oncekiSonuc = hassasSonuc;
                    hassasBrut -= 0.01;
                    const hassasTestData = { ...data, GirilenDeger: hassasBrut.toFixed(2).toString() };
                    const hassasHesaplama = this.bruttenNeteHesapla(hassasTestData, seciliYil);
                    if (!hassasHesaplama || hassasHesaplama.length === 0) break;
                    const yeniNet = hassasHesaplama[0].NetOdenen;
                    if (yeniNet < hedeflenenNetMaas) return oncekiSonuc;
                    hassasNet = yeniNet;
                    hassasSonuc = hassasHesaplama;
                }
                return hassasSonuc;
            } else if (hassasNet < hedeflenenNetMaas) {
                let oncekiSonuc = hassasSonuc;
                while (true) {
                    oncekiSonuc = hassasSonuc;
                    hassasBrut += 0.01;
                    const hassasTestData = { ...data, GirilenDeger: hassasBrut.toFixed(2).toString() };
                    const hassasHesaplama = this.bruttenNeteHesapla(hassasTestData, seciliYil);
                    if (!hassasHesaplama || hassasHesaplama.length === 0) break;
                    const yeniNet = hassasHesaplama[0].NetOdenen;
                    if (yeniNet > hedeflenenNetMaas) return oncekiSonuc;
                    hassasNet = yeniNet;
                    hassasSonuc = hassasHesaplama;
                }
                return hassasSonuc;
            }
            return hassasSonuc;
        }
        return [];
    } */



    private nettenBruteHesapla(data: HesaplamaDataDto, seciliYil: any) {
        const GirilenDeger = data.GirilenDeger.replace(/\s/g, '');
        let hedeflenenNetMaas = this.stringToRenderNumber(GirilenDeger);

        // ✅ Bordro gün sayısına göre normalize et
        if (data.UcretTuru === 'aylik') {
            hedeflenenNetMaas = (hedeflenenNetMaas / 30) * data.BordroGunSayisi;
        } else if (data.UcretTuru === 'gunluk') {
            hedeflenenNetMaas = hedeflenenNetMaas * data.BordroGunSayisi;
        }

        // Daha geniş başlangıç aralığı
        let altSinir = hedeflenenNetMaas * 0.8;
        let ustSinir = hedeflenenNetMaas * 3.0;

        // Önce üst sınırın yeterli olduğundan emin olalım
        let testIterasyon = 0;
        while (testIterasyon < 10) {
            try {
                const testData = { ...data, GirilenDeger: ustSinir.toString() };
                const testHesaplama = this.bruttenNeteHesapla(testData, seciliYil);

                if (testHesaplama && testHesaplama.length > 0) {
                    const testNet = testHesaplama[0].NetOdenen;
                    if (testNet >= hedeflenenNetMaas) break;
                }
                ustSinir *= 1.5;
                testIterasyon++;
            } catch (error) {
                ustSinir *= 1.5;
                testIterasyon++;
            }
        }

        // Binary search
        let iterasyon = 0;
        const maxIterasyon = 100;
        const hassasiyet = 0.5;
        let enIyiBrut = 0;
        let enIyiFark = Number.POSITIVE_INFINITY;
        let sonBrut = 0;
        let sonNet = 0;
        let sonSonuc = null;

        while (iterasyon < maxIterasyon && (ustSinir - altSinir) > hassasiyet) {
            const ortaBrut = (altSinir + ustSinir) / 2;
            try {
                const testData = { ...data, GirilenDeger: ortaBrut.toFixed(2).toString() };
                const hesaplama = this.bruttenNeteHesapla(testData, seciliYil);
                if (!hesaplama || hesaplama.length === 0) break;

                const hesaplananNet = hesaplama[0].NetOdenen;
                const fark = hesaplananNet - hedeflenenNetMaas;

                if (Math.abs(fark) < Math.abs(enIyiFark)) {
                    enIyiBrut = ortaBrut;
                    enIyiFark = fark;
                }

                sonBrut = ortaBrut;
                sonNet = hesaplananNet;
                sonSonuc = hesaplama;

                if (Math.abs(fark) == 0) return hesaplama;

                if (fark > 0) {
                    ustSinir = ortaBrut;
                } else {
                    altSinir = ortaBrut;
                }
            } catch (error) {
                break;
            }
            iterasyon++;
        }

        // Hassas düzeltme
        if (sonSonuc && Math.abs(sonNet - hedeflenenNetMaas) <= 10.0) {
            let hassasBrut = sonBrut;
            let hassasNet = sonNet;
            let hassasSonuc = sonSonuc;

            if (hassasNet > hedeflenenNetMaas) {
                let oncekiBrut = hassasBrut;
                let oncekiNet = hassasNet;
                let oncekiSonuc = hassasSonuc;
                while (true) {
                    oncekiBrut = hassasBrut;
                    oncekiNet = hassasNet;
                    oncekiSonuc = hassasSonuc;
                    hassasBrut -= 0.01;
                    const hassasTestData = { ...data, GirilenDeger: hassasBrut.toFixed(2).toString() };
                    const hassasHesaplama = this.bruttenNeteHesapla(hassasTestData, seciliYil);
                    if (!hassasHesaplama || hassasHesaplama.length === 0) break;
                    const yeniNet = hassasHesaplama[0].NetOdenen;
                    if (yeniNet < hedeflenenNetMaas) return oncekiSonuc;
                    hassasNet = yeniNet;
                    hassasSonuc = hassasHesaplama;
                }
                return hassasSonuc;
            } else if (hassasNet < hedeflenenNetMaas) {
                let oncekiSonuc = hassasSonuc;
                while (true) {
                    oncekiSonuc = hassasSonuc;
                    hassasBrut += 0.01;
                    const hassasTestData = { ...data, GirilenDeger: hassasBrut.toFixed(2).toString() };
                    const hassasHesaplama = this.bruttenNeteHesapla(hassasTestData, seciliYil);
                    if (!hassasHesaplama || hassasHesaplama.length === 0) break;
                    const yeniNet = hassasHesaplama[0].NetOdenen;
                    if (yeniNet > hedeflenenNetMaas) return oncekiSonuc;
                    hassasNet = yeniNet;
                    hassasSonuc = hassasHesaplama;
                }
                return hassasSonuc;
            }
            return hassasSonuc;
        }
        return [];
    }

    private nettenBruteHesaplaAyAy(data: HesaplamaDataDto, seciliYil: any) {
        const tumAylar = [
            'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
        ];

        const baslangicIndex = tumAylar.findIndex(a => a === data.BaslangicAyi);
        const bordroAySayisi = data.KacAylikBordro;

        // Kümülatif başlangıç değerleri     

        let kumulatifVergiMatrahi = data.BaslangicAyi !== 'Ocak'
            ? this.stringToRenderNumber(data.KumGelirVergiMatrahi.replace(/\s/g, ''))
            : 0;

        let asgariUcretKumIstisnaMatrahi = data.BaslangicAyi !== 'Ocak'
            ? this.stringToRenderNumber(data.AsgUcretKumIstisnaMatrahi.replace(/\s/g, ''))
            : 0;



        const sonuclar: AylikBordroSonucData[] = [];

        for (let i = 0; i < bordroAySayisi; i++) {
            const ayIndex = baslangicIndex + i;
            if (ayIndex >= tumAylar.length) break;
            const ay = tumAylar[ayIndex];


            // Bu ay için data’yı hazırla
            const ayData: HesaplamaDataDto = {
                ...data,
                BaslangicAyi: ay,
                KacAylikBordro: 1,
                KumGelirVergiMatrahi: kumulatifVergiMatrahi.toString(),
                AsgUcretKumIstisnaMatrahi: asgariUcretKumIstisnaMatrahi.toString()
            };

            // İlk yazdığın fonksiyonu çağır → netten brüte bulsun
            const aySonuc = this.nettenBruteHesapla(ayData, seciliYil);

            if (aySonuc && aySonuc.length > 0) {
                const sonuc = aySonuc[0];
                sonuclar.push(sonuc);

                // Yeni kümülatifleri sonraki aya aktar
                kumulatifVergiMatrahi = sonuc.KumGelirVergisiMatrahi;
                asgariUcretKumIstisnaMatrahi = sonuc.AsgUcretKumuleIstisnaMatrahi;
            }
        }

        return sonuclar;
    }




}
