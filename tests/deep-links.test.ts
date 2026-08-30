import assert from 'node:assert/strict';
import test from 'node:test';
import {
  authParams,
  inviteCodeFromUrl,
  isAuthCallbackUrl,
} from '../src/lib/deep-links';

test('reads invite codes from the HTTPS bridge', () => {
  assert.equal(
    inviteCodeFromUrl('https://invite-web-gsmbk.vercel.app/invite?invite=abc123'),
    'abc123',
  );
});

test('reads invite codes from the native app scheme', () => {
  assert.equal(inviteCodeFromUrl('dftogether://invite/abc%20123'), 'abc 123');
  assert.equal(inviteCodeFromUrl('dftogether:///invite/xyz789'), 'xyz789');
});

test('rejects unrelated and malformed links', () => {
  assert.equal(inviteCodeFromUrl('dftogether://auth/callback?code=123'), null);
  assert.equal(inviteCodeFromUrl('not a url'), null);
});

test('reads Supabase PKCE and token callback parameters', () => {
  assert.equal(isAuthCallbackUrl('dftogether://auth/callback?code=pkce-code'), true);
  assert.equal(isAuthCallbackUrl('dftogether:///auth/callback?code=pkce-code'), true);
  assert.equal(isAuthCallbackUrl('https://example.com/auth/callback?code=bad'), false);
  assert.equal(
    isAuthCallbackUrl(
      'https://df-together.com/auth/callback?code=web-code',
      'https://df-together.com/auth/callback',
    ),
    true,
  );
  assert.equal(
    isAuthCallbackUrl(
      'https://lookalike.example/auth/callback?code=bad',
      'https://df-together.com/auth/callback',
    ),
    false,
  );
  assert.deepEqual(authParams('dftogether://auth/callback?code=pkce-code'), {
    accessToken: null,
    refreshToken: null,
    code: 'pkce-code',
  });
  assert.deepEqual(
    authParams(
      'dftogether://auth/callback#access_token=access&refresh_token=refresh',
    ),
    {
      accessToken: 'access',
      refreshToken: 'refresh',
      code: null,
    },
  );
  assert.deepEqual(authParams('not a url'), {
    accessToken: null,
    refreshToken: null,
    code: null,
  });
});
