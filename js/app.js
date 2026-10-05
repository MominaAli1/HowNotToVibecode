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
  let current = "screen-home";

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
    show(trail.length ? trail.pop() : "screen-home");
  }

  function home() {
    trail.length = 0;
    show("screen-home");
  }

  document.addEventListener("click", function (event) {
    const target = event.target;
    if (target.closest("[data-back]")) back();
    else if (target.closest("[data-home]")) home();
    else {
      const copyButton = target.closest("[data-copy]");
      if (copyButton) copyFrom($(copyButton.getAttribute("data-copy")), copyButton.parentElement.querySelector("[role=status]"));
    }
  });

  /* ---------------- copying ---------------- */

  function selectAll(source) {
    if (typeof source.select === "function") {
      source.focus();
      source.select();
      source.setSelectionRange(0, source.value.length);
      return;
    }
    const range = document.createRange();
    range.selectNodeContents(source);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  // Copies the text of a textarea or code box. If the browser won't copy,
  // the text gets selected so the person can press Ctrl+C themselves.
  function copyFrom(source, status) {
    const text = typeof source.value === "string" ? source.value : source.textContent;
    let settled = false;
    const fallback = function () {
      if (settled) return;
      settled = true;
      selectAll(source);
      status.textContent = "Selected. Press Ctrl+C (or Cmd+C on a Mac) to copy.";
    };
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      fallback();
      return;
    }
    status.textContent = "";
    // Some browsers never answer the copy request, so don't wait forever.
    setTimeout(fallback, 1500);
    navigator.clipboard.writeText(text).then(function () {
      if (settled) return;
      settled = true;
      status.textContent = "Copied.";
    }, fallback);
  }

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


  $("start-quiz").addEventListener("click", function () {
    startQuiz(state.matches.map(function (match) {
      return { mistake: MISTAKE_BY_ID[match.id], reason: match.reason };
    }));
  });

  /* ---------------- 5. quiz ---------------- */

  const FULL_QUIZ_REASON = "This is part of the full quiz. It didn't show up in what you wrote.";

  // In the full quiz, mistakes that matched still show their real reason.
  function fullQuizItem(m) {
    const match = state.matches.find(function (x) { return x.id === m.id; });
    return { mistake: m, reason: match ? match.reason : FULL_QUIZ_REASON };
  }

  const quiz = { items: [], index: 0, results: [] };

  const quizAnswer = $("quiz-answer");

  function startQuiz(items) {
    quiz.items = items;
    quiz.index = 0;
    quiz.results = [];
    renderQuestion();
    go("screen-quiz");
  }

  function renderQuestion() {
    const item = quiz.items[quiz.index];
    const q = item.mistake.quiz;

    $("quiz-progress").textContent = "Question " + (quiz.index + 1) + " of " + quiz.items.length;
    $("quiz-why").textContent = item.reason;
    $("quiz-question").textContent = q.question;
    quizAnswer.value = "";
    $("quiz-ask").hidden = false;
    $("quiz-feedback").hidden = true;
  }

  // Shows the library's right answer next to what they typed. There's no AI,
  // so the person decides whether they got it.
  function revealAnswer() {
    const item = quiz.items[quiz.index];
    const q = item.mistake.quiz;
    const typed = quizAnswer.value.trim();

    $("quiz-yours").textContent = typed;
    $("quiz-yours-box").hidden = typed === "";
    $("quiz-correct").textContent = q.options[q.answer];
    $("quiz-explanation").textContent = q.explanation;
    $("quiz-sources-label").textContent = item.mistake.sources.length === 1 ? "Source:" : "Sources:";
    $("quiz-sources").replaceChildren(...item.mistake.sources.map(function (s) {
      return el("li", null, [sourceLink(s)]);
    }));

    $("quiz-ask").hidden = true;
    $("quiz-feedback").hidden = false;
    $("quiz-correct-title").focus();
  }

  $("quiz-reveal").addEventListener("click", revealAnswer);

  quizAnswer.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      revealAnswer();
    }
  });

  function markAndContinue(gotIt) {
    quiz.results[quiz.index] = { mistake: quiz.items[quiz.index].mistake, right: gotIt };
    if (quiz.index + 1 < quiz.items.length) {
      quiz.index++;
      renderQuestion();
      window.scrollTo(0, 0);
      $("quiz-title").focus({ preventScroll: true });
    } else {
      showResults();
    }
  }

  $("quiz-got").addEventListener("click", function () { markAndContinue(true); });
  $("quiz-missed").addEventListener("click", function () { markAndContinue(false); });

  /* ---------------- 6. results ---------------- */

  function showResults() {
    const answered = quiz.results.filter(Boolean);
    const right = answered.filter(function (r) { return r.right; }).length;
    $("results-score").textContent = "You got " + right + " of " + answered.length + " right, by your own check.";

    const blind = $("results-blind");
    blind.replaceChildren();
    for (const field of FIELDS) {
      const asked = answered.filter(function (r) { return r.mistake.field === field.key; });
      if (asked.length === 0) continue;
      const missed = asked.filter(function (r) { return !r.right; });
      blind.appendChild(el("div", { class: "blind" }, [
        el("h4", { text: field.name }),
        missed.length === 0
          ? el("p", { text: "None. You got every " + field.name.toLowerCase() + " question right." })
          : el("ul", null, missed.map(function (r) { return el("li", { text: r.mistake.title }); }))
      ]));
    }
    go("screen-results");
  }

  $("full-quiz").addEventListener("click", function () {
    startQuiz(MISTAKES.map(fullQuizItem));
  });

  $("start-over").addEventListener("click", function () {
    // Forget everything from this round.
    state.text = "";
    state.ticked = {};
    state.matches = [];
    quiz.items = [];
    quiz.results = [];
    input.value = "";
    $("prompt-before").textContent = "";
    promptAfter.value = "";
    home();
  });

  /* ================= learning modules ================= */

  const MODULES = window.MODULES || [];

  // How each answer shapes the plan. Lower rank comes first.
  const STATUS = {
    gap: { chip: "Start here", chipClass: "found", rank: 0 },
    skip: { chip: "Good to know", chipClass: "never", rank: 1 },
    ok: { chip: "You already do this", chipClass: "never", rank: 2 }
  };

  const CODE_KINDS = {
    risky: "Risky",
    safer: "Safer",
    command: "Run this",
    prompt: "Prompt",
    file: "Example file"
  };

  // The module in progress. Lives only in memory.
  const learn = { module: null, answers: {}, order: [], index: 0 };

  function sourceList(sources) {
    return el("ul", { class: "sources" }, sources.map(function (s) { return el("li", null, [sourceLink(s)]); }));
  }

  /* ---------------- home ---------------- */

  function moduleCard(title, tagline, count, onClick, extraClass) {
    return el("button", { type: "button", class: "module-card" + (extraClass ? " " + extraClass : ""), on: { click: onClick } }, [
      el("span", { class: "module-title", text: title }),
      el("span", { class: "module-tagline", text: tagline }),
      el("span", { class: "module-count", text: count })
    ]);
  }

  (function renderHome() {
    const list = $("module-list");
    for (const mod of MODULES) {
      list.appendChild(moduleCard(mod.title, mod.tagline, plural(mod.lessons.length, "lesson"), function () { startModule(mod); }));
    }
    list.appendChild(moduleCard(
      "Check a chat or prompt",
      "Paste what you told your AI and see the mistakes in it",
      MISTAKES.length + " mistakes it can find",
      function () { go("screen-input"); },
      "checker"
    ));
  })();

  /* ---------------- how do you work now? ---------------- */

  const practiceError = $("practice-error");

  function startModule(mod) {
    learn.module = mod;
    learn.answers = {};
    learn.order = [];
    learn.index = 0;
    renderPractice(mod);
    go("screen-practice");
  }

  function renderPractice(mod) {
    $("practice-title").textContent = mod.title + ": how do you work now?";
    $("practice-intro").textContent = mod.intro;
    $("practice-sources").replaceChildren(
      el("span", { text: mod.introSources.length === 1 ? "Source: " : "Sources: " }),
      ...mod.introSources.map(function (s, i) {
        return el("span", null, [i > 0 ? ", " : "", sourceLink(s)]);
      })
    );
    practiceError.hidden = true;

    const questions = $("practice-questions");
    questions.replaceChildren();
    mod.lessons.forEach(function (lesson, i) {
      const name = "q-" + lesson.id;
      const options = lesson.question.options.map(function (option, j) {
        const radio = el("input", {
          type: "radio", name: name, value: String(j),
          on: {
            change: function () {
              learn.answers[lesson.id] = { status: option[1], text: option[0] };
              practiceError.hidden = true;
            }
          }
        });
        return el("label", { class: "check" }, [radio, el("span", { text: option[0] })]);
      });
      questions.appendChild(el("fieldset", { class: "question-set", id: "set-" + lesson.id }, [
        el("legend", { text: (i + 1) + ". " + lesson.question.text })
      ].concat(options)));
    });
  }

  $("practice-done").addEventListener("click", function () {
    const mod = learn.module;
    const missing = mod.lessons.filter(function (lesson) { return !learn.answers[lesson.id]; });
    if (missing.length > 0) {
      practiceError.textContent = "Answer every question to see your plan. " + plural(missing.length, "question") + " left.";
      practiceError.hidden = false;
      const first = document.querySelector("#set-" + missing[0].id + " input");
      first.focus();
      return;
    }
    learn.order = planOrder(mod);
    renderPlan();
    go("screen-plan");
  });

  /* ---------------- your plan ---------------- */

  // Lessons the answers show they need come first, then the rest, in module order.
  function planOrder(mod) {
    return mod.lessons
      .map(function (lesson, i) { return { lesson: lesson, answer: learn.answers[lesson.id], i: i }; })
      .sort(function (a, b) {
        return STATUS[a.answer.status].rank - STATUS[b.answer.status].rank || a.i - b.i;
      });
  }

  function chip(status) {
    return el("span", { class: "chip " + STATUS[status].chipClass, text: STATUS[status].chip });
  }

  function renderPlan() {
    const mod = learn.module;
    $("plan-title").textContent = "Your plan: " + mod.title;

    const count = { gap: 0, skip: 0, ok: 0 };
    for (const item of learn.order) count[item.answer.status]++;
    const parts = [];
    if (count.gap) parts.push(count.gap + " to start with");
    if (count.ok) parts.push(count.ok + " you already do");
    if (count.skip) parts.push(count.skip + " good to know");
    $("plan-summary").textContent = count.gap
      ? plural(learn.order.length, "lesson") + ": " + parts.join(", ") + "."
      : "You already do the basics. Here's how developers do each one, with the code they use.";

    const list = $("plan-list");
    list.replaceChildren();
    learn.order.forEach(function (item, i) {
      list.appendChild(el("li", null, [
        el("button", { type: "button", class: "plan-item", on: { click: function () { openLesson(i); } } }, [
          el("span", { class: "plan-name", text: item.lesson.title }),
          chip(item.answer.status)
        ])
      ]));
    });
  }

  $("plan-start").addEventListener("click", function () { openLesson(0); });

  /* ---------------- one lesson ---------------- */

  // A lesson linked to a library mistake reuses its explanation, case, sources and fix line.
  function lessonContent(lesson) {
    const m = lesson.mistake ? MISTAKE_BY_ID[lesson.mistake] : null;
    return {
      why: lesson.why || (m ? m.whatGoesWrong : ""),
      cases: (m ? [{ text: m.realCase, sources: m.sources }] : []).concat(lesson.cases || []),
      prompt: lesson.prompt || (m ? m.fixLine : "")
    };
  }

  function codeBlock(sample) {
    const pre = el("pre", { class: "code", tabindex: "0", "aria-label": sample.label }, [el("code", { text: sample.text })]);
    const status = el("span", { class: "copy-status", role: "status", "aria-live": "polite" });
    // Risky code gets no Copy button, so nobody pastes it by mistake.
    const actions = sample.kind === "risky" ? null : el("div", { class: "code-actions" }, [
      el("button", { type: "button", class: "button small", text: "Copy", on: { click: function () { copyFrom(pre, status); } } }),
      status
    ]);
    return el("figure", { class: "code-block " + sample.kind }, [
      el("figcaption", null, [
        el("span", { class: "code-kind", text: CODE_KINDS[sample.kind] }),
        el("span", { class: "code-label", text: sample.label }),
        sample.file ? el("span", { class: "code-file", text: sample.file }) : null
      ]),
      pre,
      actions
    ]);
  }

  function renderLesson() {
    const item = learn.order[learn.index];
    const lesson = item.lesson;
    const content = lessonContent(lesson);
    const last = learn.index === learn.order.length - 1;

    $("lesson-progress").textContent = learn.module.title + ": lesson " + (learn.index + 1) + " of " + learn.order.length;
    $("lesson-title").textContent = lesson.title;

    const promptBox = el("pre", { class: "code prompt-box", tabindex: "0", "aria-label": "Line to give your AI" }, [el("code", { text: content.prompt })]);
    const promptStatus = el("span", { class: "copy-status", role: "status", "aria-live": "polite" });

    $("lesson-body").replaceChildren(
      el("div", { class: "answer-note" }, [
        chip(item.answer.status),
        el("p", null, [el("strong", { text: "You said: " }), item.answer.text])
      ]),
      el("h3", { text: "Why it matters" }),
      el("p", { text: content.why }),
      el("h3", { text: "What really happened" }),
      ...content.cases.map(function (c) {
        return el("div", { class: "case" }, [el("p", { text: c.text }), sourceList(c.sources)]);
      }),
      el("h3", { text: "How to do it" }),
      el("ol", { class: "steps" }, lesson.steps.map(function (step) { return el("li", { text: step }); })),
      el("h3", { text: "The code" }),
      ...lesson.code.map(codeBlock),
      el("h3", { text: "Tell your AI" }),
      el("p", { class: "note", text: "Paste this into your prompt, or into your rules file so it applies every time." }),
      promptBox,
      el("div", { class: "code-actions" }, [
        el("button", { type: "button", class: "button small", text: "Copy", on: { click: function () { copyFrom(promptBox, promptStatus); } } }),
        promptStatus
      ])
    );

    $("lesson-prev").hidden = learn.index === 0;
    $("lesson-next").textContent = last ? "Finish this topic" : "Next lesson";
  }

  function openLesson(i) {
    learn.index = i;
    renderLesson();
    if (current === "screen-lesson") {
      window.scrollTo(0, 0);
      $("lesson-title").focus({ preventScroll: true });
    } else {
      go("screen-lesson");
    }
  }

  $("lesson-prev").addEventListener("click", function () { openLesson(learn.index - 1); });

  $("lesson-next").addEventListener("click", function () {
    if (learn.index < learn.order.length - 1) openLesson(learn.index + 1);
    else showModuleDone();
  });

  /* ---------------- module finished ---------------- */

  function showModuleDone() {
    const mod = learn.module;
    $("done-title").textContent = "You finished: " + mod.title;
    const lines = mod.lessons.map(function (lesson) { return "- " + lessonContent(lesson).prompt; });
    $("done-rules").value = "## " + mod.title + " rules\n" + lines.join("\n");
    $("screen-module-done").querySelector("[role=status]").textContent = "";
    go("screen-module-done");
  }
})();
