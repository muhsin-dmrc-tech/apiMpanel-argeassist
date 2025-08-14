export class PersonelBilgisi {
  tcKimlikNo: string;
  ad: string;
  soyAd: string;
  baslangicTarihi: string;
}

export class MuhtasarMeta {
  vergiKesintiTutari: string;
  terkinTutari: string;
  projeKodu: string;
}

export class PDFAnalysisResult {
  isValid: boolean;
  error?: string;
  muhtasarMeta?: MuhtasarMeta;
  personelListesi?: PersonelBilgisi[];
}

export class PersonelTableData {
  tcKimlikNo: string;
  ad: string;
  soyAd: string;
  baslangicTarihi: string;
  gelirVergiIstisnasi: string;
  sigortaPrimiIsverenHissesi: string;
}

export class FarklılarListesiData {
  tcKimlikNo: string;
  ad: string;
  soyAd: string;
  Gun?: number;
  izinliGun?: number;
  Aciklama?: string
  baslangicTarihi?: string;
}

export class PersonellerType {
  IzinliGunSayisi: number;
  PersonelID: number;
  AdSoyad: string;
  TCNo: string;
  IliskiID: number;
  KullaniciID: number;
  GrupID: number;
  Rol: string;
  Tip: number;
  BilisimPersoneli: boolean;
}

export class SgkHizmetListesiData {
    tcKimlikNo: string;
    ad: string;
    soyAd: string;
    Gun?: number;
}
