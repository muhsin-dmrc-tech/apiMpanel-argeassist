import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Surecler } from './surecler.entity';
import { SurecAdimlari } from './surec-adimlari.entity';

@Entity('SurecAdimBaglantilari')
export class SurecAdimBaglantilari {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  ID: number;

  @Column({ type: 'bigint', nullable: false })
  SurecID: number;

  @Column({ type: 'bigint', nullable: false })
  KaynakAdimID: number;

  @Column({ type: 'bigint', nullable: true })
  HedefAdimID: number;

  @Column({ nullable: false, type: 'varchar', length: '100' })//(örn: 'sonraki', 'önceki', 'koşullu', 'fonksiyonel')
  BaglantiTuru: string;

  @Column({ type: 'int', nullable: true })//(geçiş sırası için)
  SiraNo: number;
 
  @ManyToOne(() => Surecler, surec => surec.ID)
  @JoinColumn({ name: 'SurecID' })
  Surec: Surecler;

  @ManyToOne(() => SurecAdimlari, adim => adim.ID)
  @JoinColumn({ name: 'KaynakAdimID' })
  KaynakAdim: SurecAdimlari;

  @ManyToOne(() => SurecAdimlari, adim => adim.ID,{nullable:true})
  @JoinColumn({ name: 'HedefAdimID' })
  HedefAdim: SurecAdimlari;
}


/* Alan	                  Açıklama
SurecID	                  İlgili süreci belirtir.
KaynakAdimID	            Başlangıç (çıkış) adımı.
HedefAdimID	              Hedef (varış) adımı.
BaglantiTuru	            'sonraki', 'önceki', 'koşullu', 'fonksiyonel' vb.
Kosul	                    Geçişin koşuluna dair bir ifade, örneğin SQL benzeri bir ifade olabilir.
FonksiyonAdi	            Kodda çağrılacak özel işlem varsa onun adı.
ZorunluMu	                Bu geçiş zorunlu mu?
RevizeEdilebilirMi	      Bu geçiş kuralı sonradan değiştirilebilir mi?
SiraNo	                  Özellikle bir adımdan birden fazla hedef varsa sıralama önemlidir. */