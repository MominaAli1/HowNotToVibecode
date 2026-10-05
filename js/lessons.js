/*
  LESSONS

  The learning modules. Each module asks the person how they work now
  (one question per lesson), then teaches each lesson with real cases,
  steps and the code developers usually use.

  Facts and numbers come from the linked sources. When a lesson has a
  "mistake" id, its explanation, real case, sources and AI fix line come
  from library.js, so the two files never disagree.

  What each lesson field means:
    id        short name used inside the code
    title     the lesson name
    question  { text, options: [[answer text, status]] }
              status "gap"  = this answer shows they need the lesson
                     "ok"   = they already do this
                     "skip" = doesn't apply to them
    mistake   optional id from library.js
    why       the problem in plain words (only when there's no mistake id)
    cases     extra real cases: [{ text, sources }]
    steps     how to do it, in order
    code      [{ kind, label, file, text }]
              kind "risky" | "safer" | "command" | "prompt" | "file"
    prompt    the line to give your AI (only when there's no mistake id,
              or to replace the library's fix line)
*/

(function () {
  "use strict";

  // Removes the shared indent from a code sample, so samples can be
  // written indented in this file and still show flush left.
  function dedent(text) {
    const lines = text.replace(/^\n/, "").replace(/\s+$/, "").split("\n");
    const indents = lines
      .filter(function (line) { return line.trim() !== ""; })
      .map(function (line) { return line.match(/^ */)[0].length; });
    const cut = indents.length ? Math.min.apply(null, indents) : 0;
    return lines.map(function (line) { return line.slice(cut); }).join("\n");
  }

  const SRC = {
    arxivAudit: { label: "Deng, Fan and Meng: Understanding the (In)Security of Vibe-Coded Applications (2026)", url: "https://arxiv.org/html/2606.23130" },
    xint: { label: "SecurityWeek: Xint finds 434 flaws in vibe-coded apps (2026)", url: "https://www.securityweek.com/vibe-coded-apps-riddled-with-exploitable-security-flaws/" },
    tenzai: { label: "InfoWorld: Tenzai tests 5 vibe coding tools (2026)", url: "https://www.infoworld.com/article/4116937/output-from-vibe-coding-tools-prone-to-critical-security-flaws-study-finds-2.html" },
    moltbook: { label: "Wiz: Moltbook's exposed database (2026)", url: "https://www.wiz.io/blog/exposed-moltbook-database-reveals-millions-of-api-keys" },
    nextEnv: { label: "Next.js docs: environment variables", url: "https://nextjs.org/docs/app/guides/environment-variables" },
    viteEnv: { label: "Vite docs: env variables", url: "https://vite.dev/guide/env-and-mode" },
    supabaseRls: { label: "Supabase docs: row level security", url: "https://supabase.com/docs/guides/database/postgres/row-level-security" },
    owaspIdor: { label: "OWASP: preventing insecure direct object references", url: "https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html" },
    owaspXss: { label: "OWASP: preventing cross-site scripting", url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html" },
    owaspPasswords: { label: "OWASP: password storage", url: "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html" },
    owaspLimits: { label: "OWASP API Security: unrestricted resource consumption", url: "https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption" },
    stripeWebhooks: { label: "Stripe docs: receive and verify webhook events", url: "https://docs.stripe.com/webhooks" },
    playwright: { label: "Playwright docs: writing tests", url: "https://playwright.dev/docs/writing-tests" },
    playwrightCi: { label: "Playwright docs: running tests on CI", url: "https://playwright.dev/docs/ci-intro" },
    pushProtection: { label: "GitHub docs: push protection", url: "https://docs.github.com/en/code-security/secret-scanning/introduction/about-push-protection" },
    agentsMd: { label: "AGENTS.md: instructions file for coding agents", url: "https://agents.md/" },
    npmAudit: { label: "npm docs: npm audit", url: "https://docs.npmjs.com/cli/commands/npm-audit" },
    claudeCode: { label: "Claude Code: best practices", url: "https://code.claude.com/docs/en/best-practices" },
    stanford: { label: "Stanford: Do Users Write More Insecure Code with AI Assistants?", url: "https://arxiv.org/html/2211.03622v3" },
    replit: { label: "Fortune: Replit agent wiped a live database", url: "https://fortune.com/2025/07/23/ai-coding-tool-replit-wiped-database-called-it-a-catastrophic-failure" }
  };

  window.MODULES = [
    /* =============================== SECURITY =============================== */
    {
      id: "security",
      title: "Security",
      tagline: "Keep keys, data and money safe",
      intro: "A 2026 audit of 200 live vibe-coded apps found at least one vulnerability in 91% of them, and about two in three of the flaws were rated critical or high. Most were the same few mistakes, and each one has a known fix.",
      introSources: [SRC.arxivAudit],
      lessons: [
        {
          id: "keys",
          title: "Keep secret keys on the server",
          mistake: "secret-in-code",
          question: {
            text: "Where do your secret API keys (OpenAI, Stripe and similar) end up?",
            options: [
              ["Wherever the AI puts them, often right in the code", "gap"],
              ["In a .env file, and some names start with NEXT_PUBLIC_ or VITE_", "gap"],
              ["In .env files or my host's settings, read only by server code", "ok"],
              ["I'm not sure", "gap"]
            ]
          },
          cases: [{
            text: "The name of a setting matters too. Next.js copies any value whose name starts with NEXT_PUBLIC_ into the code every visitor downloads, and Vite does the same with VITE_. Vite's docs say these values should not contain API keys. AI tools often add the prefix because the key is \"undefined\" in the browser without it.",
            sources: [SRC.nextEnv, SRC.viteEnv]
          }],
          steps: [
            "Put each secret in a .env.local file on your computer, and in your host's environment settings (Vercel, Netlify, Railway) when you go live.",
            "Only give a NEXT_PUBLIC_ or VITE_ name to values that are safe for anyone to see, like a Supabase publishable key.",
            "Call paid APIs from a server route. The page calls your route, and your route calls the API with the key.",
            "If a key ever reached the browser or GitHub, replace it at the service that issued it. Deleting it from the code isn't enough."
          ],
          code: [
            {
              kind: "risky", label: "Key ships to every visitor", file: "components/Chat.jsx (runs in the browser)",
              text: dedent(`
                // NEXT_PUBLIC_ puts the key inside the page code
                const openai = new OpenAI({
                  apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
                  dangerouslyAllowBrowser: true,
                });
              `)
            },
            {
              kind: "safer", label: "Secret stays on your computer", file: ".env.local",
              text: dedent(`
                # No NEXT_PUBLIC_ prefix, so only server code can read it.
                # This file must be listed in .gitignore.
                OPENAI_API_KEY=paste-your-key-here
              `)
            },
            {
              kind: "safer", label: "Server route that holds the key", file: "app/api/chat/route.js (runs on the server)",
              text: dedent(`
                import OpenAI from "openai";

                const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

                export async function POST(request) {
                  const { message } = await request.json();
                  const reply = await openai.responses.create({
                    model: "gpt-4.1-mini",
                    input: message,
                  });
                  return Response.json({ text: reply.output_text });
                }
              `)
            },
            {
              kind: "safer", label: "The page only talks to your route", file: "components/Chat.jsx (runs in the browser)",
              text: dedent(`
                const res = await fetch("/api/chat", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ message }),
                });
                const { text } = await res.json();
              `)
            }
          ],
          prompt: "Never put secret keys in code that runs in the browser, and never give a secret a NEXT_PUBLIC_ or VITE_ name. Keep secrets in server-side environment variables and call paid APIs from a server route."
        },

        {
          id: "database",
          title: "Lock every database table",
          mistake: "open-database",
          question: {
            text: "If you use Supabase or Firebase, who can read each table?",
            options: [
              ["Anyone with the app's public key, I think", "gap"],
              ["I never set it up, the AI handled it", "gap"],
              ["Row level security or security rules on every table, and I've tested them", "ok"],
              ["I don't use a database", "skip"]
            ]
          },
          cases: [{
            text: "In February 2026, Wiz reported that Moltbook, a social network whose founder said AI wrote all of its code, had no row level security. Its Supabase key sat in the page code, so anyone could read and write the whole database: 1.5 million API tokens, 35,000 email addresses and thousands of private messages. The team locked it within hours of being told.",
            sources: [SRC.moltbook]
          }],
          steps: [
            "Turn on row level security (RLS) for every table. Supabase's docs say to do this for every table in an exposed schema.",
            "Add a policy for each action you allow: reading, adding, changing and deleting rows.",
            "Only the publishable key may be in the page. The secret key (service_role) bypasses every policy, so it stays on the server.",
            "Test it: log in as a second user and try to read the first user's rows."
          ],
          code: [
            {
              kind: "risky", label: "With RLS off, this returns everyone's rows", file: "any page",
              text: dedent(`
                // Anyone can run this in their browser with your public key
                const { data } = await supabase.from("workouts").select("*");
              `)
            },
            {
              kind: "safer", label: "Lock the table and add policies", file: "Supabase SQL editor",
              text: dedent(`
                -- 1. Lock the table. With RLS on and no policies, nobody can read it.
                alter table public.workouts enable row level security;

                -- 2. Users can read only their own rows
                create policy "Users read own workouts"
                on public.workouts for select
                to authenticated
                using ( (select auth.uid()) = user_id );

                -- 3. Users can add rows only for themselves
                create policy "Users add own workouts"
                on public.workouts for insert
                to authenticated
                with check ( (select auth.uid()) = user_id );

                -- 4. Users can change only their own rows
                create policy "Users update own workouts"
                on public.workouts for update
                to authenticated
                using ( (select auth.uid()) = user_id )
                with check ( (select auth.uid()) = user_id );
              `)
            }
          ]
        },

        {
          id: "ownership",
          title: "Check who owns each record",
          mistake: "change-the-id",
          question: {
            text: "A page loads something by its ID, like /orders/1042. What stops a logged-in user from opening /orders/1043?",
            options: [
              ["Nothing, but they'd have to guess the number", "gap"],
              ["They have to be logged in", "gap"],
              ["The server checks that the order belongs to them", "ok"],
              ["I'm not sure", "gap"]
            ]
          },
          cases: [{
            text: "This is the most common serious flaw in vibe-coded apps. An audit of 200 live apps found broken access control was the top category, 28.6% of 1,186 vulnerabilities. In July 2026, Xint found 88 authorization flaws like this in apps made with AI coding tools, They were 11% of findings in small new apps but 28% in a larger existing one.",
            sources: [SRC.arxivAudit, SRC.xint, SRC.owaspIdor]
          }],
          steps: [
            "Get the user from the login session on the server. Never trust a user ID sent in the link or the request body.",
            "Look records up by their ID and their owner together.",
            "If nothing matches, return 404 Not Found, so strangers can't even tell the record exists.",
            "Test with two accounts: open a link from account A while logged in as account B."
          ],
          code: [
            {
              kind: "risky", label: "Logged in is not the same as allowed", file: "server.js (Express)",
              text: dedent(`
                // Any logged-in user can read any order by changing the number
                app.get("/api/orders/:id", requireLogin, async (req, res) => {
                  const order = await db.order.findUnique({
                    where: { id: req.params.id },
                  });
                  res.json(order);
                });
              `)
            },
            {
              kind: "safer", label: "Match the ID and the owner", file: "server.js (Express)",
              text: dedent(`
                // Only returns the order if it belongs to the logged-in user
                app.get("/api/orders/:id", requireLogin, async (req, res) => {
                  const order = await db.order.findFirst({
                    where: { id: req.params.id, userId: req.user.id },
                  });
                  if (!order) return res.status(404).json({ error: "Not found" });
                  res.json(order);
                });
              `)
            }
          ]
        },

        {
          id: "user-text",
          title: "Show user text as plain text",
          mistake: "user-text-runs",
          question: {
            text: "How does text that users type (comments, names, bios) get onto your pages?",
            options: [
              ["However the AI wrote it", "gap"],
              ["With innerHTML or dangerouslySetInnerHTML", "gap"],
              ["As plain text: textContent, or normal {text} in React", "ok"],
              ["My app doesn't show user text", "skip"]
            ]
          },
          steps: [
            "Put user text on the page with textContent in plain JavaScript, or {text} in React. Both show the characters without running them.",
            "Avoid innerHTML, dangerouslySetInnerHTML and v-html for anything a user typed.",
            "If you really need formatting (bold, links), clean the HTML with DOMPurify first.",
            "Test every input box by posting <script>alert(1)</script>. If a box pops up, it's not safe."
          ],
          code: [
            {
              kind: "risky", label: "The comment runs as code", file: "comments.js",
              text: dedent(`
                // A comment like <img src=x onerror="stealLogin()">
                // runs in every visitor's browser
                commentBox.innerHTML = comment.text;
              `)
            },
            {
              kind: "safer", label: "The comment shows as characters", file: "comments.js",
              text: dedent(`
                // Shown as plain characters. Nothing inside it runs.
                commentBox.textContent = comment.text;
              `)
            },
            {
              kind: "safer", label: "The same idea in React", file: "Comment.jsx",
              text: dedent(`
                import DOMPurify from "dompurify";

                // Safe: React shows {comment.text} as plain text
                <p>{comment.text}</p>

                // Only when you need formatting: clean it first
                <p dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.html) }} />
              `)
            }
          ],
          cases: [{
            text: "OWASP's guide says the first defense is to insert user data as text, not HTML, and to sanitize with a tool like DOMPurify when HTML is needed.",
            sources: [SRC.owaspXss]
          }]
        },

        {
          id: "limits",
          title: "Put limits on requests and spending",
          question: {
            text: "What happens if someone calls your AI feature or sign-up form 10,000 times in an hour?",
            options: [
              ["Each call costs me money and nothing stops it", "gap"],
              ["I've never thought about it", "gap"],
              ["Rate limits per user, plus a spending cap at each paid service", "ok"]
            ]
          },
          why: "Every call to an AI model, SMS service or email service costs you money. Without limits, one script can call your route thousands of times, run up your bill and slow the app down for everyone else.",
          cases: [
            {
              text: "In July 2026, Xint tested apps made with AI coding tools and found 434 exploitable flaws. The most common kind, 93 of them, was missing limits that let attackers exhaust resources.",
              sources: [SRC.xint]
            },
            {
              text: "OWASP describes a password reset that sent text messages at $0.05 each with no rate limit. An attacker scripted thousands of requests and cost the company thousands of dollars in minutes.",
              sources: [SRC.owaspLimits]
            }
          ],
          steps: [
            "Rate limit every route that costs money or sends something: AI calls, sign-up, password reset, uploads.",
            "Cap sizes: message length, file size, results per page.",
            "Set a monthly spending limit or billing alert with every paid service you use.",
            "Require login before any route that costs you money."
          ],
          code: [
            {
              kind: "command", label: "Install a rate limiter", file: "terminal",
              text: "npm install express-rate-limit"
            },
            {
              kind: "safer", label: "Limit calls per user and cap message size", file: "server.js (Express)",
              text: dedent(`
                import { rateLimit } from "express-rate-limit";

                // At most 20 AI requests per user every 15 minutes
                const aiLimiter = rateLimit({
                  windowMs: 15 * 60 * 1000,
                  limit: 20,
                  keyGenerator: (req) => req.user.id,
                });

                app.post("/api/chat", requireLogin, aiLimiter, async (req, res) => {
                  const message = String(req.body.message || "");
                  if (message.length > 2000) {
                    return res.status(413).json({ error: "Message too long" });
                  }
                  // ...call the AI here
                });
              `)
            }
          ],
          prompt: "Add rate limits to every route that calls a paid service or sends email or SMS, cap the size of every input, and remind me to set a spending limit with each paid service."
        },

        {
          id: "payments",
          title: "Let Stripe decide who paid",
          question: {
            text: "How does your app decide that someone has paid?",
            options: [
              ["The browser sends the price, or tells my app the payment worked", "gap"],
              ["Opening the success page after checkout unlocks the account", "gap"],
              ["A Stripe webhook on the server, with the signature checked", "ok"],
              ["My app doesn't take payments", "skip"]
            ]
          },
          why: "Anything the browser sends can be changed: the price, the quantity, or a message saying \"payment worked\". The success page after checkout is just a link anyone can open. Only Stripe knows if money really moved, and it tells your server through a signed webhook.",
          cases: [{
            text: "In January 2026, Tenzai had Claude Code, Codex, Cursor, Replit and Devin each make the same 3 apps and found 69 vulnerabilities. The most serious were in authorization and business logic, like letting users do things a shop should never allow. The tools avoided generic flaws but missed rules that depend on how the app works.",
            sources: [SRC.tenzai]
          }, {
            text: "Stripe's docs warn that without signature checks, an attacker could send fake webhook events to your server to fulfil orders or grant access.",
            sources: [SRC.stripeWebhooks]
          }],
          steps: [
            "Never take a price or amount from the browser. Use a Stripe price ID or look the price up on the server.",
            "Don't unlock anything on the success page.",
            "Unlock access only in your webhook, after checking Stripe's signature.",
            "Keep the webhook signing secret (it starts with whsec_) in an environment variable."
          ],
          code: [
            {
              kind: "risky", label: "The browser picks the price", file: "server.js (Express)",
              text: dedent(`
                // Anyone can change req.body.price to 1 cent
                app.post("/api/checkout", async (req, res) => {
                  const session = await stripe.checkout.sessions.create({
                    mode: "payment",
                    line_items: [{
                      price_data: {
                        currency: "usd",
                        product_data: { name: "Pro plan" },
                        unit_amount: req.body.price,
                      },
                      quantity: 1,
                    }],
                    success_url: "https://yourapp.com/success",
                  });
                  res.json({ url: session.url });
                });
              `)
            },
            {
              kind: "safer", label: "The price comes from Stripe", file: "server.js (Express)",
              text: dedent(`
                app.post("/api/checkout", requireLogin, async (req, res) => {
                  const session = await stripe.checkout.sessions.create({
                    mode: "subscription",
                    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID, quantity: 1 }],
                    client_reference_id: req.user.id,
                    success_url: "https://yourapp.com/success",
                  });
                  res.json({ url: session.url });
                });
              `)
            },
            {
              kind: "safer", label: "Unlock only after a signed webhook", file: "server.js (Express)",
              text: dedent(`
                // Stripe needs the raw body to check the signature
                app.post("/api/stripe-webhook",
                  express.raw({ type: "application/json" }),
                  (req, res) => {
                    let event;
                    try {
                      event = stripe.webhooks.constructEvent(
                        req.body,
                        req.headers["stripe-signature"],
                        process.env.STRIPE_WEBHOOK_SECRET
                      );
                    } catch (err) {
                      return res.status(400).send("Invalid signature");
                    }

                    if (event.type === "checkout.session.completed") {
                      const userId = event.data.object.client_reference_id;
                      // mark this user as paid in your database
                    }
                    res.json({ received: true });
                  }
                );
              `)
            }
          ],
          prompt: "Never trust prices, amounts or payment status from the browser. Use Stripe price IDs, and unlock paid features only in a webhook that verifies Stripe's signature."
        },

        {
          id: "passwords",
          title: "Let a login service handle passwords",
          mistake: "password-storage",
          question: {
            text: "How do people log in to your app?",
            options: [
              ["The AI wrote its own password system", "gap"],
              ["A login service like Supabase Auth, Clerk or Firebase Auth", "ok"],
              ["I'm not sure", "gap"],
              ["My app has no login", "skip"]
            ]
          },
          cases: [{
            text: "OWASP's password guide recommends slow, salted methods made for passwords, like Argon2id or bcrypt, and warns against fast hashes.",
            sources: [SRC.owaspPasswords]
          }],
          steps: [
            "Use a login service (Supabase Auth, Clerk, Firebase Auth). It stores and checks passwords for you.",
            "If you must store passwords yourself, hash them with bcrypt or Argon2. Never MD5, SHA-1 or plain text.",
            "Never log passwords or send them back to the browser."
          ],
          code: [
            {
              kind: "risky", label: "Fast hash, cracked quickly after a leak", file: "auth.js",
              text: dedent(`
                const hash = crypto.createHash("md5").update(password).digest("hex");
              `)
            },
            {
              kind: "safer", label: "Let the login service do it", file: "signup.js",
              text: dedent(`
                // Supabase stores and checks the password safely for you
                const { data, error } = await supabase.auth.signUp({
                  email: email,
                  password: password,
                });
              `)
            },
            {
              kind: "safer", label: "If you must store passwords yourself", file: "auth.js",
              text: dedent(`
                import bcrypt from "bcrypt";

                // Slow on purpose, with a random salt included
                const hash = await bcrypt.hash(password, 12);

                // Later, at login:
                const ok = await bcrypt.compare(password, user.passwordHash);
              `)
            }
          ]
        }
      ]
    },

    /* =============================== PROMPTING =============================== */
    {
      id: "prompting",
      title: "Prompting",
      tagline: "Get better code from the AI",
      intro: "In a Stanford study, people using an AI assistant wrote less secure code than people without one, yet felt more sure it was secure. The ones who did well wrote longer, more detailed prompts. These lessons show what to put in them.",
      introSources: [SRC.stanford],
      lessons: [
        {
          id: "specific",
          title: "Write specific prompts",
          mistake: "vague-prompt",
          question: {
            text: "What does a typical request to your AI look like?",
            options: [
              ["One line, like \"add login\"", "gap"],
              ["A few sentences about what I want", "gap"],
              ["The goal, plus files, limits, who can do what and what happens when it fails", "ok"]
            ]
          },
          steps: [
            "Name the page or file it should change.",
            "Give the limits: sizes, types, how many.",
            "Say who can do what, like \"only the owner can change it\".",
            "Say what should happen when something fails.",
            "Say what it must not touch."
          ],
          code: [
            { kind: "risky", label: "The AI has to guess everything", file: "prompt", text: "Add file uploads." },
            {
              kind: "safer", label: "Nothing left to guess", file: "prompt",
              text: dedent(`
                Add profile photo uploads to app/profile/page.jsx.
                - JPG or PNG only, max 5 MB
                - Only the logged-in owner can change their own photo
                - Store files in the Supabase "avatars" bucket, one folder per user ID
                - If the upload fails, show "Upload failed, try a smaller image"
                  and keep the old photo
                - Don't change any other pages
                When you finish, run the tests and show me the output.
              `)
            }
          ]
        },

        {
          id: "plan",
          title: "Ask for a plan before code",
          mistake: "no-plan",
          question: {
            text: "Before a big feature, what do you usually do?",
            options: [
              ["Ask the AI to make the whole thing at once", "gap"],
              ["Ask for a plan first and check it before any code", "ok"],
              ["Split it into small requests myself, one at a time", "ok"]
            ]
          },
          steps: [
            "Ask the AI to read the relevant files first.",
            "Ask for a step-by-step plan and a list of files it will change.",
            "Read the plan. Fix anything wrong. Then say OK.",
            "Commit to git before it starts, so you can undo."
          ],
          code: [{
            kind: "prompt", label: "Plan-first prompt", file: "prompt",
            text: dedent(`
              I want to add Stripe subscriptions to this app.
              Don't write code yet. First:
              1. Read the files that handle login and the database.
              2. Give me a step-by-step plan.
              3. List every file you'll create or change.
              4. List anything you're unsure about as questions.
              Wait for my OK before you start.
            `)
          }]
        },

        {
          id: "name-protections",
          title: "Name the exact protections",
          mistake: "generic-secure",
          question: {
            text: "How do you ask the AI for security?",
            options: [
              ["I don't", "gap"],
              ["I say \"make it secure\" or \"act as a security expert\"", "gap"],
              ["I name the exact protections, like keys on the server and row level security", "ok"]
            ]
          },
          steps: [
            "List the protections for this feature, one per line.",
            "Keep the list in your rules file so it applies to every request (see \"Give the AI a rules file\").",
            "Use the lessons in the Security module to pick the lines that apply."
          ],
          code: [
            { kind: "risky", label: "Too general to change anything", file: "prompt", text: "Make it secure." },
            {
              kind: "safer", label: "Specific protections", file: "prompt",
              text: dedent(`
                Security rules for this feature:
                - Keep API keys in server-side environment variables, never in page code
                - Turn on row level security for every new table, with a policy per action
                - Check that the logged-in user owns a record before returning or changing it
                - Show user text as plain text, never as HTML
                - Rate limit this route to 20 requests per user every 15 minutes
              `)
            }
          ]
        },

        {
          id: "self-review",
          title: "Make the AI review its own work",
          mistake: "no-self-review",
          question: {
            text: "When the AI says it's done, what happens next?",
            options: [
              ["I try it quickly and move on", "gap"],
              ["I ask it to review its own code against a checklist", "ok"],
              ["I review the code myself line by line", "ok"]
            ]
          },
          steps: [
            "After each feature, ask for a review against a checklist.",
            "Ask for pass or fail on each item, so it can't skip any.",
            "For bigger features, paste the code into a fresh chat and ask that chat to review it."
          ],
          code: [{
            kind: "prompt", label: "Review checklist prompt", file: "prompt",
            text: dedent(`
              Review the code you just wrote. Check each item and say pass or fail:
              1. Any secret keys in code that runs in the browser?
              2. Any table without row level security?
              3. Any route that returns data without checking who owns it?
              4. Any user text inserted as HTML?
              5. Any costly route without a rate limit?
              Then fix every fail and show me what you changed.
            `)
          }]
        },

        {
          id: "fresh-chat",
          title: "Start fresh after two failed fixes",
          mistake: "correction-loop",
          question: {
            text: "The AI's fix didn't work for the third time. What do you do?",
            options: [
              ["Keep asking in the same chat", "gap"],
              ["Paste the error again and say \"fix it\"", "gap"],
              ["Start a new chat with the exact error, where it happens and what I tried", "ok"]
            ]
          },
          steps: [
            "After two failed fixes, stop.",
            "Write down the exact error message and where it happens.",
            "Write what should happen instead, and what you already tried.",
            "Start a new chat with all of that, and ask it to find the cause before changing code."
          ],
          code: [{
            kind: "prompt", label: "Fresh-start bug prompt", file: "prompt",
            text: dedent(`
              Bug: clicking "Save workout" shows "401 Unauthorized".
              Where: app/api/workouts/route.js, called from app/log/page.jsx
              Expected: the workout saves and appears in the list.
              Already tried: refreshing the session, changing the fetch headers.
              Find the cause before changing any code, and explain it to me first.
            `)
          }]
        },

        {
          id: "rules-file",
          title: "Give the AI a rules file",
          question: {
            text: "Does your project have a rules file the AI reads every time (CLAUDE.md, AGENTS.md or Cursor rules)?",
            options: [
              ["No", "gap"],
              ["I don't know what that is", "gap"],
              ["Yes, with my stack, commands and safety rules", "ok"]
            ]
          },
          why: "The AI forgets everything between chats. A rules file is a short note in your project that coding tools read at the start of every session, so your safety rules and commands apply every time without you repeating them.",
          cases: [{
            text: "AGENTS.md is an open format read by more than 20 coding tools, including Codex, Cursor and GitHub Copilot. Claude Code reads CLAUDE.md the same way, and its guide recommends keeping that file short and specific.",
            sources: [SRC.agentsMd, SRC.claudeCode]
          }],
          steps: [
            "Create AGENTS.md (or CLAUDE.md for Claude Code) in the top folder of your project.",
            "Add your stack, the commands to run and test the app, and your safety rules.",
            "Keep it short. Add a line whenever the AI makes the same mistake twice."
          ],
          code: [{
            kind: "file", label: "Sample rules file", file: "AGENTS.md",
            text: dedent(`
              # Project rules

              ## Stack
              Next.js app router, Supabase (database and login), Stripe subscriptions.

              ## Commands
              - npm run dev: start the app
              - npm test: run unit tests
              - npx playwright test: run browser tests

              ## Always
              - Keep secrets in .env.local. Never use NEXT_PUBLIC_ for a secret.
              - New tables get row level security and a policy per action.
              - Check record ownership in every API route.
              - Run the tests and show the output before saying you're done.

              ## Never
              - Never run commands that delete data without asking me.
              - Never install a package without checking it exists on npm and telling me why.
            `)
          }],
          prompt: "Read AGENTS.md before you start and follow every rule in it. If a rule blocks you, ask me instead of working around it."
        }
      ]
    },

    /* =============================== TESTING =============================== */
    {
      id: "testing",
      title: "Testing",
      tagline: "Prove your app works, and keeps working",
      intro: "Anthropic's Claude Code guide puts this first: give the AI a check it can run, like tests, so it can find and fix its own mistakes instead of waiting for you to notice them. These lessons show the tests developers usually write.",
      introSources: [SRC.claudeCode],
      lessons: [
        {
          id: "prove-it",
          title: "Make the AI prove it works",
          mistake: "no-check",
          question: {
            text: "How do you check that a change works?",
            options: [
              ["I click around the app myself", "gap"],
              ["I trust the AI when it says it's done", "gap"],
              ["Automated tests that the AI runs and shows me", "ok"]
            ]
          },
          steps: [
            "Ask for tests in the same prompt as the feature.",
            "Ask the AI to run them and paste the output.",
            "Keep the tests in your project so they run again after every change."
          ],
          code: [
            { kind: "command", label: "Install a test runner", file: "terminal", text: "npm install --save-dev vitest" },
            {
              kind: "file", label: "A small unit test", file: "tests/price.test.js",
              text: dedent(`
                import { describe, it, expect } from "vitest";
                import { monthlyPrice } from "../lib/price.js";

                describe("monthlyPrice", () => {
                  it("charges the normal price for the pro plan", () => {
                    expect(monthlyPrice("pro")).toBe(1500);
                  });

                  it("refuses plans that don't exist", () => {
                    expect(() => monthlyPrice("free-forever")).toThrow();
                  });
                });
              `)
            },
            { kind: "command", label: "Run the tests", file: "terminal", text: "npx vitest run" }
          ]
        },

        {
          id: "e2e",
          title: "Test like a real user (end-to-end)",
          question: {
            text: "Do you have tests that click through your app like a real person: sign up, log in, pay?",
            options: [
              ["No", "gap"],
              ["What are those?", "gap"],
              ["Yes, they run in a real browser", "ok"]
            ]
          },
          why: "Unit tests check one small piece. End-to-end (e2e) tests open your app in a real browser and click through it like a user would, so they catch the breaks that matter most: a sign-up that fails, a button that does nothing, a page that stopped loading after the AI changed something else.",
          cases: [{
            text: "Playwright is a free tool from Microsoft for this. It opens Chromium, Firefox and WebKit (Safari's engine), clicks and types like a person, and checks what's on the screen.",
            sources: [SRC.playwright]
          }],
          steps: [
            "Install Playwright in your project.",
            "Write one test for each thing your app must never break: sign up, log in, the main feature, paying.",
            "Find things the way a user does: by their label, role and visible text.",
            "Run the tests before every push, and ask the AI to run them after every change."
          ],
          code: [
            { kind: "command", label: "Install Playwright", file: "terminal", text: "npm init playwright@latest" },
            {
              kind: "file", label: "Sign-up test", file: "tests/signup.spec.js",
              text: dedent(`
                import { test, expect } from "@playwright/test";

                test("a new user can sign up and see their dashboard", async ({ page }) => {
                  await page.goto("http://localhost:3000/signup");

                  await page.getByLabel("Email").fill("test" + Date.now() + "@example.com");
                  await page.getByLabel("Password").fill("a-long-test-password");
                  await page.getByRole("button", { name: "Sign up" }).click();

                  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
                });
              `)
            },
            { kind: "command", label: "Run the tests", file: "terminal", text: "npx playwright test" }
          ],
          prompt: "Write Playwright end-to-end tests for sign up, log in and the main feature. Run them with npx playwright test and show me the output."
        },

        {
          id: "security-tests",
          title: "Test what should fail",
          question: {
            text: "Do your tests try things a user should NOT be able to do, like opening another user's data?",
            options: [
              ["No, they only check that things work", "gap"],
              ["I don't have tests yet", "gap"],
              ["Yes, with two test accounts", "ok"]
            ]
          },
          why: "Most tests check that the right person can do something. The dangerous bugs are when the wrong person can do it too. AI tools rarely write these tests unless you ask, and the matching bug, missing ownership checks, is the most common serious flaw in vibe-coded apps.",
          cases: [{
            text: "An audit of 200 live vibe-coded apps found broken access control was the top category of vulnerability, 28.6% of the 1,186 found.",
            sources: [SRC.arxivAudit]
          }],
          steps: [
            "Create two test accounts, A and B.",
            "Log in as A and find a link to something only A should see.",
            "Log in as B in a separate browser session and open that link.",
            "The test passes only if B sees \"Not found\" and none of A's data."
          ],
          code: [{
            kind: "file", label: "Two-account privacy test", file: "tests/privacy.spec.js",
            text: dedent(`
              import { test, expect } from "@playwright/test";

              async function logIn(page, email) {
                await page.goto("http://localhost:3000/login");
                await page.getByLabel("Email").fill(email);
                await page.getByLabel("Password").fill(process.env.TEST_PASSWORD);
                await page.getByRole("button", { name: "Log in" }).click();
              }

              test("user B cannot open user A's order", async ({ browser }) => {
                // User A finds the link to one of their orders
                const pageA = await (await browser.newContext()).newPage();
                await logIn(pageA, "user-a@example.com");
                await pageA.goto("http://localhost:3000/orders");
                const link = await pageA.getByRole("link", { name: /Order/ }).first().getAttribute("href");

                // User B, in a separate session, tries the same link
                const pageB = await (await browser.newContext()).newPage();
                await logIn(pageB, "user-b@example.com");
                await pageB.goto("http://localhost:3000" + link);

                await expect(pageB.getByText("Not found")).toBeVisible();
              });
            `)
          }],
          prompt: "For every page and API route that shows user data, write a test with two accounts that proves user B can't see or change user A's data."
        },

        {
          id: "ci",
          title: "Run tests automatically on GitHub",
          question: {
            text: "When do your tests run?",
            options: [
              ["I don't have tests", "gap"],
              ["When I remember to run them", "gap"],
              ["Automatically every time I push to GitHub", "ok"]
            ]
          },
          why: "Tests only help if they run. GitHub Actions can run them on GitHub's computers every time you push, and mark the commit with a red cross when something breaks, before your users find it.",
          cases: [{
            text: "Playwright's own setup can create this GitHub workflow file for you, and its docs walk through running tests on every push.",
            sources: [SRC.playwrightCi]
          }],
          steps: [
            "Add the workflow file below to your project.",
            "In playwright.config, set webServer so the tests start your app first.",
            "Push to GitHub and open the Actions tab to see the result.",
            "Don't merge or deploy while the check is red."
          ],
          code: [{
            kind: "file", label: "GitHub Actions workflow", file: ".github/workflows/tests.yml",
            text: dedent(`
              name: Tests
              on: [push, pull_request]

              jobs:
                test:
                  runs-on: ubuntu-latest
                  steps:
                    - uses: actions/checkout@v4
                    - uses: actions/setup-node@v4
                      with:
                        node-version: lts/*
                    - run: npm ci
                    - run: npx vitest run
                    - run: npx playwright install --with-deps
                    - run: npx playwright test
            `)
          }],
          prompt: "Add a GitHub Actions workflow that runs all unit and Playwright tests on every push, and set webServer in playwright.config so the app starts first."
        }
      ]
    },

    /* =============================== AI AGENTS =============================== */
    {
      id: "agents",
      title: "Working with AI agents",
      tagline: "Let the AI work without wrecking things",
      intro: "Agents run real commands on your computer and your accounts. In July 2025, Replit's agent deleted a company's live database during a code freeze. These lessons set up the safety nets developers use before handing over the keyboard.",
      introSources: [SRC.replit],
      lessons: [
        {
          id: "checkpoints",
          title: "Save a checkpoint before every AI change",
          question: {
            text: "Before letting the AI change your code, do you save a checkpoint?",
            options: [
              ["No", "gap"],
              ["Sometimes", "gap"],
              ["Always, I commit to git first", "ok"]
            ]
          },
          why: "AI changes can touch files you didn't expect, and fixing one thing often breaks another. With a git commit before each change, you can see exactly what the AI changed and undo all of it in one command.",
          cases: [{
            text: "Anthropic's Claude Code guide recommends four steps: explore, plan, code, commit. It also warns that its own undo feature is not a replacement for git.",
            sources: [SRC.claudeCode]
          }],
          steps: [
            "Commit before every request to the AI.",
            "After the AI finishes, look at what changed with git diff.",
            "If you don't like it, set the changes aside with git stash, which you can bring back later.",
            "When it works and the tests pass, commit again."
          ],
          code: [
            {
              kind: "command", label: "Save a checkpoint", file: "terminal",
              text: dedent(`
                git add -A
                git commit -m "Checkpoint before AI change"
              `)
            },
            { kind: "command", label: "See exactly what the AI changed", file: "terminal", text: "git diff" },
            {
              kind: "command", label: "Undo everything since the checkpoint", file: "terminal",
              text: dedent(`
                # Sets the changes aside (including new files). Nothing is lost:
                # "git stash pop" brings them back.
                git stash --include-untracked
              `)
            }
          ],
          prompt: "Before each change, remind me to commit. After each change, list every file you changed and why."
        },

        {
          id: "live-data",
          title: "Keep agents away from live data",
          mistake: "agent-live-database",
          question: {
            text: "Which database does the AI work on while you're making changes?",
            options: [
              ["The live one, with real users", "gap"],
              ["I'm not sure", "gap"],
              ["A separate test copy, and the live one has backups", "ok"],
              ["My app has no database", "skip"]
            ]
          },
          steps: [
            "Make a second database for development, like a second Supabase project.",
            "Put only the development database address in .env.local on your computer.",
            "Keep the live database address only in your host's settings.",
            "Turn on automatic backups for the live database, and make one before any big change.",
            "Turn off auto-approve for commands that delete or change data."
          ],
          code: [
            {
              kind: "file", label: "Your computer only knows the test database", file: ".env.local",
              text: dedent(`
                # Test database. The agent can break this one safely.
                DATABASE_URL=postgres://...your-test-database...

                # The live database address is NOT here.
                # It lives only in your host's environment settings.
              `)
            },
            {
              kind: "command", label: "Back up a Postgres database to a file", file: "terminal",
              text: "pg_dump \"$DATABASE_URL\" > backup.sql"
            }
          ]
        },

        {
          id: "packages",
          title: "Check packages before installing",
          mistake: "fake-package",
          question: {
            text: "When the AI wants to install a package, what do you do?",
            options: [
              ["Let it install whatever it picks", "gap"],
              ["I don't notice, it happens automatically", "gap"],
              ["Check it on npm or PyPI first", "ok"]
            ]
          },
          cases: [{
            text: "After installing, npm audit checks your packages against a list of known security problems and can fix many of them.",
            sources: [SRC.npmAudit]
          }],
          steps: [
            "Before installing, look the package up on npmjs.com or pypi.org.",
            "Check weekly downloads, the linked GitHub repo and when it was first published.",
            "Be careful with names that are a letter off from a famous package.",
            "Run npm audit after installing."
          ],
          code: [
            {
              kind: "command", label: "Check a package before installing", file: "terminal",
              text: dedent(`
                # Does it exist, where is its code, and when was it first published?
                npm view react-hook-form name version repository.url time.created
              `)
            },
            { kind: "command", label: "Check installed packages for known problems", file: "terminal", text: "npm audit" }
          ]
        },

        {
          id: "gitignore",
          title: "Keep secrets out of GitHub",
          mistake: "keys-on-github",
          question: {
            text: "Is your .env file listed in .gitignore?",
            options: [
              ["Yes, before my first commit", "ok"],
              ["No", "gap"],
              ["I'm not sure", "gap"]
            ]
          },
          cases: [{
            text: "GitHub's push protection blocks pushes that contain known kinds of secret keys before they reach the repo. It's on by default for your user account when pushing to public repos, and you can turn it on for each repo.",
            sources: [SRC.pushProtection]
          }],
          steps: [
            "Create .gitignore before your first commit, and list your .env files in it.",
            "Commit a .env.example with the names of the settings but fake values, so others know what to fill in.",
            "If a .env file was already pushed, stop tracking it, then replace every key that was in it."
          ],
          code: [
            {
              kind: "file", label: "Keep secret files out of git", file: ".gitignore",
              text: dedent(`
                # Secrets
                .env
                .env.*
                !.env.example

                # Installed packages
                node_modules/
              `)
            },
            {
              kind: "command", label: "Already pushed a .env file?", file: "terminal",
              text: dedent(`
                # Stop tracking it (the file stays on your computer)
                git rm --cached .env
                git commit -m "Stop tracking .env"
                git push

                # It's still in the history, so replace every key
                # in it at the service that issued it.
              `)
            }
          ]
        }
      ]
    }
  ];
})();
