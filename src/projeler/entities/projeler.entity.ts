import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
/* import { Teknokentler } from 'src/teknokentler/entities/teknokentler.entity';
import { GorevListesi } from 'src/gorev-listesi/entities/gorev.listesi.entity'; */
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn
} from 'typeorm';
//import { ProjeRaporlari } from 'src/proje-raporlari/entities/proje-raporlari.entity';

@Entity('Projeler')
export class Projeler {
  @PrimaryGeneratedColumn({ type: 'int' })
  ProjeID: number;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  ProjeKodu: string;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  STBProjeKodu: string;

  @Column({ type: 'int', nullable:false })
  KullaniciID: number;

  @Column({ type: 'int', nullable:false })
  TeknokentID: number;

  @Column({ type: 'int', nullable:true })
  ProjeUzmanKullaniciID: number;

  @Column({ type: 'int', nullable:true })
  ProjeHakemKullaniciID: number;
  
  @Column({ type: 'varchar', length: 255, nullable:false}) 
  ProjeAdi: string;

  @Column({ nullable: true, type: 'date' })
  BaslangicTarihi: Date;

  @Column({ nullable: true, type: 'date' })
  BitisTarihi: Date;

  @Column({ nullable: true, type: 'bit', default:0 })
  IsDeleted: boolean;

  @ManyToOne(() => Kullanicilar, kullanici => kullanici.Projeler, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'KullaniciID' })
  Kullanici: Kullanicilar;

  /* @ManyToOne(() => Teknokentler, teknokent => teknokent.TeknokentID)
  @JoinColumn({ name: 'TeknokentID' })
  Teknokent: Teknokentler; */

  @ManyToOne(() => Kullanicilar, kullanicilar => kullanicilar.id, { nullable:true})
  @JoinColumn({ name: 'ProjeUzmanKullaniciID' })
  ProjeUzmanKullanici: Kullanicilar;

  @ManyToOne(() => Kullanicilar, kullanicilar => kullanicilar.id, { nullable:true})
  @JoinColumn({ name: 'ProjeHakemKullaniciID' })
  ProjeHakemKullanici: Kullanicilar;

  /* @OneToMany(() => GorevListesi, gorevListesi => gorevListesi.Proje)
  GorevListeleri: GorevListesi[]; */

 /*  @OneToMany(() => ProjeRaporlari, rapor => rapor.Proje)
  ProjeRaporlari: ProjeRaporlari[]; */
}
