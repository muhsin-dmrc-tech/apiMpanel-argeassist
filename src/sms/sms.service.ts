import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmsProvider } from './entities-daha-yuklu-degil/sms-provider.entity-none';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class SmsService {
  constructor(private readonly httpService: HttpService) {}

  async sendSms(to: string, message: string): Promise<void> {
    // Aktif sağlayıcıyı bul
    /*  const activeProvider = await this.smsProvider.findOne({
      where: { status: true },
    }); */
    const activeProvider = {
      id: 1,
      name: 'netgsm',
      apiUrl: 'https://api.netgsm.com.tr/',
      apiKey: '1234567890',
      password: '1234567890',
      username: '1234567890',
      status: true,
    };
    console.log('activeProvider', activeProvider);
    if (!activeProvider) {
      throw new Error('No active SMS provider found');
    }

    // Servis sağlayıcıya göre SMS gönder
    switch (activeProvider.name.toLowerCase()) {
      case 'twilio':
        await this.sendViaTwilio(activeProvider, to, message);
        break;
      case 'netgsm':
        await this.sendViaNetgsm(activeProvider, to, message);
        break;
      default:
        throw new Error(`Unsupported SMS provider: ${activeProvider.name}`);
    }
  }

  private async sendViaTwilio(
    provider: SmsProvider,
    to: string,
    message: string,
  ) {
    try {
      const request = this.httpService.post(
        `${provider.apiUrl}/Messages.json`,
        {
          To: to,
          From: provider.username,
          Body: message,
        },
        {
          auth: {
            username: provider.apiKey,
            password: provider.password,
          },
        },
      );

      const response = await lastValueFrom(request);
      console.log('Twilio SMS Sent:', response.data);
    } catch (error) {
      console.error('Failed to send SMS via Twilio:', error.message);
      throw new Error('Failed to send SMS');
    }
  }

  private async sendViaNetgsm(
    provider: SmsProvider,
    to: string,
    message: string,
  ) {
    try {
      //const netgsm = await this.dataSource.getRepository(GsmSetting).findOne({ where: { id: 1 } });

      const netgsm = {
        username: '0000000000',
        pass: '0000000000',
        header: 'wapp',
      };
      const username = netgsm?.username ?? '0000000000'; // NetGSM Kullanıcı Adı
      const pass = netgsm?.pass ?? '0000000000'; // NetGSM Şifre
      const header = netgsm?.header ?? 'wapp'; // NetGSM Header İsmi
      const telefonnumarasi = to;

      const startdate = new Date().toISOString(); // Başlangıç tarihi
      const stopdate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Bitiş tarihi

      const msg = encodeURIComponent(message);
      const gonderici = encodeURIComponent(header);

      const request = this.httpService.post(
        `https://api.netgsm.com.tr/bulkhttppost.asp?usercode=${username}&password=${pass}&gsmno=${telefonnumarasi}&message=${msg}&msgheader=${gonderici}&startdate=${startdate}&stopdate=${stopdate}&dil=TR`,
      );

      const response = await lastValueFrom(request);
      console.log('Netgsm SMS Sent:', response.data);
    } catch (error) {
      console.error('Failed to send SMS via Netgsm:', error.message);
      throw new Error('Failed to send SMS');
    }
  }
}
