import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { FaturaBilgileri } from './entities/fatura-bilgileri.entity';
import { CreateFaturaBilgiDto } from './dto/create.dto';

@Injectable()
export class FaturaBilgileriService {
    constructor(
        @InjectRepository(FaturaBilgileri)
        private readonly faturaBilgiRepository: Repository<FaturaBilgileri>,
        private readonly dataSource: DataSource
    ) { }

    async getFaturaBilgiItem(userId: number) {
        if (!userId) {
            throw new BadRequestException('Firma ID gereklidir');
        }
        try {
            const fatura = await this.dataSource
                .getRepository(FaturaBilgileri)
                .createQueryBuilder("faturabilgi")
                .leftJoinAndSelect("faturabilgi.Kullanici", "Kullanici")
                .where("faturabilgi.KullaniciID = :KullaniciID", { KullaniciID:userId })
                .getOne();

            return fatura;
        } catch (error) {
            throw new BadRequestException('Veriler çekilirken bir hata oluştu');
        }
    }


    async upload(userId: number, data: CreateFaturaBilgiDto) {
        if (!userId) {
            throw new BadRequestException(`Kullanıcı Kimliği gereklidir`);
        }

        const user = await this.dataSource.getRepository(Kullanicilar).findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException(`Kullanıcı bulunamadı`);
        }

        if (data.Telefon) {
            const phoneRegex = /^(?:\+90|90|0)?(?:5\d{9}|\d{10})$/; // Mobil ve sabit hat numaraları
            if (!phoneRegex.test(data.Telefon)) {
                throw new BadRequestException('Geçersiz telefon numarası');
            }
        }


        let faturabilgi = await this.dataSource.getRepository(FaturaBilgileri).findOne({
            where: { KullaniciID: userId },
        });

        try {
            if (faturabilgi) {
                faturabilgi.FirmaAdi = data.FirmaAdi;
                faturabilgi.Adres = data.Adres;
                faturabilgi.Eposta = data.Eposta;
                faturabilgi.Ilce = data.Ilce;
                faturabilgi.Sehir = data.Sehir;
                faturabilgi.Telefon = data.Telefon;
                faturabilgi.VergiDairesi = data.VergiDairesi;
                faturabilgi.VergiNo = data.VergiNo;
                await this.faturaBilgiRepository.save(faturabilgi);
            } else {
                faturabilgi = await this.faturaBilgiRepository.save({
                    FirmaAdi: data.FirmaAdi,
                    KullaniciID: userId,
                    Adres: data.Adres,
                    Eposta: data.Eposta,
                    Ilce: data.Ilce,
                    Sehir: data.Sehir,
                    Telefon: data.Telefon,
                    VergiDairesi: data.VergiDairesi,
                    VergiNo: data.VergiNo,
                });
            }

            return faturabilgi;
        } catch (error) {
            console.error('Fatura bilgisi kaydedilirken bir hata oluştu:', error);
            throw new BadRequestException(
                error.message || 'Fatura bilgisi oluşturulurken bir hata meydana geldi.'
            );
        }
    }

}
