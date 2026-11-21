import { Chess } from "npm:chess.js@1.4.0";
import { createCoachHandler } from "../_shared/coach-handler.js";
Deno.serve(
  createCoachHandler({ Chess, env: (name: string) => Deno.env.get(name) }),
);
