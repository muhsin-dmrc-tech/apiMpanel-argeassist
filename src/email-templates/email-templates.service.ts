import { BadRequestException, Injectable } from '@nestjs/common';
import { Kullanicilar } from 'src/kullanicilar/entities/kullanicilar.entity';
import { DataSource, Repository } from 'typeorm';
import { EmailTemplates } from './entities/email.templates.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTemplatesDto } from './dto/create.templates.dto';
import { UpdateTemplatesDto } from './dto/update.templates.dto';

@Injectable()
export class EmailTemplatesService {
    constructor(
        @InjectRepository(EmailTemplates)
        private readonly templateRepository: Repository<EmailTemplates>,
        private readonly dataSource: DataSource
    ) { }

    async getEmailTemplate(userId: number, emailTemplateID: number) {
        try {
            if (!userId) {
                throw new BadRequestException(`Kullanıcı ID gereklidir`);
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
            const queryBuilder = this.dataSource.getRepository(EmailTemplates).createQueryBuilder('emailTemplates')
                .withDeleted()
                .where("emailTemplates.emailTemplateId = :emailTemplateId", { emailTemplateId: emailTemplateID })
                .getOne();

            if (!queryBuilder) {
                throw new BadRequestException('E-posta şablonu bulunamadı');
            }

            return queryBuilder;
        } catch (error) {
            throw error;
        }
    }


    async getTemplates(userId: number, query: any) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.items_per_page) || 10;
        const sort = query.sort || 'creationTime';
        const order = query.order || 'DESC';
        const filter = query.filter || {};

        if (isNaN(page) || isNaN(limit)) {
            throw new BadRequestException('Sayfa ve Sınır Numaralar olmalı');
        }

