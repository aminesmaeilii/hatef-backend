# Codex Execution Prompt — Build the Real Hatef Channel Support and Service-Barter Platform

> Use this prompt from the root of the repository. This is an implementation command, not a request for a product proposal, design concept, static dashboard, or architecture-only response.

---

# 0. PRIMARY COMMAND: BUILD THE SOFTWARE

You are operating inside a writable software repository. Your job is to build a complete, working, persistent full-stack web application for Hatef.

Do not stop after:

- writing a plan;
- producing documentation;
- drawing a dashboard;
- creating static React pages;
- generating sample cards and charts;
- building a frontend with mock JSON;
- scaffolding empty backend folders;
- describing what should be implemented later.

A static dashboard is a failed result.

The work is complete only when real users can authenticate, submit data, refresh the browser without losing it, access role-specific dashboards, move real records through validated workflows, and see changes persisted in PostgreSQL through a real API.

You must inspect the repository, create an execution plan, and then immediately implement the software. Do not ask for approval between phases. After each phase passes its gate, continue automatically to the next phase.

If the repository is empty, scaffold the full project. If it contains an existing project, understand it first, preserve valid work, repair the architecture when necessary, and integrate the requested product without destroying unrelated user changes.

If an external credential is unavailable, do not stop and do not fake a live integration. Build:

1. a clean provider interface;
2. a development provider;
3. production environment-variable support;
4. setup documentation;
5. a clear feature flag.

Then continue building the rest of the product.

If the run must end because of a hard environment or context limit, leave the repository in a compiling, tested checkpoint and update IMPLEMENTATION_STATUS.md with:

- what is fully working;
- what remains;
- exact commands already run;
- failing checks, if any;
- the exact next implementation action.

On the next run, read that file and continue. Never restart from scratch.

---

# 1. THE FAILURE MODE YOU MUST AVOID

The previous attempt returned only a static dashboard page. This must not happen again.

The following are mandatory proof that the result is a real application:

- PostgreSQL migrations exist and run successfully.
- The application reads and writes real records through backend APIs.
- Authentication and authorization are enforced on the server.
- Partner and admin dashboards show different data and permissions.
- Form submission survives reload, logout, and login.
- Dashboard counters come from database queries, not constants.
- Workflow status changes are validated on the backend.
- Monetary calculations happen on the backend.
- Files use a real storage abstraction and persistent metadata.
- Notifications use a provider abstraction and persistent delivery records.
- Every important action creates an audit event.
- End-to-end tests exercise real UI, API, and database behavior.
- Seed data is development-only and cannot run accidentally in production.

Do not use localStorage, component state, static JSON, or hard-coded arrays as the source of truth for business data.

Local browser storage may only be used for safe preferences or a carefully designed temporary offline draft. It must never be the authoritative store for users, channels, requests, prices, obligations, balances, tickets, or workflow state.

---

# 2. PRODUCT BOUNDARY

Build a new platform for channel registration, promotional support, reciprocal services, and value settlement between Hatef/Eitaa and Eitaa channel operators.

This is not the old general campaign-management product.

However, the older Hatef product concept revealed several requirements that are still relevant and must be incorporated into this new product:

- strong internal work and assignee management;
- an operations calendar in Solar Hijri;
- a Gantt view connected to the same tasks and dates;
- professional analytics for every configurable tool;
- survey capability built on the shared form infrastructure;
- workspace selection for users who have more than one role;
- notification and reminder infrastructure;
- extensibility for future campaign-management modules.

Do not rebuild the entire old cultural-campaign platform in this release. Create clean extension points for it, but keep the current product centered on:

1. channel onboarding and assessment;
2. promotional support requests;
3. support pricing and execution;
4. reciprocal service obligations;
5. credit-value accounting and settlement;
6. tickets, tasks, calendar, Gantt, reporting, and administration.

---

# 3. BUSINESS CONTEXT

Hatef is a cultural organization connected to the Eitaa messenger ecosystem.

Eligible Eitaa channel operators may request promotional support from Hatef/Eitaa. Hatef can provide promotional services such as:

- first-position pinned advertising;
- nationwide promotion;
- provincial promotion;
- distribution through selected Eitaa channels;
- future configurable promotion types.

Promotion has a monetary value. Hatef is not necessarily collecting cash from the channel. Instead, Hatef may request services of equivalent value from the channel.

Examples of reciprocal services include:

- publishing campaign content;
- producing visual or written content;
- reposting selected messages;
- covering an event;
- participating in cultural distribution;
- social and cultural networking;
- field operations;
- research;
- audience surveys;
- other configurable services.

The platform uses rial as a common unit of value so both sides can understand:

- the value of promotional support provided by Hatef;
- the value of services promised by the channel;
- the value of services delivered and accepted;
- the remaining unsettled obligation.

This is service barter measured in money. It is not a simple wallet.

---

# 4. SUCCESSFUL END-TO-END STORY

The final application must support this complete story:

