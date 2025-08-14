import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('Sozlesmeler')
export class Sozlesmeler {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  SozlesmeID: number;

  @Column({ nullable: false, type: 'varchar', length: '100',unique:true })
  Anahtar: string;

  @Column({ nullable: false, type: 'varchar', length: '255' })
  Baslik: string;

  @Column({ nullable: false, type: 'text' })
  Aciklama: string;

  @Column({ nullable: true, type: 'bit', default: 0 })
  IsDeleted: boolean;

  @DeleteDateColumn({ type: 'datetime', nullable: true, default: null })
  DeletedAt: Date;

}
