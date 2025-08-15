import { BadRequestException, Injectable } from '@nestjs/common';
import { Donem } from 'src/donem/entities/donem.entity';
import { DataSource } from 'typeorm';
import { FarklılarListesiData, PersonellerType, PersonelTableData, SgkHizmetListesiData } from './dto/analiz-types.dto';
import { Personel } from 'src/personel/entities/personel.entity';

@Injectable()
export class PdfAnalizService {
    constructor(
        private readonly dataSource: DataSource,
    ) { }




    async muhtasarVePrim2(pdfData: {
        pageCount: number;
        pages: {
            texts: {
                str: string;
                x: number;
                y: number;
            }[];
            page: number;
        }[];
    }) {
        if (pdfData.pageCount < 1) return [] as FarklılarListesiData[];

        try {
            const allTexts: string[] = [];

            for (const page of pdfData.pages) {
                const texts = page.texts;

                const header = texts.find(t =>
                    t.str.includes('BİLDİRİM KAPSAMINDA BULUNAN İŞYERLERİNİN ÇALIŞANLARINA İLİŞKİN BİLGİLER')
                );
                if (!header) continue;

                const headerY = header.y;

                const total = texts.find(t =>
                    t.str.trim() === 'TOPLAM' && t.y > headerY
                );

                if (!total) {
                    console.warn('TOPLAM yazısı bulunamadı');
                    continue;
                }

                const totalY = total.y;

                // Hedef alan
                const targetArea = {
                    top: headerY + 5,
                    bottom: totalY - 3,
                    left: 10,
                    right: 100
                };

                const areaTexts = texts
                    .filter(t =>
                        t.y >= targetArea.top &&
                        t.y <= targetArea.bottom &&
                        t.x >= targetArea.left &&
                        t.x <= targetArea.right &&
                        t.str.trim() !== 'TOPLAM'
                    )
                    .map(t => t.str.trim())
                    .filter(Boolean);

                allTexts.push(...areaTexts);
            }

            const processedResults = this.processTexts(allTexts);

            const finalResults = processedResults.map(item => {
                const dateMatch = item.adSoyad.match(/(\d{2}\/\d{2}\/\d{4})/);
                const baslangicTarihi = dateMatch ? dateMatch[0] : '---';

                let fullName = item.adSoyad
                    .replace(dateMatch ? dateMatch[0] : '', '')
                    .trim();

                // Sayıları baştan temizle (örnek: '75.292,88 11.742,88 90.595,53')
                const blacklist = ['Ücret', 'Matrahı', 'SGK', 'Prim', 'Gün', 'Toplam', 'Gün Sayısı'];
                blacklist.forEach(term => {
                    const pattern = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'); // özel karakterleri kaçır
                    fullName = fullName.replace(pattern, '');
                });

                // Fazla boşlukları tek boşluğa indir
                fullName = fullName
                    .replace(/^([\d.,]+\s+)+/, '')    // Baştaki sayı bloklarını temizle
                    .replace(/(\s+[\d.,]+)+$/, '')    // Sondaki sayı bloklarını temizle
                    .replace(/\s{2,}/g, ' ')          // Çoklu boşlukları temizle
                    .trim();

                const nameParts = fullName.split(' ');
                const soyAd = nameParts.pop() || '';
                const ad = nameParts.join(' ');

                return {
                    tcKimlikNo: item.tcKimlikNo,
                    ad: ad || '-',
                    soyAd: soyAd || '-',
                    baslangicTarihi: baslangicTarihi
                };
            });


            return finalResults;

        } catch (error) {
            console.error('PDF işleme hatası:', error);
        }
    }


    private processTexts(texts: string[]): { tcKimlikNo: string; adSoyad: string }[] {
        const results: { tcKimlikNo: string; adSoyad: string }[] = [];
        let currentTC = '';
        let currentName = '';

        const endIndex = texts.findIndex(text => text === 'İşyeri Bilgileri');

        for (let i = 0; i < (endIndex === -1 ? texts.length : endIndex); i++) {
            const text = texts[i];

            if (/^\d{11}$/.test(text)) {
                if (currentTC && currentName) {
                    results.push({
                        tcKimlikNo: currentTC,
                        adSoyad: currentName.trim()
                    });
                }

                currentTC = text;
                currentName = '';
            }
            else if (currentTC && text !== 'İşyeri Bilgileri') {
                currentName += (currentName ? ' ' : '') + text;
            }
        }

        if (currentTC && currentName) {
            results.push({
                tcKimlikNo: currentTC,
                adSoyad: currentName.trim()
            });
        }

        return results;
    };







