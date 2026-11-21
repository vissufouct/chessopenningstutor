# First Moves visual QA

Source visual truth: `/workspace/generated_images/exec-4bc2f84e-4d89-4b6d-8977-04228154798e.png` and the mobile iteration displayed in the conversation.

Implementation: `test/artifacts/desktop.png`, `test/artifacts/mobile.png`, `test/artifacts/mobile-replay.png`.

Viewport: desktop 1440 × 1024 CSS pixels, mobile 390 × 844 CSS pixels, device scale 1. Desktop source is 1487 × 1058; comparisons normalize both to equal width. `test/artifacts/comparison.png` renders source and implementation together at 715px width each. Full-size captures were also opened for typography, pieces and control inspection.

State: chapter 1, first puzzle, Challenge mode. Mock account begins at 0 XP rather than the reference's illustrative 140 XP. Screenshots use simulated Supabase HTTP backed by real local Postgres migrations. No live authentication or remote database readiness is implied.

## Findings and iteration history

- Initial P2: the oversized desktop activity pushed the chat composer below the intended laptop viewport. Limited the board track, tightened header/section spacing and recaptured.
- Initial P2: mobile vertical spacing placed the composer too far down. Reduced duplicate labels, compacted spacing, and retained a large square board. Latest mobile capture fits controls and composer in 844px without horizontal overflow.
- Initial P2: solved challenge replay still displayed a negative XP rule. Fixed copy to reflect the server's zero-penalty replay behavior; tested again.
- Initial P2: desktop task and rule type was too small relative to the source. Increased primary instructional typography and restored a short book-context sentence. Post-fix browser checks pass.

## Fidelity surfaces

- Typography: self-hosted DM Sans, navy headings and readable instructional text. Some metadata remains intentionally smaller; headings and instructions wrap cleanly.
- Layout: same course rail, chat introduction, embedded board, adjacent task/rules, composer and source reference. Twelve-lesson navigation replaces the reference's abbreviated sidebar; lesson stages move above the board. This is an intentional functional expansion within the selected two chapters.
- Colors: white, pale periwinkle surfaces, blue board and actions; green rewards and coral/red penalties. No decorative gradients.
- Assets: real conventional chess piece PNGs, Tabler knight and UI icons, self-hosted font. All squares and piece placements are generated from validated chess positions, correcting potential mockup inaccuracies.
- Copy: actual course prompts, source citations, exact XP rules, and explicit guided-coach limitations. Source details open in a dialog; longer story text appears in replay mode.

## Verification

Headless Chromium captured actual rendered React UI. Browser interactions tested: login UI, board selections, legal solutions, duplicate XP prevention, reflection, reload persistence through the mock backend, hints/penalties, source dialog, story replay, chat controls, mobile navigation and logout. No JavaScript page errors. No horizontal overflow at 320, 390, 768 or 1440px. Full-size captures provided focused inspection of board pieces, labels and controls in addition to the combined composition comparison.

Shared cloud browser tools are unavailable; verification used installed Chromium through Playwright, as supported by the cloud-desktop fallback. Live Supabase and deployed-site verification remain blocked by network/project setup, separately from visual QA.

## Follow-up polish

P3: longer coaching conversations scroll within their own area. Additional animation and a broader conversational model are outside this release. Reference-to-code typography is intentionally compact enough to keep the full task visible on a phone.

final result: passed

## Exploration and subscription coaching update

User-directed functional revision: off-target legal moves remain on the board, an exploration panel replaces the task rules while exploring, and open-ended coaching uses an explicit ChatGPT handoff. Existing reference colors, board assets and responsive structure are retained; the new controls intentionally extend that reference.

Evidence: `test/artifacts/exploration-desktop.png` (1440px desktop) and `test/artifacts/exploration-mobile.png` (390px phone), opened and visually inspected. The phone page scrolls naturally to accommodate exploration history and the subscription handoff. No horizontal clipping. The board remains prominent, undo and return controls are reachable, and handoff copy does not imply a live ChatGPT integration. Introductory copy now tracks the explored position rather than repeating a potentially stale White-to-move exercise instruction.

Validation: browser checks passed for retained mistakes, legal replies, reload recovery, undo, return, ChatGPT snapshot contents, clipboard copy, challenge hint accounting, underpromotion and logout. Core SQL and all lesson tests continue to pass. Five test cases pass; one case contains the complete course/database suite. Existing Supabase schema is unchanged.

final result: passed

## Annotated walkthrough update

User-requested lesson summaries and move explanations are added within the existing board layout. Each lesson has start/back/play/next/end controls, speed selection, a clickable move list, highlighted last-move squares, a summary/takeaway, and original explanations for both sides. Mobile lesson-stage controls are now visible; the current move explanation appears above the board on a phone.

Evidence inspected: `test/artifacts/walkthrough-desktop.png` at 1440 × 1024 and `test/artifacts/walkthrough-mobile.png` at 390 × 844 (full-page captures). Natural vertical scrolling accommodates the lesson material; there is no horizontal overflow. Desktop instructions sit beside the board; on mobile the short move explanation is repeated above it for simultaneous reading and watching. Controls remain labelled and reachable.

Checks passed: all 12 annotated lines are legal; the demonstration reaches Qxg4, kingside castling and Legall's checkmate as intended. Browser tests cover exact backward restoration, forward navigation, end/start boundaries, clickable move jumping, autoplay ending automatically, pause, mobile access, and unchanged XP/puzzle state. Existing exploration and authentication-contract tests pass. No new Supabase setup is required.

final result: passed


## In-app API coach revision

Added conversational replies beneath the active board, recent conversation context, explicit AI/subscription selection, a new-conversation control, pending state and retryable errors that preserve the draft. Conversation scroll follows replies. Mobile screenshot `test/artifacts/ai-chat-mobile.png` inspected at 390px: controls wrap without horizontal overflow and board remains legible. Desktop evidence: `test/artifacts/ai-chat-desktop.png`. Screenshots use clearly marked test replies.

Handler and migration tests validate authenticated allowlist access, actual legal board context, private credentials, role restrictions, durable quotas and sanitized failures. Chromium checks cover two follow-ups, exact exploration FEN, failed request/retry and subscription fallback alongside existing lessons and playback. OpenAI and Supabase HTTP are mocked; live activation requires the documented migration, Edge Function deployment and replacement secret.
