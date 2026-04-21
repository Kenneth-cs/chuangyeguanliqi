#!/bin/bash
# ============================================================
# 服务器一次性初始化脚本
# 在服务器上以 root 身份运行：bash 1-server-setup.sh
# ============================================================

set -e  # 遇到错误立即停止

echo "=============================="
echo "  超级个体 - 服务器初始化"
echo "=============================="

# ── 1. 系统更新 ─────────────────────────────────────────
echo "[1/6] 更新系统包..."
apt-get update -y && apt-get upgrade -y

# ── 2. 安装 Node.js 20 ──────────────────────────────────
echo "[2/6] 安装 Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node -v && npm -v

# ── 3. 安装 MySQL 8.0 ───────────────────────────────────
echo "[3/6] 安装 MySQL 8.0..."
apt-get install -y mysql-server

# 启动并设置开机自启
systemctl start mysql
systemctl enable mysql

# 初始化 MySQL 安全设置（设置 root 密码，创建应用用户）
echo "请输入 MySQL root 密码（新设置一个，记住它）："
read -s MYSQL_ROOT_PASSWORD
echo ""

mysql -u root <<EOF
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${MYSQL_ROOT_PASSWORD}';

-- 创建应用专用用户和数据库
CREATE DATABASE IF NOT EXISTS SuperIndividual CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'solopreneur'@'localhost' IDENTIFIED BY 'Solo2026!Prod';
GRANT ALL PRIVILEGES ON SuperIndividual.* TO 'solopreneur'@'localhost';
FLUSH PRIVILEGES;
EOF

echo "✓ MySQL 初始化完成"
echo "  数据库: SuperIndividual"
echo "  用户名: solopreneur"
echo "  密码:   Solo2026!Prod  (可在 .env.production 修改)"

# ── 4. 安装 Nginx ────────────────────────────────────────
echo "[4/6] 安装 Nginx..."
apt-get install -y nginx
systemctl start nginx
systemctl enable nginx

# ── 5. 安装 PM2 ──────────────────────────────────────────
echo "[5/6] 安装 PM2..."
npm install -g pm2
pm2 startup systemd -u root --hp /root

# ── 6. 创建应用目录 ──────────────────────────────────────
echo "[6/6] 创建应用目录..."
mkdir -p /app/solopreneur-copilot

# ── 7. 配置防火墙 ────────────────────────────────────────
echo "[7/7] 配置防火墙..."
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw allow 8080/tcp # xinfu 项目
ufw --force enable

echo ""
echo "=============================="
echo "  ✅ 服务器初始化完成！"
echo "=============================="
echo ""
echo "下一步：在本地运行 ./scripts/2-deploy.sh 部署代码"
