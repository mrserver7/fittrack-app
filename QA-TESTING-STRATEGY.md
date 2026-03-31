# FitTrack — End-to-End QA Testing Strategy

**Prepared by:** Senior QA / Test Architect
**Date:** 2026-03-30
**Platform version:** v7 (AI Coach, Nutrition, Habits, Social, Explore, Offline Mobile)
**Coverage:** Web (Next.js 16) + Mobile (Expo/React Native) + API (REST)

---

## 1. Scope & Objectives

| Objective | Target |
|---|---|
| Functional coverage | 100% of user-facing flows |
| Role isolation | Admin / Trainer / Subscriber fully sandboxed |
| Auth security | No unauthenticated access to protected resources |
| API contracts | All endpoints respond with correct shape & status codes |
| Mobile parity | Core flows work on iOS & Android |
| Regression safety | Zero regressions after each code push |

---

## 2. Test Environments

| Environment | URL | DB | Notes |
|---|---|---|---|
| Local Dev | `http://localhost:3000` | SQLite (dev.db) | Use for unit/integration |
| Staging | Vercel Preview URL | Supabase (same project) | Use for E2E |
| Production | Vercel Production URL | Supabase Live | Smoke tests only |

**Mobile:** Expo Go (development build) on physical iOS + Android device / simulator.

---

## 3. Test Accounts

After reset, create these fresh accounts before running the suite:

| Role | Email | Password | Notes |
|---|---|---|---|
| Admin | `admin@trainerhub.com` | `admin123` | Already preserved |
| Trainer A | `trainer.a@test.com` | `Test1234!` | Normal trainer, canApproveClients = false |
| Trainer B | `trainer.b@test.com` | `Test1234!` | canApproveClients = true |
| Subscriber 1 | `sub1@test.com` | `Test1234!` | Belongs to Trainer A, status = active |
| Subscriber 2 | `sub2@test.com` | `Test1234!` | Belongs to Trainer B, pending approval |
| Subscriber 3 | `sub3@test.com` | `Test1234!` | Archived (to test blocked login) |

---

## 4. Authentication & Authorization

### 4.1 Login Flows

| Test Case | Steps | Expected |
|---|---|---|
| Valid trainer login | Enter valid email + password | Redirect to `/dashboard` |
| Valid subscriber login | Enter valid email + password | Redirect to `/home` |
| Admin login | Enter admin credentials | Redirect to `/admin` |
| Wrong password | Enter valid email + wrong password | "Incorrect email or password" shown |
| Non-existent email | Enter unknown email + any password | "Incorrect email or password" shown |
| Pending subscriber login | Login as Subscriber 2 (pending) | Show "Awaiting Approval" message |
| Archived subscriber login | Login as Subscriber 3 (archived) | Show "Account Removed" message |
| Invited subscriber login | Subscriber with status=invited | Show "Invitation Pending" message |

### 4.2 Registration Flows

| Test Case | Steps | Expected |
|---|---|---|
| Trainer registration | `/register?tab=trainer` → fill form | Account created, login works, lands on `/dashboard` |
| Duplicate trainer email | Register with existing trainer email | Error shown, no duplicate created |
| Subscriber self-registration | `/register?tab=subscriber` → fill form + pick trainer | Account created with status=pending |
| Invite token flow | `/invite/[valid-token]` | Account activated, status=active |
| Expired invite token | `/invite/[expired-token]` | Error message shown |

### 4.3 Route Protection

Test every route without logging in (clear cookies first):

| Route | Expected for Guest |
|---|---|
| `/dashboard` | Redirect to `/login` |
| `/clients` | Redirect to `/login` |
| `/home` | Redirect to `/login` |
| `/admin` | Redirect to `/login` |
| `/api/clients` (GET) | 401 Unauthorized |
| `/api/programs` (GET) | 401 Unauthorized |

Test role isolation (logged in as wrong role):

