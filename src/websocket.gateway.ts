import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Kullanicilar } from './kullanicilar/entities/kullanicilar.entity';
import { KullaniciBildirimleri } from './kullanici-bildirimleri/entities/kullanici-bildirimleri.entity';
import { SohbetMesajlari } from './sohbetler/entities/sohbet-mesajlari.entity';
import { SohbetOkunmaBilgileri } from './sohbetler/entities/sohbet-okunma-bilgileri.entity';
import { KullaniciCihazlari } from './kullanicilar/entities/kullanici-cihazlari.entity';
import { MpKullanicilar } from './mp-kullanicilar/entities/mp-kullanicilar.entity';

@WebSocketGateway(4000, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'https://argeassist.com', 'https://panel.argeassist.com','https://musteri-paneli.argeassist.com'],
  },
})
@Injectable()
export class AppGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit, OnModuleDestroy {
  @WebSocketServer()
  server: Server;
  private static processingMessages3 = new Map<string, boolean>();
  private static processingMessages3Mp = new Map<string, boolean>();
  private static processingMessages: Map<string, Promise<void>> = new Map();
  private static processingNewMessages: Map<string, Promise<void>> = new Map();
  private static processingMessagesMp: Map<string, Promise<void>> = new Map();
  private static processingMessagesFind = new Map<string, boolean>();
  private connectedClients: Map<string, Socket> = new Map();
  private static lastRequested = new Map<number, number>();
  constructor(private dataSource: DataSource) { }

  onModuleInit() { }

  onModuleDestroy() {
    this.server?.removeAllListeners();
    this.connectedClients.clear();
  }

  private async handleConnectionGeneric(
    client: Socket,
    roomPrefix: string,
    repository: Repository<any>,
    eventNames: { join: string; success: string; error: string }
  ) {
    try {
      client.setMaxListeners(20);

      const timeoutId = setTimeout(() => {
        if (!client.rooms.has(`${roomPrefix}${client.handshake.query.userId}`)) {
          client.disconnect(true);
        }
      }, 30000);

      this.connectedClients.set(client.id, client);

      client.on(eventNames.join, async (userId: number) => {
        try {
          if (!userId) throw new Error('Geçersiz kullanıcı ID');

          const kullanici = await repository.findOne({ where: { id: userId } });
          if (!kullanici) throw new Error('Kullanıcı bulunamadı');

          clearTimeout(timeoutId);

          const roomName = `${roomPrefix}${userId}`;
          await client.join(roomName);

          await repository.update(userId, { isActive: true });

          client.emit(eventNames.success, {
            message: 'Bağlantı başarılı',
            userId,
            socketId: client.id
          });
        } catch (error) {
          console.error('Oda katılım hatası:', error);
          client.emit(eventNames.error, { message: error.message });
          client.disconnect(true);
        }
      });

    } catch {
      client.disconnect(true);
    }
  }

  handleConnection(client: Socket) {
    this.handleConnectionGeneric(
      client,
      'user_',
      this.dataSource.getRepository(Kullanicilar),
      { join: 'joinRoom', success: 'connectionSuccess', error: 'connectionError' }
    );
  }

  handleConnection1(client: Socket) {
    this.handleConnectionGeneric(
      client,
      'userMp_',
      this.dataSource.getRepository(MpKullanicilar),
      { join: 'joinRoomMp', success: 'connectionSuccessMp', error: 'connectionErrorMp' }
    );
  }




