# 🔐 OAuth & Magic Link Setup Guide

## Overview

This guide covers configuring **Google OAuth**, **Apple OAuth**, and **Magic Link (Email OTP)** authentication in your GestivaOne app powered by Supabase.

---

## Phase 1: Google OAuth Setup

### Step 1.1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project: **"GestivaOne Auth"**
3. Enable the **Google+ API**:
   - Go to **APIs & Services → Library**
   - Search for **"Google+ API"** and click **Enable**

### Step 1.2: Create OAuth 2.0 Credentials

1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → OAuth 2.0 Client IDs**
3. Choose **Web Application**
4. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:3000/auth
   https://gestivaone.com/auth
   ```
5. Click **Create** and copy:
   - **Client ID**
   - **Client Secret**

### Step 1.3: Add to Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your **GestivaOne** project
3. Go to **Authentication → Providers → Google**
4. Enable the provider ✅
5. Paste your **Client ID** and **Client Secret**
6. Under **Redirect URLs**, add:
   ```
   http://localhost:3000/auth
   https://gestivaone.com/auth
   ```
7. Click **Save**

---

## Phase 2: Apple OAuth Setup

### Step 2.1: Get Apple Developer Credentials

⚠️ **Requires Apple Developer Account** ($99/year if you don't have one)

1. Go to [Apple Developer](https://developer.apple.com/)
2. Sign in with your Apple ID
3. Go to **Certificates, Identifiers & Profiles**

### Step 2.2: Create a Service ID

1. Click **Identifiers**
2. Click **+** to create a new identifier
3. Select **Services IDs**
4. Fill in:
   - **Description**: `GestivaOne Authentication`
   - **Identifier**: `com.gestivaone.auth` (reverse domain notation)
5. Enable **Sign in with Apple**
6. Click **Configure** and add your domain
7. Click **Save**

### Step 2.3: Generate Private Key (P8)

1. Go to **Keys**
2. Click **+** to create a new key
3. Enter **Key Name**: `GestivaOne Auth Key`
4. Enable **Sign in with Apple**
5. Click **Configure** and select your **Service ID**
6. Click **Save**
7. Download the **`.p8` file** (keep this safe!)
8. Note your **Key ID** and **Team ID**

### Step 2.4: Add to Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Go to **Authentication → Providers → Apple**
3. Enable the provider ✅
4. Fill in:
   - **Service ID**: `com.gestivaone.auth`
   - **Team ID**: (from Apple Developer)
   - **Key ID**: (from Apple Developer)
   - **Private Key**: (paste the contents of the `.p8` file)
5. Under **Redirect URLs**, add:
   ```
   http://localhost:3000/auth
   https://gestivaone.com/auth
   ```
6. Click **Save**

#### Domain Verification (Required for Production)

Apple requires domain verification. In Supabase:

1. Download the verification file or copy the meta tag
2. Upload to your domain's `.well-known` folder or add meta tag to `<head>`
3. Supabase will verify automatically within 24 hours

---

## Phase 3: Magic Link (Email OTP) Setup

### Step 3.1: Enable in Supabase

1. Go to **Authentication → Providers → Email**
2. Enable ✅
3. Keep **Confirm email** and **OTP** enabled
4. Set expiration to your preference (default: 24 hours)
5. Click **Save**

### Step 3.2: Configure Email Template (Optional)

To customize the magic link email:

1. Go to **Authentication → Email Templates**
2. Edit the **Confirm signup** template
3. Customize the subject and body
4. Use `{{ .ConfirmationURL }}` placeholder for the link
5. Click **Save**

---

## Phase 4: Environment Setup

### Step 4.1: Create `.env.local`

In your project root:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project-name.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key...
```

Get these from **Supabase → Settings → API**

### Step 4.2: Verify `.env.local` is in `.gitignore`

```
# .gitignore
.env.local
.env.*.local
```

---

## Phase 5: Testing Locally

### Test Google OAuth

```bash
npm run dev
# Visit http://localhost:3000/auth
# Click the Google button
# You should be redirected to Google login
# After login, you should be redirected back and auto-logged in
```

