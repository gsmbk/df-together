import { supabase } from '../lib/supabase';
import { createStore } from './store';
import type { SessionNote } from '../types';

type NotesState = Record<string, SessionNote>;

export const notesStore = createStore<NotesState>({}, { key: 'df-together.notes.v1' });

export const useNotes = notesStore.use;

export function useNote(sessionId: string): SessionNote | undefined {
  return useNotes()[sessionId];
}

export function saveNote(sessionId: string, patch: Partial<Pick<SessionNote, 'note' | 'rating'>>, userId?: string) {
  const current = notesStore.get()[sessionId];
  const next: SessionNote = {
    sessionId,
    note: patch.note ?? current?.note ?? '',
    rating: patch.rating ?? current?.rating ?? 0,
    updatedAt: new Date().toISOString(),
  };
  notesStore.set((state) => ({ ...state, [sessionId]: next }));
  if (userId) void pushNote(userId, next);
}

async function pushNote(userId: string, note: SessionNote) {
  if (!supabase) return;
  await supabase
    .from('session_notes')
    .upsert({
      user_id: userId,
      session_id: note.sessionId,
      note: note.note,
      rating: note.rating,
      updated_at: note.updatedAt,
    })
    .then(() => undefined, () => undefined);
}

/**
 * Merge notes stored in Supabase with local ones by most recent edit, then
 * push anything local that is newer than the server copy.
 */
export async function syncNotes(userId: string) {
  if (!supabase) return;
  const { data, error } = await supabase
    .from('session_notes')
    .select('session_id,note,rating,updated_at')
    .eq('user_id', userId);
  if (error) throw error;

  const remote = new Map<string, SessionNote>(
    (data ?? []).map((row) => [
      row.session_id as string,
      {
        sessionId: row.session_id as string,
        note: (row.note as string) ?? '',
        rating: (row.rating as number) ?? 0,
        updatedAt: row.updated_at as string,
      },
    ]),
  );

  const local = notesStore.get();
  const merged: NotesState = { ...local };
  const toPush: SessionNote[] = [];
  for (const [sessionId, remoteNote] of remote) {
    const localNote = local[sessionId];
    if (!localNote || localNote.updatedAt < remoteNote.updatedAt) merged[sessionId] = remoteNote;
  }
  for (const localNote of Object.values(local)) {
    const remoteNote = remote.get(localNote.sessionId);
    if (!remoteNote || remoteNote.updatedAt < localNote.updatedAt) toPush.push(localNote);
  }
  notesStore.set(merged);
  await Promise.all(toPush.map((note) => pushNote(userId, note)));
}
