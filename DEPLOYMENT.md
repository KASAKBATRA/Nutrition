# 🚀 NutriCare++ Deployment Guide

## Quick Deployment Options

### 1. Vercel (Recommended - Easiest)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Environment Variables for Vercel:
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Add all variables from `.env.example`

### 2. Railway (Full-Stack)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

#### Railway Setup:
1. Create account at railway.app
2. Connect your GitHub repo
3. Add environment variables in dashboard
4. Railway will auto-deploy

### 3. Netlify (Frontend) + Railway (Backend)
```bash
# Build for production
npm run build

# Upload dist/public folder to Netlify
# Deploy server separately to Railway
```

### 4. Docker Deployment
```bash
# Build image
docker build -t nutricare-app .

# Run container
docker run -p 3000:3000 --env-file .env nutricare-app
```

## Pre-Deployment Checklist

- [ ] Database setup (Neon, Railway, or PostgreSQL)
- [ ] Environment variables configured
- [ ] OpenAI API key (for AI features)
- [ ] Email configuration (Gmail App Password)
- [ ] Build successful (`npm run build`)
- [ ] Test production build locally

## Database Setup

### Option 1: Neon (Free PostgreSQL)
1. Go to neon.tech
2. Create account and database
3. Copy connection string to `DATABASE_URL`

### Option 2: Railway Database
1. Create Railway project
2. Add PostgreSQL service
3. Copy connection string

## Environment Variables Required

```env
DATABASE_URL=postgresql://username:password@host:port/database
OPENAI_API_KEY=sk-...
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
SESSION_SECRET=super-secret-key
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-domain.com
```

## Testing Deployment Locally

```bash
# Build the app
npm run build

# Start production server
npm start

# Open http://localhost:3000
```

## Troubleshooting

### Common Issues:
1. **Database connection error**: Check DATABASE_URL format
2. **OpenAI API error**: Verify OPENAI_API_KEY
3. **Email not working**: Check Gmail App Password
4. **CORS errors**: Update FRONTEND_URL

### Build Errors:
```bash
# Clear cache and rebuild
rm -rf dist node_modules
npm install
npm run build
```

## Performance Optimization

- Large bundle warning is normal (includes AI libraries)
- Consider code splitting for production optimization
- Images should be optimized before deployment

## Security Notes

- Never commit `.env` file
- Use strong SESSION_SECRET
- Enable 2FA on deployment platforms
- Regularly update dependencies

## Support

- Check deployment platform logs for errors
- Verify all environment variables are set
- Test API endpoints after deployment