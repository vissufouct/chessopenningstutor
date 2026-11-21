import { Chess } from "chess.js";
export function playUci(game, uci) {
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci))
    throw new Error("Invalid move");
  return game.move({
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    ...(uci[4] ? { promotion: uci[4] } : {}),
  });
}
export function replayLine(line) {
  const game = new Chess(line.anchor);
  for (const move of line.moves) playUci(game, move);
  return game;
}
export function addMove(line, uci) {
  const game = replayLine(line);
  playUci(game, uci);
  return { ...line, moves: [...line.moves, uci] };
}
export function boardStatus(game) {
  const side = game.turn() === "w" ? "White" : "Black";
  if (game.isCheckmate()) return `Checkmate · ${side} has no legal escape`;
  if (game.isStalemate()) return "Stalemate · draw";
  if (game.isDraw()) return "Drawn position";
  return `${side} to move${game.isCheck() ? " · in check" : ""}`;
}
export function chatgptContext({ lesson, fen, line, question }) {
  const game = line ? replayLine(line) : new Chess(fen);
  if (game.fen() !== fen)
    throw new Error("The move history does not match the board");
  const placement = game
    .board()
    .flat()
    .filter(Boolean)
    .map(
      (p) =>
        `${p.color === "w" ? "White" : "Black"} ${{ p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" }[p.type]} on ${p.square}`,
    )
    .join(", ");
  return [
    "Please be my conversational chess coach. I am a beginner learning to reason about moves. Use short, clear explanations and discuss my questions rather than merely repeating the exercise answer.",
    `I am using First Moves, an independent study companion to chapters 1–2 of Yasser Seirawan’s Winning Chess Openings.`,
    `Lesson: ${lesson.title}. Printed pages: ${lesson.pages}. Learning idea: ${lesson.story}`,
    `Original exercise goal: ${lesson.prompt}`,
    "The following position is the CURRENT board, which may differ from the original exercise after my experiments. Treat it as the source of truth.",
    `Current FEN: ${fen}`,
    `Position status: ${boardStatus(game)}.`,
    `Pieces: ${placement}.`,
    `Legal moves in this position: ${game.moves().join(", ") || "none"}.`,
    line
      ? `Exploration starting FEN: ${line.anchor}\nExplored moves (SAN): ${game.history().join(" ") || "none yet"}\nExploration PGN:\n${game.pgn()}`
      : "No exploration moves in this snapshot.",
    "This is a snapshot, not a live connection. Do not assume you can change my app or award XP. Do not invent an engine evaluation. Explain the consequences of my choices, acknowledge reasonable alternatives, and check that suggested moves are legal. If we analyse a continuation, distinguish it from the snapshot.",
    `My question: ${question.trim() || "What do you notice about this position? Help me understand my choices without immediately giving away the answer."}`,
  ].join("\n\n");
}
