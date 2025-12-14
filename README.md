# FinXpert

FinXpert is an AI-assisted personal finance platform that helps individuals monitor cash flow, stay on budget, and automate recurring money tasks. It pairs a marketing-ready landing page with an authenticated product experience for managing accounts, transactions, and proactive alerts.

## Features

- **Account management:** Create multiple account types, set a default wallet, and monitor balances derived from transactional activity.
- **Transaction flows:** Log income and expenses with category tagging, recurring schedules, and Gemini-powered receipt scanning for automatic extraction.
- **Budget oversight:** Define a monthly budget per default account, visualize burn-down progress, and receive automated email alerts when spending crosses configured thresholds.
- **Analytics dashboard:** Review account-level charts, tables, and summaries powered by Prisma aggregations and Recharts visualizations.
- **Automations & safeguards:** Inngest jobs handle recurring charges and budget checks, Resend sends templated notifications, and Arcjet enforces server-side rate limiting.
- **Delightful UX:** Next.js App Router, Clerk authentication, shadcn/ui components, and Sonner toasts provide a polished, responsive interface with dark-mode support.

## Tech Stack

- **Framework:** Next.js 15 (App Router, Server Actions, Middleware) with React 19
- **UI & Styling:** Tailwind CSS 4, shadcn/ui, Radix primitives, next-themes, Lucide icons
- **Auth & Sessions:** Clerk Hosted UI + middleware protection
- **Data Layer:** Prisma ORM, PostgreSQL, Decimal-backed money types, date-fns utilities
- **Automation & AI:** Inngest workflows, Google Gemini 2.0 Flash for OCR, Arcjet token-bucket rate limiting
- **Email & Feedback:** Resend transactional email, React Email templates, Sonner notifications
- **Charts & Forms:** Recharts, React Hook Form, Zod validation, Vaul drawers

## Project Structure

```
├─ actions/           # Server actions for accounts, budgets, dashboard, transactions, seeding
├─ app/               # App Router routes (landing, auth, dashboard, account detail, APIs)
├─ components/        # Reusable UI, drawers, layout header, marketing hero
├─ data/              # Static landing-page copy, feature lists, testimonials
├─ emails/            # React Email templates used by Resend
├─ hooks/             # Custom hooks (useFetch for client/server interop)
├─ lib/               # Prisma client, Clerk helpers, Arcjet config, Inngest functions
├─ prisma/            # Database schema and migrations
└─ public/            # Static assets (logos, hero banner)
```

## Getting Started

### Prerequisites

- Node.js 18.18+ (Next.js 15 requirement)
- npm 9+ (or pnpm/yarn if you prefer)
- PostgreSQL database (local or managed)
- Resend, Clerk, Google Gemini, Arcjet, and Inngest accounts for production features

### Installation

```bash
git clone https://github.com/<your-org>/finxpert.git
cd finxpert
npm install
```

### Environment Variables

Create a `.env.local` file at the project root:

| Variable                              | Required             | Description                                               |
| ------------------------------------- | -------------------- | --------------------------------------------------------- |
| `DATABASE_URL`                        | ✅                   | PostgreSQL connection string used by Prisma               |
| `DIRECT_URL`                          | ⛔️ for edge         | Optional direct connection string for migrations (Prisma) |
| `CLERK_SECRET_KEY`                    | ✅                   | Clerk backend API key                                     |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`   | ✅                   | Public Clerk key for the browser                          |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`       | ✅                   | Sign-in route (e.g. `/sign-in`)                           |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL`       | ✅                   | Sign-up route (e.g. `/sign-up`)                           |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | ✅                   | Post-login redirect (e.g. `/dashboard`)                   |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | ✅                   | Post-signup redirect                                      |
| `GEMINI_API_KEY`                      | ✅ for OCR           | Google AI Studio API key for receipt scanning             |
| `ARCJET_KEY`                          | ✅ for rate limiting | Arcjet project key protecting transaction creation        |
| `RESEND_API_KEY`                      | ✅ for email         | Resend key to send budget notifications                   |
| `INNGEST_EVENT_KEY`                   | ✅ for cron          | Inngest event key to enqueue recurring jobs               |

> Tip: add any other secrets (e.g. `NEXT_PUBLIC_APP_URL`) that your deployment target requires.

### Database Setup

Update `.env.local` with your database connection, then run:

```bash
npx prisma migrate deploy   # or `prisma migrate dev` during development
npx prisma generate         # run automatically on postinstall, safe to rerun
```

You can inspect data with:

```bash
npx prisma studio
```

### Local Development

1. Start the Next.js dev server:
   ```bash
   npm run dev
   ```
2. (Optional) Preview React Email templates:
   ```bash
   npm run email
   ```
3. (Optional) Run Inngest locally to execute scheduled jobs:
   ```bash
   npx inngest dev --next
   ```

The app will be available at http://localhost:3000.

### Seeding Sample Data

The `actions/seed.js` helper generates 120 days of realistic transactions. You can call `seedTransactions()` from a temporary route, script, or Node REPL once your database is connected. Adjust `ACCOUNT_ID` and `USER_ID` constants before running.

## Available Scripts

- `npm run dev` — start the development server with Turbopack
- `npm run build` — create an optimized production build
- `npm run start` — run the production server
- `npm run lint` — execute Next.js ESLint checks
- `npm run email` — launch the React Email preview server

## Deployment Notes

- Deploy to Vercel (recommended) or any Node-compatible host.
- Ensure all environment variables are set in your hosting platform.
- Configure Clerk redirect URLs and webhooks for the deployed domain.
- Schedule Inngest functions (cron + background triggers) in your Inngest dashboard or via `inngest deploy`.

## Contributing

1. Fork the repository and create a feature branch.
2. Keep PRs focused and add context about user-facing or infrastructure changes.
3. Run `npm run lint` before submitting.

## License

This project is released under the MIT License. See `LICENSE` (add if not present) for full details.
