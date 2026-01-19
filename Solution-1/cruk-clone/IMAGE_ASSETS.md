# Image Assets Documentation

This document lists all images downloaded from the Cancer Research UK website and stored locally in the `public/images/` folder.

## All Images Downloaded

### Logo
**File:** `public/images/logo.svg`
**Original URL:** `https://www.cancerresearchuk.org/sites/all/themes/custom/cruk_integrated_campaign/logo.svg`
**Size:** 7.6KB
**Format:** SVG
**Usage:** Header component, height: 50px

### Hero Section Cards

#### 1. Stand Up To Cancer Screening Checker
**File:** `public/images/screening-checker.jpg`
**Original URL:** `https://www.cancerresearchuk.org/sites/default/files/styles/cruk_no_style/public/screening_checker_su2c.jpg`
**Size:** 38KB
**Format:** JPG
**Dimensions:** 250px height, full width

#### 2. About Cancer
**File:** `public/images/about-cancer.png`
**Original URL:** `https://www.cancerresearchuk.org/sites/default/files/styles/cruk_no_style/public/image.about-cancer.png`
**Size:** 186KB
**Format:** PNG
**Dimensions:** 250px height, full width

#### 3. Cancer Chat
**File:** `public/images/cancer-chat.png`
**Original URL:** `https://www.cancerresearchuk.org/sites/default/files/styles/cruk_no_style/public/image.cancer-chat_1.png`
**Size:** 178KB
**Format:** PNG
**Dimensions:** 250px height, full width

### Banner Section

**File:** `public/images/get-involved.png`
**Original URL:** `https://www.cancerresearchuk.org/sites/default/files/styles/cruk_no_style/public/image_9_1.png`
**Size:** 263KB
**Format:** PNG
**Overlay:** Linear gradient (rgba(46, 0, 139, 0.85), rgba(236, 0, 140, 0.85))
**Usage:** Full-width background for "Get involved" section

### Events Section Cards

#### 1. Big Hike 2026
**File:** `public/images/big-hike.png`
**Original URL:** `https://www.cancerresearchuk.org/sites/default/files/styles/cruk_no_style/public/big_hike_hp_hero.png`
**Size:** 373KB
**Format:** PNG
**Dimensions:** 250px height, full width

#### 2. Race for Life 2026
**File:** `public/images/race-for-life.png`
**Original URL:** `https://www.cancerresearchuk.org/sites/default/files/styles/cruk_no_style/public/race_for_life_runners_2026.png`
**Size:** 428KB
**Format:** PNG
**Dimensions:** 250px height, full width

### Social Media Icons

All social icons are stored locally and displayed in the footer.

#### Facebook
**File:** `public/images/facebook.svg`
**Original URL:** `https://www.cancerresearchuk.org/sites/all/themes/custom/cruk/images/social_icons/facebook_icon.svg`
**Size:** 320 bytes
**Link:** https://www.facebook.com/cancerresearchuk

#### Twitter
**File:** `public/images/twitter.svg`
**Original URL:** `https://www.cancerresearchuk.org/sites/all/themes/custom/cruk/images/social_icons/twitter_icon.svg`
**Size:** 776 bytes
**Link:** https://twitter.com/CR_UK

#### Instagram
**File:** `public/images/instagram.svg`
**Original URL:** `https://www.cancerresearchuk.org/sites/all/themes/custom/cruk/images/social_icons/instagram_icon.svg`
**Size:** 1.7KB
**Link:** https://www.instagram.com/cr_uk

#### YouTube
**File:** `public/images/youtube.svg`
**Original URL:** `https://www.cancerresearchuk.org/sites/all/themes/custom/cruk/images/social_icons/youtube_icon.svg`
**Size:** 627 bytes
**Link:** https://www.youtube.com/user/cancerresearchuk

## Image Usage in Components

### Header.tsx
```tsx
<img src="/images/logo.svg" alt="Cancer Research UK" />
```

### App.tsx - Hero Cards
```tsx
<HeroCard imageUrl="/images/screening-checker.jpg" />
<HeroCard imageUrl="/images/about-cancer.png" />
<HeroCard imageUrl="/images/cancer-chat.png" />
```

### App.css - Banner Background
```css
background: linear-gradient(...), url('/images/get-involved.png') center/cover;
```

### App.tsx - Event Cards
```tsx
<HeroCard imageUrl="/images/big-hike.png" />
<HeroCard imageUrl="/images/race-for-life.png" />
```

### Footer.tsx - Social Icons
```tsx
<img src="/images/facebook.svg" alt="Facebook" />
<img src="/images/twitter.svg" alt="Twitter" />
<img src="/images/instagram.svg" alt="Instagram" />
<img src="/images/youtube.svg" alt="YouTube" />
```

## Total Storage

Total size of all images: ~2.0MB

## Responsive Behavior

All card images use:
- `object-fit: cover` - Maintains aspect ratio while filling container
- `width: 100%` - Responsive to container width
- `height: 250px` - Fixed height for consistency

## Accessibility

All images include:
- Descriptive `alt` attributes
- Proper semantic HTML structure
- ARIA labels where appropriate (social icons)
