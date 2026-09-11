"""AEGIS deck -> PDF, mirroring deck.js exactly.

The pptx canvas (13.33 x 7.5 in) and this page (960 x 540 pt) are the same
surface, so every coordinate here is the inch value from deck.js times 72.
Layout changes must be made in both files or they drift apart.
"""
from reportlab.pdfgen import canvas as rlc
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.lib.utils import ImageReader
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
import os

IN = 72.0
W, H = 13.33 * IN, 7.5 * IN
HERE = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(HERE, "assets") + os.sep
OUT = os.path.join(HERE, "..", "AEGIS_Finale_Deck.pdf")
LIVE = "https://490cbec14e504e7aa506bc0208460713.prod.enterapp.pro"

PAPER = HexColor("#FBF9F4"); PANEL = HexColor("#F3EFE6"); INK = HexColor("#26241E")
MUTE = HexColor("#6E6960"); EMBER = HexColor("#E8590C"); TEAL = HexColor("#0F8B8D")
RED = HexColor("#D6453D"); GREEN = HexColor("#0A8F62"); CHAR = HexColor("#2A2721")
LINE = HexColor("#E4DDCE"); CREAM = HexColor("#E8DFCB"); SAND = HexColor("#C9BFA8")

T = dict(kick=10, title=25, sub=12, lab=9.5, head=12, body=10.5, small=9, stat=34, statlab=9.5)
M, CW = 0.5, 12.33
BODY_TOP, BODY_SUB, BOTTOM = 1.34, 1.62, 7.06

c = rlc.Canvas(OUT, pagesize=(W, H))
c.setTitle("AEGIS - AI Emergency Grid & Incident System")
c.setAuthor("Team Ninja Coders")

X = lambda i: i * IN                      # inches -> points, horizontal
Y = lambda i: H - i * IN                  # inches from top -> pdf y


def st(size=T["body"], color=INK, bold=False, align=TA_LEFT, lead=None):
    return ParagraphStyle("s", fontName="Helvetica-Bold" if bold else "Helvetica",
                          fontSize=size, leading=lead or size * 1.42,
                          textColor=color, alignment=align)


def para(html, xi, yi, wi, size=T["body"], color=INK, align=TA_LEFT, bold=False):
    """xi/yi in inches, yi is the TOP edge. Measured then drawn, never clipped."""
    p = Paragraph(html, st(size, color, bold, align))
    _, h = p.wrap(X(wi), 10_000)
    p.drawOn(c, X(xi), Y(yi) - h)
    return h


def txt(s, xi, yi, size, color, bold=False, italic=False, align="l", wi=None):
    f = "Helvetica"
    if bold and italic: f = "Helvetica-BoldOblique"
    elif bold: f = "Helvetica-Bold"
    elif italic: f = "Helvetica-Oblique"
    c.setFont(f, size); c.setFillColor(color)
    if align == "c": c.drawCentredString(X(xi + wi / 2), Y(yi) - size, s)
    elif align == "r": c.drawRightString(X(xi + wi), Y(yi) - size, s)
    else: c.drawString(X(xi), Y(yi) - size, s)


def page():
    c.setFillColor(PAPER); c.rect(0, 0, W, H, stroke=0, fill=1)


def head(kick, title, sub=None):
    txt(kick, M, 0.30, T["kick"], EMBER, bold=True)
    txt(title, M, 0.54, T["title"], INK, bold=True)
    if sub: txt(sub, M, 1.04, T["sub"], MUTE)


def card(xi, yi, wi, hi, fill=PANEL, line=LINE):
    c.setFillColor(fill); c.setStrokeColor(line); c.setLineWidth(1)
    c.roundRect(X(xi), Y(yi + hi), X(wi), X(hi), 6, stroke=1, fill=1)


def lab(s, xi, yi, color=EMBER):
    txt(s, xi, yi, T["lab"], color, bold=True)


