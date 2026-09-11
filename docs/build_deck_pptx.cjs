/* AEGIS finale deck -> editable .pptx
   13.33 x 7.5in. One vertical rhythm, cards sized to content, images large. */
const P = require("pptxgenjs");
const d = new P();
const A = require("path").join(__dirname, "assets") + "/";
const LIVE = "https://490cbec14e504e7aa506bc0208460713.prod.enterapp.pro";

d.layout = "LAYOUT_WIDE";
d.author = "Team Ninja Coders";
d.title = "AEGIS - AI Emergency Grid & Incident System";

// palette
const PAPER="FBF9F4", PANEL="F3EFE6", INK="26241E", MUTE="6E6960",
      EMBER="E8590C", TEAL="0F8B8D", RED="D6453D", GREEN="0A8F62",
      CHAR="2A2721", LINE="E4DDCE", CREAM="E8DFCB", SAND="C9BFA8";

// one type scale, used everywhere
const T = { kick:10, title:25, sub:12, lab:9.5, head:12, body:10.5, small:9, stat:34, statlab:9.5 };

// vertical rhythm
const M = 0.5;                 // page margin
const W = 13.33, H = 7.5;
const CW = W - M*2;            // content width 12.33
const BODY_TOP = 1.34;         // where content starts when there is no subtitle
const BODY_SUB = 1.62;         // ... and when there is one
const BOTTOM = 7.06;           // content must not pass this

const slide = () => { const s = d.addSlide(); s.background = { color: PAPER }; return s; };

function head(s, kick, title, sub) {
  s.addText(kick, { x:M, y:0.30, w:CW, h:0.22, fontFace:"Calibri", fontSize:T.kick,
    color:EMBER, bold:true, charSpacing:1.6, margin:0 });
  s.addText(title, { x:M, y:0.54, w:CW, h:0.46, fontFace:"Cambria", fontSize:T.title,
    color:INK, bold:true, margin:0 });
  if (sub) s.addText(sub, { x:M, y:1.02, w:CW, h:0.28, fontFace:"Calibri",
    fontSize:T.sub, color:MUTE, margin:0 });
}
function card(s, x, y, w, h, fill, line) {
  s.addShape(d.ShapeType.roundRect, { x, y, w, h, rectRadius:0.08,
    fill:{ color:fill || PANEL }, line:{ color:line || LINE, width:1 } });
}
function lab(s, t, x, y, color, w) {
  s.addText(t, { x, y, w:w||4, h:0.2, fontFace:"Calibri", fontSize:T.lab,
    color:color||EMBER, bold:true, charSpacing:1.3, margin:0 });
}
function body(s, t, x, y, w, h, size, color) {
  s.addText(t, { x, y, w, h, fontFace:"Calibri", fontSize:size||T.body,
    color:color||INK, margin:0, lineSpacing:(size||T.body)*1.42, valign:"top" });
}
function stat(s, x, y, w, num, lines, color) {
  s.addText(num, { x, y, w, h:0.58, fontFace:"Cambria", fontSize:T.stat,
    color, bold:true, margin:0 });
  s.addText(lines, { x, y:y+0.56, w, h:0.5, fontFace:"Calibri", fontSize:T.statlab,
    color:MUTE, margin:0, lineSpacing:12.5 });
}

