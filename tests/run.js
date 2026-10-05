/*
  Plain Node tests. No packages needed.
  Run with: node tests/run.js
*/
"use strict";

const path = require("path");

// library.js and rules.js expect a browser "window", so give them a stand-in.
global.window = {};
require(path.join(__dirname, "..", "js", "library.js"));
require(path.join(__dirname, "..", "js", "rules.js"));

const Rules = window.Rules;
const MISTAKES = window.MISTAKES;

// Fake key, made by joining strings so it never appears whole in the repo.
const FAKE_KEY = "sk-" + "proj-" + "EXAMPLEONLY" + "0000" + "notreal" + "WXYZ";

let failures = 0;

function test(name, fn) {
  try {
    fn();
    console.log("PASS  " + name);
  } catch (err) {
    failures++;
    console.log("FAIL  " + name + "\n      " + err.message);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Check text the way the app does: detect features, tick them, match.
function check(text, changes) {
  const ticked = Object.assign(Rules.detectFeatures(text), changes || {});
  return Rules.matchMistakes(text, ticked);
}

function ids(results) {
  return results.map(function (r) { return r.id; });
}

function byId(results, id) {
  return results.find(function (r) { return r.id === id; });
}

const GYM = "I tell Claude to make a gym app where people sign up, save their workouts, and pay monthly with Stripe.";

/* ---------------- the 4 required tests ---------------- */

test("Gym app sentence matches exactly the expected 7 mistakes", function () {
  const expected = ["secret-in-code", "open-database", "change-the-id", "no-self-review", "no-check", "no-plan", "vague-prompt"];
  const got = ids(check(GYM));
  assert(
    got.length === expected.length && expected.every(function (id) { return got.indexOf(id) !== -1; }),
    "expected " + expected.join(", ") + "\n      got      " + got.join(", ")
  );
});

test("Chat with a fake OpenAI key: found, and masked to the last 4 characters", function () {
  const chat =
    "Me: my chatbot won't answer. Here's my code:\n" +
    "const openai = new OpenAI({ apiKey: \"" + FAKE_KEY + "\" });";
  const hit = byId(check(chat), "secret-in-code");
  assert(hit, "secret-in-code did not match");
  assert(hit.label === Rules.LABEL_FOUND, "label was \"" + hit.label + "\"");

  const masked = Rules.maskSecrets(chat);
  assert(masked.indexOf(FAKE_KEY) === -1, "the full key is still visible");
  assert(masked.indexOf("EXAMPLEONLY") === -1, "part of the key is still visible");
  assert(masked.indexOf("••••WXYZ") !== -1, "masked key should end in ••••WXYZ");
});

test("Chat repeating \"still not working\", \"same error\", \"try again\" matches correction-loop", function () {
  const chat =
    "Me: the login page is still not working.\n" +
    "AI: I've updated the handler.\n" +
    "Me: same error as before.\n" +
    "AI: Here's another approach.\n" +
    "Me: nope, try again.";
  const hit = byId(check(chat), "correction-loop");
  assert(hit, "correction-loop did not match");
  assert(hit.label === Rules.LABEL_FOUND, "label was \"" + hit.label + "\"");
});

test("Careful prompt does not match open-database, secret-in-code, no-check, no-plan, no-self-review", function () {
  const careful = GYM +
    " Turn on row level security for every table so each user can only read their own rows." +
    " Keep the Stripe secret key in environment variables on the server." +
    " Write tests and show me the output." +
    " Before writing code, give me a plan and wait for my OK." +
    " When you finish, review your own code for problems.";
  const got = ids(check(careful));
  const shouldNot = ["open-database", "secret-in-code", "no-check", "no-plan", "no-self-review"];
  const wrong = shouldNot.filter(function (id) { return got.indexOf(id) !== -1; });
  assert(wrong.length === 0, "still matched: " + wrong.join(", "));
});

/* ---------------- extra safety checks ---------------- */

test("Whole words only: \"paycheck\" is not payments, \"pay\" is", function () {
  assert(!Rules.detectFeatures("Track my paycheck").payments, "paycheck ticked payments");
  assert(Rules.detectFeatures("Users pay monthly").payments, "pay did not tick payments");
});

test("Protect words starting with a dot still work (.env)", function () {
  const got = ids(check("Add Stripe payments. Put the key in a .env file."));
  assert(got.indexOf("secret-in-code") === -1, "secret-in-code matched even though .env was mentioned");
});

test("Matching uses the tick boxes: unticking payments removes secret-in-code", function () {
  const got = ids(check(GYM, { payments: false }));
  assert(got.indexOf("secret-in-code") === -1, "secret-in-code still matched");
});

test("Handles passwords itself only when no login service is named", function () {
  assert(Rules.detectFeatures("Users log in with email and password").ownLogin, "ownLogin should be on");
  assert(!Rules.detectFeatures("Users log in with email and password using Clerk").ownLogin, "ownLogin should be off with Clerk");
});

test("Results come back in library order", function () {
  const order = MISTAKES.map(function (m) { return m.id; });
  const got = ids(check(GYM));
  const positions = got.map(function (id) { return order.indexOf(id); });
  assert(positions.every(function (p, i) { return i === 0 || p > positions[i - 1]; }), "order was " + got.join(", "));
});

test("Every mistake in the library is complete and uses known features", function () {
  const known = Rules.FEATURE_NAMES;
  MISTAKES.forEach(function (m) {
    ["id", "field", "title", "whatGoesWrong", "realCase", "howDevsCatch", "fixLine"].forEach(function (key) {
      assert(m[key], m.id + " is missing " + key);
    });
    assert(m.field === "security" || m.field === "prompting", m.id + " has an unknown field");
    (m.needsAll || []).concat(m.needsAny || []).forEach(function (f) {
      assert(known.indexOf(f) !== -1, m.id + " needs unknown feature " + f);
    });
    assert(m.sources.length > 0, m.id + " has no sources");
    assert(m.quiz.options.length === 4 && m.quiz.answer >= 0 && m.quiz.answer < 4, m.id + " quiz answer out of range");
  });
});

console.log("\n" + (failures === 0 ? "All tests passed." : failures + " test(s) failed."));
process.exitCode = failures === 0 ? 0 : 1;