| User | Tries to access | Expected |
|---|---|---|
| Subscriber | `/dashboard` | Redirect to `/home` |
| Subscriber | `/admin` | Redirect to `/home` |
| Trainer | `/admin` | Redirect to `/dashboard` |
| Trainer | `/home` (client page) | Redirect to `/dashboard` |
| Trainer A | `/api/clients/[sub2_id]/approve` (POST) | 403 Forbidden (canApproveClients = false) |
| Trainer B | `/api/clients/[sub2_id]/approve` (POST) | 200 OK (canApproveClients = true) |

---

## 5. Admin Role — Full Flow Testing

### 5.1 Admin Dashboard (`/admin`)

- [ ] Shows correct counts: total trainers, total subscribers, pending count
- [ ] Pending badge updates when subscriber is approved/rejected
- [ ] All stat cards link to correct sub-pages

### 5.2 Trainer Management (`/admin/trainers`)

- [ ] Lists all non-admin trainers
- [ ] `canApproveClients` toggle ON → `PATCH /api/trainers/[id]/permissions` → flag persists on reload
- [ ] `canApproveClients` toggle OFF → flag persists on reload
- [ ] Trainer detail view shows correct subscriber count

### 5.3 Subscriber Management (`/admin/subscribers`)

- [ ] Shows ALL subscribers across all trainers
- [ ] Status filter tabs work: All / Active / Pending / Paused / Invited / Archived
- [ ] Pending count badge visible on "Pending" tab
- [ ] Approve pending subscriber → status changes to active, subscriber can now log in
- [ ] Reject pending subscriber → status changes to rejected, subscriber sees rejection message on login
- [ ] Delete subscriber button → soft-delete → subscriber disappears from list
- [ ] Deleted subscriber can re-register with same email
- [ ] View → `/admin/subscribers/[id]` shows full profile

### 5.4 Admin Messages (`/admin/messages`)

- [ ] Shows trainer list in left panel
- [ ] Clicking trainer shows client list in middle panel
- [ ] Clicking client shows thread in right panel (read-only)
- [ ] No send input visible (read-only for admin)

### 5.5 Admin Login Log (`/admin/login-log`)

- [ ] Shows login attempts with timestamps, email, success/failure
- [ ] Failed attempts recorded after wrong password entry

---

## 6. Trainer Role — Full Flow Testing

### 6.1 Dashboard (`/dashboard`)

- [ ] 4-stat grid: active clients, sessions this week, unread alerts, pain flags
- [ ] Pending client banner shown when subscribers are pending
- [ ] "Review" link on pending banner goes to `/clients?status=pending`
- [ ] Notifications bell shows unread count

### 6.2 Client Management (`/clients`)

**Active tab:**
- [ ] Lists all active/paused/invited/archived clients (excludes pending)
- [ ] Search by name filters correctly
- [ ] Status filter chips work (Active / Paused / Invited / Archived)
- [ ] Client card shows name, email, session count, last session date, engagement badge
- [ ] Clicking card navigates to `/clients/[id]`

**Pending tab:**
- [ ] Shows pending subscribers
- [ ] Approve button (if `canApproveClients = true`) → subscriber goes to active, moves to Active tab
- [ ] Reject button → subscriber moves off the list
- [ ] Trainer A (no canApproveClients) → approve/reject buttons NOT shown

### 6.3 Client Detail (`/clients/[id]`)

- [ ] Shows client profile: name, email, status, start date, tags
- [ ] Shows "This Week's Schedule" 7-day grid with correct color coding:
  - Grey cell = rest day
  - Emerald cell = workout scheduled
  - Emerald + checkmark = workout completed
  - Red = skipped
  - Orange = moved