/* ─────────── 1 · TITLE ─────────── */
{
  const s = slide();
  s.addShape(d.ShapeType.rect, { x:0, y:0, w:W, h:3.30, fill:{color:CHAR}, line:{color:CHAR} });
  s.addText("COGNITIVE CHAOS 2026   ·   FINALE   ·   CONVEX OPEN INNOVATION TRACK",
    { x:M, y:0.42, w:9, h:0.24, fontFace:"Calibri", fontSize:T.kick, color:SAND, bold:true, charSpacing:1.6, margin:0 });
  s.addText("AEGIS", { x:M, y:0.78, w:7, h:1.0, fontFace:"Cambria", fontSize:54, color:PAPER, bold:true, charSpacing:2, margin:0 });
  s.addText("AI Emergency Grid & Incident System",
    { x:M, y:1.76, w:8, h:0.4, fontFace:"Cambria", fontSize:19, color:CREAM, margin:0 });
  s.addText("Every phone in the crowd becomes a sensor. Every second becomes coordinated action.",
    { x:M, y:2.16, w:9, h:0.32, fontFace:"Calibri", fontSize:13, color:EMBER, italic:true, margin:0 });

  s.addText("A working, publicly reachable prototype — not a mockup.",
    { x:M, y:2.60, w:7, h:0.26, fontFace:"Calibri", fontSize:10, color:"9C9384", margin:0 });
  s.addText("Open the live system  →", { x:M, y:2.86, w:3.2, h:0.3,
    fontFace:"Calibri", fontSize:13, color:EMBER, bold:true, margin:0, hyperlink:{ url:LIVE } });
  s.addText(LIVE.replace("https://",""), { x:M+3.1, y:2.92, w:5, h:0.24,
    fontFace:"Calibri", fontSize:8, color:"7E7568", margin:0 });

  s.addImage({ path:A+"qr_live.png", x:11.45, y:0.72, w:1.42, h:1.42 });
  s.addText("Scan to open", { x:11.25, y:2.18, w:1.82, h:0.22, fontFace:"Calibri",
    fontSize:8.5, color:"9C9384", align:"center", margin:0 });

  card(s, M, 3.56, CW, 3.50);
  lab(s, "PROJECT TITLE", M+0.28, 3.74);
  s.addText("AEGIS — AI Emergency Grid & Incident System",
    { x:M+0.28, y:3.96, w:9, h:0.34, fontFace:"Cambria", fontSize:16, color:INK, bold:true, margin:0 });

  const col = [M+0.28, 3.35, 6.20];
  ["TEAM","EVENT","TRACK"].forEach((t,i)=>lab(s, t, col[i], 4.48, EMBER, 3));
  s.addText("Ninja Coders",        { x:col[0], y:4.70, w:2.8, h:0.3, fontFace:"Calibri", fontSize:12.5, color:INK, bold:true, margin:0 });
  s.addText("Cognitive Chaos 2026", { x:col[1], y:4.70, w:2.8, h:0.3, fontFace:"Calibri", fontSize:12.5, color:INK, bold:true, margin:0 });
  s.addText("Convex — Open Innovation (self-proposed problem)",
    { x:col[2], y:4.70, w:6.3, h:0.3, fontFace:"Calibri", fontSize:12.5, color:INK, bold:true, margin:0 });

  lab(s, "PROBLEM STATEMENT", M+0.28, 5.18, MUTE);
  body(s, "Emergencies at mass gatherings unfold in seconds, but incident information is scattered, duplicated and unverified, and dispatch is manual — wasting the 5 to 10 minute window in which a crush or cardiac arrest is still survivable.",
    M+0.28, 5.40, 11.7, 0.6, 11.5);

  s.addShape(d.ShapeType.line, { x:M+0.28, y:6.16, w:11.7, h:0, line:{color:LINE, width:1} });
  lab(s, "TEAM MEMBERS", M+0.28, 6.30, MUTE);
  s.addText("Sourav Kumar   ·   Manish Joshi   ·   Siddharth Singh   ·   Rajat Kushwaha",
    { x:M+0.28, y:6.54, w:7.5, h:0.3, fontFace:"Calibri", fontSize:12, color:INK, margin:0 });
  s.addText("A real-time web platform — nothing to install",
    { x:8.4, y:6.54, w:3.6, h:0.3, fontFace:"Calibri", fontSize:10, color:TEAL, bold:true, align:"right", margin:0 });
}

