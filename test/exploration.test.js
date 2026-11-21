import test from "node:test";
import assert from "node:assert/strict";
import { Chess } from "chess.js";
import { lessons } from "../lessons.js";
import {
  addMove,
  replayLine,
  chatgptContext,
  boardStatus,
} from "../src/exploration.js";
test("An off-target move remains playable, and legal replies can be explored", () => {
  const l = lessons[0];
  let line = { anchor: l.fen, moves: [] };
  line = addMove(line, "d4e5");
  assert.equal(replayLine(line).get("e5").color, "w");
  assert.equal(replayLine(line).turn(), "b");
  line = addMove(line, "f8b4");
  assert.ok(replayLine(line).isCheck());
  line = addMove(line, "b1c3");
  assert.ok(!replayLine(line).isCheck());
  assert.equal(
    replayLine({ ...line, moves: line.moves.slice(0, -1) }).turn(),
    "w",
  );
  assert.throws(() => addMove(line, "a1a8"));
  const copy = JSON.parse(JSON.stringify(line));
  assert.equal(replayLine(copy).fen(), replayLine(line).fen());
});
test("Coach export carries current FEN, full explored history and question without identity", () => {
  const l = lessons[0],
    line = addMove({ anchor: l.fen, moves: [] }, "d4e5");
  const fen = replayLine(line).fen();
  const text = chatgptContext({
    lesson: l,
    fen,
    line,
    question: "What did I overlook?",
  });
  assert.ok(text.includes(fen));
  assert.ok(text.includes("dxe5"));
  assert.ok(text.includes("What did I overlook?"));
  assert.ok(text.includes("Black to move"));
  assert.ok(!text.includes("vali."));
  assert.ok(!text.includes("access_token"));
  assert.ok(!text.includes("supabase"));
  assert.throws(
    () => chatgptContext({ lesson: l, fen: l.fen, line, question: "" }),
    /does not match/,
  );
});
test("Free exploration supports castling, en passant, underpromotion, and mate", () => {
  let c = new Chess();
  ["e4", "a6", "e5", "d5"].forEach((m) => c.move(m));
  let line = addMove({ anchor: c.fen(), moves: [] }, "e5d6");
  assert.equal(replayLine(line).get("d5"), undefined);
  line = addMove(
    { anchor: "7k/P7/8/8/8/8/8/7K w - - 0 1", moves: [] },
    "a7a8n",
  );
  assert.equal(replayLine(line).get("a8").type, "n");
  const castle = lessons.find((l) => l.id === "safe-king");
  line = addMove({ anchor: castle.fen, moves: [] }, "e1g1");
  assert.equal(replayLine(line).get("f1").type, "r");
  c = new Chess();
  ["f3", "e5", "g4", "Qh4#"].forEach((m) => c.move(m));
  assert.match(boardStatus(c), /Checkmate/);
});