  /*  handleConnection(client: Socket) {
     try {
       // Maksimum dinleyici sayısını ayarla
       client.setMaxListeners(20);
 
       // Bağlantı zaman aşımı kontrolü (30 saniye)
       const timeoutId = setTimeout(() => {
         if (!client.rooms.has(`user_${client.handshake.query.userId}`)) {
           //console.log(`Bağlantı zaman aşımı: ${client.id}`);
           client.disconnect(true);
         }
       }, 30000);
 
       // Client'ı kaydet
       this.connectedClients.set(client.id, client);
 
       // Odaya katılma olayını dinle
       client.on('joinRoom', async (userId: number) => {
         try {
           if (!userId) {
             throw new Error('Geçersiz kullanıcı ID');
           }
 
           // Kullanıcının varlığını kontrol et
           const kullanici = await this.dataSource.getRepository(Kullanicilar).findOne({
             where: { id: userId }
           });
 
           if (!kullanici) {
             throw new Error('Kullanıcı bulunamadı');
           }
 
           // Zaman aşımını temizle
           clearTimeout(timeoutId);
 
           // Odaya katıl
           const roomName = `user_${userId}`;
           await client.join(roomName);
 
           // Kullanıcı durumunu güncelle
           await this.dataSource.getRepository(Kullanicilar).update(
             userId,
             { isActive: true }
           );
 
           // Başarılı bağlantı bildirimi
           client.emit('connectionSuccess', {
             message: 'Bağlantı başarılı',
             userId: userId,
             socketId: client.id
           });
         } catch (error) {
           console.error('Oda katılım hatası:', error);
           client.emit('connectionError', { message: error.message });
           client.disconnect(true);
         }
       });
 
     } catch (error) {
       //console.error('Bağlantı hatası:', error);
       client.disconnect(true);
     }
   } */

  handleDisconnect(client: Socket) {
    client.removeAllListeners();
    this.connectedClients.delete(client.id);
  }



  async processStatus(data: any) {
    const kullaniciRepo = this.dataSource.getRepository(Kullanicilar);
    const cihazRepo = this.dataSource.getRepository(KullaniciCihazlari);

    const kullanici = await kullaniciRepo.findOne({
      where: { id: data.userId },
      relations: ['Cihazlar']
    });
    if (!kullanici) return;

    const yeniDurum = String(data.status).toLowerCase() === 'online';
    const ucGunOnce = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const mevcutCihaz = await cihazRepo.findOne({
      where: {
        KullaniciID: data.userId,
        Platform: (data.platform || '').toLowerCase()
      }
    });

    if (data.pushToken) {
      if (!mevcutCihaz) {
        try {
          const yeniCihaz = cihazRepo.create({
            Kullanici: kullanici,
            Platform: data.platform,
            Token: data.pushToken,
            SonGuncellemeTarihi: new Date(),
            isActive: yeniDurum
          });
          await cihazRepo.save(yeniCihaz);

        } catch (error) {
          throw error;
        }

      } else if (
        !mevcutCihaz.SonGuncellemeTarihi ||
        new Date(mevcutCihaz.SonGuncellemeTarihi) < ucGunOnce ||
        mevcutCihaz.Token !== data.pushToken
      ) {
        await cihazRepo.update(
          { KullaniciID: data.userId, Platform: data.platform },
          { isActive: yeniDurum, Token: data.pushToken, SonGuncellemeTarihi: new Date() }
        );
      } else if (mevcutCihaz.isActive !== yeniDurum) {
        await cihazRepo.update(
          { id: mevcutCihaz.id },
          { isActive: yeniDurum }
        );
      }
    } else if (data.platform && data.userId) {
      await cihazRepo.update(
        { KullaniciID: data.userId, Platform: data.platform },
        { isActive: yeniDurum }
      );
    }

    const guncelDurum = await cihazRepo.exists({
      where: { KullaniciID: data.userId, isActive: true }
    });

    if (kullanici.isActive !== guncelDurum) {
      await kullaniciRepo.update(data.userId, { isActive: guncelDurum });
      this.server.emit('userStatus', {
        userId: data.userId,
        status: guncelDurum ? 'online' : 'offline',
        timestamp: new Date()
      });
    }
  }



  @SubscribeMessage('userStatus')
  async handleUserStatus(client: Socket, data: any): Promise<void> {
    const statusKey = `status_${data.userId}`;

    if (!data.userId || !data.status) return;

    // Eğer işlem devam ediyorsa bekle
    if (AppGateway.processingMessages.has(statusKey)) {
      await AppGateway.processingMessages.get(statusKey);
      return; // Zaten işlendi
    }

    // Yeni promise oluştur ve map'e ekle
    const processingPromise = this.processStatus(data);
    AppGateway.processingMessages.set(statusKey, processingPromise);
    try {
      await processingPromise;
    } finally {
      AppGateway.processingMessages.delete(statusKey);
    }
  }

