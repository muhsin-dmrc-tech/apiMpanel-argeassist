import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('RotaIzinleri')
export class RotaIzinleri {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 50, nullable:false}) 
  Anahtar: string;

  @Column({ type: 'varchar', length: 255, nullable:false}) 
  Tanim: string;

  @Column({ type: 'varchar', length: 50, nullable:false}) 
  Type: string;

  @Column({ type: 'varchar', length: 50, nullable:true}) 
  Bolum: string;

  @Column({ nullable: true, type: 'bit', default:0 })
  IsDeleted: boolean;
}
