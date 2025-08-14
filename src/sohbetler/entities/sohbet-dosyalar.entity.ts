import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn
} from 'typeorm';
import { Sohbetler } from './sohbetler.entity';
import { Firma } from 'src/firmalar/entities/firma.entity';
import { SohbetMesajlari } from './sohbet-mesajlari.entity';


@Entity('SohbetDosyalar')
export class SohbetDosyalar {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    DosyaID: number;

    @Column({ type: 'bigint', nullable: true })
    MesajID: number;

    @Column({ type: 'bigint', nullable: true })
    SohbetID: number;

    @Column({ type: 'varchar', length: 100, nullable: false })
    DosyaTipi: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    DosyaURL: string;

    @CreateDateColumn({ nullable: false, type: 'datetime' })
    YuklenmeTarihi: Date;

    @ManyToOne(() => Sohbetler, sohbet => sohbet.SohbetFirmalar, { nullable: true })
    @JoinColumn({ name: 'SohbetID' })
    Sohbet: Sohbetler;

    @ManyToOne(() => SohbetMesajlari, mesaj => mesaj.MesajID, { nullable: true })
    @JoinColumn({ name: 'MesajID' })
    Mesaj: SohbetMesajlari;
}