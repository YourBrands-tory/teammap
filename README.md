# TeamMap — React + Supabase

A faithful React port of `TeamMap.html`. Same data model, same logic, same look
(the original stylesheet is copied verbatim into `src/theme.css`). Persistence
moved from `localStorage` to Supabase. Built to be an **admin view** first, with
a **member view** added later (the role plumbing is already in place).

## What's done
- Full data layer: a Zustand store (`src/store/useStore.js`) that holds the old
  global `S` object in the **exact same shape**, loads it from Supabase, and
  write-through-persists every change (no more whole-blob saves).
- Supabase schema + RLS (`supabase/schema.sql`).
- Auth with admin/member roles (`src/auth/AuthGate.jsx`).
- App shell + nav (`src/App.jsx`, `src/components/Nav.jsx`).
- **Task Dashboard** fully ported — columns, mood sections, stand-up grouping,
  secondary drawer, side panel, inline status popup, create/edit modal.
- **Settings** with the import-once workflow + export.
- The other 7 views are stubs wired into the nav.

## Setup
1. `npm install`
2. In Supabase → **SQL Editor**, run `supabase/schema.sql`.
3. Supabase → **Authentication → Users → Add user** (your email + a password).
4. Make yourself admin (SQL Editor, replace the email):
   ```sql
   insert into profiles (id, role)
   select id, 'admin' from auth.users where email = 'you@agency.com'
   on conflict (id) do update set role = 'admin';
   ```
5. `cp .env.example .env.local` and fill in `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
   (Project Settings → API).
6. `npm run dev` → sign in → **Settings → Import JSON backup** → pick your
   `teammap-backup.json`. Everything lands in Supabase and becomes live.

## Architecture (why the rest of the port is mechanical)
The old app was render functions that stringified HTML from one global `S` and
called `save()`. Here:
- `S` lives in the store, same field names.
- A render function `rXxx()` becomes a component that maps over the same `S`
  fields. Selectors `gm/gc/gmood/gtag/scl/tasksOnDate/tasksForMD` are exported
  as `sel.*`.
- A mutation (`t.status=...; save()`) becomes a store action
  (`setTaskStatus(...)`) that updates state + writes the row.

So porting a view = translate its render function to JSX + swap its mutations
for store actions. **TaskDashboard.jsx is the worked reference.**

## Port map (remaining views → original functions → store actions to use)
| Nav | View file to build | Original render fns | Store actions available |
|-----|--------------------|---------------------|--------------------------|
| td  | TeamDashboard.jsx  | `rTD`               | (read-only) `sel.*`, `thrs`/`gcc` logic via `S.links` |
| bl  | Builder.jsx        | `rBL,rML,rCL,rCanvas,selM,mkLink,rmLink,rmRole` | `upsertLink,delLink,upsertMember,upsertClient` |
| tk  | TasksMilestones.jsx| `rTK,rTaskGen,rCTRow,rMS,rTrash,rRecentTasks` | `upsertTask,softDeleteTask,recoverTask,purgeTask,upsertMilestone,delMilestone` |
| lv  | ListView.jsx       | `rLV,rLVRow,getLVTasks,lvSortBy` | `setTaskStatus,upsertTask` |
| tg2 | TaskGen2.jsx       | `rTG2*`, `tg2*` helpers | `upsertTask`, `setStateKey('tg2Views', …)` |
| lu  | LineUp.jsx         | `rLU*`, `lu*` helpers | `setStateKey('lineUpOrder'/'lineUpHidden', …)`, `setTaskStatus` |
| pg  | Playground.jsx     | `rPG`, `pg*` helpers | `setStateKey('playground', …)`, `upsertTask` |
| st  | Settings.jsx ✅ (extend) | `rST` mgmt sections | `upsertMember,delMember,upsertClient,delClient,setMoods,upsertTag,delTag,setNavOrder,setNavLabels,resetNav` |

Suggested order: **Tasks & Milestones → List View → Builder → Team Dashboard →
Line Up → Task Gen 2.0 → Playground.** (Most-used and most-reuse first.)

## Adding the member view later
`profiles.role = 'member'` + `profiles.member_id` is already loaded into the
store (`role`, `memberId`). RLS already lets a member update tasks they're
assigned to. Build a trimmed App for `role==='member'` that defaults to their
own column / list and hides admin-only nav items.