/* ─────────── 2 · PROBLEM ─────────── */
{
  const s = slide();
  head(s, "PROBLEM & EXISTING GAP", "In a crowd, the tools we rely on are the tools that fail");

  const sx = [M, 3.55, 6.60, 9.85];
  stat(s, sx[0], BODY_TOP, 3.0, "121",  "lives lost, Hathras\nstampede, 2024", RED);
  stat(s, sx[1], BODY_TOP, 3.0, "11",   "lives lost, RCB victory crowd,\nBengaluru stadium, 2025", RED);
  stat(s, sx[2], BODY_TOP, 3.2, "5-10", "minutes — the survivable window\nin a crush or cardiac arrest", EMBER);
  stat(s, sx[3], BODY_TOP, 3.0, "0",    "shared live picture of the venue\nat any of these events", INK);

  s.addText("Police, medics and fire were already on site every time. What was missing was information, not manpower.",
    { x:M, y:2.62, w:CW, h:0.3, fontFace:"Calibri", fontSize:12, color:INK, italic:true, margin:0 });

  const cy = 3.10, ch = BOTTOM - cy;      // cards fill to the bottom margin
  card(s, M, cy, 6.02, ch);
  lab(s, "WHY CALLING FOR HELP DOES NOT WORK IN A CROWD", M+0.26, cy+0.22, RED, 5.6);
  body(s, [
    { text:"You cannot hear, and cannot be heard. ", options:{bold:true} },
    { text:"A crowd runs past 100 dB. The control room mishears the location — the one detail that matters.\n\n" },
    { text:"The cell network is congested. ", options:{bold:true} },
    { text:"Thousands of phones on one tower means voice calls drop exactly when everyone needs them at once.\n\n" },
    { text:"Nobody knows the number. ", options:{bold:true} },
    { text:"The venue control room number is not on your ticket, and 112 cannot see inside the venue.\n\n" },
    { text:"A call carries one report, once. ", options:{bold:true} },
    { text:"Thirty callers about one crush create thirty conversations, not one prioritised incident." },
  ], M+0.26, cy+0.52, 5.5, ch-0.75);

  card(s, 6.81, cy, 6.02, ch);
  lab(s, "WHO IS AFFECTED, AND WHAT THEY HAVE TODAY", 7.07, cy+0.22, MUTE, 5.6);
  body(s, [
    { text:"Attendees", options:{bold:true} }, { text:" — no way to report that works in noise and congestion.\n" },
    { text:"Marshals and volunteers", options:{bold:true} }, { text:" — first to see it, no channel to escalate.\n" },
    { text:"Medics, fire and police", options:{bold:true} }, { text:" — on site, but sent by guesswork.\n" },
    { text:"Organisers and administration", options:{bold:true} }, { text:" — own the liability, see fragments.\n\n" },
    { text:"Current solution: walkie-talkies and WhatsApp groups.\n", options:{bold:true} },
    { text:"No single live picture — every channel sees a fragment. Duplicate, unverified reports with no way to merge them. No severity triage, so a lost phone and a cardiac arrest arrive identical. Manual dispatch spends minutes working out who is nearest. No audit trail to learn from." },
  ], 7.07, cy+0.52, 5.5, ch-0.75);
}

