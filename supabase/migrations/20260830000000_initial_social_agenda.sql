create extension if not exists pgcrypto;
create extension if not exists citext;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 60),
  avatar_color text not null default '#0176D3',
  share_agenda_with_friends boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_emails (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  email citext not null unique,
  created_at timestamptz not null default now()
);

create type public.friendship_status as enum ('pending', 'accepted', 'rejected');

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status public.friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint friendships_not_self check (requester_id <> addressee_id)
);

create unique index friendships_unique_pair
  on public.friendships (
    least(requester_id, addressee_id),
    greatest(requester_id, addressee_id)
  );

create index friendships_requester_idx on public.friendships (requester_id, status);
create index friendships_addressee_idx on public.friendships (addressee_id, status);

create table public.friend_invites (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references public.profiles (id) on delete cascade,
  code text not null unique default encode(gen_random_bytes(18), 'hex'),
  expires_at timestamptz not null default (now() + interval '30 days'),
  accepted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.agenda_items (
  user_id uuid not null references public.profiles (id) on delete cascade,
  session_id text not null,
  session_time_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, session_time_id)
);

create index agenda_items_user_idx on public.agenda_items (user_id, created_at);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  generated_name text;
  palette text[] := array['#0176D3', '#7F4FD8', '#2E844A', '#A86403', '#0B5CAB', '#8A3FFC'];
  color_index integer;
begin
  generated_name := initcap(regexp_replace(split_part(coalesce(new.email, 'Dreamforce Friend'), '@', 1), '[._+-]+', ' ', 'g'));
  if char_length(trim(generated_name)) < 2 then
    generated_name := 'Dreamforce Friend';
  end if;
  color_index := (get_byte(decode(md5(new.id::text), 'hex'), 0) % array_length(palette, 1)) + 1;

  insert into public.profiles (id, display_name, avatar_color)
  values (new.id, left(trim(generated_name), 60), palette[color_index]);

  if new.email is not null then
    insert into public.profile_emails (user_id, email)
    values (new.id, lower(new.email));
  end if;
  return new;
end;
$$;

create trigger auth_user_created
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

-- Make the migration safe for a Supabase project that already has auth users.
insert into public.profiles (id, display_name, avatar_color)
select
  u.id,
  case
    when char_length(trim(initcap(regexp_replace(split_part(coalesce(u.email, 'Dreamforce Friend'), '@', 1), '[._+-]+', ' ', 'g')))) < 2
      then 'Dreamforce Friend'
    else left(trim(initcap(regexp_replace(split_part(coalesce(u.email, 'Dreamforce Friend'), '@', 1), '[._+-]+', ' ', 'g'))), 60)
  end,
  '#0176D3'
from auth.users u
on conflict (id) do nothing;

insert into public.profile_emails (user_id, email)
select u.id, lower(u.email)
from auth.users u
where u.email is not null
on conflict do nothing;

create or replace function public.are_friends(first_user uuid, second_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.friendships f
    where f.status = 'accepted'
      and (
        (f.requester_id = first_user and f.addressee_id = second_user)
        or (f.requester_id = second_user and f.addressee_id = first_user)
      )
  );
$$;

create or replace function public.has_active_relationship(first_user uuid, second_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.friendships f
    where f.status in ('pending', 'accepted')
      and (
        (f.requester_id = first_user and f.addressee_id = second_user)
        or (f.requester_id = second_user and f.addressee_id = first_user)
      )
  );
$$;

alter table public.profiles enable row level security;
alter table public.profile_emails enable row level security;
alter table public.friendships enable row level security;
alter table public.friend_invites enable row level security;
alter table public.agenda_items enable row level security;

create policy "profiles visible to self and connections"
on public.profiles for select to authenticated
using (id = auth.uid() or public.has_active_relationship(auth.uid(), id));

create policy "users update their own profile"
on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "users see their own private email"
on public.profile_emails for select to authenticated
using (user_id = auth.uid());

create policy "participants see friendships"
on public.friendships for select to authenticated
using (auth.uid() in (requester_id, addressee_id));

