import { CalismaTuru } from 'src/calisma-turu/entities/calisma-turu.entity';
import { DisaridaGecirilenSureler } from 'src/disarida-gecirilen-sureler/entities/disarida-gecirilen-sureler.entity';
import { Donem } from 'src/donem/entities/donem.entity';
import { Firma } from 'src/firmalar/entities/firma.entity';
import { GorevlendirmeTuru } from 'src/gorevlendirme-turu/entities/gorevlendirme-turu.entity';
import { IzinSureleri } from 'src/izin-sureleri/entities/izin-sureleri.entity';
import { IzinTuru } from 'src/izin-turu/entities/izin-turu.entity';
import { Personel } from 'src/personel/entities/personel.entity';
import { Projeler } from 'src/projeler/entities/projeler.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany
} from 'typeorm';

@Entity('DisaridaGecirilenForm')
export class DisaridaGecirilenForm {
  @PrimaryGeneratedColumn({ type: 'int' })
  DisaridaGecirilenFormID: number;

  @Column({ type: 'int', nullable: false })
  FirmaID: number;

  @Column({ type: 'int', nullable: false })
  DonemID: number;

  @Column({ type: 'int', nullable: false })
  PersonelID: number;

  @Column({ type: 'int', nullable: false })
  GorevlendirmeTuruID: number;

  @Column({ type: 'int', nullable: false })
  CalismaTuruID: number;

  @Column({ type: 'int', nullable: false })
  ProjeID: number;

  @Column({ type: 'varchar', length:255, nullable: false })
  CalisilacakKurum: string;

  @Column({ nullable: true, type: 'text' })
  YoneticiMesaji: string;

  @Column({ nullable: true, type: 'bit', default: 1 })
  HaftaIciGunuDahil: boolean;

  @Column({ nullable: true, type: 'bit', default: 0 })
  CumartesiDahil: boolean;

  @Column({ nullable: true, type: 'bit', default: 0 })
  PazarDahil: boolean;

  @Column({ nullable: true, type: 'bit', default: 0 })
  IsDeleted: boolean;

  @ManyToOne(() => Firma, firma => firma.FirmaID, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'FirmaID' })
  Firma: Firma;

  @ManyToOne(() => Donem, donem => donem.DonemID)
  @JoinColumn({ name: 'DonemID' })
  Donem: Donem;

  @ManyToOne(() => Personel, personel => personel.PersonelID)
  @JoinColumn({ name: 'PersonelID' })
  Personel: Personel;

  @ManyToOne(() => Projeler, projeler => projeler.ProjeID)
  @JoinColumn({ name: 'ProjeID' })
  Proje: Projeler;

  @ManyToOne(() => CalismaTuru, calismaTuru => calismaTuru.CalismaTuruID)
  @JoinColumn({ name: 'CalismaTuruID' })
  CalismaTuru: CalismaTuru;

  @ManyToOne(() => GorevlendirmeTuru, gorevlendirmeTuru => gorevlendirmeTuru.GorevlendirmeTuruID)
  @JoinColumn({ name: 'GorevlendirmeTuruID' })
  GorevlendirmeTuru: GorevlendirmeTuru;

  @OneToMany(() => DisaridaGecirilenSureler, disaridaGecirilenSureler => disaridaGecirilenSureler.disaridaGecirilenForm)
  DisaridaGecirilenSureler: DisaridaGecirilenSureler[];

}
