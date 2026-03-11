# Soccer Field Scheduler

A Next.js application for scheduling and managing soccer field reservations. Built with Neon PostgreSQL database, Drizzle ORM, NextAuth.js for authentication, and shadcn/ui components.

## Features

- **User Authentication**: Register and login with email/password
- **City Management**: Admin can create and manage cities
- **Field Management**: Admin can create and manage soccer fields in each city
- **Zone Management**: Admin can define zones within fields (full field, half field, etc.)
- **Reservation System**: Users can browse fields and make reservation requests
- **Admin Approval**: Admin can approve or deny reservation requests
- **Responsive Design**: Mobile-friendly interface

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Neon PostgreSQL (Serverless)
- **ORM**: Drizzle ORM
- **Authentication**: NextAuth.js
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Neon account (for PostgreSQL database)

### Setup

1. **Clone the repository**
   ```bash
   cd soccer-field-scheduler
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a Neon Database**
   - Go to [https://neon.tech](https://neon.tech)
   - Create a new project
   - Copy your connection string

4. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your values:
   ```env
   DATABASE_URL="your-neon-connection-string"
   NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
   NEXTAUTH_URL="http://localhost:3000"
   ```

5. **Push database schema**
   ```bash
   npm run db:push
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Creating an Admin User

1. Register a new user through the app
2. Connect to your Neon database and run:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
   ```

## Database Commands

- `npm run db:generate` - Generate migrations
- `npm run db:migrate` - Run migrations
- `npm run db:push` - Push schema directly (dev)
- `npm run db:studio` - Open Drizzle Studio

## Deployment to Vercel

1. Push your code to GitHub
2. Connect your repo to Vercel
3. Add environment variables in Vercel:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your production URL)
4. Deploy!

## Project Structure

```
src/
├── app/
│   ├── admin/          # Admin dashboard
│   ├── api/            # API routes
│   │   ├── auth/       # Authentication endpoints
│   │   ├── cities/     # Cities CRUD
│   │   ├── fields/     # Fields CRUD
│   │   ├── zones/      # Zones CRUD
│   │   └── reservations/ # Reservations CRUD
│   ├── cities/         # Cities pages
│   ├── fields/         # Fields pages
│   ├── login/          # Login page
│   ├── register/       # Registration page
│   ├── reservations/   # User reservations
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/
│   ├── providers/      # Context providers
│   ├── ui/             # shadcn/ui components
│   └── navbar.tsx      # Navigation bar
├── lib/
│   ├── db/
│   │   ├── index.ts    # Database connection
│   │   └── schema.ts   # Drizzle schema
│   ├── auth.ts         # NextAuth configuration
│   └── utils.ts        # Utility functions
└── types/
    └── next-auth.d.ts  # NextAuth type declarations
```

## Database Schema

- **users**: User accounts with roles (user/admin)
- **cities**: City locations
- **fields**: Soccer fields belonging to cities
- **zones**: Zones/sections within fields
- **reservations**: Booking requests with status tracking

## License

MIT