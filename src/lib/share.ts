import { Share } from 'react-native';
import { shortDay, timeRange } from '../data/catalog';
import type { DreamforceSession, SessionTime } from '../types';

function webOrigin() {
  const configured = process.env.EXPO_PUBLIC_APP_SHARE_URL?.trim();
  if (configured?.startsWith('https://')) {
    try {
      return new URL(configured).origin;
    } catch {
      // fall through to default
    }
  }
  return 'https://df-together.com';
}

/** Public link that opens the session in the app (or the web bridge). */
export function sessionShareUrl(sessionId: string) {
  return `${webOrigin()}/s/${encodeURIComponent(sessionId)}`;
}

export async function shareSession(session: DreamforceSession, time?: SessionTime) {
  const when = time ? ` on ${shortDay(time.dateLabel)} at ${timeRange(time)}` : '';
  const url = sessionShareUrl(session.id);
  await Share.share(
    {
      title: session.title,
      message: `${session.title}${when} at Dreamforce 2026. Want to go together? ${url}`,
      url,
    },
    { subject: session.title },
  );
}
