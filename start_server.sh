#!/bin/bash

# 清理8000端口
echo "正在清理8000端口..."
pkill -f "python3 -m http.server 8000" 2>/dev/null
lsof -ti:8000 | xargs kill -9 2>/dev/null
sleep 1

# 启动服务器
echo "正在启动服务器在8000端口..."
cd "$(dirname "$0")"
python3 -m http.server 8000

