import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const applications = [
    {
      company: 'NVIDIA',
      jobTitle: 'GPU Architecture Engineer',
      jobUrl: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite',
      location: 'Santa Clara, CA',
      locationType: 'Hybrid',
      salaryMin: 150000,
      salaryMax: 200000,
      currency: 'USD',
      status: 'Applied',
      priority: 'High',
      source: 'Company Website',
      contactPerson: 'Sarah Chen',
      contactEmail: 'sarah.chen@nvidia.com',
      appliedDate: new Date('2024-01-15'),
      notes: 'Exciting opportunity to work on next-generation GPU architectures. Strong background in computer architecture required.'
    },
    {
      company: 'PMG',
      jobTitle: 'Graduate Leadership Program',
      jobUrl: 'https://www.pmg.com/careers',
      location: 'New York, NY',
      locationType: 'Onsite',
      salaryMin: 80000,
      salaryMax: 100000,
      currency: 'USD',
      status: 'Phone Screen',
      priority: 'Medium',
      source: 'LinkedIn',
      contactPerson: 'Michael Rodriguez',
      contactEmail: 'michael.rodriguez@pmg.com',
      appliedDate: new Date('2024-01-18'),
      notes: 'Leadership development program for new graduates. Great opportunity for career growth and mentorship.'
    },
    {
      company: 'Handshake',
      jobTitle: 'AI Research Engineer',
      jobUrl: 'https://joinhandshake.com/careers',
      location: 'San Francisco, CA',
      locationType: 'Remote',
      salaryMin: 130000,
      salaryMax: 170000,
      currency: 'USD',
      status: 'Technical Interview',
      priority: 'High',
      source: 'Referral',
      contactPerson: 'Dr. Jennifer Liu',
      contactEmail: 'jennifer.liu@handshake.com',
      appliedDate: new Date('2024-01-20'),
      notes: 'Research-focused role working on machine learning algorithms for career matching. Strong ML background preferred.'
    },
    {
      company: 'Cloudflare',
      jobTitle: 'Software Engineer, Bots + Fraud Detection',
      jobUrl: 'https://www.cloudflare.com/careers',
      location: 'Austin, TX',
      locationType: 'Hybrid',
      salaryMin: 120000,
      salaryMax: 160000,
      currency: 'USD',
      status: 'Final Interview',
      priority: 'High',
      source: 'Company Website',
      contactPerson: 'Alex Thompson',
      contactEmail: 'alex.thompson@cloudflare.com',
      appliedDate: new Date('2024-01-22'),
      notes: 'Building systems to detect and prevent fraudulent activities. Security and distributed systems experience valuable.'
    },
    {
      company: 'Optiver',
      jobTitle: 'Trading/Engineering Role',
      jobUrl: 'https://optiver.com/careers',
      location: 'Chicago, IL',
      locationType: 'Onsite',
      salaryMin: 200000,
      salaryMax: 300000,
      currency: 'USD',
      status: 'Rejected',
      priority: 'High',
      source: 'Glassdoor',
      contactPerson: 'Emma Williams',
      contactEmail: 'emma.williams@optiver.com',
      appliedDate: new Date('2024-01-10'),
      notes: 'High-frequency trading firm looking for engineers with strong mathematical and programming skills. Very competitive compensation.'
    }
  ]

  for (const appData of applications) {
    const application = await prisma.application.create({
      data: appData
    })

    await prisma.activity.create({
      data: {
        applicationId: application.id,
        type: 'Status Change',
        description: `Application created with status: ${application.status}`,
        date: application.appliedDate
      }
    })

    if (application.status === 'Phone Screen') {
      await prisma.activity.create({
        data: {
          applicationId: application.id,
          type: 'Interview',
          description: 'Phone screen scheduled',
          date: new Date(application.appliedDate.getTime() + 7 * 24 * 60 * 60 * 1000)
        }
      })
    }

    if (application.status === 'Technical Interview') {
      await prisma.activity.create({
        data: {
          applicationId: application.id,
          type: 'Interview',
          description: 'Phone screen completed',
          date: new Date(application.appliedDate.getTime() + 7 * 24 * 60 * 60 * 1000)
        }
      })
      
      await prisma.activity.create({
        data: {
          applicationId: application.id,
          type: 'Interview',
          description: 'Technical interview scheduled',
          date: new Date(application.appliedDate.getTime() + 14 * 24 * 60 * 60 * 1000)
        }
      })
    }

    if (application.status === 'Final Interview') {
      await prisma.activity.create({
        data: {
          applicationId: application.id,
          type: 'Interview',
          description: 'Phone screen completed',
          date: new Date(application.appliedDate.getTime() + 5 * 24 * 60 * 60 * 1000)
        }
      })
      
      await prisma.activity.create({
        data: {
          applicationId: application.id,
          type: 'Interview',
          description: 'Technical interview completed',
          date: new Date(application.appliedDate.getTime() + 12 * 24 * 60 * 60 * 1000)
        }
      })
      
      await prisma.activity.create({
        data: {
          applicationId: application.id,
          type: 'Interview',
          description: 'Final interview scheduled',
          date: new Date(application.appliedDate.getTime() + 19 * 24 * 60 * 60 * 1000)
        }
      })
    }

    if (application.status === 'Rejected') {
      await prisma.activity.create({
        data: {
          applicationId: application.id,
          type: 'Status Change',
          description: 'Application rejected after initial review',
          date: new Date(application.appliedDate.getTime() + 21 * 24 * 60 * 60 * 1000)
        }
      })
    }

    if (application.status !== 'Rejected' && application.status !== 'Applied') {
      await prisma.reminder.create({
        data: {
          applicationId: application.id,
          title: 'Follow up on application',
          description: 'Send a follow-up email about the application status',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          completed: false
        }
      })
    }
  }

  console.log('Seed data created successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })