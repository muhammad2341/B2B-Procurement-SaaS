#!/bin/bash
set -e

# ProcureHub VPS Deployment Script
# Usage: bash deploy.sh

echo "=== ProcureHub Deployment ==="

# Check Docker & Docker Compose
if ! command -v docker &> /dev/null; then
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  echo "Docker installed. Please log out and back in, then re-run this script."
  exit 1
fi

# Create app directory
APP_DIR="/opt/procurehub"
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# Clone or pull latest code
if [ -d ".git" ]; then
  echo "Pulling latest changes..."
  git pull origin main
else
  echo "Cloning repository..."
  git clone https://github.com/muhammad2341/B2B-Procurement-SaaS.git .
fi

# Create .env if not exists
if [ ! -f .env ]; then
  echo "Creating .env file..."
  JWT_SECRET=$(openssl rand -hex 16)
  POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
  cat > .env <<EOF
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
JWT_SECRET=$JWT_SECRET
NEXT_PUBLIC_API_URL=http://localhost:5000
EOF
  echo ".env created."
fi

# Login to GHCR
echo "Logging in to GitHub Container Registry..."
echo "$GITHUB_TOKEN" | docker login ghcr.io -u muhammad2341 --password-stdin 2>/dev/null || {
  echo "WARNING: GITHUB_TOKEN not set. If images are private, run:"
  echo "  export GITHUB_TOKEN=your_token"
  echo "  docker login ghcr.io -u muhammad2341"
}

# Pull latest images
echo "Pulling latest images..."
docker compose -f infrastruktur/docker/docker-compose.prod.yml --env-file .env pull

# Stop and remove old containers
echo "Stopping old containers..."
docker compose -f infrastruktur/docker/docker-compose.prod.yml --env-file .env down

# Start services
echo "Starting services..."
docker compose -f infrastruktur/docker/docker-compose.prod.yml --env-file .env up -d

# Wait for healthy
echo "Waiting for services to be healthy..."
sleep 10

# Show status
echo ""
echo "=== Deployment Status ==="
docker compose -f infrastruktur/docker/docker-compose.prod.yml ps
echo ""
echo "API:  http://localhost:5000"
echo "Web:  http://localhost:3000"
echo ""
echo "Logs: docker compose -f infrastruktur/docker/docker-compose.prod.yml logs -f"
