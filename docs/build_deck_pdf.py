"""AEGIS finale deck -> PDF. 8 slides, 16:9, Ember & Paper palette."""
from reportlab.pdfgen import canvas as rl_canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph, Frame
from reportlab.lib.utils import ImageReader
from reportlab.lib.enums import TA_LEFT

W, H = 960, 540                      # 16:9 presentation page, points
A = "G:/Claude/aegis-platform/docs/assets/"
OUT = "G:/Claude/aegis-platform/AEGIS_Finale_Deck.pdf"
LIVE = "https://490cbec14e504e7aa506bc0208460713.prod.enterapp.pro"

PAPER   = HexColor("#FBF9F4"); PANEL = HexColor("#F3EFE6")
INK     = HexColor("#26241E"); MUTE  = HexColor("#6E6960")
EMBER   = HexColor("#E8590C"); TEAL  = HexColor("#0F8B8D")
RED     = HexColor("#D6453D"); GREEN = HexColor("#0A8F62")
CHAR    = HexColor("#2A2721"); LINE  = HexColor("#E4DDCE")

c = rl_canvas.Canvas(OUT, pagesize=(W, H))
c.setTitle("AEGIS - AI Emergency Grid & Incident System")
c.setAuthor("Team Ninja Coders")


def st(size=10.5, color=INK, leading=None, bold=False, space=3):
    return ParagraphStyle("s", fontName="Helvetica-Bold" if bold else "Helvetica",
                          fontSize=size, leading=leading or size * 1.42,
                          textColor=color, alignment=TA_LEFT, spaceAfter=space)


def para(text, x, y, w, h=None, style=None):
    """Draw wrapped rich text with y as the TOP edge.

    Measures first and draws unconditionally. A Frame silently DROPS content
    that does not fit, which loses whole paragraphs without any error — so the
    measured height is used instead and overflow is caught in visual review.
    Returns the height consumed."""
    p = Paragraph(text, style)
    _, ah = p.wrap(w, 1_000_000)
    p.drawOn(c, x, y - ah)
    return ah


def page(bg=PAPER):
    c.setFillColor(bg); c.rect(0, 0, W, H, stroke=0, fill=1)


def head(kicker, title, sub=None):
    c.setFillColor(EMBER); c.setFont("Helvetica-Bold", 9)
    c.drawString(46, H - 40, kicker)
    c.setFillColor(INK); c.setFont("Helvetica-Bold", 23)
    c.drawString(46, H - 68, title)
    if sub:
        c.setFillColor(MUTE); c.setFont("Helvetica", 11.5)
        c.drawString(46, H - 88, sub)


def card(x, y, w, h, fill=PANEL, border=LINE):
    c.setFillColor(fill); c.setStrokeColor(border); c.setLineWidth(1)
    c.roundRect(x, y, w, h, 7, stroke=1, fill=1)


def label(text, x, y, color=EMBER, size=8.5):
    c.setFillColor(color); c.setFont("Helvetica-Bold", size); c.drawString(x, y, text)


def stat(x, y, num, lines, color=EMBER, numsize=30):
    c.setFillColor(color); c.setFont("Helvetica-Bold", numsize); c.drawString(x, y, num)
    c.setFillColor(MUTE); c.setFont("Helvetica", 9)
    for i, ln in enumerate(lines):
        c.drawString(x, y - 15 - i * 11, ln)


# ══════════════ 1 · TITLE ══════════════
page()
c.setFillColor(CHAR); c.rect(0, H - 250, W, 250, stroke=0, fill=1)
c.setFillColor(HexColor("#C9BFA8")); c.setFont("Helvetica-Bold", 9)
c.drawString(46, H - 42, "COGNITIVE CHAOS 2026  ·  FINALE  ·  CONVEX OPEN INNOVATION TRACK")
c.setFillColor(PAPER); c.setFont("Helvetica-Bold", 52)
c.drawString(46, H - 105, "AEGIS")
c.setFillColor(HexColor("#E8DFCB")); c.setFont("Helvetica", 19)
c.drawString(46, H - 133, "AI Emergency Grid & Incident System")
c.setFillColor(EMBER); c.setFont("Helvetica-Oblique", 13)
c.drawString(46, H - 158, "Every phone in the crowd becomes a sensor. Every second becomes coordinated action.")

