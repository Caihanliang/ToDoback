/**
 * ============================================================================
 * Todo List 后端应用入口文件
 * ============================================================================
 * 本文件负责：
 *   1. 创建并配置 Express 应用实例
 *   2. 注册全局中间件（日志、跨域、JSON 解析等）
 *   3. 挂载业务路由
 *   4. 连接 MongoDB 数据库
 *   5. 启动 HTTP 服务器监听指定端口
 *
 * 技术栈：Node.js + Express + Mongoose（MongoDB）
 * ============================================================================
 */

// -------------------- 依赖引入 --------------------

// Express：轻量级 Node.js Web 应用框架，用于构建接口服务
const express = require('express');

// cors：跨域资源共享中间件，允许前端（不同源）访问本接口
const cors = require('cors');

// morgan：超文本传输协议请求日志中间件，自动记录每次请求的方法、路径、状态码、耗时等
const morgan = require('morgan');

// 数据库连接函数（封装了 Mongoose 连接逻辑）
const connectDB = require('./config/db');

// 待办事项相关路由
const todoRoutes = require('./routes/todo');

// 全局错误处理与「未找到」处理中间件
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// -------------------- 创建应用实例 --------------------

/**
 * 创建 Express 应用实例
 * app 对象是整个网络服务的核心，后续所有中间件和路由都挂载在其上
 */
const app = express();

/**
 * 服务监听端口
 * 优先读取环境变量 PORT；若未设置则默认使用 8080
 * （与原 hello_world.js / entrypoint.sh 保持一致，便于 DevBox 部署）
 */
const PORT = process.env.PORT || 8080;

// -------------------- 注册全局中间件 --------------------

/**
 * morgan 日志中间件
 * - 'dev' 格式：简洁彩色输出，适合开发环境
 *   示例：GET /api/get-todo 200 12.345 ms - 256
 * - 生产环境可改为 'combined'（阿帕奇标准日志格式）
 */
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

/**
 * cors 跨域中间件
 * 默认允许所有来源跨域访问；生产环境建议配置白名单
 */
app.use(cors());

/**
 * express.json() 中间件
 * 解析请求体中内容类型为 application/json 的数据，
 * 并将其挂载到 req.body 上，供后续路由使用
 */
app.use(express.json());

/**
 * express.urlencoded() 中间件
 * 解析内容类型为 application/x-www-form-urlencoded 的表单数据
 * extended: true 表示使用 qs 库解析，支持嵌套对象
 */
app.use(express.urlencoded({ extended: true }));

/**
 * 自定义请求日志中间件（补充 morgan）
 * 在每条请求进入业务逻辑前，额外打印时间戳与请求体，
 * 方便调试提交类接口的参数传递情况
 */
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[请求] ${timestamp} | ${req.method} ${req.originalUrl}`);

  // 仅对有请求体的方法打印请求体，避免查询类请求产生无用日志
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && Object.keys(req.body || {}).length > 0) {
    console.log(`[请求体]`, JSON.stringify(req.body));
  }

  // 调用 next() 将控制权交给下一个中间件或路由
  next();
});

// -------------------- 挂载业务路由 --------------------

/**
 * 将待办事项路由挂载到 /api 前缀下
 * 即 routes/todo.js 中定义的 /get-todo 实际路径为 /api/get-todo
 */
app.use('/api', todoRoutes);

/**
 * 根路径健康检查接口
 * 用于确认服务是否正常运行，部署探活时也可使用
 */
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Todo List API 服务运行正常',
    endpoints: {
      'GET  /api/get-todo': '查询所有待办事项',
      'POST /api/add-todo': '添加新的待办事项',
      'POST /api/update-todo/:id': '切换待办事项完成状态',
      'POST /api/del-todo/:id': '删除指定待办事项',
    },
  });
});

// -------------------- 错误处理 --------------------

// 「未找到」处理：必须放在所有合法路由之后
app.use(notFoundHandler);

// 全局错误处理：必须放在最后，且拥有四个参数
app.use(errorHandler);

// -------------------- 启动服务 --------------------

/**
 * 启动应用的主函数
 *
 * 流程：
 *   1. 先连接 MongoDB（连接失败会以退出码 1 结束进程）
 *   2. 连接成功后再启动超文本传输协议服务器监听端口
 *
 * 使用异步等待语法保证「先连库、后听端口」的顺序，
 * 避免请求到达时数据库尚未就绪。
 */
const startServer = async () => {
  try {
    // 第一步：连接 MongoDB 数据库
    console.log('[启动] 正在连接 MongoDB 数据库...');
    await connectDB();

    // 第二步：启动超文本传输协议服务器
    // 监听 0.0.0.0 使容器或远程环境可从外部访问（不仅限本机）
    app.listen(PORT, '0.0.0.0', () => {
      console.log('========================================');
      console.log(`  Todo List API 服务已启动`);
      console.log(`  环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  地址: http://0.0.0.0:${PORT}`);
      console.log('========================================');
      console.log('  可用接口:');
      console.log(`    GET  http://0.0.0.0:${PORT}/api/get-todo`);
      console.log(`    POST http://0.0.0.0:${PORT}/api/add-todo`);
      console.log(`    POST http://0.0.0.0:${PORT}/api/update-todo/:id`);
      console.log(`    POST http://0.0.0.0:${PORT}/api/del-todo/:id`);
      console.log('========================================');
    });
  } catch (error) {
    // 启动过程中出现未预期错误时打印并退出
    console.error('[启动] 服务启动失败:', error.message);
    process.exit(1);
  }
};

// 执行启动函数
startServer();

/**
 * 导出 app 实例（便于后续编写自动化测试时引入，无需真正监听端口）
 */
module.exports = app;
