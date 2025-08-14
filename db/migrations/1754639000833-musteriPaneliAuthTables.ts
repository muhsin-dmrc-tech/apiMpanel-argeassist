import { MigrationInterface, QueryRunner } from "typeorm";

export class MusteriPaneliAuthTables1754639000833 implements MigrationInterface {
    name = 'MusteriPaneliAuthTables1754639000833'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "MpKullanicilar" ("id" int NOT NULL IDENTITY(1,1), "YetkiliAdSoyad" varchar(255), "FirmaAdi" varchar(255), "KullaniciTipi" int NOT NULL CONSTRAINT "DF_07de77f446090762bde117cc43e" DEFAULT 1, "Email" varchar(255) NOT NULL, "Telefon" varchar(20), "ProfilResmi" varchar(255), "Sifre" varchar(255), "createdAt" datetime CONSTRAINT "DF_64f0bcee0edb94e13ca92265ffa" DEFAULT getdate(), "updatedAt" datetime CONSTRAINT "DF_7b686608313a19348af065eed15" DEFAULT getdate(), "deletedAt" datetime, "isVerified" bit NOT NULL CONSTRAINT "DF_21776028a71843d045d40c0579b" DEFAULT 0, "verifiedAt" datetime, "isActive" bit NOT NULL CONSTRAINT "DF_9fc041801b132d84b12330bee44" DEFAULT 0, "isTwoFactorEnabled" bit NOT NULL CONSTRAINT "DF_5d167fa9be3ba01fd7b3064f673" DEFAULT 0, "twoFactorSecret" varchar(500), "role" varchar(100) NOT NULL CONSTRAINT "DF_d3db16d8e28f5eab366cb1e3007" DEFAULT 'user', CONSTRAINT "UQ_c39a315039ed6502aa3534d66b1" UNIQUE ("Email"), CONSTRAINT "PK_84720c863495c8e414b3d558f02" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "MpLoginKayitlari" ("id" bigint NOT NULL IDENTITY(1,1), "KullaniciId" int NOT NULL, "GirisZamani" datetime NOT NULL CONSTRAINT "DF_5191370f1e103a636482bbd6be2" DEFAULT 'GETDATE()', "IPAdresi" varchar(45) NOT NULL, "CihazBilgisi" varchar(255) NOT NULL, "BasariliMi" bit NOT NULL CONSTRAINT "DF_94a41e562d0648c6881cd94eff0" DEFAULT 0, "HataNedeni" varchar(255), CONSTRAINT "PK_6b11a453f166a760b27305090f0" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "MpLoginKayitlari"`);
        await queryRunner.query(`DROP TABLE "MpKullanicilar"`);
    }

}
