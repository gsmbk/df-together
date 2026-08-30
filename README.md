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

Browsing and local agenda planning work before Supabase is configured.

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

## 5. Optional Vercel friend-invite bridge

Custom app links are not always clickable in chat apps. [`invite-web`](./invite-web) is a static landing page that turns a normal HTTPS link into an **Open DF Together** button. The official bridge is live at [invite-fr9xp2jkx-gsmbk.vercel.app/invite](https://invite-fr9xp2jkx-gsmbk.vercel.app/invite).

1. Put the TestFlight public URL in `invite-web/config.js`.
2. Deploy that folder to Vercel:

   ```bash
   npx vercel invite-web
   ```

3. Set this in the app’s `.env`, using the assigned Vercel domain:

   ```dotenv
   EXPO_PUBLIC_APP_SHARE_URL=https://YOUR_DOMAIN.vercel.app/invite
   ```

Rebuild the app after changing a public Expo environment variable. Friend shares will then use `https://YOUR_DOMAIN.vercel.app/invite?invite=...`; otherwise they use the native `dftogether://invite/...` link directly.

## Verification

```bash
npm run check
npx expo export --platform ios
```

The catalog validator checks counts, unique IDs, required fields, timestamps, source attribution, and the planning-only disclaimer.

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
