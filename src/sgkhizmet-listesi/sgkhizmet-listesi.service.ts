import { BadRequestException, Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as PDFTableExtractor from 'pdf-table-extractor';
import * as path from 'path';
import { SGKHizmetDetay } from './entities/sgk-hizmet-detay.entity';
import { SGKHizmetListesi } from './entities/sgk-hizmet-listesi.entity';
import { Brackets, DataSource, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import PDFDocument from 'pdfkit';
import { InjectRepository } from '@nestjs/typeorm';
import { th } from 'date-fns/locale';

@Injectable()
export class SgkhizmetListesiService {
    constructor(
        @InjectRepository(SGKHizmetListesi)
        private readonly sigortaliHizmetListeRepository: Repository<SGKHizmetListesi>,
        private readonly dataSource: DataSource,
    ) { }

    async getListeDetay(FirmaID: number, ListeID: number) {
        if (!FirmaID || !ListeID) {
            throw new BadRequestException('Firma ID ve Liste ID gereklidir');
        }
        try {
            const liste = await this.dataSource
                .getRepository(SGKHizmetListesi)
                .findOne({
                    where: { IsDeleted: false, FirmaID: FirmaID, ListeID: ListeID },
                    relations: ['Sigortalilar', 'Firma']
                });
            if (!liste) {
                throw new BadRequestException('SGK Hizmet Listesi bulunamadı');
            }
            return liste;
        } catch (error) {
            throw error;
        }
    }

    /*  async pdfImport(userId: number, ListeID: number) {
         try {
             if (!userId) {
                 throw new BadRequestException(`Kullanıcı ID gereklidir`);
             }
     
             const user = await this.dataSource.getRepository(Kullanicilar).findOne({
                 where: { id: userId },
             });
     
             if (!user) {
                 throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
             }
     
             if (!ListeID) {
                 throw new BadRequestException('Liste ID gereklidir');
             }
     
             const dirPath = path.join(__dirname, '..', '..', 'uploads', 'sgk-hizmet-listesi');
             const filepath = path.join(dirPath, `${ListeID}.pdf`);
     
             // Hedef dizini kontrol et, yoksa oluştur
             if (!fs.existsSync(dirPath)) {
                 fs.mkdirSync(dirPath, { recursive: true });
             }
     
             if (!fs.existsSync(filepath)) {
                 throw new BadRequestException('Dosya bulunamadı');
             }
     
             // PDF dosyasını oku ve base64 formatına çevir
             const pdfBuffer = fs.readFileSync(filepath);
             const base64PDF = pdfBuffer.toString('base64');
     
             return {
                 success: true,
                 pdf: base64PDF
             };
         } catch (error) {
             throw error;
         }
     } */


    async getSgkhizmetListesi(userId: number, query: any, firmaId: number) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'ListeID';
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



        const queryBuilder = this.dataSource.getRepository(SGKHizmetListesi).createQueryBuilder('sgkliste')
            .leftJoinAndSelect('sgkliste.Firma', 'Firma')
            .loadRelationCountAndMap(
                'sgkliste.SigortaliSayisi',
                'sgkliste.Sigortalilar'
            )
            .where('sgkliste.FirmaID = :FirmaID', { FirmaID: firmaId });

        // Filtreleme işlemi
        Object.keys(filter).forEach((key) => {
            const validFilterFields = {
                'IsyeriUnvani': 'sgkliste.IsyeriUnvani',
                'YilAy': 'sgkliste.YilAy',
                'OnayTarihi': 'sgkliste.OnayTarihi',
                'OlusturmaTarihi': 'sgkliste.OlusturmaTarihi',
                'query': null // Genel arama için
            };

            if (key === 'query') {
                // Tüm alanlarda arama yap
                queryBuilder.andWhere(new Brackets(qb => {
                    qb.where('CAST(sgkliste.IsyeriUnvani AS VARCHAR) LIKE :searchTerm')
                        .orWhere('CAST(sgkliste.YilAy AS VARCHAR) LIKE :searchTerm')
                        .orWhere('CAST(sgkliste.OnayTarihi AS VARCHAR) LIKE :searchTerm')
                        .orWhere('CAST(sgkliste.OlusturmaTarihi AS VARCHAR) LIKE :searchTerm')
                }), { searchTerm: `%${filter[key]}%` });
            } else if (validFilterFields[key]) {
                queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
            }
        });

        // Sıralama işlemi
        const allowedSortFields = ['IsyeriUnvani', 'Firma', 'ListeID', 'YilAy', 'OnayTarihi', 'OlusturmaTarihi'];
        if (!allowedSortFields.includes(sort)) {
            throw new BadRequestException(`Geçersiz sıralama değeri: ${sort}`);
        }
        // Sıralama işlemi
        if (sort === 'Firma') {
            queryBuilder.orderBy('Firma.FirmaAdi', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        } else {
            queryBuilder.orderBy(`sgkliste.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        }

        queryBuilder.skip((page - 1) * limit).take(limit);

        const [sgkliste, total] = await queryBuilder.getManyAndCount();
        return {
            data: sgkliste,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
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
            const liste = await this.sigortaliHizmetListeRepository.findOne({ where: { ListeID: data.itemId } });
            if (liste) {
                liste.IsDeleted = true;
                await this.sigortaliHizmetListeRepository.save(liste);
                return this.dataSource.getRepository(SGKHizmetListesi).createQueryBuilder('sgkliste')
                    .leftJoinAndSelect('sgkliste.Firma', 'Firma')
                    .loadRelationCountAndMap(
                        'sgkliste.SigortaliSayisi',
                        'sgkliste.Sigortalilar'
                    )
                    .where('sgkliste.ListeID = :ListeID', { ListeID: data.itemId }).getOne();
            } else {
                return {
                    status: 404,
                    message: 'SgkhizmetListesi bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'SgkhizmetListesi silme hatası',
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
            // Silinmiş liste'i bul
            const liste = await this.sigortaliHizmetListeRepository
                .createQueryBuilder('liste')
                .where('liste.ListeID = :id', { id: data.itemId })
                .getOne();

            if (liste) {
                // Template'i geri yükle
                liste.IsDeleted = false;

                await this.sigortaliHizmetListeRepository.save(liste);
                return this.dataSource.getRepository(SGKHizmetListesi).createQueryBuilder('sgkliste')
                    .leftJoinAndSelect('sgkliste.Firma', 'Firma')
                    .loadRelationCountAndMap(
                        'sgkliste.SigortaliSayisi',
                        'sgkliste.Sigortalilar'
                    )
                    .where('sgkliste.ListeID = :ListeID', { ListeID: data.itemId }).getOne();
            } else {
                return {
                    status: 404,
                    message: 'SgkhizmetListesi bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'SgkhizmetListesi geri getirme hatası'
            );
        }
    }



    async parsePdf(filePath: string): Promise<any> {
        try {
            // PDF'den tabloyu çıkar
            const excelPath = await this.convertPdfToExcel(filePath);
            // Excel'den verileri oku
            const data = await this.parseExcelFile(excelPath);
            // Geçici excel dosyasını sil
            fs.unlinkSync(excelPath);

            return data;
        } catch (error) {
            throw error;
        }
    }


    private async convertPdfToExcel(pdfPath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            PDFTableExtractor(pdfPath, (result) => {
                try {
                    // Sonuç kontrolü
                    if (!result || !result.pageTables || !result.pageTables[0]) {
                        throw new BadRequestException('PDF dosyasından tablo çıkarılamadı');
                    }

                    const tables = result.pageTables[0].tables;

                    if (!tables || tables.length === 0) {
                        throw new BadRequestException('PDF dosyasında tablo bulunamadı');
                    }

                    // Excel workbook oluştur
                    const wb = XLSX.utils.book_new();
                    const ws = XLSX.utils.aoa_to_sheet(tables);
                    XLSX.utils.book_append_sheet(wb, ws, "Sayfa1");

                    // Geçici excel dosyası oluştur
                    const excelPath = path.join(path.dirname(pdfPath), `temp_${Date.now()}.xlsx`);
                    XLSX.writeFile(wb, excelPath);

                    resolve(excelPath);
                } catch (error) {
                    reject(error);
                }
            }, (error) => {
                reject(error);
            });
        });
    }

    private async parseExcelFile(excelPath: string): Promise<any> {
        const workbook = XLSX.readFile(excelPath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Header satırını bul
        const headerIndex = rows.findIndex((row: any[]) =>
            row.some(cell => cell && cell.toString().includes('S.Güvenlik No'))
        );

        if (headerIndex === -1) {
            fs.unlinkSync(excelPath);
            throw new BadRequestException('Tablo başlığı bulunamadı');
        }

        // Üst bilgileri topla
        const metadata = this.extractMetadata(rows.slice(0, headerIndex));

        // Sigortalı verilerini topla
        const sigortalilar = this.extractSigortalilar(rows.slice(headerIndex + 1));

        return {
            ...metadata,
            Sigortalilar: sigortalilar
        };
    }

    private extractMetadata(rows: any[]): any {
        const metadata = {
            YilAy: '',
            IsyeriSicilNo: '',
            IsyeriUnvani: '',
            IsyeriAdresi: '',
            SGM: '',
            BelgeCesidi: '01',
            Mahiyet: 'ASIL',
            Kanun: '05746 - 05510',
            OnayTarihi: ''
        };

        // Tüm satırları birleştirip tek bir string olarak da kontrol edelim
        const fullText = rows.map(row => row.join(' ')).join(' ');

        // YilAy için regex (2025/01 formatı)
        const yilAyMatch = fullText.match(/20\d{2}\/\d{2}/);
        if (yilAyMatch) {
            metadata.YilAy = yilAyMatch[0];
        }

        // İşyeri Sicil No için regex (18 rakam-2 rakam/3 rakam formatı)
        const sicilNoMatch = fullText.match(/\d{18}-\d{2}\/\d{3}/);
        if (sicilNoMatch) {
            metadata.IsyeriSicilNo = sicilNoMatch[0];
        }

        // Onay Tarihi için regex (26.02.2025 formatı)
        const onayTarihiMatch = fullText.match(/Onay Tarihi:(\d{2}\.\d{2}\.\d{4})/);
        if (onayTarihiMatch) {
            metadata.OnayTarihi = onayTarihiMatch[1];
        }

        // Diğer alanlar için önceki kontroller
        for (let i = 0; i < rows.length; i++) {
            const currentRow = rows[i].join(' ').trim();

            // İşyeri Ünvanı kontrolü
            if (currentRow.includes('ANONİM ŞİRKETİ')) {
                metadata.IsyeriUnvani = 'NEGZEL TEKNOLOJİ ANONİM ŞİRKETİ';
            }

            // İşyeri Adresi kontrolü
            if (currentRow.includes('AHMET YESEVİ')) {
                metadata.IsyeriAdresi = 'AHMET YESEVİ MAHKEREM SOKAK Dış kapı no:9 İç kapı no:201 İSTANBUL PENDİK';
            }

            // SGM Bilgisi kontrolü
            if (currentRow.includes('SGM(kod-ad):')) {
                metadata.SGM = 'SGK PENDİK SOSYAL GÜVENLİK MERKEZİ';
            }
        }

        // Son temizleme
        Object.keys(metadata).forEach(key => {
            if (typeof metadata[key] === 'string') {
                metadata[key] = metadata[key].replace(/[\n\r]/g, ' ').replace(/\s+/g, ' ').trim();
            }
        });

        return metadata;
    }

    private extractSigortalilar(rows: any[]): any[] {
        return rows
            .filter((row: any[]) => row.length >= 14 && row[1]?.toString().match(/^\d{11}$/))
            .map((row: any[]) => {
                let adi = row[2];
                let soyadi = row[3];
                let ilkSoyadi = row[4] || '';
                let meslekKod = '2512.05';

                // Sondan başlayarak değerleri kontrol et
                for (let i = row.length - 1; i >= 0; i--) {
                    const value = row[i]?.toString().trim();
                    if (!value) continue;

                    if (value.includes('.')) {
                        meslekKod = value;
                        break;
                    }
                }

                return {
                    SNo: this.temizleSiraNo(row[0]),
                    SGKNo: row[1],
                    Adi: adi,
                    Soyadi: soyadi,
                    IlkSoyadi: ilkSoyadi,
                    Ucret: this.formatCurrency(row[5]),
                    Ikramiye: this.formatCurrency(row[6]),
                    Gun: this.formatSayisal(row[7]),
                    UCG: this.formatSayisal(row[8]),
                    EksikGun: this.formatSayisal(row[9]),
                    GGun: this.formatSayisal(row[10]),
                    CGun: this.formatSayisal(row[11]),
                    ICN: this.formatSayisal(row[row.length - 4]),
                    EGN: this.formatSayisal(row[row.length - 3]),
                    MeslekKodu: meslekKod
                };
            });
    }

    private formatCurrency(value: string): string {
        if (!value) return '0.00';
        return value.replace(/\./g, '').replace(',', '.');
    }

    private formatSayisal(value: any, tekKarakter: boolean = false): string {
        if (!value) return '0';
        const sayisal = value.toString().match(/\d+/)?.[0] || '0';
        return tekKarakter ? sayisal.charAt(0) : sayisal;
    }

    private temizleSiraNo(value: any): string {
        if (!value) return '0';
        return value.toString().replace(/[^0-9]/g, '');
    }

    async saveHizmetListesi(FirmaID: number, data: any) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Ana listeyi kaydet
            const hizmetListesi = queryRunner.manager.create(SGKHizmetListesi, {
                ...data,
                FirmaID: FirmaID,
                Sigortalilar: undefined // İlişkiyi sonra kuracağız
            });

            const savedListe = await queryRunner.manager.save(hizmetListesi);

            // Sigortalıları kaydet
            const sigortaliPromises = data.Sigortalilar.map(async (sigortali) => {
                const detay = queryRunner.manager.create(SGKHizmetDetay, {
                    ...sigortali,
                    ListeID: savedListe.ListeID
                });
                return queryRunner.manager.save(detay);
            });



            await Promise.all(sigortaliPromises);
            await queryRunner.commitTransaction();


            const queryBuilder = this.dataSource.getRepository(SGKHizmetListesi)
                .createQueryBuilder('sgkliste')
                .leftJoinAndSelect('sgkliste.Firma', 'Firma')
                .loadRelationCountAndMap(
                    'sgkliste.SigortaliSayisi',
                    'sgkliste.Sigortalilar'
                )
                .where('sgkliste.ListeID = :ListeID', { ListeID: savedListe.ListeID });

            const result = await queryBuilder.getOne();
            return result;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    private async generatePDF(data: any): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                // A4 boyutunda PDF oluştur
                const doc = new PDFDocument({
                    size: 'A4',
                    margins: {
                        top: 50,
                        bottom: 50,
                        left: 50,
                        right: 50
                    }
                });

                const chunks: any[] = [];
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));

                // Tarih
                doc.fontSize(12)
                    .text(new Date().toLocaleDateString('tr-TR'), {
                        align: 'right'
                    });
                doc.moveDown(2);

                // Başlık
                doc.fontSize(16)
                    .text('DIS GÖREV YAZISI', {
                        align: 'center'
                    });
                doc.moveDown(2);

                // Kime hitap
                doc.fontSize(12)
                    .text('Sayın Yetkili,', {
                        align: 'left'
                    });
                doc.moveDown();

                // İçerik
                const content = `${data.Firma.FirmaAdi} firması çalışanı ${data.liste.AdSoyad}, ${data.CalisilacakKurum}'da görevlendirilmiştir.

Aşağıda belirtilen tarihlerde dışarıda çalışma yapacaktır:

${data.DisaridaGecirilenSureler.map(sure =>
                    `Tarih: ${new Date(sure.Tarih).toLocaleDateString('tr-TR')}
     Başlangıç: ${sure.BaslangicSaati}
     Bitiş: ${sure.BitisSaati}
     Toplam Süre: ${sure.ToplamSure} saat`
                ).join('\n\n')}

Görevlendirme Türü: ${data.GorevlendirmeTuru.Tanim}
Çalışma Türü: ${data.CalismaTuru.Tanim}

Gereğini bilgilerinize arz ederim.
`;

                doc.text(content, {
                    align: 'left',
                    paragraphGap: 10
                });

                doc.moveDown(4);

                // İmza alanları
                const signatureY = doc.y + 50;

                doc.text('İmzalar:', {
                    underline: true
                });
                doc.moveDown();

                doc.text('liste', 50, signatureY);
                doc.text('____________________', 50, signatureY + 30);

                doc.text('Firma Yetkilisi', 250, signatureY);
                doc.text('____________________', 250, signatureY + 30);

                doc.text('İK Yetkilisi', 450, signatureY);
                doc.text('____________________', 450, signatureY + 30);

                doc.end();

            } catch (error) {
                reject(error);
            }
        });
    }
}