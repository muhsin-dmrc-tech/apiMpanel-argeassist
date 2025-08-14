import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { SurecAdimlari } from './surec-adimlari.entity';

@Entity('Surecler')
export class Surecler {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  ID: number;

  @Column({ nullable: false, type: 'varchar', length: '100', unique: true })
  Anahtar: string;

  @Column({ nullable: false, type: 'varchar', length: '255' })
  SurecAdi: string;

  @OneToMany(() => SurecAdimlari, adim => adim.Surec,{nullable:true})
  Adimlar: SurecAdimlari[];

  @Column({ nullable: true, type: 'bit', default:0 })
  IsDeleted: boolean;
}