def stat(xi, yi, num, l1, l2, color):
    txt(num, xi, yi, T["stat"], color, bold=True)
    txt(l1, xi, yi + 0.56, T["statlab"], MUTE)
    txt(l2, xi, yi + 0.71, T["statlab"], MUTE)


# ═══════════ 1 · TITLE ═══════════
page()
c.setFillColor(CHAR); c.rect(0, Y(3.30), W, X(3.30), stroke=0, fill=1)
txt("COGNITIVE CHAOS 2026   ·   FINALE   ·   CONVEX OPEN INNOVATION TRACK", M, 0.42, T["kick"], SAND, bold=True)
txt("AEGIS", M, 0.78, 54, PAPER, bold=True)
txt("AI Emergency Grid & Incident System", M, 1.76, 19, CREAM)
txt("Every phone in the crowd becomes a sensor. Every second becomes coordinated action.", M, 2.16, 13, EMBER, italic=True)
txt("A working, publicly reachable prototype — not a mockup.", M, 2.60, 10, HexColor("#9C9384"))
txt("Open the live system  →", M, 2.86, 13, EMBER, bold=True)
c.linkURL(LIVE, (X(M), Y(3.16), X(M + 2.3), Y(2.84)), relative=0, thickness=0)
txt(LIVE.replace("https://", ""), M + 3.1, 2.92, 8, HexColor("#7E7568"))
c.drawImage(ImageReader(A + "qr_live.png"), X(11.45), Y(2.14), X(1.42), X(1.42), mask="auto")
txt("Scan to open", 11.25, 2.18, 8.5, HexColor("#9C9384"), align="c", wi=1.82)

card(M, 3.56, CW, 3.50)
lab("PROJECT TITLE", M + 0.28, 3.74)
txt("AEGIS — AI Emergency Grid & Incident System", M + 0.28, 3.96, 16, INK, bold=True)
for t, x in [("TEAM", M + 0.28), ("EVENT", 3.35), ("TRACK", 6.20)]:
    lab(t, x, 4.48)
txt("Ninja Coders", M + 0.28, 4.70, 12.5, INK, bold=True)
txt("Cognitive Chaos 2026", 3.35, 4.70, 12.5, INK, bold=True)
txt("Convex — Open Innovation (self-proposed problem)", 6.20, 4.70, 12.5, INK, bold=True)
lab("PROBLEM STATEMENT", M + 0.28, 5.18, MUTE)
para("Emergencies at mass gatherings unfold in seconds, but incident information is scattered, duplicated and "
     "unverified, and dispatch is manual — wasting the 5 to 10 minute window in which a crush or cardiac arrest "
     "is still survivable.", M + 0.28, 5.40, 11.7, 11.5)
c.setStrokeColor(LINE); c.setLineWidth(1); c.line(X(M + 0.28), Y(6.16), X(M + 11.98), Y(6.16))
lab("TEAM MEMBERS", M + 0.28, 6.30, MUTE)
txt("Sourav Kumar   ·   Manish Joshi   ·   Siddharth Singh   ·   Rajat Kushwaha", M + 0.28, 6.54, 12, INK)
txt("A real-time web platform — nothing to install", 8.4, 6.54, 10, TEAL, bold=True, align="r", wi=3.6)
c.showPage()

# ═══════════ 2 · PROBLEM ═══════════
page()
head("PROBLEM & EXISTING GAP", "In a crowd, the tools we rely on are the tools that fail")
stat(M,    BODY_TOP, "121",  "lives lost, Hathras", "stampede, 2024", RED)
stat(3.55, BODY_TOP, "11",   "lives lost, RCB victory crowd,", "Bengaluru stadium, 2025", RED)
stat(6.60, BODY_TOP, "5-10", "minutes — the survivable window", "in a crush or cardiac arrest", EMBER)
stat(9.85, BODY_TOP, "0",    "shared live picture of the venue", "at any of these events", INK)
txt("Police, medics and fire were already on site every time. What was missing was information, not manpower.",
    M, 2.62, 12, INK, italic=True)

