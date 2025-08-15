import { MigrationInterface, QueryRunner } from "typeorm";

export class EmailTemplates1755166298467 implements MigrationInterface {
    name = 'EmailTemplates1755166298467'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "EmailTemplates" ("emailTemplateId" int NOT NULL IDENTITY(1,1), "templateName" varchar(255) NOT NULL, "body" text NOT NULL, "subject" varchar(255) NOT NULL, "isActive" bit NOT NULL CONSTRAINT "DF_be6f8c0f33902a5ef9c1270cef3" DEFAULT 1, "creationTime" datetime NOT NULL CONSTRAINT "DF_e8e64cb160e69af85e9df0efebb" DEFAULT getdate(), "creatorUserId" int, "lastModificationTime" datetime CONSTRAINT "DF_cd7d15c77bac7228baffa04cc00" DEFAULT getdate(), "lastModifierUserId" int, "deletionTime" datetime, "deleterUserId" int, "isDeleted" bit NOT NULL CONSTRAINT "DF_66a6acae3f406c958fdddf459ed" DEFAULT 0, CONSTRAINT "UQ_273a51d131a75627254991b3feb" UNIQUE ("templateName"), CONSTRAINT "PK_717a499515324325c9c9ca39ef1" PRIMARY KEY ("emailTemplateId"))`);
        await queryRunner.query(`ALTER TABLE "EmailTemplates" ADD CONSTRAINT "FK_f49dd950fadd0a04b577750a48a" FOREIGN KEY ("creatorUserId") REFERENCES "Kullanicilar"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "EmailTemplates" ADD CONSTRAINT "FK_6bd7524155790a7925a5c6ee9ca" FOREIGN KEY ("lastModifierUserId") REFERENCES "Kullanicilar"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "EmailTemplates" ADD CONSTRAINT "FK_5fa6f4bc8bfee52edf8ef7fc9b9" FOREIGN KEY ("deleterUserId") REFERENCES "Kullanicilar"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "EmailTemplates" DROP CONSTRAINT "FK_5fa6f4bc8bfee52edf8ef7fc9b9"`);
        await queryRunner.query(`ALTER TABLE "EmailTemplates" DROP CONSTRAINT "FK_6bd7524155790a7925a5c6ee9ca"`);
        await queryRunner.query(`ALTER TABLE "EmailTemplates" DROP CONSTRAINT "FK_f49dd950fadd0a04b577750a48a"`);
        await queryRunner.query(`DROP TABLE "EmailTemplates"`);

    }

}
