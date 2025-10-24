# Railway Deployment Guide

This guide walks you through deploying the Country Currency API to Railway.

## Prerequisites

- GitHub account
- Railway account (sign up at [railway.app](https://railway.app))
- Your code pushed to a GitHub repository

## Step-by-Step Deployment

### 1. Prepare Your Repository

Make sure your code is committed and pushed to GitHub:

```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### 2. Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. Railway will automatically detect it's a Node.js project

### 3. Add MySQL Database

1. In your Railway project dashboard, click **"New"**
2. Select **"Database"** → **"Add MySQL"**
3. Railway will create a MySQL instance and provide connection details

### 4. Configure Environment Variables

Railway will automatically set the MySQL environment variables. You need to add:

**In your Railway service settings → Variables:**

```env
NODE_ENV=production
COUNTRIES_API_URL=https://restcountries.com/v3.1
EXCHANGE_API_URL=https://open.er-api.com/v6
API_TIMEOUT=15000
CACHE_DIR=cache
```

**MySQL variables (automatically provided by Railway):**
- `MYSQL_HOST`
- `MYSQL_PORT` 
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`

### 5. Deploy

1. Railway will automatically build and deploy your application
2. The build process will:
   - Install dependencies with `pnpm install`
   - Build TypeScript with `pnpm build`
   - Run database migrations with `pnpm migrate`
   - Start the server with `pnpm railway:start`

### 6. Access Your API

Once deployed, Railway will provide you with a public URL like:
`https://your-app-name.railway.app`

Test your API:
```bash
curl https://your-app-name.railway.app/status
```

## Environment Variables Reference

| Variable | Description | Set By |
|----------|-------------|---------|
| `PORT` | Server port | Railway (automatic) |
| `MYSQL_HOST` | Database host | Railway (automatic) |
| `MYSQL_PORT` | Database port | Railway (automatic) |
| `MYSQL_USER` | Database user | Railway (automatic) |
| `MYSQL_PASSWORD` | Database password | Railway (automatic) |
| `MYSQL_DATABASE` | Database name | Railway (automatic) |
| `NODE_ENV` | Environment | You (set to "production") |
| `COUNTRIES_API_URL` | REST Countries API | You |
| `EXCHANGE_API_URL` | Exchange rates API | You |
| `API_TIMEOUT` | API timeout in ms | You |
| `CACHE_DIR` | Cache directory | You |

## Monitoring and Logs

- **Logs**: View real-time logs in Railway dashboard
- **Metrics**: Monitor CPU, memory, and network usage
- **Deployments**: Track deployment history and rollback if needed

## Custom Domain (Optional)

1. In Railway dashboard, go to your service
2. Click **"Settings"** → **"Domains"**
3. Add your custom domain
4. Configure DNS records as instructed

## Troubleshooting

### Build Failures
- Check the build logs in Railway dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript compiles locally with `pnpm build`

### Database Connection Issues
- Verify MySQL service is running in Railway
- Check environment variables are properly set
- Review database logs

### Migration Failures
- Check if migration files exist in `src/migrations/`
- Verify database permissions
- Review migration logs

### Canvas/Image Generation Issues
- Railway includes necessary system packages in `nixpacks.toml`
- If issues persist, check the build logs for missing dependencies

## Support

- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- Project Issues: Create an issue in your GitHub repository