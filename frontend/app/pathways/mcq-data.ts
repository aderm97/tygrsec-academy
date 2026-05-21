export const mcqCategories: Record<string, any> = {
  "sqli": {
    name: "SQL Injection",
    description: "Vulnerabilities arising from insecure database queries.",
    questions: [
      {
        question: "What is the primary cause of SQL Injection vulnerabilities when handling user input?",
        options: [
          "Using parameterized queries",
          "String concatenation or interpolation in SQL statements",
          "Missing CSRF tokens",
          "Using NoSQL databases"
        ],
        correctIndex: 1,
        hints: [
          "Think about how the input is physically combined with the query text.",
          "It involves joining strings together without escaping."
        ],
        explanation: "SQL Injection occurs when user input is directly concatenated or interpolated into a SQL string, allowing the input to alter the structure of the SQL query."
      },
      {
        question: "Which of the following is the most effective mitigation against SQL Injection?",
        options: [
          "Encoding the output before displaying it",
          "Using Prepared Statements (Parameterized Queries)",
          "Blacklisting characters like ' and ;",
          "Encrypting the database connection"
        ],
        correctIndex: 1,
        hints: [
          "It involves sending the query structure and data separately.",
          "It's a feature supported by most database drivers, often called Parameterized queries."
        ],
        explanation: "Prepared statements send the query structure and the data separately to the database engine, ensuring that user input is never parsed as executable SQL commands."
      },
      {
        question: "In an authentication bypass via SQL Injection, what does the payload `' OR 1=1 --` achieve?",
        options: [
          "It comments out the username check.",
          "It creates a tautology that always evaluates to true, bypassing the password check.",
          "It drops the users table.",
          "It hashes the password automatically."
        ],
        correctIndex: 1,
        hints: [
          "1=1 is always mathematically true.",
          "The OR operator means if one side is true, the whole expression is true."
        ],
        explanation: "The tautology 1=1 is always true. When appended with an OR, it forces the entire WHERE clause to evaluate to true, logging the attacker in without a valid password. The -- comments out the rest of the query."
      },
      {
        question: "Why is blacklisting specific SQL characters (like single quotes) generally considered a poor defense?",
        options: [
          "Because attackers can use alternative encoding (e.g., Hex, URL encoding) or different characters to achieve the same result.",
          "Because it makes the application run too slowly.",
          "Because it requires an internet connection.",
          "Because blacklists consume too much memory."
        ],
        correctIndex: 0,
        hints: [
          "Attackers are creative and can find loopholes.",
          "If you block one character, there might be another way to represent it."
        ],
        explanation: "Blacklists are brittle because attackers constantly find new ways to bypass them using alternative encodings, different syntax, or application-specific quirks. Whitelisting or parameterized queries are preferred."
      },
      {
        question: "If an attacker discovers a SQL injection flaw in a search parameter, what is typically the first step they take to exploit it?",
        options: [
          "Upload a webshell.",
          "Attempt to balance the original query syntax to prevent syntax errors.",
          "Execute a cross-site scripting attack.",
          "Initiate a Denial of Service attack."
        ],
        correctIndex: 1,
        hints: [
          "If the syntax is broken, the query fails.",
          "They need to ensure the injected payload forms a valid SQL statement."
        ],
        explanation: "To successfully exploit SQL injection, the attacker must first insert syntax (like quotes and comments) that 'balances' the application's original query, ensuring the modified query is still syntactically valid."
      }
    ]
  },
  "xss": {
    name: "Cross-Site Scripting",
    description: "Client-side attacks via unescaped user input.",
    questions: [
      {
        question: "What is a 'Reflected' XSS vulnerability?",
        options: [
          "A payload that is permanently stored in the database.",
          "A payload that is immediately returned by the server in an HTTP response without proper escaping.",
          "A vulnerability that only affects the DOM without contacting the server.",
          "An attack that uses mirrors to bypass firewalls."
        ],
        correctIndex: 1,
        hints: [
          "It bounces back from the server.",
          "It is part of the immediate response to a request."
        ],
        explanation: "Reflected XSS occurs when an application receives input in an HTTP request and includes that input within the immediate HTTP response in an unsafe way."
      },
      {
        question: "Which defense mechanism is primarily responsible for preventing XSS in modern web applications?",
        options: [
          "Context-aware HTML Output Escaping",
          "Prepared Statements",
          "CORS (Cross-Origin Resource Sharing)",
          "Rate Limiting"
        ],
        correctIndex: 0,
        hints: [
          "It involves changing characters like < to &lt;.",
          "It happens when data is rendered to the browser."
        ],
        explanation: "Context-aware output escaping ensures that special characters (like <, >, &) are converted into their HTML entity equivalents before rendering, preventing the browser from interpreting them as executable code."
      },
      {
        question: "If user input is reflected inside a JavaScript `<script>` tag, what type of escaping should be applied?",
        options: [
          "Standard HTML entity encoding",
          "URL encoding",
          "JavaScript Unicode escaping",
          "Base64 encoding"
        ],
        correctIndex: 2,
        hints: [
          "HTML escaping doesn't work inside a script context.",
          "The browser parses scripts differently than HTML."
        ],
        explanation: "When data is placed inside a <script> block, standard HTML entity encoding is insufficient. The data must be safely escaped for the JavaScript context (e.g., Unicode escaping) to prevent breakout."
      },
      {
        question: "How can the `HttpOnly` flag on a session cookie reduce the impact of an XSS attack?",
        options: [
          "It prevents the cookie from being accessed by client-side scripts like JavaScript.",
          "It encrypts the cookie data over the network.",
          "It stops the browser from executing scripts altogether.",
          "It restricts the cookie to HTTPS connections only."
        ],
        correctIndex: 0,
        hints: [
          "It hides the cookie from document.cookie.",
          "Attackers usually want to steal session cookies via XSS."
        ],
        explanation: "Setting the HttpOnly flag ensures that document.cookie cannot be used to read the session token, protecting it from theft via XSS (though XSS can still be used to perform actions on the user's behalf)."
      },
      {
        question: "What does Content Security Policy (CSP) do to mitigate XSS?",
        options: [
          "It sanitizes the database.",
          "It restricts the sources from which scripts can be loaded and executed.",
          "It blocks all SQL injection attempts.",
          "It encrypts HTML traffic."
        ],
        correctIndex: 1,
        hints: [
          "It defines approved domains for resources.",
          "It can block inline scripts."
        ],
        explanation: "A robust CSP restricts which domains are allowed to serve executable scripts and can disable inline scripts entirely, heavily mitigating the impact of an XSS vulnerability."
      }
    ]
  },
  "path-traversal": {
    name: "Path Traversal",
    description: "Exploiting file path resolution to read restricted files.",
    questions: [
      {
        question: "What is the primary goal of a Path (or Directory) Traversal attack?",
        options: [
          "To execute arbitrary SQL commands.",
          "To read, write, or execute files outside of the intended web root directory.",
          "To traverse through a graph database.",
          "To intercept network traffic."
        ],
        correctIndex: 1,
        hints: [
          "It uses ../ to move up directories.",
          "It aims to access things like /etc/passwd."
        ],
        explanation: "Path traversal attacks use dot-dot-slash (../) sequences to escape the designated directory and access sensitive files elsewhere on the file system, such as /etc/passwd."
      },
      {
        question: "Which of the following functions is a safe mitigation strategy against Path Traversal when accepting a filename from user input?",
        options: [
          "Filtering out `../` strings using regex",
          "Using a `basename` function to strip all directory paths from the input",
          "Checking if the file extension is `.jpg`",
          "Converting the filename to lowercase"
        ],
        correctIndex: 1,
        hints: [
          "You want only the final file name, not any path components.",
          "There is a built-in function in many languages to get just the file name."
        ],
        explanation: "Using a basename function extracts only the final file name from a given path string, effectively neutralizing any ../ or / traversal attempts by removing them entirely."
      },
      {
        question: "Why is simply replacing `../` with an empty string an ineffective defense?",
        options: [
          "Because attackers can use nested sequences like `....//` which resolve to `../` after replacement.",
          "Because `../` is required for normal application functionality.",
          "Because it crashes the application.",
          "Because empty strings are evaluated as root directories."
        ],
        correctIndex: 0,
        hints: [
          "Think about what happens when you do a single pass replacement on `..././`.",
          "Attackers can nest the traversal payload."
        ],
        explanation: "Non-recursive string replacement is trivial to bypass. If the application replaces ../ with nothing, an input like ....// becomes ../ after the single pass replacement."
      },
      {
        question: "If an application requires users to download files from a specific directory, what is the most secure architectural approach?",
        options: [
          "Pass the direct file path in the URL.",
          "Use an indirect object reference (like a database ID) mapped to the actual file path.",
          "Base64 encode the file path.",
          "Allow absolute paths only."
        ],
        correctIndex: 1,
        hints: [
          "Don't expose paths at all.",
          "Use an identifier instead of the actual file location."
        ],
        explanation: "Indirect Object References (e.g., using download?id=5 instead of download?file=report.pdf) completely remove the user's ability to manipulate file paths, neutralizing path traversal attacks by design."
      },
      {
        question: "Which configuration principle helps limit the damage of a successful Path Traversal attack?",
        options: [
          "Running the application with root privileges.",
          "Principle of Least Privilege and running the app in a chroot jail or container.",
          "Disabling error logging.",
          "Using a CDN."
        ],
        correctIndex: 1,
        hints: [
          "Restrict what the application process is allowed to access.",
          "Isolate the application."
        ],
        explanation: "If an application process only has read permissions for the absolute minimum files necessary (or is isolated in a container/chroot), an attacker cannot read sensitive system files even if a traversal flaw exists."
      }
    ]
  },
  "race-conditions": {
    name: "Race Conditions",
    description: "Concurrency flaws leading to state corruption.",
    questions: [
      {
        question: "In the context of financial applications, what causes a Time-of-Check to Time-of-Use (TOCTOU) race condition?",
        options: [
          "Using an outdated clock synchronization protocol.",
          "The state of an object changing between the time it is validated and the time it is acted upon.",
          "Slow network connections dropping packets.",
          "Failing to validate user session tokens."
        ],
        correctIndex: 1,
        hints: [
          "It involves a gap between verifying something and doing it.",
          "Another thread sneaks in during this gap."
        ],
        explanation: "A TOCTOU race condition happens when a thread checks a condition (e.g., 'does the user have enough balance?') but another parallel thread modifies the state before the first thread can execute its action."
      },
      {
        question: "How can an attacker exploit a missing Mutex lock in a banking application's transfer function?",
        options: [
          "By brute-forcing the password.",
          "By sending a large number of simultaneous transfer requests, causing multiple threads to validate the same balance before deducting it.",
          "By injecting SQL commands into the amount field.",
          "By bypassing CSRF protections."
        ],
        correctIndex: 1,
        hints: [
          "It involves concurrent requests.",
          "It aims to overdraft the account."
        ],
        explanation: "By issuing parallel requests, the attacker hopes multiple threads will execute the balance check simultaneously. They all see a sufficient balance, and then all threads proceed to deduct funds, driving the account into a negative balance."
      },
      {
        question: "What is the primary mechanism used to mitigate concurrency vulnerabilities in shared memory applications?",
        options: [
          "Thread Locking (e.g., Mutexes) to ensure atomic operations.",
          "Increasing server RAM.",
          "Using a NoSQL database.",
          "Implementing rate limiting."
        ],
        correctIndex: 0,
        hints: [
          "It prevents multiple threads from executing the same block of code at once.",
          "It provides mutual exclusion."
        ],
        explanation: "A Mutex (Mutual Exclusion) ensures that only one thread can access the critical section of code (check balance + deduct funds) at a time, making the operation atomic and preventing race conditions."
      },
      {
        question: "When applying database-level protection against race conditions, which of the following is an effective strategy?",
        options: [
          "Using optimistic concurrency control (e.g., version columns) or pessimistic row-level locking (e.g., SELECT ... FOR UPDATE).",
          "Disabling database indexing.",
          "Running the database in a Docker container.",
          "Executing queries over HTTP."
        ],
        correctIndex: 0,
        hints: [
          "It involves locking rows or checking versions.",
          "It ensures the database handles the concurrency safely."
        ],
        explanation: "Row-level locking (SELECT FOR UPDATE) prevents other transactions from modifying a row until the current transaction completes. Optimistic locking fails the transaction if the row version has changed, both mitigating race conditions."
      },
      {
        question: "Why are race condition vulnerabilities notoriously difficult to detect during standard QA testing?",
        options: [
          "They require special software to compile.",
          "They are highly non-deterministic and depend on precise CPU timing and thread scheduling, which rarely align during manual testing.",
          "They only occur on macOS.",
          "Because browsers block them automatically."
        ],
        correctIndex: 1,
        hints: [
          "They rely on exact timing.",
          "They don't happen every time."
        ],
        explanation: "Race conditions are timing-dependent. They usually only manifest under heavy concurrent load where thread execution overlaps perfectly, making them nearly impossible to catch with sequential, manual tests."
      }
    ]
  }
};