- [ ] Override history list below grid is accurate
- [ ] Recent sessions list shows clickable rows → `/clients/[id]/sessions/[sessionId]`
- [ ] "Assign Program" button opens modal → program selected → `ClientProgram` record created
- [ ] "Send Check-in" button opens modal → form selected → check-in created
- [ ] Delete client button → soft-delete → redirect to clients list
- [ ] Status change (Active → Paused) → persists on reload

### 6.4 Program Builder (`/programs/new`)

- [ ] Can set program name, description, weeks count
- [ ] Can add weeks
- [ ] Can add workout days per week (labeled by weekday name: Mon/Tue/etc.)
- [ ] Can add exercises to each day (select from exercise library)
- [ ] Sets/reps/weight/rest fields save correctly
- [ ] Save button → program appears in `/programs` list
- [ ] Program can be assigned to client via client detail page

### 6.5 Program Edit (`/programs/[id]`)

- [ ] All existing data loads correctly
- [ ] Can rename day via weekday dropdown
- [ ] Used weekdays shown greyed-out in dropdown
- [ ] Click outside dropdown closes it
- [ ] Changes persist after save

### 6.6 Program Deletion & Client Impact

- [ ] Delete program from `/programs/[id]` → program soft-deleted
- [ ] Subscriber assigned to that program → client's `/home` no longer shows that program
- [ ] Subscriber's `/workout/today` shows "No workout scheduled" or rest day screen
- [ ] Subscriber's `/schedule` shows no active program
- [ ] `ClientProgram` record in DB has `status = archived` (verify via admin or direct check)
- [ ] Trainer can assign a new program to the client afterward

### 6.7 Exercise Library (`/exercises`)

- [ ] Global exercises visible (no trainerId)
- [ ] Trainer can create custom exercise → appears in list
- [ ] Custom exercise editable / deletable
- [ ] Global exercises not deletable by trainer

### 6.8 Messaging (`/messages`)

- [ ] Trainer messages hub loads client list in sidebar
- [ ] Unread messages highlighted
- [ ] Click client → thread loads
- [ ] Send message → appears immediately
- [ ] Client sees new message in their `/messages` page
- [ ] Message count updates in nav badge

### 6.9 Analytics (`/analytics`)

- [ ] Charts load without error (no recharts console errors)
- [ ] Session frequency chart shows data for past 4 weeks
- [ ] Data matches actual session records

### 6.10 Settings (`/settings`)

- [ ] Profile name editable → persists
- [ ] Avatar upload → image shows in sidebar and settings
- [ ] Remove photo → avatar reverts to initials
- [ ] Email change → can log in with new email
- [ ] Password change → old password rejected, new password works
- [ ] Delete account button → confirmation → account deleted → redirected to login

---

## 7. Subscriber (Client) Role — Full Flow Testing

### 7.1 Home (`/home`)

- [ ] Today's workout card shows correct day label (e.g., "Monday - Upper Body")
- [ ] "Start Workout" CTA links to `/workout/today`
- [ ] Rest day card shown when no workout scheduled today
- [ ] Stats: sessions, streak, active days display correct values
- [ ] Personal records section shows latest PRs
- [ ] Pending check-in banner shown if unsubmitted check-in exists
- [ ] Quick nav cards: Nutrition, Explore, Community are clickable

### 7.2 Workout Logger (`/workout/today`)

- [ ] Correct workout day loads based on today's weekday + program cycling
- [ ] Exercise list with sets/reps/weight inputs
- [ ] Entering weight value visible in dark mode (not invisible text)
- [ ] Rest timer shown after set logged
- [ ] "Skip / Move" options available (WorkoutDayOptions component)

**Skip flow:**
- [ ] Click "Skip Day" → confirmation → `WorkoutScheduleOverride` created with action=skip
- [ ] Today's grid cell turns red
- [ ] Trainer sees skipped day on client detail page

**Move flow:**
- [ ] Click "Move to..." → pick future weekday → confirmation
- [ ] `WorkoutScheduleOverride` created with action=move
- [ ] Original day cell turns orange (moved away)
- [ ] Target day shows the workout when that day arrives
- [ ] Cannot move to a past day (error shown)

