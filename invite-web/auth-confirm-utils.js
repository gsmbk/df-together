(function exposeAuthConfirmUtils(root, factory) {
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.DFTogetherAuthConfirm = api;
  }
})(typeof globalThis === 'undefined' ? undefined : globalThis, function createAuthConfirmUtils() {
  const CONFIRMATION_PREFIX = '#confirmation_url=';
  const EXPECTED_ORIGIN = 'https://kuuwbxtsxbnwgejnwxww.supabase.co';
  const EXPECTED_PATH = '/auth/v1/verify';
  const EXPECTED_REDIRECT = 'https://df-together.com/auth/callback';
  const ALLOWED_TYPES = new Set(['email', 'magiclink', 'signup']);

  function extractConfirmationUrl(hash) {
    if (typeof hash !== 'string' || !hash.startsWith(CONFIRMATION_PREFIX)) {
      return null;
    }

    const rawUrl = hash.slice(CONFIRMATION_PREFIX.length);
    return rawUrl || null;
  }

  function validatedConfirmationUrl(rawUrl) {
    if (!rawUrl) {
      return null;
    }

    let candidate;
    try {
      candidate = new URL(rawUrl);
    } catch {
      try {
        candidate = new URL(decodeURIComponent(rawUrl));
      } catch {
        return null;
      }
    }

    const type = candidate.searchParams.get('type');
    const token = candidate.searchParams.get('token');
    const redirectTo = candidate.searchParams.get('redirect_to');
    const allowedParameters = new Set(['redirect_to', 'token', 'type']);
    const hasOnlyExpectedParameters = [...candidate.searchParams.keys()].every((key) =>
      allowedParameters.has(key),
    );
    const hasOneOfEachParameter = ['redirect_to', 'token', 'type'].every(
      (key) => candidate.searchParams.getAll(key).length === 1,
    );
    const isExpectedDestination =
      candidate.origin === EXPECTED_ORIGIN &&
      candidate.pathname === EXPECTED_PATH &&
      candidate.username === '' &&
      candidate.password === '' &&
      candidate.hash === '';

    if (
      !isExpectedDestination ||
      !type ||
      !ALLOWED_TYPES.has(type) ||
      !token ||
      !hasOnlyExpectedParameters ||
      !hasOneOfEachParameter ||
      redirectTo !== EXPECTED_REDIRECT
    ) {
      return null;
    }

    return candidate.toString();
  }

  return {
    extractConfirmationUrl,
    validatedConfirmationUrl,
  };
});
