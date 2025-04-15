import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import moment from 'moment';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// 备份配置
const config = {
  database: process.env.DATABASE_URL || '',
  backupDir: path.join(__dirname, '../backups'),
  retentionDays: 3
};

// 创建备份文件名
const createBackupFileName = () => {
  return `backup-${moment().format('YYYY-MM-DD-HH-mm-ss')}.sql`;
};

// 执行 pg_dump 命令
const executePgDump = async (fileName: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 从 DATABASE_URL 解析连接信息
    const dbUrl = new URL(config.database);
    const database = dbUrl.pathname.slice(1);
    const host = dbUrl.hostname;
    const port = dbUrl.port;
    const username = dbUrl.username;
    const password = dbUrl.password;

    // 设置环境变量
    const env = {
      ...process.env,
      PGPASSWORD: password
    };

    // 构建 pg_dump 命令
    // const command = `pg_dump -h ${host} -p ${port} -U ${username} -F c -b -v -f "${path.join(config.backupDir, fileName)}" ${database}`;
    const pgDumpPath = 'D:\\Program Files\\PostgreSQL\\15\\bin\\pg_dump.exe'; // 根据你的实际安装路径修改
    const command = `"${pgDumpPath}" -h ${host} -p ${port} -U ${username} -F c -b -v -f "${path.join(config.backupDir, fileName)}" ${database}`;

    exec(command, { env }, (error, stdout, stderr) => {
      if (error) {
        console.error('备份失败:', error);
        reject(error);
        return;
      }
      console.log('备份成功:', stdout);
      resolve();
    });
  });
};

// 清理旧备份
const cleanOldBackups = async (): Promise<void> => {
  try {
    const files = await fs.readdir(config.backupDir);
    const now = moment();

    for (const file of files) {
      if (!file.startsWith('backup-') || !file.endsWith('.sql')) continue;

      const filePath = path.join(config.backupDir, file);
      const stats = await fs.stat(filePath);
      const fileDate = moment(stats.mtime);

      if (now.diff(fileDate, 'days') > config.retentionDays) {
        await fs.unlink(filePath);
        console.log(`已删除旧备份: ${file}`);
      }
    }
  } catch (error) {
    console.error('清理旧备份失败:', error);
  }
};

// 主备份函数
export const backupDatabase = async (): Promise<void> => {
  try {
    // 确保备份目录存在
    await fs.mkdir(config.backupDir, { recursive: true });

    // 创建备份
    const fileName = createBackupFileName();
    await executePgDump(fileName);

    // 清理旧备份
    await cleanOldBackups();

    console.log('数据库备份完成');
  } catch (error) {
    console.error('数据库备份失败:', error);
    throw error;
  }
};

// 如果直接运行此脚本
if (require.main === module) {
  backupDatabase()
    .catch(console.error)
    .finally(async () => {
      await prisma.$disconnect();
    });
} 