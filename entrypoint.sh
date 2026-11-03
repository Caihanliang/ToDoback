#!/bin/bash

# 运行环境参数，未传入时默认为开发环境
app_env=${1:-development}

# 应用入口文件名（不含扩展名），对应 app.js
build_target="app"

# 开发环境启动命令
dev_commands() {
    echo "正在启动开发环境..."
    NODE_ENV=development node "${build_target}.js"
}

# 生产环境启动命令
# ※发布前会完成编译打包
prod_commands() {
    echo "正在启动生产环境..."
    NODE_ENV=production node "${build_target}.js"
}

# 根据环境变量判断当前运行环境
if [ "$app_env" = "production" ] || [ "$app_env" = "prod" ] ; then
    echo "已检测到生产环境"
    prod_commands
else
    echo "已检测到开发环境"
    dev_commands
fi
