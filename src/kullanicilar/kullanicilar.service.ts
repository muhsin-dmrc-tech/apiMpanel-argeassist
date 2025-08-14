import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Kullanicilar } from './entities/kullanicilar.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { LoginKayitlari } from 'src/login-kayitlari/entities/login-kayitlari.entity';

@Injectable()
export class KullanicilarService {
  constructor(
    @InjectRepository(Kullanicilar)
    private readonly kullanicilarRepository: Repository<Kullanicilar>,
    private readonly dataSource: DataSource
  ) { }


 

  async getUsers(userId: number, query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.items_per_page) || 10;
    const sort = query.sort || 'createdAt';
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


    const queryBuilder = this.dataSource.getRepository(Kullanicilar).createQueryBuilder('users')
      .withDeleted()


    // Filtreleme işlemi
    Object.keys(filter).forEach((key) => {
      const validFilterFields = {
        'AdSoyad': 'users.AdSoyad',
        'KullaniciTipi': 'users.KullaniciTipi',
        'Email': 'users.Email',
        'Telefon': 'users.Telefon',
        'createdAt': 'users.createdAt',
        'updatedAt': 'users.updatedAt',
        'deletedAt': 'users.deletedAt',
        'verifiedAt': 'users.verifiedAt',
        'role': 'users.role',
        'query': null // Genel arama için
      };

      if (key === 'query') {
        // Tüm alanlarda arama yap
        queryBuilder.andWhere(new Brackets(qb => {
          qb.where('CAST(users.AdSoyad AS VARCHAR) LIKE :searchTerm')
            .orWhere('CAST(users.Email AS VARCHAR) LIKE :searchTerm')
            .orWhere('CAST(users.Telefon AS VARCHAR) LIKE :searchTerm')
            .orWhere('CAST(users.KullaniciTipi AS VARCHAR) LIKE :searchTerm')
            .orWhere('CAST(users.createdAt AS VARCHAR) LIKE :searchTerm')
            .orWhere('CAST(users.updatedAt AS VARCHAR) LIKE :searchTerm')
            .orWhere('CAST(users.deletedAt AS VARCHAR) LIKE :searchTerm')
            .orWhere('CAST(users.verifiedAt AS VARCHAR) LIKE :verifiedAt')
            .orWhere('CAST(users.role AS VARCHAR) LIKE :searchTerm');
        }), { searchTerm: `%${filter[key]}%` });
      } else if (validFilterFields[key]) {
        queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
      }
    });

    // Sıralama işlemi
    const validSortFields = ['id', 'AdSoyad', 'Email', 'Telefon', 'KullaniciTipi', 'createdAt', 'updatedAt', 'deletedAt', 'role', 'verifiedAt'];
    if (sort && validSortFields.includes(sort)) {
      queryBuilder.orderBy(`users.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
    }

    queryBuilder.skip((page - 1) * limit).take(limit);

    const [users, total] = await queryBuilder.getManyAndCount();
    return {
      data: users,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async getUsersLogins(userId: number, query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.items_per_page) || 10;
    const sort = query.sort || 'id';
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


    const queryBuilder = this.dataSource.getRepository(LoginKayitlari).createQueryBuilder('users')
      .leftJoinAndSelect('users.Kullanici', 'Kullanici')
      .withDeleted()


    // Filtreleme işlemi
    Object.keys(filter).forEach((key) => {
      const validFilterFields = {
        'Kullanici.AdSoyad': 'Kullanici.AdSoyad',
        'GirisZamani': 'users.GirisZamani',
        'IPAdresi': 'users.IPAdresi',
        'CihazBilgisi': 'users.CihazBilgisi',
        'HataNedeni': 'users.HataNedeni',
        'query': null // Genel arama için
      };

      if (key === 'query') {
        // Tüm alanlarda arama yap
        queryBuilder.andWhere(new Brackets(qb => {
          qb.where('Kullanici.AdSoyad LIKE :searchTerm')
            .orWhere('CAST(users.GirisZamani AS VARCHAR) LIKE :searchTerm')
            .orWhere('CAST(users.IPAdresi AS VARCHAR) LIKE :searchTerm')
            .orWhere('CAST(users.CihazBilgisi AS VARCHAR) LIKE :searchTerm')
            .orWhere('CAST(users.HataNedeni AS VARCHAR) LIKE :searchTerm')
        }), { searchTerm: `%${filter[key]}%` });
      } else if (validFilterFields[key]) {
        queryBuilder.andWhere(`${validFilterFields[key]} LIKE :${key}`, { [key]: `%${filter[key]}%` });
      }
    });

    // Sıralama işlemi
    const validSortFields = ['id', 'GirisZamani', 'IPAdresi', 'CihazBilgisi', 'HataNedeni', 'Kullanici'];
    if (sort && validSortFields.includes(sort)) {
      if (sort === 'Kullanici') {
        queryBuilder.orderBy('Kullanici.AdSoyad', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
      } else {
        queryBuilder.orderBy(`users.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
      }
    }

    queryBuilder.skip((page - 1) * limit).take(limit);

    const [users, total] = await queryBuilder.getManyAndCount();
    return {
      data: users,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async create(createUserDto: CreateUserDto): Promise<Kullanicilar> {
    const newUser = this.kullanicilarRepository.create(createUserDto);
    return this.kullanicilarRepository.save(newUser);
  }

  async findAll(): Promise<Kullanicilar[]> {
    return this.kullanicilarRepository.find();
  }

  async findOne(id: number): Promise<Kullanicilar | null> {
    return this.kullanicilarRepository.findOne({ where: { id } });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<Kullanicilar> {
    await this.kullanicilarRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.kullanicilarRepository.delete(id);
  }

  async findOneByEmail(email: string): Promise<Kullanicilar | null> {
    return this.kullanicilarRepository.findOne({ where: { Email: email } });
  }
}
