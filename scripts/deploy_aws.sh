#!/bin/bash
set -e

# Usage: ./scripts/deploy_aws.sh <EC2_PUBLIC_IP>
#
# Prerequisites:
#   - aws configure has been run
#   - terraform apply has been completed and output the EC2 IP
#   - A .env file exists in the project root with JWT_SECRET and OPENROUTER_API_KEY

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

if [ -z "$1" ]; then
  echo "Error: Must provide the EC2 Public IP address."
  echo "Usage: ./scripts/deploy_aws.sh <EC2_PUBLIC_IP>"
  exit 1
fi

EC2_IP=$1
SSH_USER="ubuntu"
DEST_DIR="/home/ubuntu/socratica"
SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=10"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║       Socratica — AWS Deployment Script          ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "→ Target: $SSH_USER@$EC2_IP"

# Validate .env exists
if [ ! -f "$PROJECT_ROOT/.env" ]; then
  echo ""
  echo "ERROR: .env file not found at project root."
  echo "Copy .env.example to .env and fill in your secrets first:"
  echo "  cp .env.example .env && nano .env"
  exit 1
fi

# Validate required env vars
source "$PROJECT_ROOT/.env"
if [ -z "$JWT_SECRET" ]; then
  echo "ERROR: JWT_SECRET is not set in your .env file."
  exit 1
fi
if [ -z "$OPENROUTER_API_KEY" ]; then
  echo "WARNING: OPENROUTER_API_KEY is not set. AI Mentor hints will be disabled."
fi

# Wait for SSH to become available
echo ""
echo "→ Waiting for SSH to be ready on the instance..."
until ssh $SSH_OPTS "$SSH_USER@$EC2_IP" "echo 'SSH OK'" 2>/dev/null; do
  echo "  Instance not ready yet, retrying in 10 seconds..."
  sleep 10
done

# Wait for Docker to be installed by user_data cloud-init
echo "→ Waiting for Docker to finish installing (user_data)..."
until ssh $SSH_OPTS "$SSH_USER@$EC2_IP" "docker info" >/dev/null 2>&1; do
  echo "  Docker not ready, retrying in 15 seconds..."
  sleep 15
done
echo "  Docker is ready."

# Sync repository (excluding build artifacts and secrets)
echo ""
echo "→ Syncing repository to EC2 ($DEST_DIR)..."
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'terraform/.terraform' \
  --exclude 'terraform/terraform.tfstate*' \
  --exclude 'terraform/*.tfvars' \
  --exclude 'client/dist' \
  --exclude '.env' \
  -e "ssh $SSH_OPTS" \
  "$PROJECT_ROOT/" "$SSH_USER@$EC2_IP:$DEST_DIR/"

# Securely upload the .env (excluded from rsync above for safety)
echo ""
echo "→ Uploading .env file..."
scp $SSH_OPTS "$PROJECT_ROOT/.env" "$SSH_USER@$EC2_IP:$DEST_DIR/.env"

# Build images and start the production stack remotely
echo ""
echo "→ Building sandbox images and starting production stack..."
ssh $SSH_OPTS "$SSH_USER@$EC2_IP" << REMOTE_EOF
  set -e
  cd $DEST_DIR

  echo "  Building sandbox images..."
  docker compose --profile build build

  echo "  Starting production services..."
  docker compose up -d --build

  echo "  Waiting for services to stabilize..."
  sleep 15
  docker compose ps
REMOTE_EOF

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║          Deployment Complete!                    ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "  Application: http://$EC2_IP"
echo "  SSH Access:  ssh $SSH_USER@$EC2_IP"
echo ""
