# User Acceptance Testing Checklist

Run against a real staging deployment (see [DEPLOYMENT.md](./DEPLOYMENT.md)),
not local dev — UAT should exercise the same build artifact, the same
database engine, and the same (or sandbox-equivalent) SMS/antivirus
providers a production release would use. Each item below is the
human-walkthrough version of that phase's own automated exit-proof test
(see [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md)) — the automated
tests already prove the mechanism works; UAT proves it *feels* right to an
actual user and nothing was lost in translation from spec to screen.

For each row: pass/fail, and a note if it fails.

## Phase 1 — Auth, channels, files

- [ ] Partner can request an OTP by real mobile number and log in.
- [ ] Internal staff can log in with email/password, then TOTP MFA.
- [ ] A channel owner can upload a file to their own channel.
- [ ] A channel owner is denied access to a channel they don't belong to
      (try navigating directly to another channel's URL).
- [ ] Uploading a non-image/non-PDF file where the form doesn't allow it is
      rejected with a clear Persian error, not a silent failure.

## Phase 2 — Onboarding and evaluation

- [ ] A new partner completes the full 28-question onboarding wizard on a
      mobile-sized viewport.
- [ ] Reloading mid-wizard resumes exactly where it left off (autosave).
- [ ] An evaluator can request a correction on a specific field; the
      partner sees exactly which fields need fixing and can resubmit only
      those.
- [ ] The correction round-trip produces a diffable second revision (admin
      can see what changed, not just the new value).

## Phase 3 — Support requests and pricing

- [ ] A partner requests a first-position pin promotion and sees the
      correct calculated price (240 rial/view nationwide, 480 rial/view
      provincial) before confirming.
- [ ] A partner requests a variable multi-channel promotion and can
      negotiate a quote through at least one revision.
- [ ] An operator can see the request in the Kanban/queue view and move it
      through its states.

## Phase 4 — Tasks, calendar, Gantt, scheduling

- [ ] Creating a task and viewing it on both the calendar and Gantt shows
      the exact same date — they read the same backing data.
- [ ] Dragging a Gantt bar to a valid new date persists the change.
- [ ] Dragging a Gantt bar to a date that violates a dependency is
      rejected, and the bar visibly snaps back.
- [ ] A partner sees their promotion's schedule update after an operator
      reschedules it.

## Phase 5 — Ledger, barter, settlement

- [ ] A completed support request posts a real, balanced ledger
      transaction (spot-check in `/ledger`).
- [ ] An obligation can be proposed, accepted, delivered against, and
      partially settled.
- [ ] A partner-facing statement of their channel's balance reconciles
      against the ledger — no discrepancy.
- [ ] There is no editable "balance" field anywhere in the UI (balances are
      always computed, never directly set).

## Phase 6 — Tickets, notifications, surveys, reports

- [ ] A partner opens a ticket and gets a reply; an internal note added by
      staff never appears anywhere on the partner side (check the ticket
      detail page and any export/notification).
- [ ] An in-app notification appears in the partner's inbox for a real
      business event (e.g. a new quote version).
- [ ] A partner can complete a published survey; the admin survey
      analytics page shows the real response counts immediately after.
- [ ] An admin can run a report against a real dataset and export it
      (CSV/JSON download works).

## Phase 7 — PWA, accessibility, security, performance

- [ ] The partner site is installable (browser shows an install
      prompt/banner; installed app opens in standalone mode, no browser
      chrome).
- [ ] Turning off network mid-session and navigating shows the offline
      page, not a browser error.
- [ ] Deploying a new build and reloading the installed PWA shows the
      "update available" prompt.
- [ ] Keyboard-only navigation: tab through a form page (e.g. onboarding)
      without a mouse — every field, its label, and the submit button are
      all reachable and clearly focused.
- [ ] Screen reader spot check (e.g. VoiceOver/NVDA) on the onboarding page
      and the login page: field labels are announced, not just visible.
- [ ] A sensitive financial action (e.g. settlement approval) requires a
      fresh step-up code even in an already-logged-in session.
- [ ] Uploading a file that the antivirus provider flags is quarantined —
      visible in the admin file view but not downloadable by the partner.

## Sign-off

Record: date run, staging build/commit, who ran it, and any failed items
with a linked follow-up issue. A release should not proceed past
[RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md) with unresolved UAT
failures on Phases 1–6 (core product) — Phase 7 items (PWA/accessibility)
should be triaged but don't necessarily block if the underlying feature
still works without them.