/* ─────────── 3 · SOLUTION ─────────── */
{
  const s = slide();
  head(s, "PROPOSED SOLUTION", "One tap replaces the call that cannot get through");

  const LW = 7.60;                          // left column; phones get the wider right column
  body(s, [
    { text:"AEGIS is a live emergency response system for crowded places. Anyone reports in " },
    { text:"one tap", options:{bold:true} },
    { text:" — no login, no OTP, no typing and no speaking. A tap is a few hundred bytes, so it gets through congested networks where a voice call will not. An AI scores how serious it is, merges duplicate reports of the same event into one incident, and retrieves the correct response steps from " },
    { text:"real NDMA government guidance", options:{bold:true} },
    { text:". A control room dashboard dispatches the nearest right-role unit in one click, and the person who reported it watches help approach with a live ETA." },
  ], M, BODY_TOP, LW, 1.15, 11.5);

  const steps = [
    ["01","REPORT",EMBER,"One tap sends it, with GPS attached automatically. Photo, description and a callback number are optional and offered afterwards — help is already moving while you add them."],
    ["02","AI TRIAGE",TEAL,"The AI scores severity P1–P4, writes an operator summary, merges duplicates, and retrieves protocol steps from real NDMA and Red Cross guidance by meaning, not keyword."],
    ["03","COORDINATE",GREEN,"The nearest role-matched unit is dispatched in one click. The reporter sees a live ETA. Every action is written to an immutable audit timeline."],
  ];
  const sy = 2.72, sh = 2.58, sw = 2.42;
  steps.forEach(([n,t,c,txt], i) => {
    const x = M + i*2.59;
    card(s, x, sy, sw, sh);
    s.addText(n, { x:x+0.22, y:sy+0.18, w:1, h:0.4, fontFace:"Cambria", fontSize:21, color:c, bold:true, margin:0 });
    s.addText(t, { x:x+0.22, y:sy+0.60, w:2.2, h:0.28, fontFace:"Cambria", fontSize:T.head, color:INK, bold:true, charSpacing:0.6, margin:0 });
    body(s, txt, x+0.22, sy+0.94, sw-0.44, 1.25, 9.5);
  });

  const by = 5.46;
  card(s, M, by, LW, BOTTOM-by, CHAR, CHAR);
  lab(s, "WHAT MAKES IT DIFFERENT", M+0.26, by+0.20, SAND, 5);
  body(s, [
    { text:"The advice is traceable to a government document", options:{bold:true, color:PAPER} },
    { text:", never invented — and the system ", options:{color:CREAM} },
    { text:"degrades instead of failing", options:{bold:true, color:PAPER} },
    { text:": if the AI is unavailable it falls back to deterministic rules and says so on screen, while still triaging and dispatching.", options:{color:CREAM} },
  ], M+0.26, by+0.50, LW-0.52, 1.0, 10.5, CREAM);

  // phones, true 0.489 aspect, tall so they read on a projector
  // 722x1477 source, aspect 0.489 — sized as large as the column allows
  s.addImage({ path:A+"shot_reporter_clean.png", x:8.35, y:BODY_TOP, w:2.16, h:4.42 });
  s.addImage({ path:A+"shot_guidance_clean.png", x:10.67, y:BODY_TOP, w:2.16, h:4.42 });
  s.addText("Report in one tap", { x:8.35, y:5.84, w:2.16, h:0.24, fontFace:"Calibri", fontSize:8.5, color:MUTE, italic:true, align:"center", margin:0 });
  s.addText("NDMA guidance, sourced", { x:10.67, y:5.84, w:2.16, h:0.24, fontFace:"Calibri", fontSize:8.5, color:MUTE, italic:true, align:"center", margin:0 });
}