### Test Apple OAuth

```bash
# Same as Google (Apple OAuth works in development)
# You need an Apple ID to test
```

### Test Magic Link

```bash
# Visit http://localhost:3000/auth
# Click "¿Prefieres un enlace mágico?"
# Enter your email
# Check your email for the sign-in link
# Click the link to automatically sign in
```

---

## Phase 6: Production Deployment

### Step 6.1: Update Redirect URLs

After deploying to production (e.g., `https://gestivaone.com`):

1. **Google**: Go to Google Cloud Console → **APIs & Services → Credentials**
   - Add `https://gestivaone.com/auth` to **Authorized redirect URIs**

2. **Apple**: Go to Apple Developer → **Certificates, Identifiers & Profiles**
   - Add `https://gestivaone.com` to verified domains

3. **Supabase**: Already configured if you added both URLs earlier ✅

### Step 6.2: Update Environment Variables

Set in your hosting platform (e.g., Vercel, Netlify):

```
VITE_SUPABASE_URL=https://your-project-name.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key...
```

### Step 6.3: Test Production Flows

1. Visit `https://gestivaone.com/auth`
2. Test all three methods:
   - ✅ Google OAuth
   - ✅ Apple OAuth
   - ✅ Magic Link

---

## Troubleshooting

### Google OAuth Issues

**"Redirect URI mismatch"**
- Verify redirect URLs match exactly in both Google Cloud Console and Supabase
- Include `/auth` at the end

**"Invalid Client ID"**
- Double-check you're using the correct Client ID from Google Cloud Console

### Apple OAuth Issues

**"Invalid Service ID"**
- Ensure Service ID uses reverse domain notation (e.g., `com.gestivaone.auth`)
- Verify it's enabled for "Sign in with Apple"

**"Domain not verified"**
- Apple requires domain verification for production
- Follow the verification steps in Supabase Auth settings

**"Key expired"**
- Apple P8 keys expire after a period
- Generate a new key and update Supabase

### Magic Link Issues

**"Email not received"**
- Check spam/promotions folder
- Verify SMTP settings in Supabase (if using custom email)
- Check Supabase logs: **Authentication → Logs**

**"Link expired"**
- Magic links expire after 24 hours (configurable)
- User needs to request a new link

---

## Code Reference

### Triggering OAuth from UI

```javascript
// In Auth.jsx - Google button
const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle)
onClick={() => signInWithGoogle()}

// Apple button
const signInWithApple = useAuthStore((s) => s.signInWithApple)
onClick={() => signInWithApple()}
```

### Triggering Magic Link from UI

```javascript
// In Auth.jsx - Magic Link form
const sendMagicLink = useAuthStore((s) => s.sendMagicLink)
const result = await sendMagicLink(email)
```

### Auto-Profile Creation

After OAuth login, `ensureProfileExists()` automatically:
1. Checks if user profile exists
2. Creates company + profile if missing
3. Sets role to `administrador` and plan to `standard`

---

## Security Best Practices

✅ **Never commit `.env.local`** to Git  
✅ **Use environment variables** for all secrets  
✅ **Rotate Apple P8 keys** periodically  
✅ **Enable 2FA** on Google Cloud and Apple Developer accounts  
✅ **Monitor auth logs** in Supabase dashboard  
✅ **Test redirect URLs** thoroughly in staging  

---

## Next Steps

1. ✅ Complete Steps 1-3 in Supabase dashboard
2. ✅ Create `.env.local` with credentials
3. ✅ Run `npm run dev` and test locally
4. ✅ Deploy to production
5. ✅ Update production redirect URLs
6. ✅ Monitor auth logs for issues

---

## Support

For issues:
- Check **Supabase Logs**: Authentication → Logs
- See **Google Console Logs**: APIs & Services → Credentials
- See **Apple Developer Logs**: (if available)
- Review **Browser Console**: DevTools → Console tab

---

**Last Updated**: June 6, 2026  
**Status**: ✅ Ready for Production
