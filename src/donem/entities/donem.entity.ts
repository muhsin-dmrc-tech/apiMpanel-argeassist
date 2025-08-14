import {
  Entity,
  Column,
  PrimaryGeneratedColumn
} from 'typeorm';

@Entity('Donem')
export class Donem {
  @PrimaryGeneratedColumn({ type: 'int' })
  DonemID: number;

  @Column({ nullable: false, type: 'varchar', length: '255' })
  DonemAdi: string;

  @Column({ type: 'int', nullable:true })
  Ay: number;

  @Column({ type: 'int', nullable:true })
  Yil: number;

  @Column({ nullable: true, type: 'bit', default:0 })
  IsDeleted: boolean;
}
