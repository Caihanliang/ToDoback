# Todo List 后端 API 项目

基于 Node.js、Express 与 MongoDB（Mongoose）实现的待办事项 RESTful API 服务。

## 项目简介

本项目提供四个待办事项相关接口，数据存储在 MongoDB 的 `list` 集合中，支持查询、添加、更新完成状态与删除。服务默认监听 `0.0.0.0:8080`，同时支持开发环境与生产环境启动方式。

在线根地址示例：`https://cihmnzmsregh.sealoshzh.site`

## 技术栈

- Node.js
- Express
- MongoDB + Mongoose
- morgan（请求日志）
- cors（跨域）

## 项目结构

```
project/
├── app.js                      # 应用入口
├── config/db.js                # 数据库连接配置
├── models/Todo.js              # 待办事项数据模型（list 集合）
├── routes/todo.js              # 四个业务接口路由
├── middleware/errorHandler.js  # 全局错误与 404 处理
├── entrypoint.sh               # DevBox 启动脚本
├── package.json
└── README.md
```

## 环境说明

本项目运行于已预装 Node.js 的 DevBox（Debian 12）环境，一般无需自行安装系统依赖。如需按本地需求调整，可直接修改对应配置文件。

## 启动方式

**开发环境：** 在 DevBox 终端执行：

```bash
bash entrypoint.sh
```

或：

```bash
npm run dev
```

**生产环境：** 发布后会按 `entrypoint.sh` 与命令参数打包部署；也可手动执行：

```bash
bash entrypoint.sh production
```

或：

```bash
npm start
```

## 接口说明

### 1. 查询所有待办事项

- 方法与路径：`GET /api/get-todo`
- 参数：无
- 成功返回：待办事项数组（`200`）

### 2. 添加待办事项

- 方法与路径：`POST /api/add-todo`
- 请求体：

```json
{
  "value": "待办内容",
  "isCompleted": false
}
```

- 成功返回：新创建的待办对象，含唯一 `id`（`201`）

### 3. 更新待办事项状态

- 方法与路径：`POST /api/update-todo/:id`
- 功能：根据 `id` 将 `isCompleted` 取反
- 成功返回：更新后的待办对象（`200`）

### 4. 删除待办事项

- 方法与路径：`POST /api/del-todo/:id`
- 功能：根据 `id` 删除指定待办
- 成功返回：删除结果状态（`200`）

## 快速测试示例

将下方域名替换为你的实际根地址即可。

```bash
# 查询全部
curl https://cihmnzmsregh.sealoshzh.site/api/get-todo

# 添加
curl -X POST https://cihmnzmsregh.sealoshzh.site/api/add-todo \
  -H "Content-Type: application/json" \
  -d '{"value":"学习 Express","isCompleted":false}'

# 更新状态（将 :id 换成真实 id）
curl -X POST https://cihmnzmsregh.sealoshzh.site/api/update-todo/:id

# 删除（将 :id 换成真实 id）
curl -X POST https://cihmnzmsregh.sealoshzh.site/api/del-todo/:id
```

## DevBox 说明

在 DevBox 中可专注业务开发；构建、部署与运行环境由平台统一管理，从开发到上线可平滑衔接。
