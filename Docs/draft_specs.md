# Project Beacon — Supporter Profile, Onboarding, and Donation Impact Tracking (README Requirements)

This README describes requirements for building three connected features for Cancer Research UK (CRUK):

1) **Supporter Profile (CRUK Account Dashboard)**
2) **Personalisation Onboarding Journey**
3) **Donation Impact Tracking (“Where your donation went”)** including **Donation Streaks**

The goal is to create a **trusted, empathetic, audience-centric experience** that can be shipped incrementally now and later integrate with the Engage Transformation Programme.

---

## 0. Product Goals & Principles

### Goals
- Provide a **logged-in supporter profile** that unifies activity across donations, events, fundraising, volunteering, campaigning.
- Collect consented preference signals via onboarding to enable **personalised information and supporter journeys**.
- Increase supporter trust and retention by showing transparent **donation-to-impact** stories (e.g., “Your last £1 funded 5 test tubes”), and enable **donation streaks**.
- Be safe and respectful: **no pushy fundraising**; sensitive health data handled with explicit consent and clear boundaries.

### Design & Content Principles
- CRUK brand-aligned: clean, accessible, non-gamified in tone even if using “points”.
- Empathetic language, especially where cancer information is present.
- “Support, not pressure”: donation prompts should be contextual and optional.

### Constraints
- Hackathon/MVP assumes **synthetic data** (no real patient data).
- Any inferred or actual health-related personalisation requires **appropriate consent** and data controls.

---

## 1. Feature: Cancer Research UK Supporter Profile

### 1.1 Overview
A logged-in desktop-friendly dashboard embedded in the existing CRUK website. It shows a supporter’s:
- identity (name, supporter since),
- engagement summary (donations, events, fundraising),
- “Impact” snapshots,
- optional “Supporter points” (or “CR Score”) for motivation and progress.

### 1.2 User Stories
- As a supporter, I want to see all my CRUK engagement in one place so I feel recognised and can continue my journey.
- As a supporter, I want to view badges/milestones for actions I’ve taken (donations, events, fundraising).
- As a supporter, I want quick links to next actions that match my interests (donate, join an event, volunteer).
- As CRUK, we want to recognise supporters and offer relevant next steps without requiring full transformation completion.

### 1.3 UI Requirements (Desktop)
- Navigation entry: “My Dashboard” visible when logged in.
- Dashboard layout:
  - **Left/main column:** profile header + activity feed + challenges/opportunities
  - **Right column:** quick actions (donate, event signup, volunteer), impact tiles, preferences shortcut
- Components:
  - Profile card: avatar, name, “Supporter since”, level/progress (optional)
  - Summary tiles: donations count, events attended, fundraising total, volunteering hours
  - Activity feed: chronological list with points/impact snippets
  - “Your Impact” widget (links to Donation Impact Tracking section)
  - “Your Interests” widget (links to Preferences)

### 1.4 Data Model (MVP)
`UserProfile`
- user_id (string)
- display_name
- supporter_since_date
- location (optional)
- preferences (see onboarding)
- engagement_summary:
  - donations_total_amount
  - donations_count
  - events_attended_count
  - fundraising_total_amount
  - volunteering_hours (optional)
- points_balance (optional)
- level (optional)

`Activity`
- activity_id
- user_id
- type: donation | event | fundraiser | volunteer | campaign
- timestamp
- title
- metadata (amount, event name, etc.)
- points_awarded (optional)

### 1.5 Non-Functional
- WCAG accessibility, keyboard navigation
- Fast load, server-render or cached data where possible
- Privacy by design: only display data user has consented to store

---

## 2. Feature: Personalisation Onboarding Journey

### 2.1 Overview
An onboarding flow triggered after:
- account creation/login, OR
- first donation/event sign-up, OR
- “Personalise my experience” CTA

Collects minimal information needed to tailor content and journeys while respecting consent.

### 2.2 User Stories
- As a user, I want to choose what I’m interested in so I receive relevant CRUK information.
- As a user, I want to control what personalisation data I share and change it anytime.
- As CRUK, we want preference signals to personalise without requiring complete data integration.

### 2.3 Flow Requirements (Recommended 3–5 steps)
**Step 1 — About you (lightweight)**
- What best describes you? (choose one, optional)
  - “I’m looking for cancer information”
  - “I’m supporting someone”
  - “I’m a supporter/fundraiser”
  - “I’m a researcher/health professional”
- Location (postcode/city; optional) to recommend local events/shops/support.

**Step 2 — Topics / cancer types of interest**
- Multi-select cancer types (with search)
- Also include topic interests:
  - prevention, symptoms, diagnosis, treatment, side effects, living with cancer, research news

**Step 3 — Communication preferences**
- Email updates: on/off
- Frequency: monthly / quarterly
- Content type: research updates / local events / fundraising opportunities
- Accessibility: large text, easy-read, audio summaries (optional)

**Step 4 — Consent & control (explicit)**
- Clear statement: what data is used for personalisation
- Opt-in toggles for any sensitive inference (e.g., using diagnosis/treatment stage)
- Link to “Manage preferences” anytime

**Step 5 — Confirmation / Preview**
- Show a preview: “Here’s what we’ll personalise for you”
- CTA: “Go to my Dashboard”

### 2.4 UI Requirements
- Progress indicator (Step 1 of N)
- “Skip for now” on every step
- Inline microcopy reassuring user control
- Links to privacy policy and preference management

### 2.5 Data Model
`Preferences`
- user_id
- persona_type (enum)
- cancer_types (array)
- topic_interests (array)
- location (string, optional)
- accessibility_preferences (array)
- comms_opt_in (boolean)
- comms_frequency (enum)
- consent_flags:
  - allow_special_category_processing (boolean)
  - allow_inferred_data (boolean)
