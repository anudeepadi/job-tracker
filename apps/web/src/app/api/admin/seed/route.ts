import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function assertDev() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Admin seed is disabled in production')
  }
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

const DEMO_APPLICATIONS = [
  { company: 'Google', jobTitle: 'Senior Software Engineer', status: 'Final Interview', priority: 'High', source: 'LinkedIn', location: 'Mountain View, CA', locationType: 'Hybrid', salaryMin: 180000, salaryMax: 250000, daysAgo: 21 },
  { company: 'Stripe', jobTitle: 'Full Stack Engineer', status: 'Offer', priority: 'High', source: 'Referral', location: 'San Francisco, CA', locationType: 'Remote', salaryMin: 190000, salaryMax: 240000, daysAgo: 30 },
  { company: 'Meta', jobTitle: 'Production Engineer', status: 'Technical Interview', priority: 'High', source: 'LinkedIn', location: 'Menlo Park, CA', locationType: 'Hybrid', salaryMin: 170000, salaryMax: 230000, daysAgo: 18 },
  { company: 'Vercel', jobTitle: 'Software Engineer, Platform', status: 'Interviewing', priority: 'High', source: 'Company Website', location: 'Remote', locationType: 'Remote', salaryMin: 160000, salaryMax: 210000, daysAgo: 14 },
  { company: 'Anthropic', jobTitle: 'ML Engineer', status: 'Applied', priority: 'High', source: 'AI Search', location: 'San Francisco, CA', locationType: 'Onsite', salaryMin: 200000, salaryMax: 300000, daysAgo: 3 },
  { company: 'OpenAI', jobTitle: 'Backend Engineer', status: 'Applied', priority: 'High', source: 'LinkedIn', location: 'San Francisco, CA', locationType: 'Onsite', salaryMin: 195000, salaryMax: 280000, daysAgo: 5 },
  { company: 'Netflix', jobTitle: 'Senior UI Engineer', status: 'Phone Screen', priority: 'Medium', source: 'Recruiter', location: 'Los Gatos, CA', locationType: 'Hybrid', salaryMin: 200000, salaryMax: 260000, daysAgo: 12 },
  { company: 'Apple', jobTitle: 'iOS Software Engineer', status: 'Rejected', priority: 'High', source: 'Company Website', location: 'Cupertino, CA', locationType: 'Onsite', salaryMin: 175000, salaryMax: 240000, daysAgo: 35 },
  { company: 'Figma', jobTitle: 'Product Engineer', status: 'Interviewing', priority: 'Medium', source: 'LinkedIn', location: 'San Francisco, CA', locationType: 'Hybrid', salaryMin: 160000, salaryMax: 220000, daysAgo: 10 },
  { company: 'Notion', jobTitle: 'Full Stack Developer', status: 'Applied', priority: 'Medium', source: 'Indeed', location: 'New York, NY', locationType: 'Hybrid', salaryMin: 150000, salaryMax: 200000, daysAgo: 2 },
  { company: 'Databricks', jobTitle: 'Data Platform Engineer', status: 'Technical Interview', priority: 'High', source: 'Recruiter', location: 'San Francisco, CA', locationType: 'Hybrid', salaryMin: 180000, salaryMax: 250000, daysAgo: 16 },
  { company: 'Coinbase', jobTitle: 'Backend Engineer', status: 'Applied', priority: 'Medium', source: 'AI Search', location: 'Remote', locationType: 'Remote', salaryMin: 155000, salaryMax: 210000, daysAgo: 4 },
  { company: 'Airbnb', jobTitle: 'Software Engineer II', status: 'Offer', priority: 'High', source: 'Referral', location: 'San Francisco, CA', locationType: 'Hybrid', salaryMin: 170000, salaryMax: 230000, daysAgo: 28 },
  { company: 'Shopify', jobTitle: 'Senior Developer', status: 'Rejected', priority: 'Medium', source: 'LinkedIn', location: 'Remote', locationType: 'Remote', salaryMin: 145000, salaryMax: 195000, daysAgo: 40 },
  { company: 'Twilio', jobTitle: 'Platform Engineer', status: 'Applied', priority: 'Low', source: 'Indeed', location: 'San Francisco, CA', locationType: 'Hybrid', salaryMin: 140000, salaryMax: 190000, daysAgo: 6 },
  { company: 'Supabase', jobTitle: 'Full Stack Engineer', status: 'Applied', priority: 'Medium', source: 'AI Search', location: 'Remote', locationType: 'Remote', salaryMin: 150000, salaryMax: 200000, daysAgo: 1 },
  { company: 'Linear', jobTitle: 'Software Engineer', status: 'Phone Screen', priority: 'High', source: 'Company Website', location: 'Remote', locationType: 'Remote', salaryMin: 155000, salaryMax: 205000, daysAgo: 8 },
  { company: 'Datadog', jobTitle: 'Site Reliability Engineer', status: 'Rejected', priority: 'Medium', source: 'LinkedIn', location: 'New York, NY', locationType: 'Hybrid', salaryMin: 160000, salaryMax: 215000, daysAgo: 45 },
  { company: 'Palantir', jobTitle: 'Forward Deployed Engineer', status: 'Withdrawn', priority: 'Low', source: 'Recruiter', location: 'Palo Alto, CA', locationType: 'Onsite', salaryMin: 145000, salaryMax: 200000, daysAgo: 50 },
  { company: 'Cloudflare', jobTitle: 'Systems Engineer', status: 'Applied', priority: 'Medium', source: 'LinkedIn', location: 'Austin, TX', locationType: 'Hybrid', salaryMin: 150000, salaryMax: 200000, daysAgo: 7 },
  { company: 'Scale AI', jobTitle: 'ML Platform Engineer', status: 'Interviewing', priority: 'High', source: 'AI Search', location: 'San Francisco, CA', locationType: 'Onsite', salaryMin: 175000, salaryMax: 240000, daysAgo: 9 },
  { company: 'Ramp', jobTitle: 'Backend Engineer', status: 'Applied', priority: 'Medium', source: 'Indeed', location: 'New York, NY', locationType: 'Hybrid', salaryMin: 160000, salaryMax: 210000, daysAgo: 3 },
  { company: 'Plaid', jobTitle: 'API Engineer', status: 'Technical Interview', priority: 'High', source: 'Referral', location: 'San Francisco, CA', locationType: 'Hybrid', salaryMin: 170000, salaryMax: 225000, daysAgo: 15 },
  { company: 'Discord', jobTitle: 'Infrastructure Engineer', status: 'Applied', priority: 'Medium', source: 'LinkedIn', location: 'San Francisco, CA', locationType: 'Remote', salaryMin: 165000, salaryMax: 220000, daysAgo: 5 },
  { company: 'Retool', jobTitle: 'Frontend Engineer', status: 'Phone Screen', priority: 'Medium', source: 'Company Website', location: 'San Francisco, CA', locationType: 'Hybrid', salaryMin: 150000, salaryMax: 195000, daysAgo: 11 },
  { company: 'Deel', jobTitle: 'Senior Backend Developer', status: 'Applied', priority: 'Low', source: 'AI Search', location: 'Remote', locationType: 'Remote', salaryMin: 140000, salaryMax: 190000, daysAgo: 2 },
  { company: 'Neon', jobTitle: 'Database Engineer', status: 'Interviewing', priority: 'High', source: 'Recruiter', location: 'Remote', locationType: 'Remote', salaryMin: 165000, salaryMax: 215000, daysAgo: 13 },
  { company: 'Fly.io', jobTitle: 'Platform Engineer', status: 'Rejected', priority: 'Low', source: 'Company Website', location: 'Remote', locationType: 'Remote', salaryMin: 130000, salaryMax: 175000, daysAgo: 42 },
  { company: 'Replit', jobTitle: 'AI Engineer', status: 'Applied', priority: 'High', source: 'AI Search', location: 'San Francisco, CA', locationType: 'Hybrid', salaryMin: 170000, salaryMax: 230000, daysAgo: 1 },
] as const

