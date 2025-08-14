import { DisaridaGecirilenForm } from 'src/disarida-gecirilen-form/entities/disarida-gecirilen-form.entity';
import { Donem } from 'src/donem/entities/donem.entity';
import { Firma } from 'src/firmalar/entities/firma.entity';
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

@Entity('DisaridaGecirilenSureler')
export class DisaridaGecirilenSureler {
  @PrimaryGeneratedColumn({ type: 'int' })
  DisaridaGecirilenSureID: number;

  @Column({ type: 'int', nullable: false })
  DisaridaGecirilenFormID: number;

  @Column({ type: 'date', nullable: false })
  Tarih: Date;

  @Column({ type: 'time', nullable: false })
  BaslangicSaati: string;

  @Column({ type: 'time', nullable: false })
  BitisSaati: string;

  @Column({ type: 'time', nullable: false })
  ToplamSure: string;

  @Column({ nullable: true, type: 'text' })
  Aciklama: string;

  @Column({ nullable: true, type: 'bit', default: 0 })
  IsDeleted: boolean;

  @ManyToOne(() => DisaridaGecirilenForm, disaridaGecirilenForm => disaridaGecirilenForm.DisaridaGecirilenFormID, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'DisaridaGecirilenFormID' })
  disaridaGecirilenForm: DisaridaGecirilenForm;

}
