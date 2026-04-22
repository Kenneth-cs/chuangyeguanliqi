#!/bin/bash
# ============================================================
# 本地一键部署脚本
# 在本地 solopreneur-copilot 目录下运行：bash scripts/2-deploy.sh
# ============================================================

set -e

SERVER_IP="124.222.88.25"
SERVER_USER="root"
SERVER_DIR="/app/solopreneur-copilot"
SSH_KEY="/Users/cs/Desktop/CS/AI/FWQ_sshkey/cs_fwq.pem"

echo "=============================="
echo "  超级个体 - 一键部署"
echo "  目标服务器: $SERVER_IP"
echo "=============================="

# ── 1. 本地构建 ──────────────────────────────────────────
echo ""
echo "[1/5] 本地构建 Next.js (standalone 模式)..."
npm run build
echo "✓ 构建完成"

# ── 2. 打包传输文件（剪裁无用文件，减少体积）────────────
echo ""
echo "[2/5] 打包并上传文件到服务器..."

# 创建临时打包目录
PACK_DIR="/tmp/solopreneur-deploy"
rm -rf $PACK_DIR
mkdir -p $PACK_DIR

# 复制 standalone 产物
cp -r .next/standalone/. $PACK_DIR/
cp -r .next/static $PACK_DIR/.next/static
cp -r public $PACK_DIR/public

# 复制 Prisma schema 和迁移文件（数据库迁移用）
cp -r prisma $PACK_DIR/prisma
cp ecosystem.config.js $PACK_DIR/
cp package.json $PACK_DIR/

# ─── 剪裁：删除服务器不需要的文件 ─────────────────────────
echo "  剪裁无用文件..."

# 1. 删除 Mac 版 Prisma 引擎（服务器是 Linux）
rm -f $PACK_DIR/node_modules/.prisma/client/libquery_engine-darwin*.node
rm -f $PACK_DIR/node_modules/.prisma/client/libquery_engine-darwin*.dylib.node

# 2. 删除 TypeScript（运行时不需要）
rm -rf $PACK_DIR/node_modules/typescript

# 3. 删除 sharp 的 Mac 平台二进制（服务器是 Linux）
rm -rf $PACK_DIR/node_modules/@img/sharp-darwin-arm64
rm -rf $PACK_DIR/node_modules/@img/sharp-libvips-darwin-arm64
rm -rf $PACK_DIR/node_modules/sharp/build/Release/*.node  # Mac 版 node binding

echo "  剪裁完成，当前包大小：$(du -sh $PACK_DIR | cut -f1)"

# 上传到服务器
rsync -avz --delete \
  -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
  $PACK_DIR/ \
  $SERVER_USER@$SERVER_IP:$SERVER_DIR/

echo "✓ 文件上传完成"

# ── 3. 在服务器上安装 Prisma CLI 和运行迁移 ─────────────
echo ""
echo "[3/5] 安装依赖并执行数据库迁移..."

ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP << 'REMOTE_SCRIPT'
  cd /app/solopreneur-copilot

  # 安装 prisma CLI（用于迁移）
  npm install prisma @prisma/client --save-dev 2>/dev/null || true

  # 加载生产环境变量
  export $(grep -v '^#' .env.production | xargs)

  # 执行数据库迁移
  npx prisma migrate deploy

  echo "✓ 数据库迁移完成"
REMOTE_SCRIPT

# ── 4. 配置 Nginx ────────────────────────────────────────
echo ""
echo "[4/5] 配置 Nginx 反向代理..."

ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP << 'NGINX_SCRIPT'
cat > /etc/nginx/sites-available/solopreneur << 'EOF'
server {
    listen 80;
    server_name 124.222.88.25;

    # 上传文件大小限制
    client_max_body_size 10M;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # 静态资源直接由 Nginx 提供（跳过 Node.js，加速）
    location /_next/static/ {
        alias /app/solopreneur-copilot/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /public/ {
        alias /app/solopreneur-copilot/public/;
        expires 7d;
    }

    # 其他请求转发给 Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/solopreneur /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试并重载 Nginx
nginx -t && systemctl reload nginx
echo "✓ Nginx 配置完成"
NGINX_SCRIPT

# ── 5. 启动/重启应用 ─────────────────────────────────────
echo ""
echo "[5/5] 启动应用 (PM2)..."

ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP << 'START_SCRIPT'
  cd /app/solopreneur-copilot

  # 复制生产环境变量到运行目录
  cp .env.production .env

  # 停止旧进程（如果存在）
  pm2 delete solopreneur-copilot 2>/dev/null || true

  # 用 PM2 启动
  pm2 start ecosystem.config.js
  pm2 save

  echo "✓ 应用已启动"
  echo ""
  pm2 status
START_SCRIPT

echo ""
echo "=============================="
echo "  🚀 部署完成！"
echo "  访问地址：http://124.222.88.25"
echo "=============================="
