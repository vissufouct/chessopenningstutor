import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import React, { useEffect, useState, useRef, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { Chess } from "chess.js";
import {
  addMove,
  replayLine,
  playUci,
  boardStatus,
  chatgptContext,
} from "./exploration";
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
import { walkthroughs, walkthroughFrames } from "./walkthroughs";
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
  const [promotion, setPromotion] = useState(null);
  const [selected, setSelected] = useState(null),
    [targets, setTargets] = useState([]);
  useEffect(() => {
    setSelected(null);
    setTargets([]);
    setPromotion(null);
  }, [fen, disabled]);
  const game = new Chess(fen);
  function click(square) {
    if (disabled) return;
    const piece = game.get(square);
    if (selected && targets.includes(square)) {
      const choices = game
        .moves({ square: selected, verbose: true })
        .filter((m) => m.to === square && m.promotion);
      if (choices.length) {
        setPromotion({
          from: selected,
          to: square,
          color: game.turn(),
          choices: choices.map((m) => m.promotion),
        });
        return;
      }
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
      {promotion && (
        <div
          className="promotion-picker"
          role="dialog"
          aria-modal="true"
          aria-label="Choose a promotion"
        >
          <strong>Promote your pawn</strong>
          {promotion.choices.map((piece) => (
            <button
              key={piece}
              aria-label={`Promote to ${pieceNames[piece]}`}
              onClick={() => {
                onMove(promotion.from + promotion.to + piece);
                setPromotion(null);
              }}
            >
              <img
                alt=""
                src={`${import.meta.env.BASE_URL}pieces/${promotion.color}${piece.toUpperCase()}.png`}
              />
              {pieceNames[piece]}
            </button>
          ))}
          <button onClick={() => setPromotion(null)}>Cancel</button>
        </div>
      )}
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
    [storyStep, setStoryStep] = useState(0),
    [storyPlaying, setStoryPlaying] = useState(false),
    [storySpeed, setStorySpeed] = useState(3000),
    [exploration, setExploration] = useState(null),
    [chatSnapshot, setChatSnapshot] = useState(null),
    [copied, setCopied] = useState(false);
  const chatDialogRef = useRef(null);
  const dialogRef = useRef(null);
  const composing = useRef(false);
  const frames = useMemo(() => walkthroughFrames(current), [current]);
  const walkthrough = walkthroughs[current];
  useEffect(() => {
    if (source || chatSnapshot) setStoryPlaying(false);
  }, [source, chatSnapshot]);
  const frame = frames[Math.min(storyStep, frames.length - 1)];
  function goToStoryStep(n) {
    setStoryPlaying(false);
    setStoryStep(Math.max(0, Math.min(n, frames.length - 1)));
  }
  useEffect(() => {
    setStoryPlaying(false);
  }, [current, view]);
  useEffect(() => {
    if (!storyPlaying || view !== "story" || !session) return;
    if (storyStep >= frames.length - 1) {
      setStoryPlaying(false);
      return;
    }
    const timer = setTimeout(
      () => setStoryStep((i) => Math.min(i + 1, frames.length - 1)),
      storySpeed,
    );
    return () => clearTimeout(timer);
  }, [storyPlaying, view, session, storyStep, storySpeed, frames.length]);
  useEffect(() => {
    const pause = () => {
      if (document.hidden) setStoryPlaying(false);
    };
    document.addEventListener("visibilitychange", pause);
    return () => document.removeEventListener("visibilitychange", pause);
  }, []);
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
  useEffect(() => {
    if (!session?.user?.id) return;
    try {
      const saved = JSON.parse(
        localStorage.getItem(
          `first-moves:exploration:${session.user.id}:${current}`,
        ) || "null",
      );
      if (saved) replayLine(saved);
      setExploration(saved);
    } catch {
      setExploration(null);
    }
  }, [session?.user?.id, current]);
  useEffect(() => {
    if (chatSnapshot) chatDialogRef.current?.showModal();
    else chatDialogRef.current?.close();
  }, [chatSnapshot]);
  function saveExploration(line) {
    setExploration(line);
    try {
      const key = `first-moves:exploration:${session.user.id}:${current}`;
      if (line) localStorage.setItem(key, JSON.stringify(line));
      else localStorage.removeItem(key);
    } catch {
      setError(
        "This browser could not save your exploration. Your course progress is still stored in your account.",
      );
    }
  }
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
      if (!["start", "reset", "move"].includes(action))
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
    setExploration(null);
    setMessages([]);
    setView("puzzle");
    setStoryStep(0);
    setStoryPlaying(false);
    setNav(false);
    setDelta(null);
    setError("");
  }
  async function reset(nextMode = mode) {
    const r = await act("start", { mode: nextMode });
    if (r) {
      saveExploration(null);
      setMessages([]);
      setView("puzzle");
      setStoryStep(0);
      setStoryPlaying(false);
    }
  }
  async function move(uci) {
    if (exploration) {
      saveExploration(addMove(exploration, uci));
      return;
    }
    const trial = addMove({ anchor: fen, moves: [] }, uci);
    if (solved) {
      saveExploration(trial);
      return;
    }
    const r = await act("move", { move: uci });
    if (!r) return;
    const next = r.state.progress[current];
    if (!next.solved && next.fen === fen) {
      saveExploration(trial);
      setMessages((m) => [
        ...m,
        {
          role: "coach",
          text: "Your move stays on the board. It did not meet this exercise’s specific goal, but that is not the same as saying it is a bad chess move. Play out a reply, explore both sides, or undo and try another idea.",
        },
      ]);
    } else {
      setMessages((m) => [...m, { role: "coach", text: r.feedback }]);
      setView("puzzle");
    }
  }
  function explore() {
    saveExploration({ anchor: fen, moves: [] });
    setView("puzzle");
  }
  function undoExploration() {
    if (!exploration?.moves.length) {
      saveExploration(null);
      return;
    }
    const moves = exploration.moves.slice(0, -1);
    if (!moves.length && exploration.anchor === fen) saveExploration(null);
    else saveExploration({ ...exploration, moves });
  }
  function discuss(question = draft) {
    setStoryPlaying(false);
    setCopied(false);
    setChatSnapshot({
      text: chatgptContext({
        lesson,
        fen: activeFen,
        line: view === "story" ? null : exploration,
        question,
      }),
      challenge:
        mode === "challenge" &&
        !progress?.awarded &&
        !progress?.hinted &&
        !solved,
    });
  }
  async function copyContext() {
    if (chatSnapshot.challenge) {
      const r = await act("hint");
      if (!r) return;
      setChatSnapshot((s) => ({ ...s, challenge: false }));
    }
    try {
      await navigator.clipboard.writeText(chatSnapshot.text);
      setCopied(true);
    } catch {
      setError(
        "Clipboard access was denied. Select the position text below and copy it manually.",
      );
    }
  }
  function send(e) {
    e.preventDefault();
    if (!busy) discuss(draft);
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

  const exploredGame = exploration ? replayLine(exploration) : null;
  const activeFen =
    view === "story" ? frame.fen : exploredGame ? exploredGame.fen() : fen;
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
              setStoryPlaying(false);
            }}
            className={view === "story" ? "current" : ""}
          >
            <IconPlayerPlay size={16} />
            Lesson summary
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
            <p>
              {view === "story" ? (
                <>
                  <span className="story-overview">{lesson.story}</span>
                  {storyStep > 0 && (
                    <span className="phone-move-note">
                      <strong>
                        {frame.label} · {frame.side}
                      </strong>
                      {frame.explanation}
                    </span>
                  )}
                </>
              ) : exploredGame ? (
                `You’re exploring your own variation. ${boardStatus(exploredGame)}. Play a reply, undo, or discuss this position in ChatGPT.`
              ) : (
                <>
                  <span className="story-context">
                    {lesson.story.split(". ")[0]}.{" "}
                  </span>
                  {lesson.prompt}
                </>
              )}
            </p>
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
                  lastMove={view === "story" ? frame.lastMove : null}
                  onMove={move}
                  disabled={
                    busy ||
                    view === "story" ||
                    Boolean(exploredGame?.isGameOver())
                  }
                />
                <div className="board-caption">
                  <strong>
                    {view === "story"
                      ? `Step ${storyStep} of ${frames.length - 1} · ${frame.label}`
                      : exploredGame
                        ? boardStatus(exploredGame)
                        : solved
                          ? "Position solved"
                          : new Chess(fen).turn() === "w"
                            ? "White to move"
                            : "Black to move"}
                  </strong>
                  {view === "story" ? (
                    <span className="walkthrough-turn">
                      {new Chess(frame.fen).turn() === "w" ? "White" : "Black"}{" "}
                      to move
                    </span>
                  ) : (
                    <button onClick={() => reset()} disabled={busy}>
                      <IconRefresh size={19} />
                      Replay
                    </button>
                  )}
                </div>
                {view === "story" && (
                  <div
                    className="walkthrough-controls"
                    role="group"
                    aria-label="Walkthrough controls"
                    onKeyDown={(e) => {
                      if (e.target.tagName === "SELECT") return;
                      if (e.key === "ArrowRight") {
                        e.preventDefault();
                        goToStoryStep(storyStep + 1);
                      }
                      if (e.key === "ArrowLeft") {
                        e.preventDefault();
                        goToStoryStep(storyStep - 1);
                      }
                    }}
                  >
                    <div className="walkthrough-buttons">
                      <button
                        aria-label="First position"
                        title="First position"
                        disabled={!storyStep}
                        onClick={() => goToStoryStep(0)}
                      >
                        Start
                      </button>
                      <button
                        aria-label="Previous move"
                        disabled={!storyStep}
                        onClick={() => goToStoryStep(storyStep - 1)}
                      >
                        <IconChevronLeft />
                      </button>
                      <button
                        className="walkthrough-play"
                        aria-label={
                          storyPlaying
                            ? "Pause walkthrough"
                            : "Play walkthrough"
                        }
                        onClick={() => {
                          if (storyStep === frames.length - 1) setStoryStep(0);
                          setStoryPlaying((p) => !p);
                        }}
                      >
                        {storyPlaying ? "Pause" : "Play"}
                      </button>
                      <button
                        aria-label="Next move"
                        disabled={storyStep === frames.length - 1}
                        onClick={() => goToStoryStep(storyStep + 1)}
                      >
                        <IconChevronRight />
                      </button>
                      <button
                        aria-label="Last position"
                        title="Last position"
                        disabled={storyStep === frames.length - 1}
                        onClick={() => goToStoryStep(frames.length - 1)}
                      >
                        End
                      </button>
                    </div>
                    <label className="playback-speed">
                      Autoplay pace{" "}
                      <select
                        aria-label="Autoplay pace"
                        value={storySpeed}
                        onChange={(e) => setStorySpeed(Number(e.target.value))}
                      >
                        <option value={1500}>Quick · 1.5 seconds</option>
                        <option value={3000}>Steady · 3 seconds</option>
                        <option value={5000}>Slow · 5 seconds</option>
                      </select>
                    </label>
                  </div>
                )}
              </div>
              <div className="task-panel">
                {exploration && view !== "story" ? (
                  <div className="exploration-panel">
                    <p className="eyebrow">EXPLORE BOTH SIDES</p>
                    <h2>What happens next?</h2>
                    <p>
                      Your moves stay on the board. Play either side in turn and
                      see how the position changes.
                    </p>
                    <div className="exploration-actions">
                      <button onClick={undoExploration} disabled={busy}>
                        Undo last move
                      </button>
                      <button
                        onClick={() => saveExploration(null)}
                        disabled={busy}
                      >
                        Return to exercise
                      </button>
                    </div>
                    <button
                      className="primary"
                      onClick={() =>
                        discuss(
                          "Help me understand the consequences of the moves I tried.",
                        )
                      }
                    >
                      Discuss this board in ChatGPT
                    </button>
                    <p className="fine">
                      Exploration moves are unscored. This variation is saved on
                      this device; course progress syncs to your account.
                    </p>
                    {delta && (
                      <p
                        role="status"
                        className={delta.value > 0 ? "gain" : "loss"}
                      >
                        This exercise attempt: {delta.value > 0 ? "+" : ""}
                        {delta.value} XP. Further exploration is unscored.
                      </p>
                    )}
                    <p
                      className="variation-moves"
                      aria-label="Exploration move history"
                    >
                      {exploredGame.history().join(" · ") ||
                        "Choose any legal move to begin."}
                    </p>
                  </div>
                ) : view === "story" ? (
                  <div
                    className="move-explanation"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    <p className="eyebrow">
                      {storyStep ? "UNDERSTAND THE MOVE" : "LESSON SUMMARY"}
                    </p>
                    <h2>
                      {storyStep
                        ? `${frame.label} · ${frame.side}`
                        : "The idea to remember"}
                    </h2>
                    <p className="move-reason">{frame.explanation}</p>
                    {storyStep > 0 && (
                      <div className="lesson-takeaway">
                        <strong>Key idea</strong>
                        <p>{walkthrough.takeaway}</p>
                      </div>
                    )}
                    <p className="walkthrough-source">{walkthrough.origin}</p>
                    <p className="fine">
                      This demonstration includes the solution. Watch at your
                      own pace; playback does not change XP.
                    </p>
                    <button
                      className="primary"
                      onClick={() => setView("puzzle")}
                    >
                      Try the position
                      <IconArrowRight size={18} />
                    </button>
                    <button
                      className="text-button"
                      onClick={() => {
                        saveExploration({ anchor: frame.fen, moves: [] });
                        setView("puzzle");
                      }}
                    >
                      Explore from this position
                    </button>
                  </div>
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
                    <button
                      className="text-button explore-button"
                      onClick={explore}
                      disabled={busy}
                    >
                      Explore freely · no scoring
                    </button>
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
            {view === "story" && (
              <div
                className="walkthrough-strip"
                aria-label="Moves in the walkthrough"
              >
                {frames.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => goToStoryStep(i)}
                    aria-current={i === storyStep ? "step" : undefined}
                    className={i === storyStep ? "active" : ""}
                  >
                    {i ? f.label : "Start"}
                  </button>
                ))}
              </div>
            )}
            <div
              className={`activity-footer ${view === "story" ? "walkthrough-footer" : ""}`}
            >
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
                {view === "story"
                  ? "Unscored walkthrough"
                  : exploration
                    ? "Variation saved on this device"
                    : "Course progress synced"}
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
          <div className="chat-handoff-label">
            <strong>Talk it through with ChatGPT</strong>
            <span>Use your subscription · current board snapshot</span>
          </div>
          <form className="composer" onSubmit={send}>
            <input
              aria-label="Question for ChatGPT"
              placeholder="Why was my move risky? What could I try instead?"
              maxLength={2000}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button
              className="send"
              disabled={busy}
              aria-label="Discuss board in ChatGPT"
            >
              <IconSend size={22} />
            </button>
          </form>
          <p className="fine handoff-note">
            Copy the position into ChatGPT to ask freely. It is a snapshot, not
            a live connection.
          </p>
          <button
            className="text-button"
            disabled={busy}
            onClick={() => act("coach", { message: "Explain the idea" })}
          >
            Review the original lesson idea
          </button>
        </div>
        <footer className="page-footer">
          Small steps. Thoughtful moves. Lasting progress.
        </footer>
      </main>
      <dialog
        ref={chatDialogRef}
        className="chat-dialog"
        onCancel={() => setChatSnapshot(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setChatSnapshot(null);
        }}
      >
        <button
          className="dialog-close icon-button"
          aria-label="Close ChatGPT handoff"
          onClick={() => setChatSnapshot(null)}
        >
          <IconX />
        </button>
        <p className="eyebrow">YOUR BOARD, YOUR CONVERSATION</p>
        <h2>Continue in ChatGPT</h2>
        <p>
          Copy this position, open ChatGPT, and paste it into a conversation.
          Sign in with the account that has your subscription.
        </p>
        {chatSnapshot?.challenge && (
          <p className="notice">
            Using outside coaching on this challenge counts as a hint: the solve
            reward becomes +10 XP.
          </p>
        )}
        <label className="snapshot-label">
          Position and question
          <textarea
            aria-label="Board context for ChatGPT"
            readOnly
            value={chatSnapshot?.text || ""}
          />
        </label>
        <div className="handoff-actions">
          <button className="primary" onClick={copyContext} disabled={busy}>
            {copied ? "Copied!" : "1. Copy position"}
          </button>
          <a
            className="primary"
            href="https://chatgpt.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            2. Open ChatGPT
          </a>
        </div>
        <p className="fine">
          No password, email or account token is included. If you change the
          board, copy a new snapshot. ChatGPT replies stay in ChatGPT.
        </p>
      </dialog>
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
            setStoryPlaying(false);
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