**Complete flow:**
- [ ] Log at least 1 set → click "Complete Workout"
- [ ] Success screen / emoji feedback shown
- [ ] `SessionLog` with `status=completed` created
- [ ] Trainer's weekly grid shows completed cell (emerald + checkmark)
- [ ] Session count increments on home stats

**Pain flag:**
- [ ] Can flag pain area during workout
- [ ] Pain flag appears on trainer's dashboard alert count

### 7.3 Workouts History (`/workouts`)

- [ ] Lists completed sessions in reverse chronological order
- [ ] Each row shows date, program name, duration
- [ ] Click session → `/workouts/[id]` shows full session summary with all sets

### 7.4 Progress (`/progress`)

- [ ] Measurement chart renders without error
- [ ] Can add new measurement (weight, body fat, etc.)
- [ ] Chart updates with new data point
- [ ] Progress photos grid renders

### 7.5 Schedule (`/schedule`)

- [ ] Shows 7-day calendar for current week
- [ ] Workout days shown with correct day labels
- [ ] Completed / skipped / moved days color-coded correctly
- [ ] Rest days shown in grey

### 7.6 Nutrition (`/nutrition`)

- [ ] Nutrition log page loads
- [ ] Can add food entry with calories/macros
- [ ] Daily summary updates correctly
- [ ] Previous day's entries visible

### 7.7 Habits (`/habits`)

- [ ] Habit list loads
- [ ] Can create new habit
- [ ] Daily check-off works → `HabitLog` created
- [ ] Streak counter increments

### 7.8 Check-ins (`/checkins`)

- [ ] Pending check-ins listed
- [ ] Completed check-ins listed separately
- [ ] Click pending check-in → form loads with questions
- [ ] Submit check-in → moves to completed list
- [ ] Trainer can review submitted check-in on client detail

### 7.9 Messages (`/messages`)

- [ ] Thread with trainer loads
- [ ] Can send message → appears immediately
- [ ] Unread messages highlighted until read

### 7.10 Community (`/community`)

- [ ] Social feed loads
- [ ] Can create post
- [ ] Can react to another post
- [ ] Post appears in feed

### 7.11 Explore (`/explore`)

- [ ] Explore content loads without error
- [ ] Browse/search works

### 7.12 Settings (`/settings`)

- [ ] Profile name editable
- [ ] Avatar upload works
- [ ] Email change works
- [ ] Password change works
- [ ] Delete account → redirected to login, account gone

---

## 8. API Contract Testing

Run these with a REST client (Postman / curl) using a valid session cookie or Bearer token.

### 8.1 Auth APIs

| Method | Endpoint | Payload | Expected |
|---|---|---|---|
| POST | `/api/auth/register` | `{name, email, password}` | 201, trainer created |
| POST | `/api/auth/register-subscriber` | `{name, email, password, trainerId}` | 201, client pending |
| POST | `/api/auth/check-status` | `{email}` | `{reason: "pending"\|"rejected"\|...}` |

### 8.2 Clients APIs

