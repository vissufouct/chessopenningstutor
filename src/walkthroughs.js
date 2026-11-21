import { Chess } from "chess.js";
const step = (san, explanation) => ({ san, explanation });
const copy = [
  step(
    "d3",
    "White opens the diagonal for the c1-bishop, but the pawn advances only one square. In this example, White is moving without a clear plan.",
  ),
  step(
    "d5",
    "Black occupies the centre and opens the c8-bishop’s diagonal. A central pawn move does two useful jobs.",
  ),
  step(
    "d4",
    "White moves the same pawn again to copy Black. Reaching d4 took two turns rather than one.",
  ),
  step(
    "e5",
    "Black offers a central pawn. White should now compare captures and development instead of automatically copying.",
  ),
  step(
    "e4",
    "White copies another central pawn move. The lesson is to examine the actual threats and opportunities after every reply.",
  ),
  step(
    "Bg4",
    "Black leaves the bishop on g4 unprotected. White’s queen can reach it along d1–e2–f3–g4. Look for that open diagonal.",
  ),
];
const central = [
  step(
    "e4",
    "White occupies a central square and opens lines for the f1-bishop and queen. This is a useful start, not a guarantee of an advantage.",
  ),
  step(
    "e5",
    "Black also claims central space and opens a bishop’s diagonal. Both players now need to develop their pieces.",
  ),
];
const raid = [
  ...central,
  step(
    "Qh5",
    "White brings the queen out early and attacks the e5-pawn. A threat matters, but repeated queen moves can delay development.",
  ),
  step(
    "Nc6",
    "Black develops a knight and protects e5. Now a pawn push on the kingside will not abandon that central pawn.",
  ),
  step(
    "Bc4",
    "White develops a bishop toward f7. The queen and bishop together threaten Qxf7 checkmate, so Black must respond.",
  ),
];
const g6 = step(
  "g6",
  "Black blocks the queen’s diagonal to f7 and attacks the queen on h5. The c6-knight still protects e5; that detail makes the defence work here.",
);
const qf3 = step(
  "Qf3",
  "White moves the queen again to renew the attack on f7 along the f-file. Black can meet this threat while developing.",
);
const nf6 = step(
  "Nf6",
  "Black develops the other knight and blocks the queen’s route to f7. Defence and development work together.",
);
const philidor = [
  ...central,
  step(
    "Nf3",
    "White develops the g1-knight toward the centre and attacks e5. This puts a piece to work while making a threat.",
  ),
  step(
    "d6",
    "Black supports the e5-pawn and opens the c8-bishop’s diagonal, but the f8-bishop’s path is less free.",
  ),
];
const italian = [
  ...central,
  philidor[2],
  step("Nc6", "Black develops a knight, protects e5 and influences d4."),
  step(
    "Bc4",
    "White develops the f1-bishop toward f7 and clears f1 for possible castling.",
  ),
  step(
    "Bc5",
    "Black develops the bishop toward f2 and clears f8. Both sides are bringing minor pieces into play.",
  ),
];
export const walkthroughs = {
  "look-before-copy": {
    takeaway:
      "Before following your plan, check what your opponent’s last move left undefended.",
    origin: "Book example with its suggested improvement · pp. 3–4",
    steps: [
      ...copy,
      step(
        "Qxg4",
        "White captures the free bishop. This improvement shows why examining the position beats blindly copying an opponent.",
      ),
    ],
  },
  "check-not-mate": {
    takeaway:
      "A checked king is not checkmated if any legal move can remove the attack.",
    origin: "Book example with one of the stated legal blocks · p. 4",
    steps: [
      ...copy,
      step(
        "dxe5",
        "White takes a pawn but misses the much more valuable bishop on g4. The pawn’s departure also changes the centre.",
      ),
      step(
        "Bb4+",
        "Black checks on the b4–e1 diagonal. The book’s young players mistook this for mate, but White can block the line.",
      ),
      step(
        "Nc3",
        "The b1-knight blocks the bishop’s line on c3. The king is no longer in check. White still has an attacked queen, so escaping check does not solve every problem.",
      ),
    ],
  },
  "cannon-fire": {
    takeaway:
      "Develop carefully, and reassess the position when your plan goes wrong.",
    origin: "Cannon Fire example with the recommended recapture · pp. 5–7",
    steps: [
      step(
        "h4",
        "White spends a turn on a flank pawn to make room for a rook adventure. This does little to develop the minor pieces.",
      ),
      step(
        "d5",
        "Black claims the centre and opens the c8-bishop’s diagonal all the way toward h3.",
      ),
      step(
        "Rh3",
        "White brings the rook onto that exposed diagonal. Trace c8–d7–e6–f5–g4–h3 to see the danger.",
      ),
      step(
        "Bxh3",
        "Black captures the rook with the bishop. The rook was worth more than the bishop that took it.",
      ),
      step(
        "Nxh3",
        "White recaptures the bishop with the knight. The trade still favours Black, but recovering a bishop is better than ignoring the loss and continuing the original plan.",
      ),
    ],
  },
  "queen-tempo": {
    takeaway: "A useful developing move can make a threat at the same time.",
    origin: "Queen Raid example · p. 13",
    steps: [
      central[0],
      step(
        "d5",
        "Black immediately challenges White’s central pawn. This is the Scandinavian Defense; an early queen appearance is not automatically a mistake.",
      ),
      step("exd5", "White captures the d-pawn and opens the central files."),
      step(
        "Qxd5",
        "Black recaptures with the queen. The queen now stands where a developing knight can attack it.",
      ),
      step(
        "Nc3",
        "White develops the b1-knight, influences the centre and attacks the queen on d5. Black must account for that threat.",
      ),
    ],
  },
  "stop-raid": {
    takeaway:
      "Answer the concrete threat while creating a useful threat of your own.",
    origin: "Destroying the Queen Raid example · p. 16",
    steps: [...raid, g6],
  },
  "coordinate-defence": {
    takeaway:
      "Coordinated minor pieces can defend your king while an opposing queen loses time.",
    origin: "Destroying the Queen Raid example · pp. 16–20",
    steps: [...raid, g6, qf3, nf6],
  },
  "central-start": {
    takeaway: "Central pawn moves claim space and open routes for your pieces.",
    origin: "Original demonstration of the principles on pp. 25–27",
    steps: [...central, philidor[2], italian[3]],
  },
  "develop-purpose": {
    takeaway: "Choose developing squares that give your pieces a concrete job.",
    origin: "Original demonstration of the principles on pp. 25–29",
    steps: [...central, philidor[2], italian[3], italian[4]],
  },
  "bishop-development": {
    takeaway:
      "Development is more useful when the piece helps a specific plan.",
    origin: "Early Opening Influences example · p. 29",
    steps: [
      ...philidor,
      step(
        "Bc4",
        "White brings the bishop into play on an open diagonal toward f7. The move also clears f1, helping prepare castling. It is purposeful development, not a promise of immediate mate.",
      ),
    ],
  },
  "safe-king": {
    takeaway:
      "Prepare a safe king and a playable middlegame, not just an early attack.",
    origin: "Original castling demonstration of the principle on p. 26",
    steps: [
      ...italian,
      step(
        "O-O",
        "White castles: the king moves from e1 to g1 and the rook from h1 to f1. The path is clear, the king was not in check, and neither f1 nor g1 is attacked. Castling is legal here and improves the king’s shelter.",
      ),
    ],
  },
  "legall-combination": {
    takeaway:
      "Calculate forcing moves. Coordinated pieces can be more important than material.",
    origin: "Legall’s Mate example · pp. 29–30",
    steps: [
      ...philidor,
      step(
        "Bc4",
        "White develops the bishop toward f7. Remember this diagonal: it will be essential to the final attack.",
      ),
      step(
        "Bg4",
        "Black pins the f3-knight to the queen on d1. Moving the knight would uncover an attack on the queen, but it would not expose White’s king.",
      ),
      step(
        "Nc3",
        "White develops the other knight. Both knights and the bishop are now ready to cooperate.",
      ),
      step(
        "h6",
        "Black spends a turn on a flank pawn instead of developing. In this particular position, White can exploit the lack of coordination.",
      ),
      step(
        "Nxe5",
        "White captures e5 and allows the queen to be taken. This works because of a concrete tactical continuation, not because queen sacrifices are generally good.",
      ),
      step(
        "Bxd1",
        "Black takes the queen but overlooks the attack on the king. Black could have chosen a better defence; the mating sequence follows this particular capture.",
      ),
      step(
        "Bxf7+",
        "White captures f7 with check. The bishop checks along f7–e8, while the developed pieces restrict the king’s escape.",
      ),
      step(
        "Ke7",
        "Black’s king is forced to e7. Pause and look at the squares around it before advancing to the final move.",
      ),
      step(
        "Nd5#",
        "The c3-knight jumps to d5 with checkmate. The knights and bishop cover the king’s escape squares; Black’s own pieces also obstruct it. White’s queen loss no longer matters.",
      ),
    ],
  },
  "review-grow": {
    takeaway:
      "Record your games, review your decisions, and practise against stronger opposition.",
    origin: "Original recap demonstration of the ideas on pp. 28–32",
    steps: [
      ...central,
      philidor[2],
      italian[3],
      step(
        "Bb5",
        "White develops the bishop and puts pressure on the c6-knight, a defender of e5. Bc4 is another purposeful choice. Review what each move tries to achieve rather than memorising a single answer.",
      ),
    ],
  },
};
export function walkthroughFrames(id) {
  const lesson = walkthroughs[id];
  if (!lesson) throw new Error(`No walkthrough for ${id}`);
  const game = new Chess();
  const frames = [
    {
      fen: game.fen(),
      label: "Starting position",
      explanation: lesson.takeaway,
      lastMove: null,
    },
  ];
  for (const { san, explanation } of lesson.steps) {
    const number = game.moveNumber(),
      color = game.turn();
    const move = game.move(san);
    frames.push({
      fen: game.fen(),
      label: `${number}${color === "w" ? "." : "…"} ${move.san}`,
      side: color === "w" ? "White" : "Black",
      explanation,
      lastMove: [move.from, move.to],
    });
  }
  return frames;
}
