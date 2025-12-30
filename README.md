# Polymarket Copy Trading Bot（中文说明）

> 面向 Polymarket 的自动化跟单机器人：跟随优秀交易者，按资金比例智能下单，实时执行。

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

## 开源来源与致谢

本仓库是在开源项目基础上二次开发而来，原作者与原仓库如下：

- 原仓库：https://github.com/vladmeer/polymarket-copy-trading-bot
- 原作者：vladmeer

## 我做了哪些升级

- 一键部署/启动：新增 `一键启动.command`，尽量降低本地启动门槛
- 可视化前端：提供 `web/` 前端（可用于可视化查看/操作）
- 中文部署说明：新增 `中文部署说明.md`，补全中文用户上手流程

---

## 以下为原 README 的中文翻译

## 概览

Polymarket Copy Trading Bot 会将成功的 Polymarket 交易者的交易自动复制到你的钱包中。它会 24/7 监控交易者活动，基于你的资金与交易者资金的比例计算仓位，并实时下达对应订单。

### 工作原理

<img width="995" height="691" alt="screenshot" src="https://github.com/user-attachments/assets/79715c7a-de2c-4033-81e6-b2288963ec9b" />

1. **选择交易者** - 从 [Polymarket 排行榜](https://polymarket.com/leaderboard) 或 [Predictfolio](https://predictfolio.com) 选择优秀交易者
2. **监控活动** - 机器人通过 Polymarket Data API 持续监控所选交易者的新开仓
3. **计算下单量** - 根据你的余额与交易者余额自动缩放跟单金额
4. **执行订单** - 使用你的钱包在 Polymarket 上下达对应订单
5. **跟踪表现** - 在 MongoDB 中维护完整的交易历史

## 快速开始

### 前置要求

- Node.js v18+
- MongoDB 数据库（可使用 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) 免费额度）
- Polygon 钱包（持有 USDC 作为交易资金，持有 POL/MATIC 作为 gas）
- Polygon RPC 节点（可使用 [Infura](https://infura.io) 或 [Alchemy](https://www.alchemy.com) 免费额度）

### 安装

```bash
# 克隆仓库
git clone <repository-url>
cd <project-directory>

# 安装依赖
npm install

# 运行交互式配置向导
npm run setup

# 构建并启动
npm run build
npm run health-check  # 校验配置是否正确
npm start             # 开始跟单（真实交易）
```

**📖 更详细的配置说明请见：[Getting Started Guide](./docs/GETTING_STARTED.md)**

## 功能特性

- **多交易者跟踪** - 同时跟踪并跟单多个交易者
- **智能仓位计算** - 基于你的资金自动调整跟单规模
- **分段倍数（Tiered Multipliers）** - 按交易规模应用不同倍数
- **仓位追踪** - 即使余额变动也能准确追踪买入/卖出
- **交易聚合** - 将多笔小额交易合并为一笔可执行的订单
- **实时执行** - 默认每秒监控一次并尽快执行
- **MongoDB 集成** - 持久化保存全部交易与仓位信息
- **价格保护** - 内置滑点检查，避免在不利价格成交

### 监控方式

当前机器人使用 **Polymarket Data API** 来监控交易者活动并检测新开仓。监控系统会以可配置的间隔（默认 1 秒）轮询交易者仓位，从而保证跟单检测与执行的及时性。

## 配置

### 核心环境变量

| 变量 | 含义 | 示例 |
|---|---|---|
| `USER_ADDRESSES` | 要跟单的交易者地址（逗号分隔） | `'0xABC..., 0xDEF...'` |
| `PROXY_WALLET` | 你的 Polygon 钱包地址 | `'0x123...'` |
| `PRIVATE_KEY` | 钱包私钥（不带 0x 前缀） | `'abc123...'` |
| `MONGO_URI` | MongoDB 连接串 | `'mongodb+srv://...'` |
| `RPC_URL` | Polygon RPC 节点地址 | `'https://polygon...'` |
| `TRADE_MULTIPLIER` | 仓位倍率（默认 1.0） | `2.0` |
| `FETCH_INTERVAL` | 轮询间隔（秒，默认 1） | `1` |

### 如何寻找要跟单的交易者

1. 访问 [Polymarket Leaderboard](https://polymarket.com/leaderboard)
2. 寻找：P&L 为正、胜率 >55%、交易活跃的交易者
3. 在 [Predictfolio](https://predictfolio.com) 查看更细的统计数据
4. 将钱包地址填入 `.env` 的 `USER_ADDRESSES`

**📖 完整配置指南请见：[Quick Start](./docs/QUICK_START.md)**

## Docker 部署

使用 Docker Compose 快速部署到可用于生产的环境：

```bash
# 配置并启动
cp .env.example .env
docker-compose up -d

# 查看日志
docker-compose logs -f polymarket
```

**📖 完整 Docker 指南： [Complete Docker Guide →](./docs/DOCKER.md)**

## 文档

### 新手指南

- **[🚀 Getting Started Guide](./docs/GETTING_STARTED.md)** - 面向新手的完整指南
- **[⚡ Quick Start](./docs/QUICK_START.md)** - 面向熟练用户的快速上手

## 许可证

ISC License - 详见 [LICENSE](LICENSE)。

## 致谢

- 基于 [Polymarket CLOB Client](https://github.com/Polymarket/clob-client)
- 使用 [Predictfolio](https://predictfolio.com) 进行交易者分析
- 运行在 Polygon 网络之上

---

## 高级版本

**🚀 Version 2 Available：**带有 **RTDS（Real-Time Data Stream）** 监控的高级版本目前以私有仓库形式提供。<br />
Version 2 提供更快的检测方式（接近即时跟单）、更低延迟、更少 API 压力，跟单效果更佳。

<img width="680" height="313" alt="image (19)" src="https://github.com/user-attachments/assets/d868f9f2-a1dd-4bfe-a76e-d8cbdfbd8497" />

## 交易工具

作者也开发了一个基于 **Rust** 的 Polymarket 交易机器人。

<img width="1917" height="942" alt="image (21)" src="https://github.com/user-attachments/assets/08a5c962-7f8b-4097-98b6-7a457daa37c9" />
https://www.youtube.com/watch?v=4f6jHT4-DQs

**免责声明：**本软件仅用于学习与研究用途。交易存在亏损风险，开发者不对使用本软件造成的任何损失负责。

**支持：**如有问题或需求，可通过 Telegram：[@Vladmeer](https://t.me/vladmeer67) | Twitter：[@Vladmeer](https://x.com/vladmeer67) 联系作者。
