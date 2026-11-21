import { readFileSync, writeFileSync } from "node:fs";
const destination = process.argv[2] || "/workspace";
const core = readFileSync(
  "supabase/functions/_shared/coach-handler.js",
  "utf8",
);
writeFileSync(
  `${destination}/first-moves-ai-coach.ts`,
  "// Dashboard-ready Edge Function. No secrets belong in this file.\nimport { Chess } from 'npm:chess.js@1.4.0';\n" +
    core +
    "\nDeno.serve(createCoachHandler({Chess,env:(name:string)=>Deno.env.get(name)}));\n",
);
writeFileSync(
  `${destination}/first-moves-ai-setup.sql`,
  readFileSync("supabase/003_ai_coach.sql"),
);
console.log(
  "Exported dashboard-ready function and additive database migration. No credential values included.",
);
