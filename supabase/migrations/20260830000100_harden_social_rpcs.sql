-- Keep the PostgREST-facing functions unprivileged. The SECURITY DEFINER
-- implementations live in a schema that is not exposed by the Data API.
alter function public.send_friend_request(text) set schema private;
alter function public.create_friend_invite() set schema private;
alter function public.accept_friend_invite(text) set schema private;

create function public.send_friend_request(friend_email text)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.send_friend_request(friend_email);
$$;

create function public.create_friend_invite()
returns text
language sql
security invoker
set search_path = ''
as $$
  select private.create_friend_invite();
$$;

create function public.accept_friend_invite(invite_code text)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.accept_friend_invite(invite_code);
$$;

revoke all on function private.send_friend_request(text) from public, anon, authenticated;
revoke all on function private.create_friend_invite() from public, anon, authenticated;
revoke all on function private.accept_friend_invite(text) from public, anon, authenticated;

revoke all on function public.send_friend_request(text) from public, anon, authenticated;
revoke all on function public.create_friend_invite() from public, anon, authenticated;
revoke all on function public.accept_friend_invite(text) from public, anon, authenticated;

grant usage on schema private to authenticated;
grant execute on function private.send_friend_request(text) to authenticated;
grant execute on function private.create_friend_invite() to authenticated;
grant execute on function private.accept_friend_invite(text) to authenticated;

grant execute on function public.send_friend_request(text) to authenticated;
grant execute on function public.create_friend_invite() to authenticated;
grant execute on function public.accept_friend_invite(text) to authenticated;
