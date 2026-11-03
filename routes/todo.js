/**
 * ============================================================================
 * 待办事项路由模块
 * ============================================================================
 * 本文件定义四个符合表述性状态转移风格的接口路由与业务逻辑：
 *   1. GET  /api/get-todo          —— 查询所有待办事项
 *   2. POST /api/add-todo          —— 添加新的待办事项
 *   3. POST /api/update-todo/:id   —— 根据 id 切换完成状态
 *   4. POST /api/del-todo/:id      —— 根据 id 删除待办事项
 *
 * 所有异步数据库操作均使用异步等待语法，
 * 并通过 try/catch 进行统一的错误捕获与响应。
 * ============================================================================
 */

// 引入 Express 的路由器，用于创建模块化路由
const express = require('express');
const router = express.Router();

// 引入 mongoose，用于校验对象标识格式是否合法
const mongoose = require('mongoose');

// 引入待办事项数据模型，用于对「list」集合进行增删改查操作
const Todo = require('../models/Todo');

/**
 * --------------------------------------------------------------------------
 * 接口 1：查询所有待办事项
 * --------------------------------------------------------------------------
 * 方法与路径：GET /api/get-todo
 * 参数：无
 * 返回：包含所有待办事项的数组
 */
router.get('/get-todo', async (req, res) => {
  try {
    // 记录接口被调用的日志，便于调试与监控
    console.log('[接口] GET /api/get-todo —— 开始查询所有待办事项');

    /**
     * Todo.find({}) ：查询 list 集合中的全部文档
     * .sort({ createdAt: -1 }) ：按创建时间倒序排列（最新的在前）
     * 返回值为文档数组；若集合为空，则返回空数组 []
     */
    const todos = await Todo.find({}).sort({ createdAt: -1 });

    console.log(`[接口] GET /api/get-todo —— 查询成功，共 ${todos.length} 条记录`);

    // 以 200 状态码返回待办事项数组
    // 转成 JSON 时的转换逻辑会自动将每条文档的 _id 转为 id
    res.status(200).json(todos);
  } catch (error) {
    // 捕获数据库查询等异常，返回 500 服务器错误
    console.error('[接口] GET /api/get-todo —— 查询失败:', error.message);
    res.status(500).json({
      success: false,
      message: '查询待办事项失败',
      error: error.message,
    });
  }
});

/**
 * --------------------------------------------------------------------------
 * 接口 2：添加新的待办事项
 * --------------------------------------------------------------------------
 * 方法与路径：POST /api/add-todo
 * 请求体参数：
 *   {
 *     "value": string,        // 待办事项的具体内容（必填）
 *     "isCompleted": boolean  // 是否完成，默认为 false（可选）
 *   }
 * 返回：新添加的待办事项对象（含自动生成的唯一 id）
 */
router.post('/add-todo', async (req, res) => {
  try {
    console.log('[接口] POST /api/add-todo —— 开始添加待办事项');
    console.log('[接口] 请求体:', req.body);

    // 从请求体中解构出 value 和 isCompleted
    const { value, isCompleted } = req.body;

    // -------------------- 输入验证 --------------------
    // 校验 value 是否存在且为非空字符串
    if (value === undefined || value === null || typeof value !== 'string' || value.trim() === '') {
      console.warn('[接口] POST /api/add-todo —— 参数校验失败：value 无效');
      return res.status(400).json({
        success: false,
        message: '参数错误：value 必须是非空字符串',
      });
    }

    // 若传入了 isCompleted，校验其类型必须为布尔值
    if (isCompleted !== undefined && typeof isCompleted !== 'boolean') {
      console.warn('[接口] POST /api/add-todo —— 参数校验失败：isCompleted 类型错误');
      return res.status(400).json({
        success: false,
        message: '参数错误：isCompleted 必须是布尔值 (true/false)',
      });
    }

    /**
     * 使用 Todo.create() 向 list 集合插入新文档
     * - value：去除首尾空格后的内容
     * - isCompleted：若未传则使用模式中的默认值 false
     * create 会返回新创建的文档对象（含自动生成的 _id）
     */
    const newTodo = await Todo.create({
      value: value.trim(),
      // 仅当明确传入时才覆盖默认值
      ...(isCompleted !== undefined && { isCompleted }),
    });

    console.log(`[接口] POST /api/add-todo —— 添加成功，id: ${newTodo._id}`);

    // 以 201（已创建）状态码返回新创建的待办事项
    res.status(201).json(newTodo);
  } catch (error) {
    console.error('[接口] POST /api/add-todo —— 添加失败:', error.message);

    // Mongoose 校验错误（如必填项未满足）返回 400
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: '数据校验失败',
        error: error.message,
      });
    }

    // 其他未知错误返回 500
    res.status(500).json({
      success: false,
      message: '添加待办事项失败',
      error: error.message,
    });
  }
});

