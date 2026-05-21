"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { cn } from "@/lib/utils";
import { dastWalkthroughs, type DastToolWalkthrough } from "@/lib/dast-walkthroughs";
import { trackActivity } from "@/lib/pathway-progress";
import { useAuth } from "@/contexts/auth-context";
import { getAuthHeaders, API_BASE } from "@/lib/auth";
import { toast } from "react-hot-toast";

const challengeDataMap: Record<string, {
  id: string; title: string; category: string; points: number; difficulty: string;
  labPort: string; flag: string; scenario: string; instructions: string[];
  vulnerableCode: string; secureCode: string;
  sast: { ruleId: string; severity: string; message: string; line: number }[];
  dast: string[];
}> = {
  "sqli-101": {
    id: "1", title: "SQL Injection 101", category: "SQL Injection", points: 100, difficulty: "beginner", labPort: "8081",
    flag: "flag{sql_1nj3ct10n_bypas5_auth_99}",
    scenario: "SecureCorp's administration dashboard passes form inputs directly into a raw SQL query string without parameterisation, allowing an attacker to override query logic.",
    instructions: [
      "Start the lab and navigate to the login form at http://localhost:8081.",
      "Enter a tautology payload in the username field: admin' OR '1'='1",
      "Observe that authentication is bypassed and the flag is returned.",
    ],
    vulnerableCode: `@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']

    # VULNERABLE: direct string interpolation
    query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
    cursor.execute(query)
    user = cursor.fetchone()

    if user:
        return jsonify({"flag": "flag{sql_1nj3ct10n_bypas5_auth_99}"})
    return jsonify({"error": "Unauthorized"}), 401`,
    secureCode: `@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']

    # SECURE: parameterised query — user input never touches query structure
    query = "SELECT * FROM users WHERE username = %s AND password = %s"
    cursor.execute(query, (username, password))
    user = cursor.fetchone()

    if user:
        return jsonify({"status": "ok"})
    return jsonify({"error": "Unauthorized"}), 401`,
    sast: [{ ruleId: "python.flask.sqli.string-format", severity: "CRITICAL", message: "SQL string formatting inside cursor.execute(). Use parameterised queries.", line: 7 }],
    dast: ["[CRITICAL] SQL Injection on parameter 'username' at POST /login", "Confirmed: authentication bypass via payload: admin' OR '1'='1", "Extracted backend DBMS: SQLite 3.39.0"],
  },
  "xss-discovery": {
    id: "2", title: "XSS Discovery", category: "XSS", points: 200, difficulty: "easy", labPort: "8082",
    flag: "flag{xss_reflected_cookie_steal_88}",
    scenario: "The corporate search portal reflects the q query parameter directly into the HTML response without encoding, enabling script injection.",
    instructions: [
      "Start the lab and navigate to http://localhost:8082/search.",
      "Set q to a script payload: <script>alert(document.cookie)</script>",
      "Observe the alert firing, confirming reflected XSS. The flag appears in the response.",
    ],
    vulnerableCode: `app.get('/search', (req, res) => {
  const query = req.query.q;

  // VULNERABLE: template literal renders raw user input into HTML
  res.send(\`<h1>Results</h1><p>You searched: \${query}</p>\`);
});`,
    secureCode: `const he = require('he');

app.get('/search', (req, res) => {
  const query = req.query.q;

  // SECURE: HTML-encode before rendering
  const safe = he.encode(query);
  res.send(\`<h1>Results</h1><p>You searched: \${safe}</p>\`);
});`,
    sast: [{ ruleId: "javascript.express.xss.reflected", severity: "HIGH", message: "User-controlled data rendered into HTML response without encoding.", line: 4 }],
    dast: ["[HIGH] Reflected XSS on GET /search parameter 'q'", "Payload executed: <script>alert(1)</script>"],
  },
  "broken-auth": {
    id: "3", title: "Broken Authentication", category: "Authentication", points: 400, difficulty: "medium", labPort: "8083",
    flag: "flag{session_fixation_auth_hijack_77}",
    scenario: "The login handler reuses the pre-login session ID after authentication, allowing an attacker to fixate a known session ID and inherit elevated privileges.",
    instructions: [
      "Capture a pre-login session cookie.",
      "Inject the session ID into a victim browser before they log in.",
      "After the victim authenticates, refresh your tab — the session is now privileged.",
    ],
    vulnerableCode: `app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (validateCredentials(username, password)) {
    // VULNERABLE: session not regenerated on privilege change
    req.session.user = username;
    res.json({ success: true });
  }
});`,
    secureCode: `app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (validateCredentials(username, password)) {
    // SECURE: regenerate session ID to invalidate any pre-auth fixation
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.user = username;
      res.json({ success: true });
    });
  }
});`,
    sast: [{ ruleId: "express.session.no-regenerate", severity: "MEDIUM", message: "Session ID not regenerated after privilege escalation. Vulnerable to Session Fixation.", line: 5 }],
    dast: ["[MEDIUM] Session fixation: connect.sid unchanged after login"],
  },
  "idor-challenge": {
    id: "4", title: "IDOR Challenge", category: "Access Control", points: 400, difficulty: "medium", labPort: "8084",
    flag: "flag{idor_access_control_bypass_33}",
    scenario: "The profile API accepts an id parameter from the request and fetches the corresponding record without checking whether the requesting user is authorised to access it.",
    instructions: [
      "Log in and view your own profile — note the id value in the URL.",
      "Modify the id parameter to another user's ID (e.g. 1, 2).",
      "Retrieve the admin profile to get the flag.",
    ],
    vulnerableCode: `@app.route('/api/v1/profile')
def get_profile():
    # VULNERABLE: id comes from query string, no ownership check
    user_id = request.args.get('id')
    profile = db.query("SELECT * FROM profiles WHERE id = %s", user_id)
    return jsonify(profile)`,
    secureCode: `@app.route('/api/v1/profile')
@login_required
def get_profile():
    # SECURE: id is taken from the authenticated JWT, not from user input
    user_id = g.current_user.id
    profile = db.query("SELECT * FROM profiles WHERE id = %s", user_id)
    return jsonify(profile)`,
    sast: [{ ruleId: "python.flask.idor.unbound-param", severity: "HIGH", message: "Profile query driven by user-controlled request parameter without authorisation check.", line: 4 }],
    dast: ["[HIGH] IDOR on /api/v1/profile — able to enumerate user records by ID"],
  },
  "cmd-injection": {
    id: "5", title: "Command Injection", category: "Injection", points: 800, difficulty: "hard", labPort: "8085",
    flag: "flag{rce_command_chaining_success_55}",
    scenario: "A network diagnostics endpoint passes the user-supplied ip parameter directly to a shell command, enabling arbitrary OS command chaining.",
    instructions: [
      "Navigate to GET /api/ping?ip=127.0.0.1 — observe the ping output.",
      "Chain a second command: 127.0.0.1; cat /flag.txt",
      "Read the flag from the response.",
    ],
    vulnerableCode: `const { exec } = require('child_process');

app.get('/api/ping', (req, res) => {
  const ip = req.query.ip;

  // VULNERABLE: raw string concatenation into shell
  exec(\`ping -c 4 \${ip}\`, (err, stdout) => {
    res.json({ results: stdout });
  });
});`,
    secureCode: `const { execFile } = require('child_process');

app.get('/api/ping', (req, res) => {
  const ip = req.query.ip;

  // SECURE: binary + discrete args — no shell parsing, no injection
  execFile('ping', ['-c', '4', ip], (err, stdout) => {
    res.json({ results: stdout });
  });
});`,
    sast: [{ ruleId: "javascript.child-process.exec-injection", severity: "CRITICAL", message: "Dynamic string passed to exec(). Use execFile() with argument arrays.", line: 7 }],
    dast: ["[CRITICAL] OS Command Injection on GET /api/ping parameter 'ip'", "Confirmed RCE via payload: 127.0.0.1; id"],
  },
  "secure-input": {
    id: "6", title: "Secure Coding: Input Validation", category: "Secure Coding", points: 200, difficulty: "easy", labPort: "8086",
    flag: "flag{s3cur3_1nput_val1dat10n_succ3ss}",
    scenario: "A file viewer endpoint constructs the file path by concatenating a user-supplied filename to a base directory without sanitising traversal sequences.",
    instructions: [
      "Navigate to GET /view?filename=notes.txt — observe the response.",
      "Apply a traversal payload: ../../etc/passwd",
      "Retrieve /flag.txt using the traversal path to capture the flag.",
    ],
    vulnerableCode: `@app.route('/view')
def view_file():
    filename = request.args.get('filename')

    # VULNERABLE: traversal sequences not stripped
    filepath = os.path.join('/var/www/uploads', filename)

    with open(filepath, 'r') as f:
        return f.read()`,
    secureCode: `@app.route('/view')
def view_file():
    filename = request.args.get('filename')

    # SECURE: basename strips traversal; realpath enforces boundary
    safe_name = os.path.basename(filename)
    filepath   = os.path.realpath(os.path.join('/var/www/uploads', safe_name))

    if not filepath.startswith('/var/www/uploads/'):
        abort(403)

    with open(filepath, 'r') as f:
        return f.read()`,
    sast: [{ ruleId: "python.flask.path-traversal.os-join", severity: "HIGH", message: "User input passed to os.path.join() without sanitisation. Path traversal possible.", line: 6 }],
    dast: ["[HIGH] Path traversal confirmed on GET /view parameter 'filename'", "Read /etc/passwd using payload: ../../etc/passwd"],
  },
  "fintech-bank": {
    id: "7", title: "Fintech Race Condition", category: "Secure Coding", points: 500, difficulty: "medium", labPort: "8087",
    flag: "flag{f1nt3ch_rac3_c0nd1t10n_ov3rdr4ft_succ3ss}",
    scenario: "The wire transfer handler reads the current balance, sleeps to simulate DB latency, then conditionally deducts — without holding a mutex. Concurrent requests all see the pre-deduction balance and each proceed to deduct.",
    instructions: [
      "Open the lab at http://localhost:8087 and observe the balance.",
      "Click 'Perform Flash Transfer' — this fires three simultaneous POST /transfer requests.",
      "All three pass the balance check concurrently and deduct. Balance drops below -$100, triggering the flag.",
    ],
    vulnerableCode: `# VULNERABLE: read-check-write without a lock
@app.route('/transfer', methods=['POST'])
def transfer():
    amount = int(request.args.get('amount', 0))

    current_balance = db['balance']   # read
    time.sleep(0.4)                   # latency window — race here

    if current_balance >= amount:
        db['balance'] = current_balance - amount  # write
        return jsonify({"status": "success"})
    return jsonify({"status": "rejected"}), 400`,
    secureCode: `import threading

db_lock = threading.Lock()

# SECURE: entire read-check-write is an atomic critical section
@app.route('/transfer', methods=['POST'])
def transfer():
    amount = int(request.args.get('amount', 0))

    with db_lock:
        if db['balance'] >= amount:
            db['balance'] -= amount
            return jsonify({"status": "success"})
        return jsonify({"status": "rejected"}), 400`,
    sast: [{ ruleId: "python.concurrency.toctou.unsynchronised-state", severity: "HIGH", message: "Shared mutable state modified outside a synchronisation primitive. TOCTOU race condition.", line: 9 }],
    dast: ["[HIGH] Concurrent POST /transfer requests bypass balance validation", "Balance reduced to -$140 via three simultaneous $80 transfers"],
  },
};