/* ─────────── 4 · ARCHITECTURE ─────────── */
{
  const s = slide();
  head(s, "TECHNICAL APPROACH & ARCHITECTURE", "EnterPro front end, Convex back end, one AI brain");

  const boxT = (s,x,y,w,h,title,rows,col,dark)=>{
    card(s,x,y,w,h, dark?CHAR:PANEL, dark?CHAR:LINE);
    lab(s,title,x+0.2,y+0.18, dark?SAND:col, w-0.4);
    body(s,rows,x+0.2,y+0.46,w-0.4,h-0.62, 9.5, dark?CREAM:INK);
  };

  boxT(s, M, BODY_TOP, 3.05, 1.95, "INPUT — ANY PHONE BROWSER",
    "Reporter (public, no login)\nResponder (staff passcode)\nOne tap · GPS · photo · callback\nBuilt and deployed on EnterPro", EMBER);
  s.addText("→", { x:3.62, y:2.10, w:0.4, h:0.4, fontSize:20, color:MUTE, align:"center", bold:true, margin:0 });

  boxT(s, 4.08, BODY_TOP, 4.55, 3.55, "PROCESS — CONVEX BACKEND", [
    { text:"Mutations  ", options:{bold:true} }, { text:"ingest each report atomically, merge duplicates within 120 s\n\n" },
    { text:"Actions  ", options:{bold:true} }, { text:"call the LLM for severity, summary and protocol selection\n\n" },
    { text:"Vector search  ", options:{bold:true} }, { text:"1536-dimension semantic retrieval over the NDMA corpus\n\n" },
    { text:"Reactive DB  ", options:{bold:true} }, { text:"pushes live state to every open screen, no polling\n\n" },
    { text:"Scheduler  ", options:{bold:true} }, { text:"escalates an unacknowledged P1 after 60 seconds\n\n" },
    { text:"File storage  ", options:{bold:true} }, { text:"incident photographs as evidence" },
  ], TEAL, true);
  s.addText("→", { x:8.72, y:2.10, w:0.4, h:0.4, fontSize:20, color:MUTE, align:"center", bold:true, margin:0 });

  boxT(s, 9.18, BODY_TOP, 3.15, 1.95, "OUTPUT — CONTROL ROOM",
    "Live incident map and queue\nAI panel with NDMA actions\nRole-matched nearest dispatch\nExit-guidance broadcast to all phones", GREEN);

  boxT(s, M, 3.44, 3.05, 1.95, "THE AI LAYER",
    "Gemini for triage and summary\nEmbeddings for semantic retrieval\nThree-model fallback chain\nDeterministic rules if AI is down", RED);
  boxT(s, 9.18, 3.44, 3.15, 1.95, "GROUNDING & INTEGRATIONS",
    "14 protocols from real NDMA and Indian Red Cross guidance\nSource shown on every step\nHelplines 112 · 100 · 101 · 102, one-tap dial", INK);

  const wy = 5.62;
  card(s, M, wy, CW, BOTTOM-wy);
  body(s, [
    { text:"Why Convex.  ", options:{bold:true, color:TEAL} },
    { text:"It replaces four separate systems with one typed TypeScript backend — the database, the serverless functions, the vector database for our NDMA search, and the job scheduler for our escalation timer. Every query is a live subscription, so the dashboard updates with zero real-time networking code written by us. That is the only reason a live product of this shape was buildable at our scale." },
  ], M+0.28, wy+0.22, CW-0.56, 1.0, 10.5);
}

/* ─────────── 5 · DEMO WALKTHROUGH ─────────── */
{
  const s = slide();
  head(s, "DEMO WALKTHROUGH", "What we will show you live, in this order",
    "The dashboard starts empty. Everything you see appear is filed live, from a phone in this room.");

  // command shot is 1917x917 (aspect 2.09) — run it wide so it reads on a projector
  const iw = 8.05, ih = iw/2.09;                     // 3.85, true aspect
  s.addImage({ path:A+"shot_command_clean.png", x:M, y:BODY_SUB, w:iw, h:ih });
  s.addText("Command dashboard — live venue map, incident queue, AI panel, NDMA actions, reporter callback and photo evidence",
    { x:M, y:BODY_SUB+ih+0.06, w:iw, h:0.24, fontFace:"Calibri", fontSize:8.5, color:MUTE, italic:true, margin:0 });

  const items = [
    ["1","REPORTER  —  a teammate files a real emergency","Opens the public link, taps SOS, taps Fire. One tap, no login. GPS places it at the Food Court automatically."],
    ["2","COMMAND  —  it appears in about one second","AI has scored it P1 Critical, written the summary and retrieved the fire protocol from NDMA guidance, with the source shown."],
    ["3","COMMAND  —  duplicate merge, then dispatch","A second report of the same fire merges into one incident with a count of two. One click dispatches the nearest fire unit."],
    ["4","RESPONDER — accept, then broadcast","The unit accepts on a second phone; the reporter's screen flips to a live ETA. We broadcast exit guidance to every phone."],
  ];
  const rx = 8.86, rw = 3.97;
  items.forEach(([n,t,b], i) => {
    const y = BODY_SUB + i*0.95;
    s.addText(n, { x:rx, y, w:0.3, h:0.26, fontFace:"Cambria", fontSize:13, color:EMBER, bold:true, margin:0 });
    s.addText(t, { x:rx+0.3, y, w:rw-0.3, h:0.26, fontFace:"Calibri", fontSize:10.5, color:INK, bold:true, margin:0 });
    body(s, b, rx+0.3, y+0.26, rw-0.3, 0.62, 9);
  });

  const hy = 5.86;
  card(s, M, hy, CW, BOTTOM-hy, CHAR, CHAR);
  lab(s, "WE WILL SAY THIS BEFORE YOU ASK", M+0.28, hy+0.16, SAND, 4);
  body(s, [
    { text:"Reporting, triage, merging, dispatch and tracking are all real and running. Venue responders are ", options:{color:CREAM} },
    { text:"simulated", options:{bold:true, color:PAPER} },
    { text:" for this demo, not live staff. Location is device GPS only, never from a phone number.", options:{color:CREAM} },
  ], M+0.28, hy+0.44, CW-0.56, 0.5, 9.5, CREAM);
}