- last_updated

### 2.6 Non-Functional
- Consent logging (timestamped)
- Versioning of consent text (audit)
- GDPR-compliant “export my data” and “delete my data” considerations (post-MVP)

---

## 3. Feature: Donation Impact Tracking (“Where your donation went”)

### 3.1 Overview
A section in the profile and/or donation confirmation page that shows:
- **Personal donation history**
- **Impact stories / allocations** (at an appropriate level of accuracy)
- **Donation streaks** (monthly streaks)
- “You funded X” examples (e.g., “Your last £1 bought 5 test tubes”)

**Important:** If exact allocation is not possible, use **honest framing**:
- “Your donation helped fund research like…”
- “Examples of what donations help make possible…”

### 3.2 User Stories
- As a supporter, I want to see tangible outcomes from my donations so I feel connected and motivated to continue.
- As a supporter, I want to track my donation streak so I can maintain consistent giving.
- As CRUK, we want to increase retention and lifetime value by showing impact transparently and respectfully.

### 3.3 UI Requirements (Desktop)
Entry points:
- From profile: “Your Impact” card → “See your donation stories”
- From donation confirmation: “See what your gift helps fund”

Components:
- “Your last donation” impact line:
  - “Your last £X helped fund…”
- Impact tiles:
  - “Lab supplies”, “Early detection tools”, “Clinical trial support”, “Data analysis”
- Donation streak widget:
  - Current streak length: e.g., “3-month donation streak”
  - Streak calendar or simple month chips
  - CTA: “Keep my streak going” (soft prompt)

Optional:
- “Choose what impact stories you want to see” based on cancer interests

### 3.4 Data & Logic Requirements
**Donation Streak**
- Define streak rule: consecutive months with at least one donation.
- Store:
  - streak_current_months
  - streak_last_donation_date
  - streak_break_date (if broken)
- Update on successful donation

**Impact Mapping**
Two approaches:
1) **Rule-based mapping (MVP)**
   - Donation amount bucket → example impact items
   - Example:
     - £1–£5 → “lab consumables”
     - £10–£25 → “sample processing”
     - £50+ → “research hours” (careful with claims)
2) **Allocation-based mapping (later)**
   - If finance/project allocation data becomes available via transformation, map donation to fund categories.

Data Objects:
`Donation`
- donation_id
- user_id
- amount
- date
- source (direct debit / one-off / event sponsorship)
- campaign_id (optional)

`ImpactStory`
- story_id
- category (lab, trials, early detection, prevention)
- title
- description
- evidence_links (CRUK pages)
- tags (cancer types, topics)
- confidence_level (exact | representative | example)

`DonationImpactLink`
- donation_id
- story_id
- mapping_type (representative | allocated)
- created_at

### 3.5 Content Requirements
- Strictly avoid misleading “your £1 directly purchased X” unless CRUK approves the claim model.
- Prefer:
  - “could help pay for…”
  - “helps fund research such as…”
- Provide links to CRUK research pages and impact reports.

### 3.6 Non-Functional
- Transparency: clear explanation of how mapping works
- Avoid manipulative nudges; streak messaging should be gentle

---

## 4. Personalisation Rules (MVP)

Use onboarding signals + behaviour to suggest content:
- If user selects cancer types → show related information resources + relevant impact stories
- If user attends events → recommend local upcoming events + fundraising tools
- If user donates monthly → show streak progress + optional upgrade paths (increase amount, fundraise)

All recommendations must be:
- explainable (“Because you said you’re interested in…”)
- optional
- reversible via preferences

---

## 5. Integration Points (High-Level)

### 5.1 Existing CRUK Website Integration
- Add new authenticated routes/pages:
  - `/my/dashboard`
  - `/my/preferences`
  - `/my/impact`
- Embed widgets on existing pages (e.g., donate page) for logged-in users:
  - Profile summary
  - Interest picker CTA
  - Impact preview

### 5.2 Data Sources
MVP uses synthetic or existing supporter records if allowed.
Future integrates with Engage transformation systems for:
- unified supporter profiles
- event attendance
- donation history
- consent management

---

## 6. Success Metrics (for MVP)

- Onboarding completion rate
- Preference selection rate (cancer types, topics)
- Repeat donation rate / monthly retention
- Donation streak retention
- Engagement lift: clicks to “impact stories”, time on impact pages
- Opt-out rate (ensure personalisation isn’t creepy)

---

## 7. Security, Privacy, Compliance

- GDPR compliance:
  - consent capture
  - preference management
  - data deletion and export (future)
- Sensitive health data:
  - do not infer diagnosis/treatment stage without explicit consent
  - treat inferred special category data as restricted

---

## 8. Implementation Roadmap

### Phase 1 (Hackathon Prototype)
- Clickable UI prototype or demo screens
- Synthetic user profile + activity feed
- Basic onboarding flow
- Donation impact screen with representative mapping + streak indicator

### Phase 2 (Pilot-ready)
- Real authentication integration
- Real donation history feed
- Consent logging + preference management
- Analytics dashboard for engagement + content gaps

### Phase 3 (Engage Transformation Integration)
- Unified supporter ID + entity resolution
- Allocation-based impact tracking where feasible
- Expanded personalisation across events, volunteering, campaigning, shop

---

## 9. Open Questions / Assumptions
- Are we allowed to show “points” publicly or should this be framed as “Supporter Score” or “Milestones”?
- What level of donation impact attribution is approved by CRUK (exact vs representative)?
- Which identity provider / login system will be used (existing CRUK auth vs new)?
- What is the preferred consent language and legal basis for personalisation?

---
