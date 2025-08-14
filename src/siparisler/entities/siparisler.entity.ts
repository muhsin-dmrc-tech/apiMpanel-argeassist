import { AbonelikPlanlari } from 'src/abonelik-planlari/entities/abonelik-planlari.entity';
import { FaturaBilgileri } from 'src/fatura-bilgileri/entities/fatura-bilgileri.entity';
import { Faturalar } from 'src/faturalar/entities/faturalar.entity';
import { Firma } from 'src/firmalar/entities/firma.entity';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn
} from 'typeorm';

@Entity('Siparisler')
export class Siparisler {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  SiparisID: number;

  @Column({ type: 'bigint', nullable: false })
  AbonelikPlanID: number;

  @Column({ type: 'bigint', nullable: false })
  KullaniciID: number;

  @Column({ type: 'bigint', nullable: false })
  FirmaID: number;

  @Column({ type: 'bigint', nullable: true,default:null })
  FaturaBilgiID: number;

  @Column({ type: 'bigint', nullable: true,default:null })
  FaturaID: number;

  @CreateDateColumn({ nullable: false, type: 'datetime' })
  OlusturmaTarihi: Date;

  @Column({ nullable: true, type: 'datetime' })
  OdemeTarihi: Date;

  @Column({ nullable: true, type: 'varchar' })
  OdemeVadesi: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  Tutar: number;

  @Column({ nullable: false, type: 'varchar', length: '50' })/* Bildirimin durumu Ödendi - Bekleniyor - Ödenmedi */
  Durum: string;

  @Column({ nullable: true, type: 'text' })/* Bildirimin durumu Ödendi - Bekleniyor - Ödenmedi */
  OdenmemeSebebi: string;

  @Column({ nullable: true, type: 'bit', default: 0 })
  IsDeleted: boolean;

  @DeleteDateColumn({ type: 'datetime', nullable: true, default: null })
  DeletedAt: Date;

  @ManyToOne(() => Firma, firma => firma.FirmaID)
  @JoinColumn({ name: 'FirmaID' })
  Firma: Firma;

  @ManyToOne(() => AbonelikPlanlari, abonelik => abonelik.AbonelikPlanID)
  @JoinColumn({ name: 'AbonelikPlanID' })
  AbonelikPlan: AbonelikPlanlari;

  @ManyToOne(() => Kullanicilar, kullanici => kullanici.id)
  @JoinColumn({ name: 'KullaniciID' })
  Kullanici: Kullanicilar;

  @ManyToOne(() => FaturaBilgileri, fatura => fatura.FaturaBilgiID, {nullable:true})
  @JoinColumn({ name: 'FaturaBilgiID' })
  FaturaBilgi: FaturaBilgileri;

  @ManyToOne(() => Faturalar, fatura => fatura.FaturaID, {nullable:true})
  @JoinColumn({ name: 'FaturaID' })
  Fatura: Faturalar;
}
