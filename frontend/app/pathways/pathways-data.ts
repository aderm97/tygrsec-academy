export interface Step {
  title: string;
  description: string;
  duration: string;
  xp: number;
  challenge?: string;
  type: "theory" | "lab" | "project";
  assessmentCategory?: string;
}

export interface Pathway {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  difficulty: string;
  totalXP: number;
  badge: string;
  steps: Step[];
}

export const pathways: Pathway[] = [
  {
    id: "sast-dast",
    title: "SAST & DAST Mastery",
    subtitle: "Automated security analysis",
    difficulty: "intermediate",
    totalXP: 1500,
    badge: "DevSecOps Engineer",
    description: "Understand how static and dynamic analysis tools find vulnerabilities before and during runtime. Learn to integrate scanners into CI/CD pipelines.",
    steps: [
      { title: "Introduction to Static Analysis", description: "How AST-based scanners detect insecure code patterns without execution.", duration: "45 min", xp: 250, type: "theory", assessmentCategory: "path-traversal" },
      { title: "Writing SAST Rules with Semgrep", description: "Author custom rules to catch path traversal and injection patterns in Python and Node.", duration: "60 min", xp: 350, type: "lab", challenge: "secure-input", assessmentCategory: "path-traversal" },
      { title: "Dynamic Scanning with OWASP ZAP", description: "Spider a target application, run active scans, and interpret the vulnerability report.", duration: "90 min", xp: 400, type: "lab", challenge: "xss-discovery", assessmentCategory: "xss" },
      { title: "CI/CD Security Gates", description: "Embed SAST and DAST scanner steps into GitHub Actions to block vulnerable pull requests.", duration: "60 min", xp: 500, type: "project", assessmentCategory: "xss" },
    ],
  },
  {
    id: "fintech",
    title: "Defensive Fintech Engineering",
    subtitle: "Secure transaction & concurrency",
    difficulty: "advanced",
    totalXP: 2000,
    badge: "Fintech Security Specialist",
    description: "Explore the security properties required for financial systems: ACID transaction integrity, mutex-guarded concurrency, cryptographic wire security, and safe logging practices.",
    steps: [
      { title: "ACID Transactions & Ledger Integrity", description: "Why atomicity matters for financial state and how partial writes create exploitable windows.", duration: "45 min", xp: 300, type: "theory", assessmentCategory: "race-conditions" },
      { title: "Race Conditions & TOCTOU Exploits", description: "Exploit a missing mutex lock to overdraft a banking account using concurrent requests.", duration: "90 min", xp: 600, type: "lab", challenge: "fintech-bank" },
      { title: "Cryptographic API Security", description: "Secure bearer tokens, HMAC request signing, and transport-layer protection for payment APIs.", duration: "60 min", xp: 500, type: "theory", assessmentCategory: "sqli" },
      { title: "Secure Log Handling", description: "Prevent credential leakage in structured logs using masking, log levels, and redaction filters.", duration: "45 min", xp: 600, type: "project", assessmentCategory: "race-conditions" },
    ],
  },
  {
    id: "owasp",
    title: "OWASP Top 10",
    subtitle: "Web vulnerability fundamentals",
    difficulty: "beginner",
    totalXP: 1000,
    badge: "OWASP Practitioner",
    description: "Work through the most critical web application security risks as catalogued by OWASP. Each step maps directly to a hands-on challenge lab.",
    steps: [
      { title: "A03 – Injection", description: "SQL injection via string interpolation and how parameterised queries eliminate the risk.", duration: "60 min", xp: 300, type: "lab", challenge: "sqli-101", assessmentCategory: "sqli" },
      { title: "A01 – Broken Access Control", description: "IDOR: accessing arbitrary user profiles by manipulating numeric ID parameters.", duration: "60 min", xp: 350, type: "lab", challenge: "idor-challenge", assessmentCategory: "path-traversal" },
      { title: "A03 – Command Injection", description: "OS command chaining through an unvalidated shell parameter.", duration: "90 min", xp: 350, type: "lab", challenge: "cmd-injection", assessmentCategory: "xss" },
    ],
  },
];
