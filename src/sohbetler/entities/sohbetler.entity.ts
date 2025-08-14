import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
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
import { SohbetMesajlari } from './sohbet-mesajlari.entity';
import { SohbetKullanicilari } from './sohbet-kullanicilari.entity';
import { SohbetTeknokentler } from './sohbet-teknokentler.entity';
import { SohbetFirmalar } from './sohbet-firmalar.entity';
import { SohbetDosyalar } from './sohbet-dosyalar.entity';


@Entity('Sohbetler')
export class Sohbetler {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    SohbetID: number;

    @Column({ type: 'bigint', nullable: false })
    OlusturanKullaniciID: number;

    @Column({ type: 'varchar', length: 100, nullable: true })
    GrupAdi: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    SohbetTipi: string;

    @CreateDateColumn({ nullable: false, type: 'datetime' })
    OlusturmaTarihi: Date;

    @UpdateDateColumn({ nullable: true, type: 'datetime' })
    SonDuzenlenmeTarihi: Date;

    @ManyToOne(() => Kullanicilar, kullanici => kullanici.id)
    @JoinColumn({ name: 'OlusturanKullaniciID' })
    OlusturanKullanici: Kullanicilar;

    @OneToMany(() => SohbetTeknokentler, teknokent => teknokent.Sohbet, { nullable: true })
    SohbetTeknokentler: SohbetTeknokentler[];

    @OneToMany(() => SohbetFirmalar, firma => firma.Sohbet, { nullable: true })
    SohbetFirmalar: SohbetFirmalar[];

    @OneToMany(() => SohbetMesajlari, sohbetMesajlari => sohbetMesajlari.Sohbet)
    Mesajlar: SohbetMesajlari[];

    @OneToMany(() => SohbetKullanicilari, sk => sk.Sohbet)
    Kullanicilar: SohbetKullanicilari[];

    @OneToMany(() => SohbetDosyalar, dosya => dosya.Sohbet, { nullable: true })
    Dosyalar: SohbetDosyalar[];
}