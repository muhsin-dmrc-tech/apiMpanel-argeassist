import { BadRequestException, Injectable } from '@nestjs/common';
import { Donem } from 'src/donem/entities/donem.entity';
import { DataSource } from 'typeorm';
import { FarklılarListesiData, PersonellerType, PersonelTableData, SgkHizmetListesiData } from './dto/analiz-types.dto';
import { Personel } from 'src/personel/entities/personel.entity';
import { Firma } from 'src/firmalar/entities/firma.entity';

@Injectable()
export class PdfAnalizService {
    constructor(
        private readonly dataSource: DataSource,
    ) { }



    async gunDetayliRaporAnaliz(texts: string[], seciliDonem: Donem, FirmaID: number, personelGuncelle: boolean) {
        const isDogruBelge = texts.some(t =>
            t.trim().toLocaleLowerCase('tr-TR') === 'dönem çalışma süresi raporu'
        );

        if (!isDogruBelge) {
            return { error: `Devam edebilmeniz için bu adımda ${seciliDonem.DonemAdi ? seciliDonem.DonemAdi + ' dönemine' : 'seçilen döneme'} ait 'Dönem Çalışma Süresi Raporu'nu yüklemeniz gerekmektedir.` }
        }

        let ay = '';
        let yil = '';

        const donemSatiri = texts.find(t => /^[A-ZÇĞİÖŞÜ]{3,} \d{4} \/ \d/.test(t));
        if (donemSatiri) {
            const match = donemSatiri.match(/^([A-ZÇĞİÖŞÜ]+) (\d{4})/);
            if (match) {
                ay = match[1].toUpperCase();
                yil = match[2];
            }
        }

        type AylarType = {
            [key: string]: number;
        };

        const ayToNumber: AylarType = {
            'OCAK': 1, 'ŞUBAT': 2, 'MART': 3, 'NİSAN': 4,
            'MAYIS': 5, 'HAZİRAN': 6, 'TEMMUZ': 7, 'AĞUSTOS': 8,
            'EYLÜL': 9, 'EKİM': 10, 'KASIM': 11, 'ARALIK': 12
        };

        const pdfAyNumarasi = ayToNumber[ay as keyof typeof ayToNumber];

        if (pdfAyNumarasi !== seciliDonem.Ay || parseInt(yil) !== seciliDonem.Yil) {
            return { error: `Yüklediğiniz PDF belgesi ile seçili dönem uyuşmamaktadır. Lütfen ${seciliDonem.DonemAdi ? seciliDonem.DonemAdi + ' dönemine' : 'seçilen döneme'} ait belgeyi yükleyiniz.` }
        }

        const extractedData: PersonelTableData[] = [];
        for (let i = 0; i < texts.length - 12; i++) {
            const tc = texts[i];

            // TC kimlik no yıldızlı şekilde geliyor: örnek "12*******96"
            if (/^\d{2}\*{2,}\d{2}$/.test(tc) && /^\d{2}-\d{2}-\d{4}$/.test(texts[i + 2])) {
                const personel = texts[i + 1];
                const baslangicTarihi = texts[i + 2];
                const gelirVergiIstisnasi = texts[i + 10]?.replace(",", ".");
                const sigortaPrimiIsverenHissesi = texts[i + 11]?.replace(",", ".");
                const nameArray = personel.split(' ');
                const ad = nameArray.slice(0, -1).join(' ');
                const soyAd = nameArray[nameArray.length - 1];


                extractedData.push({
                    tcKimlikNo: tc,
                    ad,
                    soyAd,
                    baslangicTarihi,
                    gelirVergiIstisnasi,
                    sigortaPrimiIsverenHissesi,
                });

                i += 11;
            }
        }
        //sistemde olmayan personelleri kaydet
        if (personelGuncelle) {
            await this.handlePersonelOperations(extractedData, FirmaID)
        }
        return extractedData;
    }


