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
            const bordrolar = this.nettenBruteHesapla(data, seciliYil)

            return {
                id: data.id,
                PersonelAdi: data.PersonelAdi,
                ayliklar: bordrolar
            }
        }else{
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
        const gunlukUcret = data.UcretTuru === 'aylik'
            ? this.stringToRenderNumber(GirilenDeger) / 30   // aylık brüt → günlük brüt
            : this.stringToRenderNumber(GirilenDeger);
        const brutUcret = gunlukUcret * data.BordroGunSayisi;

        let gelenKumulatifGelirVergiMatrahi = data.KumGelirVergiMatrahi.replace(/\s/g, '');
        const dataKumulatifGelirVergiMatrahi = this.stringToRenderNumber(gelenKumulatifGelirVergiMatrahi);

        let gelenAsgUcretKumIstisnaMatrahi = data.AsgUcretKumIstisnaMatrahi.replace(/\s/g, '');
        const dataAsgUcretKumIstisnaMatrahi = this.stringToRenderNumber(gelenAsgUcretKumIstisnaMatrahi);

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
            isciSgkPrimi = sgkMatrahi * seciliYil.SGKPrimiIsci;
            isciIssizlikSigortaPrimi = sgkMatrahi * seciliYil.IssizlikSigortaIsci;
            isverenSgkPrimi = sgkMatrahi * seciliYil.SGKPrimiIsveren;
            isverenIssizlikSigortaPrimi = sgkMatrahi * seciliYil.IssizlikSigortaIsveren;
        }
        else if (data.SSKGrup === "s-g-destek-primine-tabi" || data.SSKGrup === "s-g-destek-primine-tabi-eytli") {
            // Emekli çalışanda sadece işveren destek primi var
            sgdpIsverenDestekPrimi = sgkMatrahi * seciliYil.SGDPIsverenOrani;
        }

        // Engelli indirimi tablosu
        const engelliIndirimiTablosu: Record<string, number> = seciliYil.engelliIndirimiTablosu;

        // İndirim tutarını bul
        let engelliIndirimiTutari = 0;
        if (data.EngelliIndirimi && engelliIndirimiTablosu[data.EngelliIndirimi]) {
            // Gün bazında orantıla (ör: 25 gün çalıştıysa 25/30)
            engelliIndirimiTutari = engelliIndirimiTablosu[data.EngelliIndirimi] * (data.BordroGunSayisi / 30);
        }






        let vergiMatrahi = brutUcret - (isciSgkPrimi + isciIssizlikSigortaPrimi);
        vergiMatrahi = Math.max(0, vergiMatrahi - engelliIndirimiTutari);
        const hesaplananDamgaVergisi = brutUcret * seciliYil.DamgaVergisiIsci;

        const argeOrani = Math.max(0, Math.min(1, data.ArgeGunSayisi / data.BordroGunSayisi));
        const teknokentOrani = Math.max(0, Math.min(1, data.TeknoparkGunSayisi / data.BordroGunSayisi));
        const sonuclar: AylikBordroSonucData[] = [];
        let kumulatifVergiMatrahi = data.BaslangicAyi !== 'Ocak' ? dataKumulatifGelirVergiMatrahi : 0;
        let oncekiKumulatifVergi = 0;
        let asgariUcretKumuleIstisnaMatrahi = data.BaslangicAyi !== 'Ocak' ? dataAsgUcretKumIstisnaMatrahi : 0;
        let duzenlenenSgkPrimIsverenOrani = Math.round((seciliYil.SGKPrimiIsveren - (data.BesPuanlikIndirimUygula ? 0.05 : data.DortPuanlikIndirimUygula ? 0.04 : 0)) * 1000) / 1000;

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
            asgariUcretKumuleIstisnaMatrahi += seciliYil.asgariUcret.netUcret;

            const toplamGelirVergisi = this.gelirVergisiHesapla(
                kumulatifVergiMatrahi,
                seciliYil.GelirVergiDilimiOranlari
            );

            const aylikGelirVergi = toplamGelirVergisi - oncekiKumulatifVergi;
            oncekiKumulatifVergi = toplamGelirVergisi;

            const SGK5510Tesvigi = data.SirketOrtagi ? 0 : isverenSgkPrimi - (sgkMatrahi * duzenlenenSgkPrimIsverenOrani);
            const SGK4691Tesvigi = (data.KanunSecimi !== '4691' && data.SirketOrtagi) ? 0 : sgkMatrahi * (duzenlenenSgkPrimIsverenOrani / 2);

            let kalanSGKIsverenPrimi = isverenSgkPrimi;
            let gelirVergisi = aylikGelirVergi;
            let damgaVergisi = hesaplananDamgaVergisi;

            let gelirVergisiTesviki = 0;
            let damgaVergisiTesviki = 0;
            let SGKTesvigi = 0;

            if (data.KanunSecimi === '5746' && !data.SirketOrtagi) {
                // Eğitim durumuna göre teşvik oranı
                let egitimOrani = 0.80;
                if (data.EgitimDurumu === 'doktora') egitimOrani = 0.95;
                else if (data.EgitimDurumu === 'yuksek-lisans') egitimOrani = 0.90;

                const toplamOran = argeOrani * egitimOrani;

                // Gelir vergisi teşviki (oran kadar indirim)
                gelirVergisiTesviki = gelirVergisi * toplamOran;
                gelirVergisi = gelirVergisi - gelirVergisiTesviki;

                // Damga vergisi teşviki (tamamı)
                damgaVergisiTesviki = damgaVergisi;
                damgaVergisi = 0;

                duzenlenenSgkPrimIsverenOrani = 0.075;
                // SGK işveren primi indirimi
                SGKTesvigi = SGK5510Tesvigi;
                kalanSGKIsverenPrimi = Math.max(0, kalanSGKIsverenPrimi - SGKTesvigi);
            } else if (data.KanunSecimi === '4691' && !data.SirketOrtagi) {
                // Teknokent personeli için tam teşvik
                const toplamOran = teknokentOrani;


                gelirVergisiTesviki = gelirVergisi * toplamOran;
                damgaVergisiTesviki = damgaVergisi;
                SGKTesvigi = SGK4691Tesvigi + SGK5510Tesvigi;
                kalanSGKIsverenPrimi = Math.max(0, kalanSGKIsverenPrimi - SGKTesvigi);

                gelirVergisi = gelirVergisi - gelirVergisiTesviki;
                damgaVergisi = 0;
            } else if (data.BesPuanlikIndirimUygula || data.DortPuanlikIndirimUygula) {
                SGKTesvigi = data.SSKTesvigiUygula ? SGK5510Tesvigi : 0;
            }

            const asgUcretIstisnaMatrahi = data.SirketOrtagi ? 0 : seciliYil.asgariUcret.netUcret;
            const asgUcretVergiIstisnasi = data.SirketOrtagi ? 0 : (data.AsgUcretIstisnaUygula ? seciliYil.AsgariUcretinGelirVergisi : 0);
            const asgUcretDamgaVergiIstisnasi = data.SirketOrtagi ? 0 : (data.AsgUcretIstisnaUygula ? seciliYil.AsgariUcretinDamgaVergisi : 0);
            const odenecekSGKPrimi = isciSgkPrimi + isciIssizlikSigortaPrimi + kalanSGKIsverenPrimi + isverenIssizlikSigortaPrimi;

            // Net maaş hesaplamasında asgari ücret istisnaları uygulanmalı
            const uygulanacakGelirVergisi = Math.max(0, gelirVergisi - asgUcretVergiIstisnasi);
            const uygulanacakDamgaVergisi = Math.max(0, damgaVergisi - asgUcretDamgaVergiIstisnasi);


            const besOrani = Math.max(3, data.BesYuzdesi ?? 3) / 100; // minimum %3
            const besKesintisi = data.BESKesintisiUygula ? brutUcret * besOrani : 0;
            const netMaas = brutUcret
                - isciSgkPrimi
                - isciIssizlikSigortaPrimi
                - uygulanacakGelirVergisi
                - uygulanacakDamgaVergisi
                - besKesintisi;

            const toplamMaliyet = (brutUcret + isverenSgkPrimi + isverenIssizlikSigortaPrimi + sgdpIsverenDestekPrimi) - SGKTesvigi;

            sonuclar.push({
                Ay: ay,
                BordroGunSayisi: data.BordroGunSayisi,
                TeknoGunSayisi: data.TeknoparkGunSayisi,
                ArgeGunSayisi: data.ArgeGunSayisi,
                KanunNo: data.KanunSecimi,
                BESOrani:data.BESKesintisiUygula ? besOrani : 0,
                BESKEsintisi:Math.round(besKesintisi * 100) / 100,
                AylikBrutUcret: Math.round(brutUcret * 100) / 100,
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
                AsgUcretVergiIstisnasi: Math.round(asgUcretVergiIstisnasi * 100) / 100,
                GelirVergisiTesvigi: Math.round(gelirVergisiTesviki * 100) / 100,
                KalanGelirVergisi: Math.round(uygulanacakGelirVergisi * 100) / 100,
                AsgUcretDamgaVergiIstisnasi: Math.round(asgUcretDamgaVergiIstisnasi * 100) / 100,
                DamgaVergisiTesvigi: Math.round(damgaVergisiTesviki * 100) / 100,
                OdenecekDamgaVergisi: Math.round(uygulanacakDamgaVergisi * 100) / 100,
                NetMaasAGIHaric: Math.round(netMaas * 100) / 100,
                NetOdenen: Math.round(netMaas * 100) / 100,
                ToplamMaliyet: Math.round(toplamMaliyet * 100) / 100,
                ToplamTesvik: Math.round((gelirVergisiTesviki + damgaVergisiTesviki + SGKTesvigi) * 100) / 100
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

            // Sonsuz (0 max demiştik) için
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


    private nettenBruteHesapla(data: HesaplamaDataDto, seciliYil: any) {
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
        let enIyiSonuc = null;

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
                    enIyiSonuc = hesaplama;
                }

                // Yeterince yakın mı?
                if (Math.abs(fark) <= 0.2) {
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

        // En iyi sonucu kontrol et
        if (enIyiSonuc && Math.abs(enIyiFark) <= 10.0) {
            return enIyiSonuc;
        }
        return [];
    }


}
