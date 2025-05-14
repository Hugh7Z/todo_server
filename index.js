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

// Todo模型
const todoSchema = new mongoose.Schema({
  value: String,
  isComplete: Boolean
});

const Todo = mongoose.model('Todo', todoSchema);

// API路由
// 获取所有todo
app.get('/get_list', async (req, res) => {
  try {
    const todos = await Todo.find();
    res.json({ list: todos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 添加todo
app.post('/add_list', async (req, res) => {
  try {
    const { value, isComplete } = req.body;
    const todo = new Todo({ value, isComplete });
    await todo.save();
    res.json({ message: 'Todo added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新todo状态
app.post('/update_list', async (req, res) => {
  try {
    const { id } = req.body;
    const todo = await Todo.findById(id);
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    todo.isComplete = !todo.isComplete;
    await todo.save();
    res.json({ message: 'Todo updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除todo
app.post('/del_list', async (req, res) => {
  try {
    const { id } = req.body;
    await Todo.findByIdAndDelete(id);
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 