import { IsPhoneNumber, Matches } from 'class-validator';
import { LoginKayitlari } from 'src/login-kayitlari/entities/login-kayitlari.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { KullaniciCihazlari } from './kullanici-cihazlari.entity';

@Entity('Kullanicilar')
export class Kullanicilar {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  AdSoyad: string;

  @Column({ nullable: false, type: 'int', default: 1 })
  KullaniciTipi: number;

  @Column({ unique: true, type: 'varchar', length: 255 })
  Email: string;

  @Column({ nullable: true, type: 'varchar', length: 20 })
  Telefon: string;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  ProfilResmi: string;

  @Column({ nullable: true, type: 'varchar', length: 255, select: false})
  Sifre: string;

  @CreateDateColumn({ nullable: true, type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ nullable: true, type: 'datetime' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true,default:null })
  deletedAt: Date;

  @Column({ type: "bit", default:0 })
  isVerified: boolean;

  @Column({ nullable: true, type: 'datetime',default:null })
  verifiedAt: Date;

  @Column({ type: "bit", default:0, nullable: false }) 
  isActive: boolean;

  @Column({ type: "bit", default:0 })
  isTwoFactorEnabled?: boolean;

  @Column({ nullable: true, type: 'varchar', length: 500 })
  twoFactorSecret?: string;

  @Column({ type: 'varchar', length: 100, nullable:false, default: "user"}) 
  role: string;

  @OneToMany(() => LoginKayitlari, loginKayitlari => loginKayitlari.Kullanici)
  loginKayitlari: LoginKayitlari[];

  @OneToMany(() => KullaniciCihazlari, cihazlar => cihazlar.Kullanici)
  Cihazlar: KullaniciCihazlari[];
}
