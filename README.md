<div align="center">

<img src="docs/media/banner.png" alt="Myuuel Memory Practice — Myuuel stands beside a practice card showing the fictional combination O5prgatg! and the sentence it comes from" width="100%">

# Myuuel Memory Practice

**A memory training app for your desktop. Practise remembering strong passwords — with fictional ones only.**

[![Download for Windows](https://img.shields.io/badge/Download-Windows%20x64-e8b45a?style=for-the-badge&logo=windows&logoColor=1a1026)](../../releases/latest)
&nbsp;
[![Share feedback](https://img.shields.io/badge/Share%20feedback-ec86c2?style=for-the-badge&logo=github&logoColor=1a1026)](../../issues/new/choose)
&nbsp;
[![sparklesnap.dev](https://img.shields.io/badge/sparklesnap.dev-2a1a3a?style=for-the-badge)](https://sparklesnap.dev/)

<sub>Memory training&nbsp;·&nbsp;Windows&nbsp;·&nbsp;works offline&nbsp;·&nbsp;no account&nbsp;·&nbsp;no telemetry&nbsp;·&nbsp;made by SparkleSnap</sub>

</div>

> [!IMPORTANT]
> **Every combination you see is fictional.** They are generated at random on your own computer, held only in memory and thrown away when you close the app. They are not anyone’s passwords and were never meant to be — this is a learning tool for memory techniques. Don’t type your real passwords into it, and don’t adopt the examples you see as real passwords.

## What it is

**Myuuel Memory Practice is a free memory training app for Windows.** It is a calm, self-running slideshow that trains recall — the skill of holding something in mind and bringing it back — using password-style combinations as the motif. You glance at it while you work; it does the rest. Think of it as a small wellbeing gadget for your mind, in the same family as a breathing timer or a focus clock.

- **Recall practice, hands-free.** A combination appears, fades, waits while you rebuild it in your head, then comes back so you can compare. No typing, no scores, no streaks.
- **Real memory techniques.** Every combination is built with a mnemonic method — sentence initials, hidden words, rhymes, number stories — so you learn the technique, not just the string.
- **Made for a small vertical side screen.** The text is deliberately huge so you can read it from the corner of your eye on a little portrait display. It works on any monitor too.
- **A companion, not a dashboard.** Myuuel keeps you company: cross-legged and relaxed on Gentle and Standard, standing alert on Tough. She breathes, reacts when you poke her, curls up when you pause and, if you leave her long enough, dozes off.

## How a round works

| | Phase | What happens |
|:-:|---|---|
| 👀 | **Look** | The combination and the memory method behind it are shown, very large. |
| 🌫️ | **Fade** | *(Fading Lantern mode)* Letters disappear in two steps. |
| 🧠 | **Recall** | Everything is hidden. Rebuild it in your mind. |
| ✨ | **Check** | It comes back so you can compare. Tap *Again* or *Comfortable* if you like. |
| 🍃 | **Rest** | A breath before the next one. |

Three combinations rotate at a time; each one retires after three rounds and a fresh one takes its place.

## Eight memory methods

Each combination is built with a technique, so you practise the *method* as well as the string.

| Method | Example | The trick |
|---|---|---|
| **Sentence initials** | `O5prgatg!` | *“Our 5 proud rabbits glowed around the garden!”* — keep first letters and numbers |
| **Hidden word** | `P8e=a2r8l` | PEARL, woven with a repeating `8 = 2` |
| **Mirror word** | `wodniW=Kite4` | WINDOW read backwards, then a second word |
| **Number story** | `Moon0050Boat!` | *“The moon boat sails at 00:50!”* |
| **Rhyme chain** | `Key*SeaTea74` | key, sea, tea — then the numbers |
| **Picture words** | `Iris=Dune76` | two images in a row |
| **Look-alike swap** | `H4rb0r-R053` | a→4, o→0, e→3, s→5 · a well-known trick, best combined with others |
| **Random string** | `+rKJ*7c5rhb` | read and recall it in chunks |

Difficulty (*Gentle · Standard · Tough*) changes the length and how many tricks are layered.

**How many are there?** Random strings have more than 500 trillion possibilities even on Gentle, so they practically never repeat. The method-built combinations add up to billions; each method has its own pool at every difficulty, and even the smallest one (Gentle number stories) holds about 2,900. Three are in play at a time, and new ones are invented as old ones retire.

## Two themes

<img src="docs/media/themes.png" alt="Illustration of the two themes: Lantern Night, a plum night sky with warm gold light, and Living Type, a dark navy grid with a pink ASCII wire sphere" width="100%">

<sub>Illustration made from the app’s character art.</sub>

## Get started

**Download** the portable app from [**Releases**](../../releases/latest) and run it — nothing to install.

<details>
<summary><b>Run from source</b></summary>

Requires [Node.js](https://nodejs.org/) 20 or newer on Windows.

```bash
npm install
npm start
```

Or double-click `Start-Myuuel-Memory-Practice.cmd`. Build a portable `.exe` with `npm run dist:win`.
</details>

**Little things to try:** <kbd>Space</kbd> pauses · <kbd>M</kbd> switches mode · poke Myuuel · tap the sky · press and hold the card during *Recall* to peek. Got a small second screen? Choose **▣ → Side screen** once and she’ll open there every time.

## Coming next

- **Type to check** — an optional moment after Recall where you type what you remember and see whether it matched (still fictional, never stored).
- More memory methods and story worlds.

Right now it is a hands-free mind-practice slideshow, and that is on purpose: practice you can do without stopping what you are doing.

## Privacy

The app makes no network requests, has no account and collects nothing. Only your settings (theme, speed, difficulty…) are stored on your computer — never a combination. The one outside link is the SparkleSnap signature in Settings, which opens [sparklesnap.dev](https://sparklesnap.dev/) in your browser.

## Feedback

Ideas, bugs, a memory method you love? [**Open an issue**](../../issues/new/choose) — every note is read. If Myuuel helped you, a ⭐ helps others find her.

## Legal

**Copyright © 2026 SparkleSnap. All rights reserved.**
This repository is published so you can read, try and give feedback on the app. No licence to copy, modify or redistribute the code, art or text is granted beyond what GitHub’s Terms of Service allow (viewing and forking on GitHub). For any other use, contact SparkleSnap via [sparklesnap.dev](https://sparklesnap.dev/).

- **Character and brand.** Myuuel, her artwork and animation, the SparkleSnap name and logos are SparkleSnap’s and may not be used without permission.
- **Concept.** General ideas — practising recall, using sentences or images to remember — belong to everyone. What is protected here is this particular expression of them: the code, artwork, design and writing.
- **Educational use only.** The app teaches memory techniques. It is not a password manager, does not check or store passwords, and gives no guarantee about the security of any password you create. For real accounts, use a password manager and unique, randomly generated passwords. Any resemblance between a generated combination and a real password is coincidence.
- **No warranty.** Provided “as is”, without warranty of any kind; to the extent permitted by law, SparkleSnap is not liable for any loss arising from its use.
- **Third-party software.** Built with [Electron](https://www.electronjs.org/) (MIT licence, © OpenJS Foundation and Electron contributors).

<div align="center"><sub>Made with care by <a href="https://sparklesnap.dev/">SparkleSnap</a>.</sub></div>
