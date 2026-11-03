/**
 * ============================================================================
 * 数据库连接配置模块
 * ============================================================================
 * 本文件负责使用 Mongoose 建立与 MongoDB 的连接。
 * 将数据库连接逻辑独立出来，便于维护和在不同环境中复用。
 * ============================================================================
 */

// 引入 Mongoose —— MongoDB 的对象文档映射库
// 它提供了模式定义、模型创建、查询构建等功能
const mongoose = require('mongoose');

/**
 * 数据库连接地址
 * 格式说明：mongodb://用户名:密码@主机地址:端口/数据库名?参数
 *
 * - root / 8mY5121v3p7tk5sj ：数据库认证账号与密码
 * - test-db-mongodb.ns-qpu2c6b0.svc ：MongoDB 服务主机名（容器集群内网地址）
 * - 27017 ：MongoDB 默认端口
 * - todo ：应用使用的数据库名称（若不存在，MongoDB 会在首次写入时自动创建）
 * - authSource=admin ：指定认证数据库为 admin（root 用户通常在此库中鉴权）
 */
const MONGODB_URI =
  'mongodb://root:8mY5121v3p7tk5sj@test-db-mongodb.ns-qpu2c6b0.svc:27017/todo?authSource=admin';

/**
 * 连接 MongoDB 数据库
 *
 * 使用异步等待语法等待连接完成。
 * 连接成功后打印日志；失败则打印错误并退出进程，
 * 避免应用在无数据库的情况下继续运行导致后续请求全部失败。
 *
 * @returns {Promise<void>} 无返回值，连接成功即完成
 */
const connectDB = async () => {
  try {
    // mongoose.connect 返回一个 Promise，await 等待连接建立完成
    // 第二个参数可传入连接选项；Mongoose 8 起多数常用选项已有合理默认值
    const conn = await mongoose.connect(MONGODB_URI);

    // 连接成功后输出主机信息，方便排查环境问题
    console.log(`[数据库] MongoDB 连接成功 → 主机: ${conn.connection.host}`);
    console.log(`[数据库] 当前使用的数据库: ${conn.connection.name}`);
  } catch (error) {
    // 连接失败时记录详细错误信息
    console.error('[数据库] MongoDB 连接失败:', error.message);

    // 以非 0 退出码结束进程，通知进程管理器（如 Docker / PM2）启动失败
    process.exit(1);
  }
};

// 导出连接函数，供应用入口文件调用
module.exports = connectDB;
