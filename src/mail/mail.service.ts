import { Injectable } from '@nestjs/common';
import { EmailTemplates } from 'src/email-templates/entities/email.templates.entity';
import { DataSource } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { logger } from 'nestjs-i18n';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(
    private dataSource: DataSource,
  ) {
    this.initializeSMTP();
  }

  /**
   * SMTP Bağlantısını Başlat
   */
  private initializeSMTP() {
    const smtpHost = process.env.SMTP_HOST || 'mail.argeassist.com';
    const smtpPort = parseInt(process.env.SMTP_PORT, 10) || 465;
    const smtpUser = process.env.SMTP_USER || 'noreply@argeassist.com';
    const smtpPass = process.env.SMTP_PASS || 'senin-sifren';

    if (!smtpHost || !smtpUser || !smtpPass) {
      throw new Error('SMTP bilgileri eksik! Lütfen .env dosyanızı kontrol edin.');
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // 465 SSL kullanır, 587 TLS
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false, // Bazı SMTP sunucuları için gerekebilir
        }
      });
    } catch (error) {
      console.log(error)
      throw new Error('E-posta gönderimi başarısız.' + error);
    }
  }


  /**
   * Basit E-posta Gönderimi
   */
  async sendMail(options: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }) {
    const fromAddress = '"ARGE ASSIST" <noreply@argeassist.com>';


    if (!options.html || !options.subject || !options.to) {
      throw new Error('E-posta gönderimi durduruldu. Geçerli bir mesaj içeriği oluşturun.');
    }


    const mailOptions = {
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      text: options.text || 'No text content',
      html: options.html || '<p>No HTML content</p>',
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw new Error('E-posta gönderimi başarısız.');
    }
  }

  /**
   * Şablon Kullanarak E-posta Gönderimi
   */
  async sendEmailWithTemplate(
    templateName: string,
    replacements: Record<string, string>,
    to: string
  ) {
    const domainUrl = process.env.FRONTEND_URL || '';
    const template = await this.dataSource
      .getRepository(EmailTemplates)
      .findOne({ where: { templateName, isActive: true } });

    if (!template) {
      throw new Error('E-posta şablonu bulunamadı veya aktif değil.');
    }

    const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    replacements = { ...replacements, domainUrl };

    let { body, subject } = template;
    if (!body || !subject) {
      throw new Error('E-posta şablonunun içeriği eksik.');
    }

    for (const [key, value] of Object.entries(replacements)) {
      const regex = new RegExp(`{{${escapeRegExp(key)}}}`, 'g');
      body = body.replace(regex, value != null ? value : 'N/A');
      subject = subject.replace(regex, value != null ? value : 'N/A');
    }


    // Mail Gönder
    try {
      await this.sendMail({
        to,
        subject,
        html: body,
      });
    } catch (error) {
      console.error('Şablonlu e-posta gönderme hatası:', error);
      throw new Error('Şablonlu e-posta gönderme başarısız.');
    }
  }
}