  @SubscribeMessage('userStatusFind')
  async handleUserStatusFind(client: Socket, data: any): Promise<void> {
    const statusKey = `status_${data.userId}`;
    try {
      if (!data.userId) return;

      const now = Date.now();
      const last = AppGateway.lastRequested.get(data.userId);
      if (last && now - last < 5000) return;
      AppGateway.lastRequested.set(data.userId, now);

      if (AppGateway.processingMessagesFind.get(statusKey)) return;
      AppGateway.processingMessagesFind.set(statusKey, true);

      const kullaniciRepo = this.dataSource.getRepository(Kullanicilar);
      const kullanici = await kullaniciRepo.findOne({
        where: { id: data.userId },
        relations: ['Cihazlar']
      });

      if (!kullanici) return;
      const guncelDurum = kullanici.Cihazlar?.find(c => c.isActive) || kullanici.isActive;

      this.server.emit('userStatus', {
        userId: data.userId,
        status: guncelDurum ? 'online' : 'offline',
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Kullanıcı durumu öğrenme hatası:', error);
    } finally {
      AppGateway.processingMessagesFind.delete(statusKey);
    }
  }



  @SubscribeMessage('BildirimOkundu')
  async handleNotificationRead(client: Socket, data: any): Promise<void> {
    try {
      if (!data.BildirimID || !data.KullaniciID) {
        return;
      }

      const notificationKey = `${data.BildirimID}_${data.KullaniciID}`;

      // Kilit kontrolü
      if (AppGateway.processingMessages3.get(notificationKey)) {
        return;
      }

      // İşleme başladığını işaretle
      AppGateway.processingMessages3.set(notificationKey, true);

      try {
        const bildirimRepo = this.dataSource.getRepository(KullaniciBildirimleri);

        // Önce bildirimin varlığını ve durumunu kontrol et
        const bildirim = await bildirimRepo.findOne({
          where: {
            KullaniciBildirimID: data.BildirimID,
            KullaniciID: data.KullaniciID,
            OkunduMu: false // Sadece okunmamış bildirimleri işle
          }
        });

        if (!bildirim) {
          return;
        }

        // Bildirimi güncelle
        bildirim.OkunduMu = true;
        bildirim.Durum = 'Okundu';
        bildirim.OkunmaTarihi = new Date();
        await bildirimRepo.save(bildirim);

        // Bildirim gönder
        const room = `user_${data.KullaniciID}`;
        this.server.to(room).emit('BildirimOkundu', {
          KullaniciID: data.KullaniciID,
          BildirimID: data.BildirimID,
          OkunmaTarihi: bildirim.OkunmaTarihi,
          success: true,
        });

      } finally {
        // İşlem bittiğinde kilidi kaldır
        AppGateway.processingMessages3.delete(notificationKey);
      }
    } catch (error) {
      console.error('Bildirim okuma hatası:', error);
      // Hata durumunda da kilidi kaldır
      AppGateway.processingMessages3.delete(`${data.BildirimID}_${data.KullaniciID}`);
    }
  }


  @SubscribeMessage('MesajOkundu')
  async handleMessageRead(client: Socket, data: any): Promise<void> {
    try {
      if (!data.MesajID || !data.okuyanKullaniciId) {
        return;
      }

      const messageKey = `${data.MesajID}_${data.okuyanKullaniciId}`;

      // Map'e AppGateway sınıfı üzerinden eriş
      if (AppGateway.processingMessages3.get(messageKey)) {
        return;
      }

      // İşleme başladığını işaretle
      AppGateway.processingMessages3.set(messageKey, true);

      try {
        const mesajRepo = this.dataSource.getRepository(SohbetMesajlari);
        const okunmaBilgileriRepo = this.dataSource.getRepository(SohbetOkunmaBilgileri);

        // Önce mesajın varlığını kontrol et
        const mesaj = await mesajRepo.findOne({
          where: { MesajID: data.MesajID },
          relations: {
            Sohbet: {
              Kullanicilar: true,
            },
          },
        });

        if (!mesaj) {
          return;
        }

        // Okunma bilgisini kontrol et
        const varmi = await okunmaBilgileriRepo.findOne({
          where: {
            MesajID: data.MesajID,
            KullaniciID: data.okuyanKullaniciId,
          },
        });

        if (varmi) {
          return;
        }

        // Okunma bilgisini kaydet
        const okunmaBilgileri = new SohbetOkunmaBilgileri();
        okunmaBilgileri.MesajID = data.MesajID;
        okunmaBilgileri.KullaniciID = data.okuyanKullaniciId;
        okunmaBilgileri.OkunduMu = true;
        okunmaBilgileri.OkunmaTarihi = new Date();
        await okunmaBilgileriRepo.save(okunmaBilgileri);

        // Bildirim gönder
        if (mesaj.Sohbet?.Kullanicilar?.length > 0) {
          const uniqueUsers = new Set(mesaj.Sohbet.Kullanicilar.map(k => k.KullaniciID));
          uniqueUsers.forEach(userId => {
            const room = `user_${userId}`;
            this.server.to(room).emit('MesajOkundu', {
              KullaniciID: data.okuyanKullaniciId,
              Kullanici: data.okuyanKullanici,
              MesajID: data.MesajID,
              OkunmaTarihi: okunmaBilgileri.OkunmaTarihi,
              success: true,
            });
          });
        }
      } finally {
        // İşlem bittiğinde kilidi kaldır
        AppGateway.processingMessages3.delete(messageKey);
      }
    } catch (error) {
      console.error('Mesaj okuma hatası:', error);
      // Hata durumunda da kilidi kaldır
      AppGateway.processingMessages3.delete(`${data.MesajID}_${data.okuyanKullaniciId}`);
    }
  }


  @SubscribeMessage('Yaziyor')
  async mesajYaziyor(client: Socket, data: any): Promise<void> {
    if (data.userId) {
      this.server.emit('Yaziyor', data);
    }
  }


  sendNotificationToUser(userId: number, notification: any): void {
    const room = `user_${userId}`;
    this.server.to(room).emit('newNotification', notification);
  }

  async sendMessageToUser(userId: number, data: any) {
    const statusKey = `status_${data.userId}`;

    if (!userId || !data) return;

    // Eğer işlem devam ediyorsa bekle
    if (AppGateway.processingNewMessages.has(statusKey)) {
      await AppGateway.processingNewMessages.get(statusKey);
      return; // Zaten işlendi
    }

    // Yeni promise oluştur ve map'e ekle
    const processingPromise = this.processNewMesaj(userId, data);
    AppGateway.processingNewMessages.set(statusKey, processingPromise);
    try {
      await processingPromise;
    } finally {
      AppGateway.processingNewMessages.delete(statusKey);
    }

  }


  async processNewMesaj(userId: number, data: any) {
    const room = `user_${userId}`;
    this.server.to(room).emit('newMessage', data);
  }




  sendSohbetToUser(userId: number, sohbet: any): void {
    const room = `user_${userId}`;
    this.server.to(room).emit('newSohbet', sohbet);
  }

  deleteMesajToUser(userId: number, mesajId: number): void {
    const room = `user_${userId}`;
    this.server.to(room).emit('deleteMesaj', mesajId);
  }

  gruptanAyril(userId: number, data: any): void {
    const room = `user_${userId}`;
    this.server.to(room).emit('gruptanAyril', data);
  }







  //Müşteri Paneli Bölümü *************---------------------------

  /*  handleConnection1(client: Socket) {
     try {
       // Maksimum dinleyici sayısını ayarla
       client.setMaxListeners(20);
 
       // Bağlantı zaman aşımı kontrolü (30 saniye)
       const timeoutId = setTimeout(() => {
         if (!client.rooms.has(`userMp_${client.handshake.query.userId}`)) {
           //console.log(`Bağlantı zaman aşımı: ${client.id}`);
           client.disconnect(true);
         }
       }, 30000);
 
       // Client'ı kaydet
       this.connectedClients.set(client.id, client);
 
       // Odaya katılma olayını dinle
       client.on('joinRoomMp', async (userId: number) => {
         try {
           if (!userId) {
             throw new Error('Geçersiz kullanıcı ID');
           }
 
           // Kullanıcının varlığını kontrol et
           const kullanici = await this.dataSource.getRepository(MpKullanicilar).findOne({
             where: { id: userId }
           });
 
           if (!kullanici) {
             throw new Error('Kullanıcı bulunamadı');
           }
 
           // Zaman aşımını temizle
           clearTimeout(timeoutId);
 
           // Odaya katıl
           const roomName = `userMp_${userId}`;
           await client.join(roomName);
 
           // Kullanıcı durumunu güncelle
           await this.dataSource.getRepository(MpKullanicilar).update(
             userId,
             { isActive: true }
           );
 
           // Başarılı bağlantı bildirimi
           client.emit('connectionSuccessMp', {
             message: 'Bağlantı başarılı',
             userId: userId,
             socketId: client.id
           });
         } catch (error) {
           console.error('Oda katılım hatası:', error);
           client.emit('connectionErrorMp', { message: error.message });
           client.disconnect(true);
         }
       });
 
     } catch (error) {
       //console.error('Bağlantı hatası:', error);
       client.disconnect(true);
     }
   } */



  async processStatusMP(data: any) {
    const kullaniciRepo = this.dataSource.getRepository(MpKullanicilar);

    const kullanici = await kullaniciRepo.findOne({
      where: { id: data.userId }
    });
    if (!kullanici) return;
    const guncelDurum = data.status === 'online' ? true : false;

    if (kullanici.isActive !== guncelDurum) {
      await kullaniciRepo.update(data.userId, { isActive: guncelDurum });
      this.server.emit('userStatusMp', {
        userId: data.userId,
        status: guncelDurum ? 'online' : 'offline',
        timestamp: new Date()
      });
    }
  }



  @SubscribeMessage('userStatusMp')
  async handleUserStatusMp(client: Socket, data: any): Promise<void> {
    const statusKey = `status_${data.userId}`;
    if (!data.userId || !data.status) return;

    // Eğer işlem devam ediyorsa bekle
    if (AppGateway.processingMessagesMp.has(statusKey)) {
      await AppGateway.processingMessagesMp.get(statusKey);
      return; // Zaten işlendi
    }

    // Yeni promise oluştur ve map'e ekle
    const processingPromise = this.processStatusMP(data);
    AppGateway.processingMessagesMp.set(statusKey, processingPromise);
    try {
      await processingPromise;
    } finally {
      AppGateway.processingMessagesMp.delete(statusKey);
    }
  }

  @SubscribeMessage('BildirimOkunduMp')
  async handleNotificationReadMp(client: Socket, data: any): Promise<void> {
    try {
      if (!data.BildirimID || !data.KullaniciID) {
        return;
      }

      const notificationKey = `${data.BildirimID}_${data.KullaniciID}`;

      // Kilit kontrolü
      if (AppGateway.processingMessages3Mp.get(notificationKey)) {
        return;
      }

      // İşleme başladığını işaretle
      AppGateway.processingMessages3Mp.set(notificationKey, true);

      try {
        const bildirimRepo = this.dataSource.getRepository(KullaniciBildirimleri);

        // Önce bildirimin varlığını ve durumunu kontrol et
        const bildirim = await bildirimRepo.findOne({
          where: {
            KullaniciBildirimID: data.BildirimID,
            KullaniciID: data.KullaniciID,
            OkunduMu: false // Sadece okunmamış bildirimleri işle
          }
        });

        if (!bildirim) {
          return;
        }

        // Bildirimi güncelle
        bildirim.OkunduMu = true;
        bildirim.Durum = 'Okundu';
        bildirim.OkunmaTarihi = new Date();
        await bildirimRepo.save(bildirim);

        // Bildirim gönder
        const room = `userMp_${data.KullaniciID}`;
        this.server.to(room).emit('BildirimOkunduMp', {
          KullaniciID: data.KullaniciID,
          BildirimID: data.BildirimID,
          OkunmaTarihi: bildirim.OkunmaTarihi,
          success: true,
        });

      } finally {
        // İşlem bittiğinde kilidi kaldır
        AppGateway.processingMessages3Mp.delete(notificationKey);
      }
    } catch (error) {
      console.error('Bildirim okuma hatası:', error);
      // Hata durumunda da kilidi kaldır
      AppGateway.processingMessages3Mp.delete(`${data.BildirimID}_${data.KullaniciID}`);
    }
  }

  sendNotificationToUserMp(userId: number, notification: any): void {
    const room = `userMp_${userId}`;
    this.server.to(room).emit('newNotificationMp', notification);
  }

}
