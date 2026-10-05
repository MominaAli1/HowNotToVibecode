# How Not to Vibecode

Learn to vibecode without the mistakes that leak keys, data and money.

Pick a topic: **Security**, **Prompting**, **Prompting different AI models**,
**Testing**, **Working with AI agents** or **What you share with AI**.
The app asks how you work now, puts the lessons you need first, and teaches each
one with a real case, its source, the steps, and the code developers usually use.

Or paste a chat you had with an AI coding tool. The app finds the mistakes in it,
rewrites your prompt with the fixes, then quizzes you on exactly those mistakes.

## Open it

Double-click `index.html`. That's it: no install, no server, no account.

## Privacy

Everything runs in your browser. What you paste is never sent anywhere and never
saved (no cookies, no local storage). If your text contains a secret key, the app
only ever shows its last 4 characters.

## Files

| File | What it does |
| --- | --- |
| `index.html` | The screens |
| `style.css` | The look |
| `js/library.js` | The 15 mistakes, each with a real case and source |
| `js/rules.js` | Finds your app's features and matches mistakes |
| `js/lessons.js` | The six topics, their questions, lessons and code samples |
| `js/app.js` | Topics, lessons, report, better prompt and quiz |
| `tests/run.js` | Tests for the matching rules and lesson content |

## Run the tests

Needs [Node.js](https://nodejs.org). No packages to install.

```
node tests/run.js
```
