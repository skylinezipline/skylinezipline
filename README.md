# Zipline OS — Skyline Ziplines Operations Platform

> Full-stack operations management system built for Skyline Ziplines. Manages bookings, guest check-in, staff scheduling, equipment inspections, safety reporting, and business analytics — all in one place, deployed on Vercel.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | SSR, routing, API routes |
| **Language** | TypeScript | Type safety across the stack |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid, consistent UI |
| **Database ORM** | Prisma | Type-safe DB access |
| **Database** | PostgreSQL (Supabase / Neon) | Persistent data store |
| **Auth** | NextAuth.js v4 | Staff authentication (credentials + Google OAuth) |
| **Charts** | Recharts | Revenue & analytics visualizations |
| **State** | Zustand | Client-side global state |
| **Deployment** | Vercel | Edge-optimized hosting + CI/CD |
| **File Storage** | Vercel Blob / Supabase Storage | Waiver PDFs, inspection photos |
| **Email** | Resend | Booking confirmations, waiver links |

---

## Application Structure

```
src/
├── app/
│   ├── login/                  # Staff login page
│   ├── ops/                    # Protected operations area
│   │   ├── layout.tsx          # Sidebar + header shell
│   │   ├── dashboard/          # Daily ops overview
│   │   ├── bookings/           # Reservation management
│   │   ├── checkin/            # Guest arrival & waivers
│   │   ├── staff/              # Guide scheduling & certs
│   │   ├── equipment/          # Gear inventory & inspections
│   │   ├── safety/             # Incident reports & compliance
│   │   └── reports/            # Revenue & analytics
│   └── api/
│       ├── auth/[...nextauth]/ # NextAuth endpoint
│       ├── bookings/           # CRUD bookings
│       ├── checkin/            # Check-in processing
│       ├── equipment/          # Equipment & inspections
│       ├── safety/             # Incident reports
│       ├── staff/              # Staff management
│       └── dashboard/          # Stats API
├── components/
│   ├── layout/                 # Sidebar, Topbar
│   ├── ui/                     # Reusable UI primitives (shadcn)
│   └── dashboard/              # Dashboard-specific components
├── lib/
│   ├── auth.ts                 # NextAuth config
│   ├── db.ts                   # Prisma singleton
│   ├── utils.ts                # Helpers (formatCurrency, cn, etc.)
│   └── mock-data.ts            # Dev/demo data
└── prisma/
    └── schema.prisma           # Full database schema
```

---

## Business Modules

### Dashboard (`/ops/dashboard`)
- Live operational status + weather hold indicator
- Today's bookings schedule with real-time status
- Staff on-duty roster
- Quick action shortcuts (new booking, check-in, inspect, report)
- MTD revenue, guest count, occupancy metrics
- 7-month revenue chart

### Bookings (`/ops/bookings`)
- Full booking CRUD — website, phone, walk-in, partner
- Status workflow: Pending → Confirmed → Checked In → In Progress → Completed
- Tour types: Intro, Classic (5-line), Adventure (7-line), Night Ride, Private, Corporate
- Guest roster per booking
- Confirmation number generation

### Check-In (`/ops/checkin`)
- Reservation lookup (confirmation #, name, phone)
- Digital waiver signing (kiosk, SMS, email)
- Weight/height verification for harness sizing
- Safety briefing checklist per group
- Real-time check-in queue

### Staff (`/ops/staff`)
- Staff directory with roles (Head Guide, Sr. Guide, Guide, Trainee, Dispatch)
- Daily schedule view
- Certification tracking (ACCT, CPR/AED, WFR, First Aid, etc.)
- Cert expiry alerts
- Assignment to tours

### Equipment (`/ops/equipment`)
- Full gear inventory with serial numbers
- Daily pre-operation inspection logging
- Status tracking: In Service / Out of Service / Under Inspection / Retired
- Inspection history per item
- Out-of-service alerts prominently displayed

### Safety (`/ops/safety`)
- Days-since-last-incident counter
- Pre-operation daily safety checklist
- Incident report filing (Near Miss, Injury, Equipment Failure, etc.)
- Severity classification (Low / Medium / High / Critical)
- Open incident tracking with review workflow
- Weather hold activation

### Reports (`/ops/reports`)
- Monthly revenue trends (bar chart)
- Tour type revenue mix (pie chart)
- Weekly occupancy rate (line chart)
- Booking source breakdown
- CSV / PDF export

---

## Data Models (Prisma)

```
User ─── Account, Session (NextAuth)
StaffMember ─── Certification[], Schedule[], StaffAssignment[]
Booking ─── Guest[], CheckIn, StaffAssignment[]
Equipment ─── Inspection[]
IncidentReport ─── StaffMember (reporter)
OperatingDay, TimeSlot (ops config)
```

---

## Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/skylinezipline/skylinezipline
cd skylinezipline
npm install
```

### 2. Environment
```bash
cp .env.example .env.local
# Fill in DATABASE_URL, NEXTAUTH_SECRET, etc.
```

### 3. Database
```bash
npx prisma db push       # Apply schema
npx prisma generate      # Generate client
npx prisma studio        # Browse data (optional)
```

### 4. Run
```bash
npm run dev
# → http://localhost:3000/ops/dashboard
```

Demo login: `admin@skylinezipline.com` / `demo1234`

---

## Deployment (Vercel)

1. Push to GitHub
2. Connect repo in Vercel dashboard
3. Set environment variables in Vercel project settings:
   - `DATABASE_URL` — PostgreSQL connection string (Supabase / Neon recommended)
   - `NEXTAUTH_SECRET` — `openssl rand -base64 32`
   - `NEXTAUTH_URL` — your production URL
4. Deploy — Vercel auto-deploys on every push to `main`

---

## Roadmap

- [ ] Real-time booking updates (Pusher / Ably)
- [ ] Guest-facing booking portal
- [ ] Online waiver signing with DocuSeal / Dropbox Sign
- [ ] Stripe integration for deposits and full payments
- [ ] Weather API integration (Tomorrow.io / OpenWeather) for auto hold
- [ ] SMS notifications via Twilio (booking confirmations, reminders)
- [ ] Mobile app for guides (React Native / Expo)
- [ ] QuickBooks / accounting integration for revenue sync
- [ ] Maintenance scheduling for cables and infrastructure
