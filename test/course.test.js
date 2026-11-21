import test from "node:test";
import assert from "node:assert/strict";
import { Chess } from "chess.js";
import { lessons } from "../lessons.js";
import { database, action, state, identity, USER } from "./db-helper.js";
test("All 12 sourced lessons have legal starting sequences and complete solutions", () => {
  assert.equal(lessons.length, 12);
  for (const l of lessons) {
    const c = new Chess();
    l.moves.forEach((m) => assert.ok(c.move(m)));
    assert.equal(c.fen(), l.fen);
    for (const line of l.answers) {
      const p = new Chess(l.fen);
      line.forEach((m, i) => {
        assert.ok(p.move(m));
        if (l.replies[i]) assert.ok(p.move(l.replies[i]));
      });
      if (l.id === "legall-combination") assert.ok(p.isCheckmate());
    }
    assert.ok(l.correct < l.choices.length);
  }
});
test("Postgres guards auth, scores, repeat submissions, hints, reflection, and all solutions", async () => {
  const db = await database();
  try {
    await identity(db, "", "");
    await assert.rejects(state(db), /not enabled/);
    await identity(db, USER, "other@example.test");
    await assert.rejects(state(db), /not enabled/);
    await identity(db, USER, "learner@example.test");
    assert.equal((await state(db)).xp, 0);
    await db.exec("set role authenticated");
    await assert.rejects(
      db.query("select * from public.course_lessons"),
      /permission denied/,
    );
    await assert.rejects(
      db.query("update public.tutor_profiles set xp=99999"),
      /permission denied/,
    );
    await assert.rejects(
      db.query("select public.tutor_user()"),
      /permission denied/,
    );
    const id = lessons[0].id;
    await action(db, id, "start", { mode: "challenge" });
    await assert.rejects(action(db, id, "move", { move: "a1a8" }), /not legal/);
    await assert.rejects(action(db, id, "reflect", { answer: 0 }), /Solve/);
    let r = await action(db, id, "move", { move: "d1g4" });
    assert.equal(r.delta, 20);
    assert.equal(r.state.xp, 20);
    assert.equal((await action(db, id, "move", { move: "d1g4" })).delta, 0);
    await action(db, id, "start", { mode: "challenge" });
    assert.equal((await action(db, id, "move", { move: "d1g4" })).delta, 0);
    assert.equal(
      (await action(db, id, "reflect", { answer: 1 })).state.progress[id]
        .completed,
      false,
    );
    assert.equal(
      (await action(db, id, "reflect", { answer: 0 })).state.progress[id]
        .completed,
      true,
    );
    const second = "central-start";
    await action(db, second, "start", { mode: "challenge" });
    r = await action(db, second, "move", { move: "a2a3" });
    assert.equal(r.delta, -5);
    assert.equal(r.state.xp, 15);
    assert.equal(r.state.peakXp, 20);
    assert.equal((await action(db, second, "move", { move: "a2a3" })).delta, 0);
    await action(db, second, "coach", { message: "give me a hint" });
    await action(db, second, "reset", { mode: "challenge" });
    r = await action(db, second, "move", { move: "e2e4" });
    assert.equal(r.delta, 10);
    assert.equal(r.state.xp, 25);
    await action(db, "safe-king", "start", { mode: "practice" });
    r = await action(db, "safe-king", "move", { move: "a2a3" });
    assert.equal(r.delta, 0);
    for (const l of lessons) {
      await action(db, l.id, "start", { mode: "practice" });
      const c = new Chess(l.fen);
      for (let i = 0; i < l.answers[0].length; i++) {
        const m = c.move(l.answers[0][i]);
        r = await action(db, l.id, "move", {
          move: m.from + m.to + (m.promotion || ""),
        });
        if (l.replies[i]) c.move(l.replies[i]);
        assert.equal(r.state.progress[l.id].fen, c.fen());
      }
      assert.ok(r.state.progress[l.id].solved);
      r = await action(db, l.id, "reflect", { answer: l.correct });
      assert.ok(r.state.progress[l.id].completed);
    }
    assert.equal(
      Object.values((await state(db)).progress).filter((p) => p.completed)
        .length,
      12,
    );
    await db.exec("reset role");
    await db.exec("set role anon");
    await assert.rejects(state(db), /permission denied/);
  } finally {
    await db.close();
  }
});
