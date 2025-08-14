import {
  Entity,
  Column,
  PrimaryGeneratedColumn
} from 'typeorm';

@Entity('CalismaTuru')
export class CalismaTuru {
  @PrimaryGeneratedColumn({ type: 'int' })
  CalismaTuruID: number;

  @Column({ nullable: false, type: 'varchar', length: '255' })
  Tanim: string;

  @Column({ nullable: true, type: 'bit', default:0 })
  IsDeleted: boolean;
}
