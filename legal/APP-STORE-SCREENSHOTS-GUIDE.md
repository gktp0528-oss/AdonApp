# 📸 ADON App Store Screenshots Guide

**Created:** February 16, 2025
**Target:** Hungarian App Store Launch (iOS)

---

## 📱 Required Screenshot Sizes (iOS)

Apple requires screenshots for **two device sizes**:

### Primary Sizes
1. **6.7" Display (iPhone 14 Pro Max, iPhone 15 Pro Max)**
   - Resolution: **1290 x 2796 pixels**
   - Format: PNG or JPEG
   - Mandatory

2. **6.5" Display (iPhone 11 Pro Max, iPhone XS Max)**
   - Resolution: **1242 x 2688 pixels**
   - Format: PNG or JPEG
   - Mandatory

**Note:** If you only provide 6.7" screenshots, Apple will scale them down for smaller devices (but providing both is recommended for quality).

---

## 🎨 Screenshot Content Strategy

**Number of screenshots:** 5-8 (Apple allows up to 10, but 5-8 is optimal)

**Language:** All screenshots MUST use **Hungarian UI** (since we completed hu.json translation!)

**Quality standards:**
- ✅ Real app screens (not mockups, unless very polished)
- ✅ Show actual functionality
- ✅ Consistent branding (colors, fonts)
- ✅ Clean, uncluttered interface
- ✅ Readable text (avoid tiny fonts)
- ❌ No personal data (blur user names, profile pictures if needed)

---

## 📋 Recommended Screenshot Sequence

### Screenshot #1: Home Screen / Product Feed
**Purpose:** First impression - show variety and clean design

**What to show:**
- Grid of premium products (6-9 items visible)
- Category tabs at top (Fashion, Tech, Home, Sports, Mobility)
- Search bar
- Bottom navigation bar
- "Just In" badge on recent items

**Hungarian UI elements:**
- Search placeholder: "Keresés" (from hu.json)
- Categories: "Divat & Stílus", "Digitális & Tech", etc.
- Tab labels: "Kezdőlap", "Keresés", "Feltöltés", "Csevegés", "Profil"

**Text overlay (optional):**
```
"Prémium használt termékek
egy helyen"
```

---

### Screenshot #2: Product Detail Page
**Purpose:** Show product information depth

**What to show:**
- High-quality product photo (e.g., Nike sneakers, designer bag)
- Product title: "Nike Air Max 97 Triple White"
- Price: "25 000 Ft"
- Condition badge: "Szinte új"
- Seller profile card with rating (⭐ 4.8, 12 eladás)
- "Csevegés" and "Vásárlás" buttons
- Description section
- Location: "Budapest, XIII. kerület"

**Text overlay (optional):**
```
"Részletes termékleírások
és eladói értékelések"
```

---

### Screenshot #3: Chat Screen
**Purpose:** Show direct communication feature

**What to show:**
- Conversation between buyer and seller
- Product thumbnail at top
- Message bubbles (Hungarian text):
  - Buyer: "Szia! Ez még elérhető?"
  - Seller: "Igen, még megvan!"
  - Buyer: "Találkozhatnánk ma délután?"
- Send message input: "Üzenet írása..."
- Safe, professional chat interface

**Text overlay (optional):**
```
"Biztonságos csevegés
eladókkal"
```

---

### Screenshot #4: Listing Creation (AI Feature)
**Purpose:** Show how easy it is to sell

**What to show:**
- "Új hirdetés" screen
- Photo upload section (with 2-3 photos uploaded)
- Form fields filled:
  - Cím: "Apple AirPods Pro 2. generáció"
  - Kategória: "Digitális & Tech"
  - Ár: "35 000 Ft"
  - Állapot: "Jó"
  - Leírás: Sample text
- "Próbálja ki az Adon AI funkciót" banner (AI feature highlight)

**Text overlay (optional):**
```
"Termék feltöltés
másodpercek alatt"
```

---

### Screenshot #5: Profile / Seller Page
**Purpose:** Build trust with rating system

**What to show:**
- Seller profile with:
  - Profile photo (use placeholder/stock image)
  - Name: "János K."
  - Rating: ⭐ 4.9 (24 értékelés)
  - Sales count: "24 eladás"
  - Response time: "< 1h"
  - Reliability badge: "ADON Megbízhatósági Index"
