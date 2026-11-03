/**
 * ============================================================================
 * 待办事项数据模型
 * ============================================================================
 * 使用 Mongoose 模式定义「list」集合中文档的结构。
 * 集合名称为 list，与需求中的数据库集合名称保持一致。
 * ============================================================================
 */

// 引入 mongoose，用于定义模式和创建模型
const mongoose = require('mongoose');

/**
 * 待办事项模式定义
 *
 * 字段说明：
 * - value       : 待办事项的具体内容（字符串，必填）
 * - isCompleted : 是否已完成（布尔值，默认 false）
 * - createdAt / updatedAt : 由时间戳选项自动维护的创建与更新时间
 *
 * 注意：MongoDB 会自动为每条文档生成唯一的 _id 字段（对象标识类型），
 * 接口返回时我们会将其映射为 id，方便前端使用。
 */
const todoSchema = new mongoose.Schema(
  {
    // 待办事项内容：必填字符串，去除首尾空格后不能为空
    value: {
      type: String,        // 字段类型为字符串
      required: [true, '待办事项内容 (value) 不能为空'], // 必填校验及自定义错误提示
      trim: true,          // 自动去除首尾空白字符
    },

    // 完成状态：布尔值，新建时默认为未完成
    isCompleted: {
      type: Boolean,       // 字段类型为布尔值
      default: false,      // 未传该字段时默认为 false
    },
  },
  {
    // timestamps: true 会自动添加 createdAt 和 updatedAt 两个日期字段
    timestamps: true,

    /**
     * collection 选项：显式指定 MongoDB 集合名称为「list」
     * 若不指定，Mongoose 会根据模型名自动复数化（如 Todo → todos）
     */
    collection: 'list',
  }
);

/**
 * 自定义转成 JSON 时的转换逻辑
 * 当文档被序列化为 JSON（如 res.json(todo)）时自动执行：
 * 1. 将 _id 转为字符串形式的 id，便于前端使用
 * 2. 删除 __v（Mongoose 内部版本号），保持响应干净
 */
todoSchema.set('toJSON', {
  virtuals: true, // 启用虚拟字段（若有）
  transform: (_doc, ret) => {
    // 将 MongoDB 的 _id 映射为更友好的 id 字段
    ret.id = ret._id.toString();
    // 删除原始的 _id，避免响应中同时出现 id 和 _id
    delete ret._id;
    // 删除 Mongoose 版本键
    delete ret.__v;
    return ret;
  },
});

/**
 * 创建并导出 Todo 模型
 * 第一个参数 'Todo' 是模型名称（用于代码中引用）
 * 第二个参数是上面定义的模式
 * 实际数据会存入 collection: 'list' 指定的集合中
 */
const Todo = mongoose.model('Todo', todoSchema);

module.exports = Todo;
