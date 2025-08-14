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
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany
} from 'typeorm';
import { Sohbetler } from './sohbetler.entity';
import { SohbetOkunmaBilgileri } from './sohbet-okunma-bilgileri.entity';
import { SohbetDosyalar } from './sohbet-dosyalar.entity';


@Entity('SohbetMesajlari')
export class SohbetMesajlari {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    MesajID: number;

    @Column({ type: 'bigint', nullable: false })
    SohbetID: number;

    @Column({ type: 'bigint', nullable: true })
    UstMesajID: number;

    @Column({ type: 'nvarchar', length: 4000, nullable: true })
    MesajIcerigi: string;

    @Column({ type: 'int', nullable: false })
    GonderenKullaniciID: number;

    @CreateDateColumn({ nullable: false, type: 'datetime' })
    GonderimTarihi: Date;

    @UpdateDateColumn({ nullable: true, type: 'datetime' })
    DuzenlenmeTarihi: Date;
    
    @Column({ type: 'bit', nullable: false, default: 0 })
    SilindiMi: boolean;

    @ManyToOne(() => Kullanicilar, kullanici => kullanici.id)
    @JoinColumn({ name: 'GonderenKullaniciID' })
    GonderenKullanici: Kullanicilar;

    @ManyToOne(() => Sohbetler, destekTalebi => destekTalebi.SohbetID, { cascade: true })
    @JoinColumn({ name: 'SohbetID' })
    Sohbet: Sohbetler;

    @ManyToOne(() => SohbetMesajlari, mesaj => mesaj.AltMesajlar, { nullable: true })
    @JoinColumn({ name: 'UstMesajID' })
    UstMesaj: SohbetMesajlari;

    @OneToMany(() => SohbetMesajlari, smesaj => smesaj.UstMesaj, { nullable: true })
    AltMesajlar: SohbetMesajlari[];

    @OneToMany(() => SohbetOkunmaBilgileri, okunma => okunma.Mesaj, { nullable: true })
    OkunmaBilgileri: SohbetOkunmaBilgileri[];

    @OneToMany(() => SohbetDosyalar, dosya => dosya.Mesaj, { nullable: true })
    Dosyalar: SohbetDosyalar[];

}