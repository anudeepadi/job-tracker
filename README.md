# Job Search Platform

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/clone?template=https://github.com/anudeepadi/job-tracker)

> A unified job search platform with AI-powered job tracking and analysis capabilities.

## Overview

Job Search Platform is a full-stack monorepo application designed to streamline your job search process. It combines a modern Next.js frontend with a Python FastAPI backend powered by AI agents to help you track applications, analyze opportunities, and manage your job search efficiently.

## Features

### Job Application Management
- **Comprehensive Tracking**: Monitor applications from submission to offer
- **Status Management**: Track progress through Applied → Interview → Offer/Rejected stages
- **Activity Timeline**: View detailed history of all application activities
- **Bulk Operations**: Select, update, delete, and apply to multiple jobs at once
- **CSV Export**: Export your applications data for analysis

### AI-Powered Search
- **Intelligent Job Search**: AI-powered job discovery using CrewAI agents
- **Auto-Import**: Automatically import jobs from search results
- **Job Parsing**: Parse and extract job details from various sources
- **Apply Templates**: Create reusable application templates
- **Search Presets**: Save and reuse common search configurations

### User Experience
- **Dashboard Analytics**: Visual insights into your job search progress
- **Reminders & Notifications**: Never miss a follow-up or interview
- **Dark Mode**: Full dark mode support for comfortable viewing
- **Keyboard Shortcuts**: Efficient navigation and actions
- **Responsive Design**: Works seamlessly on desktop and mobile

### Security & Performance
- **JWT Authentication**: Secure user authentication and session management
- **Rate Limiting**: API protection against abuse
- **Health Checks**: Automated dependency validation
- **Optimized Performance**: Built with Next.js 15 and React 19

## Tech Stack

### Frontend
- **Framework**: Next.js 15.5.2 with App Router
- **UI Library**: React 19.1.0
- **Styling**: Tailwind CSS v4
- **Components**: Radix UI & shadcn/ui
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization
- **Authentication**: JWT with jose & bcryptjs

### Backend
- **API**: Python FastAPI with Uvicorn
- **AI Agents**: CrewAI for intelligent job search
- **AI APIs**: Anthropic Claude, OpenAI, Google Gemini

### Database
- **Primary DB**: PostgreSQL 16
- **ORM**: Prisma
- **Containerization**: Docker & Docker Compose

