# DF Together

An independent iOS-first Dreamforce 2026 planning app built with Expo, React Native, Supabase, and a small optional Vercel invite page.

The bundled catalog currently contains **1,377 sessions and 1,771 scheduled occurrences** imported from the [official Dreamforce 2026 catalog](https://reg.salesforce.com/flow/plus/df26/sessioncatalog/page/catalog) on August 30, 2026 (Pacific time).

> DF Together is a planning companion. Adding a session here does **not** reserve a seat or update the official Salesforce/Dreamforce agenda. The app is independent and is not affiliated with or endorsed by Salesforce.

## MVP features

- Complete local session catalog that works without an account or network connection
- Search plus format, product, role, industry, topic, level, location, day, equipment, community-speaker, and viewing-option filters
- Local agenda with multiple-occurrence selection and overlap warnings
- Supabase passwordless email magic-link sign-in
- Offline-first agenda sync after sign-in
- Mutual friend requests by email or one-time invite link
- Agenda privacy off by default, with sharing limited to accepted friends
- Friend agenda view highlighting sessions both people selected
- Planning-only notice in the agenda, profile, sign-in, session detail, and invite page

## 1. Run the app locally

Requirements: Node.js 22+, npm, Xcode for an iOS simulator, and a Supabase project for social features.

```bash
npm install
cp .env.example .env
npm start
```

Browsing and local agenda planning work before Supabase is configured. Expo Go is
enough for that local-only flow; use a development, preview, or TestFlight build
when testing magic links because authentication needs the stable `dftogether://`
callback scheme.

## 2. Configure Supabase

1. Create a Supabase project, install the Supabase CLI, and link the checkout to it.
2. Apply every tracked migration and Auth setting:

   ```bash
   supabase db push --linked
   supabase config push
   ```

   The migrations create profiles, private email lookup, friendships, one-time invites, agenda items, row-level security policies, the auth-user profile trigger, and non-public privileged RPC implementations.
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

The importer is intentionally manual for this MVP; the app never modifies the official catalog or an attendee’s Salesforce agenda.

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

Custom app links are not always clickable in chat apps. [`invite-web`](./invite-web) is the static Vercel site at [df-together.com](https://df-together.com). It provides the public landing page, friend-invite bridge, magic-link handoff, privacy notice, and support page:

- `https://df-together.com/invite?invite=...`
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

Rebuild the app after changing a public Expo environment variable. Friend shares then use `https://df-together.com/invite?invite=...`; the authenticated web callback securely hands the magic-link result into the native app. The native `dftogether://` scheme remains available as a fallback.

The iOS associated-domain entitlement is already configured for `df-together.com`. Before making HTTPS links open the app directly, add the Apple Team ID to `invite-web/.well-known/apple-app-site-association`, deploy it, and rebuild the iOS app.

## Verification

```bash
npm run check
npx expo export --platform ios
```

The check command runs strict TypeScript validation, behavior tests for agenda
sync, deep links, search, filters, and overlap detection, then validates catalog
counts, unique IDs, required fields, timestamps, source attribution, and the
planning-only disclaimer.

## Contributing

Contributions are welcome. Start with [`CONTRIBUTING.md`](./CONTRIBUTING.md), use an issue to discuss substantial changes, and open a focused pull request against `main`. Privacy-sensitive social changes should explain their row-level security and sharing impact.

## Project map

- [`App.tsx`](./App.tsx) — navigation and app providers
- [`src/data/sessions.json`](./src/data/sessions.json) — bundled offline catalog
- [`scripts/import-dreamforce.mjs`](./scripts/import-dreamforce.mjs) — repeatable catalog importer
- [`src/contexts/AgendaContext.tsx`](./src/contexts/AgendaContext.tsx) — account-isolated offline agenda and Supabase sync
- [`src/contexts/AuthContext.tsx`](./src/contexts/AuthContext.tsx) — magic-link and invite deep links
- [`src/lib/social.ts`](./src/lib/social.ts) — friend and agenda-sharing operations
- [`supabase/migrations`](./supabase/migrations) — schema, RPCs, and row-level security
- [`eas.json`](./eas.json) — development, internal-preview, and TestFlight build profiles
