-- Additive migration: retains all lessons, users, XP and progress.
begin;
create table if not exists public.tutor_coach_requests (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.tutor_profiles(user_id) on delete cascade,
 created_at timestamptz not null default now()
);
create index if not exists tutor_coach_requests_user_time on public.tutor_coach_requests(user_id,created_at);
alter table public.tutor_coach_requests enable row level security;
revoke all on public.tutor_coach_requests from public,anon,authenticated;
create or replace function public.tutor_coach_context(p_lesson text) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare uid uuid:=public.tutor_user(); l jsonb; p jsonb;
begin
 select jsonb_build_object('title',data->>'title','chapter',data->'chapter','summary',data->>'story','goal',data->>'prompt','pages',data->>'pages') into l from public.course_lessons where id=p_lesson;
 if l is null then raise exception 'Unknown lesson';end if;
 select to_jsonb(g)-'user_id' into p from public.tutor_progress g where user_id=uid and lesson_id=p_lesson;
 return jsonb_build_object('lesson',l,'progress',p);
end $$;
create or replace function public.tutor_coach_reserve(p_user uuid) returns uuid
language plpgsql security definer set search_path=pg_catalog,public as $$
declare request_id uuid;
begin
 if not exists(select 1 from auth.users u join public.tutor_settings s on lower(s.allowed_email)=lower(u.email) where u.id=p_user) then raise exception 'Account not enabled' using errcode='42501';end if;
 perform 1 from public.tutor_profiles where user_id=p_user for update;
 if not found then raise exception 'Profile not found';end if;
 delete from public.tutor_coach_requests where user_id=p_user and created_at < now()-interval '48 hours';
 if (select count(*) from public.tutor_coach_requests where user_id=p_user and created_at>now()-interval '1 minute')>=5
 or (select count(*) from public.tutor_coach_requests where user_id=p_user and created_at>now()-interval '24 hours')>=60
 then raise exception 'coach_quota_exceeded';end if;
 insert into public.tutor_coach_requests(user_id) values(p_user) returning id into request_id;
 return request_id;
end $$;
revoke all on function public.tutor_coach_context(text) from public,anon;
grant execute on function public.tutor_coach_context(text) to authenticated;
revoke all on function public.tutor_coach_reserve(uuid) from public,anon,authenticated;
grant execute on function public.tutor_coach_reserve(uuid) to service_role;
commit;
