export interface MCQQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hints: string[];
}

export interface MCQCategory {
  id: string;
  name: string;
  maxScore: number;
  questions: MCQQuestion[];
}

export const mcqCategories: Record<string, MCQCategory> = {
  "broken-access-control": {
    id: "broken-access-control",
    name: "Broken Access Control",
    maxScore: 200,
    questions: [
      {
        question: "Can a normal user access resources meant for an admin by modifying URLs or API requests?",
        options: [
          "No. The frontend client code runs in a secure sandbox that cannot be modified or bypassed.",
          "No. HTTP protocols automatically prevent standard user accounts from routing to administrative API routes.",
          "Yes. If the server fails to validate JWT role claims or session attributes on the backend controller handlers.",
          "Yes. But only if they run specialized Linux administrative terminal applications."
        ],
        correctIndex: 2,
        explanation: "Frontend visibility checks only improve UX. If backend handlers do not explicitly authorize requests, any standard client can call endpoints like /api/v1/admin/users directly using standard HTTP tools (e.g. curl).",
        hints: ["Direct HTTP requests bypass all frontend route guards entirely.", "Backend validation must verify the request's JWT claims."]
      },
      {
        question: "What happens if I change user IDs in a request (IDOR test)?",
        options: [
          "If the backend lacks validation mapping data to context session owners, you will successfully fetch other users' private objects.",
          "The database driver throws a primary key violation and shuts down the connection pools automatically.",
          "The client browser intercepts parameter tampering and blocks outbound requests.",
          "Nothing, because APIs do not permit variables in HTTP query parameters."
        ],
        correctIndex: 0,
        explanation: "Insecure Direct Object References occur when the application fetches objects directly using client-supplied parameters without verifying if the authenticated user owns that resource.",
        hints: ["Check if queries filter by the current session user UUID or arbitrary input variables.", "Backend must authorize ownership, not just user existence."]
      },
      {
        question: "Are authorization checks enforced on the server side or only on the frontend?",
        options: [
          "On the frontend only, because React route guards protect all APIs from unauthenticated access.",
          "On neither; authorization is handled strictly by database constraints.",
          "Strictly on the server side, as the frontend is fully controlled by the user and untrusted.",
          "On both equally to distribute query processing times across client machines."
        ],
        correctIndex: 2,
        explanation: "The client browser is an untrusted environment entirely under user control. Route validation must always execute on the server API handlers.",
        hints: ["Treat client-side data (including route states) as highly modifiable.", "Client side is for user convenience, backend is for enforceability."]
      },
      {
        question: "Can I bypass role restrictions using tools like Postman/Burp Suite?",
        options: [
          "No. Intercept proxies only support analytical read operations.",
          "Yes. By intercepting and altering JSON parameters, headers, or cookies before the request hits the server.",
          "No, because API gateways isolate requests originating from desktop applications.",
          "Yes, but only if the target is running in debug mode."
        ],
        correctIndex: 1,
        explanation: "Attack proxies intercept outgoing traffic, allowing you to manipulate administrative parameters (e.g., swapping is_admin: false to is_admin: true) or headers directly.",
        hints: ["Intercept outbound requests in Burp Suite and forward modified values.", "Proxy intercepts request between client browser and application backend."]
      },
      {
        question: "Are access control rules centralized or scattered across the code?",
        options: [
          "Scattered across query files to reduce API routing overhead.",
          "Centralized in middleware patterns to ensure consistent authorization checks and prevent omission errors.",
          "Stored in client configurations to speed up dashboard initialization.",
          "Configured using filesystem read/write privileges on the host server."
        ],
        correctIndex: 1,
        explanation: "Centralized authorization (e.g. gateway middlewares or decorator interceptors) protects endpoints consistently. Scattered rules are highly prone to oversight.",
        hints: ["Look at Go middlewares to see how access tokens are validated globally.", "Scattered checks introduce human error and bypass pathways."]
      }
    ]
  },
  "cryptography": {
    id: "cryptography",
    name: "Cryptographic Failures",
    maxScore: 200,
    questions: [
      {
        question: "Is sensitive data (passwords, tokens, PII) encrypted at rest and in transit?",
        options: [
          "In transit only. Data written to hard drives is physically secure inside firewalled datacenters.",
          "At rest only. SSL is unnecessary if the network utilizes private cloud connections.",
          "Both. Transit requires TLS (HTTPS), and rest requires secure ciphers (e.g. AES-256-GCM) or salted hashing.",
          "Neither. Encryption overhead degrades ledger throughput and must be avoided."
        ],
        correctIndex: 2,
        explanation: "Sensitive data must be protected dynamically in transit via HTTPS and statically at rest utilizing strong ciphers and hashing functions.",
        hints: ["Check network payloads for TLS handshakes and database schema columns for ciphertext.", "Standard compliance mandates defense-in-depth security."]
      },
      {
        question: "Are we using strong algorithms (e.g., AES, SHA-256) or outdated ones (e.g., MD5, SHA-1)?",
        options: [
          "MD5 is preferred because it processes hashes quickly with low resource overhead.",
          "Strong algorithms (Argon2id, AES-GCM) are required. Outdated systems suffer from rapid collision exploits.",
          "Weak algorithms are safe if the database is configured in read-only mode.",
          "Outdated algorithms are automatically hardened by secure system runtimes."
        ],
        correctIndex: 1,
        explanation: "MD5 and SHA-1 have been cryptographically broken. Attackers crack weak hashes instantly using rainbow tables and custom GPU hardware.",
        hints: ["Standard security tools can crack millions of MD5 hashes per second.", "Collision attacks make MD5 hashes unsafe for identity verification."]
      },
      {
        question: "Are keys/secrets hardcoded in the application?",
        options: [
          "Yes, inside configs to ensure components spin up with zero latency.",
          "Yes, in source code so the development team shares authentication variables easily.",
          "No. Secrets must be stored in secure env variables or dynamic configuration managers at runtime.",
          "No. Encryption keys are generated dynamically inside the client browser."
        ],
        correctIndex: 2,
        explanation: "Storing keys in git history allows anyone with repository access to extract them. Secrets must be decoupled from the code.",
        hints: ["Leverage Semgrep rules to trace config files and block hardcoded API tokens.", "Config management separates configuration settings from source code."]
      },
      {
        question: "Is HTTPS enforced everywhere?",
        options: [
          "Only on login boundaries to conserve pipeline bandwidth.",
          "Yes. Enforced globally and reinforced via the HSTS header to block connection downgrade attacks.",
          "Only when processing external payment gateways.",
          "No. Browsers resolve HTTP routing securely by default."
        ],
        correctIndex: 1,
        explanation: "HTTPS must be configured globally. The Strict-Transport-Security (HSTS) header forces client browsers to establish TLS handshakes.",
        hints: ["HSTS ensures browsers automatically request HTTPS even if an unencrypted link was clicked.", "Mixed content errors arise if resources are requested over HTTP."]
      },
      {
        question: "How are passwords stored—plain text, hashed, with salt?",
        options: [
          "Plain text inside private, firewalled database systems.",
          "Encrypted using reversible symmetric ciphers so administrators can retrieve lost keys.",
          "One-way hashed using Argon2id or bcrypt, combined with a unique, random salt for every record.",
          "Hashed using fast SHA-1 digests to ensure rapid database logins."
        ],
        correctIndex: 2,
        explanation: "Passwords must never be reversible. Cryptographic salts guarantee that identical input passwords yield distinct hash digests, neutralizing precomputed tables.",
        hints: ["Salts defend database records against massive lookups (rainbow tables).", "One-way functions make it impossible to reconstruct passwords from the hash."]
      }
    ]
  },
  "insecure-design": {
    id: "insecure-design",
    name: "Insecure Design",
    maxScore: 200,
    questions: [
      {
        question: "Was threat modeling done before development?",
        options: [
          "No. Threat modeling is only executed during post-exploit forensics.",
          "Yes. Running frameworks like STRIDE early in development flags design flaws before code is written.",
          "Yes, by running dynamic security scans on container images.",
          "No. Standard modern container frameworks manage threats automatically."
        ],
        correctIndex: 1,
        explanation: "Threat modeling (using STRIDE or PASTA) evaluates system boundaries, data flows, and actors during planning to resolve vulnerabilities early.",
        hints: ["STRIDE evaluates: Spoofing, Tampering, Repudiation, Info Disclosure, DoS, Elevation of Privilege.", "Design issues cannot be resolved by standard automated syntax scanners."]
      },
      {
        question: "Are security requirements defined for this feature?",
        options: [
          "Yes. Crucial security parameters are declared alongside standard functional metrics during design.",
          "No. Security parameters are only defined if auditing compliance requires it.",
          "Requirements are only declared for user profiles with elevated privileges.",
          "Yes, by running basic unit checks on compiler logs."
        ],
        correctIndex: 0,
        explanation: "Security must be treated as a core design requirement rather than an afterthought.",
        hints: ["Declare access controls, encryption, and logging parameters in the product specification.", "Clear security boundaries help developers build resilient APIs."]
      },
      {
        question: "What assumptions were made about user behavior or trust?",
        options: [
          "We assume that users are trusted once inside the firewall.",
          "We assume inputs conforming to frontend validation formats are safe.",
          "We apply Zero Trust: all client environments are untrusted and must validate authentication continuously.",
          "We assume user behavior is safe unless they route requests through debugging tools."
        ],
        correctIndex: 2,
        explanation: "A secure design assumes all clients, networks, and environments are compromised. Every request must validate identity and authorization dynamically.",
        hints: ["Never assume user execution is limited by your React frontend form wrappers.", "Network boundaries are easily breached; validate inputs at each microservice boundary."]
      },
      {
        question: "Can business logic be abused (e.g., skipping payment steps)?",
        options: [
          "Yes, if backend API state checks do not strictly enforce sequential transactional dependencies.",
          "No, because business rules are protected by database key constraints.",
          "Yes, but only if the user has direct server filesystem permissions.",
          "No. Modern payment processors block transaction gaps automatically."
        ],
        correctIndex: 0,
        explanation: "If backend handlers fail to verify state transitions (e.g. confirming a payment record exists in the DB before checking out), users bypass steps by calling the API directly.",
        hints: ["Enforce state transition rules on the server so step B requires a verified step A DB log.", "State machines should track multi-step transaction steps securely."]
      },
      {
        question: "Is there rate limiting in place for sensitive operations?",
        options: [
          "No. Rate limits are only used for media asset delivery to conserve bandwidth.",
          "Only on unauthenticated static files.",
          "Yes. Sensitive endpoints require rate limits to block automated scripting and credential stuffing.",
          "Yes, but only for cloud-hosted container environments."
        ],
        correctIndex: 2,
        explanation: "Sensitive endpoints (e.g. login, checkout, password resets) must limit requests per client to defend against dictionary attacks and DoS.",
        hints: ["Lack of API rate limits allows attackers to perform massive automated testing campaigns.", "Rate limiters track requests utilizing IP headers or API tokens."]
      }
    ]
  },
  "vulnerable-components": {
    id: "vulnerable-components",
    name: "Vulnerable and Outdated Components",
    maxScore: 200,
    questions: [
      {
        question: "Are all libraries and dependencies updated?",
        options: [
          "No, keeping outdated components prevents breaking changes and keeps the application stable.",
          "Yes, dependencies must be systematically updated and audited against vulnerability databases.",
          "Only if the library executes on public-facing internet routes.",
          "Outdated packages are automatically secured by modern compiler structures."
        ],
        correctIndex: 1,
        explanation: "Package ecosystems introduce daily security patches. Keeping libraries updated prevents attackers from exploiting documented holes.",
        hints: ["Use package lockfiles to maintain consistent and audited software builds.", "Stale packages become easier to exploit over time."]
      },
      {
        question: "Do any components have known CVEs?",
        options: [
          "Automated pipelines must audit all dependencies against vulnerability catalogs to block builds containing known CVEs.",
          "Known CVEs only affect legacy operating systems.",
          "Dependencies with CVEs are safe if isolated inside container boundaries.",
          "Libraries with high weekly downloads are immune to known CVEs."
        ],
        correctIndex: 0,
        explanation: "Integrate scanners (npm audit, snyk) into the pipeline. If a dependency contains a known vulnerability, it represents an active security gap.",
        hints: ["SCA scanners parse package manifests to cross-reference vulnerable structures automatically.", "A build fail rule should be triggered on critical severity CVEs."]
      },
      {
        question: "Are we using unsupported or deprecated frameworks?",
        options: [
          "Yes, deprecated frameworks are secure since their exploits are thoroughly documented.",
          "Only if we require legacy integrations with hardware servers.",
          "No. Deprecated packages are no longer patched and must be completely replaced.",
          "Deprecated packages are automatically protected by edge CDN networks."
        ],
        correctIndex: 2,
        explanation: "Deprecated code is abandoned by maintainers, meaning new security bugs will never be resolved.",
        hints: ["Check package maintenance status and replace inactive libraries.", "Out-of-date runtime versions contain security holes that will never receive updates."]
      },
      {
        question: "Is there a process to monitor vulnerabilities in dependencies?",
        options: [
          "Yes, integrating automated SCA tools in build pipelines ensures continuous monitoring of dependency structures.",
          "No, manual verification of dependencies every year is sufficient for modern systems.",
          "Monitoring is only required for financial database models.",
          "Monitoring is managed automatically by the cloud host infrastructure."
        ],
        correctIndex: 0,
        explanation: "Continuously scan libraries using automated pipeline gateways to alert teams when an active dependency is declared vulnerable.",
        hints: ["Deploy dependency bots to automatically update and patch insecure structures.", "Continuous integration ensures real-time scanning during code delivery."]
      },
      {
        question: "Are third-party integrations reviewed for security risks?",
        options: [
          "No, third-party libraries are secure if supplied by certified publishers.",
          "Yes, third-party code runs in our execution context and represents a critical supply-chain vector.",
          "Reviews are only required for unauthenticated APIs.",
          "Only if we utilize raw SQL queries inside third-party helpers."
        ],
        correctIndex: 1,
        explanation: "Imported packages execute with the application's runtime privileges. Malicious updates can hijack environment variables and leak sensitive keys.",
        hints: ["Inspect third-party permissions and audit package update logs.", "Third-party libraries must be scoped for required capabilities only."]
      }
    ]
  },
  "software-integrity": {
    id: "software-integrity",
    name: "Software and Data Integrity Failures",
    maxScore: 200,
    questions: [
      {
        question: "Are updates or patches verified before installation?",
        options: [
          "No, keeping auto-updates enabled without verification is safer.",
          "Yes. Updates must be cryptographically signed and their file hashes verified before run execution.",
          "Only if the package is fetched from an external network.",
          "Yes, by running them inside isolated VM spaces."
        ],
        correctIndex: 1,
        explanation: "Attackers hijack update channels. Cryptographically signing update payloads guarantees package origin and blocks tampering.",
        hints: ["Verify package hashes (SHA-256) against signed vendor releases before launching installers.", "Tampered scripts lack valid matching cryptographic keys."]
      },
      {
        question: "Is code integrity checked (e.g., hashes, signatures)?",
        options: [
          "Yes. Code packages, commits, and container images must use cryptographic verification (Sigstore).",
          "Verification is unnecessary if code is written in strongly-typed systems.",
          "Only for third-party client integrations.",
          "No, modern operating systems check integrity automatically."
        ],
        correctIndex: 0,
        explanation: "Enforce image signing (e.g. Cosign) in deployment pipelines. Verification guarantees that target deployment nodes run exactly what was built and compiled.",
        hints: ["Cryptographic signatures ensure artifact provenance, blocking unverified alterations.", "Verify commit keys using GPG or SSH signing flags."]
      },
      {
        question: "Are CI/CD pipelines secure from tampering?",
        options: [
          "Yes, since pipeline files are not checked into source control.",
          "Yes, by using isolated runners, exact secrets injection rules, and strict branch protection.",
          "Pipelines are secure if run on local private workstations.",
          "No, pipeline security does not impact compiled deployment bundles."
        ],
        correctIndex: 1,
        explanation: "Attackers target CI/CD systems to inject malicious components during compilation. Access controls and isolated execution runners defend pipelines.",
        hints: ["Enforce minimum privileges for API keys injected into runner scripts.", "Protect master/main branch configurations behind mandatory review checks."]
      },
      {
        question: "Can attackers inject malicious updates or dependencies?",
        options: [
          "Yes, via dependency confusion or repository hijacking. Block this via private registries and exact pinning.",
          "No, public registries audit and secure all uploads automatically.",
          "Only if the system relies on uncompiled Javascript modules.",
          "No, modern bundlers filter out malicious code automatically."
        ],
        correctIndex: 0,
        explanation: "Attackers upload identical internal package names to public registries (dependency confusion). Secure this by mapping exact registries in configurations.",
        hints: ["Review lock files to confirm explicit dependency origins and prevent name injection.", "Scoped packages block public registries from matching internal identifiers."]
      },
      {
        question: "Is deserialization handled safely?",
        options: [
          "Yes, by deserializing objects only when they come from authenticated sessions.",
          "Yes, by utilizing safe text interchange layouts (JSON/Protobuf) and avoiding raw binary serialization.",
          "Raw serialization is secure if objects are encrypted before execution.",
          "Deserialization safety is managed directly by the underlying operating system."
        ],
        correctIndex: 1,
        explanation: "Deserializing raw objects allows attackers to reconstruct customized classes that execute arbitrary commands. Safe text formats (JSON) neutralize this vector.",
        hints: ["Avoid loading arbitrary objects from Python pickles or Java serialized binaries.", "JSON does not carry execution methods or code classes."]
      }
    ]
  },
  "logging-monitoring": {
    id: "logging-monitoring",
    name: "Security Logging and Monitoring Failures",
    maxScore: 200,
    questions: [
      {
        question: "Are security-relevant events logged (login attempts, privilege changes)?",
        options: [
          "No, logging administrative changes degrades server memory throughput.",
          "Yes. All authentication, privilege shifts, and authorization failures must generate audit logs.",
          "Logs are only required for financial payment transfers.",
          "Yes, but only when debug logging is active."
        ],
        correctIndex: 1,
        explanation: "Comprehensive auditing logs provide the primary trail needed to detect attacks and reconstruct system state during incident responses.",
        hints: ["Record logins, credential modifications, and input validation failures in a secure audit log.", "Failed events represent key forensic detection targets."]
      },
      {
        question: "Can logs detect suspicious behavior or attacks?",
        options: [
          "Yes, by utilizing structured JSON formats containing client metadata to enable SIEM parsing.",
          "Only if we record every HTTP request payload directly into simple text files.",
          "No, logs are strictly forensic and cannot assist with active detection.",
          "Only when running on cloud-hosted Kubernetes clusters."
        ],
        correctIndex: 0,
        explanation: "Structured JSON logs (timestamps, client IPs, user IDs) allow monitoring tools (SIEMs) to automatically parse, cross-reference, and flag attacks.",
        hints: ["Avoid plain text logging statements; use structured key-value formats.", "Structured formats allow machine learning tools to run query metrics safely."]
      },
      {
        question: "Are logs protected from tampering?",
        options: [
          "Yes, by protecting local log files using standard admin passwords.",
          "Yes, by instantly sending logs to remote, append-only, read-once-write-many (WORM) storage.",
          "Tampering is impossible if logs are written inside Go system processes.",
          "Logs are protected by database replication configurations."
        ],
        correctIndex: 1,
        explanation: "If a server is compromised, attackers' first step is clearing local log files. Logging to secure, offsite, append-only vaults preserves the trail.",
        hints: ["Stream logs immediately to safe central collectors (e.g. AWS CloudWatch).", "Read-only logs prevent write operations from deleting history traces."]
      },
      {
        question: "Is there real-time alerting for critical incidents?",
        options: [
          "Yes. Critical events (e.g. privilege promotions) must trigger instant automated PagerDuty/Slack alerts.",
          "No, manual review of log trends every morning is sufficient.",
          "Alerts are only active during server maintenance windows.",
          "Real-time alerting is only possible with specialized hardware routers."
        ],
        correctIndex: 0,
        explanation: "High-risk operations (e.g. multi-failed logins, system deletions) must alert security operators immediately to minimize response window times.",
        hints: ["Connect monitoring thresholds directly to automated alarm handlers.", "Slow warnings hide active breaches; real-time notifications drive instant isolation."]
      },
      {
        question: "How long are logs retained and reviewed?",
        options: [
          "Deleted every 7 days to preserve host hard-drive space.",
          "Retained for 90 to 365 days, and audited via automated scheduled logic.",
          "Kept indefinitely inside standard PostgreSQL tables.",
          "Retained only until the container is recreated."
        ],
        correctIndex: 1,
        explanation: "Breaches are often identified months after the initial intrusion. Short logging retention periods wipe out critical forensically relevant evidence.",
        hints: ["Retain event logs inside secure archival systems for standard audit lengths.", "Compliance laws require archiving system trail keys for multiple months."]
      }
    ]
  },
  "injection": {
    id: "injection",
    name: "Injection (SQL, OS, LDAP, etc.)",
    maxScore: 200,
    questions: [
      {
        question: "What happens if I input ' OR 1=1 -- in form fields?",
        options: [
          "Connection pools exhaust, causing a temporary denial of service.",
          "If unparameterized, the injection breaks the query parser, returning a tautology that bypasses login checks.",
          "Modern browsers automatically strip quotes, returning a client 400 error.",
          "The database driver treats the characters strictly as a safe string literal."
        ],
        correctIndex: 1,
        explanation: "The quote `'` closes the intended SQL parameter, `OR 1=1` ensures the query matches a true statement, and `--` comments out the rest of the statement.",
        hints: ["SQL syntax injection forces the query to evaluate as always true.", "Parameters are evaluated separate from operational queries."]
      },
      {
        question: "Are queries parameterized or dynamically concatenated?",
        options: [
          "Parameterized. Database engines pre-compile queries and treat inputs strictly as literal values.",
          "Concatenated. Engines parse string parameters safely during execution.",
          "Concatenated using template literal additions inside custom handlers.",
          "Parameterized on client browsers and concatenated inside backend database drivers."
        ],
        correctIndex: 0,
        explanation: "Parameterization guarantees that the query compiler distinguishes executable database instructions from user-supplied data values.",
        hints: ["Go's prepared query statement bindings block payload parsing errors.", "Pre-compiled query structures ignore injection symbols."]
      },
      {
        question: "Can I inject commands through form inputs, headers, or API calls?",
        options: [
          "Only via standard form inputs. Request metadata is safe from command injection.",
          "Only inside URL query strings.",
          "Yes. Any unvalidated request interface (including user-agents and cookies) represents a potential sink.",
          "No. Command injection is physically limited to local shell terminals."
        ],
        correctIndex: 2,
        explanation: "Any untrusted request field can trigger injection if the backend passes its value directly to a shell processor (e.g. os.system).",
        hints: ["Treat every incoming HTTP header as malicious user parameter.", "Malicious characters can be injected inside metadata values like User-Agent."]
      },
      {
        question: "Is input validation and sanitization implemented consistently?",
        options: [
          "Yes, by matching incoming characters against custom blacklists.",
          "Yes, applying whitelisting regex at input gateways, and context-aware escaping on output.",
          "No. Input validation is redundant if database queries are parameterized.",
          "Yes, through basic validation scripts running in the client browser."
        ],
        correctIndex: 1,
        explanation: "Whitelisting only accepts verified patterns. Context-aware escaping ensures strings are safely rendered in HTML or shell contexts.",
        hints: ["Blacklisting is easily bypassed; whitelisting restricts variables to expected types.", "Output escaping renders character symbols completely safe."]
      },
      {
        question: "Are ORM frameworks used safely to avoid raw query execution?",
        options: [
          "Yes. ORMs are completely immune to injection vulnerabilities under all configurations.",
          "Yes, provided developers avoid introducing unparameterized raw SQL strings inside query hooks.",
          "No. ORM drivers are highly susceptible to injection, and raw database queries are preferred.",
          "Yes, if we disable ORM caching models in production."
        ],
        correctIndex: 1,
        explanation: "While ORMs (like GORM) parameterize data automatically, developers can bypass this security layer by using unparameterized raw methods (e.g. .Where(fmt.Sprintf(...))).",
        hints: ["Never use string formatting inside GORM database execution parameters.", "Format functions bypass secure ORM bind routines."]
      }
    ]
  },
  "security-misconfiguration": {
    id: "security-misconfiguration",
    name: "Security Misconfiguration",
    maxScore: 200,
    questions: [
      {
        question: "Are default credentials still enabled?",
        options: [
          "Yes, inside staging containers to simplify internal developer logins.",
          "No. All default profiles, credentials, and settings must be disabled or modified during provisioning.",
          "Default settings are secure provided they run behind firewall routers.",
          "Yes. Modern container environments automatically isolate default credentials."
        ],
        correctIndex: 1,
        explanation: "Attackers sweep services for default administrative accounts (e.g., admin/admin). Systems must enforce customized credentials during setup.",
        hints: ["Many security incidents are the direct result of unchanged backend dashboard logins.", "Never launch factory settings directly into deployment spaces."]
      },
      {
        question: "Are unnecessary services, ports, or features exposed?",
        options: [
          "Yes, inside VPC subnets to simplify communication between micro-services.",
          "No. Active ports and exposed services must be limited strictly to necessary runtime ports (e.g. 80/443).",
          "Unused ports are automatically secured by default cloud provider routers.",
          "Yes. Port exposures do not influence modern container runtime boundaries."
        ],
        correctIndex: 1,
        explanation: "Every open port or helper service represents an attack entry point. Disabling unnecessary features minimizes your system's attack surface.",
        hints: ["Scan your server profile regularly using network tools to find unexpected open services.", "Minimized footprint equals a minimized attack profile."]
      },
      {
        question: "Is debug mode enabled in production?",
        options: [
          "Yes, to assist support teams with real-time incident analysis.",
          "Only during manual patch updates.",
          "No. Active debug modes leak raw execution variables, config tables, and database stack traces to clients.",
          "Yes, provided the debug configuration is password-protected."
        ],
        correctIndex: 2,
        explanation: "Production runtimes must execute with DEBUG=false. Leaking system internals gives attackers a direct map to discover exploits.",
        hints: ["Verify that production environments inject secure production-specific config variables.", "Stack traces expose internal logic routes to any web client."]
      },
      {
        question: "Are security headers configured?",
        options: [
          "Yes. HTTP response headers (CSP, HSTS, X-Frame-Options) are configured to restrict malicious browser behavior.",
          "No. Security headers only affect deprecated static websites.",
          "Only when routing API queries to external identity providers.",
          "Yes, by verifying cookie parameters in client storage."
        ],
        correctIndex: 0,
        explanation: "Response headers instruct browsers to enforce security behaviors, such as blocking illegal resource injections (CSP) or clickjacking (X-Frame-Options).",
        hints: ["Review response headers inside API middlewares to verify hardening rules.", "Browser-enforced directives shield frontend instances against direct hijacking."]
      },
      {
        question: "Is error information leaking sensitive system details?",
        options: [
          "Yes. Database trace output is safe and helps developers optimize queries.",
          "No. Error messages must be safe on the frontend, and detailed traces written strictly to backend log files.",
          "Yes, to assist customer support in resolving user problems quickly.",
          "Only when executing inside local development configurations."
        ],
        correctIndex: 1,
        explanation: "Leaking SQL query compilation issues or backend code lines helps attackers reverse-engineer server structures.",
        hints: ["Enforce generic message blocks for HTTP exceptions (e.g. 'An unexpected error occurred').", "Trace logs belong exclusively inside restricted server directories."]
      }
    ]
  },
  "identification-authentication": {
    id: "identification-authentication",
    name: "Identification and Authentication Failures",
    maxScore: 200,
    questions: [
      {
        question: "Are strong password policies enforced?",
        options: [
          "No, strict rules complicate user registration metrics and decrease signups.",
          "Yes, mandating complexity, length checks, and matching inputs against leaked credential lists.",
          "Only for administrative backend dashboards.",
          "Yes, by encrypting password fields inside local client storage."
        ],
        correctIndex: 1,
        explanation: "Weak passwords are easily cracked via dictionary sweeps. Enforcing complexity and checking breached lists blocks predictable entries.",
        hints: ["Validate passwords against databases of common or breached authentication keys.", "Short, uncomplex character patterns are easily guessed by dictionary scripts."]
      },
      {
        question: "Is multi-factor authentication (MFA) implemented?",
        options: [
          "Yes, MFA provides dynamic secondary proof (TOTP, FIDO2) to neutralize password compromise.",
          "No, MFA is only required for server shell logins.",
          "MFA is only used if users request it from settings.",
          "Yes, via client-side cookie confirmation."
        ],
        correctIndex: 0,
        explanation: "MFA acts as a vital identity backup. Even if an attacker gains the password, they cannot bypass the secondary dynamic authenticator.",
        hints: ["Enforce MFA using authenticator apps (TOTP) or hardware keys (WebAuthn).", "Secondary authentication credentials verify session authorization dynamically."]
      },
      {
        question: "Are session IDs predictable or securely generated?",
        options: [
          "Generated sequentially to optimize index searches in the session database.",
          "Securely generated using CSPRNGs, transmitted via HttpOnly, Secure, and SameSite cookies.",
          "Stored directly in the URL to simplify stateless frontend routing.",
          "Predictable session IDs are safe if the user has an active antivirus."
        ],
        correctIndex: 1,
        explanation: "Session identifiers must be highly random. Storing them in secure cookies blocks client-side scripts from reading the token (HttpOnly) and prevents transit interception (Secure).",
        hints: ["Look at session token generation blocks to ensure they utilize cryptographically secure generation.", "Sequential integer session IDs are instantly hijacked by increment loops."]
      },
      {
        question: "How are login attempts handled—are accounts locked after multiple failures?",
        options: [
          "Login failures are ignored to ensure users can keep trying.",
          "Yes, using progressive cool-down delays or temporary locks to block brute-force scripting.",
          "Accounts are only locked if an incorrect login is attempted from an unrecognized IP.",
          "Locked only if the user is authenticated via OAuth."
        ],
        correctIndex: 1,
        explanation: "Without lockout thresholds or rate-limiting delays, attackers can automate millions of authentication attempts to compromise accounts.",
        hints: ["Enforce IP-level and username-level cool-down buckets on login API controllers.", "Unlimited authentication loops allow dictionaries to crack active keys."]
      },
      {
        question: "Are session tokens invalidated on logout?",
        options: [
          "Yes, immediately destroyed in the backend session store and cleared from client cookies.",
          "No, tokens can persist since they expire automatically after 24 hours.",
          "Only cleared on the frontend browser to improve client response speed.",
          "Tokens are automatically invalidated by local firewall rules."
        ],
        correctIndex: 0,
        explanation: "Logout must terminate the session state on the server. If only cleared in the browser, the token remains valid and exploitable if intercepted.",
        hints: ["Verify that logout calls execute GORM deletions or redis cache evictions for that token.", "Backend revocation renders leaked tokens completely useless."]
      }
    ]
  },
  "ssrf": {
    id: "ssrf",
    name: "Server-Side Request Forgery (SSRF)",
    maxScore: 200,
    questions: [
      {
        question: "Can the application fetch URLs provided by users?",
        options: [
          "Yes, since users can only retrieve public assets.",
          "Yes, which introduces SSRF: attackers supplying internal host links to read internal metadata.",
          "No, modern web hosts block URL fetching automatically.",
          "Yes, provided requests are routed via standard client proxy servers."
        ],
        correctIndex: 1,
        explanation: "If a server queries arbitrary user-supplied links, attackers can input local interfaces (e.g., internal cloud metadata IP) to extract private data.",
        hints: ["SSRF occurs when the server queries internal assets on behalf of a client.", "Server boundaries hold access privileges to local network nodes."]
      },
      {
        question: "What happens if I provide internal IPs (127.0.0.1, 169.254.x.x)?",
        options: [
          "The server may query its local admin tools (127.0.0.1) or fetch cloud metadata credentials (169.254.169.254).",
          "The query resolves internally and throws an unrouteable network failure.",
          "The browser intercepts the query and replaces it with the public gateway address.",
          "The DNS resolver automatically filters out all private subnets."
        ],
        correctIndex: 0,
        explanation: "Link-local cloud metadata endpoints (169.254.169.254) serve administrative system variables, containing active security credentials in AWS/GCP.",
        hints: ["Cloud metadata links return temporary IAM profile authentication keys.", "The 169.254 IP is a magic network address holding cloud credentials."]
      },
      {
        question: "Are outbound requests validated or restricted?",
        options: [
          "Outbound queries are validated using a blacklist of internal hostnames.",
          "Yes. Resolved destination IPs must be parsed and rejected if they fall into RFC 1918 private subnets.",
          "No, outbound queries from secure containers are safe by design.",
          "Outbound validation is handled by DNS caching servers."
        ],
        correctIndex: 1,
        explanation: "Hostname check lists are fragile and bypassed by custom DNS redirects. Secure implementations resolve hostnames and validate destination IPs before connections start.",
        hints: ["Exclude all private subnets (10.x.x.x, 172.16.x.x, 192.168.x.x, 127.x.x.x).", "Validate the target IP address directly after DNS resolution."]
      },
      {
        question: "Can I access internal services through the application?",
        options: [
          "No, internal services are protected by standard virtual networks.",
          "Yes, via SSRF attacks, if internal services do not enforce strict credentials.",
          "Only if the server uses unencrypted database connections.",
          "No, since docker containers isolate all internal sub-networks."
        ],
        correctIndex: 1,
        explanation: "If internal caching nodes (Redis) or local admin panels run without password layers, SSRF allows attackers to control them directly.",
        hints: ["Mandate authorization globally across all internal database and API boundaries.", "Server requests skip perimeter firewall checks when querying local ports."]
      },
      {
        question: "Is there a whitelist for allowed external endpoints?",
        options: [
          "Yes. Outbound URL requests must be restricted to a hard whitelist of verified host endpoints.",
          "Whitelisting unnecessary if outbound requests go through CDN routers.",
          "Whitelists are fragile and DNS blacklists are preferred.",
          "Whitelists are configured dynamically in local client cookies."
        ],
        correctIndex: 0,
        explanation: "Whitelisting allowed domains is the most robust mitigation. If the target doesn't match the whitelist, connection attempts are instantly blocked.",
        hints: ["Limit outgoing runtime network paths using host operating system firewalls.", "A whitelist specifies exactly what external endpoints are safe to request."]
      }
    ]
  }
};