/* ─────────── 6 · FEATURES ─────────── */
{
  const s = slide();
  head(s, "KEY FEATURES & DIFFERENTIATOR", "Six capabilities, and what makes each one hard to copy");

  const F = [
    ["Live command map","Every report appears on every dashboard the instant it is filed — one shared source of truth for the venue.","Convex reactive queries are live subscriptions"],
    ["AI triage and de-duplication","Severity scored by the LLM; reports of the same event, same zone, within 120 seconds merge into one counted incident.","Actions call the model, mutations write the result"],
    ["Protocol-grounded response","Steps retrieved from real NDMA guidance by meaning, with the source document named on screen.","Convex vector search over the protocol table"],
    ["Role-matched dispatch","The nearest correct unit in one click — a medic for medical, a fire unit for fire. Unacknowledged P1 escalates in 60 s.","Scheduler functions and indexed queries"],
    ["Live responder tracking","The reporter watches the assigned unit approach with a live ETA, the way you track a delivery.","Location updates through the reactive database"],
    ["Evidence and audit trail","Photograph, callback number and an immutable timestamped timeline for every incident.","File storage plus an append-only event log"],
  ];
  const cw = 3.97, chh = 1.72;
  F.forEach(([t,b,cx], i) => {
    const x = M + (i%3)*4.19, y = BODY_TOP + Math.floor(i/3)*1.92;
    card(s, x, y, cw, chh);
    s.addText(String(i+1).padStart(2,"0"), { x:x+0.22, y:y+0.16, w:0.4, h:0.26, fontFace:"Cambria", fontSize:12, color:EMBER, bold:true, margin:0 });
    s.addText(t, { x:x+0.62, y:y+0.16, w:cw-0.84, h:0.26, fontFace:"Cambria", fontSize:11.5, color:INK, bold:true, margin:0 });
    body(s, b, x+0.22, y+0.50, cw-0.44, 0.86, 9.5);
    s.addText(cx, { x:x+0.22, y:y+chh-0.34, w:cw-0.44, h:0.24, fontFace:"Calibri", fontSize:8, color:TEAL, bold:true, margin:0 });
  });

  const dy = 5.42;
  card(s, M, dy, CW, BOTTOM-dy, CHAR, CHAR);
  lab(s, "WHAT ACTUALLY SETS US APART", M+0.28, dy+0.18, SAND, 5);
  body(s, [
    { text:"1. The AI cannot invent procedure. ", options:{bold:true, color:PAPER} },
    { text:"It searches real NDMA and Red Cross documents first and may only compose steps from what it retrieved — the source is printed on screen.    ", options:{color:CREAM} },
    { text:"2. It degrades instead of failing. ", options:{bold:true, color:PAPER} },
    { text:"If the AI is rate-limited we fall through three models, then to deterministic rules, and the dashboard says so openly.\n", options:{color:CREAM} },
    { text:"3. Panic becomes signal. ", options:{bold:true, color:PAPER} },
    { text:"Thirty reports of one crush become one P1 incident with a count of thirty.    ", options:{color:CREAM} },
    { text:"4. The venue is data, not code. ", options:{bold:true, color:PAPER} },
    { text:"One record re-points AEGIS from a campus to Jantar Mantar or a stadium, switchable live from the dashboard.", options:{color:CREAM} },
  ], M+0.28, dy+0.46, CW-0.56, 1.05, 9.5, CREAM);
}

