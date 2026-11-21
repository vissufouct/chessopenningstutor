import { lessons, publicLesson } from "../lessons.js";
import { Chess } from "chess.js";
import { writeFileSync } from "node:fs";
const packed = lessons.map((l) => {
  let chess = new Chess(l.fen);
  const steps = [];
  for (let i = 0; i < l.answers[0].length; i++) {
    const accepted = l.answers.map((a) => a[i]);
    const options = {};
    for (const move of chess.moves({ verbose: true })) {
      const key = move.from + move.to + (move.promotion || "");
      const c = new Chess(chess.fen());
      c.move(move.san);
      const good = accepted.includes(move.san);
      let reply = null;
      if (good && l.replies[i]) {
        reply = c.move(l.replies[i]).san;
      }
      options[key] = { good, san: move.san, fen: c.fen(), reply };
    }
    steps.push(options);
    if (i < l.answers[0].length - 1) {
      chess.move(l.answers[0][i]);
      if (l.replies[i]) chess.move(l.replies[i]);
    }
  }
  return { ...l, steps };
});
writeFileSync(
  "src/course.json",
  JSON.stringify(
    lessons.map((l) => {
      const p = publicLesson(l);
      delete p.explanation;
      return p;
    }),
    null,
    2,
  ) + "\n",
);
const sql = packed
  .map(
    (l, i) =>
      `insert into public.course_lessons(id,ordinal,data) values ('${l.id}',${i},'${JSON.stringify(l).replaceAll("'", "''")}'::jsonb) on conflict(id) do update set ordinal=excluded.ordinal,data=excluded.data;`,
  )
  .join("\n");
writeFileSync("supabase/002_course.sql", sql + "\n");
console.log(
  `Generated ${packed.length} lessons; all starting moves and accepted continuations are legal.`,
);
