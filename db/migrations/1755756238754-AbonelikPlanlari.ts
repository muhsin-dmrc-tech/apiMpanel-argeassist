import { MigrationInterface, QueryRunner } from "typeorm";

export class AbonelikPlanlari1755756238754 implements MigrationInterface {
    name = 'AbonelikPlanlari1755756238754'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "AbonelikPlanlari" ("AbonelikPlanID" bigint NOT NULL IDENTITY(1,1), "PlanAdi" varchar(255) NOT NULL, "Fiyat" decimal(10,2) NOT NULL, "Aciklama" text, "Aktifmi" bit CONSTRAINT "DF_ced93b4a23758ef65005ced24d6" DEFAULT 1, "IsDeleted" bit CONSTRAINT "DF_2092763118701d697d20896f8fa" DEFAULT 0, "DeletedAt" datetime, CONSTRAINT "PK_f60a40549da7720ec9fadf40927" PRIMARY KEY ("AbonelikPlanID"))`);
        }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "AbonelikPlanlari"`);
    }

}
