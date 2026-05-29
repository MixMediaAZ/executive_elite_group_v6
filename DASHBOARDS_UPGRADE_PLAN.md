# Dashboards Upgrade Plan — Candidate, Employer & Admin

**Project:** Executive Elite Group v6
**Scope:** `/dashboard` (candidate + employer + admin views) and the `/admin/*` + `/dashboard/admin/*` routes
**Status:** Proposed — not yet implemented
**Author:** Engineering review, 2026-05-22

---

## 1. Why this plan

The dashboards work and are cleanly engineered (server-rendered, type-safe,
parallel queries), but they are **minimum-viable, not finished**:

- The **candidate** view is a profile card plus five recent applications — no
  stats, no saved jobs, no job matches, no sense of progress.
- The **employer** view has no metrics at all (only admins get stat cards).
- The **admin** tooling is good but **fragmented across three URL trees**
  (`/dashboard`, `/dashboard/admin/*`, `/admin/*`) with no paginated lists.

The good news: almost every feature below is backed by **tables that already
exist** — `SavedJob`, `JobMatch`, `JobView`, `Notification`, `Application`,
`AuditLog`. This is overwhelmingly **UI and query work, not schema work.**

---

## 2. Guiding principles

### 2.1 Non-destructive
- No existing route, page, or component is removed.
- No database column is altered or dropped.
- New computed values (e.g. profile completeness) are derived at request time —
  no migration required for Phase 1 or 2.
- Existing `/dashboard/saved`, `/dashboard/applications`, `/dashboard/ai`,
  `/dashboard/notifications` pages stay; the dashboard *surfaces* them rather
  than replacing them.

### 2.2 Design language — "2026+"
A consistent, modern, accessible standard applied to every dashboard surface:

1. **Card-first layout** — KPI stat cards on top, content cards below, generous
   whitespace, a consistent `rounded-2xl` / soft-border / hover-lift treatment.
2. **Progressive disclosure** — show the 3–5 most important things; everything
   else is one click away ("View all →").
3. **Streaming + skeletons** — wrap each data section in React `<Suspense>` with
   a skeleton fallback so the shell renders instantly and sections fill in.
4. **Glanceable data** — every KPI card pairs a number with a trend or context
   ("12 applications · 3 this week"). Small inline sparklines where useful.
5. **Mobile-first & accessible** — every grid is `grid-cols-1 sm:…`; WCAG 2.1 AA
   contrast; visible focus rings; semantic headings; 44px touch targets.
6. **Purposeful empty states** — every empty section has an icon, one line of
   explanation, and a single clear CTA.
7. **Design tokens** — reuse the existing `eeg-*` color tokens; no hardcoded
   hex values. One shared `<StatCard>` / `<DashboardSection>` / `<StatusPill>`
   component set so all three dashboards stay visually identical.

---

## 3. Candidate dashboard

**Goal:** turn a static profile card into a job-seeking command center that
answers "where do I stand and what should I do next?"

### 3.1 KPI stat row (new)
Four `<StatCard>`s, computed from existing tables:

| Card | Source | Secondary line |
|------|--------|----------------|
| Applications | `Application` count for candidate | "{n} this month" |
| Saved Jobs | `SavedJob` count | "{n} still live" |
| Job Matches | `JobMatch` count where `viewed = false` | "{n} new" |
| Profile Strength | computed % (see 3.2) | "Complete to rank higher" |

### 3.2 Profile completeness meter (new, no migration)
- Compute a 0–100% score at request time from filled `CandidateProfile` fields
  (fullName, currentTitle, currentOrg, summary, primaryLocation, phone,
  yearsExperience, ≥1 resume, narrativeAchievements, etc.).
- Render a progress bar + the single highest-impact missing item
  ("Add a professional summary → +15%").
- Pure derivation — no schema change.

### 3.3 "Recommended for you" (new)
- Surface top 3 `JobMatch` rows by `matchScore`, with the match % and a reason
  chip from `matchReasonsJson`.
- Mark them `viewed` when the card is shown; "See all matches →" to `/dashboard/ai`.

### 3.4 Saved jobs preview (new)
- Top 3 most recent `SavedJob` rows as compact cards; "View all →"
  links to the existing `/dashboard/saved`.

### 3.5 Applications — upgrade existing section
- Keep the recent-applications list; add a **`<StatusPill>`** (color-coded:
  Submitted / Under Review / Interview / Offer / Rejected) instead of plain text.
- Show the **total count** in the heading ("Recent Applications · 12 total").