    /// Müşteri Paneli Fonksiyonları -----------------------------------------------------------



    async sgkHizmetMp(texts: string[], seciliDonem: Donem): Promise<{ geciciListe: FarklılarListesiData[] } | { error: string }> {

        const isSigortaliListesiBelgesi = texts.some(t =>
            t.trim().toLocaleLowerCase('tr-TR') === 'sigortalı hizmet listesi'
        );

        if (!isSigortaliListesiBelgesi) {
            return { error: `Devam edebilmeniz için bu adımda ${seciliDonem.DonemAdi ? seciliDonem.DonemAdi + ' dönemine' : 'seçilen döneme'} ait 'SİGORTALI HİZMET LİSTESİ'ni yüklemeniz gerekmektedir.` }
        }

        let yilAy = '';
        let yil = '';
        let ay = '';


        if (!yilAy) {
            const fallback = texts.find(t => /^\d{4}\/\d{2}$/.test(t));
            if (fallback) {
                yilAy = fallback;
                [yil, ay] = fallback.split('/');
            }
        }



        if (parseInt(ay) !== seciliDonem.Ay || parseInt(yil) !== seciliDonem.Yil) {
            return { error: `Yüklediğiniz PDF belgesi ile seçili dönem uyuşmamaktadır. Lütfen ${seciliDonem.DonemAdi ? seciliDonem.DonemAdi + ' dönemine' : 'seçilen döneme'} ait belgeyi yükleyiniz.` }
        }

        const geciciListe: FarklılarListesiData[] = [];

        for (let i = 0; i < texts.length; i++) {
            const sgNo = texts[i];

            if (/^\d{11}$/.test(sgNo)) {
                const ad = texts[i + 1];
                const soyad = texts[i + 2];
                const gunText = texts[i + 5];

                const gun = parseInt(gunText, 10);

                if (!isNaN(gun)) {
                    geciciListe.push({
                        tcKimlikNo: sgNo,
                        ad: ad,
                        soyAd: soyad,
                        izinliGun: 0,
                        Gun: gun,
                    });
                }

                i += 6;
            }
        }

        return {
            geciciListe
        };
    }