/**
 * --------------------------------------------------------------------------
 * 接口 3：更新待办事项状态（切换 isCompleted）
 * --------------------------------------------------------------------------
 * 方法与路径：POST /api/update-todo/:id
 * 路径参数：id —— 待办事项的唯一标识
 * 功能：根据 id 查找对应文档，将 isCompleted 的值取反（true ↔ false）
 * 返回：更新后的待办事项对象
 */
router.post('/update-todo/:id', async (req, res) => {
  try {
    // 从网址路径参数中获取待办事项 id
    const { id } = req.params;
    console.log(`[接口] POST /api/update-todo/${id} —— 开始更新完成状态`);

    // -------------------- 输入验证 --------------------
    // 校验 id 是否为合法的 MongoDB 对象标识（24 位十六进制字符串）
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      console.warn(`[接口] POST /api/update-todo —— 无效的 id: ${id}`);
      return res.status(400).json({
        success: false,
        message: '参数错误：id 不是合法的 MongoDB ObjectId',
      });
    }

    // 先根据 id 查找对应的待办事项
    const todo = await Todo.findById(id);

    // 若文档不存在，返回 404
    if (!todo) {
      console.warn(`[接口] POST /api/update-todo/${id} —— 未找到该待办事项`);
      return res.status(404).json({
        success: false,
        message: `未找到 id 为 ${id} 的待办事项`,
      });
    }

    /**
     * 将 isCompleted 取反：
     *   true  → false（标记为未完成）
     *   false → true  （标记为已完成）
     */
    todo.isCompleted = !todo.isCompleted;

    // 调用 save() 将修改持久化到数据库，同时触发 updatedAt 自动更新
    const updatedTodo = await todo.save();

    console.log(
      `[接口] POST /api/update-todo/${id} —— 更新成功，isCompleted: ${updatedTodo.isCompleted}`
    );

    // 返回更新后的完整待办事项对象
    res.status(200).json(updatedTodo);
  } catch (error) {
    console.error('[接口] POST /api/update-todo —— 更新失败:', error.message);
    res.status(500).json({
      success: false,
      message: '更新待办事项失败',
      error: error.message,
    });
  }
});

/**
 * --------------------------------------------------------------------------
 * 接口 4：删除待办事项
 * --------------------------------------------------------------------------
 * 方法与路径：POST /api/del-todo/:id
 * 路径参数：id —— 要删除的待办事项唯一标识
 * 返回：删除操作的结果状态
 */
router.post('/del-todo/:id', async (req, res) => {
  try {
    // 从网址路径参数中获取待办事项 id
    const { id } = req.params;
    console.log(`[接口] POST /api/del-todo/${id} —— 开始删除待办事项`);

    // -------------------- 输入验证 --------------------
    // 校验 id 是否为合法的 MongoDB 对象标识
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      console.warn(`[接口] POST /api/del-todo —— 无效的 id: ${id}`);
      return res.status(400).json({
        success: false,
        message: '参数错误：id 不是合法的 MongoDB ObjectId',
      });
    }

    /**
     * findByIdAndDelete：根据 id 查找并删除文档
     * 若找到并删除成功，返回被删除的文档；
     * 若未找到，返回 null
     */
    const deletedTodo = await Todo.findByIdAndDelete(id);

    // 文档不存在时返回 404
    if (!deletedTodo) {
      console.warn(`[接口] POST /api/del-todo/${id} —— 未找到该待办事项`);
      return res.status(404).json({
        success: false,
        message: `未找到 id 为 ${id} 的待办事项`,
      });
    }

    console.log(`[接口] POST /api/del-todo/${id} —— 删除成功`);

    // 返回删除操作的结果状态，同时附带被删除的文档信息（便于前端确认）
    res.status(200).json({
      success: true,
      message: '待办事项删除成功',
      data: deletedTodo,
    });
  } catch (error) {
    console.error('[接口] POST /api/del-todo —— 删除失败:', error.message);
    res.status(500).json({
      success: false,
      message: '删除待办事项失败',
      error: error.message,
    });
  }
});

// 导出路由模块，供 app.js 挂载到 /api 路径下
module.exports = router;
