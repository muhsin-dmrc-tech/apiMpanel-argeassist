import {
  Entity,
  Column,
  PrimaryGeneratedColumn
} from 'typeorm';

@Entity('IzinTuru')
export class IzinTuru {
  @PrimaryGeneratedColumn({ type: 'int' })
  IzinTuruID: number;

  @Column({ nullable: false, type: 'varchar', length: '255' })
  Tanim: string;

  @Column({ nullable: true, type: 'varchar', length: '255' })
  EkAdi: string;

  @Column({ nullable: false, type: 'bit', default:0 })
  Ek: boolean;

  @Column({ nullable: true, type: 'bit', default:0 })
  IsDeleted: boolean;
}
