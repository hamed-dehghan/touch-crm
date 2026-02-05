#!/bin/bash

# Touch CRM Server Setup Script
# This script prepares a fresh Ubuntu server for deployment
# Run as root or with sudo privileges

set -e

echo "🚀 Touch CRM Server Setup"
echo "=========================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root or with sudo"
    exit 1
fi

# Update system packages
echo "📦 Updating system packages..."
apt-get update
apt-get upgrade -y

# Install dependencies
echo "📦 Installing dependencies..."
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    wget

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    # Add Docker repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker Engine
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Enable and start Docker
    systemctl enable docker
    systemctl start docker

    echo "✅ Docker installed successfully"
else
    echo "✅ Docker is already installed"
fi

# Create deploy user
DEPLOY_USER="${DEPLOY_USER:-deploy}"
echo "👤 Creating deploy user: $DEPLOY_USER..."

if id "$DEPLOY_USER" &>/dev/null; then
    echo "✅ User $DEPLOY_USER already exists"
else
    useradd -m -s /bin/bash "$DEPLOY_USER"
    usermod -aG docker "$DEPLOY_USER"
    echo "✅ User $DEPLOY_USER created and added to docker group"
fi

# Set up deployment directory
DEPLOY_PATH="${DEPLOY_PATH:-/opt/touch-crm}"
echo "📁 Setting up deployment directory: $DEPLOY_PATH..."

if [ -d "$DEPLOY_PATH" ]; then
    echo "✅ Directory $DEPLOY_PATH already exists"
else
    mkdir -p "$DEPLOY_PATH"
    chown "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_PATH"
    echo "✅ Directory $DEPLOY_PATH created"
fi

# Clone repository (if not already cloned)
REPO_URL="${REPO_URL:-}"
if [ -n "$REPO_URL" ]; then
    echo "📥 Cloning repository from $REPO_URL..."
    if [ -d "$DEPLOY_PATH/.git" ]; then
        echo "✅ Repository already cloned"
        cd "$DEPLOY_PATH"
        sudo -u "$DEPLOY_USER" git pull origin main
    else
        sudo -u "$DEPLOY_USER" git clone "$REPO_URL" "$DEPLOY_PATH"
        echo "✅ Repository cloned"
    fi
else
    echo "⚠️  REPO_URL not set, skipping repository clone"
    echo "   Please manually clone your repository to $DEPLOY_PATH"
fi

# Create .env file from example
if [ -d "$DEPLOY_PATH" ] && [ -f "$DEPLOY_PATH/.env.example" ]; then
    echo "📝 Creating .env file..."
    if [ -f "$DEPLOY_PATH/.env" ]; then
        echo "✅ .env file already exists, skipping"
    else
        sudo -u "$DEPLOY_USER" cp "$DEPLOY_PATH/.env.example" "$DEPLOY_PATH/.env"
        echo "⚠️  .env file created from .env.example"
        echo "   ⚠️  IMPORTANT: Edit $DEPLOY_PATH/.env and update with actual values!"
    fi
fi

# Set up SSH key for deploy user (optional)
echo ""
echo "🔑 SSH Key Setup"
echo "==============="
echo "To enable GitHub Actions deployment, you need to:"
echo "1. Generate an SSH key pair on your local machine:"
echo "   ssh-keygen -t ed25519 -C 'deploy@touch-crm' -f ~/.ssh/touch-crm-deploy"
echo ""
echo "2. Copy the public key to the server:"
echo "   sudo -u $DEPLOY_USER mkdir -p /home/$DEPLOY_USER/.ssh"
echo "   sudo -u $DEPLOY_USER nano /home/$DEPLOY_USER/.ssh/authorized_keys"
echo "   (paste the contents of touch-crm-deploy.pub)"
echo "   sudo chmod 700 /home/$DEPLOY_USER/.ssh"
echo "   sudo chmod 600 /home/$DEPLOY_USER/.ssh/authorized_keys"
echo ""
echo "3. Add the private key to GitHub Secrets as SSH_PRIVATE_KEY"
echo ""

# Configure firewall (optional)
echo "🔥 Firewall Configuration"
echo "========================"
if command -v ufw &> /dev/null; then
    echo "UFW detected. Configure firewall? (y/n)"
    read -r configure_firewall
    if [ "$configure_firewall" = "y" ]; then
        ufw allow 22/tcp
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw --force enable
        echo "✅ Firewall configured (SSH, HTTP, HTTPS allowed)"
    fi
else
    echo "⚠️  UFW not installed. Consider installing and configuring a firewall."
fi

# Summary
echo ""
echo "✅ Server setup complete!"
echo ""
echo "📋 Next steps:"
echo "==============="
echo "1. Edit $DEPLOY_PATH/.env with actual values (DB password, JWT secret, etc.)"
echo "2. Set up SSH keys for the $DEPLOY_USER user (see instructions above)"
echo "3. Configure GitHub Secrets in your repository:"
echo "   - SSH_HOST: Your server IP or hostname"
echo "   - SSH_USER: $DEPLOY_USER"
echo "   - SSH_PRIVATE_KEY: Your SSH private key"
echo "   - SSH_PORT: 22 (or your custom SSH port)"
echo "   - DEPLOY_PATH: $DEPLOY_PATH"
echo ""
echo "4. To start the application manually:"
echo "   cd $DEPLOY_PATH"
echo "   docker compose up -d"
echo ""
echo "5. To deploy via GitHub Actions:"
echo "   - Push to main branch, or"
echo "   - Manually trigger the workflow from GitHub Actions tab"
echo ""