1. A channel owner opens the partner web application.
2. The owner enters a mobile number.
3. A development OTP provider works locally; a production SMS provider can be configured.
4. The owner verifies the OTP and creates a secure session.
5. The owner completes a beautiful multi-step RTL onboarding flow.
6. The onboarding contains the 28 required questions.
7. Draft answers autosave to PostgreSQL.
8. Uploaded files are stored through the storage service and linked to the submission.
9. The owner reviews and submits the application.
10. An internal evaluator sees the real submission in the administration workspace.
11. The evaluator requests corrections for selected fields.
12. The owner updates only those fields and resubmits.
13. The evaluator sees a field-level revision diff.
14. The channel is approved.
15. The partner submits a nationwide or provincial pinned-promotion request.
16. The backend calculates the correct rial value.
17. Internal staff validates, approves, assigns, and schedules the promotion.
18. The promotion appears in the Jalali calendar and connected Gantt view.
19. The partner sees the public progress state.
20. Internal staff records execution evidence and final realized value.
21. The ledger posts the support value and corresponding reciprocal-service debt.
22. Hatef proposes one or more services the channel must provide.
23. The partner accepts or negotiates the obligation.
24. Internal tasks are assigned to responsible Hatef staff.
25. The partner submits deliverables.
26. Hatef approves them fully or partially.
27. Accepted service value is allocated against outstanding debt.
28. Both parties can see an understandable settlement statement.
29. The partner can open a ticket linked to any request or obligation.
30. Admin dashboards, reports, notifications, timeline, and audit history update from real data.

Build and test this story. Do not claim completion without it.

---

# 5. REQUIRED REPOSITORY ARCHITECTURE

Use a modular monolith in a monorepo. It is simpler and safer for the initial product than premature microservices, while preserving module boundaries for future extraction.

Unless the existing repository has a sound compatible architecture, use:

    apps/
      admin-web/          Hatef administration workspace
      partner-web/        Channel partner workspace and installable PWA
      api/                Main backend API
      worker/             Queues, notifications, reports, file processing
    packages/
      ui/                 Shared RTL design system
      domain/             Domain types, rules, state machines
      contracts/          API DTOs and shared schemas
      database/           Prisma schema, migrations, seeds
      auth/               Authentication and authorization utilities
      config/             Validated configuration
      observability/      Logs, metrics, tracing helpers
      localization/       Persian copy, number and date handling
      testing/            Fixtures and test utilities
    docs/
    infra/
    AGENTS.md
    IMPLEMENTATION_PLAN.md
    IMPLEMENTATION_STATUS.md
    docker-compose.yml
    .env.example

Preferred stack when no better existing stack is present:

- TypeScript across frontend and backend;
- pnpm workspaces;
- Turborepo;
- React and Next.js for both web applications;
- NestJS for the API;
- PostgreSQL;
- Prisma;
- Redis;
- BullMQ;
- S3-compatible object storage;
- MinIO for local development;
- Zod or an equivalent shared validation layer;
- Playwright for E2E;
- Vitest or Jest for unit and integration tests;
- Docker Compose for local infrastructure.

Pin an exact LTS Node major and minor policy. Do not use an open engine requirement that silently changes to a new major release.

If adapting an existing repository, document why an equivalent technology is retained.

---

# 6. LOCAL DEVELOPMENT MUST BE EASY

At the end, a developer must be able to run the project with documented commands similar to:

    pnpm install
    docker compose up -d
    pnpm db:migrate
    pnpm db:seed
    pnpm dev

Provide:

- a complete .env.example;
- environment validation at startup;
- development-only SMS provider;
- development-only object storage;
- development seed;
- health and readiness endpoints;
- clear ports and URLs;
- one command for lint;
- one command for type check;
- one command for unit/integration tests;
- one command for E2E;
- one command for production build.

The development seed may create a test admin only when NODE_ENV is not production. The application must refuse to start in production if known development credentials are configured.

---

# 7. TWO CONNECTED WORKSPACES

## 7.1 Administration Workspace

For Hatef managers, evaluators, operations staff, finance staff, support agents, form managers, and auditors.

It must include:

- operational home dashboard;
- channel directory;
- 360-degree channel profiles;
- assessment queue;
- support-request queue;
- promotion execution workspace;
- reciprocal-service obligation workspace;
- internal task management;
- Jalali calendar;
- Gantt view;
- tickets;
- form builder;
- survey builder;
- report builder;
- notification center;
- pricing and valuation settings;
- ledger and settlement;
- roles and permissions;
- audit logs;
- system settings.

## 7.2 Channel Partner Workspace

For channel owners and their team members.

It must include:

- secure login and registration;
- guided onboarding;
- channel profile;
- application status;
- support requests;
- promotion details and progress;
- obligations requested by Hatef;
- deliverable submission;
- credit and settlement statement;
- rate card;
- calendar;
- tasks relevant to the channel;
- tickets;
- notifications;
- files;
- team and access;
- security settings.

## 7.3 Workspace Selector

After login, when a user has access to multiple contexts, show a simple workspace selector:

- Hatef Administration;
- Channel Partner;
- a specific channel if the user belongs to multiple channels.

If the user has only one context, skip the selector.

The selected workspace must never bypass server authorization.

---

# 8. AUTHENTICATION, PROFILES, AND ACCESS

## 8.1 Partner OTP

