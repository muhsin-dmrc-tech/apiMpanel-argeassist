import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SGKHizmetListesi } from './sgk-hizmet-listesi.entity';

@Entity('SGKHizmetDetay')
export class SGKHizmetDetay {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ListeID: number;

  @Column()
  SNo: string;

  @Column()
  SGKNo: string;

  @Column()
  Adi: string;

  @Column()
  Soyadi: string;

  @Column({ nullable: true })
  IlkSoyadi: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  Ucret: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  Ikramiye: number;

  @Column()
  Gun: string;

  @Column()
  UCG: string;

  @Column()
  EksikGun: string;

  @Column()
  GGun: string;

  @Column()
  CGun: string;

  @Column()
  ICN: string;

  @Column()
  EGN: string;

  @Column()
  MeslekKodu: string;

  @ManyToOne(() => SGKHizmetListesi, liste => liste.Sigortalilar)
  @JoinColumn({ name: 'ListeID' })
  Liste: SGKHizmetListesi;
}
