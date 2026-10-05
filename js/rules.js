/*
  RULES

  Reads what the person wrote and decides:
    detectFeatures  which app features it mentions (shown as tick boxes)
    matchMistakes   which mistakes from library.js apply, using the ticked boxes
    maskSecrets     hides secret keys so only their last 4 characters show

  Everything runs in the browser. Nothing is sent anywhere or saved.
  Search patterns are made once and reused, so checking stays fast
  even for long pasted chats.
*/

(function () {
  "use strict";

  const LABEL_FOUND = "Found in what you wrote";
  const LABEL_NEVER_ASKED = "You never asked for this";

  // Words that suggest each feature. Matched as whole words or phrases.
  const FEATURE_WORDS = {
    accounts: ["login", "log in", "sign up", "signup", "sign-up", "sign in", "account", "accounts", "users", "register", "auth", "authentication"],
    database: ["database", "db", "supabase", "firebase", "firestore", "postgres", "mysql", "mongodb", "sqlite", "prisma", "save", "saves", "store", "stores", "track", "history"],
    payments: ["pay", "payment", "payments", "stripe", "subscription", "subscriptions", "checkout", "billing", "paypal", "lemon squeezy"],
    ai: ["openai", "gpt", "chatbot", "ai chat", "ai feature", "llm", "gemini api", "claude api", "anthropic api"],
    userContent: ["comment", "comments", "post", "posts", "review", "reviews", "profile", "profiles", "bio", "messages", "forum", "feed"],
    private: ["internal", "team only", "team-only", "employees", "staff only", "company only", "members only", "private app"],
    agent: ["claude code", "cursor", "replit", "lovable", "bolt", "windsurf", "devin", "v0", "ai agent", "agent"],
    packages: ["npm install", "npm i", "pip install", "yarn add", "pnpm add"],
    github: ["github", "git push", "push to", "commit", "repo", "repository"]
  };

  // Every feature, in tick-box order. ownLogin is worked out from the others.
  const FEATURE_NAMES = Object.keys(FEATURE_WORDS).concat("ownLogin");

  // If any of these appear, the app uses a login service instead of handling passwords itself.
  const LOGIN_SERVICES = [
    "supabase auth", "clerk", "firebase auth", "auth0", "nextauth", "auth.js",
    "better-auth", "magic link", "sign in with google", "google login", "oauth"
  ];

  const SECURE_WORDS = ["secure", "safe", "security"];
  const DETAIL_WORDS = [
    "edge case", "what if", "if the user", "when the user", "limit", "max",
    "must", "should not", "don't", "only"
  ];
  const VAGUE_WORD_LIMIT = 25;

  /* ---------------- text helpers ---------------- */

  // Curly apostrophes (from phones and docs) become straight ones,
  // so "don’t" matches "don't".
  function normalize(text) {
    return String(text == null ? "" : text).replace(/[‘’ʼ]/g, "'");
  }

  function wordCount(text) {
    const trimmed = String(text == null ? "" : text).trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }

  function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // One word or phrase as a pattern piece:
  //   - whole words only, so "pay" doesn't match "paycheck"
  //   - an optional plural "s", so "environment variable" matches "environment variables"
  //   - any spaces or line breaks between words
  //   - words starting with a dot (.env) skip the left edge check, so "my .env" still matches
  function phrasePiece(phrase) {
    const lower = phrase.toLowerCase();
    const body = escapeRegExp(lower).replace(/\s+/g, "\\s+");
    const start = /^\w/.test(lower) ? "(?<!\\w)" : "";
    const end = /\w$/.test(lower) ? "s?(?!\\w)" : "";
    return start + body + end;
  }

  // A whole word list becomes one pattern, made once, so the text is searched in a single pass.
  const listCache = new Map();
  function listRegex(phrases) {
    const key = phrases.join("\u0000");
    let re = listCache.get(key);
    if (!re) {
      re = new RegExp(phrases.map(phrasePiece).join("|"), "i");
      listCache.set(key, re);
    }
    return re;
  }

  function hasAny(text, phrases) {
    if (!phrases || phrases.length === 0) return false;
    return listRegex(phrases).test(text);
  }

  // Library patterns are copied once into "find every match" versions.
  // lastIndex is reset before each use, so a previous search never leaks into the next.
  const globalCache = new Map();
  function globalCopy(re) {
    let copy = globalCache.get(re);
    if (!copy) {
      copy = new RegExp(re.source, re.flags.indexOf("g") === -1 ? re.flags + "g" : re.flags);
      globalCache.set(re, copy);
    }
    copy.lastIndex = 0;
    return copy;
  }

  // Counts matches across all patterns, stopping early once "enough" is reached.
  function countMatches(text, patterns, enough) {
    let total = 0;
    for (const pattern of patterns) {
      const re = globalCopy(pattern);
      let m;
      while ((m = re.exec(text)) !== null) {
        total++;
        if (total >= enough) return total;
        if (m[0] === "") re.lastIndex++;
      }
    }
    return total;
  }

  function mistakes() {
    return window.MISTAKES || [];
  }

  /* ---------------- features ---------------- */

  function detectFeatures(rawText) {
    const text = normalize(rawText);
    const found = {};
    for (const name of Object.keys(FEATURE_WORDS)) {
      found[name] = hasAny(text, FEATURE_WORDS[name]);
    }
    found.ownLogin = found.accounts && hasAny(text, ["password"]) && !hasAny(text, LOGIN_SERVICES);
    return found;
  }

  /* ---------------- matching ---------------- */

  // Every protect word from every security mistake, gathered once.
  let securityProtectWords = null;
  function allSecurityProtectWords() {
    if (!securityProtectWords) {
      securityProtectWords = [];
      for (const m of mistakes()) {
        if (m.field === "security") securityProtectWords.push.apply(securityProtectWords, m.protectWords);
      }
    }
    return securityProtectWords;
  }

  function found(m) {
    return { label: LABEL_FOUND, reason: m.reasonFound };
  }

  function neverAsked(m) {
    return { label: LABEL_NEVER_ASKED, reason: m.reasonNeverAsked };
  }

  const CUSTOM_RULES = {
    genericSecure: function (m, text) {
      if (hasAny(text, SECURE_WORDS) && !hasAny(text, allSecurityProtectWords())) return found(m);
      return null;
    },
    manyFeatures: function (m, text, ticked, tickedCount) {
      if (tickedCount >= 3 && !hasAny(text, m.protectWords)) return neverAsked(m);
      return null;
    },
    vaguePrompt: function (m, text) {
      if (wordCount(text) < VAGUE_WORD_LIMIT || !hasAny(text, DETAIL_WORDS)) return found(m);
      return null;
    }
  };

  function checkMistake(m, text, ticked, tickedCount) {
    // 1. Proof in the text wins, even if the features aren't ticked.
    if (m.foundPatterns.length > 0 && countMatches(text, m.foundPatterns, m.foundMin) >= m.foundMin) {
      return found(m);
    }

    // 2. A special check decides on its own.
    if (m.customRule) {
      const rule = CUSTOM_RULES[m.customRule];
      return rule ? rule(m, text, ticked, tickedCount) : null;
    }

    // 3. The app has the features, and the person never asked for the protection.
    if (!m.reasonNeverAsked) return null;
    if (!m.needsAll.every(function (f) { return ticked[f]; })) return null;
    if (m.needsAny && m.needsAny.length > 0 && !m.needsAny.some(function (f) { return ticked[f]; })) return null;
    if (hasAny(text, m.protectWords)) return null;
    return neverAsked(m);
  }

  // ticked: { accounts: true, payments: false, ... } from the tick boxes.
  // Returns [{ id, label, reason }] in library order.
  function matchMistakes(rawText, ticked) {
    const text = normalize(rawText);
    const on = ticked || {};
    const tickedCount = FEATURE_NAMES.filter(function (f) { return on[f]; }).length;
    const results = [];
    for (const m of mistakes()) {
      const hit = checkMistake(m, text, on, tickedCount);
      if (hit) results.push({ id: m.id, label: hit.label, reason: hit.reason });
    }
    return results;
  }

  /* ---------------- hiding keys ---------------- */

  // The key-shaped patterns from "secret-in-code". "service_role" is a label,
  // not a key, so it stays readable.
  let keyPatterns = null;
  function secretKeyPatterns() {
    if (!keyPatterns) {
      const m = mistakes().find(function (x) { return x.id === "secret-in-code"; });
      keyPatterns = m ? m.foundPatterns.filter(function (p) { return p.source !== "service_role"; }) : [];
    }
    return keyPatterns;
  }

  function maskSecrets(rawText) {
    let text = String(rawText == null ? "" : rawText);
    for (const pattern of secretKeyPatterns()) {
      text = text.replace(globalCopy(pattern), function (key) {
        return "••••" + key.slice(-4);
      });
    }
    return text;
  }

  window.Rules = {
    FEATURE_NAMES: FEATURE_NAMES,
    LABEL_FOUND: LABEL_FOUND,
    LABEL_NEVER_ASKED: LABEL_NEVER_ASKED,
    detectFeatures: detectFeatures,
    matchMistakes: matchMistakes,
    maskSecrets: maskSecrets,
    wordCount: wordCount
  };
})();
