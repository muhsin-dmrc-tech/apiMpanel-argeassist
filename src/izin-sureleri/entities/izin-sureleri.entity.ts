import { IzinTalepleri } from 'src/izin-talepleri/entities/izin-talepleri.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';

@Entity('IzinSureleri')
export class IzinSureleri {
  @PrimaryGeneratedColumn({ type: 'int' })
  IzinSureID: number;

  @Column({ type: 'int', nullable:false })
  IzinTalepID: number;

  @Column({ type: 'date', nullable:false })
  Tarih: Date;

  @Column({ type: 'time', nullable:false })
  BaslangicSaati: string;

  @Column({ type: 'time', nullable:false })
  BitisSaati: string;

  @Column({ type: 'time', nullable:false })
  ToplamSure: string;

  @Column({ nullable: true, type: 'text' })
  Aciklama: string;

  @Column({ nullable: true, type: 'bit', default:0 })
  IsDeleted: boolean;

  @ManyToOne(() => IzinTalepleri, izintalep => izintalep.IzinTalepID, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'IzinTalepID' })
  IzinTalep: IzinTalepleri;

}