/* ─────────── 7 · IMPACT ─────────── */
{
  const s = slide();
  head(s, "IMPACT & FEASIBILITY", "Minutes saved are lives saved — and it runs today for almost nothing");

  const sx = [M, 3.55, 6.85, 10.05];
  stat(s, sx[0], BODY_TOP, 3.0, "3",     "venues live across two states,\nswitchable from the dashboard", TEAL);
  stat(s, sx[1], BODY_TOP, 3.2, "14",    "real NDMA and Red Cross protocols\ngrounding every recommendation", EMBER);
  stat(s, sx[2], BODY_TOP, 3.1, "₹0", "infrastructure cost at pilot scale —\nfree tiers, no servers to run", GREEN);
  stat(s, sx[3], BODY_TOP, 2.8, "1 tap", "for any citizen to summon a\nrole-matched responder", INK);

  const cy = 2.70, ch = 2.62;
  card(s, M, cy, 6.02, ch);
  lab(s, "WHO BENEFITS", M+0.26, cy+0.20, EMBER, 5);
  body(s, [
    { text:"Every attendee", options:{bold:true} }, { text:" — nothing to install, it is a web link.\n" },
    { text:"Marshals and volunteers", options:{bold:true} }, { text:" — a channel that works in noise.\n" },
    { text:"Medics, fire and police", options:{bold:true} }, { text:" — sent to the right spot, first time.\n" },
    { text:"Organisers and district administration", options:{bold:true} }, { text:" — one live picture, and an audit trail afterwards.\n\n" },
    { text:"Beyond event venues this extends directly to campuses, religious gatherings, railway stations, hospitals and industrial sites — anywhere crowds and risk meet." },
  ], M+0.26, cy+0.50, 5.5, ch-0.7, 10);

  card(s, 6.81, cy, 6.02, ch);
  lab(s, "WHY IT IS REALISTICALLY DEPLOYABLE", 7.07, cy+0.20, TEAL, 5.6);
  body(s, [
    { text:"No app store, no install. ", options:{bold:true} }, { text:"A venue prints a QR code; anyone with a browser can report.\n\n" },
    { text:"The venue is a data record. ", options:{bold:true} }, { text:"Zones, exits and responding units — a new site needs no code change.\n\n" },
    { text:"Serverless throughout. ", options:{bold:true} }, { text:"Convex scales with crowd size and the front end is static. We load-tested 50 simultaneous reports with zero failures; capacity is not our bottleneck, it is a platform concern.\n\n" },
    { text:"Costs nothing to pilot. ", options:{bold:true} }, { text:"A district could run this for a festival on free tiers." },
  ], 7.07, cy+0.50, 5.5, ch-0.7, 10);

  const ly = 5.56;
  card(s, M, ly, CW, BOTTOM-ly);
  lab(s, "HONEST LIMITS — WE STATE THESE OURSELVES", M+0.28, ly+0.18, RED, 6);
  body(s, [
    { text:"Venue responders are " }, { text:"simulated", options:{bold:true} }, { text:" for this demo, not live staff. There is " },
    { text:"no AI verification of photographs", options:{bold:true} }, { text:" yet — the image is shown to the operator for human judgement. " },
    { text:"Offline queueing is designed but not implemented", options:{bold:true} },
    { text:", so a report needs a moment of connectivity. The operator login gates the screen rather than the API; production uses role-scoped authentication. Facility coordinates in our alternate venues are real institutions at approximate positions, not a verified government feed." },
  ], M+0.28, ly+0.46, CW-0.56, 0.95, 9.5);
}

