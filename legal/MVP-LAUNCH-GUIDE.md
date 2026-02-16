# 🚀 ADON MVP Launch Guide (Direct Trade Only)

**Date:** February 16, 2025
**Version:** 1.0 MVP (Beta)
**Strategy:** Fast launch without payment processing

---

## 📋 What Changed for MVP?

### ✅ What We HAVE (Working)
- Product listings and search
- Chat between buyers and sellers
- User profiles and ratings
- Photo uploads
- Category browsing
- AI product analysis (optional)

### ❌ What We DON'T HAVE (Coming Later)
- ~~In-app payment processing~~
- ~~Escrow system~~
- ~~Stripe/PayPal integration~~
- ~~Automated shipping~~

**→ MVP = Direct meetup only** (like OLX, Jófogás, Facebook Marketplace)

---

## 🎯 App Positioning for App Store

### App Category
**Primary:** Lifestyle > Shopping
**Secondary:** Social Networking

### App Description (Short)
"ADON - Premium resale marketplace for direct meetups. Buy and sell pre-owned items locally with confidence."

### Keywords (Hungarian Market)
`használt, eladás, vétel, piac, találkozó, prémium, újrahasználat, Budapest`

### What to Emphasize
- ✅ "Local marketplace for premium second-hand items"
- ✅ "Connect directly with buyers and sellers"
- ✅ "Safe chat and rating system"
- ❌ DON'T mention "payment", "escrow", "money transfer"

---

## 📄 Legal Documents Status

### Updated for MVP
| Document | Status | URL Needed |
|----------|--------|------------|
| [terms-of-service-mvp-hu.md](terms-of-service-mvp-hu.md) | ✅ Ready | Yes |
| terms-of-service-mvp-en.md | 🔜 Create | Yes |
| privacy-policy-hu.md | ⚠️ Update needed | Yes |
| privacy-policy-en.md | ⚠️ Update needed | Yes |

**Changes Made:**
- ✅ Removed all Stripe/PayPal references
- ✅ Removed escrow system
- ✅ Added "BETA" warnings
- ✅ Expanded liability disclaimers
- ✅ Added safety tips for meetups
- ✅ Made it FREE (no service fees)

**Privacy Policy Updates Needed:**
- Remove "Payment processors" section
- Remove "Transaction data (7 years)" retention
- Keep everything else (chat, photos, location)

---

## 🛡️ Safety Features to Highlight

### In-App Safety Tips (Add to UI)
When user clicks "Buy" or starts chat, show:

```
⚠️ SAFETY TIPS:
✅ Meet in public places (malls, cafés)
✅ Bring a friend
✅ Check the item before paying
✅ Use cash for payment
❌ Never share personal address
❌ Never pay in advance
```

### Rating System Importance
- Emphasize that ratings build trust
- Show "New Seller" badges
- Display response time and sales count

---

## 📱 App Store Submission Checklist

### 1. Replace Placeholders in Legal Docs
```markdown
[Your Address] → Actual company address
[Company Registration Number] → Actual number
[Tax Number] → Actual tax ID
[Phone Number] → Actual support phone
```

### 2. Host Legal Documents
**Recommended: Firebase Hosting**
```bash
# Install pandoc (for Markdown → HTML)
brew install pandoc

# Convert docs
cd AdonApp/legal
pandoc terms-of-service-mvp-hu.md -o terms-mvp-hu.html
pandoc privacy-policy-hu.md -o privacy-hu.html

# Deploy
firebase deploy --only hosting
```

**URLs will be:**
- https://your-project.web.app/terms-mvp-hu.html
- https://your-project.web.app/privacy-hu.html

### 3. App Store Connect - Data Collection Declaration

**Data Collected:**
- [x] Contact Info: Name, Email
- [x] User Content: Photos, Messages, Product Listings
- [x] Usage Data: Product Interactions
- [x] Identifiers: User ID, Device ID
- [x] Location: Approximate Location (city-level)

**Data NOT Collected (MVP):**
- [ ] Financial Info: ~~Payment Info~~ (no payment processing)
- [ ] Purchase History: ~~Transactions~~ (no in-app payments)

**Linked to User:** YES
**Used for Tracking:** NO
**Used for Advertising:** NO

### 4. App Store Metadata

**App Name (Hungarian):**
"ADON - Prémium Használt Termékek"

**Subtitle (50 chars max):**
"Direkt találkozós piactér"

**Description (Hungarian - First paragraph):**
```
ADON egy modern használt termék piactér, ahol biztonságosan találkozhatsz
eladókkal és vevőkkel. Hirdesd meg prémium minőségű használt termékeidet,
és vásárolj másra is könnyedén.

🌟 FŐBB JELLEMZŐK:
• Egyszerű hirdetésfeladás fotókkal
• Közvetlen csevegés eladókkal
• Értékelési rendszer a bizalom építéséhez
• AI-alapú ár becslés (béta)
• Kategória szerinti böngészés

💬 100% INGYENES HASZNÁLAT
Jelenleg nincs listázási díj vagy tranzakciós díj. Csak találkozz
személyesen a vevővel vagy eladóval!

⚠️ BÉTA VERZIÓ
Ez egy korai verzió korlátozozott funkciókkal. Online fizetés hamarosan!
```

