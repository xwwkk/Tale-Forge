import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { config } from './config';

dotenv.config();

console.log('开始执行数据库恢复脚本...');
console.log('当前配置:', {
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  database: config.database.database,
  backupDir: config.backupDir,
  pgRestorePath: config.pgRestorePath
});

// 恢复配置
// const config = {
//   database: process.env.DATABASE_URL || '',
//   backupDir: path.join(__dirname, '../backups')
// };

// 执行 pg_restore 命令
// const executePgRestore = async (fileName: string): Promise<void> => {
//   return new Promise((resolve, reject) => {
//     // 从 DATABASE_URL 解析连接信息
//     const dbUrl = new URL(config.database);
//     const database = dbUrl.pathname.slice(1);
//     const host = dbUrl.hostname;
//     const port = dbUrl.port;
//     const username = dbUrl.username;
//     const password = dbUrl.password;

//     // 设置环境变量
//     const env = {
//       ...process.env,
//       PGPASSWORD: password
//     };

//     const pgRestorePath = 'D:\\Program Files\\PostgreSQL\\15\\bin\\pg_restore.exe'; // 根据你的实际安装路径修改

//     // 构建 pg_restore 命令
//     const command = `"${pgRestorePath}" -h ${host} -p ${port} -U ${username} -d ${database} -v "${path.join(config.backupDir, fileName)}"`;

//     exec(command, { env }, (error, stdout, stderr) => {
//       if (error) {
//         console.error('恢复失败:', error);
//         reject(error);
//         return;
//       }
//       console.log('恢复成功:', stdout);
//       resolve();
//     });
//   });
// };

// 列出所有可用的备份
export const listBackups = async (): Promise<string[]> => {
  try {
    const files = await fs.readdir(config.backupDir);
    return files.filter(file => file.startsWith('backup-') && file.endsWith('.sql'));
  } catch (error) {
    console.error('获取备份列表失败:', error);
    throw error;
  }
};

async function dropAllTables() {
  console.log('开始执行清理数据库命令...');
  const psqlPath = path.join(path.dirname(config.pgRestorePath), 'psql.exe');
  
  // 首先获取所有表名的SQL
  const getTablesCommand = `"${psqlPath}" -h ${config.database.host} -p ${config.database.port} -U ${config.database.username} -d ${config.database.database} -t -A -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"`;
  
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      PGPASSWORD: config.database.password
    };
    console.log('获取表名列表...');
    
    exec(getTablesCommand, { env }, async (error, stdout, stderr) => {
      if (error) {
        console.error('获取表名失败:', error);
        reject(error);
        return;
      }

      // 移除回车符并过滤空行
      const tables = stdout.split('\n')
        .map(table => table.replace(/\r/g, '').trim())
        .filter(table => table);

      if (tables.length === 0) {
        console.log('数据库中没有表需要清理');
        resolve(true);
        return;
      }

      console.log('找到以下表:', tables);

      // 禁用外键约束检查
      const disableCommand = `"${psqlPath}" -h ${config.database.host} -p ${config.database.port} -U ${config.database.username} -d ${config.database.database} -c "SET CONSTRAINTS ALL DEFERRED;"`;
      
      console.log('禁用外键约束...');
      exec(disableCommand, { env }, (disableError) => {
        if (disableError) {
          console.error('禁用外键约束失败:', disableError);
          reject(disableError);
          return;
        }

        // 构建清理命令，每个表一个单独的语句
        const truncateStatements = tables.map(table => `TRUNCATE TABLE "${table}" CASCADE;`).join(' ');
        const truncateCommand = `"${psqlPath}" -h ${config.database.host} -p ${config.database.port} -U ${config.database.username} -d ${config.database.database} -c "${truncateStatements}"`;
        
        console.log('执行清理命令...');
        exec(truncateCommand, { env }, (truncateError, truncateStdout, truncateStderr) => {
          if (truncateError) {
            console.error('清理表失败:', truncateError);
            reject(truncateError);
            return;
          }
          if (truncateStderr) {
            console.log('清理过程信息:', truncateStderr);
          }
          console.log('清理输出:', truncateStdout);
          console.log('数据库清理完成');
          resolve(true);
        });
      });
    });
  });
}

async function restoreDatabase(fileName: string): Promise<void> {
  console.log('开始恢复数据库...');
  console.log('备份文件名:', fileName);
  
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      PGPASSWORD: config.database.password
    };

    // 使用 pg_restore 恢复数据库
    const command = `"${config.pgRestorePath}" -h ${config.database.host} -p ${config.database.port} -U ${config.database.username} -d ${config.database.database} -c -v "${path.join(config.backupDir, fileName)}"`;
    console.log('执行恢复命令:', command);

    exec(command, { env }, (error, stdout, stderr) => {
      if (error && !stderr) {  // 如果有 stderr 输出，pg_restore 可能仍然成功了
        console.error('恢复失败:', error);
        reject(error);
        return;
      }
      if (stderr) {
        console.log('恢复过程信息:', stderr);
      }
      console.log('恢复输出:', stdout);
      console.log('数据库恢复成功');
      resolve();
    });
  });
}

// 如果直接运行此脚本
if (require.main === module) {
  console.log('脚本开始执行...');
  const command = process.argv[2];
  console.log('接收到的命令:', command);

  if (command === 'list') {
    // 列出所有可用备份
    listBackups()
      .then(files => {
        if (files.length === 0) {
          console.log('没有找到任何备份文件');
        } else {
          console.log('可用的备份文件:');
          files.forEach(file => {
            console.log(`- ${file}`);
          });
        }
      })
      .catch(error => {
        console.error('获取备份列表失败:', error);
        process.exit(1);
      });
  } else if (command) {
    // 执行恢复
    restoreDatabase(command)
      .then(() => {
        console.log('恢复操作完成');
        process.exit(0);
      })
      .catch(error => {
        console.error('恢复失败:', error);
        process.exit(1);
      });
  } else {
    console.log('使用方法:');
    console.log('  npm run restore list          # 列出所有可用备份');
    console.log('  npm run restore <备份文件名>  # 从指定备份文件恢复');
    process.exit(1);
  }
} 