/* ─────────── 8 · ROADMAP + TEAM ─────────── */
{
  const s = slide();
  head(s, "ROADMAP & TEAM", "What we build next, and who built this");

  const ry = BODY_TOP, rh = 2.16;
  card(s, M, ry, CW, rh);
  lab(s, "WHAT COMES NEXT", M+0.28, ry+0.18);
  const R = [
    ["Voice reporting","Speak instead of tapping, for anyone who cannot type or see the screen in an emergency."],
    ["Offline-first reporting","Queue the report on the device and sync the moment signal returns."],
    ["AI photo verification","Flag reports whose image does not match the reported category."],
    ["Crowd-density warning","Read density from CCTV and warn before the crush, not after."],
    ["Verified facility data","Ingest the government facility directory for real hospital, police and fire locations nationwide."],
    ["Open-source release","So any district administration or college can run it — cost should never be why a crowd has no system."],
  ];
  R.forEach(([t,b], i) => {
    const x = M+0.28 + (i%3)*4.02, y = ry+0.50 + Math.floor(i/3)*0.82;
    s.addText(t, { x, y, w:3.75, h:0.24, fontFace:"Calibri", fontSize:10, color:EMBER, bold:true, margin:0 });
    body(s, b, x, y+0.24, 3.75, 0.5, 8.8, MUTE);
  });

  const ty = 3.72, th = 2.22;
  card(s, M, ty, 7.60, th);
  lab(s, "TEAM NINJA CODERS", M+0.28, ty+0.20);
  [["Sourav Kumar","Team lead — EnterPro front end, design system, pitch and live demo"],
   ["Siddharth Singh","Convex data core — schema, de-duplication, dispatch and escalation logic"],
   ["Rajat Kushwaha","AI triage and retrieval — LLM prompting, protocol grounding, fallback chain"],
   ["Manish Joshi","Integration, deployment and testing — EnterPro to Convex bridge, load and failure testing"]
  ].forEach(([n,r], i) => {
    const y = ty+0.56 + i*0.40;
    s.addText(n, { x:M+0.28, y, w:1.9, h:0.26, fontFace:"Calibri", fontSize:10.5, color:INK, bold:true, margin:0 });
    s.addText(r, { x:M+2.22, y, w:5.2, h:0.26, fontFace:"Calibri", fontSize:9, color:MUTE, margin:0 });
  });

  card(s, 8.35, ty, 4.48, th, CHAR, CHAR);
  lab(s, "TRY IT YOURSELF, RIGHT NOW", 8.60, ty+0.20, SAND, 3.6);
  body(s, "Open it on your own phone and file a report. It appears on our dashboard in about a second.",
    8.60, ty+0.50, 2.35, 0.9, 9.5, CREAM);
  s.addText("Open the live system  →", { x:8.60, y:ty+1.46, w:2.6, h:0.28,
    fontFace:"Calibri", fontSize:11, color:EMBER, bold:true, margin:0, hyperlink:{ url:LIVE } });
  s.addText(LIVE.replace("https://",""), { x:8.60, y:ty+1.74, w:2.6, h:0.2,
    fontFace:"Calibri", fontSize:6.5, color:"8E8577", margin:0 });
  s.addImage({ path:A+"qr_live.png", x:11.28, y:ty+0.52, w:1.24, h:1.24 });

  s.addText("AEGIS turns the chaos of a crowd emergency into calm, coordinated, AI-guided response — in real time.",
    { x:M, y:6.22, w:CW, h:0.36, fontFace:"Cambria", fontSize:14.5, color:INK, bold:true, italic:true, align:"center", margin:0 });
  s.addText("Built with EnterPro   ·   Powered by Convex   ·   Grounded in NDMA guidance",
    { x:M, y:6.62, w:CW, h:0.26, fontFace:"Calibri", fontSize:9.5, color:MUTE, align:"center", margin:0 });
}

d.writeFile({ fileName:require("path").join(__dirname, "..", "AEGIS_Finale_Deck.pptx") })
 .then(f => console.log("written:", f));