    async muhtasarVePrimMp(pdfData: {
        pageCount: number;
        pages: {
            texts: {
                str: string;
                x: number;
                y: number;
            }[];
            page: number;
        }[];
    }, seciliDonem: Donem, sgkHizmetListesi: SgkHizmetListesiData[], isOrtagiList?: any) {
        const allTexts: string[] = [];

        pdfData.pages?.forEach((page: any) => {
            page.texts?.forEach((textItem: any) => {
                if (textItem.str) {
                    allTexts.push(textItem.str);
                }
            });
        });


        const fullText = allTexts.join(' ').toLocaleLowerCase('tr-TR');

        const isMuhtasarBelgesi = fullText.includes('muhtasar ve prim hizmet beyannamesi');

        if (!isMuhtasarBelgesi) {
            return { error: `Devam edebilmeniz için bu adımda ${seciliDonem.DonemAdi ? seciliDonem.DonemAdi + ' dönemine' : 'seçilen döneme'} ait 'MUHTASAR VE PRİM HİZMET BEYANNAMESİ'ni yüklemeniz gerekmektedir.` }
        }

        let yil = '';
        let ay = '';
        for (let i = 0; i < allTexts?.length - 2; i++) {
            const current = allTexts[i].toLocaleLowerCase('tr-TR');
            const next2 = allTexts[i + 2]?.trim();

            if (current === 'yıl' && /^\d{4}$/.test(next2)) {
                yil = next2;
            }

            if (current === 'ay' && /^[a-zçğıöşü]{3,}$/i.test(next2)) {
                ay = next2.toLocaleUpperCase('tr-TR');
            }

            if (yil && ay) break;
        }



        const ayToNumber: Record<string, number> = {
            'OCAK': 1, 'ŞUBAT': 2, 'MART': 3, 'NİSAN': 4,
            'MAYIS': 5, 'HAZİRAN': 6, 'TEMMUZ': 7, 'AĞUSTOS': 8,
            'EYLÜL': 9, 'EKİM': 10, 'KASIM': 11, 'ARALIK': 12
        };

        const pdfAyNumarasi = ayToNumber[ay];

        if (pdfAyNumarasi !== seciliDonem.Ay || parseInt(yil) !== seciliDonem.Yil) {
            return { error: `Yüklediğiniz PDF belgesi ile seçili dönem uyuşmamaktadır. Lütfen ${seciliDonem.DonemAdi ? seciliDonem.DonemAdi + ' dönemine' : 'seçilen döneme'} ait belgeyi yükleyiniz.` }
        }

        const startIndex = allTexts.findIndex((t: any) =>
            t.includes('BİLDİRİM KAPSAMINDA BULUNAN İŞYERLERİNİN ÇALIŞANLARINA İLİŞKİN BİLGİLER')
        );
        if (startIndex === -1) {
            return { error: `Personel listesi başlangıcı bulunamadı. Lütfen geçerli bir MUHTASAR VE PRİM HİZMET BEYANNAMESİ belgesi yükleyin.` }
        }

        // Vergi ve Terkin Tutarı Tespiti
        const findAmountAfterText = (texts: string[], searchText: string): string => {
            const index = texts.findIndex(t => t.includes(searchText));
            if (index !== -1 && index + 1 < texts.length) {
                const nextText = texts[index + 1].trim();
                if (/^[\d.,]+$/.test(nextText.replace(/\s/g, ''))) {
                    return nextText;
                }
            }
            return '';
        };

        // Vergi kesinti tutarını bulmak için daha spesifik arama
        const findVergiKesinti = (texts: string[]): string => {
            const matrahIndex = texts.findIndex(t => t.includes('MATRAH VE VERGİ BİLDİRİMİ'));
            if (matrahIndex === -1) return '';

            for (let i = matrahIndex; i < texts.length; i++) {
                const currentText = texts[i];

                if (currentText === 'Toplam') {
                    const matrahValue = texts[i - 2]?.trim() || '';
                    const kesinti = texts[i - 1]?.trim() || '';

                    const matrahIsNumeric = /^[\d.,]+$/.test(matrahValue.replace(/\s/g, ''));
                    const kesintiIsNumeric = /^[\d.,]+$/.test(kesinti.replace(/\s/g, ''));

                    if (matrahIsNumeric && kesintiIsNumeric) {
                        return kesinti;
                    }
                }

                if (currentText.includes('Terkin')) {
                    break;
                }
            }

            return '';
        };

        const projeKoduAl = (): string => {
            const baslikIndex = allTexts.findIndex((t: any) => t.includes('BİLDİRİM KAPSAMINDA BULUNAN İŞYERLERİNE İLİŞKİN BİLGİLER'));
            if (baslikIndex === -1) return '';

            for (let i = baslikIndex; i < allTexts.length; i++) {
                const currentText = allTexts[i];

                if (currentText.includes('-') && currentText.length >= 5) {
                    if (currentText.match(/^[A-Z0-9-]+$/)) {
                        return currentText.trim();
                    }
                }
                if (currentText.includes('Terkin')) {
                    break;
                }
            }

            return '';
        }

        const vergiKesintiTutari = findVergiKesinti(allTexts);

        const terkinTutari = findAmountAfterText(allTexts,
            "Ücret Ödemeleri Üzerinden Yapılan Tevkifatın 4691 Say. Kanun Gereği Terkin Edilen Tutarı");

        const projeKodu = projeKoduAl();
        const muhtasarMeta = {
            vergiKesintiTutari,
            terkinTutari,
            projeKodu
        };

        let geciciListe: FarklılarListesiData[] = [];
        geciciListe = await this.muhtasarVePrim2(pdfData)


        const farklilar: FarklılarListesiData[] = [];

        if (geciciListe.length > 0) {
            const ortaklar = isOrtagiList && Object.keys(isOrtagiList).length > 0
                ? Object.keys(isOrtagiList).filter(tcNo => isOrtagiList[tcNo] === true)
                : [];



            geciciListe.forEach(muhtasarper => {
                const personel = sgkHizmetListesi.find(p =>
                    (p.ad + ' ' + p.soyAd).trim().toLocaleUpperCase('tr-TR') === (muhtasarper.ad + ' ' + muhtasarper.soyAd).trim().toLocaleUpperCase('tr-TR')
                );



                if (!personel) {

                    const isOrtak = ortaklar.some(p => {
                        if (!p || p.length < 4) return false;

                        const existingTcStart = p.slice(0, 2);
                        const existingTcEnd = p.slice(-2);
                        const newTcStart = muhtasarper.tcKimlikNo.slice(0, 2);
                        const newTcEnd = muhtasarper.tcKimlikNo.slice(-2);

                        return existingTcStart === newTcStart && existingTcEnd === newTcEnd;
                    });
                    if (!isOrtak) {
                        farklilar.push({
                            ...muhtasarper,
                            Aciklama: 'SGK Hizmet listesinde bulunmayan personel'
                        });
                    }

                }


            });

            sgkHizmetListesi.forEach(sgkPersonel => {
                const muhtaPers = geciciListe.some(muht =>
                    (muht.ad + ' ' + muht.soyAd).trim().toLocaleUpperCase('tr-TR') === (sgkPersonel.ad + ' ' + sgkPersonel.soyAd).trim().toLocaleUpperCase('tr-TR')
                );

                if (!muhtaPers) {
                    farklilar.push({
                        tcKimlikNo: sgkPersonel.tcKimlikNo,
                        ad: sgkPersonel.ad,
                        soyAd: sgkPersonel.soyAd,
                        Gun: sgkPersonel.Gun,
                        Aciklama: 'MUHTASAR VE PRİM HİZMET BEYANNAMESİ belgesinde eksik personel',
                        baslangicTarihi: ''
                    });
                }
            });

        }

        //await this.cleanupAllFirmaPersonel()

        return {
            muhtasarMeta,
            projeKodu,
            terkinTutari,
            personelListesi: { farklilar, geciciListe }
        };
    }

