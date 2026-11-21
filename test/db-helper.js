import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
export const USER = "11111111-1111-4111-8111-111111111111";
export async function database() {
  const db = new PGlite();
  await db.exec(
    `create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); insert into auth.users values('${USER}'); create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; create function auth.jwt() returns jsonb language sql as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;`,
  );
  await db.exec(await readFile("supabase/001_schema.sql", "utf8"));
  await db.exec(await readFile("supabase/002_course.sql", "utf8"));
  await db.exec(
    `insert into public.tutor_settings values(true,'learner@example.test');`,
  );
  await identity(db, USER, "learner@example.test");
  return db;
}
export async function identity(db, id, email) {
  await db.query(
    "select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",
    [id, JSON.stringify({ email })],
  );
}
export async function state(db) {
  return (await db.query("select public.tutor_state() as data")).rows[0].data;
}
export async function action(db, id, kind, payload = {}) {
  return (
    await db.query("select public.tutor_action($1,$2,$3::jsonb) as data", [
      id,
      kind,
      JSON.stringify(payload),
    ])
  ).rows[0].data;
}
