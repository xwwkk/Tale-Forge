# PostgreSQL 安装配置指南

## 1. 下载和安装 PostgreSQL

1. 访问官方下载页面：https://www.postgresql.org/download/windows/
2. 下载 PostgreSQL Windows 安装程序（选择最新稳定版本，如 15.x）
3. 运行安装程序，按照以下步骤操作：
   - 选择安装目录（建议保持默认）
   - 选择要安装的组件（全选）
   - 设置数据目录（建议保持默认）
   - 设置超级用户（postgres）密码：`tlf123456`
   - 设置端口号（默认 5432）
   - 选择区域（默认）

## 2. 验证安装

1. 打开命令提示符，验证 PostgreSQL 是否安装成功：
```bash
psql --version
```

2. 将 PostgreSQL 的 bin 目录添加到系统环境变量：
   - 打开系统属性 -> 环境变量
   - 在 Path 变量中添加：`C:\Program Files\PostgreSQL\15\bin`
   （路径可能因安装位置和版本不同而异）

## 3. 创建数据库和用户

命令行进入数据库：win+s  ->psql  ->SQL shell(psql)->一直enter到输入密码 tlf123456

1. 使用 psql 工具连接到 PostgreSQL：
```bash
psql -U postgres
```

2. 创建数据库和用户：
```sql
-- 创建数据库
CREATE DATABASE taleforge;

-- 创建用户并设置密码
CREATE USER taleforge_user WITH PASSWORD 'tlf123456';

-- 授予用户对数据库的所有权限
GRANT ALL PRIVILEGES ON DATABASE taleforge TO taleforge_user;

-- 连接到新创建的数据库
\c taleforge

-- 授予用户对 public schema 的所有权限
GRANT ALL ON SCHEMA public TO taleforge_user;



验证一下数据库表是否正确创建
psql -U taleforge_user -d taleforge -c "\dt"


现在您可以通过 Prisma Client 来操作数据库了。比如在您的应用代码中：
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
数据库配置已经完成，您可以开始使用了。如果您需要：

查看数据库内容，可以运行 npx prisma studio
修改数据库结构，可以编辑 schema.prisma 文件后再次运行 npx prisma db push
重新生成 Prisma Client，可以运行 npx prisma generate

直接查看数据库数据：npx prisma studio
可以通过pgAdmin 4直接查看到。

## 4. 配置项目环境变量

1. 更新项目的 .env 文件中的数据库连接信息：
```env
DATABASE_URL="postgresql://taleforge_user:your_password@localhost:5432/taleforge"
```

## 5. 初始化 Prisma

1. 安装 Prisma CLI（如果尚未安装）：
```bash
npm install prisma --save-dev
```

（注意，如果修改了数据库中的表结构，执行下面两个指令重新生成就可以了，并且已有的数据项不会被清除。）
2. 生成 Prisma Client：
```bash
npx prisma generate
```
taskkill /F /IM node.exe  （进程占用）

3. 创建数据库表：
```bash
npx prisma db push
```

## 6. 验证连接

1. 使用 Prisma Studio 查看和管理数据：
```bash
npx prisma studio
```
这将打开一个网页界面（默认地址：http://localhost:5555），可以直观地查看和管理数据库内容。

## 常见问题解决

1. 如果连接报错，检查：
   - PostgreSQL 服务是否运行（可在服务管理器中查看）
   - 数据库用户名和密码是否正确
   - 防火墙是否允许 5432 端口的连接

2. 重启 PostgreSQL 服务：
   - 打开服务管理器
   - 找到 "postgresql-x64-15" 服务
   - 右键 -> 重新启动

3. 查看日志：
   - 日志文件位置：`C:\Program Files\PostgreSQL\15\data\log`

## 开发工具推荐

1. pgAdmin 4：官方图形化管理工具，随 PostgreSQL 一起安装
   - 访问地址：http://127.0.0.1:53113/browser/
   - 使用 postgres 超级用户登录

2. DBeaver：通用数据库管理工具
   - 下载地址：https://dbeaver.io/download/
   - 支持多种数据库，界面友好

## 数据库备份和恢复

1. 备份数据库：
```bash
pg_dump -U postgres -d taleforge > backup.sql
```

2. 恢复数据库：
```bash
psql -U postgres -d taleforge < backup.sql
```

## 安全建议

1. 修改默认超级用户 postgres 的密码
2. 限制数据库访问IP（编辑 pg_hba.conf）
3. 定期备份数据库
4. 不要在生产环境使用开发环境的密码
5. 使用环境变量管理敏感信息

## 性能优化

1. 配置 postgresql.conf：
   - shared_buffers：建议设置为系统内存的 25%
   - effective_cache_size：建议设置为系统内存的 50%
   - work_mem：根据查询复杂度调整
   - maintenance_work_mem：用于维护操作的内存

2. 定期执行 VACUUM：
```sql
VACUUM ANALYZE;
```

这样可以优化数据库性能并回收空间。
