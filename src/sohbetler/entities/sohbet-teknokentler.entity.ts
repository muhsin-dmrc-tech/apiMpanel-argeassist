import { Teknokentler } from 'src/teknokentler/entities/teknokentler.entity';
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
    UpdateDateColumn,
    CreateDateColumn,
    ManyToMany,
    JoinTable
} from 'typeorm';
import { Sohbetler } from './sohbetler.entity';


@Entity('SohbetTeknokentler')
export class SohbetTeknokentler {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    STID: number;

    @Column({ type: 'bigint', nullable: false })
    SohbetID: number;

    @Column({ type: 'bigint', nullable: false })
    TeknokentID: number;

    @ManyToOne(() => Sohbetler, sohbet => sohbet.SohbetTeknokentler)
    @JoinColumn({ name: 'SohbetID' })
    Sohbet: Sohbetler;

    @ManyToOne(() => Teknokentler)
    @JoinColumn({ name: 'TeknokentID' })
    Teknokent: Teknokentler;
}