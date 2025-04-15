# Tale Forge - Web3新一代小说创作与分享平台

Tale Forge是一个基于BNB Chain的去中心化小说创作平台，为作者提供创作、发布和变现的一站式解决方案。

## 数据流设计

### 存储策略
1. 链上数据
   - 作者注册信息
   - 作品基本信息和状态
   - NFT相关数据

2. IPFS存储
   - 作品内容
   - 封面图片
   - 其他媒体资源

3. 数据库存储
   - 用户基本信息
   - 作品元数据和索引(CID)
   - 评论、点赞等互动数据
   - 统计数据

### 数据流程
1. 创建作品流程:
   ```
   前端 -> API Routes -> 后端验证 
   -> 上传到IPFS获取CID 
   -> 保存元数据到数据库
   -> (发布时)上链
   ```

2. 查询作品流程:
   ```
   前端请求 -> API Routes -> 数据库获取元数据
   -> 按需从IPFS获取内容
   -> (NFT相关)查询链上数据
   ```

## 项目结构

```
tale-forge-bnb/
├── frontend/          # 前端相关代码
│   ├── ui/           # 共享 UI 组件
│   ├── lib/          # 前端通用工具库
│   ├── web/          # 主要应用
│   ├── package.json  # 前端依赖
│   ├── .env          # 前端环境变量
│   └── ...其他配置文件
├── backend/           # 后端相关代码
│   ├── database/     # 数据库模块
│   ├── src/          # 后端源代码
│   ├── package.json  # 后端依赖
│   ├── .env          # 后端环境变量
│   └── ...其他配置文件
├── blockchain/        # 区块链相关代码
│   ├── contracts/    # 智能合约
│   ├── scripts/      # 部署脚本
│   ├── test/         # 测试
│   ├── artifacts/    # 编译输出
│   ├── cache/        # 编译缓存
│   ├── package.json  # 区块链依赖
│   ├── .env          # 区块链环境变量
│   └── ...其他配置文件
├── project_dev_doc/   # 项目文档
│   ├── 项目重构总结.md
│   └── 白皮书.txt
├── package.json      # 根目录工作区配置
├──shared/
│  ├── src/
│  │   ├── contracts/
│  │   │   ├── abis/
│  │   │   │   ├── AuthorManager.json
│  │   │   │   └── StoryManager.json
│  │   │   └── index.ts
│  │   ├── types/
│  │   │   └── contracts.ts
│  ├
│  ├── package.json
│  └── tsconfig.json
└── ...其他项目级文件
```


## 主要功能

1. 作者管理
   - 作者注册和身份验证
   - 笔名管理
   - 作者数据统计

2. 故事管理
   - 创建和发布故事
   - 章节更新
   - 字数统计和完结管理

3. NFT功能
   - 故事NFT铸造
   - NFT交易市场
   - 版权保护

4. 代币经济
   - TAFOR代币
   - 挖矿奖励
   - 作者激励

5. 读者活动
   - 签到系统
   - 抽奖活动
   - 读者互动

## 技术栈

- 前端：Next.js 14, React 18, TypeScript
- 智能合约：Solidity, Hardhat
- 数据库：PostgreSQL
- 存储：IPFS (Pinata)
- Web3：Wagmi, Viem
- UI：Tailwind CSS

## 开发环境设置

1. 克隆项目
```bash
git clone https://github.com/your-username/tale-forge.git
cd tale-forge
```

2. 安装依赖
```bash
# 安装所有依赖
npm install
```

3. 数据库配置
```bash
# 创建数据库
createdb taleforge

# 配置数据库连接
cp backend/.env.example backend/.env
# 修改 DATABASE_URL

# 执行数据库迁移
cd backend

# 生成 Prisma 客户端
npm run db:generate

npx prisma migrate dev
```

4. IPFS配置
```bash
# 配置 Pinata
# backend/.env
PINATA_API_KEY=your_key
PINATA_API_SECRET=your_secret
IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs
```

5. 智能合约部署
```bash
cd blockchain

# 配置部署账户
cp .env.example .env
# 填写 PRIVATE_KEY

# 编译合约
npx hardhat compile

# 部署合约
npx hardhat run scripts/deploy.ts --network bscTestnet

# 更新前端合约地址
cp frontend/web/.env.example frontend/web/.env
# 填写已部署的合约地址
```

6. 启动服务
```bash
# 启动后端
cd backend
npm run dev

# 启动前端
cd frontend
npm run dev
```

现在可以访问:
- 前端: http://localhost:3000
- 后端: http://localhost:3001
- 数据库管理: http://localhost:5555 (npx prisma studio)

## 项目优化

为了保持项目的整洁和高效，我们提供了几个优化脚本：

1. 清理所有依赖
```bash
npm run clean:deps
```

2. 清理构建文件
```bash
npm run clean:build
```

3. 清理缓存文件
```bash
npm run clean:cache
```

