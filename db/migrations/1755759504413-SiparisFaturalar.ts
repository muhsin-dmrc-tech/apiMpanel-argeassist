import { MigrationInterface, QueryRunner } from "typeorm";

export class SiparisFaturalar1755759504413 implements MigrationInterface {
    name = 'SiparisFaturalar1755759504413'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "FaturaBilgileri" ("FaturaBilgiID" bigint NOT NULL IDENTITY(1,1), "KullaniciID" int NOT NULL, "FirmaAdi" varchar(255) NOT NULL, "VergiNo" varchar(50) NOT NULL, "VergiDairesi" varchar(100) NOT NULL, "Adres" text NOT NULL, "Sehir" varchar(100) NOT NULL, "Ilce" varchar(100) NOT NULL, "Telefon" varchar(100) NOT NULL, "Eposta" varchar(255) NOT NULL, "VarsayilanMi" bit CONSTRAINT "DF_5a9d99bbf4ebd9be330f9ad0510" DEFAULT 1, "OlusturmaTarihi" datetime NOT NULL CONSTRAINT "DF_9f96b69bda3c4963f6c0de0c43a" DEFAULT getdate(), "IsDeleted" bit CONSTRAINT "DF_33ecfc5a21c98f50c42fc26dfd7" DEFAULT 0, "DeletedAt" datetime, CONSTRAINT "PK_edeb1eb4d59924527c48930f3d0" PRIMARY KEY ("FaturaBilgiID"))`);
        await queryRunner.query(`CREATE TABLE "FirmaAbonelikleri" ("AbonelikID" bigint NOT NULL IDENTITY(1,1), "KullaniciID" int NOT NULL, "AbonelikPlanID" bigint NOT NULL, "BaslangicTarihi" datetime NOT NULL, "BitisTarihi" datetime NOT NULL, "Durum" varchar(50) NOT NULL, "OtomatikYenileme" bit NOT NULL CONSTRAINT "DF_15b5696ccb309727c2d5955daa5" DEFAULT 0, "IsDeleted" bit CONSTRAINT "DF_df6a1c34f17e06d97bab7942578" DEFAULT 0, "DeletedAt" datetime, CONSTRAINT "PK_5c44ca6ccdfbeada5e6570c97f2" PRIMARY KEY ("AbonelikID"))`);
        await queryRunner.query(`CREATE TABLE "Faturalar" ("FaturaID" bigint NOT NULL IDENTITY(1,1), "AbonelikID" bigint NOT NULL, "KullaniciID" int NOT NULL, "FaturaBilgiID" bigint NOT NULL, "FaturaTarihi" datetime NOT NULL, "SonOdemeTarihi" datetime, "Tutar" decimal(10,2) NOT NULL, "Durum" varchar(50) NOT NULL, "IsDeleted" bit CONSTRAINT "DF_7cad2952321b42a684b1bc63edc" DEFAULT 0, "DeletedAt" datetime, CONSTRAINT "PK_3d5ee23c5aae22c982cb07f804c" PRIMARY KEY ("FaturaID"))`);
        await queryRunner.query(`CREATE TABLE "Siparisler" ("SiparisID" bigint NOT NULL IDENTITY(1,1), "AbonelikPlanID" bigint NOT NULL, "KullaniciID" int NOT NULL, "FaturaBilgiID" bigint, "FaturaID" bigint, "OlusturmaTarihi" datetime NOT NULL CONSTRAINT "DF_cf14cb18b56988135d95a29c3cd" DEFAULT getdate(), "OdemeTarihi" datetime, "OdemeVadesi" varchar(255), "Tutar" decimal(10,2) NOT NULL, "Durum" varchar(50) NOT NULL, "OdenmemeSebebi" text, "IsDeleted" bit CONSTRAINT "DF_fe8c5b6badbb62f4ade833c71b6" DEFAULT 0, "DeletedAt" datetime, CONSTRAINT "PK_1e5c8081255d29d39abe725a1e7" PRIMARY KEY ("SiparisID"))`);
        await queryRunner.query(`ALTER TABLE "FaturaBilgileri" ADD CONSTRAINT "FK_f6a02ca202abffcb79d800227e0" FOREIGN KEY ("KullaniciID") REFERENCES "Kullanicilar"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "FirmaAbonelikleri" ADD CONSTRAINT "FK_4bd13d9aacfb95bd184b4d10012" FOREIGN KEY ("KullaniciID") REFERENCES "Kullanicilar"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "FirmaAbonelikleri" ADD CONSTRAINT "FK_819f1299b47843963a5ebf2b60b" FOREIGN KEY ("AbonelikPlanID") REFERENCES "AbonelikPlanlari"("AbonelikPlanID") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Faturalar" ADD CONSTRAINT "FK_2dc1bbef30c4111fe91e6bd2b9b" FOREIGN KEY ("AbonelikID") REFERENCES "FirmaAbonelikleri"("AbonelikID") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Faturalar" ADD CONSTRAINT "FK_1d8611f932d03004d136376c10f" FOREIGN KEY ("KullaniciID") REFERENCES "Kullanicilar"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Faturalar" ADD CONSTRAINT "FK_bc8c1ce9009e867ea4cc6ac1d20" FOREIGN KEY ("FaturaBilgiID") REFERENCES "FaturaBilgileri"("FaturaBilgiID") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Siparisler" ADD CONSTRAINT "FK_fb0737a7a20927e2e465633dc34" FOREIGN KEY ("AbonelikPlanID") REFERENCES "AbonelikPlanlari"("AbonelikPlanID") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Siparisler" ADD CONSTRAINT "FK_0ecfe4946ca0ff4706ba3c1cdfd" FOREIGN KEY ("KullaniciID") REFERENCES "Kullanicilar"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Siparisler" ADD CONSTRAINT "FK_b1217be14b934276a49f0d07571" FOREIGN KEY ("FaturaBilgiID") REFERENCES "FaturaBilgileri"("FaturaBilgiID") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Siparisler" ADD CONSTRAINT "FK_7dc063a78b3e327a2990618f39b" FOREIGN KEY ("FaturaID") REFERENCES "Faturalar"("FaturaID") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Siparisler" DROP CONSTRAINT "FK_7dc063a78b3e327a2990618f39b"`);
        await queryRunner.query(`ALTER TABLE "Siparisler" DROP CONSTRAINT "FK_b1217be14b934276a49f0d07571"`);
        await queryRunner.query(`ALTER TABLE "Siparisler" DROP CONSTRAINT "FK_0ecfe4946ca0ff4706ba3c1cdfd"`);
        await queryRunner.query(`ALTER TABLE "Siparisler" DROP CONSTRAINT "FK_fb0737a7a20927e2e465633dc34"`);
        await queryRunner.query(`ALTER TABLE "Faturalar" DROP CONSTRAINT "FK_bc8c1ce9009e867ea4cc6ac1d20"`);
        await queryRunner.query(`ALTER TABLE "Faturalar" DROP CONSTRAINT "FK_1d8611f932d03004d136376c10f"`);
        await queryRunner.query(`ALTER TABLE "Faturalar" DROP CONSTRAINT "FK_2dc1bbef30c4111fe91e6bd2b9b"`);
        await queryRunner.query(`ALTER TABLE "FirmaAbonelikleri" DROP CONSTRAINT "FK_819f1299b47843963a5ebf2b60b"`);
        await queryRunner.query(`ALTER TABLE "FirmaAbonelikleri" DROP CONSTRAINT "FK_4bd13d9aacfb95bd184b4d10012"`);
        await queryRunner.query(`ALTER TABLE "FaturaBilgileri" DROP CONSTRAINT "FK_f6a02ca202abffcb79d800227e0"`);
        await queryRunner.query(`DROP TABLE "Siparisler"`);
        await queryRunner.query(`DROP TABLE "Faturalar"`);
        await queryRunner.query(`DROP TABLE "FirmaAbonelikleri"`);
        await queryRunner.query(`DROP TABLE "FaturaBilgileri"`);
    }

}
