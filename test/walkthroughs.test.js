import test from "node:test";
import assert from "node:assert/strict";
import { Chess } from "chess.js";
import { lessons } from "../lessons.js";
import { walkthroughs, walkthroughFrames } from "../src/walkthroughs.js";
test("Every lesson has a legal, fully annotated walkthrough and a takeaway", () => {
  assert.equal(Object.keys(walkthroughs).length, lessons.length);
  for (const lesson of lessons) {
    const w = walkthroughs[lesson.id];
    assert.ok(w.takeaway.length > 30);
    assert.ok(w.steps.length > 0);
    const frames = walkthroughFrames(lesson.id);
    assert.equal(frames.length, w.steps.length + 1);
    const game = new Chess();
    assert.equal(frames[0].fen, game.fen());
    for (let i = 0; i < w.steps.length; i++) {
      const item = w.steps[i];
      assert.ok(item.explanation.length > 40);
      const m = game.move(item.san);
      assert.equal(frames[i + 1].fen, game.fen());
      assert.deepEqual(frames[i + 1].lastMove, [m.from, m.to]);
      assert.equal(frames[i + 1].explanation, item.explanation);
    }
    // Stepping backwards is selecting an exact earlier snapshot, including castling rights.
    for (let i = frames.length - 1; i >= 0; i--)
      assert.ok(new Chess(frames[i].fen));
  }
});
test("Walkthroughs demonstrate the capture, castling and complete mating pattern", () => {
  let f = walkthroughFrames("look-before-copy");
  assert.equal(new Chess(f.at(-1).fen).get("g4").type, "q");
  assert.equal(f.length, 8);
  f = walkthroughFrames("safe-king");
  assert.equal(new Chess(f.at(-1).fen).get("g1").type, "k");
  assert.equal(new Chess(f.at(-1).fen).get("f1").type, "r");
  f = walkthroughFrames("legall-combination");
  assert.ok(new Chess(f.at(-1).fen).isCheckmate());
  assert.match(f.at(-1).label, /Nd5#/);
  assert.match(walkthroughs["central-start"].origin, /Original/);
});