- List of seller's products (3-4 items)
- "Követés" button

**Text overlay (optional):**
```
"Értékelési rendszer
a bizalom építéséhez"
```

---

### Screenshot #6 (Optional): Search / Filter
**Purpose:** Show discoverability

**What to show:**
- Search screen with results for "Nike"
- Filters visible (price range, condition, category)
- Sort options: "Legújabb", "Ár szerint növekvő"
- Result count: "47 termék található"

**Text overlay (optional):**
```
"Találd meg, amit keresel"
```

---

### Screenshot #7 (Optional): Category View
**Purpose:** Show browsing by category

**What to show:**
- Sports category expanded
- Subcategories visible:
  - "Labdarúgás"
  - "Kerékpározás"
  - "Téli sportok"
  - "Futás & Atlétika"
- Product grid filtered to sports items

---

### Screenshot #8 (Optional): Safety Tips / Meetup
**Purpose:** Emphasize safety for MVP

**What to show:**
- Safety tips modal or screen:
  ```
  ⚠️ BIZTONSÁGI TIPPEK:
  ✅ Találkozzon nyilvános helyen
  ✅ Vigyen magával barátot
  ✅ Ellenőrizze a terméket fizetés előtt
  ✅ Készpénzzel fizessen
  ```
- Context: Shown when user clicks "Buy" button

**Text overlay:**
```
"Biztonságos találkozók
nyilvános helyeken"
```

---

## 🛠️ How to Create Screenshots

### Option A: iOS Simulator (Recommended)
```bash
# 1. Run app in simulator
cd AdonApp
npx expo start --ios

# 2. In Simulator menu:
# File > New Simulator > iPhone 15 Pro Max

# 3. Navigate to each screen you want to capture

# 4. Take screenshots:
# Method 1: Cmd + S (saves to Desktop)
# Method 2: Simulator > File > Save Screen

# 5. Screenshots will be in iPhone resolution
```

**Pros:**
- ✅ Real app UI
- ✅ Accurate colors and spacing
- ✅ Fast to generate

**Cons:**
- ❌ Need sample data (create fake listings)
- ❌ May show bugs if app isn't polished

---

### Option B: Figma Mockups
```bash
# 1. Export app screens as images
# 2. Import into Figma
# 3. Place in iPhone frame template
# 4. Add text overlays, polish details
# 5. Export as PNG (1290x2796)
```

**Pros:**
- ✅ Perfect control over details
- ✅ Can hide imperfections
- ✅ Professional polish

**Cons:**
- ❌ Time-consuming
- ❌ Requires design skills

---

### Option C: Screenshot Service (Paid)
Services like **Screely** or **AppLaunchpad**:
- Upload raw screenshots
- Automatically add device frames
- Add text overlays
- Export in required sizes

**Cost:** $20-50

---

## 🎨 Design Tips

### Color Scheme
Use ADON brand colors consistently:
- Primary: Purple/blue accent (check your theme)
- Background: White or light gray
- Text: Dark gray or black
- Accent: Orange/yellow for "NEW" badges

### Text Overlays
If adding text overlays:
- **Font:** Sans-serif, bold (e.g., Inter, SF Pro)
- **Size:** Large enough to read on phone (min 24pt)
- **Color:** White text on semi-transparent dark overlay
- **Position:** Bottom third or top third (avoid center)
- **Keep it short:** 3-7 words max per line

**Example:**
```
━━━━━━━━━━━━━━━━━
│  [App Screenshot]  │
│                     │
│  ┌───────────────┐ │
│  │ Prémium használt│ │
│  │ termékek       │ │
│  └───────────────┘ │
━━━━━━━━━━━━━━━━━
```

### Status Bar
- **Time:** Set to 9:41 (Apple default)
- **Battery:** 100% charged
- **Signal:** Full bars
- **Clean:** No notifications, no "Do Not Disturb"

---

## 📦 Sample Data to Create

Before taking screenshots, populate the app with:

### Products (8-10 items)
| Product | Category | Price | Condition | Photos |
|---------|----------|-------|-----------|--------|
| Nike Air Max 97 | Sports > Football Boots | 25,000 Ft | Like New | 3 |
| Apple AirPods Pro | Tech | 35,000 Ft | Good | 2 |
| Zara Leather Jacket | Fashion | 18,000 Ft | Good | 4 |
| Sony PS5 Controller | Tech | 12,000 Ft | Like New | 2 |
| IKEA Desk Lamp | Home | 3,500 Ft | Good | 1 |

