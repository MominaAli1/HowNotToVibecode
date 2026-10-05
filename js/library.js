/*
  MISTAKE LIBRARY

  This file is the list of mistakes the app knows about.
  Every other part of the app reads from it:
    - rules.js decides which mistakes match what the person wrote
    - the report shows each matched mistake as a card
    - the better prompt adds each matched mistake's fixLine
    - the quiz asks each matched mistake's question

  Every mistake links to a real case or study in "sources".
  Nothing here is made up, so keep it that way when editing.

  What each field means:
    id              short name used inside the code
    field           "security" or "prompting"
    title           the name shown on the card
    needsAll        app features that must ALL be present for this to apply
                    (feature names are defined in rules.js:
                     accounts, database, payments, ai, userContent,
                     private, agent, packages, github, ownLogin)
    needsAny        optional: at least ONE of these features must be present
    protectWords    if any of these words appear, the person already
                    asked for the protection, so the mistake is skipped
    foundPatterns   text patterns that prove the mistake is in what they wrote
    foundMin        how many pattern matches are needed (usually 1)
    customRule      a special check handled in rules.js (or null)
    reasonNeverAsked  shown when the label is "You never asked for this"
    reasonFound       shown when the label is "Found in what you wrote"
    whatGoesWrong   the problem in plain words
    realCase        what happened in the real world
    sources         links to the real case or study
    howDevsCatch    how a developer catches it
    fixLine         the line added to the better prompt
    quiz            one question, 4 options, the right answer's position
                    (0 = first option), and an explanation
*/