c.setFillColor(HexColor("#9C9384")); c.setFont("Helvetica", 9.5)
c.drawString(46, H - 200, "A working, publicly reachable prototype — not a mockup.")
# Clickable label rather than a vanity domain: the real host is a long random
# string, and inventing a prettier one would send anyone who typed it nowhere.
c.setFillColor(EMBER); c.setFont("Helvetica-Bold", 13)
c.drawString(46, H - 226, "Open the live system  →")
c.linkURL(LIVE, (42, H - 234, 230, H - 212), relative=0, thickness=0)
c.setFillColor(HexColor("#7E7568")); c.setFont("Helvetica", 7.5)
c.drawString(46, H - 244, LIVE.replace("https://", ""))

try:
    c.drawImage(ImageReader(A + "qr_live.png"), W - 150, H - 210, 104, 104, mask="auto")
    c.setFillColor(HexColor("#9C9384")); c.setFont("Helvetica", 8)
    c.drawCentredString(W - 98, H - 224, "Scan to open")
except Exception:
    pass

card(46, 40, W - 92, 236)
label("PROJECT TITLE", 68, 254)
c.setFillColor(INK); c.setFont("Helvetica-Bold", 15)
c.drawString(68, 232, "AEGIS — AI Emergency Grid & Incident System")

label("TEAM", 68, 200); label("EVENT", 300, 200)
label("PROBLEM STATEMENT ID", 480, 200); label("COLLEGE", 720, 200)
c.setFillColor(INK); c.setFont("Helvetica-Bold", 12.5)
c.drawString(68, 180, "Ninja Coders")
c.drawString(300, 180, "Cognitive Chaos 2026")
c.setFillColor(RED); c.drawString(480, 180, "[FILL: Problem Statement ID]")
c.setFillColor(INK); c.drawString(720, 180, "[FILL: College Name]")

c.setStrokeColor(LINE); c.setLineWidth(1); c.line(68, 158, W - 68, 158)
label("TEAM MEMBERS", 68, 138, MUTE)
c.setFillColor(INK); c.setFont("Helvetica", 11.5)
c.drawString(68, 118, "Sourav Kumar   ·   Manish Joshi   ·   Siddharth Singh   ·   Rajat Kushwaha")
c.setFillColor(MUTE); c.setFont("Helvetica", 10)
c.drawString(68, 96, "Frontend built and deployed on EnterPro   ·   Backend entirely on Convex   ·   Three portals, one URL")
c.setFillColor(TEAL); c.setFont("Helvetica-Bold", 10)
c.drawString(68, 66, "Convex used as the real backend: reactive database, actions, vector search, scheduler and file storage.")
c.showPage()

# ══════════════ 2 · PROBLEM + GAP ══════════════
page()
head("PROBLEM & EXISTING GAP", "In a crowd, the tools we rely on are the tools that fail")

stat(46, H - 135, "121", ["lives lost, Hathras", "stampede, 2024"], RED)
stat(190, H - 135, "11", ["lives lost, RCB victory crowd,", "Bengaluru stadium, 2025"], RED)
stat(370, H - 135, "5-10", ["minutes — the survivable window", "in a crush or cardiac arrest"], EMBER)
stat(530, H - 135, "0", ["shared live picture of the venue", "at any of these events"], INK)

c.setFillColor(INK); c.setFont("Helvetica-Oblique", 11)
c.drawString(46, H - 190, "Police, medics and fire were already on site every time. What was missing was information, not manpower.")

card(46, 66, 430, 250)
label("WHY CALLING FOR HELP DOES NOT WORK IN A CROWD", 68, 296, RED)
para("<b>You cannot hear, and cannot be heard.</b> A crowd runs past 100 dB. The control room mishears the location — the one detail that matters.<br/><br/>"
     "<b>The cell network is congested.</b> Thousands of phones on one tower means voice calls drop exactly when everyone needs them at once.<br/><br/>"
     "<b>Nobody knows the number.</b> The venue control room number is not on your ticket, and 112 cannot see inside the venue.<br/><br/>"
     "<b>A call carries one report, once.</b> Thirty callers about one crush create thirty conversations, not one prioritised incident.",
     68, 284, 386, style=st(10, INK, 14))