export async function POST(request: NextRequest) {
  try {
    assertDev()

    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const created = await prisma.$transaction(async (tx) => {
      const apps = []
      for (const demo of DEMO_APPLICATIONS) {
        const app = await tx.application.create({
          data: {
            userId,
            company: demo.company,
            jobTitle: demo.jobTitle,
            status: demo.status,
            priority: demo.priority,
            source: demo.source,
            location: demo.location,
            locationType: demo.locationType,
            salaryMin: demo.salaryMin,
            salaryMax: demo.salaryMax,
            currency: 'USD',
            appliedDate: daysAgo(demo.daysAgo),
            notes: `Applied for ${demo.jobTitle} at ${demo.company}`,
          },
        })
        apps.push(app)

        // Add activity for each
        await tx.activity.create({
          data: {
            applicationId: app.id,
            type: 'Status Change',
            description: `Application submitted to ${demo.company}`,
            date: daysAgo(demo.daysAgo),
          },
        })

        // Add interview activities for interview-stage apps
        if (['Phone Screen', 'Technical Interview', 'Final Interview', 'Interviewing'].includes(demo.status)) {
          await tx.activity.create({
            data: {
              applicationId: app.id,
              type: 'Interview',
              description: `${demo.status} scheduled with ${demo.company}`,
              date: daysAgo(Math.max(0, demo.daysAgo - 5)),
            },
          })
        }

        // Add offer activities
        if (demo.status === 'Offer') {
          await tx.activity.create({
            data: {
              applicationId: app.id,
              type: 'Status Change',
              description: `Received offer from ${demo.company}!`,
              date: daysAgo(Math.max(0, demo.daysAgo - 10)),
            },
          })
        }
      }
      return apps
    })

    return NextResponse.json({
      ok: true,
      created: created.length,
      message: `Seeded ${created.length} demo applications`,
    })
  } catch (error) {
    console.error('Admin seed error:', error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
