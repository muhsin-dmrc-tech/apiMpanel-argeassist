import { MigrationInterface, QueryRunner } from "typeorm";

export class Bildirimler1755161792129 implements MigrationInterface {
    name = 'Bildirimler1755161792129'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "Bildirimler" ("BildirimID" bigint NOT NULL IDENTITY(1,1), "Baslik" varchar(255) NOT NULL, "Anahtar" varchar(100), "Link" varchar(255), "MobilLink" varchar(255), "Icerik" text NOT NULL, "Tur" varchar(50) NOT NULL, "OlusturmaTarihi" datetime NOT NULL CONSTRAINT "DF_6bd35affee54a9d6f9c72122246" DEFAULT getdate(), "PlanlananTarih" datetime, "TumKullanicilar" bit, "Durum" varchar(50) NOT NULL, "IsDeleted" bit CONSTRAINT "DF_fa3c17a6d6986fbc6c7ef0d6b13" DEFAULT 0, CONSTRAINT "PK_811da4b3257bda66acb909e77e1" PRIMARY KEY ("BildirimID"))`);
        await queryRunner.query(`CREATE TABLE "KullaniciBildirimleri" ("KullaniciBildirimID" bigint NOT NULL IDENTITY(1,1), "KullaniciID" int NOT NULL, "BildirimID" bigint NOT NULL, "Baslik" varchar(255) NOT NULL, "Icerik" text NOT NULL, "PlanlananTarih" datetime, "Durum" varchar(50) NOT NULL, "OkunduMu" bit CONSTRAINT "DF_0338ebab2dcb9ed517e68b9d965" DEFAULT 0, "OkunmaTarihi" datetime, "EpostaGonderildiMi" bit, "EpostaGonderimTarihi" datetime, "TekrarDenemeSayisi" int CONSTRAINT "DF_aedba2d5dab410d1f0a983f01dc" DEFAULT 0, "Link" varchar(255), "MobilLink" varchar(255), "OlusturmaTarihi" datetime CONSTRAINT "DF_ae2395e7f502c51eec312ac4902" DEFAULT getdate(), CONSTRAINT "PK_f103b888b6faaf34e820dcddfe8" PRIMARY KEY ("KullaniciBildirimID"))`);
        await queryRunner.query(`CREATE TABLE "Dokumanlar" ("ID" bigint NOT NULL IDENTITY(1,1), "KullaniciID" int NOT NULL, "DonemID" int NOT NULL, "SGKHizmet" varchar(255), "OnayliSGKHizmet" varchar(255), "MuhtasarVePrim" varchar(255), "OnayliMuhtasarVePrim" varchar(255), "SGKTahakkuk" varchar(255), "Durum" varchar(100) NOT NULL, "Onaylimi" bit CONSTRAINT "DF_4129dc126282e4319407fbabfd0" DEFAULT 0, "SurecSirasi" int NOT NULL CONSTRAINT "DF_03d24cc6a02d22fa82fc6814f05" DEFAULT 1, "Hatalar" varchar(4000), "Tamamlananlar" varchar(4000), "OlusturmaTarihi" datetime NOT NULL CONSTRAINT "DF_72372d3d6c8cc2915d5c35ab6bd" DEFAULT getdate(), "SonDuzenlenmeTarihi" datetime CONSTRAINT "DF_e0a281ada9b971f1f7541189624" DEFAULT getdate(), CONSTRAINT "PK_860cc1629019281c42faa7739d2" PRIMARY KEY ("ID"))`);
        await queryRunner.query(`ALTER TABLE "Dokumanlar" ADD CONSTRAINT "FK_4d19d0f41b25e947347da4102fd" FOREIGN KEY ("KullaniciID") REFERENCES "Kullanicilar"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Dokumanlar" ADD CONSTRAINT "FK_4bf5a09976160c7aa750ae69c2c" FOREIGN KEY ("DonemID") REFERENCES "Donem"("DonemID") ON DELETE NO ACTION ON UPDATE NO ACTION`);
         await queryRunner.query(`CREATE TABLE "Logs" ("logId" int NOT NULL IDENTITY(1,1), "logType" varchar(15) NOT NULL, "eventType" varchar(100), "logLevel" varchar(15), "message" text NOT NULL, "source" varchar(255), "ipAddress" varchar(45), "userAgent" varchar(500), "requestUrl" varchar(500), "userId" int, "relatedEntity" varchar(255), "relatedEntityId" bigint, "status" varchar(15), "creationTime" datetime NOT NULL CONSTRAINT "DF_cfdf09c032569ac802ab0afa4f2" DEFAULT getdate(), "creatorUserId" int, "lastModificationTime" datetime CONSTRAINT "DF_de891f8835ba3e845a931fc1051" DEFAULT getdate(), "lastModifierUserId" int, "deletionTime" datetime, "deleterUserId" int, "isDeleted" bit NOT NULL CONSTRAINT "DF_5b12c255d226b29b192fe5e36bf" DEFAULT 0, CONSTRAINT "PK_f8d302adbd11a52de11d3c1408e" PRIMARY KEY ("logId"))`);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Dokumanlar" DROP CONSTRAINT "FK_4bf5a09976160c7aa750ae69c2c"`);
        await queryRunner.query(`ALTER TABLE "Dokumanlar" DROP CONSTRAINT "FK_4d19d0f41b25e947347da4102fd"`);
        await queryRunner.query(`DROP TABLE "KullaniciBildirimleri"`);
        await queryRunner.query(`DROP TABLE "Bildirimler"`);
        await queryRunner.query(`DROP TABLE "Logs"`);
        await queryRunner.query(`DROP TABLE "Dokumanlar"`);
    }

}
