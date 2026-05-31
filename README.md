# 闭环 BiHuan - 智能任务管理系统

> 基于 AI 的智能任务管理 MVP，支持自然语言创建任务、自动解析、智能提醒、邮件通知和周/月总结。

## ✨ 功能特性

### 核心功能
- **自然语言任务创建** - 输入「明天下午开会 #工作 #重要」，AI 自动解析内容、优先级、提醒时间和标签
- **智能提醒升级** - 0→1次提醒+3天，1→2次+1天，≥2次标红紧急，防止任务遗忘
- **任务编辑** - 支持修改内容、优先级、备注、精确到分钟的提醒时间
- **标签系统** - 独立标签表，支持标签复用、按标签筛选、多标签组合查询
- **筛选排序** - 关键字搜索、日期范围、状态、标签筛选，支持4种排序方式
- **周/月总结** - AI 生成个性化总结，统计闭环率、逾期数、平均闭环天数
- **用户配置** - 提醒邮箱、每日提醒时间、周报/月报订阅开关

### 高级特性
- **邮件提醒** - 定时任务自动发送提醒邮件、周报、月报
- **限流防刷** - Redis 实现全局/接口级限流，验证码防暴力破解
- **数据隔离** - 用户数据严格隔离，多租户架构
- **JWT 认证** - 密码登录 + 验证码登录双模式

## 🛠 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建**: Vite 5
- **UI**: Ant Design 5
- **路由**: react-router-dom 6
- **状态管理**: Zustand
- **HTTP**: axios
- **日期**: dayjs

### 后端
- **运行时**: Node.js 20
- **框架**: Express 4 + TypeScript
- **数据库**: SQLite (better-sqlite3, WAL 模式)
- **缓存/限流**: Redis (ioredis)
- **AI 服务**: 阿里云通义千问 (DashScope Qwen API)
- **邮件**: nodemailer
- **认证**: jsonwebtoken + bcryptjs
- **验证**: zod
- **日志**: pino
- **定时任务**: node-cron

### 部署
- **容器化**: Docker + Docker Compose
- **Web 服务器**: Nginx (反代 + SPA fallback + PWA 缓存)
- **架构**: 三容器（frontend + backend + redis）

## 📦 快速开始

### 环境要求
- Node.js >= 20
- Redis >= 6
- Docker & Docker Compose (生产部署)

### 本地开发

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd bihuan

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 填写必要配置（见下方说明）

# 3. 安装依赖 & 启动后端
cd backend
npm install
npm run dev

# 4. 启动前端（新终端）
cd frontend
npm install
npm run dev

# 5. 访问
# 前端: http://localhost:5173
# 后端: http://localhost:3001
# 健康检查: http://localhost:3001/health
```

### Docker 部署

```bash
# 1. 配置 .env 文件
cp .env.example .env
# 编辑 .env 填写生产配置

# 2. 构建并启动
docker compose up -d --build

# 3. 访问
# http://<your-server-ip>:9090

# 4. 查看日志
docker compose logs -f

# 5. 停止服务
docker compose down
```

## ⚙️ 环境配置

复制 `.env.example` 为 `.env` 并配置以下变量：

```bash
# ===== JWT =====
JWT_SECRET=<长随机字符串，建议 openssl rand -hex 32>
JWT_EXPIRES_IN=7d

# ===== Redis =====
REDIS_URL=redis://127.0.0.1:6379

# ===== 邮件 (SMTP) =====
MAIL_HOST=smtp.example.com
MAIL_PORT=465
MAIL_SECURE=true
MAIL_USER=your-email@example.com
MAIL_PASS=your-app-password
MAIL_FROM="闭环 BiHuan <noreply@example.com>"

# ===== AI: 阿里云通义千问 =====
QWEN_API_KEY=your-qwen-api-key
QWEN_MODEL=qwen-plus
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# ===== 限流（可选）=====
GLOBAL_RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=20

# ===== 日志 =====
LOG_LEVEL=info
```

### 必要配置说明

| 变量 | 说明 | 示例 |
|------|------|------|
| `JWT_SECRET` | JWT 签名密钥（生产必须修改） | `openssl rand -hex 32` 生成 |
| `REDIS_URL` | Redis 连接字符串 | `redis://localhost:6379` |
| `MAIL_*` | SMTP 邮件服务配置 | 163/QQ/Gmail 邮箱 |
| `QWEN_API_KEY` | 阿里云通义千问 API 密钥 | 在 DashScope 控制台获取 |

## 📖 使用说明

### 1. 注册/登录
- 支持邮箱验证码注册和密码登录
- 首次使用需配置邮件服务

### 2. 创建任务
- 在底部输入框输入自然语言描述
- 示例：`明天下午三点开项目评审会 #工作 #重要`
- AI 自动解析：内容、优先级、提醒时间、标签

