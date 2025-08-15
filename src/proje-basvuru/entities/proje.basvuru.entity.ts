import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm';


@Entity('ProjeBasvuru')
export class ProjeBasvuru {
    @PrimaryGeneratedColumn({ type: 'int' })
    BasvuruID: number;

    @Column({ type: 'int', nullable: false })
    KullaniciID: number;

    @Column({ type: 'int', nullable: false })
    TeknokentID: number;

    @Column({ nullable: true, type: 'bit', default: 0 })
    IsDeleted: boolean;

    @Column({ type: 'nvarchar', length: 255, nullable: false })
    OnerilenProjeIsmi: string;

    @Column({ type: 'nvarchar', length: 4000, nullable: false })
    ProjeKonusuVeAmaci: string;

    @Column({ type: 'nvarchar', length: 4000, nullable: false })
    ProjeyiOrtayaCikaranProblem: string;

    @Column({ type: 'nvarchar', length: 4000, nullable: false })
    ProjeKapsamindakiCozum: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    Durum: string;

    @Column({ type: 'nvarchar', length: 4000, nullable: false })
    ProjeninIcerdigiYenilikler: string;

    @Column({ type: 'nvarchar', length: 4000, nullable: true })
    RakipAnalizi: string;

    @Column({ type: 'nvarchar', length: 4000, nullable: false })
    TicariBasariPotansiyeli: string;

    @Column({ type: 'bit', nullable: false, default:0 })
    DegerlendirmedeMi: boolean;

    @Column({ type: 'varchar', length: 255, nullable: true })
    DosyaEki: string;

    @ManyToOne(() => Kullanicilar, kullanici => kullanici.id)
    @JoinColumn({ name: 'KullaniciID' })
    Kullanici: Kullanicilar;

    /* @ManyToOne(() => Teknokentler, teknokent => teknokent.TeknokentID, { nullable: true })
    @JoinColumn({ name: 'TeknokentID' })
    Teknokent: Teknokentler; */
}