### Users (3-4 fake profiles)
- János K. (⭐ 4.9, 24 sales)
- Anna M. (⭐ 4.7, 8 sales)
- Péter S. (⭐ 5.0, 3 sales)

### Chat Messages
Use realistic Hungarian conversation:
```
Buyer: "Szia! Ez még elérhető?"
Seller: "Igen, még megvan! 😊"
Buyer: "Találkozhatnánk ma délután a WestEnd-nél?"
Seller: "Persze, 14:00 jó?"
Buyer: "Igen, ott leszek!"
```

---

## 📤 Upload to App Store Connect

### File Requirements
- **Format:** PNG or JPEG (PNG recommended)
- **Max size:** 500 KB per image (compress if needed)
- **Color space:** sRGB or Display P3
- **No alpha channel** (no transparency)

### Upload Process
1. Log in to [App Store Connect](https://appstoreconnect.apple.com)
2. Go to **My Apps** > **ADON** > **App Store** tab
3. Scroll to **App Previews and Screenshots**
4. Select device size: **6.7" Display**
5. Drag & drop screenshots in order
6. Repeat for **6.5" Display**
7. Click **Save**

**Preview:** Use App Store Connect's preview feature to see how it looks in the store.

---

## ✅ Screenshot Checklist

Before submission:

- [ ] All screenshots use **Hungarian UI** (not English)
- [ ] All screenshots are **1290x2796** (6.7") or **1242x2688** (6.5")
- [ ] Product names and prices are **realistic** (not "Test Product $999")
- [ ] No **personal data** visible (blur if needed)
- [ ] Screenshots show **real functionality** (not "Coming Soon" placeholders)
- [ ] Status bar is **clean** (9:41, full battery, no notifications)
- [ ] Colors are **consistent** with brand
- [ ] Text overlays (if used) are **readable** and **grammatically correct**
- [ ] Screenshots are **in order** (Home → Detail → Chat → Post → Profile)
- [ ] Total count: **5-8 screenshots** (not too few, not too many)

---

## 🚀 Pro Tips

### Tip #1: Show the "Why"
Don't just show screens - show **value**:
- Home screen → "Discover premium items"
- Chat → "Direct communication"
- Profile → "Trust through ratings"

### Tip #2: Use Real Photos
If possible, use real product photos (high quality):
- Unsplash/Pexels for stock product images
- Make sure they match the category

### Tip #3: Highlight MVP Strengths
Emphasize what **works** in MVP:
- ✅ Beautiful product browsing
- ✅ Easy listing creation
- ✅ Direct chat
- ✅ Rating system
- ❌ DON'T show payment screens (since it's not implemented)

### Tip #4: Localization Matters
Apple reviewers **will check** if screenshots match the primary locale:
- If App Store listing is Hungarian → Screenshots MUST be Hungarian
- Inconsistency = possible rejection

---

## 📚 Resources

**Free Screenshot Tools:**
- [Figma](https://figma.com) - Design mockups
- [Xcode Simulator](https://developer.apple.com/xcode/) - Real device screenshots
- [Screenshot Frames](https://www.screely.com/) - Add device frames

**Stock Photos:**
- [Unsplash](https://unsplash.com) - Free high-quality images
- [Pexels](https://pexels.com) - Free stock photos

**Compression:**
- [TinyPNG](https://tinypng.com) - Reduce file size (if > 500 KB)

**Apple Guidelines:**
- [App Store Screenshots Spec](https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications/)

---

## 🎯 Next Steps

1. **Prepare sample data** (8-10 products, 3-4 users, chat messages)
2. **Run app in simulator** (iPhone 15 Pro Max)
3. **Navigate and capture** screenshots (Cmd + S)
4. **Review and edit** (crop, add text overlays if desired)
5. **Compress** (if needed, to < 500 KB)
6. **Upload to App Store Connect**
7. **Preview** before submission

**Estimated time:** 2-3 hours (with app ready)

---

**Need help?** support@adon.app

**Last Updated:** February 16, 2025

© 2025 ADON. All rights reserved.
