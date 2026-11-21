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
