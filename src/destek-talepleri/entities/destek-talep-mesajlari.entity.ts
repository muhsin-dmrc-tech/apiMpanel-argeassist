import { DestekTipi } from 'src/destek-tipleri/entities/destek-tipleri.entity';
import { Firma } from 'src/firmalar/entities/firma.entity';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { ProjeBasvuru } from 'src/proje-basvuru/entities/proje.basvuru.entity';
import { Teknokentler } from 'src/teknokentler/entities/teknokentler.entity';
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn
} from 'typeorm';
import { DestekTalepleri } from './destek-talepleri.entity';


@Entity('DestekTalepMesajlari')
export class DestekTalepMesajlari {
    @PrimaryGeneratedColumn({ type: 'int' })
    MesajID: number;

    @Column({ type: 'int', nullable: false })
    DestekTalepID: number;

    @Column({ type: 'nvarchar', length: 4000, nullable: false })
    Mesaj: string;

    @Column({ type: 'bit', nullable: false, default: 0 })
    Okundumu: boolean;

    @Column({ type: 'varchar', length: 4000, nullable: true })
    DosyaEki: string;

    @Column({ type: 'int', nullable: false })
    KullaniciID: number;

    @Column({ type: 'varchar', length: 100, nullable: false, default: 'user' })
    KullaniciTipi: string;

    @CreateDateColumn({ nullable: false, type: 'datetime' })
    OlusturmaTarihi: Date;

    @ManyToOne(() => Kullanicilar, kullanici => kullanici.id)
    @JoinColumn({ name: 'KullaniciID' })
    Kullanici: Kullanicilar;

    @ManyToOne(() => DestekTalepleri, destekTalebi => destekTalebi.DestekTalepID, { cascade: true })
    @JoinColumn({ name: 'DestekTalepID' })
    DestekTalebi: DestekTalepleri;


}