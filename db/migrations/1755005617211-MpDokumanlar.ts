import { MigrationInterface, QueryRunner } from "typeorm";

export class MpDokumanlar1755005617211 implements MigrationInterface {
    name = 'MpDokumanlar1755005617211'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "MpDokumanlar" ("ID" bigint NOT NULL IDENTITY(1,1), "KullaniciID" int NOT NULL, "DonemID" int NOT NULL, "SGKHizmet" varchar(255), "OnayliSGKHizmet" varchar(255), "MuhtasarVePrim" varchar(255), "OnayliMuhtasarVePrim" varchar(255), "SGKTahakkuk" varchar(255), "Durum" varchar(100) NOT NULL, "Onaylimi" bit CONSTRAINT "DF_4ccaf33a48d0c0b86aea672c3e5" DEFAULT 0, "SurecSirasi" int NOT NULL CONSTRAINT "DF_62aff519ec3b6d68c92d2da2be4" DEFAULT 1, "Hatalar" varchar(4000), "Tamamlananlar" varchar(4000), "OlusturmaTarihi" datetime NOT NULL CONSTRAINT "DF_afdb0080d1f3422aa0ccda9b196" DEFAULT getdate(), "SonDuzenlenmeTarihi" datetime CONSTRAINT "DF_9741cc4036e617f9b9dca43acab" DEFAULT getdate(), CONSTRAINT "PK_0c0b2720df6dbd110ae1e11bf08" PRIMARY KEY ("ID"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "MpDokumanlar"`);
    }

}
