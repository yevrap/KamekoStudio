# Kameko Studio

## What This Is

Kameko Studio is a one-person game studio building web-based games as progressive web apps. The games are mobile-first but designed to be good and fun on any screen — phone, tablet, or desktop. Everything is hosted on GitHub Pages with no backend, which means zero infrastructure to maintain and free hosting forever.

This isn't a startup. There's no funding round, no growth targets, no team to manage. It's a personal creative project with the structure and intentionality of a studio — meaning the work is organized, version controlled, documented, and treated seriously, even though the pace is measured in hours per week, not hours per day.

## Why a "Studio"

Framing this as a studio rather than a hobby serves a practical purpose: it creates accountability and structure. When you call something a studio, you write things down. You keep a backlog. You version control your decisions, not just your code. You think about the user, not just the feature.

The studio framing also leaves room for growth. If a project takes off or a collaborator shows up, the foundation is already there — documented designs, clean repos, clear decisions. And if it stays a solo effort forever, the documentation is still valuable because future-me is a different person than present-me, and he'll need the context.

## Why Web / PWA

The original plan was native Apple apps (SwiftUI for Mac, iPhone, and Watch). The pivot to HTML5 progressive web apps came down to a few things:

- **Reach.** A PWA runs on any device with a browser. Friends with Android phones can play too. No App Store gatekeeping.
- **Simplicity.** HTML, CSS, and JavaScript with no backend is about as simple as a tech stack gets. No Xcode project management, no provisioning profiles, no separate builds per platform.
- **Free hosting.** GitHub Pages is free, deploys from git push, and just works.
- **Offline-capable.** Service workers make PWAs work offline, so the "native app" feel is still there — home screen icon, no browser chrome, works without signal.
- **One codebase.** Responsive design handles phone vs. tablet vs. desktop instead of maintaining three platform-specific UI layers.

The trade-off is giving up some native niceties (system haptics, Watch complications, deep OS integration), but for the kinds of games Kameko is making, the web platform covers what's needed.

## Constraints and Realities

**Time:** Roughly one hour per day, sometimes less. This means every session needs to count. Small, well-scoped tasks. Clear next steps written down before closing the laptop. No time wasted figuring out "where was I?"

**Scope:** Web-based PWAs, mobile-first. HTML5, CSS, vanilla JavaScript to start — no framework unless complexity demands it. No backend, no database, no server. All data lives in the browser.

**Solo:** One person doing design, development, testing, and release. This means keeping complexity low, favoring simple architectures, and being honest about what's achievable.

## Principles

**Document everything.** Not because someone else is reading it (though they might), but because decisions without context become mysteries in three months. Every design choice, every "why not the other way," every pivot gets written down.

**Version control the thinking, not just the code.** Design docs, outlines, and decision logs live in the repo alongside the source. If it shaped the product, it belongs in the history.

**Ship small.** A working feature that's responsive across screen sizes beats a half-built feature for one device. Keep the surface area tight and expand from a stable base.

**Respect the player's time.** The games Kameko makes should be the kind you can pick up for five minutes and put down without guilt. No dark patterns, no artificial urgency, no attention hijacking.

**Make the input interesting.** The first game explores T9 input as a mechanic. This reflects a broader interest in making the *how* of interaction part of the experience, not just the *what*. The interface is the game.

**No backend.** If it can't run as static files on GitHub Pages, it's out of scope. This constraint forces simplicity and keeps the infrastructure at zero.

## Current Project

The first Kameko game is a memory/flashcard game built around T9 phone input. The player studies key-value pairs (like vocab, trivia, or anything they define) and answers using a T9 keypad with two input modes — scroll-select and predictive. The constraint of the input method is intentional: it makes you actually recall and type the answer rather than just picking from a list.

It's built as a PWA with offline support, installable on any device, and hosted on GitHub Pages.

See `game-outline-memory-game-draft.md` for the full design outline.

## Long-Term Vision

There isn't a five-year roadmap. The long-term vision is simple: keep making small, well-crafted web games. Get good at shipping. Build a library of work that I'm proud of and that other people might find useful or fun.

Each game gets its own GitHub Pages site (or lives under a shared Kameko domain). The portfolio grows one game at a time.

---

*This document is a living reference. Update it as the studio's direction evolves.*
