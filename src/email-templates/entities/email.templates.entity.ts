import { Kullanicilar } from "src/kullanicilar/entities/kullanicilar.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('EmailTemplates')
export class EmailTemplates {
    @PrimaryGeneratedColumn({ type: 'int' })
    emailTemplateId: number;

    @Column({ nullable: false, type: 'varchar', length: '255',unique:true })
    templateName: string;

    @Column({ nullable: false, type: 'text' })
    body: string;

    @Column({ nullable: false, type: 'varchar', length: '255' })
    subject: string;

    @Column({ nullable: false, type: 'bit', default: 1 })
    isActive: boolean;

    @CreateDateColumn({ nullable: false, type: 'datetime' })
    creationTime: Date;

    @Column({ type: 'bigint', nullable: true })
    creatorUserId: number;

    @UpdateDateColumn({ nullable: true, default: null, type: 'datetime' })
    lastModificationTime: Date;

    @Column({ type: 'bigint', nullable: true })
    lastModifierUserId: number;

    @DeleteDateColumn({ type: 'datetime', nullable: true, default: null })
    deletionTime: Date;

    @Column({ type: 'bigint', nullable: true })
    deleterUserId: number;

    @Column({ default: false, nullable: false,type:'bit' })
    isDeleted: boolean;

    @ManyToOne(() => Kullanicilar, (Kullanicilar) => Kullanicilar.id)
    @JoinColumn({ name: 'creatorUserId' })
    creatorUser: Kullanicilar;

    @ManyToOne(() => Kullanicilar, (Kullanicilar) => Kullanicilar.id)
    @JoinColumn({ name: 'lastModifierUserId' })
    lastModifierUser: Kullanicilar;

    @ManyToOne(() => Kullanicilar, (Kullanicilar) => Kullanicilar.id)
    @JoinColumn({ name: 'deleterUserId' })
    deleterUser: Kullanicilar;


}