cy = 3.10; ch = BOTTOM - cy
card(M, cy, 6.02, ch)
lab("WHY CALLING FOR HELP DOES NOT WORK IN A CROWD", M + 0.26, cy + 0.22, RED)
para("<b>You cannot hear, and cannot be heard.</b> A crowd runs past 100 dB. The control room mishears the location — the one detail that matters.<br/><br/>"
     "<b>The cell network is congested.</b> Thousands of phones on one tower means voice calls drop exactly when everyone needs them at once.<br/><br/>"
     "<b>Nobody knows the number.</b> The venue control room number is not on your ticket, and 112 cannot see inside the venue.<br/><br/>"
     "<b>A call carries one report, once.</b> Thirty callers about one crush create thirty conversations, not one prioritised incident.",
     M + 0.26, cy + 0.52, 5.5)
card(6.81, cy, 6.02, ch)
lab("WHO IS AFFECTED, AND WHAT THEY HAVE TODAY", 7.07, cy + 0.22, MUTE)
para("<b>Attendees</b> — no way to report that works in noise and congestion.<br/>"
     "<b>Marshals and volunteers</b> — first to see it, no channel to escalate.<br/>"
     "<b>Medics, fire and police</b> — on site, but sent by guesswork.<br/>"
     "<b>Organisers and administration</b> — own the liability, see fragments.<br/><br/>"
     "<b>Current solution: walkie-talkies and WhatsApp groups.</b><br/>"
     "No single live picture — every channel sees a fragment. Duplicate, unverified reports with no way to merge them. "
     "No severity triage, so a lost phone and a cardiac arrest arrive identical. Manual dispatch spends minutes working "
     "out who is nearest. No audit trail to learn from.", 7.07, cy + 0.52, 5.5)
c.showPage()

# ═══════════ 3 · SOLUTION ═══════════
page()
head("PROPOSED SOLUTION", "One tap replaces the call that cannot get through")
para("AEGIS is a live emergency response system for crowded places. Anyone reports in <b>one tap</b> — no login, "
     "no OTP, no typing and no speaking. A tap is a few hundred bytes, so it gets through congested networks where a "
     "voice call will not. An AI scores how serious it is, merges duplicate reports of the same event into one incident, "
     "and retrieves the correct response steps from <b>real NDMA government guidance</b>. A control room dashboard "
     "dispatches the nearest right-role unit in one click, and the person who reported it watches help approach with a "
     "live ETA.", M, BODY_TOP, 7.60, 11.5)

steps = [("01", "REPORT", EMBER, "One tap sends it, with GPS attached automatically. Photo, description and a callback number are optional and offered afterwards — help is already moving while you add them."),
         ("02", "AI TRIAGE", TEAL, "The AI scores severity P1–P4, writes an operator summary, merges duplicates, and retrieves protocol steps from real NDMA and Red Cross guidance by meaning, not keyword."),
         ("03", "COORDINATE", GREEN, "The nearest role-matched unit is dispatched in one click. The reporter sees a live ETA. Every action is written to an immutable audit timeline.")]
sy, sh, sw = 2.72, 2.58, 2.42
for i, (n, t, col, b) in enumerate(steps):
    x = M + i * 2.59
    card(x, sy, sw, sh)
    txt(n, x + 0.22, sy + 0.18, 21, col, bold=True)
    txt(t, x + 0.22, sy + 0.60, T["head"], INK, bold=True)
    para(b, x + 0.22, sy + 0.94, sw - 0.44, 9.5)