create policy "users send their own requests"
on public.friendships for insert to authenticated
with check (requester_id = auth.uid() and requester_id <> addressee_id);

create policy "addressee responds to pending request"
on public.friendships for update to authenticated
using (addressee_id = auth.uid() and status = 'pending')
with check (addressee_id = auth.uid() and status in ('accepted', 'rejected'));

create policy "participants remove friendships"
on public.friendships for delete to authenticated
using (auth.uid() in (requester_id, addressee_id));

create policy "users see their own invite links"
on public.friend_invites for select to authenticated
using (inviter_id = auth.uid());

create policy "users create their own invite links"
on public.friend_invites for insert to authenticated
with check (inviter_id = auth.uid());

create policy "users see own or shared friend agenda"
on public.agenda_items for select to authenticated
using (
  user_id = auth.uid()
  or (
    public.are_friends(auth.uid(), user_id)
    and exists (
      select 1 from public.profiles p
      where p.id = agenda_items.user_id
        and p.share_agenda_with_friends = true
    )
  )
);

create policy "users add their own agenda items"
on public.agenda_items for insert to authenticated
with check (user_id = auth.uid());

create policy "users update their own agenda items"
on public.agenda_items for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "users delete their own agenda items"
on public.agenda_items for delete to authenticated
using (user_id = auth.uid());

create or replace function public.send_friend_request(friend_email text)
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

  if friend is null then
    raise exception 'No account found for that email yet. Share an invite link instead.';
  end if;
  if friend = me then
    raise exception 'That is your own email address.';
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

create or replace function public.create_friend_invite()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  invite_code text;
begin
  if auth.uid() is null then
    raise exception 'Sign in before creating an invitation.';
  end if;
  insert into public.friend_invites (inviter_id)
  values (auth.uid())
  returning code into invite_code;
  return invite_code;
end;
$$;

create or replace function public.accept_friend_invite(invite_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  invite public.friend_invites%rowtype;
  existing public.friendships%rowtype;
begin
  if me is null then
    raise exception 'Sign in before accepting an invitation.';
  end if;

  select i.* into invite
  from public.friend_invites i
  where i.code = trim(invite_code)
    and i.accepted_by is null
    and i.expires_at > now()
  for update;

  if not found then
    raise exception 'This invitation is invalid, expired, or already used.';
  end if;
  if invite.inviter_id = me then
    raise exception 'You cannot accept your own invitation.';
  end if;

  select f.* into existing
  from public.friendships f
  where least(f.requester_id, f.addressee_id) = least(invite.inviter_id, me)
    and greatest(f.requester_id, f.addressee_id) = greatest(invite.inviter_id, me)
  for update;

  if found then
    update public.friendships
    set status = 'accepted', responded_at = now()
    where id = existing.id;
  else
    insert into public.friendships (requester_id, addressee_id, status, responded_at)
    values (invite.inviter_id, me, 'accepted', now())
    returning id into existing.id;
  end if;

  update public.friend_invites
  set accepted_by = me
  where id = invite.id;
  return existing.id;
end;
$$;

revoke all on public.profile_emails from anon, authenticated;
revoke all on public.friend_invites from anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.friendships to authenticated;
grant select, insert, update, delete on public.agenda_items to authenticated;
grant select on public.profile_emails to authenticated;
grant select, insert on public.friend_invites to authenticated;

revoke all on function public.are_friends(uuid, uuid) from public;
revoke all on function public.has_active_relationship(uuid, uuid) from public;
revoke all on function public.send_friend_request(text) from public;
revoke all on function public.create_friend_invite() from public;
revoke all on function public.accept_friend_invite(text) from public;

grant execute on function public.are_friends(uuid, uuid) to authenticated;
grant execute on function public.has_active_relationship(uuid, uuid) to authenticated;
grant execute on function public.send_friend_request(text) to authenticated;
grant execute on function public.create_friend_invite() to authenticated;
grant execute on function public.accept_friend_invite(text) to authenticated;
