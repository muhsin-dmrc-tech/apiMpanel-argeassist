import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn
} from 'typeorm';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { SohbetMesajlari } from './sohbet-mesajlari.entity';


@Entity('SohbetOkunmaBilgileri')
export class SohbetOkunmaBilgileri {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    OkunmaBilgiID: number;

    @Column({ type: 'bigint', nullable: false })
    MesajID: number;

    @Column({ type: 'bigint', nullable: false })
    KullaniciID: number;

    @Column({ type: 'bit', nullable: false, default: 0 })
    OkunduMu: boolean;

    @CreateDateColumn({ nullable: false, type: 'datetime' })
    OkunmaTarihi: Date;

    @ManyToOne(() => Kullanicilar, kullanici => kullanici.id)
    @JoinColumn({ name: 'KullaniciID' })
    Kullanici: Kullanicilar;

    @ManyToOne(() => SohbetMesajlari, mesaj => mesaj.MesajID)
    @JoinColumn({ name: 'MesajID' })
    Mesaj: SohbetMesajlari;
}