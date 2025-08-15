import { MigrationInterface, QueryRunner } from "typeorm";

export class ProjeBasvurulari1755242743225 implements MigrationInterface {
    name = 'ProjeBasvurulari1755242743225'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "ProjeBasvuru" ("BasvuruID" int NOT NULL IDENTITY(1,1), "KullaniciID" int NOT NULL, "TeknokentID" bigint NOT NULL, "IsDeleted" bit CONSTRAINT "DF_a534dbd495d73b9fb47252fe148" DEFAULT 0, "OnerilenProjeIsmi" nvarchar(255) NOT NULL, "ProjeKonusuVeAmaci" nvarchar(4000) NOT NULL, "ProjeyiOrtayaCikaranProblem" nvarchar(4000) NOT NULL, "ProjeKapsamindakiCozum" nvarchar(4000) NOT NULL, "Durum" varchar(100), "ProjeninIcerdigiYenilikler" nvarchar(4000) NOT NULL, "RakipAnalizi" nvarchar(4000), "TicariBasariPotansiyeli" nvarchar(4000) NOT NULL, "DegerlendirmedeMi" bit NOT NULL CONSTRAINT "DF_723abce1fd10f7ccf74a7b5448d" DEFAULT 0, "DosyaEki" varchar(255), CONSTRAINT "PK_c382c6dfe5cb172c180c087abb8" PRIMARY KEY ("BasvuruID"))`);
        await queryRunner.query(`ALTER TABLE "ProjeBasvuru" ADD CONSTRAINT "FK_777225441567d04b74208753af5" FOREIGN KEY ("KullaniciID") REFERENCES "Kullanicilar"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ProjeBasvuru" DROP CONSTRAINT "FK_777225441567d04b74208753af5"`);        
        await queryRunner.query(`DROP TABLE "ProjeBasvuru"`);
    }

}