Implement:

- Iranian phone normalization;
- Persian and Latin digit normalization;
- OTP issuance;
- OTP hashing;
- short expiry;
- one-time use;
- resend cooldown;
- attempt limit;
- IP and phone rate limits;
- enumeration-safe responses;
- secure session cookie;
- session rotation;
- logout;
- logout from all devices;
- session list;
- security audit.

Build an SmsProvider interface with:

- a local development provider;
- a production provider adapter;
- environment variables;
- template IDs;
- delivery callback support;
- retry;
- delivery log;
- no OTP body in logs.

## 8.2 Internal Authentication

Implement:

- email or username;
- strong password;
- Argon2id or equivalent;
- TOTP MFA for privileged roles;
- recovery codes;
- secure session;
- login audit;
- lockout and rate limits;
- step-up authentication for sensitive financial actions.

## 8.3 Roles

Internal roles:

- SUPER_ADMIN
- SYSTEM_ADMIN
- OPERATIONS_MANAGER
- EVALUATOR
- EVALUATION_SUPERVISOR
- PROMOTION_OPERATOR
- FINANCE_MANAGER
- FINANCE_APPROVER
- SUPPORT_AGENT
- FORM_MANAGER
- REPORT_ANALYST
- AUDITOR
- INTERNAL_STAFF

Partner roles:

- CHANNEL_OWNER
- CHANNEL_ADMIN
- CHANNEL_FINANCE_VIEWER
- CHANNEL_TEAM_MEMBER

Use RBAC plus resource-level ABAC.

One user may:

- have several roles;
- belong to several channels;
- use different roles in different channels.

Every API endpoint must enforce permissions.

---

# 9. PARTNER ONBOARDING

Build a full-screen, mobile-first, RTL wizard.

It must have:

- clear Persian introduction;
- section title;
- current step;
- percentage complete;
- autosave to the backend;
- back and next;
- save and exit;
- resume on another device;
- conditional questions;
- inline validation;
- file upload with progress;
- final review;
- submit confirmation;
- immutable submitted revision;
- correction requests;
- field-level resubmission;
- revision diff;
- public assessment timeline.

Use these sections:

1. Personal information
2. Channel information
3. Media quality
4. Growth experience
5. Organizational and cooperation capacity
6. Review and declarations

## 9.1 Persian Introductory Text

Title:

همکاری با مجموعه رسانه‌ای «هاتف»

Description:

به سامانه ارزیابی و حمایت مجموعه رسانه‌ای «هاتف» خوش آمدید.

هدف ما شناسایی، شبکه‌سازی و حمایت تبلیغاتی و انتشاری از کنشگران، دغدغه‌مندان و مجموعه‌های فرهنگی، اجتماعی و رسانه‌ای است. اگر ظرفیت محتوایی، هنری یا میدانی دارید، «هاتف» با بستر انتشار میلیونی خود، صدای شما خواهد بود.

به امید همکاری مشترک.

## 9.2 Required 28 Questions

Create these in the initial published form through the real form engine:

1. Full name.
2. Mobile number for contact.
3. Mobile number connected to the messenger.
4. Role in the channel or organization.
5. Exact Eitaa channel ID and channel profile image.
6. Eitaa ID of the channel administrator.
7. Key team members.
8. Number of channel members.
9. Media establishment date.
10. Percentage of post views relative to members:
    - below 5%;
    - 5% to 10%;
    - 10% to 15%;
    - 15% to 20%;
    - 20% to 25%;
    - above 25%.
11. Is the current administrator qualified to advance the channel goals?
12. What action will be taken to secure a suitable administrator?
13. Specialist domain:
    - health;
    - education and upbringing;
    - entertainment;
    - humor;
    - skills;
    - tools;
    - religious;
    - books and poetry;
    - science;
    - news;
    - sports;
    - other.
14. Years of research or activist experience.
15. Manager résumé upload.
16. Significant media output.
17. Main channel format:
    - multimedia and visual production;
    - interactive, blogger, or person-led;
    - emotional, motivational, or faith-based;
    - news, information, or explanatory;
    - scientific, analytical, or research.
18. Previous premium pinned-promotion experience and acquisition result.
19. Target landing post and analysis of success or failure.
20. Proposed promotional-support scenario or idea.
21. Revenue and funding model:
    - product or service sales;
    - public support;
    - organizational or institutional budget;
    - in-channel advertising;
    - personal expense;
    - no income;
    - other.
22. Organizational structure and human resources.
23. Expected cooperation with Hatef and capacity offered.
24. City and province of operation.
25. Physical and field capacity:
    - physical base;
    - booth, station, or mokeb;
    - field workforce;
    - content-production equipment;
    - other.
26. Social and cultural networking capacity.
27. History of temporary operational shutdown, reason, duration, and corrective action.
28. Guarantee of continued content activity after support.

Add separately versioned confirmations for:

- accuracy of supplied information;
- current terms and privacy policy.

## 9.3 Field Behavior

Use real field types:

- phone;
- text;
- long text;
- number;
- Jalali date;
- single select;
- multi-select;
- repeatable group;
- image;
- document;
- link;
- consent.

