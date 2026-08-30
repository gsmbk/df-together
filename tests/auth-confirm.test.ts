import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const {
  extractConfirmationUrl,
  validatedConfirmationUrl,
} = require('../invite-web/auth-confirm-utils.js') as {
  extractConfirmationUrl: (hash: string) => string | null;
  validatedConfirmationUrl: (url: string | null) => string | null;
};

const validConfirmationUrl =
  'https://kuuwbxtsxbnwgejnwxww.supabase.co/auth/v1/verify?token=test-token&type=magiclink&redirect_to=https://df-together.com/auth/callback';

test('extracts the nested confirmation URL from a fragment', () => {
  assert.equal(
    extractConfirmationUrl(`#confirmation_url=${validConfirmationUrl}`),
    validConfirmationUrl,
  );
  assert.equal(extractConfirmationUrl('?confirmation_url=not-a-fragment'), null);
  assert.equal(extractConfirmationUrl('#unrelated=value'), null);
});

test('accepts only the expected Supabase verification destination', () => {
  assert.equal(validatedConfirmationUrl(validConfirmationUrl), validConfirmationUrl);
  assert.equal(
    validatedConfirmationUrl(encodeURIComponent(validConfirmationUrl)),
    validConfirmationUrl,
  );
  assert.equal(
    validatedConfirmationUrl(validConfirmationUrl.replace('https://', 'http://')),
    null,
  );
  assert.equal(
    validatedConfirmationUrl(validConfirmationUrl.replace('kuuwbxtsxbnwgejnwxww.supabase.co', 'example.com')),
    null,
  );
  assert.equal(
    validatedConfirmationUrl(validConfirmationUrl.replace('/auth/v1/verify', '/auth/v1/logout')),
    null,
  );
  assert.equal(
    validatedConfirmationUrl(validConfirmationUrl.replace('.supabase.co/', '.supabase.co:444/')),
    null,
  );
});

test('rejects missing tokens, unsupported types, and unsafe redirects', () => {
  assert.equal(
    validatedConfirmationUrl(validConfirmationUrl.replace('token=test-token&', '')),
    null,
  );
  assert.equal(
    validatedConfirmationUrl(validConfirmationUrl.replace('type=magiclink', 'type=recovery')),
    null,
  );
  assert.equal(
    validatedConfirmationUrl(validConfirmationUrl.replace('df-together.com', 'lookalike.example')),
    null,
  );
  assert.equal(validatedConfirmationUrl(`${validConfirmationUrl}&token=second-token`), null);
  assert.equal(validatedConfirmationUrl(`${validConfirmationUrl}&unexpected=value`), null);
});