### DevOps
- **Package Manager**: pnpm 9.0.0
- **Deployment**: Railway (primary), Vercel (fallback)
- **CI/CD**: Automated migrations and health checks

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Python 3.9+
- Docker (for local PostgreSQL)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd job-tracker
   ```

2. **Run the setup script**
   ```bash
   npm run setup
   ```
   This will:
   - Install pnpm if not present
   - Install Node.js dependencies
   - Set up Python virtual environment
   - Generate `.env` from `.env.example`
   - Create Prisma client
   - Validate installations

3. **Configure environment variables**

   Edit `.env` and add your API keys:
   ```env
   # Database
   DATABASE_URL="postgresql://jobtracker:jobtracker_dev_password@localhost:5432/jobtracker"

   # AI APIs (at least one required)
   ANTHROPIC_API_KEY=your_key_here
   OPENAI_API_KEY=your_key_here
   GOOGLE_API_KEY=your_key_here

   # Job Search APIs (optional)
   ADZUNA_APP_ID=your_app_id
   ADZUNA_API_KEY=your_api_key

   # Authentication
   JWT_SECRET=your-long-random-secret-string
   ```

4. **Start the database**
   ```bash
   npm run db:start
   ```

5. **Run database migrations**
   ```bash
   cd apps/web
   pnpm prisma migrate deploy
   cd ../..
   ```

6. **Start the development servers**
   ```bash
   npm run dev
   ```

   This starts:
   - Next.js frontend at http://localhost:3000
   - Python backend at http://localhost:8000
   - API docs at http://localhost:8000/docs

## Available Scripts

### Development
```bash
npm run dev              # Start all services in development mode
npm run dev:web          # Start Next.js frontend only
npm run dev:agent        # Start Python backend only
npm run dev:parallel     # Start all services in parallel
```

### Production
```bash
npm run build            # Build all packages
npm run start            # Start in production mode
```

### Database
```bash
npm run db:start         # Start PostgreSQL with Docker
npm run db:stop          # Stop PostgreSQL
npm run db:logs          # View database logs
npm run db:reset         # Reset database and run migrations
npm run db:studio        # Open Prisma Studio
```

### Utilities
```bash
npm run lint             # Lint all packages
npm run test             # Run all tests
npm run clean            # Clean build artifacts
npm run migrate-data     # Migrate agent output data
```

## Project Structure

```
job-tracker/
├── apps/
│   └── web/                    # Next.js frontend application
│       ├── src/
│       │   ├── app/           # App Router pages & API routes
│       │   ├── components/    # React components
│       │   └── lib/          # Utilities and types
│       ├── prisma/           # Database schema & migrations
│       └── railway.toml      # Railway deployment config
│
├── services/
│   └── job-agent/             # Python FastAPI backend
│       ├── app/
│       │   ├── main.py       # FastAPI entry point
│       │   ├── models/       # Pydantic models
│       │   ├── routers/      # API endpoints
│       │   └── services/     # CrewAI logic
│       └── requirements.txt  # Python dependencies
│
├── scripts/                   # Automation scripts
│   ├── setup.sh              # Initial setup
│   ├── start-dev.sh          # Development server
│   └── start-prod.sh         # Production server
│
├── data/                      # Application data
│   ├── agent-outputs/        # AI agent results
│   └── generated-resumes/    # Resume outputs
│
└── docker-compose.yml         # Docker services
```

## Database Schema

### Core Models

- **User**: User accounts and authentication
- **Session**: JWT session management
- **Application**: Job applications with status tracking
- **Activity**: Timeline events for applications
- **Reminder**: Notifications and reminders
- **ApplyTemplate**: Reusable application templates
- **SearchPreset**: Saved search configurations
- **UserPreference**: User settings and preferences

## API Documentation

### Frontend API Routes (`/api/*`)

- `/auth/*` - Authentication (login, register, logout)
- `/applications/*` - Job application CRUD
- `/activities/*` - Activity timeline management
- `/reminders/*` - Reminder management
- `/apply-templates/*` - Template CRUD
- `/ai-search/*` - AI-powered job search
- `/job-search/*` - Job search functionality
- `/user/*` - User profile and preferences
- `/admin/*` - Admin operations and health checks

### Backend API (Python FastAPI)

Visit http://localhost:8000/docs for interactive API documentation (Swagger UI).

## Deployment

### Railway (Recommended)

Click the Deploy to Railway button at the top of this README or follow these steps:

1. **Fork this repository**

2. **Create a new Railway project**
   - Connect your GitHub repository
   - Add PostgreSQL database service

3. **Configure environment variables**
   - Add all required variables from `.env.example`
   - Railway will auto-generate `DATABASE_URL`

4. **Deploy**
   - Railway will automatically build and deploy
   - Migrations run automatically on deploy

### Manual Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

### Docker Deployment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Configuration

### Environment Variables

All configuration is done through environment variables. See `.env.example` for a complete list of available options.

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing
- At least one AI API key (Anthropic, OpenAI, or Google)

Optional variables:
- `ADZUNA_APP_ID` & `ADZUNA_API_KEY` - For Adzuna job search
- `LINKEDIN_RAPIDAPI_KEY` - For LinkedIn job search
- `NODE_ENV` - Environment mode (development/production)

### Railway Configuration

The project includes `railway.toml` configuration:
- Automatic database migrations on deploy
- Health check endpoint at `/`
- Restart policy with max 3 retries
- 100s health check timeout

## Development Guides

- [Docker Setup Guide](./DOCKER_SETUP.md) - Docker configuration details
- [Scripts Documentation](./SCRIPTS_DOCUMENTATION.md) - Detailed script reference
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - Feature overview

## Troubleshooting

### Common Issues

**Port already in use**
```bash
# Kill process on port 3000 (Next.js)
lsof -ti:3000 | xargs kill -9

# Kill process on port 8000 (Python)
lsof -ti:8000 | xargs kill -9
```

**Database connection issues**
```bash
# Ensure PostgreSQL is running
npm run db:start

# Check database logs
npm run db:logs

# Reset database
npm run db:reset
```

**Python dependencies issues**
```bash
# Recreate virtual environment
cd services/job-agent
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Prisma client issues**
```bash
# Regenerate Prisma client
cd apps/web
pnpm prisma generate
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or contributions, please open an issue on GitHub.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- AI powered by [CrewAI](https://www.crewai.io/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Deployed on [Railway](https://railway.app/)
