# 🍓 草莓管家 - 项目说明文档

> **版本**: v0.9.1 | **更新日期**: 2026-03-10 | **GitHub**: https://github.com/Yoky-PGrey/AIChat-for-strawberry-VibeCoding

---

## 📋 项目概述

**草莓管家** 是一款专为草莓种植者打造的 AI 智能问答助手，提供专业的草莓种植知识、病虫害防治、栽培技术等专业咨询。

### 核心功能
- 🍓 **专业问答**：基于草莓种植知识的 AI 对话
- 📚 **知识库增强**：GraphRAG 检索增强，提升回答准确性
- 🎤 **多模态输入**：文字 + 语音两种交互方式
- 🔊 **语音播报**：AI 回答语音朗读，方便田间操作
- 📱 **多端适配**：支持 H5、App、小程序等多个平台
- ⚙️ **个性化配置**：字体大小、语音开关等自定义设置

---

## 🏗️ 整体架构

### 当前架构（MVP 版本）

```
┌─────────────────────────────────┐
│          UniApp 客户端                   │
│   Android / iOS / H5 / 小程序            │
└──────────────────┬──────────────────────┘
                   │ 直接 HTTP 请求
                   ▼
┌─────────────────────────────────┐
│             外部服务（直连）              │
│   • DeepSeek API (api.deepseek.com)     │
│   • GraphRAG 知识库服务（用户配置）      │
│   • 讯飞 ASR（已集成，待配置）          │
└─────────────────────────────────┘
```

### 技术栈

| 组件 | 技术实现 | 状态 |
|------|----------|------|
| 前端框架 | UniApp + Vue 3 + Vite | ✅ 已配置 |
| 状态管理 | Pinia | ✅ 已集成 |
| HTTP 请求 | Fetch API | ✅ 已封装 |
| AI 对话 | DeepSeek API 直连 | ✅ 流式对话 |
| 知识库 | GraphRAG HTTP API | ✅ 已集成 |
| 语音播报 | 系统 TTS | ✅ App+H5兼容 |
| 语音识别 | 讯飞 ASR | ✅ 已接入（待配置） |
| 本地存储 | uni-app Storage | ✅ 已实现 |
| UI 框架 | 自定义 CSS + rpx | ✅ 响应式 |

### 数据流设计

```
用户提问 → 知识库检索 → 构建系统提示词 →
DeepSeek 流式对话 → 实时渲染 → 存储记录 →
语音播报（可选）
```

---

## 🔑 配置项

### DeepSeek API 配置

**API Key**: `sk-xxxxxxxxxxxxxxxxxxxxxxxx` (请替换为您的实际 Key)

> ⚠️ **安全提醒**:
> 1. 使用后端服务中转 API 请求
> 2. 配置环境变量管理敏感信息
> 3. 定期检查 DeepSeek 平台使用情况

**配置方式**: 在应用设置页面（⚙️ 设置 → AI 接口配置 → DeepSeek API Key）中输入并保存。

### GraphRAG 知识库配置

**配置方式**: 在应用设置页面配置知识库服务地址，支持自定义 GraphRAG HTTP API 端点。

### 讯飞 ASR 配置

**配置方式**: 在应用设置页面配置以下参数：
- APPID：讯飞应用 ID
- API Key：讯飞 API Key
- API Secret：讯飞 API Secret

---

## 📊 当前进度

### 项目状态概览

| 模块 | 状态 | 完成度 |
|------|------|--------|
| **UniApp 前端** | ✅ 核心逻辑重构完成 | 98% |
| **核心功能** | ✅ 多模型流式对话已实现 | 98% |
| **用户体验** | ✅ Markdown 渲染已集成 | 95% |
| **后端服务** | ❌ 未开始 | 0% |
| **数据库** | ❌ 未开始 | 0% |
| **语音识别** | ✅ 已接入 | 85% |

### 已完成功能

#### 1. 项目结构重构
- ✅ **多模型支持**：支持 DeepSeek、KIMI、通义千问 (QWEN) 自由切换。
- ✅ **模块化 LLM 逻辑**：建立 `utils/llm/` 统一分发层，代码结构更清晰。
- ✅ **Markdown 渲染**：集成轻量级解析器，支持 AI 回复的格式化显示（加粗、代码块、列表等）。

#### 2. 页面功能优化
**首页** (`pages/home/home.vue`)
- ✅ **UI 细节优化**：统一 40rpx 对话内边距，气泡宽度自适应内容。
- ✅ **Markdown 集成**：AI 回复支持富文本显示。
- ✅ **路径兼容性**：修复了在不同调试环境下的路径引用问题。

**设置页** (`pages/settings/settings.vue`)
- ✅ **多模型配置**：支持为不同模型独立配置 API Key 和 URL。
- ✅ **输入可靠性**：全面改用 `textarea` 解决 H5 环境下无法点击输入的问题。
- ✅ **交互增强**：保存设置后自动跳转回首页。

