# Pradip's Homeo — Secure Digital Homoeopathy Library

A production Next.js 16 app with password + 6-digit PIN authentication, role-based access control, and a private homoeopathy library (remedies, rubrics, therapeutics, predictive homeopathy).

## 🔗 Live URLs

- **Production**: https://pradips-homoe.vercel.app/
- **Admin Panel**: https://pradips-homoe.vercel.app/admin

## 🔐 Authentication

Two-factor: Password + fixed 6-digit PIN (not OTP).

| Role | Login ID | Password | PIN |
|---|---|---|---|
| Admin | sagathiyapradip2002@gmail.com | Pradip@2026 | 180802 |
| User | pradip | user123 | 100727 |
| Staff | drstaff1 | StaffPass123 | 654321 |

## 🛡️ Security Features

- Only admin-created users can login (no self-registration)
- Password: bcrypt (10 rounds)
- PIN: bcrypt (12 rounds) — never stored plain
- 3 wrong PIN attempts → 15-minute lockout
- JWT sessions in httpOnly + Secure + SameSite=strict cookies
- All remedy data server-side only (NOT in frontend bundle)
- Audit logs for login, PIN, and admin actions
- User CANNOT: change PIN, reset PIN, view PIN, request PIN, bypass PIN
- Admin CAN: create/edit/disable/delete users, reset PINs, unlock accounts, view logs

## 📚 Library Collection

- **3,471 remedies** from 9 authors (Boericke, Phatak, Murphy, Kent, Allen, Sankaran, Farrington, Boeger, Mathur)
- **79,706 rubrics** (Kent, Phatak, Murphy)
- **408 therapeutic formulas** (Encyclopedia of Homoeopathic Formulas by Dr. Saif-ud-Din Saif)
- **23 predictive chapters** (Theory of Suppression + Theory of Acutes by Dr. Prafull Vijayakar)

## 🏗️ Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Database**: Neon Postgres (serverless PostgreSQL)
- **ORM**: Prisma
- **Auth**: bcrypt + JWT
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Hosting**: Vercel

## 📂 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Public home
│   ├── about/                # Public about
│   ├── contact/              # Public contact
│   ├── login/                # Login (password or PIN-only)
│   ├── verify-pin/           # 6-digit PIN entry
│   ├── dashboard/            # Protected: Materia Medica browser
│   ├── data/                 # Protected: unified data browser
│   ├── accounts/             # Protected: user's own profile
│   ├── remedy/[id]/          # Protected: remedy detail
│   ├── admin/                # Admin-only: overview/users/logs
│   └── api/
│       ├── auth/             # login, verify-pin, logout, session
│       ├── me/               # current user profile
│       ├── remedies/         # protected remedy data
│       ├── rubrics/          # protected rubric data
│       ├── therapeutics/     # protected therapeutics
│       ├── predictive/       # protected predictive books
│       └── admin/            # admin-only: users CRUD, logs
├── components/layout/
│   ├── Navbar.tsx            # shared auth-aware navbar
│   └── Footer.tsx
└── lib/
    ├── auth.ts               # hashing, sessions, lockout, audit
    ├── data.ts               # server-side JSON loader
    ├── db.ts                 # Prisma client
    └── require-auth.ts       # requireAuth() / requireAdmin()
```

## 🚀 Local Development

```bash
# Install
bun install

# Set up database
bun run db:push

# Seed admin user
bun run scripts/seed-admin.ts

# Run dev server
bun run dev
```

## 🌐 Routes

| Route | Access | Description |
|---|---|---|
| `/` | Public | Home page |
| `/about` | Public | About page |
| `/contact` | Public | Contact info |
| `/login` | Public | Login (Password+PIN or PIN-only) |
| `/verify-pin` | After password | 6-digit PIN entry |
| `/dashboard` | Login required | Materia Medica browser |
| `/data` | Login required | Unified data browser |
| `/accounts` | Login required | Own profile |
| `/remedy/[id]` | Login required | Remedy detail |
| `/admin` | Admin only | Admin overview |
| `/admin/users` | Admin only | User management |
| `/admin/users/create` | Admin only | Create user |
| `/admin/users/[id]` | Admin only | Edit user |
| `/admin/logs` | Admin only | Audit logs |

## ⚠️ Disclaimer

This library is for educational purposes only. Not a substitute for professional medical advice. Always consult a qualified homoeopathic practitioner.