4. 完整优化（清理并重新安装）
```bash
npm run optimize
```

这些命令有助于减少项目大小，避免依赖重复和缓存文件积累。我们使用 npm 工作区（workspaces）来共享依赖，减少重复安装。

## 部署

1. 部署智能合约
```bash
cd blockchain

# 测试网部署
npx hardhat run scripts/deploy.js --network bscTestnet

# 主网部署
npx hardhat run scripts/deploy.js --network bsc
```

2. 部署前端应用
```bash
cd frontend
npm run build
npm run start
```

3. 部署后端服务
```bash
cd backend
npm run build
npm run start
```

## 常见问题

1. 数据库连接错误
   - 检查 PostgreSQL 服务是否运行
   - 验证数据库用户名和密码是否正确
   - 确认数据库是否已创建

2. 合约交互失败
   - 确保钱包已连接到 BSC 测试网
   - 检查钱包中是否有足够的 BNB 支付 gas 费用

3. IPFS 上传失败
   - 检查网络连接
   - 验证 Pinata API 密钥配置

4. 项目过大或构建缓慢
   - 运行 `npm run optimize` 清理不必要的文件
   - 确保不要在多个位置重复安装相同的依赖
   - 删除不必要的缓存文件和构建产物

## 合约地址

### 测试网(BSC Testnet)
- TaforToken: [待部署]
- AuthorManager: [待部署]
- StoryManager: [待部署]
- NovelNFT: [待部署]
- MiningPool: [待部署]
- ReaderActivity: [待部署]

### 主网(BSC Mainnet)
- TaforToken: [待部署]
- AuthorManager: [待部署]
- StoryManager: [待部署]
- NovelNFT: [待部署]
- MiningPool: [待部署]
- ReaderActivity: [待部署]


## 安全考虑

1. 所有合约已经过全面测试
2. 实现了暂停机制以应对紧急情况
3. 使用OpenZeppelin库的标准实现
4. 包含访问控制和权限管理
5. 实现了防重入保护


7. 数据库管理
### 备份和恢复

为确保数据安全和系统可靠性，我们提供了完整的数据库备份和恢复方案：

#### 环境要求

- PostgreSQL 15 或以上版本
- Node.js 16 或以上版本
- PostgreSQL bin 目录（包含 pg_dump.exe 和 pg_restore.exe）需在系统 PATH 中

#### 备份操作

1. 手动备份
```bash
cd backend
npm run backup
```
备份文件将保存在 `backend/backups` 目录，格式为 `backup-YYYY-MM-DD-HH-mm-ss.sql`

2. 自动定时备份
```bash
cd backend
npm run backup:schedule
```
默认每天凌晨 3 点自动执行备份，可在 `scripts/schedule-backup.ts` 中修改时间

#### 数据恢复

1. 执行恢复命令：
```bash
cd backend
npm run restore list   //查看备份文件
npm run restore <backup-file-name>  //恢复指定备份文件
      
# 例如：npm run restore backup-2025-03-27-16-53-32.sql
```
注意一下对应数据库备份文件夹下包含了所有相关功能代码，包括配置文件。

2. 恢复过程会自动：
   - 清理现有数据库对象
   - 导入备份数据
   - 重建索引和约束

3. 验证数据：
```bash
cd backend
npm run verify
```
验证脚本会检查所有关键表的记录数量和数据完整性

#### 故障排除

1. 权限问题
   - 确保数据库用户权限完整
   - 检查环境变量配置
   ```env
   # backend/.env
   DATABASE_URL="postgresql://username:password@localhost:5432/dbname"
   ```

2. 恢复失败
   - 检查备份文件完整性
   - 确认数据库连接正常
   - 查看错误日志

3. 数据异常
   - 验证表结构完整性
   - 检查外键约束
   - 确认数据一致性

#### 最佳实践

1. 备份策略
   - 保持定期备份
   - 保留多个时间点的备份
   - 重要操作前进行备份

2. 性能优化
   - 选择系统负载低时进行备份
   - 大型数据库备份需预留足够时间
   - 避免高峰期进行恢复操作

3. 安全建议
   - 定期验证备份有效性
   - 妥善保管备份文件
   - 控制备份文件访问权限



## 贡献指南

1. Fork本仓库
2. 创建特性分支
3. 提交更改
4. 发起Pull Request

## 许可证

MIT License 

## 网络配置

主网和测试网切换非常简单，只需修改环境变量文件中的一个配置项即可：

1. 复制 `.env.example` 到 `.env`

2. 在 `.env` 中设置网络环境：
```bash
# false 使用测试网，true 使用主网
NEXT_PUBLIC_USE_MAINNET=false  # 改为 true 则使用主网
```

3. 启动项目即可，无需其他操作

系统会自动根据这个环境变量选择对应的合约地址，你不需要在命令行输入任何额外指令。

注意：修改环境变量后需要重启项目才能生效。

## 其他配置和说明... 