Question 12 becomes required when question 11 is “Partly” or “No.”

Question 19 is conditional on previous promotion experience.

Shutdown details are conditional on a Yes answer in question 27.

---

# 10. ADVANCED FORM AND SURVEY ENGINE

Do not hard-code the 28 questions directly into one React page.

Build a real configurable form engine and use it to create the initial onboarding form.

Admin capabilities:

- create form;
- create survey;
- pages and sections;
- drag-and-drop ordering;
- field types;
- options;
- required rules;
- validation;
- conditional logic;
- preview on desktop and mobile;
- draft;
- publish;
- schedule;
- duplicate;
- archive;
- version history;
- submission dashboard;
- field-level analytics;
- completion funnel;
- drop-off by page;
- response distribution;
- filtered export;
- permission-aware access.

Published versions are immutable.

Historical submissions remain linked to their original form version.

Survey results must have a professional analytics dashboard with:

- response count;
- completion rate;
- question breakdown;
- filters;
- segmentation;
- comparison;
- export;
- date range;
- channel and province filters when applicable.

The survey module can be a later phase, but its infrastructure must reuse the same form engine rather than creating a second incompatible system.

---

# 11. CHANNEL ASSESSMENT

Implement a real evaluation case workflow:

    DRAFT
    SUBMITTED
    IDENTITY_CHECK
    UNDER_REVIEW
    NEEDS_CHANGES
    RESUBMITTED
    APPROVED
    CONDITIONALLY_APPROVED
    WAITLISTED
    REJECTED

Features:

- queue;
- evaluator assignment;
- supervisor assignment;
- SLA;
- checklist;
- configurable rubric;
- score;
- confidence;
- internal notes;
- partner-visible response;
- request correction for selected fields;
- revision diff;
- second review;
- conflict-of-interest declaration;
- final decision;
- decision reason;
- timeline.

The partner must see only simplified public statuses and partner-visible reasons.

---

# 12. ADMIN HOME AND CHANNEL PROFILES

## 12.1 Operational Dashboard

Every metric must come from API queries.

Show:

- channels by onboarding and assessment status;
- support requests by status;
- promotions scheduled, active, and verifying;
- estimated, approved, realized, unsettled, and settled value;
- obligations due, overdue, submitted, and disputed;
- tickets approaching SLA;
- staff tasks due or overdue;
- today and this week;
- calendar conflicts;
- recent activity;
- next required actions.

Every card must open the relevant filtered list.

## 12.2 Channel Directory

Implement:

- search;
- filter;
- sort;
- cursor pagination;
- saved views;
- configurable columns;
- safe bulk actions;
- export permission;
- server-side queries.

## 12.3 360-Degree Channel Profile

Include:

- overview;
- contact and identity;
- approved profile;
- form submissions;
- evaluation;
- team;
- support requests;
- promotion orders;
- obligations;
- deliverables;
- rate cards;
- ledger;
- settlements;
- tasks;
- tickets;
- files;
- calendar;
- public communication;
- internal notes;
- unified timeline;
- audit history.

Internal notes must never leak to the partner.

---

# 13. PROMOTION REQUESTS

## 13.1 First-Position Pin

Partner fields:

- advertisement title;
- advertisement text;
- Eitaa target-post link;
- image;
- audience type;
- province selection when provincial;
- requested unique views;
- preferred Jalali date;
- execution time window;
- notes.

Audience types and initial prices:

- nationwide: 240 rial per unique view;
- provincial: 480 rial per unique view.

Backend formula:

    estimated_cost_rial =
      requested_unique_views
      multiplied by
      snapshotted_rate_per_unique_view_rial

Requirements:

- store rial as integer BIGINT;
- no float;
- authoritative backend calculation;
- effective-date price version;
- price snapshot per request;
- line-item breakdown;
- estimated amount;
- approved amount;
- reserved amount;
- realized amount;
- optional discount and multiplier;
- controlled override;
- reason;
- second approval above threshold;
- history.

Changing the configured rate must not change an old request.

## 13.2 Promotion Across Eitaa Channels

The number of channels, final views, and final cost may be unknown initially.

Implement a quote workflow:

1. Partner submits objective, topic, audience, geography, timing, assets, restrictions, and optional budget.
2. Operations validates the request.
3. Staff creates one or more quote options.
4. A quote includes estimated channel range, view range, method, schedule, amount, assumptions, expiry, and version.
5. Partner accepts, rejects, or requests negotiation.
6. Internal approval occurs when required.
7. Accepted quote becomes immutable commercial scope.
8. Promotion becomes schedulable.
9. Actual channels, views, evidence, and value are recorded.

Unknown is null with an explicit state, never zero.

## 13.3 Request States

    DRAFT
    SUBMITTED
    VALIDATION
    NEEDS_PARTNER_CHANGES
    PRICING_OR_QUOTE
    INTERNAL_APPROVAL
    PARTNER_CONFIRMATION
    SCHEDULED
    RUNNING
    RESULT_VERIFICATION
    ADJUSTMENT_REQUIRED
    COMPLETED
    CANCEL_REQUESTED
    CANCELLED
    DISPUTED

Every transition must be implemented on the backend.

