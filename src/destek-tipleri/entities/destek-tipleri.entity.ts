import {
  Entity,
  Column,
  PrimaryGeneratedColumn
} from 'typeorm';

@Entity('DestekTipi')
export class DestekTipi {
  @PrimaryGeneratedColumn({ type: 'int' })
  DestekTipiID: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  Tanim: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  Departman: string;

  @Column({ nullable: true, type: 'bit', default:0 })
  IsDeleted: boolean;

}