    async tahakkukFisiMp(texts: string[], seciliDonem: Donem): Promise<{ dataValue: any, sgkTahakkuk: any, primler: any } | { error: string }> {

        const numberFunc = (sayi: string | undefined | null) => {
            if (!sayi || typeof sayi !== 'string') return 0;
            return Number(sayi.replace(/\./g, '').replace(',', '.'));
        }
        let kisiSayisi = '';
        let gunSayisi = '';
        let toplamPrim = '';
        let primIndirimi5746 = '';
        let issizlikTutari = '';
        let primIndirimi5510 = '';

        const isDogruBelge = texts.some(t =>
            t.trim().toLocaleLowerCase('tr-TR') === 'tahakkuk fişi'
        );

        if (!isDogruBelge) {
            return { error: `Devam edebilmeniz için bu adımda ${seciliDonem.DonemAdi ? seciliDonem.DonemAdi + ' dönemine' : 'seçilen döneme'} ait SGK Tahakkuk Fişi belgesi yüklemeniz gerekmektedir.` }
        }
        //Dönem tespiti
        let ay = '';
        let yil = '';
        const donemSatiriIndex = texts.findIndex(t =>
            t.trim().toLocaleUpperCase('tr-TR') === 'SGM(KOD-AD)'
        );

        if (donemSatiriIndex > 0) {
            const oncekiSatir = texts[donemSatiriIndex - 1];
            const match = oncekiSatir.match(/^(\d{4})\/(\d{2})$/);
            if (match) {
                yil = match[1];
                const ayNumarasi = match[2];
                ay = ayNumarasi;
            }
        }


        if (parseInt(ay) !== seciliDonem.Ay || parseInt(yil) !== seciliDonem.Yil) {
            return { error: `Yüklediğiniz PDF belgesi ile seçili dönem uyuşmamaktadır. Lütfen ${seciliDonem.DonemAdi ? seciliDonem.DonemAdi + ' dönemine' : 'seçilen döneme'} ait belgeyi yükleyiniz.` }
        }


        //PRİME ESAS KAZANÇ Tespiti
        const newprimler: {
            no: number;
            aciklama: string;
            primeEsasKazanc: string;
            primOrani: string;
            primTutari: string;
        }[] = [];

        if (donemSatiriIndex > -1) {
            // "SGM(kod-ad)" satırından sonraki verileri al
            let i = donemSatiriIndex + 1;
            // İlk "1" satırını bul
            while (i < texts.length && texts[i].trim() !== "1") i++;
            let beklenenNo = 1;

            // Sıralı şekilde 1,2,3,4... bloklarını işle
            while (i + 4 < texts.length) {
                // Beklenen numara gelmiş mi?
                if (texts[i].trim() !== beklenenNo.toString()) break;

                newprimler.push({
                    no: beklenenNo,
                    aciklama: texts[i + 1]?.trim() || "",
                    primeEsasKazanc: texts[i + 2]?.trim() || "",
                    primOrani: texts[i + 3]?.trim() || "",
                    primTutari: texts[i + 4]?.trim() || "",
                });

                // Sonraki bloğa geç
                i += 5;
                beklenenNo++;
            }
        }


        //Kişi sayısı gün ve toplampirim tespiti

        if (donemSatiriIndex > -1) {
            // Primler bittiği index'i bul
            let primlerBitisIndex = donemSatiriIndex + 1;
            while (primlerBitisIndex < texts.length && texts[primlerBitisIndex].trim() !== "1") primlerBitisIndex++;
            let beklenenNo = 1;
            while (primlerBitisIndex + 4 < texts.length) {
                if (texts[primlerBitisIndex].trim() !== beklenenNo.toString()) break;
                primlerBitisIndex += 5;
                beklenenNo++;
            }

            // Primler bittikten sonra "KİŞİ SAYISI:" başlığını ara
            const kisiBaslikIndex = texts.slice(primlerBitisIndex).findIndex(t => t.trim().toLocaleUpperCase('tr-TR') === "KİŞİ SAYISI:");
            if (kisiBaslikIndex > -1) {
                const start = primlerBitisIndex + kisiBaslikIndex + 1;
                kisiSayisi = texts[start]?.trim() || '';
                gunSayisi = texts[start + 1]?.trim() || '';
                toplamPrim = texts[start + 2]?.trim() || '';
            }
        }



        //05746 SAYILI KANUNDAN DOĞAN PRİM İNDİRİMİ Tespiti
        const prirmbasligiIndex = texts.findIndex(t =>
            t.trim().toLocaleUpperCase('tr-TR') === '05746 SAYILI KANUNDAN DOĞAN PRİM İNDİRİMİ'
        );
        if (prirmbasligiIndex > 0) {
            primIndirimi5746 = texts[prirmbasligiIndex + 1];
            issizlikTutari = texts[prirmbasligiIndex + 3];
        }

        //05510 SAYILI KANUNDAN DOĞAN PRİM İNDİRİMİ Tespiti
        const prirmbasligiIndex1 = texts.findIndex(t =>
            t.trim().toLocaleUpperCase('tr-TR').includes('05510 SAYILI KANUNDAN DOĞAN PRİM İNDİRİMİ')
        );
        if (prirmbasligiIndex1 > 0) {
            primIndirimi5510 = texts[prirmbasligiIndex1 + 1];
        }

        const netPrimTutari = numberFunc(toplamPrim) - numberFunc(primIndirimi5746) - numberFunc(primIndirimi5510);

        const odenecekNetTutar = netPrimTutari + numberFunc(issizlikTutari);


        const dataValue = {
            kisiSayisi,
            gunSayisi,
            primIndirimi5510,
            primIndirimi5746,
            issizlikTutari,
            netPrimTutari: netPrimTutari.toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }),
            odenecekNetTutar: odenecekNetTutar.toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }),
            toplamPrim
        }


        if (newprimler.length < 1 || !newprimler[0].primeEsasKazanc || typeof parseInt(newprimler[0].primeEsasKazanc) !== 'number') {
            return { error: 'Prime esas kazanç tespit edilemedi. Lütfen bilgileri kontrol edip tekrar deneyin.' };
        }

        if (!toplamPrim || typeof parseInt(toplamPrim) !== 'number') {
            return { error: 'Toplam prim tespit edilemedi. Lütfen bilgileri kontrol edip tekrar deneyin.' };
        }

        if (!primIndirimi5746 || typeof parseInt(primIndirimi5746) !== 'number') {
            return { error: '05746 sayılı kanundan doğan prim indirimi tespit edilemedi. Lütfen bilgileri kontrol edip tekrar deneyin.' };
        }


        const sgkTahakkuk = {
            primeEsasKazanc: newprimler[0].primeEsasKazanc,
            toplamPrim: toplamPrim,
            istisnaTutari: primIndirimi5746
        }

        return { sgkTahakkuk, dataValue, primler: newprimler };


    }




}
