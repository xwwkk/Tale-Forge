import { scheduleJob } from 'node-schedule';
import { backupDatabase } from './db-backup';

// 每天凌晨 2 点执行备份
scheduleJob('0 2 * * *', async () => {
  console.log('开始执行数据库备份...');
  try {
    await backupDatabase();
    console.log('数据库备份完成');
  } catch (error) {
    console.error('数据库备份失败:', error);
  }
}); 