---

# 14. OPERATIONS, TASKS, CALENDAR, AND GANTT

The old product concept correctly identified that promotion support requires work management, not only request tracking.

Build an internal operations module.

## 14.1 Internal Tasks

A task may link to:

- channel;
- assessment;
- support request;
- promotion order;
- quote;
- obligation;
- deliverable;
- ticket;
- general operations.

Task fields:

- title;
- description;
- assignee;
- watcher;
- status;
- priority;
- start date;
- due date;
- estimate;
- dependency;
- checklist;
- comments;
- files;
- reminder;
- activity history.

Task states:

- BACKLOG
- READY
- IN_PROGRESS
- BLOCKED
- REVIEW
- DONE
- CANCELLED

Views:

- My Work;
- team list;
- Kanban;
- calendar;
- Gantt;
- overdue;
- workload by assignee.

## 14.2 Jalali Calendar

The calendar must support:

- month;
- week;
- day;
- agenda;
- timeline;
- Solar Hijri display;
- Asia/Tehran display timezone;
- UTC persistence;
- notes on dates;
- promotion events;
- tasks;
- obligation deadlines;
- deliverable deadlines;
- reminders;
- filters;
- drag-and-drop;
- conflict detection;
- permission validation;
- change history.

## 14.3 Connected Gantt

The Gantt view must use the same persisted tasks and dates as the calendar.

It must support:

- task bars;
- start and due date;
- milestones;
- dependencies;
- progress;
- assignee;
- critical path indication where practical;
- zoom by day, week, and month;
- drag-to-reschedule with backend validation;
- filter by channel, request, operator, and status;
- opening the linked record;
- mobile read-only or simplified timeline.

Do not create a fake Gantt with static bars.

---

# 15. PROMOTION SCHEDULING AND EXECUTION

Implement:

- promotion order creation from approval;
- operator assignment;
- capacity resource;
- Jalali schedule;
- conflict detection;
- reschedule;
- partner notification;
- execution checklist;
- proof upload;
- actual unique views;
- actual channels for variable promotion;
- result verification;
- underdelivery;
- adjustment;
- cancellation;
- final realized value.

The admin Kanban and calendar must call validated transition APIs.

When a card is dragged:

1. preview the transition;
2. validate permission;
3. request missing fields;
4. show side effects;
5. execute idempotently;
6. update audit and timeline;
7. update partner public status;
8. revert the visual card if the backend rejects it.

---

# 16. VALUE, BARTER, AND IMMUTABLE LEDGER

Do not implement one editable credit balance.

Build a real immutable ledger.

## 16.1 Ledger Principles

- every transaction has balanced entries;
- posted entries are immutable;
- corrections use reversal;
- every transaction links to a business source;
- all amounts are integer rial;
- retries cannot duplicate a transaction;
- manual adjustment requires permission and reason;
- high-value adjustment requires second approval;
- balances can be reconciled from entries.

Track:

- estimated support;
- approved support;
- reserved support;
- realized support;
- reciprocal-service debt;
- submitted service value;
- accepted service value;
- settled value;
- adjustment;
- reversal;
- cancellation;
- dispute hold.

## 16.2 Reciprocal Service Catalog

Admin can configure services:

- publication;
- repost;
- content production;
- event coverage;
- campaign participation;
- field operation;
- networking;
- research;
- survey;
- other.

Each catalog item has:

- unit;
- valuation method;
- default acceptance criteria;
- default evidence;
- active version;
- optional price guidance.

## 16.3 Obligation Workflow

    PROPOSED
    NEGOTIATING
    ACCEPTED
    SCHEDULED
    IN_PROGRESS
    SUBMITTED
    NEEDS_REVISION
    PARTIALLY_APPROVED
    APPROVED
    DISPUTED
    SETTLED
    CANCELLED

An obligation includes:

- service type;
- brief;
- output;
- acceptance criteria;
- rial value;
- start;
- deadline;
- responsible channel member;
- responsible Hatef employee;
- files;
- terms;
- negotiation history;
- settlement target.

## 16.4 Deliverables

Partner can submit:

- links;
- images;
- files;
- date;
- reach or views;
- description;
- evidence.

Reviewer can:

- accept fully;
- accept partially;
- request revision;
- reject;
- dispute.

Partial acceptance requires an accepted rial value and remaining amount.

## 16.5 Settlement

Support:

- several obligations against one support;
- several deliverables against one obligation;
- partial delivery;
- explicit allocation;
- overdelivery policy;
- extension;
- cancellation;
- underdelivery adjustment;
- dispute;
- reversal;
- manual settlement with dual approval.

Both dashboards must display an understandable statement rather than raw accounting jargon.

---

# 17. CHANNEL RATE CARDS

Partner can create a versioned rate card.

Rate-card item:

- service type;
- title;
- description;
- price unit;
- rial amount;
- minimum order;
- lead time;
- monthly capacity;
- terms;
- sample work;
- effective date;
- expiry;
- status.

The declared rate is not automatically approved.

Admin can:

- review;
- comment;
- approve;
- negotiate;
- archive.

An agreed obligation stores a separate immutable price snapshot.

---