by = 5.46
card(M, by, 7.60, BOTTOM - by, CHAR, CHAR)
lab("WHAT MAKES IT DIFFERENT", M + 0.26, by + 0.20, SAND)
para('<font color="#FBF9F4"><b>The advice is traceable to a government document</b></font>'
     '<font color="#E8DFCB">, never invented — and the system </font>'
     '<font color="#FBF9F4"><b>degrades instead of failing</b></font>'
     '<font color="#E8DFCB">: if the AI is unavailable it falls back to deterministic rules and says so on screen, '
     'while still triaging and dispatching.</font>', M + 0.26, by + 0.50, 7.60 - 0.52, 10.5, CREAM)

c.drawImage(ImageReader(A + "shot_reporter_clean.png"), X(8.35), Y(BODY_TOP + 4.42), X(2.16), X(4.42), mask="auto")
c.drawImage(ImageReader(A + "shot_guidance_clean.png"), X(10.67), Y(BODY_TOP + 4.42), X(2.16), X(4.42), mask="auto")
txt("Report in one tap", 8.35, 5.84, 8.5, MUTE, italic=True, align="c", wi=2.16)
txt("NDMA guidance, sourced", 10.67, 5.84, 8.5, MUTE, italic=True, align="c", wi=2.16)
c.showPage()

# ═══════════ 4 · ARCHITECTURE ═══════════
page()
head("TECHNICAL APPROACH & ARCHITECTURE", "EnterPro front end, Convex back end, one AI brain")


def boxT(xi, yi, wi, hi, title, rows, col, dark=False):
    card(xi, yi, wi, hi, CHAR if dark else PANEL, CHAR if dark else LINE)
    lab(title, xi + 0.2, yi + 0.18, SAND if dark else col)
    para(rows, xi + 0.2, yi + 0.46, wi - 0.4, 9.5, CREAM if dark else INK)


boxT(M, BODY_TOP, 3.05, 1.95, "INPUT — ANY PHONE BROWSER",
     "Reporter (public, no login)<br/>Responder (staff passcode)<br/>One tap · GPS · photo · callback<br/><b>Built and deployed on EnterPro</b>", EMBER)
txt("→", 3.62, 2.14, 20, MUTE, bold=True)
boxT(4.08, BODY_TOP, 4.55, 3.55, "PROCESS — CONVEX BACKEND",
     "<b>Mutations</b>  ingest each report atomically, merge duplicates within 120 s<br/><br/>"
     "<b>Actions</b>  call the LLM for severity, summary and protocol selection<br/><br/>"
     "<b>Vector search</b>  1536-dimension semantic retrieval over the NDMA corpus<br/><br/>"
     "<b>Reactive DB</b>  pushes live state to every open screen, no polling<br/><br/>"
     "<b>Scheduler</b>  escalates an unacknowledged P1 after 60 seconds<br/><br/>"
     "<b>File storage</b>  incident photographs as evidence", TEAL, dark=True)
txt("→", 8.72, 2.14, 20, MUTE, bold=True)
boxT(9.18, BODY_TOP, 3.15, 1.95, "OUTPUT — CONTROL ROOM",
     "Live incident map and queue<br/>AI panel with NDMA actions<br/>Role-matched nearest dispatch<br/>Exit-guidance broadcast to all phones", GREEN)
boxT(M, 3.44, 3.05, 1.95, "THE AI LAYER",
     "Gemini for triage and summary<br/>Embeddings for semantic retrieval<br/>Three-model fallback chain<br/>Deterministic rules if AI is down", RED)
boxT(9.18, 3.44, 3.15, 1.95, "GROUNDING & INTEGRATIONS",
     "14 protocols from real <b>NDMA</b> and <b>Indian Red Cross</b> guidance<br/>Source shown on every step<br/>Helplines 112 · 100 · 101 · 102, one-tap dial", INK)
wy = 5.62
card(M, wy, CW, BOTTOM - wy)
para('<font color="#0F8B8D"><b>Why Convex.</b></font>  It replaces four separate systems with one typed TypeScript '
     'backend — the database, the serverless functions, the vector database for our NDMA search, and the job scheduler '
     'for our escalation timer. Every query is a live subscription, so the dashboard updates with zero real-time '
     'networking code written by us. That is the only reason a live product of this shape was buildable at our scale.',
     M + 0.28, wy + 0.22, CW - 0.56)
