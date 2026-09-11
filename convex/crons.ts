import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Public demo only: seed.demoReset returns early unless DEMO_MODE=1.
crons.interval("reset public demo", { hours: 1 }, internal.seed.demoReset, {});

export default crons;