card(494, 66, 420, 250)
label("WHO IS AFFECTED, AND WHAT THEY HAVE TODAY", 516, 296, MUTE)
para("<b>Attendees</b> — no way to report that works in noise and congestion.<br/>"
     "<b>Marshals and volunteers</b> — first to see it, no channel to escalate.<br/>"
     "<b>Medics, fire and police</b> — on site, but sent by guesswork.<br/>"
     "<b>Organisers and administration</b> — own the liability, see fragments.<br/><br/>"
     "<b>Current solution: walkie-talkies and WhatsApp groups.</b><br/>"
     "No single live picture — every channel sees a fragment. Duplicate, unverified reports with no way to merge them. No severity triage, so a lost phone and a cardiac arrest arrive identical. Manual dispatch spends minutes working out who is nearest. No audit trail to learn from.",
     516, 284, 376, style=st(10, INK, 14))
c.showPage()

# ══════════════ 3 · PROPOSED SOLUTION ══════════════
page()
head("PROPOSED SOLUTION", "One tap replaces the call that cannot get through")

para("AEGIS is a live emergency response system for crowded places. Anyone reports in <b>one tap</b> — no login, no OTP, no typing and no speaking. "
     "A tap is a few hundred bytes, so it gets through congested networks where a voice call will not. An AI scores how serious it is, merges duplicate reports "
     "of the same event into one incident, and retrieves the correct response steps from <b>real NDMA government guidance</b>. A control room dashboard dispatches "
     "the nearest right-role unit in one click, and the person who reported it watches help approach with a live ETA.",
     46, H - 105, 560, style=st(11.5, INK, 16))

steps = [("01", "REPORT", EMBER, "One tap sends it, with GPS attached automatically. Photo, description and a callback number are optional and offered afterwards — help is already moving while you add them."),
         ("02", "AI TRIAGE", TEAL, "The AI scores severity P1-P4, writes an operator summary, merges duplicates, and retrieves protocol steps from real NDMA and Red Cross guidance by meaning, not keyword."),
         ("03", "COORDINATE", GREEN, "The nearest role-matched unit is dispatched in one click. The reporter sees a live ETA. Every action is written to an immutable audit timeline.")]
for i, (n, t, col, body) in enumerate(steps):
    x = 46 + i * 190
    card(x, 128, 176, 175)
    c.setFillColor(col); c.setFont("Helvetica-Bold", 20); c.drawString(x + 16, 275, n)
    c.setFillColor(INK); c.setFont("Helvetica-Bold", 12); c.drawString(x + 16, 255, t)
    para(body, x + 16, 245, 146, style=st(8.8, INK, 12))

card(46, 46, 560, 68, CHAR, CHAR)
label("WHAT MAKES IT DIFFERENT", 68, 96, HexColor("#C9BFA8"))
para('<font color="#FBF9F4">The advice is <b>traceable to a government document</b>, never invented — and the system <b>degrades instead of failing</b>: '
     'if the AI is unavailable it falls back to deterministic rules and says so on screen, while still triaging and dispatching.</font>',
     68, 82, 516, style=st(9.5, PAPER, 13))

try:
    c.drawImage(ImageReader(A + "shot_reporter_clean.png"), 630, 60, 130, 265, mask="auto")
    c.drawImage(ImageReader(A + "shot_guidance_clean.png"), 775, 60, 130, 265, mask="auto")
    c.setFillColor(MUTE); c.setFont("Helvetica-Oblique", 8)
    c.drawCentredString(695, 48, "Report in one tap")
    c.drawCentredString(840, 48, "NDMA guidance, sourced")
except Exception:
    pass
c.showPage()

# ══════════════ 4 · TECHNICAL APPROACH ══════════════
page()
head("TECHNICAL APPROACH & ARCHITECTURE", "EnterPro front end, Convex back end, one AI brain")

def flowbox(x, y, w, h, title, body, col, dark=False):
    card(x, y, w, h, CHAR if dark else PANEL, CHAR if dark else LINE)
    label(title, x + 14, y + h - 20, HexColor("#C9BFA8") if dark else col)
    para(body, x + 14, y + h - 32, w - 28, h - 44,
         st(8.6, PAPER if dark else INK, 11.6))

flowbox(46, 280, 190, 140, "INPUT — ANY PHONE BROWSER",
        "Reporter (public, no login)<br/>Responder (staff passcode)<br/>One tap · GPS · photo · callback<br/><br/><b>Built and deployed on EnterPro</b>", EMBER)
c.setFillColor(MUTE); c.setFont("Helvetica-Bold", 18); c.drawString(244, 342, "→")

