/**
 * ============================================================================
 * 全局错误处理中间件
 * ============================================================================
 * Express 的错误处理中间件必须包含四个参数：(err, req, res, next)
 * 当路由或其它中间件通过 next(err) 传递错误，或抛出未捕获异常时，
 * 会进入本中间件进行统一处理和响应，避免错误信息直接暴露给客户端。
 * ============================================================================
 */

/**
 * 全局错误处理函数
 *
 * @param {Error}   err  - 错误对象
 * @param {object}  req  - Express 请求对象
 * @param {object}  res  - Express 响应对象
 * @param {Function} next - 下一个中间件（错误处理中通常不再调用）
 */
const errorHandler = (err, req, res, next) => {
  // 在服务端控制台打印完整错误堆栈，便于排查问题
  console.error('[错误处理] 捕获到未处理异常:');
  console.error(err.stack || err.message);

  /**
   * 确定超文本传输协议状态码：
   * - 若错误对象自身带有 statusCode（如自定义业务错误），则使用该值
   * - 否则默认返回 500（服务器内部错误）
   */
  const statusCode = err.statusCode || 500;

  // 向客户端返回结构化的错误响应
  res.status(statusCode).json({
    success: false,
    message: err.message || '服务器内部错误',
    // 仅在开发环境下返回错误堆栈，生产环境隐藏敏感细节
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 未匹配路由处理中间件
 * 当请求的路径未匹配任何已注册路由时触发，返回友好的 404 提示
 *
 * @param {object}  req  - Express 请求对象
 * @param {object}  res  - Express 响应对象
 * @param {Function} next - 下一个中间件
 */
const notFoundHandler = (req, res, next) => {
  console.warn(`[404] 未找到路由: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `接口不存在: ${req.method} ${req.originalUrl}`,
  });
};

// 导出两个中间件，供 app.js 使用
module.exports = {
  errorHandler,
  notFoundHandler,
};
