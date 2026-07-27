#!/bin/bash
set -euo pipefail

echo "=== Socratica EC2 Setup ==="
echo "Running as: $(whoami)"

# ---- System packages ----
sudo apt-get update -y
sudo apt-get install -y \
  curl git build-essential python3 python3-pip \
  docker.io nginx certbot python3-certbot-nginx \
  jq

# ---- Docker (add current user to docker group) ----
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker "$USER"

# ---- Node.js 20 ----
if ! command -v node &>/dev/null || [[ "$(node -v)" != v20* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
echo "Node $(node -v)  npm $(npm -v)"

# ---- PM2 globally ----
sudo npm install -g pm2

# ---- Pull or clone the repo ----
APP_DIR="/opt/socratica"
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR" && git pull
else
  sudo git clone https://github.com/Krsnapriya/Socratica-AI.git "$APP_DIR"
  sudo chown -R "$USER:$USER" "$APP_DIR"
  cd "$APP_DIR"
fi

# ---- Install dependencies ----
npm ci --omit=dev
cd server && npm ci --omit=dev && cd ..
cd client && npm ci && npx vite build && cd ..

# ---- Build sandbox Docker image ----
if [ -f docker/Dockerfile.sandbox ]; then
  docker build -t socratica-sandbox -f docker/Dockerfile.sandbox docker/
fi

# ---- systemd service ----
sudo cp deploy/socratica.service /etc/systemd/system/socratica.service
sudo systemctl daemon-reload
sudo systemctl enable socratica
sudo systemctl restart socratica

# ---- Nginx reverse proxy ----
sudo cp deploy/nginx.conf /etc/nginx/sites-available/socratica
sudo ln -sf /etc/nginx/sites-available/socratica /etc/nginx/sites-enabled/socratica
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# ---- Generate SSH key for GitHub Actions (if not exists) ----
DEPLOY_KEY="$HOME/.ssh/github_actions_deploy"
if [ ! -f "$DEPLOY_KEY" ]; then
  ssh-keygen -t ed25519 -f "$DEPLOY_KEY" -N "" -C "github-actions-deploy"
  echo ""
  echo "=== PUBLIC KEY (add to /home/$USER/.ssh/authorized_keys if needed) ==="
  cat "${DEPLOY_KEY}.pub"
  echo ""
fi

echo ""
echo "========================================================"
echo "  SETUP COMPLETE"
echo "========================================================"
echo ""
echo "App running on port 3000, Nginx proxy on port 80"
echo ""
echo "REQUIRED: Set these GitHub repo secrets"
echo "  (Settings → Secrets and variables → Actions)"
echo ""
EC2_PUBLIC_DNS=$(curl -s http://169.254.169.254/latest/meta-data/public-hostname 2>/dev/null || echo "YOUR_EC2_PUBLIC_DNS")
echo "  EC2_HOST      = $EC2_PUBLIC_DNS"
echo "  EC2_USER      = ubuntu"
echo "  EC2_SSH_KEY   = (paste private key below)"
echo ""
echo "--- PRIVATE KEY (copy entire block into EC2_SSH_KEY secret) ---"
cat "$DEPLOY_KEY"
echo "--- END PRIVATE KEY ---"
echo ""
echo "Other steps:"
echo "  1. Edit $APP_DIR/server/.env with MongoDB Atlas URI"
echo "  2. sudo systemctl restart socratica"
echo "  3. (Optional) sudo certbot --nginx -d YOUR_DOMAIN"
echo "========================================================"