### 3.6 Notifications glance (new)
- Unread `Notification` count as a header bell + the latest 3 in a small panel;
  "View all →" to `/dashboard/notifications`.

---

## 4. Employer dashboard

**Goal:** give employers the hiring metrics they currently completely lack.

### 4.1 KPI stat row (new)
| Card | Source | Secondary line |
|------|--------|----------------|
| Live Jobs | `Job` count where `status = LIVE` | "{n} pending review" |
| Total Applications | `Application` across employer's jobs | "{n} new this week" |
| Total Views | `JobView` across employer's jobs | 7-day sparkline |
| Conversion | applications ÷ views | "view-to-apply rate" |

### 4.2 Job performance table (upgrade existing)
- Replace the flat job list with a compact table: Title · Status pill · Views ·
  Applications · Conversion · Posted date.
- Each row links to a job detail / applicants view.

### 4.3 Recent applicants panel (new)
- Latest 5 applications across all the employer's jobs, with status pills and a
  link to `/dashboard/applications`.

### 4.4 Approval-aware guidance (upgrade existing)
- Keep the pending-approval banner; when approved, replace it with a
  "Post a new role" primary CTA and a one-line tip.

---

## 5. Admin — unify and scale

The admin tooling is good but scattered. **Do not delete the existing pages** —
unify navigation around them and add paging.

### 5.1 Single admin hub (new)
- New `/admin` landing page acting as the one admin home:
  - Top KPI row: Candidates · Employers · Live Jobs · Applications ·
    Pending Approvals · Open Reports.
  - Quick-action cards linking to every existing admin surface
    (`/dashboard/admin`, `/dashboard/admin/analytics`, `/admin/employers`,
    `/admin/health`, `/admin/insights`, approvals).
- A shared **admin sub-nav** component placed on every admin page so the three
  URL trees feel like one product.

### 5.2 Pagination everywhere (upgrade existing)
- Apply the jobs-board pagination pattern (server `page`/`pageSize`,
  `Promise.all` count + page, "Showing X–Y of Z") to:
  - Admin users list (currently `take: 50`)
  - Employers list (currently `take: 25`)
  - Audit trail (currently `take: 25`)
  - Pending employers / pending jobs (currently `take: 10`)
- Absent `page` param → current capped behavior preserved.

### 5.3 Approvals workspace (upgrade existing)
- Promote pending employers + pending jobs into a dedicated, filterable,
  paginated `/admin` → "Approvals" view; keep the quick view on `/dashboard`.

### 5.4 Audit trail polish
- Keep it; add filter-by-action-type and date, and pagination.

---

## 6. Shared component work (do first)

Build these once, use across all three dashboards:

- `<StatCard>` — label, value, secondary line, optional trend/sparkline, icon.
- `<DashboardSection>` — titled card with optional "View all →" action + empty state.
- `<StatusPill>` — color-coded application/job status.
- `<DashboardSkeleton>` — section-level skeleton for `<Suspense>` fallbacks.
- `<AdminSubNav>` — shared admin navigation.

This guarantees the "2026+" look is consistent and keeps each page small.

---

## 7. Phased rollout

| Phase | Work | Risk | Est. |
|-------|------|------|------|
| **P1** | §6 shared components; §3.1–3.2 candidate KPIs + profile meter; §4.1 employer KPIs | Low | 2–3 days |
| **P2** | §3.3–3.6 matches/saved/notifications; §4.2–4.4 employer table & applicants | Low–Med | 3–4 days |
| **P3** | §5 admin hub, pagination, approvals workspace | Med | 4–5 days |

Each phase is independently shippable. No phase requires a database migration;
all metrics derive from existing tables.

---

## 8. Safety checklist (per phase)

- [ ] No existing route, page, or component removed.
- [ ] No DB column altered or dropped (Phases 1–3 are query-only).
- [ ] Existing `/dashboard/saved`, `/applications`, `/ai`, `/notifications`,
      `/admin/*` pages still load unchanged.
- [ ] All dashboard grids are `grid-cols-1 sm:…` and verified at ~390px / 768px / desktop.
- [ ] WCAG AA contrast and visible focus states on all new components.
- [ ] `tsc --noEmit` clean; production build clean.

---

## 9. Out of scope (future)

- Real-time updates (websockets) for live application counts.
- Candidate-facing analytics ("your profile appeared in N searches").
- Saved-search alerts / email digests.
- A dedicated employer billing/subscription dashboard surface.
