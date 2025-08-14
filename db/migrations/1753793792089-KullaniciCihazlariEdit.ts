import { MigrationInterface, QueryRunner } from "typeorm";

export class KullaniciCihazlariEdit1753793792089 implements MigrationInterface {
    name = 'KullaniciCihazlariEdit1753793792089'

    public async up(queryRunner: QueryRunner): Promise<void> {
        
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_cf0a35745177fa1f53d5df6bcd" ON "KullaniciCihazlari" ("KullaniciID", "Platform") `);
        await queryRunner.query(`ALTER TABLE "KullaniciCihazlari" ADD CONSTRAINT "FK_98a1a68136b595bb0378fe5e850" FOREIGN KEY ("KullaniciID") REFERENCES "Kullanicilar"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        
        await queryRunner.query(`ALTER TABLE "KullaniciCihazlari" DROP CONSTRAINT "FK_98a1a68136b595bb0378fe5e850"`);
        await queryRunner.query(`DROP INDEX "IDX_cf0a35745177fa1f53d5df6bcd" ON "KullaniciCihazlari"`);
        
    }

}