### 3. 任务管理
- **查看**: 今日任务页（/today）、全部任务页（/tasks）
- **编辑**: 点击任务卡片「编辑」按钮
- **延期**: 点击「延期」选择天数或自定义
- **闭环**: 点击「完成」标记任务闭环
- **删除**: 点击「删除」确认删除

### 4. 标签筛选
- 创建任务时使用 `#标签` 语法
- 任务列表页可按标签筛选
- 支持多标签组合查询

### 5. 用户设置
- 配置提醒邮箱
- 设置每日提醒时间
- 开启/关闭周报、月报

## 🚀 服务器部署

### 一键部署脚本

```bash
# 1. 配置 deploy.sh 中的服务器信息
SERVER="your-user@your-server-ip"
REMOTE_DIR="/path/to/deploy"

# 2. 执行部署
./deploy.sh

# 3. 按提示输入服务器密码
```

### 手动部署

```bash
# 1. SSH 登录服务器
ssh your-user@your-server-ip

# 2. 进入项目目录
cd /path/to/bihuan

# 3. 构建并启动
docker compose up -d --build

# 4. 验证服务
curl http://localhost:9090/health
```

### 部署注意事项
- 确保 9090 端口已开放
- 首次部署需创建测试账号（可选）
- 生产环境务必修改 `JWT_SECRET`

## 📁 项目结构

```
bihuan/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── config/         # 配置（env、logger）
│   │   ├── db/             # 数据库（migrations、连接）
│   │   ├── modules/        # 业务模块（auth、tasks、summary、config）
│   │   ├── services/       # 服务层（qwen、mailer、redis、cron）
│   │   └── utils/          # 工具函数
│   ├── scripts/            # 脚本（测试账号、AI+邮件测试）
│   └── Dockerfile
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── api/           # API 封装
│   │   ├── components/    # 组件（TaskCard、TaskEditModal 等）
│   │   ├── pages/         # 页面（Login、Today、Tasks、Summary、Settings）
│   │   ├── stores/        # Zustand 状态管理
│   │   └── router/        # 路由配置
│   ├── nginx.conf         # Nginx 配置
│   └── Dockerfile
├── docker-compose.yml      # Docker Compose 配置
├── .env.example           # 环境变量模板
└── .gitignore             # Git 忽略规则
```

## 🔒 安全注意事项

### ⚠️ 重要：保护敏感信息

1. **永远不要提交以下文件到 Git**：
   - `.env` 及其变体（已加入 `.gitignore`）
   - `deploy.sh`、`deploy-manual.sh`（包含服务器地址）
   - 任何包含密钥、密码、Token 的文件

2. **生产环境必须修改**：
   - `JWT_SECRET`（使用 `openssl rand -hex 32` 生成）
   - 邮件服务密码（使用应用专用密码，非登录密码）
   - `QWEN_API_KEY`（在阿里云控制台创建独立密钥）

3. **推荐做法**：
   - 使用 `.env.example` 作为模板，仅包含占位符
   - 通过环境变量或密钥管理服务注入生产配置
   - 定期轮换 API 密钥和 JWT_SECRET

4. **已加入 `.gitignore` 的敏感文件**：
   ```
   .env*
   deploy.sh
   deploy-manual.sh
   *.pem
   *.key
   backend/data/*.db
   ```

## 📊 数据库迁移

项目使用 SQLite + PRAGMA user_version 控制迁移版本：

```bash
# 查看当前版本
sqlite3 backend/data/bihuan.db "PRAGMA user_version;"

# 手动应用迁移（通常自动执行）
# 启动后端时会自动运行 migrate() 函数
```

迁移文件位于 `backend/src/db/migrations/`：
- `0001_init.sql` - 初始表结构
- `0002_tags.sql` - 标签系统

## 🧪 测试

```bash
# 后端测试
cd backend
npm test

# AI + 邮件功能测试
npx ts-node scripts/test-ai-mail.ts

# 创建测试账号
npx ts-node scripts/create-test-user.ts
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT




1. 登录问题，已经注册的账号选择验证码登录，选择获取验证码，出现弹窗请先填写邮箱，这个请修复一下
2. 新任务创建的时候不要用大模型，加载速度太慢，如果需要标签则用 #   代码识别出标签，标签要放在后面，避免识别混淆，
3. 按标签筛选，目前是不生效的，试了多次都没有筛选结构，事项点击编辑的后自动显示之前的标签，如果有标签的话，如果有标签则在详情页显示，并且把标签在任务的列表行的前面显示，方便查看
4. 对于移动端查看网页的适配，布局要优化一下，在移动端也能很好的查看呈现，不至于有任何排版排列问题，
5. AI总结的模版不止要做的了哪些任务，不仅从总数上统计，也要包括内容上的统计，完成了哪些内容，设置了哪些内容，给出跟详细的报告，重新写AI总结的提示词
6. 已经闭环的任务也可以查看和编辑，方便后续查看搜索等