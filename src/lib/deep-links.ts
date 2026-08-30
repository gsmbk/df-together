export function authParams(url: string) {
  try {
    const parsed = new URL(url);
    const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ''));

    return {
      accessToken:
        parsed.searchParams.get('access_token') ?? hashParams.get('access_token'),
      refreshToken:
        parsed.searchParams.get('refresh_token') ?? hashParams.get('refresh_token'),
      code: parsed.searchParams.get('code'),
    };
  } catch {
    return { accessToken: null, refreshToken: null, code: null };
  }
}

export function isAuthCallbackUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol.toLowerCase() !== 'dftogether:') return false;
    const segments = parsed.pathname.split('/').filter(Boolean);
    return (
      (parsed.hostname.toLowerCase() === 'auth' && segments[0] === 'callback') ||
      (segments.at(-2)?.toLowerCase() === 'auth' &&
        segments.at(-1)?.toLowerCase() === 'callback')
    );
  } catch {
    return false;
  }
}

export function inviteCodeFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    const queryCode = parsed.searchParams.get('invite');
    if (queryCode) return queryCode;

    const segments = parsed.pathname
      .split('/')
      .filter(Boolean)
      .map((segment) => decodeURIComponent(segment));

    if (parsed.hostname.toLowerCase() === 'invite') {
      return segments[0] ?? null;
    }

    const inviteIndex = segments.findIndex(
      (segment) => segment.toLowerCase() === 'invite',
    );
    return inviteIndex >= 0 ? (segments[inviteIndex + 1] ?? null) : null;
  } catch {
    return null;
  }
}
