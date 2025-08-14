import {
  Entity,
  Column,
  PrimaryGeneratedColumn
} from 'typeorm';

@Entity('GiderTipi')
export class GiderTipi {
  @PrimaryGeneratedColumn({ type: 'int' })
  GiderTipiID: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  Tanim: string;

  @Column({ nullable: true, type: 'bit', default:0 })
  IsDeleted: boolean;

}