# 18. TICKETS AND COMMUNICATION

Implement a real ticketing module.

Ticket fields:

- channel;
- category;
- priority;
- SLA;
- status;
- assignee;
- watchers;
- linked business record;
- partner-visible messages;
- internal notes;
- attachments;
- activity history.

States:

- NEW
- OPEN
- WAITING_FOR_HATEF
- WAITING_FOR_PARTNER
- RESOLVED
- CLOSED
- REOPENED

Internal notes must never appear in partner APIs, exports, notification text, or frontend payloads.

Track:

- first response;
- resolution time;
- SLA breach;
- reopen count.

---

# 19. NOTIFICATIONS AND REMINDERS

Implement:

- in-app inbox;
- SMS adapter;
- future push and email adapters;
- template versions;
- user preferences;
- quiet hours;
- mandatory security events;
- deep links;
- delivery state;
- retries;
- deduplication;
- failed-delivery queue.

Notify for:

- OTP;
- submission;
- correction request;
- assessment decision;
- new quote;
- quote expiry;
- approval;
- schedule;
- reschedule;
- promotion completion;
- new obligation;
- approaching deadline;
- deliverable review;
- ticket response;
- settlement;
- security event.

The partner PWA must support web-push infrastructure when the environment and browser permit it. If credentials are unavailable, implement the provider boundary and local in-app behavior.

---

# 20. REPORTS AND ANALYTICS

Every operational tool must have a useful analytics view.

Build approved semantic datasets, not unrestricted direct SQL.

Report builder:

- dataset;
- dimensions;
- metrics;
- filters;
- Jalali date range;
- grouping;
- pivot;
- sort;
- comparison;
- table;
- relevant charts;
- drill-down;
- save;
- share by permission;
- asynchronous execution;
- CSV;
- XLSX;
- PDF;
- export audit;
- PII masking;
- official snapshot.

Initial reports:

- onboarding funnel;
- form drop-off;
- channel domains and provinces;
- assessment aging;
- support-request funnel;
- promotion estimate versus actual;
- promotion value;
- obligations due and overdue;
- service-debt aging;
- submitted versus accepted value;
- settlement by channel;
- task workload;
- Gantt delay;
- ticket SLA;
- survey result analytics;
- staff throughput.

Dashboard charts must be driven by real report queries.

---

# 21. VALUATION ENGINES

Build two versioned engines.

## 21.1 Promotion Pricing

Support:

- effective date;
- base rate;
- quantity;
- audience;
- province;
- discount;
- multiplier;
- minimum;
- cap;
- override;
- explanation;
- reproducible input snapshot.

## 21.2 Channel and Service Valuation

Potential inputs:

- members;
- view ratio;
- verified data;
- continuity;
- domain relevance;
- content quality;
- originality;
- team capacity;
- field capacity;
- geography;
- previous promotion performance;
- networking;
- on-time completion;
- disputes;
- rate card;
- confidence.

Requirements:

- weights;
- score bands;
- effective versions;
- explanation;
- confidence;
- missing-data behavior;
- override reason;
- supervisor approval;
- historical reproducibility.

Do not make high-impact rejection or financial decisions fully automatic.

---

# 22. DATA MODEL

Create a complete relational schema with migrations, constraints, and indexes.

At minimum include:

Identity:

- users
- user_contacts
- auth_sessions
- otp_challenges
- admin_credentials
- mfa_methods
- roles
- permissions
- role_assignments

Channels:

- channels
- channel_identifiers
- channel_profiles
- channel_profile_revisions
- channel_memberships
- channel_metrics_snapshots
- channel_rate_cards
- channel_rate_card_versions
- channel_rate_card_items

Forms:

- forms
- form_versions
- form_sections
- form_pages
- form_fields
- form_options
- form_rules
- form_submissions
- form_submission_revisions
- form_answers
- consent_documents
- consent_acceptances

Evaluation:

- evaluation_cases
- evaluation_assignments
- evaluation_rubrics
- evaluation_scores
- evaluation_decisions
- information_requests

Promotion:

- promotion_types
- promotion_type_versions
- support_requests
- support_request_revisions
- price_rule_sets
- price_rules
- price_calculations
- promotion_quotes
- promotion_quote_versions
- promotion_orders
- promotion_assets
- promotion_schedules
- promotion_execution_results
- promotion_result_evidence

Operations:

- tasks
- task_dependencies
- task_checklists
- task_comments
- calendar_events
- date_notes
- capacity_resources

Barter:

- service_catalog_items
- service_catalog_versions
- service_obligations
- obligation_proposals
- obligation_assignments
- deliverables
- deliverable_reviews
- disputes

Ledger:

- ledger_accounts
- ledger_transactions
- ledger_entries
- reservations
- settlements
- settlement_allocations
- financial_approval_requests

Communication:

- tickets
- ticket_messages
- ticket_links
- notifications
- notification_preferences
- notification_deliveries
- sms_delivery_logs

Platform:

- files
- file_access_events
- workflow_definitions
- workflow_versions
- workflow_instances
- workflow_transition_events
- saved_views
- report_definitions
- report_runs
- report_snapshots
- audit_logs
- outbox_events
- idempotency_keys
- feature_flags

