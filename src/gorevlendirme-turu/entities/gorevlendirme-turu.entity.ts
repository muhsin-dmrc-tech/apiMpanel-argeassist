import {
  Entity,
  Column,
  PrimaryGeneratedColumn
} from 'typeorm';

@Entity('GorevlendirmeTuru')
export class GorevlendirmeTuru {
  @PrimaryGeneratedColumn({ type: 'int' })
  GorevlendirmeTuruID: number;

  @Column({ nullable: false, type: 'varchar', length: '255' })
  Tanim: string;

  @Column({ nullable: true, type: 'bit', default:0 })
  IsDeleted: boolean;
}
