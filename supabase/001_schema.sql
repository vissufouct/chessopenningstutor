-- Run once in a Supabase project's SQL editor before 002_course.sql.
-- Free-plan compatible Postgres only: no paid add-ons, storage or edge functions.
begin;
create table if not exists public.tutor_settings(singleton boolean primary key default true check(singleton), allowed_email text not null);
create table if not exists public.course_lessons(id text primary key,ordinal integer unique not null,data jsonb not null);
create table if not exists public.tutor_profiles(user_id uuid primary key references auth.users(id) on delete cascade,xp integer not null default 0 check(xp>=0),peak_xp integer not null default 0,last_lesson text,updated_at timestamptz not null default now());
create table if not exists public.tutor_progress(user_id uuid references public.tutor_profiles(user_id) on delete cascade,lesson_id text references public.course_lessons(id),mode text not null default 'practice' check(mode in ('practice','challenge')),step integer not null default 0,fen text not null,solved boolean not null default false,completed boolean not null default false,awarded boolean not null default false,hinted boolean not null default false,hint_count integer not null default 0,missed text[] not null default '{}',last_feedback text,updated_at timestamptz not null default now(),primary key(user_id,lesson_id));
alter table public.tutor_settings enable row level security;
alter table public.course_lessons enable row level security;
alter table public.tutor_profiles enable row level security;
alter table public.tutor_progress enable row level security;
-- No direct table policies. Every operation goes through guarded functions below.
revoke all on public.tutor_settings,public.course_lessons,public.tutor_profiles,public.tutor_progress from anon,authenticated;
create or replace function public.tutor_user() returns uuid language plpgsql security definer set search_path=pg_catalog,public as $$
declare uid uuid:=auth.uid();
begin
 if uid is null or not exists(select 1 from public.tutor_settings where lower(allowed_email)=lower(auth.jwt()->>'email')) then raise exception 'This account is not enabled for First Moves.' using errcode='42501'; end if;
 insert into public.tutor_profiles(user_id) values(uid) on conflict do nothing;
 return uid;
end $$;
create or replace function public.tutor_state() returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare uid uuid:=public.tutor_user(); result jsonb;
begin
 select jsonb_build_object('xp',p.xp,'peakXp',p.peak_xp,'lastLesson',p.last_lesson,'progress',coalesce((select jsonb_object_agg(g.lesson_id,to_jsonb(g)-'user_id') from public.tutor_progress g where g.user_id=uid),'{}'::jsonb)) into result from public.tutor_profiles p where p.user_id=uid;
 return result;
