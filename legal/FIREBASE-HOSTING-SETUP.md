# 🔥 Firebase Hosting Setup Guide for Legal Documents

**Created:** February 16, 2025
**Purpose:** Host Privacy Policy and Terms of Service for App Store submission

---

## 📋 What You'll Host

App Store requires **publicly accessible URLs** for:
- Privacy Policy (HU + EN)
- Terms of Service - MVP version (HU + EN)

**Files to host:**
```
/privacy-policy-hu.html
/privacy-policy-en.html
/terms-of-service-mvp-hu.html
/terms-of-service-mvp-en.html
```

**Final URLs will be:**
```
https://your-project.web.app/privacy-policy-hu.html
https://your-project.web.app/privacy-policy-en.html
https://your-project.web.app/terms-of-service-mvp-hu.html
https://your-project.web.app/terms-of-service-mvp-en.html
```

---

## 🚀 Quick Start (Step-by-Step)

### Step 1: Install Required Tools

#### 1.1 Install Firebase CLI
```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Verify installation
firebase --version
# Should show: 13.x.x or higher
```

#### 1.2 Install Pandoc (Markdown → HTML converter)
```bash
# macOS (using Homebrew)
brew install pandoc

# Verify installation
pandoc --version
# Should show: pandoc 3.x or higher
```

