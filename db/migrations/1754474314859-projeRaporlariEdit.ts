import { MigrationInterface, QueryRunner } from "typeorm";

export class ProjeRaporlariEdit1754474314859 implements MigrationInterface {
    name = 'ProjeRaporlariEdit1754474314859'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ProjeRaporlari" ADD "Hatalar" varchar(4000)`);
        await queryRunner.query(`ALTER TABLE "ProjeRaporlari" ADD "Tamamlananlar" varchar(4000)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ProjeRaporlari" DROP COLUMN "Tamamlananlar"`);
        await queryRunner.query(`ALTER TABLE "ProjeRaporlari" DROP COLUMN "Hatalar"`);
    }
}
