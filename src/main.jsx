import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import React, { useEffect, useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import { Chess } from "chess.js";
import {
  IconChessKnightFilled,
  IconMenu2,
  IconX,
  IconBook2,
  IconBulb,
  IconSend,
  IconPlayerPlay,
  IconRefresh,
  IconCheck,
  IconArrowRight,
  IconLogout,
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconTrophy,
  IconCircleCheckFilled,
} from "@tabler/icons-react";
import course from "./course.json";
import { supabase, configured, rpc } from "./client";
import "./style.css";
const chapterNames = { 1: "Early Days", 2: "Basic Opening Principles" };
const pieceNames = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
};
function Logo() {
  return (
    <span className="brand">
      <IconChessKnightFilled size={38} />
      <span>
        First Moves<small>Your chess classroom</small>
      </span>
    </span>
  );
}
function Login({ onSession }) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      onSession(data.session);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login">
      <div className="login-intro">
        <Logo />
        <p className="eyebrow">A little practice. A stronger foundation.</p>
        <h1>
          Your next good move
          <br />
          starts here.
        </h1>
        <p>
          Learn to see the board, understand your choices, and build opening
          habits that last.
        </p>
        <div className="login-path">
          <span>
            01 <strong>Early Days</strong>
          </span>
          <span>
            02 <strong>Basic Opening Principles</strong>
          </span>
        </div>
        <p className="fine">
          An independent study companion to Yasser Seirawan’s{" "}
          <em>Winning Chess Openings</em>.
        </p>
      </div>
      <section className="login-form">
        <IconChessKnightFilled className="login-knight" size={54} />
        <h2>Welcome to your classroom</h2>
        <p>Your lessons, your progress, your pace.</p>
        {!configured ? (
          <div role="alert" className="notice">
            Connection setup is pending. Your administrator needs to configure
            the Supabase project before you can sign in.
          </div>
        ) : (
          <form onSubmit={submit}>
            <label>
              Email
              <input
                type="email"
                name="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <button className="primary" disabled={busy}>
              {busy ? "Signing in…" : "Enter your classroom"}
              <IconArrowRight size={18} />
            </button>
          </form>
        )}
        <p className="fine">
          Private classroom · One learner
          <br />
          Progress syncs securely to your account.
        </p>
      </section>
    </main>
  );
}
function Board({ fen, onMove, disabled, lastMove }) {
  const [selected, setSelected] = useState(null),
    [targets, setTargets] = useState([]);
  useEffect(() => {
    setSelected(null);
    setTargets([]);
  }, [fen, disabled]);
  const game = new Chess(fen);
  function click(square) {
    if (disabled) return;
    const piece = game.get(square);
    if (selected && targets.includes(square)) {
      onMove(selected + square);
      setSelected(null);
      setTargets([]);
      return;
    }
    if (piece?.color === game.turn()) {
      setSelected(square);
      setTargets(game.moves({ square, verbose: true }).map((m) => m.to));
    } else {
      setSelected(null);
      setTargets([]);
    }
  }
  return (
    <div className="board-frame">
      <div className="ranks">
        {[8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
      <div
        className="board"
        role="group"
        aria-label="Chessboard. Select a piece, then a destination."
      >
        {game.board().flatMap((rank, ri) =>
          rank.map((piece, ci) => {
            const square = "abcdefgh"[ci] + (8 - ri);
            return (
              <button
                key={square}
                type="button"
                data-square={square}
                disabled={disabled}
                onClick={() => click(square)}
                className={`square ${(ri + ci) % 2 ? "dark" : "light"} ${selected === square ? "selected" : ""} ${targets.includes(square) ? "target" : ""} ${lastMove?.includes(square) ? "last-move" : ""}`}
                aria-label={`${square}${piece ? `, ${piece.color === "w" ? "White" : "Black"} ${pieceNames[piece.type]}` : ""}${targets.includes(square) ? ", legal destination" : ""}`}
                aria-pressed={selected === square}
              >
                {piece && (
                  <img
                    draggable="false"
                    alt=""
                    src={`${import.meta.env.BASE_URL}pieces/${piece.color}${piece.type.toUpperCase()}.png`}
                  />
                )}
              </button>
            );
          }),
        )}
      </div>
      <div className="files">
        {"abcdefgh".split("").map((s) => (
          <span key={s}>{s}</span>
        ))}
      </div>
    </div>
  );
}
function App() {
  const [session, setSession] = useState(null),
    [authReady, setAuthReady] = useState(false),
    [state, setState] = useState(null),
    [current, setCurrent] = useState(course[0].id),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [nav, setNav] = useState(false),
    [view, setView] = useState("puzzle"),
    [source, setSource] = useState(false),
    [messages, setMessages] = useState([]),
    [draft, setDraft] = useState(""),
    [delta, setDelta] = useState(null),
    [storyStep, setStoryStep] = useState(0);
  const dialogRef = useRef(null);
  const composing = useRef(false);
  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(s);
      setAuthReady(true);
      if (!s) setState(null);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!session) return;
    let active = true;
    rpc("tutor_state")
      .then((s) => {
        if (active) {
          setState(s);
          if (s.lastLesson && course.some((l) => l.id === s.lastLesson))
            setCurrent(s.lastLesson);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [session?.user?.id]);
  useEffect(() => {
    if (source) {
      dialogRef.current?.showModal();
    } else dialogRef.current?.close();
  }, [source]);
  const lesson = course.find((l) => l.id === current),
    progress = state?.progress?.[current];
  const mode = progress?.mode || "practice",
    fen = progress?.fen || lesson.fen;
  const solved = progress?.solved || false,
    completed = progress?.completed || false;
  const totalDone = Object.values(state?.progress || {}).filter(
    (p) => p.completed,
  ).length;
  const level = 1 + Math.floor((state?.peakXp || 0) / 100);
  async function act(action, payload = {}, id = current) {
    if (composing.current) return;
    composing.current = true;
    setBusy(true);
    setError("");
    try {
      const r = await rpc("tutor_action", {
        p_lesson: id,
        p_action: action,
        p_payload: payload,
      });
      setState(r.state);
      setDelta(r.delta ? { value: r.delta, key: Date.now() } : null);
      if (!["start", "reset"].includes(action))
        setMessages((m) => [...m, { role: "coach", text: r.feedback }]);
      return r;
    } catch (e) {
      setError(e.message);
    } finally {
      composing.current = false;
      setBusy(false);
    }
  }
  async function choose(id) {
    if (busy) return;
    setCurrent(id);
    setMessages([]);
    setView("puzzle");
    setStoryStep(0);
    setNav(false);
    setDelta(null);
    setError("");
  }
  async function reset(nextMode = mode) {
    const r = await act("start", { mode: nextMode });
    if (r) {
      setMessages([]);
      setView("puzzle");
      setStoryStep(0);
    }
  }
  async function move(uci) {
    const r = await act("move", { move: uci });
    if (r?.state.progress[current]?.solved) setView("puzzle");
  }
  async function send(e) {
    e.preventDefault();
    const message = draft.trim();
    if (!message || busy) return;
    setDraft("");
    setMessages((m) => [...m, { role: "learner", text: message }]);
    await act("coach", { message });
  }
  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setState(null);
  }
  function downloadProgress() {
    const blob = new Blob(
      [
        JSON.stringify(
          { exportedAt: new Date().toISOString(), ...state },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "first-moves-progress.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  if (!authReady) return <div className="loading">Opening your classroom…</div>;
  if (!session) return <Login onSession={setSession} />;
  if (!state)
    return (
      <main className="setup">
        <Logo />
        <h1>
          {error ? "Your classroom is almost ready" : "Loading your progress…"}
        </h1>
        {error && (
          <>
            <p role="alert">The database connection is not ready: {error}</p>
            <p>
              The project administrator needs to install the course SQL and
              enable this learner account. Your password is handled by Supabase
              Auth.
            </p>
            <button className="primary" onClick={() => location.reload()}>
              Retry connection
            </button>
            <button onClick={logout}>Sign out</button>
          </>
        )}
      </main>
    );
  const storyGame = new Chess();
  lesson.moves.slice(0, storyStep).forEach((m) => storyGame.move(m));
  const activeFen = view === "story" ? storyGame.fen() : fen;
  return (
    <div className="app">
      <header className="mobile-header">
        <button
          className="icon-button"
          aria-label="Open lessons"
          onClick={() => setNav(true)}
        >
          <IconMenu2 />
        </button>
        <Logo />
        <span className="xp-pill">{state.xp} XP</span>
      </header>
      {nav && (
        <button
          className="nav-scrim"
          aria-label="Close lessons"
          onClick={() => setNav(false)}
        />
      )}
      <aside className={`sidebar ${nav ? "open" : ""}`}>
        <div className="side-brand">
          <Logo />
          <button
            className="mobile-only icon-button"
            aria-label="Close lessons"
            onClick={() => setNav(false)}
          >
            <IconX />
          </button>
        </div>
        <div className="course-label">
          YOUR LEARNING PATH <span>{totalDone}/12</span>
        </div>
        <nav aria-label="Course lessons">
          {[1, 2].map((ch) => (
            <section className="chapter" key={ch}>
              <h2>
                <IconBook2 size={24} />
                <span>
                  <small>Chapter {ch}</small>
                  {chapterNames[ch]}
                </span>
              </h2>
              <ol>
                {course
                  .filter((l) => l.chapter === ch)
                  .map((l) => (
                    <li key={l.id}>
                      <button
                        className={current === l.id ? "active" : ""}
                        onClick={() => choose(l.id)}
                        disabled={busy}
                      >
                        {state.progress[l.id]?.completed ? (
                          <IconCircleCheckFilled size={18} className="done" />
                        ) : (
                          <span className="lesson-dot" />
                        )}
                        <span>{l.title}</span>
                      </button>
                    </li>
                  ))}
              </ol>
            </section>
          ))}
        </nav>
        <div className="profile">
          <div className="level">
            <strong>Level {level}</strong>
            <span>{state.xp} XP</span>
          </div>
          <progress
            max="100"
            value={state.peakXp % 100}
            aria-label="Level progress"
          />
          <small>Learning XP · not a chess rating</small>
          <div className="profile-actions">
            <button onClick={downloadProgress} title="Export progress">
              <IconDownload size={17} />
              Export
            </button>
            <button onClick={logout}>
              <IconLogout size={17} />
              Sign out
            </button>
          </div>
        </div>
      </aside>
      <main className="classroom">
        <div className="lesson-header">
          <div>
            <p className="eyebrow">YOUR NEXT GOOD MOVE</p>
            <h1>{lesson.title}</h1>
            <p className="chapter-subtitle">
              Chapter {lesson.chapter} · {chapterNames[lesson.chapter]}
            </p>
          </div>
          <div className="mode-switch" aria-label="Learning mode">
            {["practice", "challenge"].map((m) => (
              <button
                key={m}
                disabled={busy}
                onClick={() => reset(m)}
                aria-pressed={mode === m}
                className={mode === m ? "chosen" : ""}
              >
                {m === "practice" ? "Practice" : "Challenge"}
              </button>
            ))}
          </div>
        </div>
        <div className="steps" aria-label="Lesson stages">
          <button
            onClick={() => {
              setView("story");
              setStoryStep(0);
            }}
            className={view === "story" ? "current" : ""}
          >
            <IconPlayerPlay size={16} />
            Watch the story
          </button>
          <span>—</span>
          <button
            className={view === "puzzle" ? "current" : ""}
            onClick={() => setView("puzzle")}
          >
            Find the better move
          </button>
          <span>—</span>
          <button
            disabled={!solved}
            onClick={() => setView("reflect")}
            className={view === "reflect" ? "current" : ""}
          >
            Explain your choice
          </button>
        </div>
        <div className="coach-intro">
          <div className="coach-avatar">
            <IconChessKnightFilled size={27} />
          </div>
          <div className="intro-bubble">
            <p>{view === 'story' ? lesson.story : <><span className="story-context">{lesson.story.split('. ')[0]}. </span>{lesson.prompt}</>}</p>
            <button className="source-link" onClick={() => setSource(true)}>
              <IconBook2 size={16} />
              Winning Chess Openings · p. {lesson.pages}
              <span>View source</span>
            </button>
          </div>
        </div>
        {error && (
          <div role="alert" className="error">
            {error} <button onClick={() => setError("")}>Dismiss</button>
          </div>
        )}
        {view === "reflect" ? (
          <section className="reflection">
            <p className="eyebrow">MAKE THE IDEA YOURS</p>
            <h2>{lesson.question}</h2>
            <div className="answers">
              {lesson.choices.map((choice, i) => (
                <button
                  key={choice}
                  disabled={busy}
                  onClick={() => act("reflect", { answer: i })}
                >
                  <span>{String.fromCharCode(65 + i)}</span>
                  {choice}
                </button>
              ))}
            </div>
            {completed && (
              <div className="complete">
                <IconCircleCheckFilled />
                <strong>Lesson complete</strong>
                <p>
                  {totalDone === 12
                    ? "You finished both chapters. Revisit your challenges and apply these ideas in your next game."
                    : "You’ve added another idea to your chess toolkit."}
                </p>
                <button
                  className="primary"
                  onClick={() =>
                    choose(
                      course[
                        (course.findIndex((l) => l.id === current) + 1) %
                          course.length
                      ].id,
                    )
                  }
                >
                  Continue learning
                  <IconArrowRight size={18} />
                </button>
              </div>
            )}
            <button className="text-button" onClick={() => setView("puzzle")}>
              Return to the board
            </button>
          </section>
        ) : (
          <section className="activity">
            <div className="activity-main">
              <div className="board-column">
                <Board
                  fen={activeFen}
                  onMove={move}
                  disabled={busy || solved || view === "story"}
                />
                <div className="board-caption">
                  <strong>
                    {view === "story"
                      ? `Replay · ${storyStep} / ${lesson.moves.length} half-moves`
                      : solved
                        ? "Position solved"
                        : new Chess(fen).turn() === "w"
                          ? "White to move"
                          : "Black to move"}
                  </strong>
                  {view === "story" ? (
                    <div className="replay-buttons">
                      <button
                        aria-label="Previous move"
                        disabled={!storyStep}
                        onClick={() => setStoryStep((i) => i - 1)}
                      >
                        <IconChevronLeft />
                      </button>
                      <button
                        aria-label="Next move"
                        disabled={storyStep === lesson.moves.length}
                        onClick={() => setStoryStep((i) => i + 1)}
                      >
                        <IconChevronRight />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => reset()} disabled={busy}>
                      <IconRefresh size={19} />
                      Replay
                    </button>
                  )}
                </div>
              </div>
              <div className="task-panel">
                {view === "story" ? (
                  <>
                    <p className="eyebrow">LEARN BY LOOKING</p>
                    <h2>Every move tells a story.</h2>
                    <p>
                      Use the arrows to replay the lead-up. Notice which lines
                      open and which pieces become targets.
                    </p>
                    <button
                      className="primary"
                      onClick={() => setView("puzzle")}
                    >
                      Try the position
                      <IconArrowRight size={18} />
                    </button>
                  </>
                ) : (
                  <>
                    <p className="eyebrow">
                      {solved ? "NICELY SEEN" : "YOUR MOVE"}
                    </p>
                    <h2>
                      {solved
                        ? "Now, make it stick."
                        : lesson.id === "look-before-copy"
                          ? "Find the free piece"
                          : "Think, then move."}
                    </h2>
                    <p className="task-copy">
                      {solved
                        ? "Explain the idea behind your move to complete this lesson."
                        : "Tap a piece, then a highlighted square. You can take your time."}
                    </p>
                    {solved ? (
                      <button
                        className="primary"
                        onClick={() => setView("reflect")}
                      >
                        Explain your choice
                        <IconArrowRight size={18} />
                      </button>
                    ) : (
                      <>
                        <div className="rules">
                          <strong>
                            {mode === "challenge"
                              ? "Challenge rules"
                              : "Room to explore"}
                          </strong>
                          <div className="rule-row gain">
                            <IconCircleCheckFilled size={20} />
                            <span>
                              {mode === "challenge"
                                ? progress?.awarded
                                  ? "Already earned"
                                  : progress?.hinted
                                    ? "+10 XP · solve"
                                    : "+20 XP · solve"
                                : "Unlimited retries"}
                            </span>
                          </div>
                          <div className="rule-row loss">
                            <IconX size={20} />
                            <span>
                              {mode === "challenge" && !progress?.awarded
                                ? "−5 XP · new missed attempt"
                                : "No XP penalties"}
                            </span>
                          </div>
                          <small>
                            {mode === "challenge"
                              ? "One reward per puzzle. Practice has no penalties."
                              : "Switch to Challenge when you feel ready."}
                          </small>
                        </div>
                        <button
                          className="hint-button"
                          disabled={busy}
                          onClick={() => act("hint")}
                        >
                          <IconBulb size={22} />
                          {mode === "challenge" && !progress?.awarded
                            ? "Hint · solve for +10 XP"
                            : "Give me a hint"}
                        </button>
                        <p className="fine">
                          {mode === "challenge"
                            ? "Hint use is saved for this puzzle."
                            : "Learning comes before points."}
                        </p>
                      </>
                    )}
                    {delta && (
                      <div
                        key={delta.key}
                        className={`xp-toast ${delta.value > 0 ? "gain" : "loss"}`}
                        role="status"
                      >
                        {delta.value > 0 ? "+" : ""}
                        {delta.value} XP · saved
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="activity-footer">
              <span>
                {lesson.moves.length
                  ? lesson.moves.map((m, i) => (
                      <React.Fragment key={i}>
                        {i % 2 === 0 && <b>{Math.floor(i / 2) + 1}. </b>}
                        {m}{" "}
                      </React.Fragment>
                    ))
                  : "Starting position · all pieces ready"}
              </span>
              <span className="saved">
                <IconCheck size={15} />
                Progress synced
              </span>
            </div>
          </section>
        )}
        <section
          className="conversation"
          aria-label="Conversation with your coach"
          aria-live="polite"
        >
          {messages.map((m, i) => (
            <div key={i} className={`message ${m.role}`}>
              {m.role === "coach" && (
                <div className="coach-avatar small">
                  <IconChessKnightFilled size={20} />
                </div>
              )}
              <p>{m.text}</p>
            </div>
          ))}
          {busy && <p className="thinking">Checking your position…</p>}
        </section>
        <div className="composer-wrap">
          <div className="quick-questions">
            <button
              disabled={busy}
              onClick={() => act("coach", { message: "Explain the idea" })}
            >
              Explain the idea
            </button>
            <button
              disabled={busy}
              onClick={() => act("coach", { message: "How does XP work?" })}
            >
              How XP works
            </button>
            <span>Guided lesson coach</span>
          </div>
          <form className="composer" onSubmit={send}>
            <input
              aria-label="Ask your coach"
              placeholder="Ask your coach or explain your move…"
              maxLength={500}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button
              className="send"
              disabled={busy || !draft.trim()}
              aria-label="Send message"
            >
              <IconSend size={22} />
            </button>
          </form>
        </div>
        <footer className="page-footer">
          Small steps. Thoughtful moves. Lasting progress.
        </footer>
      </main>
      <dialog
        ref={dialogRef}
        onCancel={() => setSource(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setSource(false);
        }}
      >
        <button
          className="dialog-close icon-button"
          aria-label="Close source"
          onClick={() => setSource(false)}
        >
          <IconX />
        </button>
        <p className="eyebrow">YOUR BOOK COMPANION</p>
        <h2>{lesson.topic}</h2>
        <p>
          <em>Winning Chess Openings</em>
          <br />
          Yasser Seirawan · Chapter {lesson.chapter} · printed pp.{" "}
          {lesson.pages}
        </p>
        <p>{lesson.story}</p>
        <p className="fine">
          This lesson uses an original teaching summary.{" "}
          {lesson.id === "safe-king"
            ? "The practice position is original, applying the book’s king-safety principle."
            : "The exercise follows the ideas or examples in the cited pages."}{" "}
          Page numbers refer to the printed book, not the PDF viewer.
        </p>
        <button
          className="primary"
          onClick={() => {
            setSource(false);
            setView("story");
            setStoryStep(0);
          }}
        >
          Replay the example
          <IconPlayerPlay size={18} />
        </button>
      </dialog>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
