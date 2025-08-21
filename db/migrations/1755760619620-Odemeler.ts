import { MigrationInterface, QueryRunner } from "typeorm";

export class Odemeler1755760619620 implements MigrationInterface {
    name = 'Odemeler1755760619620'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "Odemeler" ("OdemeID" bigint NOT NULL IDENTITY(1,1), "KullaniciID" bigint NOT NULL, "SiparisID" bigint NOT NULL, "OdemeTarihi" datetime NOT NULL, "Tutar" decimal(10,2) NOT NULL, "OdemeYontemi" varchar(50) NOT NULL, "IsDeleted" bit CONSTRAINT "DF_23318ff8ac8e34bb4c4e08fcbd2" DEFAULT 0, "DeletedAt" datetime, CONSTRAINT "PK_d77b0dc1b28257bf716ccdf4b7d" PRIMARY KEY ("OdemeID"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "Odemeler"`);
    }

}