const severityClass: Record<string, string> = {
  CRITICAL: "sev-critical",
  HIGH:     "sev-high",
  MEDIUM:   "sev-medium",
  LOW:      "sev-low",
};

const difficultyClass: Record<string, string> = {
  beginner:     "diff-beginner",
  easy:         "diff-easy",
  medium:       "diff-medium",
  hard:         "diff-hard",
  expert:       "diff-expert",
};

type Tab = "scenario" | "sast" | "dast" | "remediation";

export default function ChallengeDetailPage({ params }: { params: { slug: string } }) {
  const challenge = challengeDataMap[params.slug];
  const [tab, setTab] = useState<Tab>("scenario");
  const [labState, setLabState] = useState<"stopped" | "starting" | "running">("stopped");
  const [isSecureMode, setIsSecureMode] = useState(false);
  const [flagInput, setFlagInput] = useState("");
  const [dastTool, setDastTool] = useState(0); // index into walkthrough tools array
  const [result, setResult] = useState<"idle" | "correct" | "wrong">("idle");
  const [dbChallenge, setDbChallenge] = useState<any>(null);
  const { refresh } = useAuth();

  useEffect(() => {
    const loadChallenge = async () => {
      try {
        const headers = getAuthHeaders();
        const res = await fetch(`${API_BASE}/api/v1/challenges/slug/${params.slug}`, {
          headers
        });
        if (res.ok) {
          const data = await res.json();
          setDbChallenge(data);
        }
      } catch (err) {
        console.error("Failed to load challenge from API:", err);
      }
    };
    loadChallenge();
  }, [params.slug]);

  if (!challenge) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 max-w-screen-xl mx-auto w-full px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground mb-2">Challenge not found</p>
          <p className="text-xs text-muted-foreground/60 font-mono">{params.slug}</p>
          <Link href="/" className="mt-6 inline-block text-sm text-primary hover:underline">Back to dashboard</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const toggleLab = async () => {
    if (labState === "starting") return;
    const action = labState === "stopped" ? "start" : "stop";
    setLabState("starting");
    try {
      const res = await fetch("http://localhost:8080/api/v1/public/labs/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, challenge: params.slug }),
      });
      if (!res.ok) throw new Error("Failed");
      setLabState(action === "start" ? "running" : "stopped");
      trackActivity({ type: action === "start" ? "lab_started" : "lab_stopped", challengeSlug: params.slug });
    } catch {
      setLabState(labState === "stopped" ? "stopped" : "running");
      toast.error("Could not reach backend. Make sure Docker and the API server are running.");
    }
  };

  const submitFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbChallenge) {
      toast.error("Challenge is still loading. Please try again in a moment.");
      return;
    }
    setResult("idle");
    try {
      const headers = {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      };
      const res = await fetch(`${API_BASE}/api/v1/challenges/${dbChallenge.id}/submit`, {
        method: "POST",
        headers,
        body: JSON.stringify({ flag: flagInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.correct) {
        setResult("correct");
        refresh(); // update header points/levels dynamically
      } else {
        setResult("wrong");
      }
      trackActivity({ type: "flag_submitted", challengeSlug: params.slug, metadata: { correct: String(data.correct ?? false) } });
    } catch (err) {
      console.error("Failed to submit flag:", err);
      setResult("wrong");
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "scenario",    label: "Scenario"    },
    { key: "sast",        label: "SAST"        },
    { key: "dast",        label: "DAST"        },
    { key: "remediation", label: "Remediation" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-6 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-foreground">{challenge.title}</span>
        </div>

        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-start gap-4 justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={cn("text-xs font-semibold px-2 py-0.5 rounded", difficultyClass[challenge.difficulty])}>
                {challenge.difficulty}
              </span>
              <span className="text-xs text-muted-foreground">{challenge.category}</span>
            </div>
            <h1 className="text-2xl font-semibold text-foreground">{challenge.title}</h1>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground">Reward</p>
            <p className="text-xl font-bold text-primary font-mono">{challenge.points} pts</p>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: tabs */}
          <div className="lg:col-span-2 space-y-0">
            {/* Live Sandbox Browser Frame */}
            {labState === "running" && challenge.labPort && (
              <div className="border border-border rounded-lg overflow-hidden bg-card shadow-lg mb-6">
                {/* Sandbox Header / Toolbar */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-muted/70 border-b border-border/80 text-xs">
                  <div className="flex items-center gap-2">
                    {/* macOS Traffic Lights */}
                    <div className="flex gap-1.5 mr-2">
                      <span className="w-3 h-3 rounded-full bg-red-500/80 shadow-sm"></span>
                      <span className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-sm"></span>
                      <span className="w-3 h-3 rounded-full bg-green-500/80 shadow-sm"></span>
                    </div>
                    <span className="text-muted-foreground/40 font-mono select-none">|</span>
                    {/* Simulated URL Bar */}
                    <div className="flex items-center gap-1.5 ml-2 font-mono text-[11px] text-muted-foreground bg-background px-3 py-1 rounded border border-border/50 shadow-inner w-60 md:w-80 overflow-hidden text-ellipsis whitespace-nowrap">
                      <span className="text-emerald-500 font-bold shrink-0">🔒 secure-sandbox://</span>
                      <span>localhost:{challenge.labPort}</span>
                    </div>
                  </div>

                  {/* Mode Selector Toggle Switch */}
                  <div className="flex items-center gap-1 bg-background border border-border/60 rounded-md p-0.5 shadow-inner shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsSecureMode(false)}
                      className={cn(
                        "px-2.5 py-1 rounded text-[10px] font-bold transition-all uppercase tracking-wider",
                        !isSecureMode
                          ? "bg-destructive/15 text-destructive border border-destructive/25 shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Vulnerable
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSecureMode(true)}
                      className={cn(
                        "px-2.5 py-1 rounded text-[10px] font-bold transition-all uppercase tracking-wider",
                        isSecureMode
                          ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/25 shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Secure Patch
                    </button>
                  </div>
                </div>

                {/* Live Sandbox Iframe Viewport */}
                <div className="relative aspect-video w-full bg-white">
                  <iframe
                    src={`http://localhost:${challenge.labPort}?secure=${isSecureMode}`}
                    className="w-full h-full border-none bg-white"
                    title="Live Sandbox Container"
                    key={`${isSecureMode}-${challenge.labPort}`}
                  />
                </div>
              </div>
            )}

            {/* Tab bar */}
            <div className="flex border-b border-border">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                    tab === t.key
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="pt-5">

              {tab === "scenario" && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Threat Scenario</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{challenge.scenario}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Exploitation Steps</h3>
                    <ol className="space-y-2">
                      {challenge.instructions.map((inst, i) => (
                        <li key={i} className="flex gap-3 text-sm">
                          <span className="font-mono text-xs text-muted-foreground mt-0.5 shrink-0">{i + 1}.</span>
                          <span className="text-muted-foreground leading-relaxed">{inst}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}

              {tab === "sast" && (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">Static analysis findings from the vulnerable implementation.</p>
                  {challenge.sast.map((f, i) => (
                    <div key={i} className={cn("flex gap-3 p-3 rounded border text-xs", severityClass[f.severity])}>
                      <span className="font-semibold shrink-0 font-mono">{f.severity}</span>
                      <div>
                        <p className="font-mono mb-0.5">{f.ruleId} (line {f.line})</p>
                        <p className="opacity-80">{f.message}</p>
                      </div>
                    </div>
                  ))}
                  <div className="code-block mt-4">
                    <div className="text-muted-foreground text-[10px] font-mono mb-2 pb-2 border-b border-border/50">vulnerable_code.py</div>
                    <pre className="whitespace-pre text-xs">{challenge.vulnerableCode}</pre>
                  </div>
                </div>
              )}

              {tab === "dast" && (
                <DastPanel slug={params.slug} dastTool={dastTool} setDastTool={setDastTool} />
              )}

              {tab === "remediation" && (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">Secure implementation that mitigates the identified vulnerability.</p>
                  <div className="code-block">
                    <div className="text-muted-foreground text-[10px] font-mono mb-2 pb-2 border-b border-border/50">secure_code.py</div>
                    <pre className="whitespace-pre text-xs">{challenge.secureCode}</pre>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Right: lab control + flag submission */}
          <div className="space-y-5">

            {/* Lab control */}
            <div className="border border-border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Lab Sandbox</h3>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className={cn(
                    "pulse-dot",
                    labState === "running" ? "online" : labState === "starting" ? "pending" : "offline"
                  )} />
                  <span className={
                    labState === "running"  ? "status-online"  :
                    labState === "starting" ? "status-pending"  : "status-offline"
                  }>
                    {labState === "running" ? "Online" : labState === "starting" ? "Starting…" : "Offline"}
                  </span>
                </div>
              </div>

              {labState === "running" && (
                <div className="mb-3 p-3 rounded bg-muted/40 border border-border space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">URL</span>
                    <a href={`http://localhost:${challenge.labPort}`} target="_blank" rel="noopener noreferrer"
                       className="text-primary hover:underline">
                      http://localhost:{challenge.labPort}
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Container</span>
                    <span className="text-foreground">tygrsec-academy-{params.slug}</span>
                  </div>
                </div>
              )}

              <button
                onClick={toggleLab}
                disabled={labState === "starting"}
                className={cn(
                  "w-full text-sm font-semibold py-2 rounded transition-colors disabled:opacity-50",
                  labState === "running"
                    ? "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {labState === "starting" ? "Please wait…" : labState === "running" ? "Stop Lab" : "Start Lab"}
              </button>
            </div>

            {/* Flag submission */}
            <div className="border border-border rounded-lg p-4 bg-card">
              <h3 className="text-sm font-semibold text-foreground mb-3">Submit Flag</h3>
              <form onSubmit={submitFlag} className="space-y-3">
                <input
                  type="text"
                  placeholder="flag{...}"
                  value={flagInput}
                  onChange={(e) => { setFlagInput(e.target.value); setResult("idle"); }}
                  className={cn(
                    "w-full h-9 px-3 rounded border bg-background text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1",
                    result === "correct" ? "border-emerald-500/60 focus:ring-emerald-500" :
                    result === "wrong"   ? "border-destructive/60 focus:ring-destructive" :
                    "border-border focus:ring-primary"
                  )}
                />
                <button
                  type="submit"
                  disabled={!flagInput.trim() || result === "correct"}
                  className="w-full text-sm font-semibold py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {result === "correct" ? "Correct!" : "Submit"}
                </button>
                {result !== "idle" && (
                  <p className={cn(
                    "text-xs text-center",
                    result === "correct" ? "text-emerald-500" : "text-destructive"
                  )}>
                    {result === "correct"
                      ? `Challenge solved. +${challenge.points} XP awarded.`
                      : "Incorrect flag. Review your findings."}
                  </p>
                )}
              </form>
            </div>

          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}

// ─── DAST Panel with tool switcher ─────────────────────────────────────────

function DastPanel({
  slug,
  dastTool,
  setDastTool,
}: {
  slug: string;
  dastTool: number;
  setDastTool: (i: number) => void;
}) {
  const tools = dastWalkthroughs[slug];

  if (!tools || tools.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        No DAST walkthrough available for this challenge yet.
      </div>
    );
  }

  const activeTool = tools[dastTool] ?? tools[0];

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">
        Step-by-step dynamic analysis walkthrough using different security testing tools.
      </p>

      {/* Tool tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        {tools.map((t, i) => (
          <button
            key={t.tool}
            onClick={() => setDastTool(i)}
            className={cn(
              "px-3 py-1.5 rounded text-xs font-semibold transition-colors font-mono",
              dastTool === i
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {activeTool.steps.map((step, i) => (
          <div key={i} className="border border-border rounded-lg overflow-hidden bg-card">
            {/* Step header */}
            <div className="px-4 py-3 flex items-start gap-3">
              <span className="font-mono text-xs text-muted-foreground mt-0.5 shrink-0 font-bold">
                {i + 1}.
              </span>
              <p className="text-sm text-foreground leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Command block */}
            {step.command && (
              <div className="mx-4 mb-3">
                <div className="code-block !p-3 !text-[11.5px] !leading-relaxed">
                  <pre className="whitespace-pre-wrap">{step.command}</pre>
                </div>
              </div>
            )}

            {/* Expected + Tip */}
            {(step.expected || step.tip) && (
              <div className="px-4 pb-3 space-y-2">
                {step.expected && (
                  <div className="flex gap-2 text-xs">
                    <span className="text-muted-foreground font-semibold shrink-0">Expected:</span>
                    <span className="text-muted-foreground font-mono leading-relaxed">{step.expected}</span>
                  </div>
                )}
                {step.tip && (
                  <div className="flex gap-2 text-xs bg-primary/5 border border-primary/10 rounded px-3 py-2">
                    <span className="text-primary font-semibold shrink-0">Tip:</span>
                    <span className="text-muted-foreground leading-relaxed">{step.tip}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
