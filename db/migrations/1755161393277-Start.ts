import { MigrationInterface, QueryRunner } from "typeorm";

export class Start1755161393277 implements MigrationInterface {
    name = 'Start1755161393277'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "Kullanicilar" ("id" int NOT NULL IDENTITY(1,1), "AdSoyad" varchar(255), "FirmaAdi" varchar(255), "KullaniciTipi" int NOT NULL CONSTRAINT "DF_51697a186e3ced814e985520f87" DEFAULT 1, "Email" varchar(255) NOT NULL, "Telefon" varchar(20), "ProfilResmi" varchar(255), "Sifre" varchar(255), "createdAt" datetime CONSTRAINT "DF_16898a43752d590888855def765" DEFAULT getdate(), "updatedAt" datetime CONSTRAINT "DF_c41635ae735f54c11b5aabfe397" DEFAULT getdate(), "deletedAt" datetime, "isVerified" bit NOT NULL CONSTRAINT "DF_b29160b150a84e1bf45d8588ad0" DEFAULT 0, "verifiedAt" datetime, "isActive" bit NOT NULL CONSTRAINT "DF_ba34eb39080e6fb5e9d3bb9e779" DEFAULT 0, "isTwoFactorEnabled" bit NOT NULL CONSTRAINT "DF_fe8efe908fb55b81ed98804c48a" DEFAULT 0, "twoFactorSecret" varchar(500), "role" varchar(100) NOT NULL CONSTRAINT "DF_d3a675909f931201784faedb54c" DEFAULT 'user', CONSTRAINT "UQ_3dbf17ab9c7856d08e76b9c59bf" UNIQUE ("Email"), CONSTRAINT "PK_e9e7eca1a14a3e71c660c690e34" PRIMARY KEY ("id"))`);        await queryRunner.query(`CREATE TABLE "SurecAdimBaglantilari" ("ID" bigint NOT NULL IDENTITY(1,1), "SurecID" bigint NOT NULL, "KaynakAdimID" bigint NOT NULL, "HedefAdimID" bigint, "BaglantiTuru" varchar(100) NOT NULL, "SiraNo" int, CONSTRAINT "PK_e296a904f37fcade33b0099f96b" PRIMARY KEY ("ID"))`);
        await queryRunner.query(`CREATE TABLE "SurecAdimlari" ("ID" bigint NOT NULL IDENTITY(1,1), "SurecID" bigint NOT NULL, "AdimAdi" varchar(255) NOT NULL, "SiraNo" int NOT NULL, CONSTRAINT "PK_d5a68b27caa5cdb22747b64d85b" PRIMARY KEY ("ID"))`);
        await queryRunner.query(`CREATE TABLE "Surecler" ("ID" bigint NOT NULL IDENTITY(1,1), "Anahtar" varchar(100) NOT NULL, "SurecAdi" varchar(255) NOT NULL, "IsDeleted" bit CONSTRAINT "DF_ef7b209cbaa7c75e2f05e8824de" DEFAULT 0, CONSTRAINT "UQ_9366d6b2445a065f571b60654a6" UNIQUE ("Anahtar"), CONSTRAINT "PK_4a5f66ceb9305425d592c5314e2" PRIMARY KEY ("ID"))`);
        await queryRunner.query(`CREATE TABLE "LoginKayitlari" ("id" bigint NOT NULL IDENTITY(1,1), "KullaniciId" int NOT NULL, "GirisZamani" datetime NOT NULL CONSTRAINT "DF_114082388b76cf7768b5e65fa9b" DEFAULT 'GETDATE()', "IPAdresi" varchar(45) NOT NULL, "CihazBilgisi" varchar(255) NOT NULL, "BasariliMi" bit NOT NULL CONSTRAINT "DF_0cc694ca4031276bbf0e288dd8a" DEFAULT 0, "HataNedeni" varchar(255), CONSTRAINT "PK_bc3082a1b8b7a64a11fec1fbec1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "KullaniciCihazlari" ("id" int NOT NULL IDENTITY(1,1), "KullaniciID" int NOT NULL, "Token" varchar(400) NOT NULL, "Platform" varchar(20) NOT NULL, "SonGuncellemeTarihi" datetime, "isActive" bit NOT NULL CONSTRAINT "DF_4bf3980ad5132e77e480e6cb5a8" DEFAULT 0, CONSTRAINT "PK_9c7da28edddad076230c9de0d7e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_cf0a35745177fa1f53d5df6bcd" ON "KullaniciCihazlari" ("KullaniciID", "Platform") `);
        await queryRunner.query(`CREATE TABLE "SurecKayitlari" ("ID" bigint NOT NULL IDENTITY(1,1), "SurecID" bigint NOT NULL, "AdimID" bigint NOT NULL, "ItemID" bigint NOT NULL, "KullaniciID" int NOT NULL, "Durum" varchar(100) NOT NULL, "BaslamaZamani" datetime NOT NULL CONSTRAINT "DF_96f0b126f27921a3746c549ac18" DEFAULT getdate(), "BitirmeZamani" datetime, "Aciklama" nvarchar(4000), CONSTRAINT "PK_d800e1f9519d682fd344d716ae3" PRIMARY KEY ("ID"))`);
        await queryRunner.query(`CREATE TABLE "Donem" ("DonemID" int NOT NULL IDENTITY(1,1), "DonemAdi" varchar(255) NOT NULL, "Ay" int, "Yil" int, "IsDeleted" bit CONSTRAINT "DF_c9d2febe6ba104507b5f25f7486" DEFAULT 0, CONSTRAINT "PK_bde7c6291a32c08e131e42ba949" PRIMARY KEY ("DonemID"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        
        await queryRunner.query(`DROP TABLE "Donem"`);
        await queryRunner.query(`DROP TABLE "SurecKayitlari"`);
        await queryRunner.query(`DROP INDEX "IDX_cf0a35745177fa1f53d5df6bcd" ON "KullaniciCihazlari"`);
        await queryRunner.query(`DROP TABLE "KullaniciCihazlari"`);
        await queryRunner.query(`DROP TABLE "LoginKayitlari"`);
        await queryRunner.query(`DROP TABLE "Surecler"`);
        await queryRunner.query(`DROP TABLE "SurecAdimlari"`);
        await queryRunner.query(`DROP TABLE "SurecAdimBaglantilari"`);
        await queryRunner.query(`DROP TABLE "Kullanicilar"`);
    }

}
