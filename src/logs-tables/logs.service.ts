import { BadRequestException, Injectable } from '@nestjs/common';
import { Brackets, DataSource } from 'typeorm';
import { Logs } from './entities/logs.entity';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';

@Injectable()
export class LogsService {
  constructor(private readonly dataSource: DataSource) { }


  async getLogs(userId: number, query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.items_per_page) || 10;
    const sort = query.sort || 'creationTime';
    const order = query.order || 'DESC';
    const filter = query.filter || {};

    if (isNaN(page) || isNaN(limit)) {
      throw new BadRequestException('Sayfa ve Sınır Numaralar olmalı');
    }

    if (!userId) {
      throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
    }

    const user = await this.dataSource.getRepository(Kullanicilar).findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException(`Kullanıcı kimliği gereklidir`);
    }

    if (user?.KullaniciTipi !== 2) {
      throw new BadRequestException(`Yetkisiz Kullanıcı`);
    }


    const queryBuilder = this.dataSource.getRepository(Logs).createQueryBuilder('logs')
      .withDeleted()
      .leftJoinAndSelect('logs.creatorUser', 'creatorUser')
      .leftJoinAndSelect('logs.lastModifierUser', 'lastModifierUser')
      .leftJoinAndSelect('logs.deleterUser', 'deleterUser')
      .leftJoinAndSelect('logs.logUser', 'logUser');



    // Filtreleme işlemi
    Object.keys(filter).forEach((key) => {
      const validFilterFields = {
        'logUser.AdSoyad': 'logUser.AdSoyad',
        'ipAddress': 'logs.ipAddress',
        'message': 'logs.message',
        'query': null // Genel arama için
      };

      if (key === 'query') {
        // Tüm alanlarda arama yap
        queryBuilder.andWhere(new Brackets(qb => {
          qb.where('logUser.AdSoyad LIKE :searchTerm')
            .orWhere('CAST(logs.ipAddress AS VARCHAR) LIKE :searchTerm')
            .orWhere('CAST(logs.message AS VARCHAR) LIKE :searchTerm');
        }), { searchTerm: `%${filter[key]}%` });
      } else if (validFilterFields[key]) {
        queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
      }
    });

    // Sıralama işlemi
    const validSortFields = ['logId','logType','eventType','logLevel','message','source','ipAddress', 'userAgent', 'requestUrl', 'relatedEntity', 'relatedEntityId', 'status', 'creationTime', 'lastModificationTime', 'logUser'];
    if (sort && validSortFields.includes(sort)) {
      if (sort === 'logUser') {
        queryBuilder.orderBy('logUser.AdSoyad', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
      } else {
        queryBuilder.orderBy(`logs.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
      }
    }

    queryBuilder.skip((page - 1) * limit).take(limit);

    const [logs, total] = await queryBuilder.getManyAndCount();
    return {
      data: logs,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }










  private getEventTypeFromUrl(url: string): string {
    if (!url) return 'Unknown';

    // URL'den son kısmı al
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];

    // Eğer URL parametresi varsa (?) işaretinden önceki kısmı al
    const cleanPath = lastPart.split('?')[0];

    // URL'deki tire (-) işaretlerini boşluğa çevir ve her kelimenin ilk harfini büyük yap
    return cleanPath
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  async logError(logData: Partial<Logs>) {
    try {
      const log = this.dataSource.getRepository(Logs).create(logData);
      const savedLog = await this.dataSource.getRepository(Logs).save(log);
      return savedLog;
    } catch (error) {
      console.error('Error saving log:', error);
    }
  }

  async logSystem({ message, req, logLevel, relatedEntity, relatedEntityId, status = 'success' }) {
    const logEntry = new Logs();
    logEntry.logType = 'system';
    logEntry.eventType = 'Warning';
    logEntry.logLevel = logLevel || 'warning';
    logEntry.message = message;
    logEntry.source = req?.originalUrl || 'unknown';
    logEntry.ipAddress = req?.ip || req?.headers['x-forwarded-for'];
    logEntry.userAgent = req?.headers['user-agent'];
    logEntry.requestUrl = req?.originalUrl;
    logEntry.userId = req?.user?.id;
    logEntry.relatedEntity = relatedEntity;
    logEntry.relatedEntityId = relatedEntityId;
    logEntry.status = status;
    logEntry.creationTime = new Date();
    logEntry.creatorUserId = req?.user?.id;
    logEntry.isDeleted = false;

    try {
      await this.dataSource.getRepository(Logs).save(logEntry);
    } catch (err) {
      console.error('Error writing to logs:', err);
    }
  }


  async logSecurity({ message, req, eventType, relatedEntity, relatedEntityId, status = 'success' }) {
    const logEntry = new Logs();
    logEntry.logType = 'security';
    logEntry.eventType = eventType;
    logEntry.message = message;
    logEntry.source = req?.originalUrl || 'unknown';
    logEntry.ipAddress = req?.ip || req?.headers['x-forwarded-for'];
    logEntry.userAgent = req?.headers['user-agent'];
    logEntry.requestUrl = req?.originalUrl;
    logEntry.userId = req?.user?.id;
    logEntry.relatedEntity = relatedEntity || 'User';
    logEntry.relatedEntityId = relatedEntityId;
    logEntry.status = status;
    logEntry.creationTime = new Date();
    logEntry.creatorUserId = req?.user?.id;
    logEntry.isDeleted = false;

    try {
      await this.dataSource.getRepository(Logs).save(logEntry);
    } catch (err) {
      console.error('Error writing to logs:', err);
    }
  }
}