c.showPage()

# ═══════════ 5 · DEMO ═══════════
page()
head("DEMO WALKTHROUGH", "What we will show you live, in this order",
     "The dashboard starts empty. Everything you see appear is filed live, from a phone in this room.")
iw = 8.05; ih = iw / 2.09
c.drawImage(ImageReader(A + "shot_command_clean.png"), X(M), Y(BODY_SUB + ih), X(iw), X(ih), mask="auto")
txt("Command dashboard — live venue map, incident queue, AI panel, NDMA actions, reporter callback and photo evidence",
    M, BODY_SUB + ih + 0.06, 8.5, MUTE, italic=True)

items = [("1", "REPORTER  —  a teammate files a real emergency", "Opens the public link, taps SOS, taps Fire. One tap, no login. GPS places it at the Food Court automatically."),
         ("2", "COMMAND  —  it appears in about one second", "AI has scored it P1 Critical, written the summary and retrieved the fire protocol from NDMA guidance, with the source shown."),
         ("3", "COMMAND  —  duplicate merge, then dispatch", "A second report of the same fire merges into one incident with a count of two. One click dispatches the nearest fire unit."),
         ("4", "RESPONDER — accept, then broadcast", "The unit accepts on a second phone; the reporter's screen flips to a live ETA. We broadcast exit guidance to every phone.")]
rx, rw = 8.86, 3.97
for i, (n, t, b) in enumerate(items):
    y = BODY_SUB + i * 0.95
    txt(n, rx, y, 13, EMBER, bold=True)
    txt(t, rx + 0.3, y, 10.5, INK, bold=True)
    para(b, rx + 0.3, y + 0.26, rw - 0.3, 9, MUTE)
hy = 5.86
card(M, hy, CW, BOTTOM - hy, CHAR, CHAR)
lab("WE WILL SAY THIS BEFORE YOU ASK", M + 0.28, hy + 0.16, SAND)
para('<font color="#E8DFCB">Reporting, triage, merging, dispatch and tracking are all real and running. Venue '
     'responders are </font><font color="#FBF9F4"><b>simulated</b></font><font color="#E8DFCB"> for this demo, not '
     'live staff. Location is device GPS only, never from a phone number.</font>',
     M + 0.28, hy + 0.44, CW - 0.56, 9.5, CREAM)
c.showPage()

# ═══════════ 6 · FEATURES ═══════════
page()
head("KEY FEATURES & DIFFERENTIATOR", "Six capabilities, and what makes each one hard to copy")
F = [("Live command map", "Every report appears on every dashboard the instant it is filed — one shared source of truth for the venue.", "Convex reactive queries are live subscriptions"),
     ("AI triage and de-duplication", "Severity scored by the LLM; reports of the same event, same zone, within 120 seconds merge into one counted incident.", "Actions call the model, mutations write the result"),
     ("Protocol-grounded response", "Steps retrieved from real NDMA guidance by meaning, with the source document named on screen.", "Convex vector search over the protocol table"),
     ("Role-matched dispatch", "The nearest correct unit in one click — a medic for medical, a fire unit for fire. Unacknowledged P1 escalates in 60 s.", "Scheduler functions and indexed queries"),
     ("Live responder tracking", "The reporter watches the assigned unit approach with a live ETA, the way you track a delivery.", "Location updates through the reactive database"),
     ("Evidence and audit trail", "Photograph, callback number and an immutable timestamped timeline for every incident.", "File storage plus an append-only event log")]
