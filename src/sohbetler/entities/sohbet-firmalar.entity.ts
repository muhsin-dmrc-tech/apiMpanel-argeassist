import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { Sohbetler } from './sohbetler.entity';
import { Firma } from 'src/firmalar/entities/firma.entity';


@Entity('SohbetFirmalar')
export class SohbetFirmalar {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    SFID: number;

    @Column({ type: 'bigint', nullable: false })
    SohbetID: number;

    @Column({ type: 'bigint', nullable: false })
    FirmaID: number;

    @ManyToOne(() => Sohbetler, sohbet => sohbet.SohbetFirmalar)
    @JoinColumn({ name: 'SohbetID' })
    Sohbet: Sohbetler;

    @ManyToOne(() => Firma)
    @JoinColumn({ name: 'FirmaID' })
    Firma: Firma;
}