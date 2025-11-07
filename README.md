# 💰 FinXpert - AI-Powered Financial Management Platform

<div align="center">
  <img src="/public/logo_finxpert.png" alt="FinXpert Logo" width="300"/>
  
  <p align="center">
    An intelligent financial management platform that leverages AI to monitor, evaluate, and enhance your spending habits with instant, real-time insights.
  </p>

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Key Features Deep Dive](#-key-features-deep-dive)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Schema](#-database-schema)
- [API Routes](#-api-routes)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
---


## ✨ Features

### 🏦 Account Management
- **Multi-Account Support**: Create and manage multiple bank accounts (Current & Savings)
- **Default Account**: Set a primary account for quick transactions
- **Real-time Balance Tracking**: Automatic balance updates with every transaction
- **Account Dashboard**: Visual overview of all accounts with transaction counts

### 💳 Transaction Management
- **Smart Transaction Creation**: Easy-to-use forms with validation
- **AI Receipt Scanner**: Extract transaction details from receipts using Google Gemini AI
- **Transaction Categories**: 20+ pre-defined categories for income and expenses
- **Recurring Transactions**: Set up daily, weekly, monthly, or yearly recurring transactions
- **Transaction Editing**: Full CRUD operations on all transactions
- **Bulk Operations**: Select and delete multiple transactions at once
- **Advanced Filtering**: Filter by type, category, recurring status, and search by description
- **Sorting**: Sort transactions by date, amount, or category
- **Pagination**: Navigate through large transaction lists with ease

### 📊 Analytics & Insights
- **Interactive Charts**: Visual representation of income vs expenses using Recharts
- **Date Range Filtering**: View data for last 7 days, 1/3/6 months, or all time
- **Category-wise Breakdown**: Color-coded transaction categories
- **Net Balance Tracking**: Real-time calculation of net income/expenses
- **Transaction Trends**: Historical data visualization with bar charts

### 💰 Budget Management
- **Monthly Budgets**: Set spending limits for your default account
- **Budget Progress Tracking**: Visual progress bars showing budget utilization
- **Smart Alerts**: Automated email notifications when budget exceeds 80%
- **Budget Analytics**: Track expenses against budgets in real-time
- **Quick Budget Updates**: Edit budgets directly from the dashboard

### 🤖 AI-Powered Features
- **Receipt Scanning**: Upload receipt images to auto-extract:
  - Transaction amount
  - Merchant name
  - Date
  - Suggested category
  - Description
- **Smart Categorization**: AI suggests appropriate categories based on receipt content
- **Image Processing**: Supports JPG, PNG, and other image formats (max 5MB)

### 🔄 Automation & Scheduling
- **Recurring Transactions**: Automatic processing of recurring transactions
- **Budget Alerts**: Scheduled checks every 6 hours for budget overruns
- **Email Notifications**: Automatic alerts via Resend
- **Background Jobs**: Powered by Inngest for reliable task execution
- **Rate Limiting**: ArcJet integration prevents abuse with token bucket algorithm

### 🔐 Security & Authentication
- **Clerk Authentication**: Secure user authentication and management
- **Protected Routes**: Middleware-based route protection
- **Rate Limiting**: Request throttling to prevent abuse
- **Data Validation**: Zod schema validation on all forms
- **SQL Injection Prevention**: Prisma ORM with parameterized queries

### 🎨 User Experience
- **Responsive Design**: Mobile-first design that works on all devices
- **Dark Mode Ready**: Theme support with next-themes
- **Loading States**: Smooth loading indicators with react-spinners
- **Toast Notifications**: Real-time feedback with Sonner
- **Smooth Animations**: Tailwind CSS animations for better UX

---

## 🔍 Key Features Deep Dive

### 📸 AI Receipt Scanner

The receipt scanner uses Google Gemini AI to extract transaction details from images:

1. User uploads a receipt image (max 5MB)
2. Image is converted to base64
3. Sent to Gemini AI with structured prompt
4. AI extracts:
   - Amount
   - Date
   - Merchant name
   - Description
   - Suggested category
5. Data pre-fills the transaction form

**Supported formats**: JPG, PNG, WEBP, GIF

### 🔄 Recurring Transactions

Automated processing of recurring transactions:

1. **Setup**: User marks transaction as recurring and sets interval
2. **Scheduling**: Inngest job runs daily at midnight
3. **Processing**: Checks for due recurring transactions
4. **Execution**: Creates new transaction and updates account balance
5. **Next Date**: Calculates and stores next recurring date

**Rate Limiting**: Max 10 transactions per minute per user

### 📧 Budget Alerts

Automated email notifications for budget monitoring:

1. **Monitoring**: Inngest job runs every 6 hours
2. **Calculation**: Compares current month expenses to budget
3. **Threshold**: Triggers at 80% budget utilization
4. **Email**: Sends styled HTML email via Resend
5. **Tracking**: Prevents duplicate alerts in same month

### 🎯 Rate Limiting

ArcJet token bucket implementation:

- **Capacity**: 10 tokens per user
- **Refill Rate**: 2 tokens per hour
- **Purpose**: Prevents transaction spam
- **Response**: Returns 429 with retry-after header when exceeded

---

## 🎨 UI Components

Built with shadcn/ui and Radix UI primitives:

- **Forms**: Input, Select, Switch, Calendar, Checkbox
- **Feedback**: Toast, Progress, Loader
- **Layout**: Card, Drawer, Dialog, Dropdown Menu, Popover, Tooltip
- **Data**: Table, Badge
- **Navigation**: Button, Link

All components are fully accessible and customizable via Tailwind CSS.

---

## 📊 Analytics Features

### Transaction Overview Chart
- Bar chart showing daily income vs expenses
- Filterable by date range (7D, 1M, 3M, 6M, All Time)
- Color-coded bars (green for income, red for expenses)
- Net balance calculation

### Budget Progress
- Visual progress bar with color indicators:
  - Green: < 75% used
  - Yellow: 75-90% used
  - Red: > 90% used
- Percentage usage display
- Quick edit functionality

---

## 🔐 Security Features

### Authentication
- Clerk-based OAuth and email authentication
- Protected routes with middleware
- Session management

### Data Validation
- Zod schema validation on all forms
- Server-side validation on all mutations
- Type-safe database queries with Prisma

### Rate Limiting
- ArcJet token bucket algorithm
- Per-user request throttling
- Exponential backoff on retries

---

## 🚦 Performance Optimizations

- **Server Components**: Leverage React Server Components for faster initial loads
- **Suspense Boundaries**: Strategic loading states
- **Database Indexing**: Indexed queries on userId and accountId
- **Image Optimization**: Next.js Image component with lazy loading
- **Code Splitting**: Automatic route-based splitting
- **Memoization**: useMemo for expensive calculations

---


---

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 15.2 (App Router)
- **React**: 19.0
- **Styling**: Tailwind CSS 4.0
- **UI Components**: Radix UI + shadcn/ui
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Animations**: tailwindcss-animate

### Backend
- **Runtime**: Node.js with Next.js API Routes
- **ORM**: Prisma 6.15
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Clerk
- **Background Jobs**: Inngest
- **Email**: Resend + React Email
- **AI**: Google Gemini AI (@google/genai)
- **Rate Limiting**: ArcJet



---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or higher
- PostgreSQL database (or Supabase Account)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/finxpert.git
cd finxpert
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```
Fill in the required environment variables (see [Environment Variables](#-environment-variables))

4. **Set up the database**
```bash
npx prisma generate
npx prisma db push
```

5. **Run the development server**
```bash
npm run dev
```

6. **Open your browser**
Navigate to `http://localhost:3000`

---

## 🔑 Environment Variables

Create a `.env` file in the root directory with the following variables:
```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Google Gemini AI
GEMINI_API_KEY=...

# Resend (Email)
RESEND_API_KEY=re_...

# Inngest (Background Jobs)
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...

# ArcJet (Rate Limiting)
ARCJET_KEY=...
```

---

## 🗄 Database Schema

### User
- Clerk-based authentication
- Links to accounts, transactions, and budgets

### Account
- Types: CURRENT, SAVINGS
- Tracks balance in real-time
- Can be set as default

### Transaction
- Types: INCOME, EXPENSE
- Supports recurring transactions (DAILY, WEEKLY, MONTHLY, YEARLY)
- Status tracking (PENDING, COMPLETED, FAILED)
- Linked to accounts and users

### Budget
- Monthly budget limits
- Alert tracking
- One budget per user

---

## 🔌 API Routes

### Internal API Routes
- `/api/inngest` - Inngest webhook endpoint for background jobs
- `/api/seed` - Development endpoint for seeding test data

### Server Actions
- `createAccount` - Create new account
- `getUserAccounts` - Fetch user accounts
- `updateDefaultAccount` - Set default account
- `createTransaction` - Create new transaction
- `updateTransaction` - Update existing transaction
- `bulkDeleteTransaction` - Delete multiple transactions
- `scanReceipt` - AI-powered receipt scanning
- `getCurrentBudget` - Get budget data
- `updateBudgetAmount` - Update budget

---

## 📁 Project Structure
```
finxpert/
├── actions/              # Server actions
│   ├── accounts.js
│   ├── budget.js
│   ├── dashboard.js
│   ├── seed.js
│   ├── send-email.js
│   └── transaction.js
├── app/
│   ├── (auth)/          # Authentication pages
│   ├── (main)/          # Main application pages
│   │   ├── account/     # Account details & transactions
│   │   ├── dashboard/   # Dashboard page
│   │   └── transaction/ # Transaction management
│   ├── api/             # API routes
│   ├── lib/             # Schemas and utilities
│   ├── globals.css      # Global styles
│   ├── layout.js        # Root layout
│   └── page.jsx         # Landing page
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── create-account-drawer.jsx
│   ├── header.jsx
│   └── hero.jsx
├── data/                # Static data (categories, landing page)
├── emails/              # Email templates
├── hooks/               # Custom React hooks
├── lib/
│   ├── inngest/         # Background job functions
│   ├── arcjet.js        # Rate limiting config
│   ├── checkUser.js     # User verification
│   ├── prisma.js        # Prisma client
│   └── utils.js         # Utility functions
├── prisma/
│   ├── migrations/      # Database migrations
│   └── schema.prisma    # Database schema
├── public/              # Static assets
├── middleware.js        # Route protection
├── next.config.mjs      # Next.js configuration
└── package.json         # Dependencies
```


## 🧪 Development Tools

### Seed Data
Generate test transactions for development:
```bash
# Visit in browser
http://localhost:3000/api/seed
```

### Email Development
Preview emails locally:
```bash
npm run email
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## 👨‍💻 Author

**Vishal Gupta**

- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)





<div align="center">
  <img src="/public/banner.png" alt="Dashboard Preview" width="800"/>
</div>

---

<div align="center">
  Made with ❤️ by Vishal Gupta
</div>
