import { MigrationInterface, QueryRunner } from "typeorm";

export class Projeler1755254207616 implements MigrationInterface {
    name = 'Projeler1755254207616'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "Projeler" ("ProjeID" int NOT NULL IDENTITY(1,1), "ProjeKodu" varchar(255), "STBProjeKodu" varchar(255), "KullaniciID" int NOT NULL, "TeknokentID" int NOT NULL, "ProjeUzmanKullaniciID" int, "ProjeHakemKullaniciID" int, "ProjeAdi" varchar(255) NOT NULL, "BaslangicTarihi" date, "BitisTarihi" date, "IsDeleted" bit CONSTRAINT "DF_1aab21092a2f12baa7a654e933b" DEFAULT 0, CONSTRAINT "PK_c40f80ca018336a690d8665b0c5" PRIMARY KEY ("ProjeID"))`);
        await queryRunner.query(`ALTER TABLE "Projeler" ADD CONSTRAINT "FK_a318d43ca639dd3673046180a9a" FOREIGN KEY ("KullaniciID") REFERENCES "Kullanicilar"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Projeler" ADD CONSTRAINT "FK_0ba880143161e7140017e715caf" FOREIGN KEY ("ProjeUzmanKullaniciID") REFERENCES "Kullanicilar"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Projeler" ADD CONSTRAINT "FK_e3242df6e87ad67c4d21944aa50" FOREIGN KEY ("ProjeHakemKullaniciID") REFERENCES "Kullanicilar"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Projeler" DROP CONSTRAINT "FK_e3242df6e87ad67c4d21944aa50"`);
        await queryRunner.query(`ALTER TABLE "Projeler" DROP CONSTRAINT "FK_0ba880143161e7140017e715caf"`);
        await queryRunner.query(`ALTER TABLE "Projeler" DROP CONSTRAINT "FK_a318d43ca639dd3673046180a9a"`);
        await queryRunner.query(`DROP TABLE "Projeler"`);
    }

}