#### 3. 状态管理
- ✅ **Store 升级**：`store/chat.js` 支持多模型配置持久化，修复了语法错误。

### 待办事项

| 优先级 | 任务 | 状态 |
|--------|------|------|
| P1 | 语音功能真实接入 (ASR/TTS) | 进行中 |
| P1 | 搭建后端服务（解决 API Key 安全） | 未开始 |
| P2 | 历史记录多会话管理 | 待开始 |
| P2 | 数据库集成、用户认证系统 | 未开始 |
| P3 | 实际接入讯飞 ASR API（申请权限） | 待配置 |

---

## 📂 项目结构

### 前端目录
```
strawberry-app/
├── pages/
│   ├── home/home.vue              # 首页/对话界面
│   └── settings/settings.vue      # 设置页
├── components/
│   └── side-drawer.vue            # 侧边导航组件
├── store/
│   └── chat.js                    # Pinia store (多模型配置)
├── utils/
│   ├── llm/                       # 大模型请求模块
│   │   ├── index.js               # 统一分发入口
│   │   └── deepseek.js            # OpenAI 兼容请求实现
│   ├── marked.js                  # 轻量级 Markdown 解析
│   ├── knowledge.js               # 知识库封装
│   ├── tts.js                     # 语音播报封装
│   ├── asr.js                     # 语音识别封装
│   ├── errorHandler.js            # 统一错误处理
│   └── animations.js              # 动画工具库
├── static/
│   └── logo.png
├── pages.json                     # 路由配置
├── manifest.json                  # 应用配置
├── main.js                        # 应用入口
└── App.vue                        # 应用根组件
```
strawberry-app/
├── pages/                        # 3个完整页面
├── store/                        # Pinia 状态管理
├── utils/                        # 核心工具模块
│   ├── deepseek.js              # DeepSeek API 封装
│   ├── knowledge.js             # 知识库封装
│   ├── tts.js                   # 语音播报封装
│   ├── asr.js                   # 语音识别封装
│   ├── errorHandler.js           # 统一错误处理
│   └── animations.js            # 动画工具库
├── static/                       # 静态资源
└── 配置文件齐全
```

#### 2. 页面功能

**首页** (`pages/home/home.vue`) - 对话界面
- ✅ 侧边导航集成（抽屉式菜单）
- ✅ 顶部导航栏（菜单图标 + 标题 + 新建对话按钮）
- ✅ 输入框设计（白色背景，边框 #ffe7d2）
- ✅ 快捷问题卡片（白色背景，#ffe7d2 边框）
- ✅ 底部输入区域（fixed 定位，贴近问题卡片）

**设置页** (`pages/settings/settings.vue`)
- ✅ 侧边导航集成
- ✅ 字体大小调节（4档：小、中、大、特大）
- ✅ 语音播报开关
- ✅ DeepSeek API Key 配置
- ✅ GraphRAG 知识库地址配置
- ✅ 讯飞 ASR 配置（APPID、API Key、Secret）
- ✅ 知识库连接测试功能
- ✅ 配置项本地持久化

### 待办事项

| 优先级 | 任务 | 状态 |
|--------|------|------|
| P1 | 配置 DeepSeek API Key 并测试 | 待开始 |
| P1 | 搭建后端服务（解决 API Key 安全） | 未开始 |
| P2 | 多端兼容性测试（H5/App/小程序） | 待开始 |
| P2 | 数据库集成、用户认证系统 | 未开始 |
| P3 | 实际接入讯飞 ASR API（申请权限） | 待配置 |

---

## 📂 项目结构

### 前端目录
```
strawberry-app/
├── pages/
│   ├── home/home.vue              # 首页/对话界面
│   └── settings/settings.vue      # 设置页
├── components/
│   └── side-drawer.vue            # 侧边导航组件
├── store/
│   └── chat.js                    # Pinia store
├── utils/
│   ├── deepseek.js                # DeepSeek API 封装
│   ├── knowledge.js               # 知识库封装
│   ├── tts.js                     # 语音播报封装
│   ├── asr.js                     # 语音识别封装
│   ├── errorHandler.js            # 统一错误处理
│   └── animations.js              # 动画工具库
├── static/
│   └── logo.png
├── pages.json                     # 路由配置
├── manifest.json                  # 应用配置
├── main.js                        # 应用入口
└── App.vue                        # 应用根组件
```

---

## 🔧 开发指南

### 环境搭建

**1. 安装 HBuilderX**
- 前往 [DCloud 官网](https://www.dcloud.io/hbuilderx.html) 下载
- 推荐版本：v3.9+，支持 Vue 3

**2. 导入项目**
```
HBuilderX → 文件 → 导入 → 从本地目录导入 → 选择 strawberry-app/
```

**3. 运行项目**
```
HBuilderX 顶部菜单 → 运行 → 选择目标平台
```

### 代码规范

- **Vue 组件**: 使用 Composition API
- **命名规范**:
  - 组件：PascalCase (`ChatMessage.vue`)
  - 变量：camelCase (`userInfo`)
  - 常量：UPPER_SNAKE_CASE (`API_BASE_URL`)

### Git 提交规范

```
feat: 添加新功能
fix: 修复 Bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
```

---

## 🚀 部署

### 当前方式（纯前端）
```
HBuilderX → 发行 → 选择目标平台
```

### 计划方式（后端架构）

**后端技术栈**:
- Node.js + Express
- MySQL 数据库
- JWT 认证
- API 中转服务

**部署步骤**:
1. 搭建后端服务
2. 配置 Nginx 反向代理
3. 配置 SSL 证书
4. 部署前端静态文件

---

## 📞 支持

**GitHub**: https://github.com/Yoky-PGrey/AIChat-for-strawberry-VibeCoding

**常见问题**:
- H5 环境跨域问题 → 配置代理或使用后端中转
- 语音播报不工作 → 检查浏览器/设备支持
- API Key 问题 → 参考配置指南

---

**最后更新**: 2026-03-10
**当前版本**: v0.9.1
**目标版本**: v1.0.0

---

## 🎨 UI 重构进度（基于 Figma 设计）

### Figma 设计稿
- **首页**: https://www.figma.com/design/oHWxkM9XABFBwOALLI4e5T/草莓专家AI设计稿?node-id=1-2
- **侧边导航**: https://www.figma.com/design/oHWxkM9XABFBwOALLI4e5T/草莓专家AI设计稿?node-id=12-31
- **语音对话控件**: https://www.figma.com/design/oHWxkM9XABFBwOALLI4e5T/草莓专家AI设计稿?node-id=41-2
- **设置页导航**: https://www.figma.com/design/oHWxkM9XABFBwOALLI4e5T/草莓专家AI设计稿?node-id=57-20

### 已完成
- ✅ 侧边导航组件 (`components/side-drawer.vue`)
- ✅ 侧边导航集成到各页面
- ✅ 首页输入框样式优化
- ✅ 设置页导航按钮优化

### 样式规范
| 元素 | Figma 设计 | 当前实现 |
|------|-------------|----------|
| 导航 | 侧边抽屉导航 | ✅ 已实现 |
| 快捷问题边框 | #ffe7d2 | ✅ 已实现 |
| 输入框背景 | #fff | ✅ 已实现 |
| 输入框边框 | #ffe7d2 | ✅ 已实现 |
| 输入框圆角 | 13px | ✅ 已实现 |

### 组件状态
- ✅ `components/side-drawer.vue` - 已完成
- ✅ `pages/home/home.vue` - 已完成
- ✅ `pages/settings/settings.vue` - 已完成

### 设计差异对照
| 元素 | 当前代码 | Figma 目标 |
|------|---------|------------|
| 导航 | 底部 Tabbar | 侧边抽屉导航 |
| 快捷问题边框 | #ffe7d2 | #ffe7d2 |
| 输入框背景 | #fff | #fff |
| 输入框圆角 | 13px | 13px |

---

## 🔧 开发指南

### 环境搭建

**1. 安装 HBuilderX**
- 前往 [DCloud 官网](https://www.dcloud.io/hbuilderx.html) 下载
- 推荐版本：v3.9+，支持 Vue 3

**2. 导入项目**
```
HBuilderX → 文件 → 导入 → 从本地目录导入 → 选择 strawberry-app/
```

**3. 运行项目**
```
HBuilderX 顶部菜单 → 运行 → 选择目标平台
```

### 代码规范

- **Vue 组件**: 使用 Composition API
- **命名规范**:
  - 组件：PascalCase (`ChatMessage.vue`)
  - 变量：camelCase (`userInfo`)
  - 常量：UPPER_SNAKE_CASE (`API_BASE_URL`)

### Git 提交规范

```
feat: 添加新功能
fix: 修复 Bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
```

---

## 🚀 部署

### 当前方式（纯前端）
```
HBuilderX → 发行 → 选择目标平台
```

### 计划方式（后端架构）

**后端技术栈**:
- Node.js + Express
- MySQL 数据库
- JWT 认证
- API 中转服务

**部署步骤**:
1. 搭建后端服务
2. 配置 Nginx 反向代理
3. 配置 SSL 证书
4. 部署前端静态文件

---

## 📞 支持

**GitHub**: https://github.com/Yoky-PGrey/AIChat-for-strawberry-VibeCoding

**常见问题**:
- H5 环境跨域问题 → 配置代理或使用后端中转
- 语音播报不工作 → 检查浏览器/设备支持
- API Key 问题 → 参考配置指南

---

**最后更新**: 2026-03-10
**当前版本**: v0.9.1
**目标版本**: v1.0.0
