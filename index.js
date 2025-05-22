const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 连接MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// User模型
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Todo模型
const todoSchema = new mongoose.Schema({
  value: String,
  isComplete: Boolean,
  userId: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Todo = mongoose.model('Todo', todoSchema);

// API路由
// 用户注册
app.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // 检查必要字段
    if (!username || !password || !email) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '缺少必要字段'
      });
    }

    // 检查用户名和邮箱是否已存在
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '用户名或邮箱已存在'
      });
    }

    // 创建新用户
    const user = new User({
      username,
      password, // 注意：实际应用中应该对密码进行加密
      email
    });

    await user.save();

    res.status(201).json({
      success: true,
      code: 201,
      message: '注册成功',
      userId: user._id
    });
  } catch (error) {
    console.error('用户注册失败:', error);
    res.status(500).json({
      success: false,
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 用户登录
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 检查必要字段
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '缺少必要字段'
      });
    }

    // 查找用户
    const user = await User.findOne({ username });

    if (!user || user.password !== password) { // 注意：实际应用中应该使用加密比较
      return res.status(401).json({
        success: false,
        code: 401,
        message: '用户名或密码错误'
      });
    }

    res.json({
      success: true,
      code: 200,
      message: '登录成功',
      userId: user._id
    });
  } catch (error) {
    console.error('用户登录失败:', error);
    res.status(500).json({
      success: false,
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 获取所有todo
app.get('/get_list', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        code: 400, 
        message: '缺少必要参数: userId' 
      });
    }

    const todoList = await Todo.find({ userId });
    res.json({
      success: true,
      code: 200,
      message: '获取成功',
      list: todoList
    });
  } catch (error) {
    console.error('获取待办事项列表失败:', error);
    res.status(500).json({ 
      success: false, 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
});

// 添加todo
app.post('/add_list', async (req, res) => {
  try {
    const body = req.body;

    // 基础结构检查
    if (typeof body !== 'object' || body === null) {
      return res.status(400).json({ 
        success: false, 
        code: 400, 
        message: '数据格式必须是 JSON 对象' 
      });
    }

    // 必需字段检查
    const requiredFields = ['value', 'isComplete', 'userId'];
    for (const field of requiredFields) {
      if (!(field in body)) {
        return res.status(400).json({ 
          success: false, 
          code: 400, 
          message: `缺少必要字段: ${field}` 
        });
      }
    }

    // 字段类型检查
    if (typeof body.value !== 'string' || body.value.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        code: 400, 
        message: 'value 必须是有效字符串' 
      });
    }

    if (typeof body.isComplete !== 'boolean') {
      return res.status(400).json({
        success: false,
        code: 400,
        message: 'isComplete 必须是布尔值'
      });
    }

    if (typeof body.userId !== 'string' || body.userId.trim() === '') {
      return res.status(400).json({
        success: false,
        code: 400,
        message: 'userId 必须是有效字符串'
      });
    }

    const todo = new Todo({
      ...body,
      createdAt: new Date()
    });
    
    const result = await todo.save();
    
    res.status(201).json({
      success: true,
      code: 201,
      message: '添加成功',
      id: result._id
    });
  } catch (error) {
    console.error('添加待办事项失败:', error);
    res.status(500).json({
      success: false,
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 更新todo状态
app.post('/update_list', async (req, res) => {
  try {
    const body = req.body;

    // 基础结构检查
    if (typeof body !== 'object' || body === null) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '数据格式必须是 JSON 对象'
      });
    }

    // 必需字段检查
    if (!body.id || !body.userId) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '缺少必要字段: id 或 userId'
      });
    }

    const todo = await Todo.findOne({
      _id: body.id,
      userId: body.userId
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '待办事项不存在或无权访问'
      });
    }

    todo.isComplete = !todo.isComplete;
    todo.updatedAt = new Date();
    await todo.save();

    res.json({
      success: true,
      code: 200,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新待办事项状态失败:', error);
    res.status(500).json({
      success: false,
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 删除todo
app.post('/del_list', async (req, res) => {
  try {
    const body = req.body;

    // 基础结构检查
    if (typeof body !== 'object' || body === null) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '数据格式必须是 JSON 对象'
      });
    }

    // 必需字段检查
    if (!body.id || !body.userId) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '缺少必要字段: id 或 userId'
      });
    }

    const result = await Todo.deleteOne({
      _id: body.id,
      userId: body.userId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '待办事项不存在或无权访问'
      });
    }

    res.json({
      success: true,
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除待办事项失败:', error);
    res.status(500).json({
      success: false,
      code: 500,
      message: '服务器内部错误'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 