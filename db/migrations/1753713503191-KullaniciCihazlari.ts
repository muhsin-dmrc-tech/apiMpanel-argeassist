import { MigrationInterface, QueryRunner } from "typeorm";

export class KullaniciCihazlari1753713503191 implements MigrationInterface {
    name = 'KullaniciCihazlari1753713503191'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "KullaniciCihazlari" ("id" int NOT NULL IDENTITY(1,1), "KullaniciID" int NOT NULL, "Token" varchar(400) NOT NULL, "Platform" varchar(20) NOT NULL, "SonGuncellemeTarihi" datetime, "isActive" bit NOT NULL CONSTRAINT "DF_4bf3980ad5132e77e480e6cb5a8" DEFAULT 0, CONSTRAINT "PK_9c7da28edddad076230c9de0d7e" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "KullaniciCihazlari"`);
    }

}