        if (!userId) {
            throw new BadRequestException(`Kullanıcı ID gereklidir`);
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


        const queryBuilder = this.dataSource.getRepository(EmailTemplates).createQueryBuilder('emailTemplates')
            .withDeleted()
            .leftJoinAndSelect('emailTemplates.creatorUser', 'creatorUser')
            .leftJoinAndSelect('emailTemplates.lastModifierUser', 'lastModifierUser')
            .leftJoinAndSelect('emailTemplates.deleterUser', 'deleterUser');



        // Filtreleme işlemi
        Object.keys(filter).forEach((key) => {
            if (key === 'query') {
                queryBuilder.andWhere(`emailTemplates.templateName LIKE :${key}`, { [key]: `%${filter[key]}%` });
            } else {
                queryBuilder.andWhere(`emailTemplates.${key} LIKE :${key}`, { [key]: `%${filter[key]}%` });
            }
        });


        // Sıralama işlemi
        if (sort === 'creatorUser') {
            queryBuilder.orderBy('creatorUser.fullName', order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        } else {
            queryBuilder.orderBy(`emailTemplates.${sort}`, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');
        }

        queryBuilder.skip((page - 1) * limit).take(limit);

        const [emailTemplates, total] = await queryBuilder.getManyAndCount();
        return {
            data: emailTemplates,
            total,
            page,
            lastPage: Math.ceil(total / limit),
        };
    }


    async isActiveUpdate(userId: number, data: any) {

        if (isNaN(data.itemId) || isNaN(data.value)) {
            throw new BadRequestException('itemId ve değer gereklidir');
        }

        if (!userId) {
            throw new BadRequestException(`Kullanıcı ID gereklidir`);
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


        try {
            const template = await this.templateRepository.findOne({ where: { emailTemplateId: data.itemId } });
            if (template) {
                template.isActive = data.value;
                template.lastModifierUserId = user.id;
                await this.templateRepository.save(template);
                return this.templateRepository.createQueryBuilder('emailTemplates')
                    .leftJoinAndSelect('emailTemplates.creatorUser', 'creatorUser')
                    .leftJoinAndSelect('emailTemplates.lastModifierUser', 'lastModifierUser')
                    .leftJoinAndSelect('emailTemplates.deleterUser', 'deleterUser')
                    .where('emailTemplates.emailTemplateId = :emailTemplateId', { emailTemplateId: template.emailTemplateId })
                    .getOne();
            } else {
                return { status: 400, message: 'Şablon bulunamadı' }
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'isActive Update işlemi hatalı',
            );
        }


    }

    async delete(userId: number, data: any) {

        if (!data.itemId) {
            throw new BadRequestException('itemId gereklidir');
        }
        if (isNaN(data.itemId)) {
            throw new BadRequestException('itemId numara türünde olmalıdır');
        }

        if (!userId) {
            throw new BadRequestException(`Kullanıcı ID gereklidir`);
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


        try {
            const template = await this.templateRepository.findOne({ where: { emailTemplateId: data.itemId } });
            if (template) {
                template.isDeleted = true;
                template.deletionTime = new Date();
                template.deleterUserId = user.id;
                await this.templateRepository.save(template);
                return this.templateRepository.createQueryBuilder('emailTemplates')
                    .leftJoinAndSelect('emailTemplates.creatorUser', 'creatorUser')
                    .leftJoinAndSelect('emailTemplates.lastModifierUser', 'lastModifierUser')
                    .leftJoinAndSelect('emailTemplates.deleterUser', 'deleterUser')
                    .where('emailTemplates.emailTemplateId = :emailTemplateId', { emailTemplateId: template.emailTemplateId })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'Şablon bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Şablon silme hatası',
            );
        }


    }

    async reload(userId: number, data: any) {
        if (!data.itemId) {
            throw new BadRequestException('itemId gereklidir');
        }
        if (isNaN(data.itemId)) {
            throw new BadRequestException('itemId numara türünde olmalıdır');
        }

        if (!userId) {
            throw new BadRequestException(`Kullanıcı ID gereklidir`);
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

        try {
            // Silinmiş template'i bul
            const template = await this.templateRepository
                .createQueryBuilder('template')
                .withDeleted()
                .where('template.emailTemplateId = :id', { id: data.itemId })
                .getOne();

            if (template) {
                // Template'i geri yükle
                template.isDeleted = false;
                template.deletionTime = null;
                template.deleterUserId = null;
                template.lastModifierUserId = userId;

                await this.templateRepository.save(template);
                return this.templateRepository.createQueryBuilder('emailTemplates')
                    .withDeleted()
                    .leftJoinAndSelect('emailTemplates.creatorUser', 'creatorUser')
                    .leftJoinAndSelect('emailTemplates.lastModifierUser', 'lastModifierUser')
                    .leftJoinAndSelect('emailTemplates.deleterUser', 'deleterUser')
                    .where('emailTemplates.emailTemplateId = :emailTemplateId', { emailTemplateId: template.emailTemplateId })
                    .getOne();
            } else {
                return {
                    status: 404,
                    message: 'Şablon bulunamadı'
                };
            }
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Şablon geri getirme hatası'
            );
        }
    }

    async create(userId: number, data: CreateTemplatesDto) {


        if (!userId) {
            throw new BadRequestException(`Kullanıcı ID gereklidir`);
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


        try {
            const exectemplate = await this.templateRepository.findOne({ where: { templateName: data.templateName } });

            if (exectemplate) {
                throw new BadRequestException(`Tema adı benzersiz olmalıdır`);
            }

            const template = await this.templateRepository.save({
                creatorUserId: userId,
                templateName: data.templateName,
                subject: data.subject,
                body: data.body
            });
            return this.templateRepository.createQueryBuilder('emailTemplates')
                .leftJoinAndSelect('emailTemplates.creatorUser', 'creatorUser')
                .leftJoinAndSelect('emailTemplates.lastModifierUser', 'lastModifierUser')
                .leftJoinAndSelect('emailTemplates.deleterUser', 'deleterUser')
                .where('emailTemplates.emailTemplateId = :emailTemplateId', { emailTemplateId: template.emailTemplateId })
                .getOne();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Şablon oluşturma hatası',
            );
        }
    }

    async update(userId: number, data: UpdateTemplatesDto) {


        if (!userId) {
            throw new BadRequestException(`Kullanıcı ID gereklidir`);
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
        if (!data.emailTemplateId) {
            throw new BadRequestException(`EmailTemplateId gereklidir`);
        }

        try {
            const template = await this.templateRepository.findOne({ where: { emailTemplateId: data.emailTemplateId } });

            if (!template) {
                throw new BadRequestException(`Şablon bulunamadı`);
            }

            const exectemplate = await this.templateRepository.findOne({ where: { templateName: data.templateName } });

            if (exectemplate) {
                if (exectemplate.emailTemplateId !== template.emailTemplateId) {
                    throw new BadRequestException(`Şablon adı benzersiz olmalıdır`);
                }
            }

            template.lastModifierUserId = userId;
            template.templateName = data.templateName;
            template.subject = data.subject;
            template.body = data.body;

            await this.templateRepository.save(template);
            return this.templateRepository.createQueryBuilder('emailTemplates')
                .withDeleted()
                .leftJoinAndSelect('emailTemplates.creatorUser', 'creatorUser')
                .leftJoinAndSelect('emailTemplates.lastModifierUser', 'lastModifierUser')
                .leftJoinAndSelect('emailTemplates.deleterUser', 'deleterUser')
                .where('emailTemplates.emailTemplateId = :emailTemplateId', { emailTemplateId: template.emailTemplateId })
                .getOne();
        } catch (error) {
            throw new BadRequestException(
                error.message || 'Şablon güncelleme hatası',
            );
        }
    }
}
