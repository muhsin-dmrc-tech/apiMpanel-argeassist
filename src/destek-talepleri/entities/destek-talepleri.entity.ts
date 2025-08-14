import { DestekTipi } from 'src/destek-tipleri/entities/destek-tipleri.entity';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { ProjeBasvuru } from 'src/proje-basvuru/entities/proje.basvuru.entity';
import { Teknokentler } from 'src/teknokentler/entities/teknokentler.entity';
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
    UpdateDateColumn,
    CreateDateColumn
} from 'typeorm';
import { DestekTalepMesajlari } from './destek-talep-mesajlari.entity';


@Entity('DestekTalepleri')
export class DestekTalepleri {
    @PrimaryGeneratedColumn({ type: 'int' })
    DestekTalepID: number;

    @Column({ type: 'int', nullable: true })
    ProjeBasvuruID: number;

    @Column({ type: 'int', nullable: false })
    KullaniciID: number;

    @Column({ type: 'int', nullable: true })
    TeknokentID: number;

    @Column({ type: 'int', nullable: false })
    DestekTipiID: number;

    @Column({ type: 'nvarchar', length: 255, nullable: false })
    Baslik: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    Durum: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    Departman: string;

    @CreateDateColumn({ nullable: false, type: 'datetime' })
    OlusturmaTarihi: Date;

    @UpdateDateColumn({ nullable: true, type: 'datetime' })
    SonDuzenlenmeTarihi: Date;

    @ManyToOne(() => ProjeBasvuru, projeBasvuru => projeBasvuru.BasvuruID, { nullable: true })
    @JoinColumn({ name: 'ProjeBasvuruID' })
    ProjeBasvuru: ProjeBasvuru;

    @ManyToOne(() => Kullanicilar, kullanici => kullanici.id)
    @JoinColumn({ name: 'KullaniciID' })
    Kullanici: Kullanicilar;

    @ManyToOne(() => Teknokentler, teknokent => teknokent.TeknokentID, { nullable: true })
    @JoinColumn({ name: 'TeknokentID' })
    Teknokent: Teknokentler;

    @ManyToOne(() => DestekTipi, destekTipi => destekTipi.DestekTipiID)
    @JoinColumn({ name: 'DestekTipiID' })
    DestekTipi: DestekTipi;

    @OneToMany(() => DestekTalepMesajlari, destekTalepMesajlari => destekTalepMesajlari.DestekTalebi)
    Mesajlar: DestekTalepMesajlari[];
}