| Method | Endpoint | Auth | Expected |
|---|---|---|---|
| GET | `/api/clients` | Trainer | 200, array of clients |
| GET | `/api/clients/[id]` | Trainer (owns client) | 200, client object |
| GET | `/api/clients/[id]` | Trainer (doesn't own) | 403 |
| PATCH | `/api/clients/[id]` | Trainer | 200, updated client |
| DELETE | `/api/clients/[id]` | Trainer | 200, soft-deleted |
| POST | `/api/clients/[id]/approve` | Trainer (canApprove=true) | 200 |
| POST | `/api/clients/[id]/approve` | Trainer (canApprove=false) | 403 |
| POST | `/api/clients/[id]/reject` | Trainer | 200 |

### 8.3 Programs APIs

| Method | Endpoint | Auth | Expected |
|---|---|---|---|
| GET | `/api/programs` | Trainer | 200, own programs |
| POST | `/api/programs` | Trainer | 201, new program |
| GET | `/api/programs/[id]` | Trainer (owns) | 200 |
| GET | `/api/programs/[id]` | Other trainer | 403 |
| PATCH | `/api/programs/[id]` | Trainer (owns) | 200 |
| DELETE | `/api/programs/[id]` | Trainer (owns) | 200, program soft-deleted + clientPrograms archived |

### 8.4 Sessions APIs

| Method | Endpoint | Auth | Expected |
|---|---|---|---|
| POST | `/api/sessions` | Client | 201, session created |
| GET | `/api/sessions/[id]` | Client (owns) | 200 |
| POST | `/api/sessions/[id]/sets` | Client | 201, set logged |
| POST | `/api/sessions/[id]/pain-flags` | Client | 201 |
| POST | `/api/sessions/[id]/complete` | Client | 200, session completed |
| GET | `/api/sessions/[id]` | Different client | 403 |

### 8.5 Override API

| Method | Endpoint | Payload | Expected |
|---|---|---|---|
| POST | `/api/workout/override` | `{action:"skip", weekStart, originalDayId}` | 201 |
| POST | `/api/workout/override` | `{action:"move", weekStart, originalDayId, targetDayLabel}` | 201 |
| POST | `/api/workout/override` | Move to past day | 400 |
| POST | `/api/workout/override` | Duplicate override same day | 409 or upsert OK |

### 8.6 Settings APIs

| Method | Endpoint | Payload | Expected |
|---|---|---|---|
| PATCH | `/api/settings/profile` | `{name}` | 200, name updated |
| PATCH | `/api/settings/profile` | `{photoUrl: null}` | 200, photo removed |
| POST | `/api/settings/password` | `{currentPassword, newPassword}` | 200 |
| POST | `/api/settings/password` | Wrong `currentPassword` | 400 |
| DELETE | `/api/settings/account` | — | 200, account soft-deleted |
| DELETE | `/api/settings/account` | Admin account | 400 (blocked) |
| POST | `/api/settings/upload-avatar` | multipart image | 200, `{url}` |

### 8.7 Notifications APIs

| Method | Endpoint | Expected |
|---|---|---|
| GET | `/api/notifications` | 200, array, unread first |
| PATCH | `/api/notifications/[id]` | 200, `isRead: true` |

---

## 9. Mobile App Testing (Expo / React Native)

### 9.1 Setup

```bash
cd mobile
npx expo start
# Test on: iOS Simulator, Android Emulator, physical device
```

### 9.2 Auth Flows (Mobile)

- [ ] Login with trainer credentials → trainer tabs shown (Dashboard, Clients, Settings)
- [ ] Login with subscriber credentials → client tabs shown (Home, Workout, Progress, Messages)
- [ ] Wrong credentials → error message shown
- [ ] Sign out → redirected to login screen
- [ ] Session persists on app restart (SecureStore token)

### 9.3 Client Mobile Screens

**Home:**
- [ ] Stats grid loads correctly
- [ ] Today's workout card shows correct day
- [ ] PR section renders
- [ ] Checkin banner shown when pending

**Workout:**
- [ ] Exercise list loads
- [ ] Can log sets with weight/reps input
- [ ] Skip / Move options work
- [ ] Complete workout flow works
- [ ] Emoji feedback shown after completion

**Check-ins:**
- [ ] Pending check-ins list loads
- [ ] Form renders all questions
- [ ] Submit works and moves to completed

**Account (Settings):**
- [ ] Name edit works
- [ ] Password change works
- [ ] Sign out works

### 9.4 Trainer Mobile Screens

**Dashboard:**
- [ ] 4-stat grid loads
- [ ] Pending banner shown
- [ ] Recent sessions listed

**Clients:**
- [ ] Client list loads with search
- [ ] Status filter tabs work
- [ ] Tap client → detail screen

**Client Detail:**
- [ ] Stats, program, sessions load
- [ ] Approve/reject pending client works
- [ ] Override history visible

**Settings:**
- [ ] Name edit works
- [ ] Sign out works

### 9.5 Offline Mode (WatermelonDB Sync)

- [ ] Data accessible with no network (from local WatermelonDB)
- [ ] Log workout offline → shows in local history
- [ ] Reconnect → sync fires → data appears on server
- [ ] Conflicts resolved without data loss

---

## 10. Security Testing Checklist

### 10.1 Authentication

- [ ] JWT tokens expire correctly (test after token lifetime)
- [ ] Cannot forge a valid session by manipulating cookie
- [ ] CSRF protection in place for mutating API calls
- [ ] Rate limiting on `/api/auth/*` (brute force protection via `loginAttempt` tracking)

### 10.2 Authorization / IDOR

- [ ] Client A cannot read Client B's session logs (`/api/sessions/[id]`)
- [ ] Trainer A cannot read Trainer B's clients or programs
- [ ] Admin-only routes (`/api/trainers/[id]/permissions`) reject non-admin requests
- [ ] Subscriber cannot call trainer-only APIs (approve, reject, create program)

### 10.3 Input Validation

- [ ] SQL injection: submit `'; DROP TABLE "Trainer"; --` as program name → no crash
- [ ] XSS: submit `<script>alert(1)</script>` as client name → renders as text, not executed
- [ ] File upload: upload `.exe` as avatar → rejected (MIME type check)
- [ ] File upload: upload 50MB image → rejected with size error
- [ ] Oversized text fields: submit 10,000-char program description → handled gracefully

### 10.4 Data Exposure

- [ ] `/api/clients` never returns password hashes
- [ ] `/api/trainers/public` only returns non-sensitive fields
- [ ] Error responses don't leak stack traces in production

---

## 11. Performance Testing

### 11.1 Page Load Targets

| Page | Target (Time To Interactive) |
|---|---|
| `/login` | < 1.5s |
| `/dashboard` | < 2s |
| `/clients` (50 clients) | < 2.5s |
| `/workout/today` | < 2s |
| `/analytics` (with charts) | < 3s |

### 11.2 Load Testing (k6 or Artillery)

```bash
# Simulate 50 concurrent users hitting the login endpoint
k6 run --vus 50 --duration 30s login-test.js
```

Scenarios to test:
- 50 trainers loading their dashboard simultaneously
- 100 subscribers hitting `/workout/today` at peak hour
- 20 concurrent session completions

Acceptable thresholds:
- p95 response time < 500ms for API endpoints
- Zero 5xx errors under normal load

---

## 12. Cross-Browser & Cross-Platform

### 12.1 Web Browser Matrix

| Browser | Version | Priority |
|---|---|---|
| Chrome | Latest | P0 (must pass) |
| Firefox | Latest | P1 |
| Safari | Latest | P1 |
| Edge | Latest | P2 |
| Safari iOS | Latest | P1 |
| Chrome Android | Latest | P1 |

### 12.2 Mobile Device Matrix

| Device | OS | Priority |
|---|---|---|
| iPhone 14 | iOS 17 | P0 |
| iPhone SE | iOS 16 | P1 |
| Pixel 7 | Android 14 | P0 |
| Samsung S23 | Android 13 | P1 |

### 12.3 Dark Mode Testing

Run all P0 test cases in both light and dark mode:
- [ ] All text readable (sufficient contrast)
- [ ] Input fields legible (weight/rep inputs not invisible)
- [ ] Status badges visible in both modes
- [ ] Charts render in both modes

### 12.4 RTL (Arabic) Testing

Switch language to Arabic and verify:
- [ ] Layout flips correctly (RTL direction)
- [ ] All text translated (no English fallthrough)
- [ ] Sidebar mirrored
- [ ] Charts still readable

---

## 13. Regression Test Suite (Run on Every PR)

These are the highest-signal tests that catch the most common regressions:

1. **Login works** — all three roles (admin / trainer / subscriber)
2. **Pending subscriber blocked** — cannot log in before approval
3. **Trainer can approve subscriber** — status changes, subscriber can now log in
4. **Program assignment visible to subscriber** — workout shows on `/workout/today`
5. **Program deletion doesn't crash client** — client sees rest/no-program state
6. **Workout completion creates session log** — trainer's grid updates
7. **Skip/move override creates record** — visible on trainer client detail
8. **Message sent by trainer visible to client** — and vice versa
9. **Settings: name + avatar update** — persists across reload
10. **Password change** — old password rejected after change
11. **Delete account** — user cannot log in after deletion, can re-register

---

## 14. Bug Severity Matrix

| Severity | Description | SLA |
|---|---|---|
| **P0 - Critical** | Auth bypass, data loss, 500 on core flows, security vuln | Fix immediately |
| **P1 - High** | Core feature broken for a role, incorrect data shown | Fix in current sprint |
| **P2 - Medium** | UI glitch, non-blocking error, edge case failure | Fix in next sprint |
| **P3 - Low** | Copy error, minor styling, enhancement | Backlog |

### Bug Report Template

```
Title: [P0/P1/P2/P3] — Brief description
Role: Admin / Trainer / Subscriber
Browser/Device: Chrome 130 / iPhone 14 iOS 17
Steps to reproduce:
  1. Log in as [role]
  2. Navigate to [page]
  3. Do [action]
Expected: [what should happen]
Actual: [what happened]
Screenshot/Video: [attach]
DB state (if relevant): [any DB records to check]
```

---

## 15. Go / No-Go Checklist Before Production Deploy

- [ ] All P0 regression tests pass
- [ ] No TypeScript build errors (`npx next build` clean)
- [ ] Admin login works
- [ ] Trainer login, dashboard, client list work
- [ ] Subscriber registration, pending → approved → workout flow works
- [ ] Program assignment → client sees workout
- [ ] Workout completion → session log created
- [ ] No console errors on P0 pages
- [ ] Dark mode: all core pages readable
- [ ] Mobile: login + workout flow works on iOS + Android
- [ ] Avatar upload works (Supabase Storage)
- [ ] Password change works
- [ ] No exposed stack traces on error pages

---

## 16. Test Execution Order (Fresh Start)

After a DB reset (like the one just performed):

```
1.  Verify admin login works                    (auth baseline)
2.  Register Trainer A + Trainer B via /register (trainer reg)
3.  Admin: set Trainer B canApproveClients=true  (permissions)
4.  Register Sub1 for Trainer A                 (subscriber reg)
5.  Register Sub2 for Trainer B                 (subscriber reg)
6.  Admin: approve Sub1                         (approval flow)
7.  Trainer B: approve Sub2                     (canApprove flow)
8.  Trainer A: create program + assign to Sub1  (program flow)
9.  Sub1: login → home → start workout          (workout flow)
10. Sub1: log sets → complete workout            (completion flow)
11. Trainer A: verify session visible            (trainer visibility)
12. Sub1: skip a day                            (override flow)
13. Trainer A: verify skip on client detail     (override visibility)
14. Trainer A: delete program                   (deletion flow)
15. Sub1: verify no crash on /home & /workout   (deletion guard)
16. Trainer A: send check-in form to Sub1       (checkin flow)
17. Sub1: submit check-in                       (submission flow)
18. Trainer A ↔ Sub1: exchange messages         (messaging flow)
19. Sub1: change password → re-login            (settings flow)
20. Sub1: delete account → re-register          (account deletion)
```

Running this sequence top-to-bottom covers ~80% of all user-facing functionality with real data.