Data rules:

- use foreign keys;
- use meaningful unique constraints;
- normalize Eitaa IDs;
- support safe duplicate merge;
- use BIGINT for rial;
- use UTC timestamps;
- use optimistic locking;
- use transactions;
- use an outbox;
- no hard delete of ledger, audit, consent, or posted workflow history;
- encrypt or tokenize sensitive data where appropriate;
- index actual list and report queries;
- document retention and archival.

---

# 23. UI AND UX

The application must be easy for users despite complex operations.

## 23.1 Design Direction

Do not use a generic admin template.

Create a distinctive Persian, media-oriented visual system that communicates:

- network;
- trust;
- exchange of value;
- progress;
- cultural cooperation;
- operational clarity.

Creativity must help comprehension.

## 23.2 RTL Design System

Implement:

- true RTL;
- Persian font;
- design tokens;
- accessible color;
- status semantics;
- responsive spacing;
- keyboard focus;
- 44-pixel touch targets;
- reduced motion;
- Persian number handling;
- explicit rial and toman labels;
- accessible charts;
- dark mode only if complete.

## 23.3 Admin Desktop

- collapsible sidebar;
- command palette;
- global search;
- dense but readable tables;
- sticky headers;
- split view;
- contextual actions;
- saved filters;
- no nested modal chains.

## 23.4 Partner Mobile

- bottom navigation with no more than five primary items;
- next-action card;
- context-aware main action;
- one question or small group per onboarding page;
- upload from camera or gallery;
- upload progress;
- autosave;
- safe limited offline draft;
- installable PWA;
- clear update prompt.

## 23.5 Required States

Every feature needs:

- loading;
- skeleton;
- empty;
- validation;
- error;
- retry;
- success;
- permission denied;
- stale-data conflict;
- offline;
- autosave state;
- destructive confirmation;
- audit-aware history.

---

# 24. SECURITY

Implement and test:

- OWASP-aligned controls;
- server-side authorization;
- IDOR prevention;
- CSRF;
- XSS protection;
- SQL injection protection;
- SSRF controls;
- secure CORS;
- content security policy;
- security headers;
- rate limiting;
- TLS-ready configuration;
- secret management;
- PII redaction;
- file MIME and magic-byte validation;
- file size and count limits;
- malware scan;
- quarantine;
- signed short-lived file URLs;
- dependency scan;
- secret scan;
- audit;
- backup;
- restore;
- step-up authentication;
- dual approval;
- incident notes.

Never send sensitive channel or personal data to an external AI service without an explicit approved policy and data minimization.

---

# 25. API, EVENTS, AND BACKGROUND WORK

Implement:

- versioned API;
- OpenAPI;
- shared DTO schemas;
- safe Persian error messages;
- stable error codes;
- field errors;
- correlation ID;
- cursor pagination;
- server filtering;
- idempotency;
- transactional outbox;
- worker retries;
- dead-letter handling;
- health;
- readiness;
- structured logs.

Use events for:

- submission;
- correction request;
- decision;
- quote;
- approval;
- scheduling;
- execution;
- ledger posting;
- obligation;
- deliverable;
- settlement;
- ticket;
- notification.

Use SSE, WebSocket, or controlled polling for live updates. Document the choice.

---

# 26. INTEGRATED IMPLEMENTATION PHASES

Do not create all screens first and postpone the backend.

Each phase is a vertical slice:

- schema;
- migration;
- API;
- domain logic;
- admin UI;
- partner UI;
- mobile behavior;
- permissions;
- audit;
- tests;
- documentation.

After each phase:

1. run migration;
2. run lint;
3. run type check;
4. run relevant tests;
5. run production build;
6. update IMPLEMENTATION_STATUS.md;
7. continue to the next phase.

## Phase 0 — Repository Audit and Real Foundation

Implement:

- repository audit;
- AGENTS.md;
- implementation plan;
- monorepo;
- applications;
- packages;
- Docker Compose;
- PostgreSQL;
- Redis;
- MinIO;
- environment validation;
- CI;
- logging;
- health;
- base RTL design system.

Exit proof:

- all apps build;
- infrastructure starts;
- first migration runs;
- both workspaces load from real applications;
- no fake business dashboard is claimed.

## Phase 1 — Authentication, Authorization, Profiles, and Files

Implement:

- partner OTP;
- internal login;
- MFA;
- sessions;
- RBAC and ABAC;
- channels;
- memberships;
- workspace selector;
- secure upload;
- audit.

Exit proof:

- real login;
- real database session;
- channel-scoped permissions;
- uploaded file metadata persists;
- cross-channel access E2E is denied.

## Phase 2 — Form Engine, 28-Question Onboarding, and Evaluation

Implement:

- form builder;
- form versions;
- 28-question published form;
- autosave;
- submission;
- revisions;
- evaluation;
- correction;
- approval;
- 360-degree channel profile foundation.

Exit proof:

- complete mobile onboarding E2E;
- reload persistence;
- correction and resubmission;
- form version change does not alter history.

## Phase 3 — Support Requests, Pricing, Quotes, and Admin Operations