window.MISTAKES = [
  /* ---------------- SECURITY ---------------- */
  {
    id: "secret-in-code",
    field: "security",
    title: "Secret key in your page code",
    needsAll: [],
    needsAny: ["payments", "ai"],
    protectWords: [
      "environment variable", "env variable", ".env", "server side",
      "server-side", "backend", "edge function", "secret manager"
    ],
    foundPatterns: [
      /sk-[A-Za-z0-9_-]{20,}/,
      /sk_live_[A-Za-z0-9]{10,}/,
      /AKIA[0-9A-Z]{16}/,
      /AIza[0-9A-Za-z_-]{35}/,
      /ghp_[A-Za-z0-9]{36}/,
      /service_role/i
    ],
    foundMin: 1,
    customRule: null,
    reasonNeverAsked: "Your app uses a paid service like payments or AI, and you never said where its secret key should live.",
    reasonFound: "Something in what you wrote looks like a real secret key. Replace it at the service that issued it.",
    whatGoesWrong: "Anything in your page code can be read by anyone. Open any website, view its source, and the code is right there. If a secret key for OpenAI or Stripe sits in that code, anyone can copy it and run up your bill or reach your customers' data.",
    realCase: "Escape scanned 5,600 live vibe-coded apps and found over 400 exposed secrets, including API keys sitting in front-end code. GitGuardian counted 28.6 million new secrets leaked on public GitHub in 2025, and leaked AI-service keys rose 81% that year.",
    sources: [
      { label: "Escape: 5,600 vibe-coded apps scanned", url: "https://escape.tech/blog/methodology-how-we-discovered-vulnerabilities-apps-built-with-vibe-coding/" },
      { label: "GitGuardian: State of Secrets Sprawl 2026", url: "https://gitguardian.com/state-of-secrets-sprawl-report-2026" }
    ],
    howDevsCatch: "They keep secret keys on the server in environment variables, run a secret scanner before every push, and search their live site's code for strings like \"sk-\" before launch.",
    fixLine: "Never put secret keys in the page code. Keep them in environment variables on the server, and tell me which keys are safe to be public and which are not.",
    quiz: {
      question: "Your app calls OpenAI straight from the page and works perfectly. A friend says your key is exposed. How?",
      options: [
        "OpenAI lists the keys of every app that uses it",
        "Anyone can open your page's code in their browser and read the key",
        "Only people with access to your GitHub can see it",
        "The browser encrypts keys, so it's safe"
      ],
      answer: 1,
      explanation: "Everything a page loads gets downloaded to the visitor's browser, and anyone can read it with View Source or the developer tools. Secret keys belong on a server, where visitors never receive them."
    }
  },

  {
    id: "open-database",
    field: "security",
    title: "Database open to anyone",
    needsAll: ["database", "accounts"],
    protectWords: [
      "row level security", "row-level security", "rls", "policy", "policies",
      "only their own", "only see their own", "only read their own", "only access their own"
    ],
    foundPatterns: [],
    foundMin: 1,
    customRule: null,
    reasonNeverAsked: "Your app saves user data, and you never asked for rules on who can read which rows.",
    reasonFound: "",
    whatGoesWrong: "Tools like Supabase put a public key in your page on purpose. That's only safe when every table has row level security: rules that say who can read and change each row. Without those rules, anyone holding the public key can download whole tables.",
    realCase: "In 2025 a researcher found 303 open endpoints across 170 apps made with Lovable (CVE-2025-48757). Row level security was missing, so anyone could pull emails, phone numbers, payment status and API keys without logging in.",
    sources: [
      { label: "Superblocks: how 170+ Lovable apps were exposed", url: "https://www.superblocks.com/blog/lovable-vulnerabilities" }
    ],
    howDevsCatch: "They turn on row level security for every table, then log in as a second user and try to read the first user's data. A rule can exist and still let the wrong person in, so they test it.",
    fixLine: "Turn on row level security for every table. Write policies so each user can only read and change their own rows, then test it while logged in as a second user.",
    quiz: {
      question: "Your Supabase app puts its public key in the page code, which Supabase says is fine. What keeps one user from reading another user's data?",
      options: [
        "Hiding the key somewhere hard to find",
        "Using HTTPS on your domain",
        "Row level security policies on every table",
        "Removing the page from your site's menu"
      ],
      answer: 2,
      explanation: "The public key is meant to be seen, so hiding it does nothing. HTTPS protects data while it travels, not who can read it. Row level security is the rule the database checks on every single request."
    }
  },

  {
    id: "change-the-id",
    field: "security",
    title: "Other people's data one link away",
    needsAll: ["accounts", "database"],
    protectWords: [
      "only their own", "owns the", "owner", "ownership", "authorization",
      "authorisation", "permission check", "belongs to"
    ],
    foundPatterns: [],
    foundMin: 1,
    customRule: null,
    reasonNeverAsked: "Your app shows each user their own data, and you never asked the AI to check who owns each record.",
    reasonFound: "",
    whatGoesWrong: "If a page loads order 1042 because the link says 1042, anyone can type 1043 and see a stranger's order. The login can work perfectly and this still happens. The missing piece is a check that the record belongs to the person asking for it.",
    realCase: "CodeRabbit reviewed 470 pull requests and found AI-written code had up to 2.74x more security issues than human code, with insecure object references among the most common. Apiiro saw paths for users to reach access they shouldn't have rise 322% in AI-assisted code at Fortune 50 companies.",
    sources: [
      { label: "CodeRabbit: AI vs human code report", url: "https://coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report" },
      { label: "The Register: Apiiro findings", url: "https://www.theregister.com/2025/09/05/ai_code_assistants_security_problems" }
    ],
    howDevsCatch: "They create two test accounts, copy a link from one, and open it while logged in as the other. Every route that returns user data checks the owner first.",
    fixLine: "On every page and API route that loads user data, check that the logged-in user owns that record before returning it.",
    quiz: {
      question: "You're logged in and open yoursite.com/orders/1042. You change it to 1043 and see a stranger's order. What's missing?",
      options: [
        "Order numbers should be longer",
        "The login page is broken",
        "The site needs HTTPS",
        "The server never checks that order 1043 belongs to you"
      ],
      answer: 3,
      explanation: "Longer or random IDs only make records harder to guess. The real fix is the ownership check on the server, so even a correct guess returns nothing."
    }
  },

  {
    id: "public-id-signup",
    field: "security",
    title: "Private app anyone can join",
    needsAll: ["accounts", "private"],
    protectWords: [
      "invite only", "invite-only", "invited", "approved users", "approved emails",
      "allowlist", "whitelist", "email domain", "only allow"
    ],
    foundPatterns: [],
    foundMin: 1,
    customRule: null,
    reasonNeverAsked: "Your app is meant for a private group, and you never said who's allowed to sign up.",
    reasonFound: "",
    whatGoesWrong: "A hidden sign-up button still leaves the sign-up route open to anyone who calls it directly. App IDs often sit in plain sight in the link, so finding the route is easy.",
    realCase: "In July 2025, Wiz found that apps made on Base44 let anyone register using only the app's ID, which was visible in the app's own link. That got outsiders past single sign-on into private company apps. Base44 fixed it within 24 hours.",
    sources: [
      { label: "Wiz: critical vulnerability in Base44", url: "https://wiz.io/blog/critical-vulnerability-base44" }
    ],
    howDevsCatch: "They block sign-up on the server for anyone not on an invite list or an approved email domain, then try signing up from a fresh browser with an outside email.",
    fixLine: "Only let invited or approved emails create accounts. Enforce it on the server for every route, including the API, not only on the sign-up page.",
    quiz: {
      question: "Your team-only app hides the sign-up button. How could an outsider still get in?",
      options: [
        "They can't, the button is hidden",
        "Only by guessing an employee's password",
        "By sending a sign-up request straight to the API, which still accepts it",
        "Only by hacking the hosting company"
      ],
      answer: 2,
      explanation: "The button is only a shortcut to the sign-up route. If the server accepts sign-ups from anyone, hiding the button changes nothing. The server has to check the invite list itself."
    }
  },

  {
    id: "user-text-runs",
    field: "security",
    title: "User text that runs as code",
    needsAll: ["userContent"],
    protectWords: [
      "sanitize", "sanitise", "escape", "textcontent", "xss", "dompurify", "plain text"
    ],
    foundPatterns: [/innerHTML/, /dangerouslySetInnerHTML/, /v-html/],
    foundMin: 1,
    customRule: null,
    reasonNeverAsked: "Your app shows things users type to other users, and you never said how to handle that text safely.",
    reasonFound: "Your code puts content into the page as HTML (innerHTML or similar).",
    whatGoesWrong: "If a comment goes onto the page as HTML, someone can post a comment containing a script, and it runs in every visitor's browser. That script can steal logins or post as other users. This is called cross-site scripting, or XSS.",
    realCase: "Veracode tested over 100 AI models on security coding tasks in 2025. On cross-site scripting, the code they wrote failed 86% of the time.",
    sources: [
      { label: "SD Times: Veracode GenAI code security report", url: "https://sdtimes.com/security/ai-generated-code-poses-major-security-risks-in-nearly-half-of-all-development-tasks-veracode-research-reveals/" }
    ],
    howDevsCatch: "They insert user text as plain text, never as HTML, and test every input box by posting <script>alert(1)</script> to see if it runs.",
    fixLine: "Treat everything users type as plain text. Never insert it into the page as HTML. If formatting is needed, clean it with a sanitizer like DOMPurify.",
    quiz: {
      question: "Someone posts a comment on your site, and every visitor's browser now runs code from it. What allowed this?",
      options: [
        "The comment was inserted into the page as HTML instead of plain text",
        "The site's password rules were too weak",
        "The database was too slow",
        "The comment was too long"
      ],
      answer: 0,
      explanation: "When user text goes into the page as HTML, any script inside it runs. Inserting it as plain text shows the characters on screen without running anything."
    }
  },

  {
    id: "fake-package",
    field: "security",
    title: "A package the AI made up",
    needsAll: ["packages"],
    protectWords: [
      "check it exists", "check that it exists", "official package",
      "verify the package", "npmjs.com", "pypi.org", "well-known package"
    ],
    foundPatterns: [],
    foundMin: 1,
    customRule: null,
    reasonNeverAsked: "The AI installs packages for you, and you never asked it to check they're real.",
    reasonFound: "",
    whatGoesWrong: "AI models sometimes recommend packages that don't exist. Attackers watch for these made-up names, publish packages under them with harmful code inside, and wait for someone to install them. This is called slopsquatting.",
    realCase: "Researchers tested 16 models on 576,000 code samples. Commercial models recommended made-up packages at least 5.2% of the time and open-source models at least 21.7%. 43% of the made-up names came back on repeat runs, which makes them easy targets.",
    sources: [
      { label: "TechRepublic: slopsquatting and package hallucinations", url: "https://www.techrepublic.com/article/news-slopsquatting-vibe-coding-ai-cybersecurity-risk/" }
    ],
    howDevsCatch: "Before installing, they look the package up on npm or PyPI and check its downloads, its repo and who publishes it.",
    fixLine: "Before installing any package, confirm it exists on npm or PyPI, has real downloads and a real repo, and tell me why you picked it.",
    quiz: {
      question: "The AI tells you to run npm install react-form-validatorz. You've never heard of it. What's the risk?",
      options: [
        "None, npm blocks unsafe packages before they go live",
        "It might slow your app down a little",
        "It only matters for paid packages",
        "The AI may have made up the name, and an attacker may have published a harmful package under it"
      ],
      answer: 3,
      explanation: "Anyone can publish a package to npm under an unused name. If the AI invented the name, whoever registered it controls what runs on your machine. Check that it exists, has real downloads and links to a real repo."
    }
  },

  {
    id: "agent-live-database",
    field: "security",
    title: "AI agent on your live database",
    needsAll: ["agent", "database"],
    protectWords: [
      "backup", "back up", "test database", "test copy", "staging",
      "dev database", "development database", "read only", "read-only",
      "ask me before", "ask before"
    ],
    foundPatterns: [
      /drop\s+table/i,
      /truncate\s+table/i,
      /delete\s+all\s+(rows|records|data|users)/i,
      /reset\s+the\s+database/i,
      /db\s+reset/i,
      /migrate\s+reset/i
    ],
    foundMin: 1,
    customRule: null,
    reasonNeverAsked: "An AI agent works on your app's database, and you never mentioned a backup or a test copy.",
    reasonFound: "What you wrote includes a command that wipes data, like DROP TABLE or a database reset.",
    whatGoesWrong: "Agents run real commands. One wrong command on the live database can wipe real customer data in seconds, and without a backup there's no way back.",
    realCase: "In July 2025, during a code freeze, Replit's AI agent deleted SaaStr's live database records for over 1,200 executives and 1,190 companies, then wrongly said a rollback wouldn't work. Replit then added automatic separation of test and live databases and a planning-only mode.",
    sources: [
      { label: "Fortune: Replit agent wiped a live database", url: "https://fortune.com/2025/07/23/ai-coding-tool-replit-wiped-database-called-it-a-catastrophic-failure" }
    ],
    howDevsCatch: "They give agents a test copy of the database, keep automatic backups of the live one, and require approval before any command that deletes or changes data.",
    fixLine: "Work on a test copy of the database, never the live one. Back up before any change, and ask me before running any command that deletes or changes data.",
    quiz: {
      question: "You're about to let an AI agent fix a bug in an app with 500 paying users. What should you set up first?",
      options: [
        "A test copy of the database and a recent backup of the live one",
        "Nothing, agents follow instructions like a code freeze",
        "A faster internet connection",
        "A longer prompt that says \"be careful\""
      ],
      answer: 0,
      explanation: "Replit's agent ignored an active code freeze, so instructions alone don't protect data. A test copy keeps the agent away from real data, and a backup lets you recover if something goes wrong."
    }
  },

  {
    id: "password-storage",
    field: "security",
    title: "Passwords stored the unsafe way",
    needsAll: ["ownLogin"],
    protectWords: ["bcrypt", "argon2", "scrypt"],
    foundPatterns: [/\bmd5\b/i, /\bsha-?1\b/i, /plain\s*text\s+passwords?/i],
    foundMin: 1,
    customRule: null,
    reasonNeverAsked: "Your app handles passwords, and you never named a login service or a safe way to store them.",
    reasonFound: "What you wrote uses MD5 or SHA-1 for passwords, or stores them as plain text.",
    whatGoesWrong: "Passwords need a slow hashing method made for passwords. Old methods like MD5 or SHA-1 can be cracked quickly once a database leaks, and plain-text passwords need no cracking at all.",
    realCase: "The OpenSSF security guide for AI code assistants warns that AI tends to suggest outdated methods like MD5. CodeRabbit's review of 470 pull requests flagged improper password handling as a common problem in AI-written code.",
    sources: [
      { label: "OpenSSF: security guide for AI code assistant instructions", url: "https://best.openssf.org/Security-Focused-Guide-for-AI-Code-Assistant-Instructions" },
      { label: "CodeRabbit: AI vs human code report", url: "https://coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report" }
    ],
    howDevsCatch: "They use a login service like Supabase Auth, Clerk or Firebase Auth. If they must store passwords themselves, they use bcrypt or Argon2.",
    fixLine: "Use a login service like Supabase Auth or Clerk instead of handling passwords yourself. If passwords must be stored, hash them with bcrypt or Argon2, never MD5 or SHA-1.",
    quiz: {
      question: "The AI stores your users' passwords hashed with MD5. Your database leaks. What happens?",
      options: [
        "Nothing, hashed passwords can't be reversed",
        "Many passwords can be cracked quickly, because MD5 is fast and outdated",
        "Only admin passwords are at risk",
        "Every user gets logged out automatically"
      ],
      answer: 1,
      explanation: "MD5 was designed to be fast, which lets attackers test billions of guesses. Password methods like bcrypt and Argon2 are slow on purpose, so cracking takes far longer."
    }
  },

  {
    id: "keys-on-github",
    field: "security",
    title: "Keys pushed to GitHub",
    needsAll: ["github"],
    protectWords: [".gitignore", "gitignore", "secret scanning", "gitleaks"],
    foundPatterns: [],
    foundMin: 1,
    customRule: null,
    reasonNeverAsked: "Your code goes to GitHub, and you never mentioned keeping secret files out of it.",
    reasonFound: "",
    whatGoesWrong: "If your .env file or a config file with keys gets pushed, anyone who can see the repo can use those keys. Deleting the file later doesn't help, because it stays in the history.",
    realCase: "GitGuardian counted 28.6 million new secrets leaked on public GitHub in 2025, including 24,008 in AI tool config files. Commits co-written with Claude Code leaked secrets at about twice the normal rate, and 64% of secrets leaked in 2022 still worked in 2025.",
    sources: [
      { label: "GitGuardian: State of Secrets Sprawl 2026", url: "https://gitguardian.com/state-of-secrets-sprawl-report-2026" }
    ],
    howDevsCatch: "They add .env and config files to .gitignore before the first commit, turn on GitHub secret scanning, and replace any key that ever got pushed.",
    fixLine: "Add .env and any config files with keys to .gitignore before the first commit, and remind me to turn on GitHub secret scanning.",
    quiz: {
      question: "You pushed your .env file to GitHub, noticed, and deleted it in the next commit. Are you safe?",
      options: [
        "Yes, the file is gone",
        "Yes, as long as the repo gets few visitors",
        "No. It's still in the commit history, so replace every key that was in it",
        "No, you have to delete your GitHub account"
      ],
      answer: 2,
      explanation: "Git keeps every past version of every file, so the keys are still readable in the history. The fix is to replace each key at the service that issued it."
    }
  },

  /* ---------------- PROMPTING ---------------- */
  {
    id: "generic-secure",
    field: "prompting",
    title: "Asking for \"secure\" in general",
    needsAll: [],
    protectWords: [],
    foundPatterns: [],
    foundMin: 1,
    customRule: "genericSecure",
    reasonNeverAsked: "",
    reasonFound: "You asked for secure code without naming what to protect against.",
    whatGoesWrong: "\"Make it secure\" gives the AI nothing specific to check, so it barely changes the code. Naming the exact risks works far better.",
    realCase: "Databricks tested prompting methods on Claude 3.7 Sonnet. A general security instruction cut vulnerable code by only 8 to 16%, while security instructions written for the specific language cut it by 24 to 37%. The OpenSSF guide adds that telling the AI to act as a security expert made results worse.",
    sources: [
      { label: "Databricks: Passing the Security Vibe Check", url: "https://www.databricks.com/en/blog/passing-security-vibe-check-dangers-vibe-coding" },
      { label: "OpenSSF: security guide for AI code assistant instructions", url: "https://best.openssf.org/Security-Focused-Guide-for-AI-Code-Assistant-Instructions" }
    ],
    howDevsCatch: "They name the specific risks for each feature: where keys live, who can read which data, and how user input gets handled.",
    fixLine: "Replace \"make it secure\" with the specific protections listed in this prompt.",
    quiz: {
      question: "Which prompt gets the safest code from an AI?",
      options: [
        "\"Make it secure.\"",
        "\"Act as a senior security expert.\"",
        "\"Keep keys in environment variables, add row level security to every table, and treat user text as plain text.\"",
        "\"Don't make any mistakes.\""
      ],
      answer: 2,
      explanation: "Specific instructions work best. Databricks found general security lines barely helped, and the OpenSSF guide found the security-expert role made results worse."
    }
  },

  {
    id: "no-self-review",
    field: "prompting",
    title: "No self-review step",
    needsAll: [],
    protectWords: [
      "review your code", "review your own", "review the code", "check your code",
      "check for", "look for", "audit", "go back over", "critique",
      "double check", "double-check"
    ],
    foundPatterns: [],
    foundMin: 1,
    customRule: null,
    reasonNeverAsked: "You never asked the AI to review its own code for problems.",
    reasonFound: "",
    whatGoesWrong: "The AI stops when the code looks done. Asking it to go back over its own work for security problems catches a large share of what it missed the first time.",
    realCase: "Databricks found that asking Claude 3.7 Sonnet to review its own code cut vulnerable code by 48 to 50%, the biggest gain of any method they tested. The OpenSSF guide cites research where two rounds of self-critique improved security by up to 10x. Veracode found bigger models no safer than small ones, so the review step matters more than the model.",
    sources: [
      { label: "Databricks: Passing the Security Vibe Check", url: "https://www.databricks.com/en/blog/passing-security-vibe-check-dangers-vibe-coding" },
      { label: "OpenSSF: security guide for AI code assistant instructions", url: "https://best.openssf.org/Security-Focused-Guide-for-AI-Code-Assistant-Instructions" },
      { label: "SD Times: Veracode GenAI code security report", url: "https://sdtimes.com/security/ai-generated-code-poses-major-security-risks-in-nearly-half-of-all-development-tasks-veracode-research-reveals/" }
    ],
    howDevsCatch: "They ask for a review pass with a checklist, ideally in a fresh chat so the reviewer isn't defending its own work.",
    fixLine: "When you finish, review your own code for exposed keys, missing access checks and unsafe user input. List what you found, then fix it.",
    quiz: {
      question: "In Databricks' tests, which single step cut vulnerable AI code the most?",
      options: [
        "Asking the AI to review its own code for security problems",
        "Adding \"make it secure\" to the prompt",
        "Switching to a bigger model",
        "Writing the prompt in all caps"
      ],
      answer: 0,
      explanation: "Self-review cut vulnerable code by about half. A general \"make it secure\" line cut it by only 8 to 16%, and Veracode found bigger models no safer than smaller ones."
    }
  },

  {
    id: "no-check",
    field: "prompting",
    title: "No check the AI can run",
    needsAll: [],
    protectWords: [
      "test", "tests", "verify", "run it", "check that", "prove",
      "screenshot", "show me the output"
    ],
    foundPatterns: [],
    foundMin: 1,
    customRule: null,
    reasonNeverAsked: "You never gave the AI a test or check to prove the code works.",
    reasonFound: "",
    whatGoesWrong: "Without a test to run, the AI decides it's finished when the code looks right. You end up being the test, and mistakes wait until you or your users find them.",
    realCase: "Anthropic's Claude Code guide puts this first: give the AI a check it can run, like tests or a build, so it can find and fix its own mistakes. It warns that plausible-looking code often misses edge cases, and that unverified code shouldn't ship.",
    sources: [
      { label: "Claude Code: best practices", url: "https://code.claude.com/docs/en/best-practices" }
    ],
    howDevsCatch: "They write tests alongside the feature and ask the AI to show the test output instead of saying it works.",
    fixLine: "Write tests for this feature, run them, and show me the output. Don't tell me it works until they pass.",
    quiz: {
      question: "The AI says \"Done, the login works now.\" What should you ask for?",
      options: [
        "Nothing, it said it works",
        "A longer explanation of the code",
        "A different name for the login function",
        "Proof: the test it ran and the result, or a screenshot of it working"
      ],
      answer: 3,
      explanation: "\"Done\" is a claim. Test output or a screenshot is evidence, and it's faster to check than trying everything yourself."
    }
  },

  {
    id: "no-plan",
    field: "prompting",
    title: "No plan before a big feature",
    needsAll: [],
    protectWords: ["plan", "step by step", "step-by-step", "steps"],
    foundPatterns: [],
    foundMin: 1,
    customRule: "manyFeatures",
    reasonNeverAsked: "Your app has several moving parts, and you never asked for a plan before the code.",
    reasonFound: "",
    whatGoesWrong: "When the AI jumps straight into code on a big feature, it can solve the wrong problem or change files you didn't expect. A plan lets you catch that before anything gets written.",
    realCase: "Anthropic's Claude Code guide recommends four steps: explore, plan, code, commit. It warns that jumping straight to code can produce code that solves the wrong problem.",
    sources: [
      { label: "Claude Code: best practices", url: "https://code.claude.com/docs/en/best-practices" }
    ],
    howDevsCatch: "They ask for a plan listing the steps and files first, read it, correct it, then let the AI start.",
    fixLine: "Before writing code, give me a step-by-step plan and list the files you'll change. Wait for my OK.",
    quiz: {
      question: "You want login, payments and a dashboard added in one go. What's the best first message?",
      options: [
        "\"Build all of it now.\"",
        "\"Plan the steps and list the files you'll change, then wait for my OK.\"",
        "\"Do whatever you think is best.\"",
        "\"Make it look like Stripe's website.\""
      ],
      answer: 1,
      explanation: "A plan shows you what the AI is about to do while changes are still free. Fixing a plan takes a minute. Untangling three half-finished features takes hours."
    }
  },

  {
    id: "vague-prompt",
    field: "prompting",
    title: "Vague prompt",
    needsAll: [],
    protectWords: [],
    foundPatterns: [],
    foundMin: 1,
    customRule: "vaguePrompt",
    reasonNeverAsked: "",
    reasonFound: "Your prompt is short and names no files, limits or edge cases.",
    whatGoesWrong: "A short, open prompt makes the AI guess everything you left out: which files, which limits, what happens when something fails. Each guess is a chance for a mistake.",
    realCase: "In a Stanford study, people using an AI assistant wrote less secure code than people without one, yet rated their code as more secure. The ones who did write secure code with AI gave longer, more detailed prompts and changed the AI's code more.",
    sources: [
      { label: "Stanford: Do Users Write More Insecure Code with AI Assistants?", url: "https://arxiv.org/html/2211.03622v3" }
    ],
    howDevsCatch: "They name the files, the limits and the edge cases, like what happens when a user is logged out or a payment fails.",
    fixLine: "Here are the details: [which pages or files], [limits, like max file size or who can see what], and [edge cases, like logged-out users or failed payments].",
    quiz: {
      question: "Which prompt will get you better code?",
      options: [
        "\"Add file uploads.\"",
        "\"Add image uploads to the profile page. Max 5MB, JPG or PNG only, only the owner can change their photo, show an error if the upload fails.\"",
        "\"Add uploads, make it good.\"",
        "\"Uploads please, you know what I mean.\""
      ],
      answer: 1,
      explanation: "Every detail you give removes a guess. Size limits, file types and who can change what are exactly the details AI leaves out on its own."
    }
  },

  {
    id: "correction-loop",
    field: "prompting",
    title: "Correcting the AI again and again",
    needsAll: [],
    protectWords: [],
    foundPatterns: [
      /still\s+(not|doesn'?t|isn'?t|won'?t)\s+work/gi,
      /same\s+error/gi,
      /didn'?t\s+work/gi,
      /(?<!still\s)doesn'?t\s+work/gi,
      /still\s+broken/gi,
      /fix\s+it/gi,
      /try\s+again/gi
    ],
    foundMin: 3,
    customRule: null,
    reasonNeverAsked: "",
    reasonFound: "Your chat asks the AI to fix the same problem 3 or more times.",
    whatGoesWrong: "Every failed attempt stays in the chat, and the AI keeps leaning on its own wrong ideas. Long chats also make the AI lose track of earlier instructions.",
    realCase: "Anthropic's Claude Code guide says that after two failed corrections on the same issue, the chat is cluttered with failed approaches. Its advice is to start fresh with a better prompt, which almost always beats a long chat full of corrections.",
    sources: [
      { label: "Claude Code: best practices", url: "https://code.claude.com/docs/en/best-practices" }
    ],
    howDevsCatch: "After two failed fixes, they stop, write down what they learned, and start a new chat with one clear prompt.",
    fixLine: "Start a new chat with the exact error, where it happens, what fixed looks like, and what you've already tried.",
    quiz: {
      question: "You've asked the AI to fix the same bug 4 times. It's still broken. What's the best next move?",
      options: [
        "Start a new chat with the exact error, where it happens, and what you've tried",
        "Ask a fifth time, in capital letters",
        "Give up on the feature",
        "Paste the whole chat back into the same chat"
      ],
      answer: 0,
      explanation: "Failed attempts pile up in the chat and pull the AI back toward the same wrong fix. A clean chat with one precise prompt resets that."
    }
  }
];
