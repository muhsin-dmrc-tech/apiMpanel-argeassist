import { MigrationInterface, QueryRunner } from "typeorm";

export class BildirimlerEdit1754212256333 implements MigrationInterface {
    name = 'BildirimlerEdit1754212256333'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Bildirimler" ADD "MobilLink" varchar(255)`);
        await queryRunner.query(`ALTER TABLE "KullaniciBildirimleri" ADD "MobilLink" varchar(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "KullaniciBildirimleri" DROP COLUMN "MobilLink"`);
        await queryRunner.query(`ALTER TABLE "Bildirimler" DROP COLUMN "MobilLink"`);
    }

}
