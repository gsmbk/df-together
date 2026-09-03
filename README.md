# DF Together

An independent iOS-first Dreamforce 2026 planning app built with Expo, React Native, Supabase, and a small static Vercel site.

The bundled catalog currently contains **1,377 sessions and 1,771 scheduled occurrences** imported from the [official Dreamforce 2026 catalog](https://reg.salesforce.com/flow/plus/df26/sessioncatalog/page/catalog) on August 30, 2026 (Pacific time).

> DF Together is a planning companion. Adding a session here does **not** reserve a seat or update the official Salesforce/Dreamforce agenda. The app is independent and is not affiliated with or endorsed by Salesforce.

## Features

**Plan**

- Complete local session catalog that works without an account or network connection
- Native search in the navigation bar, a day picker, and a filter sheet for format, product, role, industry, topic, level, location, viewing option, community speaker, and required equipment
- “For you” view driven by the products and roles you pick during onboarding or in Profile
- Agenda grouped by day with swipe-to-remove, overlap detection, and an overlap resolver that suggests other times for either session
- Walking-time warnings when consecutive sessions are in different buildings
- Live event mode during Sep 14–17: what is happening now, what is next, and how far the walk is
- Add a session, or the whole agenda, to the iOS Calendar; optional local reminders 10, 15, or 30 minutes before each session
- Personal notes and a 1–5 rating per session, synced to your account when signed in
- Share any session as a link (`df-together.com/s/<id>`) that opens in the app
- Opt-in comparison against the official Dreamforce agenda (see below)

**Together**

- Password-free email sign-in link
- Offline-first agenda sync after sign-in
- Mutual friend requests by email or one-time invite link, and the ability to remove a friend
- Agenda privacy off by default, with sharing limited to accepted friends
- Friend agenda view highlighting sessions you both chose, sessions you chose at a different time, and gaps when you are both free
- “Friends going” on every session, in Browse and on the session page

**Official agenda**

DF Together cannot book or cancel anything on the official Dreamforce agenda. Adding a session there goes through Salesforce's own Trailblazer ID login with a first-party OAuth client, and RainFocus grants API access to the event host rather than to attendees or third-party apps. There is no attendee-facing API to write to.

What the app can do is read one direction. The official Salesforce Events app can write a built agenda into the phone's calendar under **More → Sync to my calendar**. If someone has done that, Profile → Official agenda matches those entries back to the bundled catalog and reports the differences: reserved but not planned here, planned here but not reserved, and times that disagree.

That comparison is opt-in and read-only. It reads only the Dreamforce dates, keeps only entries that match a catalog session, discards everything else, and never sends calendar contents anywhere. Events this app wrote itself are excluded so they cannot be mistaken for official reservations. It is a snapshot, so re-syncing from the Events app and checking again is needed after the official agenda changes.

**Design**

- Follows Apple's Human Interface Guidelines: semantic colors, Dynamic Type, inset grouped lists, native large titles, SF Symbols, native tabs (Liquid Glass on iOS 26), form sheets, and system action sheets
- Dark Mode and accessibility settings come from the system palette; see [`BRAND.md`](./BRAND.md)

## 1. Run the app locally

Requirements: Node.js 22+, npm, Xcode 26 with an iOS simulator, CocoaPods (Expo installs it via Homebrew if missing), and a Supabase project for social features.

```bash
npm install
cp .env.example .env
npx expo run:ios
```

The app uses native modules (native tabs, calendar, notifications), so it needs a development build rather than Expo Go. The first `npx expo run:ios` creates the `ios` folder, installs pods, builds, and starts Metro. If a physical iPhone is paired, pass a simulator explicitly, for example `npx expo run:ios --device "iPhone 17 Pro"`.

Browsing and local agenda planning work before Supabase is configured.

## 2. Configure Supabase

1. Create a Supabase project, install the Supabase CLI, and link the checkout to it.
2. Apply every tracked migration and Auth setting:

   ```bash
   supabase db push --linked
   supabase config push
   ```

   The migrations create profiles, private email lookup, friendships, one-time invites, agenda items, personal session notes, row-level security policies, the auth-user profile trigger, and non-public privileged RPC implementations. Friend requests to unknown addresses return silently so the app never reveals whether an email has an account.
3. If you use a different app scheme, update `additional_redirect_urls` in [`supabase/config.toml`](./supabase/config.toml). The official build uses:

   ```text
   dftogether://auth/callback
   ```

4. Put your project values in `.env`:

   ```dotenv
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
   ```

Use the client-safe publishable key, never a service-role key. Restart Expo after changing `.env`.

### Production Auth email

First-time confirmations and returning-user magic links are delivered through
Resend using the dedicated `auth.df-together.com` sending subdomain and the
branded templates in [`supabase/templates`](./supabase/templates).
Both templates first open `https://df-together.com/auth/confirm`; loading that
page does not consume the one-time Supabase link. Verification happens only
after the person explicitly taps **Continue securely**, which protects sign-in
links from email security scanners that pre-open URLs.
Verify that domain in Resend with tracking disabled, then make the Resend API
key available only while pushing the Auth configuration:

```bash
read -s RESEND_API_KEY
export RESEND_API_KEY
npx supabase@latest config push --project-ref YOUR_PROJECT_REF
unset RESEND_API_KEY
```

Never commit the key or prefix it with `EXPO_PUBLIC_`. The SMTP configuration
uses `smtp.resend.com` over STARTTLS on port 587 and sends as
`DF Together <no-reply@auth.df-together.com>`.

## 3. Refresh the Dreamforce catalog later

The importer opens the public RainFocus catalog in local Google Chrome, expands every result, and replaces the bundled JSON.

```bash
npm run import:sessions
npm run validate:catalog
```

The importer is intentionally manual for this MVP; the app never modifies the official catalog or an attendee’s Salesforce agenda. Speaker extraction is best-effort and depends on the catalog markup; confirm the selector in `scripts/import-dreamforce.mjs` when speakers appear on the catalog cards.

## 4. Fastest friend distribution: TestFlight

An Apple Developer account and Expo account are required. From this directory:

```bash
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios --profile production
```

In App Store Connect, add the uploaded build to an external TestFlight group, complete the beta details, submit the first external build for Beta App Review, and create a public TestFlight link. Subsequent beta builds are typically easier to distribute through that same link.

For a tiny private device list before TestFlight review, the `preview` EAS profile creates an internal iOS build, but each tester device must be registered:

```bash
npx eas-cli@latest build --platform ios --profile preview
```

## 5. DF Together web experience

Custom app links are not always clickable in chat apps. [`invite-web`](./invite-web) is the static Vercel site at [df-together.com](https://df-together.com). It provides the public landing page, friend-invite bridge, session-share bridge, magic-link handoff, privacy notice, and support page:

- `https://df-together.com/invite?invite=...`
- `https://df-together.com/s/<sessionId>`
- `https://df-together.com/auth/confirm`
- `https://df-together.com/auth/callback`
- `https://df-together.com/privacy`
- `https://df-together.com/support`

Until the iPhone beta is available, the site clearly marks it as coming soon.

1. Put the TestFlight public URL in `invite-web/config.js`.
2. Deploy that folder to Vercel:

   ```bash
   npx vercel invite-web
   ```

3. Set the public web URLs in the app’s `.env`:

   ```dotenv
   EXPO_PUBLIC_APP_SHARE_URL=https://df-together.com/invite
   EXPO_PUBLIC_AUTH_REDIRECT_URL=https://df-together.com/auth/callback
   ```

Rebuild the app after changing a public Expo environment variable. Friend shares then use `https://df-together.com/invite?invite=...`, session shares use `https://df-together.com/s/<id>`, and the authenticated web callback securely hands the magic-link result into the native app. The native `dftogether://` scheme remains available as a fallback.

The iOS associated-domain entitlement is already configured for `df-together.com`. Before making HTTPS links open the app directly, add the Apple Team ID to `invite-web/.well-known/apple-app-site-association`, deploy it, and rebuild the iOS app.

## Verification

```bash
npm run check
```

The check command runs strict TypeScript validation, behavior tests for agenda
sync, deep links, search, filters, overlap detection, venue walking estimates,
live-mode snapshots, and shared free time, then validates catalog counts,
unique IDs, required fields, timestamps, source attribution, and the
planning-only disclaimer.

## Contributing

Contributions are welcome. Start with [`CONTRIBUTING.md`](./CONTRIBUTING.md) and the [`design guide`](./BRAND.md), use an issue to discuss substantial changes, and open a focused pull request against `main`. Privacy-sensitive social changes should explain their row-level security and sharing impact.

## Project map

- [`App.tsx`](./App.tsx) — navigation (native tabs, per-tab stacks, sheets), providers, deep links
- [`BRAND.md`](./BRAND.md) — design system, palette rules, and independence boundaries
- [`src/theme.ts`](./src/theme.ts) — semantic colors, Dynamic Type ramp, spacing, radii
- [`src/components`](./src/components) — grouped-list primitives, SF Symbol icons, session rows, live card
- [`src/data/catalog.ts`](./src/data/catalog.ts) — precomputed search index, day options, helpers
- [`src/data/venues.ts`](./src/data/venues.ts) — building detection and walking estimates
- [`src/data/sessions.json`](./src/data/sessions.json) — bundled offline catalog
- [`src/contexts/AgendaContext.tsx`](./src/contexts/AgendaContext.tsx) — account-isolated offline agenda and Supabase sync, split into state and actions contexts
- [`src/contexts/AuthContext.tsx`](./src/contexts/AuthContext.tsx) — magic-link sign-in, invite deep links
- [`src/state`](./src/state) — small persisted stores for preferences, browse filters, friends, and notes
- [`src/lib`](./src/lib) — live mode, free-time finder, calendar export, reminders, sharing, social operations
- [`scripts/import-dreamforce.mjs`](./scripts/import-dreamforce.mjs) — repeatable catalog importer
- [`supabase/migrations`](./supabase/migrations) — schema, RPCs, and row-level security
- [`eas.json`](./eas.json) — development, internal-preview, and TestFlight build profiles
