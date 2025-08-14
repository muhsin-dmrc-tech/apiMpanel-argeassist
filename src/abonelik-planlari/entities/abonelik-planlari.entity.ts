import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  DeleteDateColumn
} from 'typeorm';

@Entity('AbonelikPlanlari')
export class AbonelikPlanlari {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  AbonelikPlanID: number;

  @Column({ nullable: false, type: 'varchar', length: '255' })
  PlanAdi: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  Fiyat: number;

  @Column({ nullable: true, type: 'text' })
  Aciklama: string;

  @Column({ nullable: true, type: 'bit', default: 1 })
  Aktifmi: boolean;

  @Column({ nullable: true, type: 'bit', default: 0 })
  IsDeleted: boolean;

  @DeleteDateColumn({ type: 'datetime', nullable: true, default: null })
  DeletedAt: Date;
}
