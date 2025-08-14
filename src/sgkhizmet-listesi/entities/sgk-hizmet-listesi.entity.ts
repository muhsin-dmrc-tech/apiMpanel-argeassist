import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Firma } from 'src/firmalar/entities/firma.entity';
import { SGKHizmetDetay } from './sgk-hizmet-detay.entity';

@Entity('SGKHizmetListesi')
export class SGKHizmetListesi {
  @PrimaryGeneratedColumn()
  ListeID: number;

  @Column()
  YilAy: string;

  @Column()
  IsyeriSicilNo: string;

  @Column()
  IsyeriUnvani: string;

  @Column()
  IsyeriAdresi: string;

  @Column()
  SGM: string;

  @Column({ default: '01' })
  BelgeCesidi: string;

  @Column({ default: 'ASIL' })
  Mahiyet: string;

  @Column()
  Kanun: string;

  @Column()
  OnayTarihi: string;

  @Column({ type: 'bigint' })
  FirmaID: number;

  @CreateDateColumn()
  OlusturmaTarihi: Date;

  @Column({ default: false })
  IsDeleted: boolean;

  @OneToMany(() => SGKHizmetDetay, detay => detay.Liste)
  Sigortalilar: SGKHizmetDetay[];

  @ManyToOne(() => Firma)
  @JoinColumn({ name: 'FirmaID' })
  Firma: Firma;
}
