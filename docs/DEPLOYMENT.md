# Deployment Guide

This guide explains how to deploy the Touch CRM application to an Ubuntu server using GitHub Actions CI/CD.

## Architecture

The application runs in Docker containers:

- **Nginx** (port 80) - Reverse proxy
- **Frontend** - Next.js application
- **Backend** - Node.js/Express API
- **PostgreSQL** - Database
- **Redis** - Cache and job queue

```
Client → Nginx :80 → Frontend :3000 (Next.js)
                  → Backend :3000 (API)
                      → PostgreSQL :5432
                      → Redis :6379
```

## Prerequisites

- Ubuntu 20.04+ server with root access
- GitHub repository with this codebase
- Domain name (optional, but recommended for production)

## Server Setup

### 1. Prepare the Ubuntu Server

Run the setup script on your Ubuntu server as root:

```bash
sudo su
export DEPLOY_USER=deploy
export DEPLOY_PATH=/opt/touch-crm
export REPO_URL=https://github.com/YOUR_USERNAME/touch-crm.git

curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/touch-crm/main/scripts/server-setup.sh | bash
```

Or manually download and run:

```bash
wget https://raw.githubusercontent.com/YOUR_USERNAME/touch-crm/main/scripts/server-setup.sh
chmod +x server-setup.sh
sudo ./server-setup.sh
```

This script will:
- Install Docker and Docker Compose
- Create a deploy user
- Clone the repository
- Set up the deployment directory

### 2. Configure Environment Variables

Edit the `.env` file on the server:

```bash
sudo nano /opt/touch-crm/.env
```

Update these critical values:

```env
# Strong database password
DB_PASSWORD=your-secure-postgres-password

# Strong JWT secret (at least 32 characters)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# CORS origin (your domain or *)
CORS_ORIGIN=https://yourdomain.com

# SMS provider (if using SMS features)
SMS_PROVIDER=kavenegar
SMS_API_KEY=your-api-key
SMS_API_SECRET=your-api-secret
```

### 3. Set Up SSH Keys

Generate an SSH key pair for GitHub Actions:

```bash
ssh-keygen -t ed25519 -C "deploy@touch-crm" -f ~/.ssh/touch-crm-deploy
```

Add the public key to the server:

```bash
sudo -u deploy mkdir -p /home/deploy/.ssh
sudo nano /home/deploy/.ssh/authorized_keys
# Paste the contents of touch-crm-deploy.pub
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
sudo chown -R deploy:deploy /home/deploy/.ssh
```

### 4. Configure GitHub Secrets

In your GitHub repository, go to `Settings > Secrets and variables > Actions` and add:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `SSH_HOST` | Server IP or hostname | `192.168.1.100` or `server.example.com` |
| `SSH_USER` | Deploy user | `deploy` |
| `SSH_PRIVATE_KEY` | SSH private key | Contents of `touch-crm-deploy` file |
| `SSH_PORT` | SSH port | `22` |
| `DEPLOY_PATH` | Deployment directory | `/opt/touch-crm` |

## Deployment

### Automatic Deployment

Push to the `main` branch to trigger automatic deployment:

```bash
git add .
git commit -m "Deploy changes"
git push origin main
```

### Manual Deployment

Trigger deployment manually from GitHub:

1. Go to `Actions` tab in your repository
2. Select `Deploy to Ubuntu Server` workflow
3. Click `Run workflow`
4. Select `main` branch
5. Click `Run workflow`

### Deployment Process

The GitHub Actions workflow will:

1. SSH into the server
2. Pull latest code from `main` branch
3. Build Docker images
4. Stop existing containers
5. Start new containers
6. Run database migrations
7. Seed database (if needed)
8. Perform health checks

## Monitoring

### Check Container Status

```bash
cd /opt/touch-crm
docker compose ps
```

### View Logs

```bash
# All containers
docker compose logs

# Specific container
docker compose logs backend
docker compose logs frontend
docker compose logs nginx

# Follow logs in real-time
docker compose logs -f backend
```

### Health Check

```bash
# Backend health
curl http://localhost/health

# API documentation
curl http://localhost/api-docs
```

## Maintenance

### Update Environment Variables

1. Edit `.env` file on the server
2. Restart containers:

```bash
cd /opt/touch-crm
docker compose down
docker compose up -d
```

### Run Migrations Manually

```bash
cd /opt/touch-crm
docker compose exec backend npx sequelize-cli db:migrate
```

### Rollback Migration

```bash
docker compose exec backend npx sequelize-cli db:migrate:undo
```

### Backup Database

```bash
docker compose exec postgres pg_dump -U postgres touch_crm > backup.sql
```

### Restore Database

```bash
cat backup.sql | docker compose exec -T postgres psql -U postgres touch_crm
```

### Reset Database (⚠️ Destructive)

```bash
cd /opt/touch-crm
docker compose down -v
docker compose up -d
docker compose exec backend npx sequelize-cli db:migrate
docker compose exec backend npx sequelize-cli db:seed:all
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs [container-name]

# Rebuild container
docker compose build --no-cache [container-name]
docker compose up -d [container-name]
```

### Database Connection Issues

```bash
# Check postgres is running
docker compose ps postgres

# Test connection
docker compose exec postgres psql -U postgres -c '\l'

# Check backend environment variables
docker compose exec backend env | grep DB_
```

### Nginx Issues

```bash
# Test nginx config
docker compose exec nginx nginx -t

# Reload nginx
docker compose exec nginx nginx -s reload
```

### Port Conflicts

If port 80 or 5432 is already in use:

```bash
# Check what's using the port
sudo lsof -i :80
sudo lsof -i :5432

# Stop the conflicting service or change ports in docker-compose.yml
```

## Production Best Practices

1. **Use HTTPS**: Set up SSL/TLS with Let's Encrypt:
   ```bash
   sudo apt install certbot
   sudo certbot --nginx -d yourdomain.com
   ```

2. **Secure PostgreSQL**: Use strong passwords and restrict access

3. **Regular Backups**: Set up automated database backups

4. **Monitoring**: Use tools like Uptime Robot or New Relic

5. **Log Rotation**: Configure Docker log rotation:
   ```json
   {
     "log-driver": "json-file",
     "log-opts": {
       "max-size": "10m",
       "max-file": "3"
     }
   }
   ```

6. **Firewall**: Only allow necessary ports (22, 80, 443)

7. **Updates**: Regularly update Docker images and system packages

## Support

For issues or questions:
- Check the logs first
- Review GitHub Actions workflow runs
- Consult the backend and frontend documentation
