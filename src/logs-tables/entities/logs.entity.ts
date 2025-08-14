import { Kullanicilar } from "src/kullanicilar/entities/kullanicilar.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


@Entity('Logs')
export class Logs {
    @PrimaryGeneratedColumn({ type: 'int' })
    logId: number;

    @Column({ nullable: false, type: 'varchar', length: '15' })
    logType: string;

    @Column({ nullable: true, type: 'varchar', length: '100' })
    eventType: string;

    @Column({ nullable: true, type: 'varchar', length: '15'})
    logLevel: string;

    @Column({ nullable: false, type: 'text' })
    message: string;

    @Column({ nullable: true, type: 'varchar', length: '255' })
    source: string;

    @Column({ nullable: true, type: 'varchar', length: '45' })
    ipAddress: string;

    @Column({ nullable: true, type: 'varchar', length: '500' })
    userAgent: string;

    @Column({ nullable: true, type: 'varchar', length: '500' })
    requestUrl: string;

    @Column({ type: 'bigint', nullable: true })
    userId: number;

    @Column({ nullable: true, type: 'varchar', length: '255' })
    relatedEntity: string;

    @Column({ type: 'bigint', nullable: true })
    relatedEntityId: number;

    @Column({ nullable: true, type: 'varchar', length: '15' })
    status: string;

    @CreateDateColumn({ nullable: false, type: 'datetime' })
    creationTime: Date;

    @Column({ type: 'bigint', nullable: true })
    creatorUserId: number;

    @UpdateDateColumn({ nullable: true, type: 'datetime' })
    lastModificationTime: Date;

    @Column({ type: 'bigint', nullable: true })
    lastModifierUserId: number;

    @DeleteDateColumn({ type: 'datetime', nullable: true })
    deletionTime: Date;

    @Column({ type: 'bigint', nullable: true })
    deleterUserId: number;

   
    @Column({ default: 0, nullable: false, type:'bit' })
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

    @ManyToOne(() => Kullanicilar, (Kullanicilar) => Kullanicilar.id)
    @JoinColumn({ name: 'userId' })
    logUser: Kullanicilar;
}