cw, chh = 3.97, 1.72
for i, (t, b, cx) in enumerate(F):
    x = M + (i % 3) * 4.19; y = BODY_TOP + (i // 3) * 1.92
    card(x, y, cw, chh)
    txt(f"{i+1:02d}", x + 0.22, y + 0.16, 12, EMBER, bold=True)
    txt(t, x + 0.62, y + 0.16, 11.5, INK, bold=True)
    para(b, x + 0.22, y + 0.50, cw - 0.44, 9.5)
    txt(cx, x + 0.22, y + chh - 0.34, 8, TEAL, bold=True)
dy = 5.42
card(M, dy, CW, BOTTOM - dy, CHAR, CHAR)
lab("WHAT ACTUALLY SETS US APART", M + 0.28, dy + 0.18, SAND)
para('<font color="#FBF9F4"><b>1. The AI cannot invent procedure.</b></font><font color="#E8DFCB"> It searches real '
     'NDMA and Red Cross documents first and may only compose steps from what it retrieved — the source is printed on '
     'screen.    </font><font color="#FBF9F4"><b>2. It degrades instead of failing.</b></font><font color="#E8DFCB"> '
     'If the AI is rate-limited we fall through three models, then to deterministic rules, and the dashboard says so '
     'openly.<br/></font><font color="#FBF9F4"><b>3. Panic becomes signal.</b></font><font color="#E8DFCB"> Thirty '
     'reports of one crush become one P1 incident with a count of thirty.    </font>'
     '<font color="#FBF9F4"><b>4. The venue is data, not code.</b></font><font color="#E8DFCB"> One record re-points '
     'AEGIS from a campus to Jantar Mantar or a stadium, switchable live from the dashboard.</font>',
     M + 0.28, dy + 0.46, CW - 0.56, 9.5, CREAM)
c.showPage()

# ═══════════ 7 · IMPACT ═══════════
page()
head("IMPACT & FEASIBILITY", "Minutes saved are lives saved — and it runs today for almost nothing")
stat(M,     BODY_TOP, "3",     "venues live across two states,", "switchable from the dashboard", TEAL)
stat(3.55,  BODY_TOP, "14",    "real NDMA and Red Cross protocols", "grounding every recommendation", EMBER)
stat(6.85,  BODY_TOP, "Rs 0",  "infrastructure cost at pilot scale —", "free tiers, no servers to run", GREEN)
stat(10.05, BODY_TOP, "1 tap", "for any citizen to summon a", "role-matched responder", INK)
cy, ch = 2.70, 2.62
card(M, cy, 6.02, ch)
lab("WHO BENEFITS", M + 0.26, cy + 0.20)
para("<b>Every attendee</b> — nothing to install, it is a web link.<br/>"
     "<b>Marshals and volunteers</b> — a channel that works in noise.<br/>"
     "<b>Medics, fire and police</b> — sent to the right spot, first time.<br/>"
     "<b>Organisers and district administration</b> — one live picture, and an audit trail afterwards.<br/><br/>"
     "Beyond event venues this extends directly to campuses, religious gatherings, railway stations, hospitals and "
     "industrial sites — anywhere crowds and risk meet.", M + 0.26, cy + 0.50, 5.5, 10)
card(6.81, cy, 6.02, ch)
lab("WHY IT IS REALISTICALLY DEPLOYABLE", 7.07, cy + 0.20, TEAL)
para("<b>No app store, no install.</b> A venue prints a QR code; anyone with a browser can report.<br/><br/>"
     "<b>The venue is a data record.</b> Zones, exits and responding units — a new site needs no code change.<br/><br/>"
     "<b>Serverless throughout.</b> Convex scales with crowd size and the front end is static. We load-tested 50 "
     "simultaneous reports with zero failures; capacity is not our bottleneck, it is a platform concern.<br/><br/>"
     "<b>Costs nothing to pilot.</b> A district could run this for a festival on free tiers.", 7.07, cy + 0.50, 5.5, 10)
ly = 5.56
card(M, ly, CW, BOTTOM - ly)
lab("HONEST LIMITS — WE STATE THESE OURSELVES", M + 0.28, ly + 0.18, RED)
para("Venue responders are <b>simulated</b> for this demo, not live staff. There is <b>no AI verification of "
     "photographs</b> yet — the image is shown to the operator for human judgement. <b>Offline queueing is designed "
     "but not implemented</b>, so a report needs a moment of connectivity. The operator login gates the screen rather "
     "than the API; production uses role-scoped authentication. Facility coordinates in our alternate venues are real "
     "institutions at approximate positions, not a verified government feed.", M + 0.28, ly + 0.46, CW - 0.56, 9.5)
c.showPage()

# ═══════════ 8 · ROADMAP + TEAM ═══════════
page()
head("ROADMAP & TEAM", "What we build next, and who built this")
ry, rh = BODY_TOP, 2.16
card(M, ry, CW, rh)
lab("WHAT COMES NEXT", M + 0.28, ry + 0.18)
R = [("Voice reporting", "Speak instead of tapping, for anyone who cannot type or see the screen in an emergency."),
     ("Offline-first reporting", "Queue the report on the device and sync the moment signal returns."),
     ("AI photo verification", "Flag reports whose image does not match the reported category."),
     ("Crowd-density warning", "Read density from CCTV and warn before the crush, not after."),
     ("Verified facility data", "Ingest the government facility directory for real hospital, police and fire locations nationwide."),
     ("Open-source release", "So any district administration or college can run it — cost should never be why a crowd has no system.")]
for i, (t, b) in enumerate(R):
    x = M + 0.28 + (i % 3) * 4.02; y = ry + 0.50 + (i // 3) * 0.82
    txt(t, x, y, 10, EMBER, bold=True)
    para(b, x, y + 0.24, 3.75, 8.8, MUTE)
ty, th = 3.72, 2.22
card(M, ty, 7.60, th)
lab("TEAM NINJA CODERS", M + 0.28, ty + 0.20)
for i, (n, r) in enumerate([("Sourav Kumar", "Team lead — EnterPro front end, design system, pitch and live demo"),
                            ("Siddharth Singh", "Convex data core — schema, de-duplication, dispatch and escalation logic"),
                            ("Rajat Kushwaha", "AI triage and retrieval — LLM prompting, protocol grounding, fallback chain"),
                            ("Manish Joshi", "Integration, deployment and testing — EnterPro to Convex bridge, load and failure testing")]):
    y = ty + 0.56 + i * 0.40
    txt(n, M + 0.28, y, 10.5, INK, bold=True)
    txt(r, M + 2.22, y, 9, MUTE)
card(8.35, ty, 4.48, th, CHAR, CHAR)
lab("TRY IT YOURSELF, RIGHT NOW", 8.60, ty + 0.20, SAND)
para('<font color="#E8DFCB">Open it on your own phone and file a report. It appears on our dashboard in about a '
     'second.</font>', 8.60, ty + 0.50, 2.35, 9.5, CREAM)
txt("Open the live system  →", 8.60, ty + 1.46, 11, EMBER, bold=True)
c.linkURL(LIVE, (X(8.55), Y(ty + 1.78), X(11.2), Y(ty + 1.44)), relative=0, thickness=0)
txt(LIVE.replace("https://", ""), 8.60, ty + 1.76, 6.5, HexColor("#8E8577"))
c.drawImage(ImageReader(A + "qr_live.png"), X(11.28), Y(ty + 1.76), X(1.24), X(1.24), mask="auto")
txt("AEGIS turns the chaos of a crowd emergency into calm, coordinated, AI-guided response — in real time.",
    M, 6.22, 14.5, INK, bold=True, italic=True, align="c", wi=CW)
txt("Built with EnterPro   ·   Powered by Convex   ·   Grounded in NDMA guidance",
    M, 6.62, 9.5, MUTE, align="c", wi=CW)
c.showPage()

c.save()
print("written:", OUT)
