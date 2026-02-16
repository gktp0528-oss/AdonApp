# 📋 ADON Legal Documents

This folder contains GDPR-compliant legal documents for the ADON app.

## 📁 Files

| File | Language | Description |
|------|----------|-------------|
| `privacy-policy-hu.md` | 🇭🇺 Hungarian | Adatvédelmi Irányelvek (Privacy Policy) |
| `privacy-policy-en.md` | 🇬🇧 English | Privacy Policy |
| `terms-of-service-hu.md` | 🇭🇺 Hungarian | Felhasználási Feltételek (Terms of Service) |
| `terms-of-service-en.md` | 🇬🇧 English | Terms of Service |

---

## ⚠️ IMPORTANT: Before Publishing

**These documents are TEMPLATES**. Before using them in production:

### 1. 🔍 Review and Customize
Replace placeholders with actual information:
- `[Your Address]` → Your company's registered address
- `[Company Registration Number]` → Your Hungarian company registration number
- `[Tax Number]` → Your Hungarian tax number (adószám)
- `[Phone Number]` → Your support phone number

### 2. ⚖️ Legal Review (RECOMMENDED)
Have these documents reviewed by a Hungarian legal professional:
- **Budget option:** Online services (€200-300)
  - [Rocket Lawyer Hungary](https://www.rocketlawyer.com)
  - Local Hungarian law firms specializing in GDPR
- **Full option:** Hungarian law firm (€500-1000)

### 3. 🌐 Hosting Options

Choose how to make these documents accessible:

#### Option A: Firebase Hosting (Recommended)
```bash
# 1. Convert MD to HTML (using pandoc or online tool)
pandoc privacy-policy-hu.md -o privacy-policy-hu.html
pandoc privacy-policy-en.md -o privacy-policy-en.html
pandoc terms-of-service-hu.md -o terms-of-service-hu.html
pandoc terms-of-service-en.md -o terms-of-service-en.html

# 2. Deploy to Firebase Hosting
firebase deploy --only hosting

# 3. URLs will be:
# https://your-project.web.app/privacy-policy-hu.html
# https://your-project.web.app/privacy-policy-en.html
# https://your-project.web.app/terms-of-service-hu.html
# https://your-project.web.app/terms-of-service-en.html
```

#### Option B: GitHub Pages (Free)
1. Create a `docs/` folder in your repo
2. Add HTML versions of the documents
3. Enable GitHub Pages in repo settings
4. URLs: `https://yourusername.github.io/adon/privacy-policy-hu.html`

#### Option C: In-App Webview
1. Convert MD to HTML
2. Store in `assets/legal/` folder
3. Display using WebView component in React Native

---

## 🔗 Integrating into the App

### 1. Signup Screen
Add links before the "Sign Up" button:

```typescript
// src/screens/SignupScreen.tsx
import { Linking } from 'react-native';

<Text style={styles.termsText}>
  By signing up, you agree to our{' '}
  <Text
    style={styles.link}
    onPress={() => Linking.openURL('https://your-domain.com/terms-of-service-en.html')}
  >
    Terms of Service
  </Text>{' '}
  and{' '}
  <Text
    style={styles.link}
    onPress={() => Linking.openURL('https://your-domain.com/privacy-policy-en.html')}
  >
    Privacy Policy
  </Text>.
</Text>
```

### 2. Settings Screen
Add a "Legal" section:

```typescript
// src/screens/SettingsScreen.tsx
<Section title="Legal">
  <MenuItem
    title="Privacy Policy"
    onPress={() => openLegalDoc('privacy-policy')}
  />
  <MenuItem
    title="Terms of Service"
    onPress={() => openLegalDoc('terms-of-service')}
  />
</Section>
```

### 3. App Store Metadata
For App Store Connect submission, you'll need to provide URLs:
- **Privacy Policy URL:** `https://your-domain.com/privacy-policy-en.html`
- **Terms of Service URL:** `https://your-domain.com/terms-of-service-en.html`

---

## 📱 Apple App Store Requirements

Apple requires:
1. ✅ Privacy Policy URL (publicly accessible)
2. ✅ Terms of Service URL (publicly accessible)
3. ✅ In-app link to Privacy Policy (in Settings or About)
4. ✅ Data collection disclosure in App Store Connect

### Data Collection Disclosure Example
When submitting to App Store Connect, you'll need to declare:

**Data Collected:**
- Contact Info: Name, Email, Phone Number
- Location: Approximate Location, Precise Location (optional)
- User Content: Photos, Messages, Product Listings
- Usage Data: Product Interactions, App Usage
- Identifiers: User ID, Device ID

**Data Linked to User:** YES (for all above)
**Data Used for Tracking:** NO (unless you add advertising)

---

## 🔄 Maintenance

### Update Schedule
- **Minor updates:** As needed (typos, clarifications)
- **Major updates:** Review every 6 months
- **GDPR changes:** Update immediately if EU regulations change

### Version Control
When updating:
1. Update "Last Updated" date in document
2. Archive old version (e.g., `privacy-policy-hu-2025-02-16.md`)
3. Notify users via email if material changes

---

## ✅ Checklist Before App Store Submission

- [ ] Replace all placeholders with actual information
- [ ] (Optional but recommended) Get legal review
- [ ] Convert MD to HTML
- [ ] Host documents publicly (Firebase/GitHub/Website)
- [ ] Test URLs are accessible
- [ ] Add links to Signup screen
- [ ] Add links to Settings screen
- [ ] Declare data collection in App Store Connect
- [ ] Submit Privacy Policy URL to App Store Connect
- [ ] Submit Terms URL to App Store Connect

---

## 📞 Support

If you have questions about these legal documents:
- Email: legal@adon.app
- Data Protection Officer: privacy@adon.app

---

## 📚 Additional Resources

- [GDPR Official Text](https://gdpr-info.eu/)
- [Hungarian NAIH (Data Protection Authority)](https://naih.hu)
- [Apple App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)

---

**Generated:** February 16, 2025
**Template Version:** 1.0
**Compliance:** GDPR (EU 2016/679), Hungarian Act CXII of 2011

© 2025 ADON. All rights reserved.
