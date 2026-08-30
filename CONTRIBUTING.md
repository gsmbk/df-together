# Contributing to DF Together

Thanks for helping make Dreamforce planning more social and useful.

## Before you start

- Check existing issues and pull requests before opening a duplicate.
- Use an issue to discuss substantial product or architecture changes first.
- Never commit Supabase service-role keys, Apple credentials, `.env` files, or attendee data.
- Remember that DF Together is an independent planning companion; it must not imply that a local selection reserves a seat or updates Salesforce.

## Local setup

```bash
npm install
cp .env.example .env
npm start
```

The catalog and local agenda work without Supabase. Social features require a personal Supabase development project and the migration in `supabase/migrations`.

## Making changes

1. Create a focused branch from `main`.
2. Keep session data changes reproducible. Do not hand-edit `src/data/sessions.json`; run `npm run import:sessions` instead.
3. Add or update validation when behavior changes.
4. Run the project checks:

   ```bash
   npm run check
   npx expo-doctor
   ```

5. Open a pull request explaining the user problem, the solution, and how you tested it.

Small, focused pull requests are easiest to review. Screenshots or recordings are especially helpful for interface changes.

## Privacy and security

Agenda sharing must remain private by default. Changes to authentication, friendships, invitations, row-level security, or agenda visibility should include a description of the privacy impact and how access controls were tested.