    async sgkHizmet(texts: string[], seciliDonem: Donem, FirmaID: number, gunDetayliRaporPersoneller: PersonelTableData[], personelGuncelle: boolean): Promise<{ geciciListe: FarklılarListesiData[], farklilar: FarklılarListesiData[] } | { error: string }> {


        let personeller: PersonellerType[];



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


        //sistemde olmayan personelleri kaydet
        if (personelGuncelle) {
            await this.handlePersonelOperations(geciciListe, FirmaID)
        }
        personeller = await this.personellerIzinBilgisi(FirmaID, seciliDonem.DonemID)
        const farklilar: FarklılarListesiData[] = [];

        if (geciciListe.length > 0) {
            geciciListe.forEach(sgkPersonel => {
                let izinliGun = 0;
                //Gün detaylı rapordakilerle eşleşen personeller
                const personel = gunDetayliRaporPersoneller.find(p =>
                    (p.ad + ' ' + p.soyAd).trim().toLocaleUpperCase('tr-TR') === (sgkPersonel.ad + ' ' + sgkPersonel.soyAd).trim().toLocaleUpperCase('tr-TR')
                );

                // Personel kaydı ile eşleşen personeller tablosundaki kayıt
                const personelKaydi = personeller.find(p =>
                    (p.AdSoyad).trim().toLocaleUpperCase('tr-TR') === (sgkPersonel.ad + ' ' + sgkPersonel.soyAd).trim().toLocaleUpperCase('tr-TR')
                );

                if (personel) {
                    // Gün sayısı kontrolü
                    const sgkGun = sgkPersonel.Gun ?? 0;
                    const beklenenGun = parseInt(personel.sigortaPrimiIsverenHissesi);
                    let aciklama = '';

                    if (sgkGun > beklenenGun) {
                        aciklama = `${personelKaydi?.AdSoyad} ${beklenenGun} olması gerekmektedir.`;

                        if (personelKaydi && personelKaydi.IzinliGunSayisi > 0) {
                            izinliGun = personelKaydi.IzinliGunSayisi;
                        }

                        farklilar.push({
                            ...sgkPersonel,
                            Aciklama: aciklama,
                            izinliGun
                        });
                    }
                }
            });
        }


        return {
            geciciListe,
            farklilar
        };
    }