end $$;
create or replace function public.tutor_action(p_lesson text,p_action text,p_payload jsonb default '{}'::jsonb) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare uid uuid:=public.tutor_user(); l jsonb; g public.tutor_progress%rowtype; m jsonb; k text; msg text; delta integer:=0; mode_value text; answer integer; ord integer;
begin
 -- Serialize per user, preventing double awards from simultaneous requests.
 perform 1 from public.tutor_profiles where user_id=uid for update;
 select data,ordinal into l,ord from public.course_lessons where id=p_lesson;
 if l is null then raise exception 'Unknown lesson'; end if;
 insert into public.tutor_progress(user_id,lesson_id,fen) values(uid,p_lesson,l->>'fen') on conflict do nothing;
 select * into g from public.tutor_progress where user_id=uid and lesson_id=p_lesson for update;
 if p_action in ('start','reset') then
  mode_value:=coalesce(p_payload->>'mode',g.mode);
  if mode_value not in ('practice','challenge') then raise exception 'Invalid mode'; end if;
  update public.tutor_progress set mode=mode_value,step=0,fen=l->>'fen',solved=false where user_id=uid and lesson_id=p_lesson;
  msg:='Choose a piece, then its destination. '||(l->>'prompt');
 elsif p_action='hint' then
  update public.tutor_progress set hinted=true,hint_count=least(hint_count+1,2) where user_id=uid and lesson_id=p_lesson;
  msg:=l->'hints'->>least(g.hint_count,1);
 elsif p_action='move' then
  if g.solved then return jsonb_build_object('state',public.tutor_state(),'feedback','Already solved. Explain your choice or replay for practice.','delta',0); end if;
  k:=p_payload->>'move';
  m:=l->'steps'->g.step->k;
  if m is null then raise exception 'That move is not legal in this position.'; end if;
  if (m->>'good')::boolean then
   if g.step+1=jsonb_array_length(l->'steps') then
    if g.mode='challenge' and not g.awarded then delta:=case when g.hinted then 10 else 20 end; end if;
    update public.tutor_progress set fen=m->>'fen',solved=true,awarded=awarded or delta>0 where user_id=uid and lesson_id=p_lesson;
    msg:=l->>'explanation';
   else
    update public.tutor_progress set fen=m->>'fen',step=step+1 where user_id=uid and lesson_id=p_lesson;
    msg:='Good: '||(m->>'san')||'. Black replies '||(m->>'reply')||'. Find the next move.';
   end if;
  else
   if g.mode='challenge' and not g.awarded and not k=any(g.missed) then
    delta:=-5;
    update public.tutor_progress set missed=array_append(missed,k) where user_id=uid and lesson_id=p_lesson;
   end if;
   msg:=(m->>'san')||' is legal, but does not meet this exercise’s goal. Recheck the task and try again. The position has been restored.';
  end if;
 elsif p_action='reflect' then
  if not g.solved then raise exception 'Solve the position before reflecting.'; end if;
  answer:=(p_payload->>'answer')::integer;
  if answer=(l->>'correct')::integer then
   update public.tutor_progress set completed=true where user_id=uid and lesson_id=p_lesson;
   msg:='Exactly. Lesson complete. Take this idea into your next game.';
  else msg:='Not quite. Read the explanation again, then choose the principle that fits.'; end if;
 elsif p_action='coach' then
  k:=lower(left(coalesce(p_payload->>'message',''),500));
  if k ~ '(hint|help|stuck|answer|best move|what.*move)' then
   update public.tutor_progress set hinted=true,hint_count=least(hint_count+1,2) where user_id=uid and lesson_id=p_lesson;
   msg:=l->'hints'->>least(g.hint_count,1);
  elsif k ~ '(why|explain|idea|principle|learn|because)' then msg:=l->>'story';
  elsif k ~ '(xp|point|score|level)' then msg:='Challenge awards 20 XP once per puzzle, or 10 after a hint. A new missed legal move costs up to 5 XP before your first award. Practice never removes XP. Earned levels stay unlocked. XP is learning progress, not a chess rating.';
  elsif k ~ '(castle|castling)' then msg:='To castle, the king and chosen rook must not have moved, the squares between them must be empty, and the king cannot be in check or cross or land on an attacked square.';
  elsif k ~ '(center|centre|central)' then msg:='The four central squares are d4, e4, d5 and e5. Pawns can occupy them; pieces can influence them from useful squares.';
  elsif k ~ '(checkmate|check)' then msg:='Check means your king is attacked. You must remove the attack legally. It is checkmate only if no legal move removes the check.';
  else msg:='I’m your guided lesson coach. I can explain this lesson, give a hint, or explain centre control, castling, check and XP. For this position: '||(l->>'prompt'); end if;
 else raise exception 'Unknown action'; end if;
 if delta<>0 then
  select greatest(-xp,delta) into delta from public.tutor_profiles where user_id=uid;
  update public.tutor_profiles set xp=xp+delta,peak_xp=greatest(peak_xp,xp+delta) where user_id=uid;
 end if;
 update public.tutor_profiles set last_lesson=p_lesson,updated_at=now() where user_id=uid;
 update public.tutor_progress set updated_at=now(),last_feedback=msg where user_id=uid and lesson_id=p_lesson;
 return jsonb_build_object('state',public.tutor_state(),'feedback',msg,'delta',delta);
end $$;
revoke all on function public.tutor_user() from public,anon,authenticated;
revoke all on function public.tutor_state(),public.tutor_action(text,text,jsonb) from public,anon;
grant execute on function public.tutor_state(),public.tutor_action(text,text,jsonb) to authenticated;
commit;
