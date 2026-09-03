-- Personal session notes and ratings, synced per account and never shared.
create table public.session_notes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  session_id text not null,
  note text not null default '' check (char_length(note) <= 4000),
  rating smallint not null default 0 check (rating between 0 and 5),
  updated_at timestamptz not null default now(),
  primary key (user_id, session_id)
);

create index session_notes_user_idx on public.session_notes (user_id, updated_at);

alter table public.session_notes enable row level security;

create policy "users read their own notes"
on public.session_notes for select to authenticated
using (user_id = (select auth.uid()));

create policy "users write their own notes"
on public.session_notes for insert to authenticated
with check (user_id = (select auth.uid()));

create policy "users update their own notes"
on public.session_notes for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "users delete their own notes"
on public.session_notes for delete to authenticated
using (user_id = (select auth.uid()));

grant select, insert, update, delete on public.session_notes to authenticated;

-- Friend requests by email must not reveal whether an address has an account.
-- Unknown addresses now return null instead of raising, and the app shows the
-- same neutral confirmation either way.
create or replace function private.send_friend_request(friend_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  friend uuid;
  existing public.friendships%rowtype;
begin
  if me is null then
    raise exception 'Sign in before sending a friend request.';
  end if;

  select pe.user_id into friend
  from public.profile_emails pe
  where pe.email = lower(trim(friend_email));

  if friend is null or friend = me then
    return null;
  end if;

  select f.* into existing
  from public.friendships f
  where least(f.requester_id, f.addressee_id) = least(me, friend)
    and greatest(f.requester_id, f.addressee_id) = greatest(me, friend)
  for update;

  if found then
    if existing.status = 'pending' and existing.requester_id = friend then
      update public.friendships
      set status = 'accepted', responded_at = now()
      where id = existing.id;
    elsif existing.status = 'rejected' then
      update public.friendships
      set requester_id = me,
          addressee_id = friend,
          status = 'pending',
          created_at = now(),
          responded_at = null
      where id = existing.id;
    end if;
    return existing.id;
  end if;

  insert into public.friendships (requester_id, addressee_id)
  values (me, friend)
  returning id into existing.id;
  return existing.id;
end;
$$;

revoke all on function private.send_friend_request(text) from public, anon, authenticated;
grant execute on function private.send_friend_request(text) to authenticated;
