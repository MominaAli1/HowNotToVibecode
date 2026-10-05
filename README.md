# How Not to Vibecode

Paste a chat you had with an AI coding tool, or describe what you ask it to make.
The app finds the security and prompting mistakes in it, shows each one with a real
case and its source, rewrites your prompt with the fixes, then quizzes you on
exactly those mistakes.

## Open it

Double-click `index.html`. That's it: no install, no server, no account.

## Privacy

Everything runs in your browser. What you paste is never sent anywhere and never
saved (no cookies, no local storage). If your text contains a secret key, the app
only ever shows its last 4 characters.

## Files

| File | What it does |
| --- | --- |
| `index.html` | The six screens |
| `style.css` | The look |
| `js/library.js` | The 15 mistakes, each with a real case and source |
| `js/rules.js` | Finds your app's features and matches mistakes |
| `js/app.js` | Screens, report, better prompt and quiz |
| `tests/run.js` | Tests for the matching rules |

## Run the tests

Needs [Node.js](https://nodejs.org). No packages to install.

```
node tests/run.js
```
