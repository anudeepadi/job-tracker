/**
 * Excel Import Script for Job Applications
 *
 * Imports job application data from the Excel tracker file
 * into the PostgreSQL database via Prisma.
 *
 * Usage: npx tsx prisma/import-excel.ts
 */

import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'
import * as path from 'path'
import * as fs from 'fs'

const prisma = new PrismaClient()

// Excel file path
const EXCEL_FILE_PATH = '/Users/vuc229/Documents/Jobs/job-search/job-tracking/Job_Applications_Tracker.xlsx'

// Column mappings from Excel to Prisma schema
interface ExcelRow {
  Company: string
  Position: string
  'Role Type': string
  Location: string
  'Direct Apply Link': string
  'Salary Range': string
  'Visa/OPT': string
  Status: string
  'Date Applied': number | null
  'Response Date': number | null
  'Interview Stage': string | null
  Notes: string
}

/**
 * Parse salary range string like "$120-180K" into min/max numbers
 */
function parseSalaryRange(salaryStr: string | null | undefined): { min: number | null; max: number | null } {
  if (!salaryStr || typeof salaryStr !== 'string') {
    return { min: null, max: null }
  }

  // Remove $ and spaces
  const cleaned = salaryStr.replace(/[$\s]/g, '')

  // Handle different formats:
  // "$120-180K" -> 120000, 180000
  // "$160K+ base" -> 160000, null
  // "$135-145K" -> 135000, 145000

  // Check for range pattern (e.g., "120-180K")
  const rangeMatch = cleaned.match(/(\d+)-(\d+)K/i)
  if (rangeMatch) {
    return {
      min: parseInt(rangeMatch[1]) * 1000,
      max: parseInt(rangeMatch[2]) * 1000
    }
  }

  // Check for single value with plus (e.g., "160K+")
  const plusMatch = cleaned.match(/(\d+)K\+/i)
  if (plusMatch) {
    return {
      min: parseInt(plusMatch[1]) * 1000,
      max: null
    }
  }

  // Check for single value (e.g., "160K")
  const singleMatch = cleaned.match(/(\d+)K/i)
  if (singleMatch) {
    const value = parseInt(singleMatch[1]) * 1000
    return { min: value, max: value }
  }

  return { min: null, max: null }
}

/**
 * Map Excel status to Prisma status
 */
function mapStatus(excelStatus: string): string {
  const statusMap: Record<string, string> = {
    'Not Applied': 'Saved',
    'Applied': 'Applied',
    'Phone Screen': 'Phone Screen',
    'Technical Interview': 'Technical Interview',
    'Final Interview': 'Final Interview',
    'Offer': 'Offer',
    'Rejected': 'Rejected',
    'Withdrawn': 'Withdrawn'
  }

  return statusMap[excelStatus] || 'Saved'
}

/**
 * Map Role Type to priority
 */
function inferPriority(roleType: string, notes: string | null): string {
  const notesLower = (notes || '').toLowerCase()

  // Check notes for priority hints
  if (notesLower.includes('perfect match') || notesLower.includes('ideal')) {
    return 'High'
  }
  if (notesLower.includes('dream') || notesLower.includes('top choice')) {
    return 'High'
  }

  // Default to Medium
  return 'Medium'
}

/**
 * Infer location type from location string
 */
function inferLocationType(location: string | null): string {
  if (!location) return 'Unknown'

  const loc = location.toLowerCase()
  if (loc.includes('remote')) return 'Remote'
  if (loc.includes('hybrid')) return 'Hybrid'
  return 'Onsite'
}

/**
 * Convert Excel date serial number to JavaScript Date
 */
function excelDateToJS(excelDate: number | null): Date {
  if (!excelDate || typeof excelDate !== 'number') {
    return new Date() // Default to today if no date
  }

  // Excel dates are days since 1899-12-30
  const date = new Date((excelDate - 25569) * 86400 * 1000)
  return date
}

async function importApplications() {
  console.log('Starting Excel import...')
  console.log(`Reading from: ${EXCEL_FILE_PATH}`)

  // Check if file exists
  if (!fs.existsSync(EXCEL_FILE_PATH)) {
    console.error(`Error: Excel file not found at ${EXCEL_FILE_PATH}`)
    process.exit(1)
  }

  // Read Excel file
  const workbook = XLSX.readFile(EXCEL_FILE_PATH)
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]

  // Convert to JSON
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(worksheet)

  console.log(`Found ${rows.length} rows to import`)

  // Track statistics
  let imported = 0
  let skipped = 0
  let errors = 0

  for (const row of rows) {
    try {
      // Skip rows without company or position
      if (!row.Company || !row.Position) {
        skipped++
        continue
      }

      // Check if this application already exists (by company + job title)
      const existing = await prisma.application.findFirst({
        where: {
          company: row.Company.trim(),
          jobTitle: row.Position.trim()
        }
      })

      if (existing) {
        console.log(`Skipping duplicate: ${row.Company} - ${row.Position}`)
        skipped++
        continue
      }

      // Parse salary
      const { min: salaryMin, max: salaryMax } = parseSalaryRange(row['Salary Range'])

      // Build notes with additional context
      const noteParts: string[] = []
      if (row.Notes) noteParts.push(row.Notes)
      if (row['Role Type']) noteParts.push(`Role Type: ${row['Role Type']}`)
      if (row['Visa/OPT'] && row['Visa/OPT'] !== 'Unknown') noteParts.push(`Visa: ${row['Visa/OPT']}`)

      // Create the application
      const application = await prisma.application.create({
        data: {
          company: row.Company.trim(),
          jobTitle: row.Position.trim(),
          jobUrl: row['Direct Apply Link'] || null,
          location: row.Location?.trim() || null,
          locationType: inferLocationType(row.Location),
          salaryMin: salaryMin,
          salaryMax: salaryMax,
          currency: 'USD',
          status: mapStatus(row.Status),
          priority: inferPriority(row['Role Type'], row.Notes),
          source: 'Excel Import',
          appliedDate: excelDateToJS(row['Date Applied']),
          notes: noteParts.join('\n\n')
        }
      })

      // Create initial activity log
      await prisma.activity.create({
        data: {
          applicationId: application.id,
          type: 'Note',
          description: `Imported from Excel tracker. Original status: ${row.Status}`,
          date: new Date()
        }
      })

      imported++
      console.log(`✓ Imported: ${row.Company} - ${row.Position}`)

    } catch (error) {
      console.error(`Error importing ${row.Company} - ${row.Position}:`, error)
      errors++
    }
  }

  console.log('\n========================================')
  console.log('Import Complete!')
  console.log('========================================')
  console.log(`Total rows:   ${rows.length}`)
  console.log(`Imported:     ${imported}`)
  console.log(`Skipped:      ${skipped}`)
  console.log(`Errors:       ${errors}`)
  console.log('========================================')
}

// Run the import
importApplications()
  .catch((error) => {
    console.error('Import failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
