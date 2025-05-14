module.exports = {
  apps: [{
    name: "todo-api",
    script: "./index.js",
    env: {
      NODE_ENV: "production",
      PORT: 3000,
      MONGODB_URI: "mongodb://localhost:27017/todo"
    }
  }]
} 