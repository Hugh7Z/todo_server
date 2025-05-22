#!/bin/bash

# 输出当前时间
echo "开始更新 - $(date)"

# 保存当前目录
CURRENT_DIR=$(pwd)

# 进入项目目录
cd "$(dirname "$0")"

# 拉取最新代码
echo "正在拉取最新代码..."
git pull origin main

# 检查更新是否成功
if [ $? -eq 0 ]; then
    echo "代码更新成功"
else
    echo "代码更新失败，请检查错误信息"
    exit 1
fi

# 检查服务器状态
echo "检查服务器状态..."
if pgrep -f "node index.js" > /dev/null; then
    echo "服务器正在运行"
else
    echo "服务器未运行，正在启动..."
    nohup node index.js > server.log 2>&1 &
fi

echo "更新完成 - $(date)" 