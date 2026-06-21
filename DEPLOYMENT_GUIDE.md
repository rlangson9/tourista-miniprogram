# Tourista AR Deployment Guide

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Prerequisites](#prerequisites)
3. [Backend Deployment](#backend-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Mini Program Configuration](#mini-program-configuration)
6. [SSL/HTTPS Setup](#sslhttps-setup)
7. [Deployment Verification](#deployment-verification)
8. [Maintenance](#maintenance)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Cloud Server                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Node.js Backend Service                   │  │
│  │                                                       │  │
│  │   ┌─────────────┐    ┌─────────────────────────┐     │  │
│  │   │ /api        │    │ /admin                  │     │  │
│  │   │ Mini Program│    │ Admin Dashboard SPA     │     │  │
│  │   │   API       │    │                         │     │  │
│  │   └─────────────┘    └─────────────────────────┘     │  │
│  │                                                       │  │
│  │   ┌─────────────────────────────────────────────┐    │  │
│  │   │         SQLite Database (tourista.db)        │    │  │
│  │   └─────────────────────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
          │                                    ▲
          ▼                                    │
   ┌─────────────┐                      ┌──────────────┐
   │ Mini Program│                      │   Admin      │
   │   Users     │                      │  (Browser)   │
   │  (WeChat)   │                      │              │
   └─────────────┘                      └──────────────┘
```

---

## Prerequisites

### 1. Server Requirements

| Item | Minimum | Recommended |
|------|---------|-------------|
| CPU | 1 core | 2 cores |
| RAM | 1 GB | 2 GB |
| Bandwidth | 1 Mbps | 5 Mbps |
| OS | Ubuntu 20.04 / CentOS 7+ | Ubuntu 22.04 |
| Disk | 20 GB | 40 GB SSD |

Recommended: Alibaba Cloud ECS or Tencent Cloud CVM.

### 2. Required Accounts

- [ ] **WeChat Open Platform** (https://mp.weixin.qq.com)
  - Mini Program AppID and AppSecret
  - Verified mini program

- [ ] **Domain Name** (Recommended)
  - For API and admin dashboard
  - Suggested: `api.touristaar.com`, `admin.touristaar.com`

- [ ] **Cloud Server**
  - Alibaba Cloud / Tencent Cloud account
  - ICP filing completed (required for China mainland servers)

### 3. Local Development Tools

```bash
# Node.js (>= 18.0)
node --version

# Git
git --version

# PM2 (Process Manager)
npm install -g pm2
```

---

## Backend Deployment

### Step 1: Upload Code to Server

**Option A: Git Clone (Recommended)**

```bash
# On server
cd /opt
git clone https://your-repo-url/tourista-miniprogram.git
cd tourista-miniprogram/tourista-backend
```

**Option B: SCP Upload**

```bash
# From local
scp -r ./tourista-backend user@your-server:/opt/
```

### Step 2: Install Dependencies

```bash
cd /opt/tourista-miniprogram/tourista-backend
npm install --production
```

### Step 3: Configure Environment Variables

```bash
# Copy production config
cp .env.example .env

# Edit production config
nano .env
```

### Step 4: Start Service

```bash
# Start with PM2 (recommended)
pm2 start src/server.js --name turista-api

# Save PM2 config for auto-restart
pm2 save
pm2 startup

# Check status
pm2 status
pm2 logs turista-api
```

### Step 5: Configure Nginx (Reverse Proxy)

```bash
# Install Nginx
sudo apt update
sudo apt install nginx

# Create config
sudo nano /etc/nginx/sites-available/turista-api
```

```nginx
server {
    listen 80;
    server_name api.touristaar.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable config
sudo ln -s /etc/nginx/sites-available/turista-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Environment Configuration

### Production `.env` File

```bash
# ═══════════════════════════════════════════════════════════════
# Server Configuration
# ═══════════════════════════════════════════════════════════════
PORT=3000
NODE_ENV=production

# ═══════════════════════════════════════════════════════════════
# Security - IMPORTANT: Change these!
# ═══════════════════════════════════════════════════════════════
JWT_SECRET=generate-a-random-string-at-least-32-characters
ADMIN_TOKEN_TTL=1h
REFRESH_TOKEN_TTL=7d

# ═══════════════════════════════════════════════════════════════
# CORS Configuration
# ═══════════════════════════════════════════════════════════════
CORS_ORIGINS=https://servicewechat.com,https://touristaar.com

# ═══════════════════════════════════════════════════════════════
# Admin Account
# ═══════════════════════════════════════════════════════════════
ADMIN_USERNAME=admin
ADMIN_PASSWORD=set-a-strong-password-here

# ═══════════════════════════════════════════════════════════════
# WeChat Mini Program (from WeChat Open Platform)
# ═══════════════════════════════════════════════════════════════
WX_APPID=your_appid_here
WX_SECRET=your_appsecret_here

# ═══════════════════════════════════════════════════════════════
# HTTPS Configuration (Required for production)
# ═══════════════════════════════════════════════════════════════
HTTPS_ENABLED=true
HTTPS_KEY_PATH=/path/to/your/private-key.pem
HTTPS_CERT_PATH=/path/to/your/certificate.pem
```

### Generate JWT Secret

```bash
# Method 1: OpenSSL
openssl rand -base64 32

# Method 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## SSL/HTTPS Setup

### Using Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate (domain must be pointed to server)
sudo certbot --nginx -d api.touristaar.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Update Nginx Config (Auto HTTPS Redirect)

```nginx
server {
    listen 80;
    server_name api.touristaar.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.touristaar.com;

    ssl_certificate /etc/letsencrypt/live/api.touristaar.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.touristaar.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Mini Program Configuration

### 1. Configure Server Domains

Login to WeChat Open Platform → Development → Development Settings → Server Domain:

```
Request合法域名:   https://api.touristaar.com
UploadFile合法域名: https://api.touristaar.com
DownloadFile合法域名: https://api.touristaar.com
```

### 2. Update Mini Program Code

In `app.js` or API config file, update the API URL:

```javascript
// Option A: app.js
App({
  globalData: {
    baseUrl: 'https://api.touristaar.com'
  }
})

// Option B: Config file
const API_BASE = 'https://api.touristaar.com'
```

### 3. Pre-Submission Checklist

- [ ] All API requests use HTTPS
- [ ] Image domains are whitelisted
- [ ] WeChat login is properly configured
- [ ] User privacy agreement added
- [ ] All main user flows tested

---

## Deployment Verification

### API Verification

```bash
# Health check
curl https://api.touristaar.com/health

# Expected response
{"ok":true,"ts":1700000000000}
```

### Admin Dashboard Verification

```
Browser: https://api.touristaar.com/admin
Expected: Shows login page
```

### Log Viewing

```bash
# PM2 logs
pm2 logs turista-api --lines 50

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## Maintenance

### Common Commands

```bash
# Restart service
pm2 restart turista-api

# Check status
pm2 status

# View logs
pm2 logs turista-api

# Update code
cd /opt/tourista-miniprogram
git pull
npm install --production
pm2 restart turista-api
```

### Database Backup

```bash
# Backup database
cp /opt/tourista-miniprogram/tourista-backend/data/tourista.db ~/backup/turista_$(date +%Y%m%d).db

# Automated backup (add to crontab)
0 2 * * * cp /opt/tourista-miniprogram/tourista-backend/data/tourista.db /home/user/backups/turista_$(date +\%Y\%m\%d).db
```

### Monitoring

```bash
# Install PM2 monitoring
npm install -g pm2-midnight-harbor

# Or use cloud provider monitoring (Alibaba Cloud/Tencent Cloud)
```

### Troubleshooting

| Problem | Solution |
|---------|----------|
| 502 Bad Gateway | Check if Node.js is running: `pm2 status` |
| Connection Refused | Check firewall: `sudo ufw allow 3000` |
| SSL Certificate Expired | Run: `sudo certbot renew` |
| CORS Error | Check `CORS_ORIGINS` in `.env` |

---

## Quick Reference

### Ports

| Port | Purpose |
|------|---------|
| 3000 | Node.js backend |
| 80 | HTTP (Nginx) |
| 443 | HTTPS (Nginx) |

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/trips` | GET | Get trip list |
| `/api/trips/:id` | GET | Get trip details |
| `/admin/api/login` | POST | Admin login |
| `/admin/api/stats` | GET | Get statistics |
| `/admin/api/trips` | GET/POST | Manage trips |
| `/admin/api/orders` | GET | Manage orders |

---

## Support

For issues, check:
1. Application logs: `pm2 logs turista-api`
2. Nginx errors: `sudo tail -f /var/log/nginx/error.log`
3. System resources: `htop` or `top`