flowbox(268, 208, 300, 212, "PROCESS — CONVEX BACKEND",
        "<b>Mutations</b>  ingest each report atomically, merge duplicates within 120 s<br/>"
        "<b>Actions</b>  call the LLM for severity, summary and protocol selection<br/>"
        "<b>Vector search</b>  1536-dimension semantic retrieval over the NDMA corpus<br/>"
        "<b>Reactive DB</b>  pushes live state to every open screen, no polling<br/>"
        "<b>Scheduler</b>  escalates an unacknowledged P1 after 60 seconds<br/>"
        "<b>File storage</b>  incident photographs as evidence", TEAL, dark=True)
c.setFillColor(MUTE); c.setFont("Helvetica-Bold", 18); c.drawString(578, 342, "→")

flowbox(600, 280, 190, 140, "OUTPUT — CONTROL ROOM",
        "Live incident map and queue<br/>AI panel with NDMA actions<br/>Role-matched nearest dispatch<br/>Exit-guidance broadcast to all phones", GREEN)

flowbox(46, 138, 190, 128, "THE AI LAYER",
        "<b>Gemini</b> for triage and summary<br/><b>Embeddings</b> for semantic retrieval<br/>Three-model fallback chain<br/>Deterministic rules if AI is down", RED)
flowbox(600, 138, 190, 128, "GROUNDING & INTEGRATIONS",
        "14 protocols from real <b>NDMA</b> and <b>Indian Red Cross</b> guidance<br/>Source shown on every step<br/>Emergency helplines 112 · 100 · 101 · 102 as one-tap dial", INK)

card(806, 138, 108, 282)
label("STACK", 820, 408, MUTE)
para("<b>EnterPro</b><br/>AI-generated React front end<br/><br/><b>Convex</b><br/>database, functions, vector search, scheduler, storage, auth<br/><br/><b>Gemini</b><br/>triage + embeddings<br/><br/><b>Schematic SVG map</b><br/>no billing-gated map API",
     820, 396, 82, style=st(8, INK, 11))

card(46, 46, 868, 50)
para('<b><font color="#0F8B8D">Why Convex.</font></b>  It replaces four separate systems with one typed TypeScript backend — the database, the serverless functions, '
     'the vector database for our NDMA search, and the job scheduler for our escalation timer. Every query is a live subscription, so the dashboard updates with '
     'zero real-time networking code written by us. That is the only reason a live product of this shape was buildable at our scale.',
     68, 84, 824, style=st(9.5, INK, 13))
c.showPage()

# ══════════════ 5 · DEMO WALKTHROUGH ══════════════
page()
head("DEMO WALKTHROUGH", "What we will show you live, in this order",
     "The dashboard starts empty. Everything you see appear is filed live, from a phone in this room.")

try:
    c.drawImage(ImageReader(A + "shot_command_clean.png"), 46, 118, 520, 249, mask="auto")
    c.setFillColor(MUTE); c.setFont("Helvetica-Oblique", 8)
    c.drawString(46, 106, "Command dashboard — live venue map, incident queue, AI panel, NDMA actions, reporter callback and photo evidence")
except Exception:
    pass

items = [("1", "REPORTER  —  a teammate files a real emergency", "Opens the public link, taps SOS, taps Fire. One tap, no login. GPS places it at the Food Court automatically."),
         ("2", "COMMAND  —  it appears in about one second", "AI has scored it P1 Critical, written the summary and retrieved the fire protocol from NDMA guidance, with the source shown."),
         ("3", "COMMAND  —  duplicate merge, then dispatch", "A second report of the same fire merges into one incident with a count of two. One click dispatches the nearest fire unit."),
         ("4", "RESPONDER — accept, then broadcast", "The unit accepts on a second phone; the reporter's screen flips to a live ETA. We broadcast exit guidance to every phone.")]
y = H - 118
for n, t, b in items:
    c.setFillColor(EMBER); c.setFont("Helvetica-Bold", 13); c.drawString(590, y, n)
    c.setFillColor(INK); c.setFont("Helvetica-Bold", 10.5); c.drawString(608, y, t)
    para(b, 608, y - 12, 306, style=st(9, MUTE, 11.5))
    y -= 62

card(590, 46, 324, 82, CHAR, CHAR)
label("WE WILL SAY THIS BEFORE YOU ASK", 606, 106, HexColor("#C9BFA8"))
para('<font color="#E8DFCB">Reporting, triage, merging, dispatch and tracking are all real and running. Venue responders are '
     '<b>simulated</b> for this demo. Location is device GPS only, never from a phone number.</font>',
     606, 92, 292, style=st(8.6, PAPER, 11))
