import { Kullanicilar } from "src/kullanicilar/entities/kullanicilar.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Sohbetler } from "./sohbetler.entity";

@Entity('SohbetKullanicilari')
export class SohbetKullanicilari {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    SKID: number;

    @Column({ type: 'bigint', nullable: false })
    SohbetID: number;

    @Column({ type: 'bigint', nullable: false })
    KullaniciID: number;

    @Column({ type: 'bit', nullable: false, default: 0 })
    AyrildiMi: boolean;

    @Column({ nullable: true, type: 'datetime' })
    KatilmaTarihi: Date;

    @Column({ nullable: true, type: 'datetime' })
    AyrilmaTarihi: Date;

    @ManyToOne(() => Sohbetler, sohbet => sohbet.Kullanicilar)
    @JoinColumn({ name: 'SohbetID' })
    Sohbet: Sohbetler;

    @ManyToOne(() => Kullanicilar, kullanici => kullanici.id)
    @JoinColumn({ name: 'KullaniciID' })
    Kullanici: Kullanicilar;
}