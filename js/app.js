/*
  APP

  Runs the screens. Everything stays in this page's memory:
  nothing is saved (no localStorage, no cookies) and nothing is sent anywhere.

  Safety rule for this file: every piece of text from the person or the
  library goes onto the page with textContent (through the el() helper),
  never as HTML.
*/

(function () {
  "use strict";

  const Rules = window.Rules;
  const MISTAKES = window.MISTAKES;

  const FEATURE_LABELS = {
    accounts: "Accounts and login",
    database: "Saves user data",
    payments: "Payments",
    ai: "AI features",
    userContent: "Users post things others can see",
    private: "Private or team-only app",
    agent: "An AI agent works on your code",
    packages: "Installs packages",
    github: "Code goes to GitHub",
    ownLogin: "Handles passwords itself"
  };

  // Fake key, joined from pieces so the whole thing never sits in the code.
  const FAKE_KEY = "sk-" + "proj-" + "EXAMPLEONLY" + "notarealkey" + "7Q2x";

  const EXAMPLES = {
    chat: [
      "Me: Make a recipe sharing app with Supabase. People log in and leave comments on each recipe.",
      "AI: Done! Supabase login is set up, and comments show under each recipe with:",
      "    list.innerHTML += \"<p>\" + comment.text + \"</p>\";",
      "Me: Now add a button that suggests recipes with OpenAI. Here's my key: " + FAKE_KEY,
      "AI: Added. The key is in recipes.js so the button can call OpenAI directly.",
      "Me: The suggest button is still not working.",
      "AI: I changed the request format. Please refresh and check.",
      "Me: Same error, 401 Unauthorized.",
      "AI: I updated the headers.",
      "Me: Nope. Try again."
    ].join("\n"),
    description: "I tell Claude to make a gym app where people sign up, save their workouts, and pay monthly with Stripe."
  };

  // What the person is working on. Lives only in memory.
  const state = {
    text: "",
    ticked: {},
    matches: []
  };

  /* ---------------- helpers ---------------- */

  function $(id) {
    return document.getElementById(id);
  }

  // Makes an element. Text always goes in through textContent.
  function el(tag, props, children) {
    const node = document.createElement(tag);
    if (props) {
      for (const key of Object.keys(props)) {
        const value = props[key];
        if (value == null || value === false) continue;
        if (key === "text") node.textContent = value;
        else if (key === "class") node.className = value;
        else if (key === "on") {
          for (const type of Object.keys(value)) node.addEventListener(type, value[type]);
        } else node.setAttribute(key, value === true ? "" : value);
      }
    }
    if (children) {
      for (const child of children) {
        if (child == null || child === false) continue;
        node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
      }
    }
    return node;
  }

  /* ---------------- screens ---------------- */

  const screens = Array.prototype.slice.call(document.querySelectorAll(".screen"));
  const trail = []; // screens visited, for the Back buttons
  let current = "screen-input";

  function show(id) {
    for (const screen of screens) screen.hidden = screen.id !== id;
    current = id;
    window.scrollTo(0, 0);
    // Move keyboard and screen reader focus to the new screen's heading.
    const heading = $(id).querySelector("h1, h2");
    if (heading) heading.focus({ preventScroll: true });
  }

  function go(id) {
    if (id !== current) trail.push(current);
    show(id);
  }

  function back() {
    show(trail.length ? trail.pop() : "screen-input");
  }

  document.addEventListener("click", function (event) {
    if (event.target.closest("[data-back]")) back();
  });

  /* ---------------- 1. input ---------------- */

  const input = $("input-text");
  const inputError = $("input-error");

  function fillExample(kind) {
    input.value = EXAMPLES[kind];
    inputError.hidden = true;
    input.focus();
  }

  $("example-chat").addEventListener("click", function () { fillExample("chat"); });
  $("example-description").addEventListener("click", function () { fillExample("description"); });

  input.addEventListener("input", function () { inputError.hidden = true; });

  $("check-it").addEventListener("click", function () {
    const text = input.value.trim();
    if (!text) {
      inputError.textContent = "Paste a chat or describe your app first.";
      inputError.hidden = false;
      input.focus();
      return;
    }
    state.text = text;
    setTicks(Rules.detectFeatures(text));
    go("screen-features");
  });

  /* ---------------- 2. confirm features ---------------- */

  const featureBoxes = {};

  (function renderFeatureList() {
    const list = $("feature-list");
    for (const name of Rules.FEATURE_NAMES) {
      const box = el("input", { type: "checkbox", name: "feature", value: name });
      featureBoxes[name] = box;
      list.appendChild(el("label", { class: "check" }, [box, el("span", { text: FEATURE_LABELS[name] })]));
    }
  })();

  function setTicks(detected) {
    for (const name of Rules.FEATURE_NAMES) featureBoxes[name].checked = !!detected[name];
  }

  function readTicks() {
    const ticked = {};
    for (const name of Rules.FEATURE_NAMES) ticked[name] = featureBoxes[name].checked;
    return ticked;
  }

  $("show-mistakes").addEventListener("click", function () {
    state.ticked = readTicks();
    state.matches = Rules.matchMistakes(state.text, state.ticked);
    showReport();
  });

  /* ---------------- 3. report ---------------- */

  const FIELDS = [
    { key: "security", name: "Security" },
    { key: "prompting", name: "Prompting" }
  ];

  const MISTAKE_BY_ID = {};
  for (const m of MISTAKES) MISTAKE_BY_ID[m.id] = m;

  function plural(count, word) {
    return count + " " + word + (count === 1 ? "" : "s");
  }

  function countByField(matches) {
    const counts = { security: 0, prompting: 0 };
    for (const match of matches) counts[MISTAKE_BY_ID[match.id].field]++;
    return counts;
  }

  // Only web links are allowed, so a bad library entry can't run code when clicked.
  function sourceLink(source) {
    if (!/^https?:\/\//i.test(source.url)) return el("span", { text: source.label });
    return el("a", { href: source.url, target: "_blank", rel: "noopener noreferrer", text: source.label });
  }

  function mistakeCard(match) {
    const m = MISTAKE_BY_ID[match.id];
    const isFound = match.label === Rules.LABEL_FOUND;
    return el("article", { class: "card" }, [
      el("h4", { text: m.title }),
      el("span", { class: "chip " + (isFound ? "found" : "never"), text: match.label }),
      el("p", { class: "reason", text: match.reason }),
      el("h5", { text: "What goes wrong" }),
      el("p", { text: m.whatGoesWrong }),
      el("h5", { text: "The real case" }),
      el("p", { text: m.realCase }),
      el("h5", { text: m.sources.length === 1 ? "Source" : "Sources" }),
      el("ul", null, m.sources.map(function (s) { return el("li", null, [sourceLink(s)]); })),
      el("h5", { text: "How developers catch it" }),
      el("p", { text: m.howDevsCatch })
    ]);
  }

  function showReport() {
    const matches = state.matches;
    const groups = $("report-groups");
    const actions = $("report-actions");
    groups.replaceChildren();
    actions.replaceChildren();

    if (matches.length === 0) {
      $("report-summary").textContent = "We didn't find any of the 15 mistakes in what you wrote.";
      groups.appendChild(el("p", { text: "You can still test yourself on all of them." }));
      actions.appendChild(el("button", {
        type: "button", class: "button primary", text: "Take the full quiz (all 15)",
        on: { click: function () { startQuiz(MISTAKES.map(fullQuizItem)); } }
      }));
      go("screen-report");
      return;
    }

    const counts = countByField(matches);
    $("report-summary").textContent =
      plural(matches.length, "mistake") + ": " + counts.security + " security, " + counts.prompting + " prompting";

    for (const field of FIELDS) {
      const cards = matches
        .filter(function (match) { return MISTAKE_BY_ID[match.id].field === field.key; })
        .map(mistakeCard);
      if (cards.length === 0) continue;
      groups.appendChild(el("section", { class: "group", "aria-label": field.name }, [el("h3", { text: field.name })].concat(cards)));
    }

    actions.appendChild(el("button", {
      type: "button", class: "button primary", text: "See a better prompt",
      on: { click: showPrompt }
    }));
    go("screen-report");
  }

  /* ---------------- 4. better prompt ---------------- */

  const SHORT_TEXT_WORDS = 80;

  function betterPrompt(text, matches) {
    // A short description gets improved in place. A long pasted chat gets a fresh start.
    const start = Rules.wordCount(text) < SHORT_TEXT_WORDS
      ? Rules.maskSecrets(text)
      : "[Describe what you want to build]";
    // matches are already in library order.
    const fixes = matches.map(function (match, i) {
      const m = MISTAKE_BY_ID[match.id];
      return (i + 1) + ". " + m.title + ": " + m.fixLine;
    });
    return start + "\n\nAlso:\n" + fixes.join("\n");
  }

  const copyStatus = $("copy-status");
  const promptAfter = $("prompt-after");

  function showPrompt() {
    $("prompt-before").textContent = Rules.maskSecrets(state.text);
    promptAfter.value = betterPrompt(state.text, state.matches);
    copyStatus.textContent = "";
    go("screen-prompt");
  }

  function selectPrompt() {
    promptAfter.focus();
    promptAfter.select();
    promptAfter.setSelectionRange(0, promptAfter.value.length);
  }

  $("copy-prompt").addEventListener("click", function () {
    let settled = false;
    const fallback = function () {
      if (settled) return;
      settled = true;
      selectPrompt();
      copyStatus.textContent = "Selected. Press Ctrl+C (or Cmd+C on a Mac) to copy.";
    };
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      fallback();
      return;
    }
    copyStatus.textContent = "";
    // Some browsers never answer the copy request, so don't wait forever.
    setTimeout(fallback, 1500);
    navigator.clipboard.writeText(promptAfter.value).then(function () {
      if (settled) return;
      settled = true;
      copyStatus.textContent = "Copied.";
    }, fallback);
  });

  $("start-quiz").addEventListener("click", function () {
    startQuiz(state.matches.map(function (match) {
      return { mistake: MISTAKE_BY_ID[match.id], reason: match.reason };
    }));
  });

  /* ---------------- 5. quiz ---------------- */

  function fullQuizItem(m) {
    return { mistake: m, reason: null };
  }

  function startQuiz(items) {
    // The quiz screen comes in the next step.
  }
})();