**Alternative if you don't have Homebrew:**
- Download from [pandoc.org](https://pandoc.org/installing.html)

---

### Step 2: Convert Markdown to HTML

Navigate to the legal folder:
```bash
cd /Users/uuser01/Desktop/Adon/AdonApp/legal
```

#### 2.1 Convert Privacy Policies
```bash
# Hungarian Privacy Policy
pandoc privacy-policy-hu.md -o privacy-policy-hu.html \
  --standalone \
  --css=style.css \
  --metadata title="Adatvédelmi Irányelvek - ADON"

# English Privacy Policy
pandoc privacy-policy-en.md -o privacy-policy-en.html \
  --standalone \
  --css=style.css \
  --metadata title="Privacy Policy - ADON"
```

#### 2.2 Convert Terms of Service (MVP versions)
```bash
# Hungarian Terms (MVP)
pandoc terms-of-service-mvp-hu.md -o terms-of-service-mvp-hu.html \
  --standalone \
  --css=style.css \
  --metadata title="Felhasználási Feltételek - ADON"

# English Terms (MVP)
pandoc terms-of-service-mvp-en.md -o terms-of-service-mvp-en.html \
  --standalone \
  --css=style.css \
  --metadata title="Terms of Service - ADON"
```

**What these flags do:**
- `--standalone`: Creates a complete HTML document (with `<html>`, `<head>`, `<body>`)
- `--css=style.css`: Links to a CSS file for styling
- `--metadata title`: Sets the page title

---

### Step 3: Create a Simple CSS File (Optional but Recommended)

Create `style.css` in the legal folder:

```bash
cat > style.css << 'EOF'
/* ADON Legal Documents Styling */
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
    line-height: 1.6;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    color: #333;
    background-color: #f9f9f9;
}

h1 {
    color: #6C5CE7; /* ADON purple */
    border-bottom: 3px solid #6C5CE7;
    padding-bottom: 10px;
    margin-top: 40px;
}

h2 {
    color: #2d3436;
    margin-top: 30px;
    border-left: 4px solid #6C5CE7;
    padding-left: 15px;
}

h3 {
    color: #636e72;
    margin-top: 20px;
}

a {
    color: #6C5CE7;
    text-decoration: none;
}

a:hover {
    text-decoration: underline;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    background-color: white;
}

th, td {
    border: 1px solid #ddd;
    padding: 12px;
    text-align: left;
}

th {
    background-color: #6C5CE7;
    color: white;
}

tr:nth-child(even) {
    background-color: #f2f2f2;
}

code {
    background-color: #f4f4f4;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 0.9em;
}

pre {
    background-color: #2d3436;
    color: #dfe6e9;
    padding: 15px;
    border-radius: 5px;
    overflow-x: auto;
}

blockquote {
    border-left: 4px solid #6C5CE7;
    padding-left: 20px;
    margin: 20px 0;
    color: #636e72;
    font-style: italic;
}

ul, ol {
    margin: 15px 0;
    padding-left: 30px;
}

li {
    margin: 8px 0;
}

hr {
    border: none;
    border-top: 2px solid #dfe6e9;
    margin: 40px 0;
}

/* Mobile responsive */
@media (max-width: 768px) {
    body {
        padding: 15px;
        font-size: 14px;
    }

    h1 {
        font-size: 24px;
    }

    h2 {
        font-size: 20px;
    }

    table {
        font-size: 12px;
    }
}

/* Print styles */
@media print {
    body {
        background-color: white;
        color: black;
    }

    a {
        color: black;
        text-decoration: underline;
    }
}
EOF
```

This creates a clean, professional look for your legal documents.

---

### Step 4: Initialize Firebase Hosting

#### 4.1 Login to Firebase
```bash
firebase login
```

This will open a browser window. Sign in with your Google account.

#### 4.2 Initialize Hosting in Your Project

**Option A: If you already have Firebase initialized in AdonApp:**
```bash
cd /Users/uuser01/Desktop/Adon/AdonApp

# Add hosting to existing Firebase project
firebase init hosting
```

**Option B: If starting fresh:**
```bash
cd /Users/uuser01/Desktop/Adon/AdonApp

# Initialize Firebase
firebase init

# Select:
# - Hosting: Configure files for Firebase Hosting
# - Use an existing project (select your ADON project)
```

#### 4.3 Configuration Prompts
When prompted:

**1. What do you want to use as your public directory?**
```
legal
```
(This tells Firebase to serve files from the `legal/` folder)

**2. Configure as a single-page app (rewrite all urls to /index.html)?**
```
No
```
(We want direct file access, not SPA routing)

**3. Set up automatic builds and deploys with GitHub?**
```
No
```
(Unless you want CI/CD, which is optional)

**4. File public/index.html already exists. Overwrite?**
```
No
```
(If prompted - keep your existing files)

---

### Step 5: Organize Files for Deployment

After initialization, you should have:

```
AdonApp/
├── legal/
│   ├── privacy-policy-hu.md
│   ├── privacy-policy-en.md
│   ├── terms-of-service-mvp-hu.md
│   ├── terms-of-service-mvp-en.md
│   ├── privacy-policy-hu.html       ← Generated
│   ├── privacy-policy-en.html       ← Generated
│   ├── terms-of-service-mvp-hu.html ← Generated
│   ├── terms-of-service-mvp-en.html ← Generated
│   ├── style.css                     ← Created
│   └── index.html                    ← (Optional) Landing page
├── firebase.json
└── .firebaserc
```

#### 5.1 (Optional) Create a Landing Page

Create `legal/index.html`:

```bash
cat > legal/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ADON - Legal Documents</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>📋 ADON Legal Documents</h1>

    <h2>Privacy Policy</h2>
    <ul>
        <li><a href="privacy-policy-hu.html">🇭🇺 Magyar (Hungarian)</a></li>
        <li><a href="privacy-policy-en.html">🇬🇧 English</a></li>
    </ul>

    <h2>Terms of Service (MVP Version)</h2>
    <ul>
        <li><a href="terms-of-service-mvp-hu.html">🇭🇺 Magyar (Hungarian)</a></li>
        <li><a href="terms-of-service-mvp-en.html">🇬🇧 English</a></li>
    </ul>

    <hr>

    <p style="text-align: center; color: #636e72; font-size: 14px;">
        © 2025 ADON. All rights reserved.<br>
        <a href="mailto:support@adon.app">support@adon.app</a>
    </p>
</body>
</html>
EOF
```

---

### Step 6: Configure firebase.json (Optional Customization)

Edit `firebase.json` to add custom headers and redirects:

```json
{
  "hosting": {
    "public": "legal",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**",
      "**/*.md"
    ],
    "headers": [
      {
        "source": "**/*.html",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=3600"
          }
        ]
      }
    ],
    "cleanUrls": true,
    "trailingSlash": false
  }
}
```

**What this does:**
- `cleanUrls: true`: Allows `/privacy-policy-hu` instead of `/privacy-policy-hu.html`
- `headers`: Caches HTML files for 1 hour
- `ignore`: Skips deploying `.md` files (only deploy `.html`)

---

### Step 7: Deploy to Firebase

#### 7.1 Test Locally First (Recommended)
```bash
firebase serve --only hosting

# Open browser:
# http://localhost:5000/privacy-policy-hu.html
```

Check that all pages load correctly.

#### 7.2 Deploy to Production
```bash
firebase deploy --only hosting
```

**Output:**
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/your-project-id/overview
Hosting URL: https://your-project-id.web.app
```

---

### Step 8: Verify Deployment

Visit your URLs:

```
https://your-project-id.web.app/privacy-policy-hu.html
https://your-project-id.web.app/privacy-policy-en.html
https://your-project-id.web.app/terms-of-service-mvp-hu.html
https://your-project-id.web.app/terms-of-service-mvp-en.html
```

**Check:**
- ✅ Pages load without errors
- ✅ Styling is applied (CSS loaded)
- ✅ All links work
- ✅ Mobile-responsive (test on phone)
- ✅ No 404 errors

---

## 🔗 Add URLs to App Store Connect

Once deployed, add these URLs to App Store Connect:

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. **My Apps** > **ADON** > **App Store** tab
3. Scroll to **App Information**
4. Fill in:
   - **Privacy Policy URL:** `https://your-project-id.web.app/privacy-policy-en.html`
   - **Terms of Service URL:** (optional, but recommended) `https://your-project-id.web.app/terms-of-service-mvp-en.html`

**For Hungarian locale** (if submitting to Hungarian App Store first):
- Use `/privacy-policy-hu.html` and `/terms-of-service-mvp-hu.html`

---

## 🎨 Custom Domain (Optional)

If you want a custom domain (e.g., `legal.adon.app`):

### Step 1: Add Domain in Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. **Hosting** > **Add custom domain**
4. Enter: `legal.adon.app` (or `www.adon.app`)

### Step 2: Verify Ownership
Firebase will provide a **TXT record**:
```
Name: _firebase
Value: firebase-verify-xxxxxxxxxxxxx
```

Add this to your domain's DNS settings (e.g., GoDaddy, Namecheap, Cloudflare).

### Step 3: Add DNS Records
Firebase will provide **A records**:
```
Type: A
Name: legal (or @)
Value: 151.101.1.195
Value: 151.101.65.195
```

Add these to your DNS.

### Step 4: Wait for SSL Certificate
Firebase automatically provisions a free SSL certificate (Let's Encrypt).
**Wait time:** 15 minutes to 24 hours.

**Final URL:**
```
https://legal.adon.app/privacy-policy-hu.html
```

---

## 🔧 Troubleshooting

### Issue #1: "firebase: command not found"
**Solution:**
```bash
# Reinstall Firebase CLI
npm install -g firebase-tools

# Or use npx (no install needed)
npx firebase-tools login
npx firebase-tools deploy --only hosting
```

---

### Issue #2: "pandoc: command not found"
**Solution:**
```bash
# macOS
brew install pandoc

# Or download from https://pandoc.org/installing.html
```

---

### Issue #3: Pages Show 404 After Deploy
**Possible causes:**
1. Files not in `legal/` folder
2. Wrong public directory in `firebase.json`

**Solution:**
```bash
# Check firebase.json
cat firebase.json

# Should show:
# "public": "legal"

# Redeploy
firebase deploy --only hosting
```

---

### Issue #4: CSS Not Loading
**Check:**
1. `style.css` is in the same folder as HTML files
2. HTML files reference it correctly: `<link rel="stylesheet" href="style.css">`

**Solution:**
```bash
# Re-convert with correct CSS reference
pandoc privacy-policy-hu.md -o privacy-policy-hu.html \
  --standalone \
  --css=style.css
```

---

### Issue #5: HTML Looks Ugly (No Formatting)
**If you skipped the CSS step:**

Use pandoc's built-in styling:
```bash
pandoc privacy-policy-hu.md -o privacy-policy-hu.html \
  --standalone \
  --self-contained \
  --template=github
```

---

## 📊 Monitoring & Analytics (Optional)

### Add Google Analytics (if you want page view tracking)

1. Get your GA4 Measurement ID (e.g., `G-XXXXXXXXXX`)
2. Add to HTML files (in `<head>` section):

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

This lets you track how many people view your legal docs.

---

## ✅ Final Checklist

Before App Store submission:

- [ ] All 4 HTML files deployed successfully
- [ ] URLs are publicly accessible (test in incognito mode)
- [ ] Privacy Policy URL added to App Store Connect
- [ ] Terms of Service URL added to App Store Connect (optional but recommended)
- [ ] Pages are mobile-responsive (test on phone)
- [ ] No broken links
- [ ] SSL certificate active (URLs start with `https://`)
- [ ] Placeholder values replaced with real info ([Your Address], etc.)

---

## 🚀 Quick Reference Commands

```bash
# Navigate to legal folder
cd /Users/uuser01/Desktop/Adon/AdonApp/legal

# Convert all MD to HTML
pandoc privacy-policy-hu.md -o privacy-policy-hu.html --standalone --css=style.css
pandoc privacy-policy-en.md -o privacy-policy-en.html --standalone --css=style.css
pandoc terms-of-service-mvp-hu.md -o terms-of-service-mvp-hu.html --standalone --css=style.css
pandoc terms-of-service-mvp-en.md -o terms-of-service-mvp-en.html --standalone --css=style.css

# Test locally
firebase serve --only hosting

# Deploy
firebase deploy --only hosting

# Check deployment
firebase open hosting:site
```

---

## 📞 Need Help?

- **Firebase Docs:** [firebase.google.com/docs/hosting](https://firebase.google.com/docs/hosting)
- **Pandoc Manual:** [pandoc.org/MANUAL.html](https://pandoc.org/MANUAL.html)
- **ADON Support:** support@adon.app

---

**Estimated time to complete:** 30-45 minutes (first time)

**Last Updated:** February 16, 2025

© 2025 ADON. All rights reserved.
