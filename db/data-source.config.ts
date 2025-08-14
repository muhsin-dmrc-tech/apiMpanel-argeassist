import { DataSourceOptions } from "typeorm";
import * as dotenv from 'dotenv';

dotenv.config()

export function getConfig() {
    return {
        type: 'mssql',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT) || 0,
        username: process.env.DB_USERNAME || '',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE || '',
        //synchronize: false,
        //autoLoadEntities: true, // Entity'leri otomatik yükler
        entities: ['dist/**/*.entity.js'],
        migrations: ['dist/db/migrations/*.js'],
        options: {
            encrypt: false,
            trustServerCertificate: true,
        },
        extra: {
            connectionTimeoutMillis: 30000,
            connectionLimit: 10,
            idleTimeoutMillis: 30000,
            max: 10,
            retryAttempts: 5,
            retryDelay: 3000,
            options: {
            instanceName: 'MSSQLSERVER2019',
                fallbackToDefaultDb: true,
                trustServerCertificate: true,
            }
        }
    } as DataSourceOptions;
}