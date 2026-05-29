# Box & Panel Linking Plan

**Project:** Executive Elite Group v6
**Goal:** Every visual box/panel that *looks* like it should be clickable
becomes clickable, linking to the most pertinent destination. **Zero UI/UX
changes** — same visual treatment, same layout, same content.
**Status:** Proposed — not yet implemented
**Author:** Engineering review, 2026-05-22

---

## 1. Guiding principle

A card with a heading, a short description, and rounded-card styling reads as
interactive. When it does nothing, users tap it and feel the product is
broken. This plan finds every such card and gives it the most useful link
target.

**Rules for the implementation:**

1. Wrap the existing card markup in a `<Link>` — do not change the inner
   layout, padding, or copy.
2. Add a focus ring (`focus-visible:ring-2 focus-visible:ring-eeg-blue-electric`)
   so keyboard users see the affordance.
3. Add a subtle hover affordance (`hover:shadow-md transition-shadow`) only
   where one is not already present.
4. Do **not** create new sections, remove sections, or change copy.
5. Never link a card to a page that does not exist. If there's no good
   destination, leave it static and add a short comment explaining why.

---

## 2. Identified opportunities

### 2.1 Home page — `app/page.tsx` (the example you gave)

| Card | Currently | Link to |
|------|-----------|---------|
| "Executive Roles" | static `<div>` | `/jobs` (browse the live board) |
| "Verified Employers" | static `<div>` | `/trust` (explains verification + fairness) |
| "Rapid Placement" | static `<div>` | `/auth/register?role=candidate` (the path to fast placement) |

### 2.2 Admin Insights metric tiles — `app/admin/insights/page.tsx`

The 4 KPI tiles (Candidates / Employers / Live Jobs / Applications) are
static. Link each to its drill-down:

| Tile | Link to |
|------|---------|
| Candidates | `/dashboard/admin` (User Manager — the only candidate-list surface) |
| Employers | `/admin/employers` |
| Live Jobs | `/jobs` (the live job board) |
| Applications | `/dashboard/applications` |

### 2.3 Candidate dashboard — `app/dashboard/page.tsx`

In the **Recent Applications** rows, the job title is plain text. Wrap it
in a `<Link>` to `/jobs/${app.job.id}` (matches the pattern already used in
Recommended / Saved sections).

### 2.4 Employer dashboard — `app/dashboard/page.tsx`

In the **Recent Applicants** rows, the line "Applied to {job.title}"
contains a plain job title. Wrap *only* the title in a `<Link>` to
`/jobs/${app.job.id}`. The applicant name stays plain — there is no
employer-facing candidate profile view to link to.

### 2.5 Employer pending page — `app/employer/onboarding/pending/page.tsx`

The "In the meantime, you can update your profile information if needed."
sentence mentions an action without offering one. Add a primary button/link
to `/dashboard/profile` directly below it.

### 2.6 AI dashboard top stat tiles — `app/dashboard/ai/page.tsx` (lines 165–178)

The 4 stat tiles (hidden until `stats.length > 0`) are static. When visible,
each should link to its underlying feature tab. Lower priority — they're
hidden today and require runtime data.

---

## 3. Out of scope (already correct)

These look interactive and **are** interactive — no change needed:

- AI dashboard "AI Features Grid" cards — already `cursor-pointer` + `onClick` (tab switch).
- All `<StatCard>` instances on the candidate / employer / admin home dashboards — I gave them `href` props in Phase 1/3.
- Dashboard "Recommended for You" and "Saved Jobs" job titles — already `<Link>`s.
- Notification bell, application/notification/message list items — already navigable via their list pages.
- Trust page section cards — these are **documentation panels**, not navigational targets; the content is the destination.
- Audit log entry boxes on `/dashboard/admin` — these are log records, not navigation.

---

## 4. Implementation pattern

For static card → linked card, this is the canonical edit (same shape used
by `StatCard` already):

```tsx
// Before
<div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
  <h3>Executive Roles</h3>
  <p>C-Suite, VP, Director...</p>
</div>

// After — wrap, do not restyle
<Link
  href="/jobs"
  className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-eeg-blue-electric transition-shadow hover:shadow-md"
>
  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
    <h3>Executive Roles</h3>
    <p>C-Suite, VP, Director...</p>
  </div>
</Link>
```

For inline text links (dashboard rows), wrap only the title:

```tsx
// Before
<h3 className="font-semibold text-gray-900">{app.job?.title || 'Unknown Job'}</h3>

// After
{app.job?.id ? (
  <Link href={`/jobs/${app.job.id}`} className="font-semibold text-gray-900 hover:text-eeg-blue-electric">
    {app.job.title}
  </Link>
) : (
  <h3 className="font-semibold text-gray-900">Unknown Job</h3>
)}
```

---

## 5. Phasing

This is small enough to ship as one phase:

1. Make all the edits above (≈ 8 distinct changes across 5 files).
2. `tsc --noEmit` + `next build`.
3. Visual sweep at mobile / tablet / desktop widths.
4. Deploy.

Estimate: 30–45 minutes of work.

---

## 6. Safety checklist

- [ ] No copy changed, no section added or removed.
- [ ] Every wrapped card still renders identically (same padding/border/bg/text).
- [ ] Every new `href` resolves to an existing route in `app/`.
- [ ] Focus ring visible on every newly-linked card.
- [ ] Build + type check pass.
- [ ] Manual click-test on each card to confirm the destination.