c.showPage()

# ══════════════ 6 · KEY FEATURES ══════════════
page()
head("KEY FEATURES & DIFFERENTIATOR", "Six capabilities, and what makes each one hard to copy")

F = [("Live command map", "Every report appears on every dashboard the instant it is filed — one shared source of truth for the venue.", "Convex reactive queries are live subscriptions"),
     ("AI triage and de-duplication", "Severity scored by the LLM; reports of the same event, same zone, within 120 seconds merge into one counted incident.", "Actions call the model, mutations write the result"),
     ("Protocol-grounded response", "Steps retrieved from real NDMA guidance by meaning, with the source document named on screen.", "Convex vector search over the protocol table"),
     ("Role-matched dispatch", "The nearest correct unit in one click — a medic for medical, a fire unit for fire. Unacknowledged P1 escalates in 60 s.", "Scheduler functions and indexed queries"),
     ("Live responder tracking", "The reporter watches the assigned unit approach with a live ETA, the way you track a delivery.", "Location updates through the reactive database"),
     ("Evidence and audit trail", "Photograph, callback number and an immutable timestamped timeline for every incident.", "File storage plus an append-only event log")]
for i, (t, b, cx) in enumerate(F):
    x = 46 + (i % 3) * 296
    y = 300 - (i // 3) * 132
    card(x, y, 276, 118)
    c.setFillColor(EMBER); c.setFont("Helvetica-Bold", 11); c.drawString(x + 14, y + 96, f"{i+1:02d}")
    c.setFillColor(INK); c.setFont("Helvetica-Bold", 10.5); c.drawString(x + 38, y + 96, t)
    para(b, x + 14, y + 84, 248, style=st(8.8, INK, 11.5))
    c.setFillColor(TEAL); c.setFont("Helvetica-Bold", 7.6); c.drawString(x + 14, y + 14, cx)

card(46, 46, 868, 76, CHAR, CHAR)
label("WHAT ACTUALLY SETS US APART", 68, 108, HexColor("#C9BFA8"))
para('<font color="#E8DFCB"><b>1. The AI cannot invent procedure.</b>  It searches real NDMA and Red Cross documents first and may only compose steps from what it retrieved — the source is printed on screen.   '
     '<b>2. It degrades instead of failing.</b>  If the AI is rate-limited we fall through three models, then to deterministic rules, and the dashboard says so openly — reports never stop being accepted.   '
     '<b>3. Panic becomes signal.</b>  Thirty reports of one crush become one P1 incident with a count of thirty.   '
     '<b>4. The venue is data, not code.</b>  One record re-points AEGIS from a campus to Jantar Mantar or a stadium, switchable live from the dashboard.</font>',
     68, 94, 824, style=st(8.8, PAPER, 12))
c.showPage()

# ══════════════ 7 · IMPACT / FEASIBILITY ══════════════
page()
head("IMPACT & FEASIBILITY", "Minutes saved are lives saved — and it runs today for almost nothing")

stat(46, H - 130, "3", ["venues live across two states,", "switchable from the dashboard"], TEAL)
stat(240, H - 130, "14", ["real NDMA and Red Cross protocols", "grounding every recommendation"], EMBER)
stat(470, H - 130, "Rs 0", ["infrastructure cost at pilot scale —", "free tiers, no servers to run"], GREEN)
stat(680, H - 130, "1 tap", ["for any citizen to summon a", "role-matched responder"], INK)

card(46, 150, 430, 180)
label("WHO BENEFITS", 68, 310)
para("<b>Every attendee</b> — nothing to install, it is a web link.<br/>"
     "<b>Marshals and volunteers</b> — a channel that works in noise.<br/>"
     "<b>Medics, fire and police</b> — sent to the right spot, first time.<br/>"
     "<b>Organisers and district administration</b> — one live picture, and an audit trail afterwards.<br/><br/>"
     "Beyond event venues this extends directly to campuses, religious gatherings, railway stations, hospitals and industrial sites — anywhere crowds and risk meet.",
     68, 296, 386, style=st(9.5, INK, 13))

card(494, 150, 420, 180)
label("WHY IT IS REALISTICALLY DEPLOYABLE", 516, 310, TEAL)
para("<b>No app store, no install.</b> A venue prints a QR code; anyone with a browser can report.<br/><br/>"
     "<b>The venue is a data record.</b> Zones, exits and responding units — a new site needs no code change.<br/><br/>"
     "<b>Serverless throughout.</b> Convex scales with crowd size and the front end is static. We load-tested 50 simultaneous reports with zero failures; capacity is not our bottleneck, it is a platform concern.<br/><br/>"
     "<b>Costs nothing to pilot.</b> A district could run this for a festival on free tiers.",
     516, 296, 376, 140, st(9.5, INK, 13))

card(46, 46, 868, 84)
label("HONEST LIMITS — WE STATE THESE OURSELVES", 68, 116, RED)
para("Venue responders are <b>simulated</b> for this demo, not live staff. There is <b>no AI verification of photographs</b> yet — the image is shown to the operator for human judgement. "
     "<b>Offline queueing is designed but not implemented</b>, so a report needs a moment of connectivity. The operator login gates the screen rather than the API; production uses role-scoped authentication. "
     "Facility coordinates in our alternate venues are real institutions at approximate positions, not a verified government feed.",
     68, 102, 824, 58, st(9.2, INK, 12.5))
c.showPage()

# ══════════════ 8 · ROADMAP + TEAM ══════════════
page()
head("ROADMAP & TEAM", "What we build next, and who built this")

card(46, 272, 868, 140)
label("WHAT COMES NEXT", 68, 394)
R = [("Voice reporting", "Speak instead of tapping, for anyone who cannot type or see the screen in an emergency."),
     ("Offline-first reporting", "Queue the report on the device and sync the moment signal returns."),
     ("AI photo verification", "Flag reports whose image does not match the reported category."),
     ("Crowd-density warning", "Read density from CCTV and warn before the crush, not after."),
     ("Verified facility data", "Ingest the government facility directory for real hospital, police and fire locations nationwide."),
     ("Open-source release", "So any district administration or college can run it — cost should never be why a crowd has no system.")]
for i, (t, b) in enumerate(R):
    x = 68 + (i % 3) * 286
    y = 366 - (i // 3) * 52
    c.setFillColor(EMBER); c.setFont("Helvetica-Bold", 9.5); c.drawString(x, y, t)
    para(b, x, y - 10, 266, style=st(8.4, MUTE, 10.6))

card(46, 120, 560, 140)
label("TEAM NINJA CODERS", 68, 242)
T = [("Sourav Kumar", "Team lead — EnterPro front end, design system, pitch and live demo"),
     ("Siddharth Singh", "Convex data core — schema, de-duplication, dispatch and escalation logic"),
     ("Rajat Kushwaha", "AI triage and retrieval — LLM prompting, protocol grounding, fallback chain"),
     ("Manish Joshi", "Integration, deployment and testing — EnterPro to Convex bridge, load and failure testing")]
for i, (n, r) in enumerate(T):
    y = 218 - i * 25
    c.setFillColor(INK); c.setFont("Helvetica-Bold", 10); c.drawString(68, y, n)
    c.setFillColor(MUTE); c.setFont("Helvetica", 8.8); c.drawString(180, y, r)

card(624, 120, 290, 140, CHAR, CHAR)
label("TRY IT YOURSELF, RIGHT NOW", 644, 242, HexColor("#C9BFA8"))
# text column kept clear of the QR block on the right
para('<font color="#E8DFCB">Open it on your own phone and file a report. It appears on our dashboard in about a second.</font>',
     644, 228, 158, style=st(8.6, PAPER, 11.5))
c.setFillColor(EMBER); c.setFont("Helvetica-Bold", 10.5)
c.drawString(644, 158, "Open the live system  →")
c.linkURL(LIVE, (640, 150, 796, 172), relative=0, thickness=0)
c.setFillColor(HexColor("#8E8577")); c.setFont("Helvetica", 5.8)
c.drawString(644, 144, LIVE.replace("https://", ""))
try:
    c.drawImage(ImageReader(A + "qr_live.png"), 818, 150, 80, 80, mask="auto")
except Exception:
    pass

c.setFillColor(INK); c.setFont("Helvetica-BoldOblique", 14)
c.drawCentredString(W / 2, 72, "AEGIS turns the chaos of a crowd emergency into calm, coordinated, AI-guided response — in real time.")
c.setFillColor(MUTE); c.setFont("Helvetica", 9)
c.drawCentredString(W / 2, 52, "Built with EnterPro  ·  Powered by Convex  ·  Grounded in NDMA guidance")
c.showPage()

c.save()
print("written:", OUT)