**Privacy Policy URL:**
`https://your-project.web.app/privacy-hu.html`

**Terms of Service URL:**
`https://your-project.web.app/terms-mvp-hu.html`

**Support URL:**
`mailto:support@adon.app` (or create a simple website)

---

## 🎨 Screenshots Needed

### Required Sizes (iPhone)
- 6.7" (iPhone 14 Pro Max): 1290 x 2796 px
- 6.5" (iPhone 11 Pro Max): 1242 x 2688 px

### Recommended Screenshots (5-8 screens)
1. **Home Screen** - Product grid with categories
2. **Product Detail** - Single product with photos
3. **Chat Screen** - Conversation with seller
4. **Post Item** - Listing creation screen
5. **Profile Screen** - User profile with ratings

**Language:** Hungarian UI (with HU translations we just completed!)

**Tools:**
- Use iOS Simulator + Screenshot capture
- Or use [Figma](https://figma.com) for mockups
- Add text overlays highlighting features

---

## ⚙️ Technical Checklist

### Before Submission
- [ ] Set `version` in package.json to `1.0.0`
- [ ] Set `expo.version` in app.json to `1.0.0`
- [ ] Set `expo.ios.buildNumber` to `1`
- [ ] Remove all `console.log()` statements
- [ ] Test on real iOS device
- [ ] Ensure app doesn't crash on startup
- [ ] Test chat, listing, profile flows

### Firebase Settings
- [ ] Switch to **Production** Firestore (if using test DB)
- [ ] Enable **Production** Firebase Auth
- [ ] Update Firestore Rules (stricter)
- [ ] Set up APNs for push notifications (optional for v1.0)

---

## 🚨 What NOT to Say to Apple Reviewers

**❌ AVOID:**
- "We will add payment later" (sounds incomplete)
- "This is just a test" (sounds not ready)
- "Beta version with limited features" (in submission notes)

**✅ INSTEAD SAY:**
- "A local marketplace app for direct meetups"
- "Similar to OLX or Facebook Marketplace"
- "Full-featured app for peer-to-peer sales"

**Apple's Perspective:**
- They're OK with "no payment" (it's actually simpler to approve!)
- They're OK with "direct trade" (many apps do this)
- They just want a **working, polished app**

---

## 📊 Expected Timeline

| Task | Time | When |
|------|------|------|
| Update Privacy Policy | 30 min | Today |
| Host legal docs | 1 hour | Today |
| Create screenshots | 2 hours | Tomorrow |
| App Store Connect setup | 1 hour | Tomorrow |
| Submit for review | - | Tomorrow PM |
| **Apple review** | **2-5 days** | - |
| **LAUNCH** | - | **~Feb 22** 🎉 |

---

## 💰 Monetization Plan (Future)

**v1.0 MVP:** FREE (no revenue)
**v1.1 (Q2 2025):** Add Stripe → 3-5% service fee
**v1.2:** Premium features (promoted listings, etc.)

**Why free first?**
- Faster approval
- Build user base
- Validate product-market fit
- Then add payment when there's proven demand

---

## 📞 Support Setup

### Minimum Support Required
1. **Email:** support@adon.app (must respond within 48h)
2. **In-app:** Settings > Help Center → link to email
3. **Website:** Optional but helpful (simple landing page)

### FAQ to Prepare
- "How do I meet safely?"
- "What if the item is fake?"
- "How do I delete my account?"
- "When will online payment be available?"

---

## ✅ Final Pre-Launch Checklist

- [ ] Legal docs updated for MVP
- [ ] Legal docs hosted publicly
- [ ] Placeholders replaced with real info
- [ ] App screenshots created (Hungarian UI)
- [ ] App Store Connect account created
- [ ] App description written (Hungarian)
- [ ] Privacy Policy URL added
- [ ] Terms URL added
- [ ] Data collection declared
- [ ] Test app on real device
- [ ] Submit!

---

## 🎉 Post-Launch Tasks

**Week 1:**
- Monitor crash reports
- Respond to user feedback
- Fix critical bugs

**Week 2-4:**
- Gather user feedback on payment needs
- Plan Stripe integration
- Start designing v1.1

**Month 2:**
- If 100+ users → add payment
- If < 100 users → keep marketing MVP

---

**🚀 YOU'RE READY TO LAUNCH!**

Any questions? support@adon.app

---

**Created:** February 16, 2025
**Last Updated:** February 16, 2025
**Next Review:** After Apple approval

© 2025 ADON. All rights reserved.
