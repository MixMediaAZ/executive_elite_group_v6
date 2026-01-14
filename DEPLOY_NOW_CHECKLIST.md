# ✅ Deploy Now - Quick Checklist

## Step 1: Fix Critical Issue (5 minutes)

```bash
# 1. Stop your dev server (Ctrl+C)

# 2. Install OpenAI package
npm install

# 3. Verify build works
npm run build

# 4. If build succeeds, you're ready!
```

---

## Step 2: Generate Production Secrets (2 minutes)

```bash
# Generate NEXTAUTH_SECRET for production
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Save this output - you'll need it in Step 3
```

---

## Step 3: Deploy to Vercel (10 minutes)

### Option A: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New..." → "Project"**
3. Import your Git repository
4. Configure:
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build`
   - **Install Command:** `npm install`

5. **Add Environment Variables:**

```
DATABASE_URL=<your-production-database-url>
NEXTAUTH_SECRET=<generated-secret-from-step-2>
NEXTAUTH_URL=https://your-domain.vercel.app
OPENAI_API_KEY=<your-openai-key>
NODE_ENV=production
```

6. Click **Deploy**

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts and set environment variables when asked
```

---

## Step 4: Database Setup in Production (5 minutes)

After deployment succeeds:

```bash
# Set production DATABASE_URL in your .env temporarily
DATABASE_URL="<production-url>"

# Run migrations
npm run prisma:migrate

# Seed initial data (tiers)
npm run prisma:seed

# Create admin user
npm run create-admin
```

**OR** use Vercel CLI to run commands in production:
```bash
vercel env pull
npm run prisma:migrate
npm run prisma:seed
npm run create-admin
```

---

## Step 5: Post-Deployment Verification (5 minutes)

1. **Check Health Endpoint:**
   ```bash
   curl https://your-domain.vercel.app/api/health
   ```
   Should return: `{"status":"healthy",...}`

2. **Login as Admin:**
   - Go to `https://your-domain.vercel.app`
   - Email: `admin@executiveelite.com`
   - Password: `Admin123!`

3. **🔴 IMMEDIATELY Change Admin Password**
   - Go to profile settings
   - Update password to something secure

4. **Test User Registration:**
   - Create a candidate account
   - Create an employer account
   - Test job posting flow

---

## Step 6: Optional Features Setup

### Enable Stripe Payments
Add to environment variables:
```
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Enable Email Notifications
Add to environment variables:
```
MAILERSEND_API_KEY=...
```

---

## 🎉 You're Live!

Your application is now deployed at:
**https://your-domain.vercel.app**

### Next Steps:
- [ ] Configure custom domain (if desired)
- [ ] Monitor logs in Vercel dashboard
- [ ] Test all critical user flows
- [ ] Share with beta users
- [ ] Set up error monitoring (Sentry, LogRocket, etc.)

---

## 🆘 Troubleshooting

### Build Fails
- Check that `npm run build` works locally
- Verify all environment variables are set
- Check Vercel build logs for specific errors

### Database Connection Fails
- Verify DATABASE_URL format
- Check database allows connections from Vercel IPs
- Test connection with `/api/health` endpoint

### AI Features Don't Work
- Verify OPENAI_API_KEY is set
- Check OpenAI account has API credits
- Test with `/api/ai/usage-stats` (requires admin login)

### Can't Login
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your domain
- Clear browser cookies and try again

---

## 📊 Monitoring After Launch

1. **Vercel Dashboard** → Your Project → **Analytics**
   - Monitor page views, response times, errors

2. **Database** → Check usage and performance
   - Monitor connection count
   - Check query performance

3. **OpenAI** → Dashboard → **Usage**
   - Monitor API usage and costs

4. **Logs** → Vercel Dashboard → **Functions**
   - Check API route logs for errors

---

*Time to deploy: ~30 minutes total*
*Difficulty: 🟢 Beginner-friendly*