    async muhtasarVePrim(pdfData: {
        pageCount: number;
        pages: {
            texts: {
                str: string;
                x: number;
                y: number;
            }[];
            page: number;
        }[];
    }, seciliDonem: Donem, FirmaID: number, sgkHizmetListesi: SgkHizmetListesiData[], personelGuncelle: boolean, isOrtagiList?: any) {
        let personeller: PersonellerType[];
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

        //sistemde olmayan personelleri kaydet
        if (isOrtagiList && Object.keys(isOrtagiList).length > 0 && personelGuncelle) {
            await this.handlePersonelOperations(geciciListe, FirmaID, isOrtagiList)
        }

        personeller = await this.personellerIzinBilgisi(FirmaID, seciliDonem.DonemID)

        const farklilar: FarklılarListesiData[] = [];

        if (geciciListe.length > 0) {
            const ortaklar = isOrtagiList && Object.keys(isOrtagiList).length > 0
                ? Object.keys(isOrtagiList).filter(tcNo => isOrtagiList[tcNo] === true)
                : [];

            geciciListe.forEach(muhtasarper => {
                const personel = sgkHizmetListesi.find(p =>
                    (p.ad + ' ' + p.soyAd).trim().toLocaleUpperCase('tr-TR') === (muhtasarper.ad + ' ' + muhtasarper.soyAd).trim().toLocaleUpperCase('tr-TR')
                );

                const personelKaydi = personeller?.find(p =>
                    (p.AdSoyad).trim().toLocaleUpperCase('tr-TR') === (muhtasarper.ad + ' ' + muhtasarper.soyAd).trim().toLocaleUpperCase('tr-TR')
                );

                if (!personel) {
                    let personelSirketOrtagimi = null;
                    if (personelKaydi) {
                        personelSirketOrtagimi = personeller.find(p => p.TCNo.trim() === personelKaydi.TCNo.trim());
                    }

                    if (ortaklar && ortaklar.length > 0 && (!personelSirketOrtagimi || !personelSirketOrtagimi.SirketOrtagi)) {
                        personelSirketOrtagimi = ortaklar.find(p => p.trim() === personelKaydi.TCNo.trim());
                    }


                    if (!personelSirketOrtagimi || !personelSirketOrtagimi.SirketOrtagi) {
                        farklilar.push({
                            ...muhtasarper,
                            Aciklama: !personelKaydi ? 'SGK Hizmet listesinde ve Sistemde Personel kaydı bulunamadı' : 'SGK Hizmet listesinde bulunmayan personel'
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




    private async handlePersonelOperations(personelList: FarklılarListesiData[], FirmaID: number, isOrtagiList?: any) {
        if (!personelList.length) return;

        try {
            const firma = await this.dataSource.getRepository(Firma).findOne({
                where: { FirmaID: FirmaID }
            });

            if (!firma) {
                throw new BadRequestException('Firma bilgileri bulunamadı');
            }

            const personeller = await this.dataSource.getRepository(Personel).find({
                where: { IliskiID: firma.FirmaID, Tip: 1 }
            });

            const personelIliskileri = await this.dataSource.getRepository(Personel)
                .createQueryBuilder('p')
                .leftJoin('p.PdksKayitlari', 'pdks')
                .leftJoin('p.BordroKayitlari', 'bordro')
                .leftJoin('p.IzinTalepleri', 'izin')
                .where('p.IliskiID = :firmaId AND p.Tip = 1', { firmaId: firma.FirmaID })
                .groupBy('p.PersonelID')
                .select([
                    'p.PersonelID AS id',
                    `CASE WHEN COUNT(pdks.PDKSID) > 0 THEN 1 ELSE 0 END AS hasPdks`,
                    `CASE WHEN COUNT(bordro.BordroKayitID) > 0 THEN 1 ELSE 0 END AS hasBordro`,
                    `CASE WHEN COUNT(izin.IzinTalepID) > 0 THEN 1 ELSE 0 END AS hasIzin`
                ])
                .getRawMany();


            const updatePersoneller: Personel[] = [];
            const createPersoneller: Personel[] = [];

            // isOrtagiList'i kontrol et
            const ortaklar = isOrtagiList && Object.keys(isOrtagiList).length > 0
                ? Object.keys(isOrtagiList).filter(tcNo => isOrtagiList[tcNo] === true)
                : [];


            for (const item of personelList) {
                // Ad Soyad kontrolü
                const fullName = `${item.ad} ${item.soyAd}`.trim().toLocaleUpperCase('tr-TR');
                const adSoyadEslesen = personeller.find(p => p.AdSoyad.trim().toLocaleUpperCase('tr-TR') === fullName);

                const tcNoEslesen = personeller.find(p =>
                    p.TCNo.slice(0, 2) === item.tcKimlikNo.slice(0, 2) &&
                    p.TCNo.slice(-2) === item.tcKimlikNo.slice(-2)
                );

                if (adSoyadEslesen && (tcNoEslesen || !adSoyadEslesen.TCNo || adSoyadEslesen.TCNo?.length < 11)) {
                    let silinmeyen = adSoyadEslesen;
                    if (tcNoEslesen) {
                        if (adSoyadEslesen.PersonelID !== tcNoEslesen.PersonelID) {
                            const iliskiVarmiAdSoyad = personelIliskileri.find(i => i.id === adSoyadEslesen.PersonelID && (i.hasPdks == 1 || i.hasBordro == 1 || i.hasIzin == 1));
                            const iliskiVarmiTcNo = personelIliskileri.find(i => i.id === tcNoEslesen.PersonelID && (i.hasPdks == 1 || i.hasBordro == 1 || i.hasIzin == 1));

                            if (!iliskiVarmiTcNo && !tcNoEslesen.KullaniciID) {
                                await this.dataSource.getRepository(Personel).delete({ PersonelID: tcNoEslesen.PersonelID })
                                silinmeyen = adSoyadEslesen
                            } else if (!iliskiVarmiAdSoyad && !adSoyadEslesen.KullaniciID) {
                                await this.dataSource.getRepository(Personel).delete({ PersonelID: adSoyadEslesen.PersonelID })
                                silinmeyen = tcNoEslesen
                            }
                        }
                    }


                    const newTCNO = silinmeyen.TCNo.includes('*') ?
                        (item.tcKimlikNo.includes('*') ? silinmeyen.TCNo : item.tcKimlikNo) :
                        silinmeyen.TCNo;

                    const iseBaslamaTarihi = silinmeyen.IseGirisTarihi ?
                        silinmeyen.IseGirisTarihi :
                        (item.baslangicTarihi ? this.parseDate(item.baslangicTarihi) : null)

                    const isOrtak = ortaklar.some(p => {
                        if (!p || p.length < 4) return false;

                        const existingTcStart = p.slice(0, 2);
                        const existingTcEnd = p.slice(-2);
                        const newTcStart = item.tcKimlikNo.slice(0, 2);
                        const newTcEnd = item.tcKimlikNo.slice(-2);

                        return existingTcStart === newTcStart && existingTcEnd === newTcEnd;
                    });

                    const degistimi = newTCNO === silinmeyen.TCNo && isOrtak === silinmeyen.SirketOrtagi && new Date(iseBaslamaTarihi) === new Date(silinmeyen.IseGirisTarihi);

                    if (!degistimi) {
                        updatePersoneller.push({
                            ...silinmeyen,
                            TCNo: newTCNO,
                            SirketOrtagi: isOrtak,
                            IseGirisTarihi: iseBaslamaTarihi
                        });
                    }

                } else if (!adSoyadEslesen && tcNoEslesen && (tcNoEslesen.TCNo.trim() === item.tcKimlikNo.trim()) && !tcNoEslesen.TCNo.includes('*')) {

                    const iseBaslamaTarihi = tcNoEslesen.IseGirisTarihi ?
                        tcNoEslesen.IseGirisTarihi :
                        (item.baslangicTarihi ? this.parseDate(item.baslangicTarihi) : null)

                    const isOrtak = ortaklar.some(p => {
                        if (!p || p.length < 4) return false;

                        const existingTcStart = p.slice(0, 2);
                        const existingTcEnd = p.slice(-2);
                        const newTcStart = item.tcKimlikNo.slice(0, 2);
                        const newTcEnd = item.tcKimlikNo.slice(-2);

                        return existingTcStart === newTcStart && existingTcEnd === newTcEnd;
                    });
                    const degistimi = isOrtak === tcNoEslesen.SirketOrtagi && new Date(iseBaslamaTarihi) === new Date(tcNoEslesen.IseGirisTarihi);

                    if (!degistimi) {
                        updatePersoneller.push({
                            ...tcNoEslesen,
                            SirketOrtagi: isOrtak,
                            IseGirisTarihi: iseBaslamaTarihi
                        });
                    }
                } else {
                    const iseGirisTarihi = item.baslangicTarihi ? this.parseDate(item.baslangicTarihi) : new Date();
                    const isOrtak = ortaklar.some(p => {
                        if (!p || p.length < 4) return false;

                        const existingTcStart = p.slice(0, 2);
                        const existingTcEnd = p.slice(-2);
                        const newTcStart = item.tcKimlikNo.slice(0, 2);
                        const newTcEnd = item.tcKimlikNo.slice(-2);

                        return existingTcStart === newTcStart && existingTcEnd === newTcEnd;
                    });
                    const yeniPersonel = this.dataSource.getRepository(Personel).create({
                        IliskiID: firma.FirmaID,
                        Tip: 1,
                        AdSoyad: `${item.ad} ${item.soyAd}`.trim(),
                        TCNo: item.tcKimlikNo,
                        IseGirisTarihi: iseGirisTarihi,
                        MesaiBaslangic: firma.MesaiBaslangic || '09:00',
                        MesaiBitis: firma.MesaiBitis || '18:00',
                        SirketOrtagi: isOrtak
                    });
                    createPersoneller.push(yeniPersonel);
                }

            }

            for (const personel of updatePersoneller) {
                await this.dataSource.getRepository(Personel).update({ PersonelID: personel.PersonelID },
                    {
                        SirketOrtagi: personel.SirketOrtagi,
                        IseGirisTarihi: personel.IseGirisTarihi,
                        TCNo: personel.TCNo
                    });
            }

            for (const personel of createPersoneller) {
                await this.dataSource.getRepository(Personel).save(personel);
            }


        } catch (error) {
            console.error('Personel işlemleri hatası:', error);
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



    // Tarih parse yardımcı metodu
    private parseDate(dateString: string): Date | null {
        try {
            if (!dateString) return null;

            // Farklı tarih formatlarını kontrol et
            let date = new Date(dateString);

            if (isNaN(date.getTime())) {
                // Eğer tarih geçersizse, farklı formatları dene
                const formats = [
                    'DD.MM.YYYY',
                    'DD-MM-YYYY',
                    'YYYY-MM-DD',
                    'DD/MM/YYYY'
                ];

                for (const format of formats) {
                    const parts = dateString.split(/[-/.]/);
                    if (parts.length === 3) {
                        if (format.startsWith('YYYY')) {
                            date = new Date(
                                parseInt(parts[0]),
                                parseInt(parts[1]) - 1,
                                parseInt(parts[2])
                            );
                        } else {
                            date = new Date(
                                parseInt(parts[2]),
                                parseInt(parts[1]) - 1,
                                parseInt(parts[0])
                            );
                        }

                        if (!isNaN(date.getTime())) {
                            return date;
                        }
                    }
                }
                return null;
            }

            return date;
        } catch (error) {
            console.error('Tarih parse hatası:', error);
            return null;
        }
    }

    async onayliSgkHizmet(texts: string[], seciliDonem: Donem, FirmaID: number, personelGuncelle: boolean): Promise<{ geciciListe: FarklılarListesiData[] } | { error: string }> {

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


        //sistemde olmayan personelleri kaydet
        if (personelGuncelle) {
            await this.handlePersonelOperations(geciciListe, FirmaID)
        }




        return { geciciListe };
    }




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





    //tekrarlanan personelleri silmek için yazıldı anlık kullanım içindir ---------------------------------------------------------

    private async cleanupDuplicatePersonel(FirmaID: number) {
        try {
            console.log(`Firma ${FirmaID} için tekrarlanan personeller temizleniyor...`);

            const personeller = await this.dataSource.getRepository(Personel).find({
                where: { IliskiID: FirmaID, Tip: 1 },
                order: { PersonelID: 'ASC' } // En eski kaydı korumak için
            });

            if (!personeller.length) {
                console.log('Temizlenecek personel bulunamadı.');
                return;
            }

            const seenAdSoyad = new Map<string, number[]>(); // Ad soyad -> PersonelID listesi
            const seenTCNo = new Map<string, number[]>(); // TC key -> PersonelID listesi
            const duplicatesToDelete: number[] = [];

            console.log(`Toplam ${personeller.length} personel kontrol ediliyor...`);

            // Önce tüm personelleri grupla
            for (const personel of personeller) {
                const adSoyad = personel.AdSoyad?.trim().toUpperCase();
                const tcNo = personel.TCNo?.trim();

                // Ad Soyad gruplama
                if (adSoyad) {
                    if (!seenAdSoyad.has(adSoyad)) {
                        seenAdSoyad.set(adSoyad, []);
                    }
                    seenAdSoyad.get(adSoyad)!.push(personel.PersonelID);
                }

                // TC No gruplama (* içermeyenler için)
                if (tcNo && !tcNo.includes('*')) {
                    const tcKey = `${tcNo.slice(0, 2)}-${tcNo.slice(-2)}`;
                    if (!seenTCNo.has(tcKey)) {
                        seenTCNo.set(tcKey, []);
                    }
                    seenTCNo.get(tcKey)!.push(personel.PersonelID);
                }
            }

            // Tekrarlanan grupları işle
            const processedPersonelIDs = new Set<number>();

            // Ad Soyad tekrarları
            for (const [adSoyad, personelIDs] of seenAdSoyad) {
                if (personelIDs.length > 1) {
                    console.log(`Tekrarlanan Ad Soyad: ${adSoyad} - ${personelIDs.length} kayıt`);
                    const toKeep = await this.selectPersonelToKeep(personelIDs);
                    const toDelete = personelIDs.filter(id => id !== toKeep);
                    duplicatesToDelete.push(...toDelete);
                    processedPersonelIDs.add(toKeep);
                    toDelete.forEach(id => processedPersonelIDs.add(id));
                }
            }

            // TC No tekrarları (henüz işlenmemiş olanlar)
            for (const [tcKey, personelIDs] of seenTCNo) {
                if (personelIDs.length > 1) {
                    const unprocessed = personelIDs.filter(id => !processedPersonelIDs.has(id));
                    if (unprocessed.length > 1) {
                        console.log(`Tekrarlanan TC No: ${tcKey} - ${unprocessed.length} kayıt`);
                        const toKeep = await this.selectPersonelToKeep(unprocessed);
                        const toDelete = unprocessed.filter(id => id !== toKeep);
                        duplicatesToDelete.push(...toDelete);
                    }
                }
            }

            if (duplicatesToDelete.length > 0) {
                console.log(`${duplicatesToDelete.length} tekrarlanan personel siliniyor...`);

                // Her personeli kontrol et ve sadece ilişkisi olmayanları sil
                let deletedCount = 0;
                let skippedCount = 0;

                for (let i = 0; i < duplicatesToDelete.length; i++) {
                    const personelID = duplicatesToDelete[i];

                    try {
                        console.log(`${i + 1}/${duplicatesToDelete.length} - PersonelID: ${personelID} kontrol ediliyor...`);

                        // İlişkili kayıt var mı kontrol et
                        const hasRelations = await this.checkPersonelHasRelations(personelID);

                        if (hasRelations) {
                            console.log(`⚠️  PersonelID: ${personelID} atlandı (ilişkili kayıtlar var)`);
                            skippedCount++;
                        } else {
                            // İlişkisi yok, güvenle sil
                            await this.dataSource.getRepository(Personel).delete(personelID);
                            console.log(`✅ PersonelID: ${personelID} silindi`);
                            deletedCount++;
                        }

                    } catch (error) {
                        console.error(`❌ PersonelID: ${personelID} silinirken hata:`, error.message);
                        skippedCount++;
                    }
                }

                console.log(`✅ Temizleme tamamlandı. ${deletedCount} personel silindi, ${skippedCount} personel atlandı.`);
            } else {
                console.log('✅ Tekrarlanan personel bulunamadı.');
            }

            // Son durum raporu
            const finalCount = await this.dataSource.getRepository(Personel).count({
                where: { IliskiID: FirmaID, Tip: 1 }
            });
            console.log(`📊 Temizlik sonrası toplam personel sayısı: ${finalCount}`);

        } catch (error) {
            console.error('❌ Personel temizleme hatası:', error);
            throw error;
        }
    }

    // Tüm firmaları temizlemek için kullanabileceğiniz fonksiyon
    private async cleanupAllFirmaPersonel() {
        try {
            console.log('Tüm firmalar için personel temizliği başlatılıyor...');

            const firmalar = await this.dataSource.getRepository(Firma).find({
                select: ['FirmaID', 'FirmaAdi']
            });

            console.log(`${firmalar.length} firma bulundu.`);

            for (const firma of firmalar) {
                console.log(`\n🏢 ${firma.FirmaAdi} (ID: ${firma.FirmaID}) temizleniyor...`);
                await this.cleanupDuplicatePersonel(firma.FirmaID);
            }

            console.log('\n🎉 Tüm firmaların personel temizliği tamamlandı!');

        } catch (error) {
            console.error('❌ Genel temizleme hatası:', error);
            throw error;
        }
    }

    // Hangi personeli tutacağını belirleyen fonksiyon (ilişkili olanı tercih eder)
    private async selectPersonelToKeep(personelIDs: number[]): Promise<number> {
        try {
            // Her personel için ilişki durumunu kontrol et
            const personelWithRelations: { id: number, hasRelations: boolean, iseGirisTarihi: Date }[] = [];

            for (const personelID of personelIDs) {
                const hasRelations = await this.checkPersonelHasRelations(personelID);
                const personel = await this.dataSource.getRepository(Personel).findOne({
                    where: { PersonelID: personelID },
                    select: ['PersonelID', 'IseGirisTarihi']
                });

                personelWithRelations.push({
                    id: personelID,
                    hasRelations,
                    iseGirisTarihi: personel?.IseGirisTarihi || new Date()
                });
            }

            // Öncelik sırası: 1) İlişkili olanlar, 2) En eski işe giriş tarihi
            personelWithRelations.sort((a, b) => {
                // İlişkili olanlar önce
                if (a.hasRelations && !b.hasRelations) return -1;
                if (!a.hasRelations && b.hasRelations) return 1;

                // İkisi de aynı durumda ise en eski işe giriş tarihi
                return new Date(a.iseGirisTarihi).getTime() - new Date(b.iseGirisTarihi).getTime();
            });

            const selected = personelWithRelations[0].id;
            console.log(`📌 PersonelID: ${selected} tutulacak (${personelWithRelations[0].hasRelations ? 'ilişkili' : 'ilişkisiz'})`);

            return selected;
        } catch (error) {
            console.error('Personel seçimi hatası:', error);
            // Hata durumunda ilk PersonelID'yi döndür
            return personelIDs[0];
        }
    }

    // İlişkili kayıt kontrolü (hızlı)
    private async checkPersonelHasRelations(personelID: number): Promise<boolean> {
        try {
            // Sadece ana ilişki tablosunu kontrol et (performans için)
            const result = await this.dataSource.query(
                'SELECT COUNT(*) as count FROM DisaridaGecirilenForm WHERE PersonelID = @0',
                [personelID]
            );

            return (result[0]?.count || 0) > 0;
        } catch (error) {
            // Hata durumunda güvenli tarafta kal
            console.log(`PersonelID ${personelID} ilişki kontrolü hatası, güvenli tarafta kalınıyor`);
            return true;
        }
    }


    private async previewDuplicatePersonel(FirmaID: number) {
        try {
            console.log(`Firma ${FirmaID} için tekrarlanan personeller kontrol ediliyor... (Silme yapılmayacak)`);

            const personeller = await this.dataSource.getRepository(Personel).find({
                where: { IliskiID: FirmaID, Tip: 1 },
                order: { PersonelID: 'ASC' }
            });

            const seenAdSoyad = new Set<string>();
            const seenTCNo = new Set<string>();
            const duplicates: any[] = [];

            for (const personel of personeller) {
                let isDuplicate = false;
                let duplicateReason = '';
                const adSoyad = personel.AdSoyad?.trim().toUpperCase();
                const tcNo = personel.TCNo?.trim();

                // Ad Soyad kontrolü
                if (adSoyad && seenAdSoyad.has(adSoyad)) {
                    isDuplicate = true;
                    duplicateReason += 'Ad Soyad tekrarı; ';
                }

                // TC No kontrolü
                if (tcNo && !tcNo.includes('*')) {
                    const tcKey = `${tcNo.slice(0, 2)}-${tcNo.slice(-2)}`;
                    if (seenTCNo.has(tcKey)) {
                        isDuplicate = true;
                        duplicateReason += 'TC No tekrarı; ';
                    } else {
                        seenTCNo.add(tcKey);
                    }
                }

                if (isDuplicate) {
                    duplicates.push({
                        PersonelID: personel.PersonelID,
                        AdSoyad: personel.AdSoyad,
                        TCNo: personel.TCNo,
                        IseGirisTarihi: personel.IseGirisTarihi,
                        Reason: duplicateReason.slice(0, -2)
                    });
                } else {
                    if (adSoyad) {
                        seenAdSoyad.add(adSoyad);
                    }
                }
            }

            console.log(`📋 Toplam ${duplicates.length} tekrarlanan personel bulundu:`);
            duplicates.forEach(dup => {
                console.log(`- ID: ${dup.PersonelID}, Ad Soyad: ${dup.AdSoyad}, TC: ${dup.TCNo}, Sebep: ${dup.Reason}`);
            });

            return duplicates;

        } catch (error) {
            console.error('❌ Önizleme hatası:', error);
            throw error;
        }
    }
}
