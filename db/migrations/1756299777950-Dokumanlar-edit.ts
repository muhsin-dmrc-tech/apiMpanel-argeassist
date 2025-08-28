import { MigrationInterface, QueryRunner } from "typeorm";

export class DokumanlarEdit1756299777950 implements MigrationInterface {
    name = 'DokumanlarEdit1756299777950'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Dokumanlar" ADD "CalismaSureleri" varchar(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Dokumanlar" DROP COLUMN "CalismaSureleri"`);
    }

}
