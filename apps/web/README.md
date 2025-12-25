# Job Application Tracker

A modern, full-stack job application tracking dashboard built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Dashboard Overview**: Statistics cards showing total applications, response rate, and weekly/monthly metrics
- **Application Management**: Add, edit, and delete job applications with comprehensive details
- **Status Tracking**: Track application progress from "Applied" to "Offer" or "Rejected"
- **Analytics**: Visual charts showing application timeline, status distribution, and source statistics
- **Export**: Export all applications to CSV format
- **Responsive Design**: Mobile-first responsive interface with dark mode support

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Database**: SQLite (local) / PostgreSQL (production)
- **ORM**: Prisma
- **Styling**: Tailwind CSS with shadcn/ui components
- **Charts**: Recharts
- **Forms**: React Hook Form
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd job-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
cp .env.example .env
npx prisma generate
npx prisma db push
```

4. Seed the database with sample data:
```bash
npm run db:seed
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### Application Model
- Basic info: company, job title, location, salary range
- Status tracking: Applied, Phone Screen, Technical Interview, Final Interview, Offer, Rejected
- Contact info: recruiter details, application source
- Metadata: applied date, notes, priority level

### Activity Model
- Track status changes and interview activities
- Automatic activity logging for status updates

### Reminder Model
- Set follow-up reminders for applications
- Mark reminders as completed

## API Endpoints

- `GET /api/applications` - List applications with pagination and filtering
- `POST /api/applications` - Create new application
- `GET /api/applications/[id]` - Get single application with activities
- `PUT /api/applications/[id]` - Update application
- `DELETE /api/applications/[id]` - Delete application
- `GET /api/applications/stats` - Dashboard statistics
- `GET /api/applications/export` - Export to CSV

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set up environment variables in Vercel dashboard:
   - `DATABASE_URL` - Your production database URL
4. Deploy!

For production, consider using Vercel Postgres or another PostgreSQL provider.

### Environment Variables

Create a `.env` file with:

```env
DATABASE_URL="file:./dev.db"
```

For production with PostgreSQL:
```env
DATABASE_URL="postgresql://username:password@host:port/database"
```

## Sample Data

The application includes seed data with 5 sample job applications:

1. **NVIDIA** - GPU Architecture Engineer (Applied)
2. **PMG** - Graduate Leadership Program (Phone Screen)
3. **Handshake** - AI Research Engineer (Technical Interview)
4. **Cloudflare** - Software Engineer, Bots + Fraud Detection (Final Interview)
5. **Optiver** - Trading/Engineering Role (Rejected)

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:seed` - Seed database with sample data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.
