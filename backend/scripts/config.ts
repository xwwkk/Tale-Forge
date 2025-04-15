import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

interface Config {
  database: DatabaseConfig;
  backupDir: string;
  pgRestorePath: string;
}

export const config: Config = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'taleforge_user',
    password: process.env.DB_PASSWORD || 'tlf123456',
    database: process.env.DB_NAME || 'taleforge'
  },
  backupDir: path.join(__dirname, '../backups'),
  pgRestorePath: 'D:\\Program Files\\PostgreSQL\\15\\bin\\pg_restore.exe'
}; 