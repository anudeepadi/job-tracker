/**
 * Resume generation utilities - LaTeX compilation and file management
 */

import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs/promises'
import path from 'node:path'

const execAsync = promisify(exec)

export interface BuildFilenameOptions {
  company: string
  role: string
  dateISO: string
  suffix?: string
}

export interface GenerateResumeOptions {
  templateDir: string
  outDir: string
  outFileName: string
  entryTexFile?: string
  tex: string
}

export interface GenerateResumeResult {
  pdfPath: string
  pages: number
  removedItems: number
}

/**
 * Build a standardized resume filename
 */
export function buildResumeFilename(options: BuildFilenameOptions): string {
  const { company, role, dateISO, suffix } = options
  
  // Sanitize company and role for filename
  const sanitize = (str: string): string =>
    str
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50)
  
  const namePart = 'Adiraju_Anudeep'  // Could be made configurable
  const companyPart = sanitize(company)
  const rolePart = sanitize(role)
  const datePart = dateISO
  
  const parts = [namePart, companyPart, rolePart, datePart]
  if (suffix) parts.push(suffix)
  
  return `${parts.join('_')}.pdf`
}

/**
 * Generate a one-page resume PDF from LaTeX content
 * Requires latexmk to be installed on the system
 */
export async function generateOnePageResume(
  options: GenerateResumeOptions
): Promise<GenerateResumeResult> {
  const { templateDir, outDir, outFileName, entryTexFile = 'tailored.tex', tex } = options
  
  // Ensure output directory exists
  await fs.mkdir(outDir, { recursive: true })
  
  // Write the tailored .tex file
  const texPath = path.join(outDir, entryTexFile)
  await fs.writeFile(texPath, tex, 'utf-8')
  
  // Copy any supporting files from template directory (if they exist)
  try {
    const templateFiles = await fs.readdir(templateDir)
    for (const file of templateFiles) {
      if (file !== 'main.tex' && !file.endsWith('.pdf')) {
        const srcPath = path.join(templateDir, file)
        const destPath = path.join(outDir, file)
        const stat = await fs.stat(srcPath)
        if (stat.isFile()) {
          await fs.copyFile(srcPath, destPath)
        }
      }
    }
  } catch {
    // Template directory might not have extra files, that's okay
  }
  
  // Run latexmk to compile
  const baseName = entryTexFile.replace('.tex', '')
  const pdfName = outFileName.endsWith('.pdf') ? outFileName : `${outFileName}.pdf`
  
  try {
    // Compile with latexmk
    await execAsync(
      `latexmk -pdf -interaction=nonstopmode -output-directory="${outDir}" "${texPath}"`,
      {
        cwd: outDir,
        timeout: 60000,  // 60 second timeout
      }
    )
    
    // Rename output PDF to desired filename
    const generatedPdf = path.join(outDir, `${baseName}.pdf`)
    const finalPdf = path.join(outDir, pdfName)
    
    if (generatedPdf !== finalPdf) {
      await fs.rename(generatedPdf, finalPdf)
    }
    
    // Get page count (simple heuristic - could use pdf-lib for accuracy)
    const pages = await getPageCount(finalPdf)
    
    // Clean up auxiliary files
    await cleanupLatexAuxFiles(outDir, baseName)
    
    return {
      pdfPath: finalPdf,
      pages,
      removedItems: 0,  // Could track this during tailoring
    }
  } catch (error) {
    // Try to provide helpful error message
    const logPath = path.join(outDir, `${baseName}.log`)
    let logContent = ''
    try {
      logContent = await fs.readFile(logPath, 'utf-8')
      // Extract error lines
      const errorLines = logContent
        .split('\n')
        .filter(line => line.includes('!') || line.includes('Error'))
        .slice(0, 10)
        .join('\n')
      
      throw new Error(`LaTeX compilation failed:\n${errorLines}`)
    } catch {
      throw new Error(
        `LaTeX compilation failed. Ensure latexmk is installed: brew install mactex-no-gui`
      )
    }
  }
}

/**
 * Get page count from a PDF file
 * Simple implementation - returns 1 for small files
 */
async function getPageCount(pdfPath: string): Promise<number> {
  try {
    const content = await fs.readFile(pdfPath)
    // Count /Page objects (rough estimate)
    const matches = content.toString('binary').match(/\/Type\s*\/Page[^s]/g)
    return matches ? matches.length : 1
  } catch {
    return 1
  }
}

/**
 * Clean up LaTeX auxiliary files
 */
async function cleanupLatexAuxFiles(dir: string, baseName: string): Promise<void> {
  const auxExtensions = ['.aux', '.log', '.fls', '.fdb_latexmk', '.out', '.synctex.gz']
  
  for (const ext of auxExtensions) {
    try {
      await fs.unlink(path.join(dir, `${baseName}${ext}`))
    } catch {
      // File might not exist, that's okay
    }
  }
}

/**
 * Check if latexmk is available on the system
 */
export async function isLatexAvailable(): Promise<boolean> {
  try {
    await execAsync('which latexmk')
    return true
  } catch {
    return false
  }
}

/**
 * List generated resumes for an application
 */
export async function listGeneratedResumes(appDir: string): Promise<string[]> {
  try {
    const files = await fs.readdir(appDir)
    return files.filter(f => f.endsWith('.pdf'))
  } catch {
    return []
  }
}