Implement:

- promotion types;
- pin request;
- nationwide price;
- provincial price;
- variable promotion;
- quotes;
- approval;
- operational queues;
- Kanban;
- partner progress.

Exit proof:

- backend 240-rial calculation;
- backend 480-rial calculation;
- quote negotiation;
- history;
- no static counters.

## Phase 4 — Tasks, Jalali Calendar, Gantt, Scheduling, and Execution

Implement:

- internal tasks;
- assignments;
- dependencies;
- calendar;
- date notes;
- Gantt;
- capacity;
- conflict detection;
- promotion schedule;
- evidence;
- actual result.

Exit proof:

- task persists;
- calendar and Gantt show the same data;
- valid drag updates backend;
- invalid drag is rejected;
- partner sees new schedule.

## Phase 5 — Ledger, Barter, Obligations, Deliverables, and Settlement

Implement:

- immutable ledger;
- service catalog;
- obligations;
- negotiation;
- deliverables;
- partial approval;
- allocation;
- settlement;
- dispute;
- reversal;
- rate card.

Exit proof:

- balanced ledger tests;
- retry does not double-post;
- partial service works;
- statement reconciles;
- no editable balance.

## Phase 6 — Tickets, Notifications, Surveys, Reports, and Analytics

Implement:

- ticketing;
- in-app notifications;
- SMS workflow;
- survey authoring;
- survey dashboard;
- report builder;
- exports;
- operational analytics;
- unified timeline.

Exit proof:

- internal note cannot leak;
- notification retries;
- report uses real data;
- survey analytics use real submissions;
- exports obey permission.

## Phase 7 — Mobile PWA, Security Hardening, Performance, and Release

Implement:

- PWA;
- responsive refinement;
- accessibility;
- performance;
- security review;
- load test;
- backup;
- restore drill;
- staging configuration;
- deployment guide;
- UAT;
- release checklist.

Exit proof:

- all critical E2E tests pass;
- production build passes;
- backup restore is documented and tested;
- no unresolved critical or high security issue;
- the product is deployable.

---

# 27. TESTS THAT MUST EXIST

Unit:

- phone normalization;
- Eitaa ID normalization;
- 240-rial calculation;
- 480-rial calculation;
- effective price version;
- state machines;
- Jalali conversion;
- ledger balancing;
- reversal;
- settlement allocation;
- conditional form rules.

Integration:

- OTP;
- session;
- permissions;
- form version;
- submission revision;
- price snapshot;
- quote;
- schedule;
- file scan;
- task dependency;
- ledger posting;
- partial settlement;
- outbox;
- notification retry.

E2E:

- registration to submission;
- correction to approval;
- nationwide support;
- provincial support;
- variable quote;
- scheduling;
- Gantt reschedule;
- promotion result;
- obligation;
- partial deliverable;
- settlement;
- ticket;
- internal-note protection;
- report;
- cross-channel denial;
- mobile resume.

Invariant:

- every posted ledger transaction balances;
- no retry creates duplicate value;
- settlement cannot exceed accepted service;
- service debt cannot disappear without trace;
- illegal state transition is impossible;
- historical price remains stable.

---

# 28. DEFINITION OF DONE

A feature is complete only when:

- its database model exists;
- migration exists;
- backend logic exists;
- API exists;
- frontend calls the real API;
- reload preserves data;
- authorization exists;
- validation exists;
- audit exists;
- loading, empty, error, and denied states exist;
- tests pass;
- build passes;
- documentation is updated.

A dashboard is complete only when:

- metrics come from the database;
- list rows open real records;
- filters alter server queries;
- actions persist;
- permissions are enforced;
- loading, empty, and error states work.

---

# 29. FINAL VERIFICATION CHECKLIST

Before declaring the software complete:

- run install from a clean state;
- start infrastructure;
- apply migrations;
- seed development data;
- run lint;
- run type check;
- run unit tests;
- run integration tests;
- run E2E tests;
- run production builds;
- review frontend for static placeholder data;
- review API authorization;
- review ledger invariants;
- review file security;
- review environment secrets;
- review mobile routes;
- review accessibility;
- review implementation status;
- compare every requirement in this prompt with implemented code.

Create docs/REQUIREMENTS_TRACEABILITY.md with:

- requirement;
- implementation location;
- test location;
- completion status.

Do not mark a requirement complete without code and evidence.

---

# 30. FINAL RESPONSE FORMAT

When the implementation is actually complete, report:

1. what was built;
2. repository architecture;
3. implemented phases;
4. URLs and ports;
5. local startup commands;
6. environment variables;
7. migrations;
8. development users;
9. external integrations still requiring real credentials;
10. tests run and results;
11. production build result;
12. security checks;
13. deployment procedure;
14. remaining limitations;
15. exact files containing architecture, runbook, traceability, and status.

Do not respond with only a plan or screenshots.

Do not say “implemented” unless the code, database, API, and tests exist in the repository.

Start now:

1. inspect the repository;
2. write the execution plan;
3. create or repair the architecture;
4. implement Phase 0;
5. verify it;
6. continue automatically through all phases;
7. stop only at a verified working checkpoint or full completion.

