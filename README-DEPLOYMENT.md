# Genesis Engine - Vercel Deployment Guide

This Next.js application is production-ready for deployment on Vercel with comprehensive optimizations and error handling.

## 🚀 Quick Deploy

1. **Connect to Vercel**: Link your GitHub repository to Vercel
2. **Set Environment Variables**: Add the following variables in your Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `FIREWORKS_API_KEY`
   - `TAVILY_API_KEY`
   - `OPENAI_API_KEY` (optional)
   - `GOOGLE_AI_API_KEY` (optional)

3. **Deploy**: Vercel will automatically detect this as a Next.js app and deploy it

## 📋 Environment Variables Required

Copy `.env.example` to `.env.local` and fill in your values:

```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Fireworks AI API (Required for prompt generation)
FIREWORKS_API_KEY=your_fireworks_api_key

# Tavily AI API (Required for topic suggestions)
TAVILY_API_KEY=your_tavily_api_key

# Optional AI APIs
OPENAI_API_KEY=your_openai_api_key
GOOGLE_AI_API_KEY=your_google_ai_api_key
```

## 🏗️ Project Structure

```
genesis-engine/
├── frontend/app/          # Next.js application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Next.js pages and API routes
│   │   │   └── api/      # Serverless API routes
│   │   │       ├── generate.ts    # AI streaming endpoint
│   │   │       ├── search.ts      # Web search endpoint
│   │   │       ├── health.ts      # Health check endpoint
│   │   │       └── seed-database.ts
│   │   └── styles/       # CSS modules and styles
│   ├── public/           # Static assets
│   ├── next.config.js    # Optimized Next.js config
│   └── package.json      # Dependencies and scripts
├── vercel.json           # Vercel deployment configuration
├── .env.example          # Environment variables template
└── check-env.js          # Environment validation script
```

## 🔧 Configuration Files

### Next.js Configuration (`next.config.js`)
- **Standalone output**: Optimized for serverless deployment
- **Image optimization**: Modern formats (WebP, AVIF)
- **Security headers**: XSS protection, CSRF protection
- **Compression**: Enabled for better performance
- **Bundle optimization**: Tree shaking and code splitting

### Vercel Configuration (`vercel.json`)
- **Function timeout**: 30 seconds for API routes
- **Security headers**: Comprehensive security headers
- **Regions**: Optimized for global deployment

### Environment Validation (`check-env.js`)
- **Pre-deployment checks**: Validates all API keys and connections
- **Database connectivity**: Tests Supabase connection
- **API validation**: Verifies external service access
- **Error reporting**: Clear error messages for troubleshooting

## 🎯 Features

- **AI-Powered Topic Suggestions**: Uses Tavily AI for intelligent topic discovery
- **Dynamic Goal Generation**: Real-time goal suggestions based on topic input
- **Streaming AI Responses**: Server-sent events for live AI generation
- **Health Monitoring**: Comprehensive health check endpoint
- **Error Recovery**: Robust error handling with retry mechanisms
- **Performance Optimized**: Bundle splitting, compression, and caching

## 🚀 Deployment Features

### ✅ Production Optimizations
- **Serverless Functions**: All API routes optimized for Vercel's 30s limit
- **Request Timeouts**: 25s timeout with proper error handling
- **CORS Configuration**: Proper cross-origin headers
- **Bundle Optimization**: Tree shaking and code splitting
- **Image Optimization**: Modern formats and responsive images

### ✅ Security Features
- **Environment Validation**: Pre-deployment security checks
- **API Key Protection**: Secure handling of sensitive credentials
- **Rate Limiting**: Built-in protection against abuse
- **Error Sanitization**: Safe error messages without sensitive data

### ✅ Monitoring & Health Checks
- **Health Endpoint**: `/api/health` for monitoring
- **Environment Status**: Real-time service status checks
- **Error Logging**: Comprehensive error tracking
- **Performance Metrics**: Built-in performance monitoring

## 🔧 Deployment Checklist

### Pre-Deployment
- [ ] Run `npm run check-env` to validate environment
- [ ] Run `npm run build` to verify build success
- [ ] Test all API endpoints locally
- [ ] Verify database connectivity
- [ ] Check all environment variables in Vercel dashboard

### Post-Deployment
- [ ] Verify `/api/health` endpoint returns healthy status
- [ ] Test topic suggestion functionality
- [ ] Test AI generation with streaming
- [ ] Verify database operations
- [ ] Check performance metrics in Vercel dashboard

## 🛠️ Troubleshooting

### Common Issues

**Build Failures**
- Check environment variables are properly set
- Verify all required dependencies are installed
- Check for TypeScript compilation errors

**API Timeouts**
- All functions have 25s timeout (within Vercel's 30s limit)
- Streaming endpoints properly handle connection cleanup
- Retry mechanisms for transient failures

**Database Connection Issues**
- Verify Supabase credentials and permissions
- Check database schema matches expected structure
- Run database seeding if tables are missing

**Environment Variable Issues**
- Use `npm run check-env` for validation
- Ensure all required variables are set in Vercel
- Check for typos in variable names

## 📊 Performance Metrics

The application is optimized for:
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3s
- **Bundle Size**: < 500KB (gzipped)
- **API Response Time**: < 5s for all endpoints

## 🔄 CI/CD Pipeline

For automated deployments:
1. Environment validation runs before build
2. All tests pass before deployment
3. Health checks verify post-deployment functionality
4. Rollback capability for failed deployments

---

Your Genesis Engine is now **production-ready** for Vercel deployment with enterprise-grade reliability, security, and performance optimizations! 🎉
