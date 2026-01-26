import path from 'node:path'
import fs from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export type BuildResumeFilenameArgs = {
  company: string
  role: string
  dateISO: string // YYYY-MM-DD
}

export function buildResumeFilename({ company, role, dateISO }: BuildResumeFilenameArgs): string {
  const sanitize = (value: string) =>
    value
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .replace(/_+/g, '_')
      .slice(0, 80) || 'Unknown'

  const safeCompany = sanitize(company)
  const safeRole = sanitize(role)
  const safeDate = sanitize(dateISO)
  return `${safeCompany}_${safeRole}_${safeDate}.pdf`
}

export type GenerateOnePageResumeArgs = {
  templateDir: string
  outDir: string
  outFileName: string
  /**
   * Optional LaTeX file contents to compile instead of the template's main.tex.
   * This is used by the tailoring engine to inject a customized resume.
   */
  tex?: string
  /**
   * Template entry filename. Default: main.tex
   */
  entryTexFile?: string
}

export type GenerateOnePageResumeResult = {
  pages: number
  removedItems: number
  pdfPath: string
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p, fsConstants.R_OK)
    return true
  } catch {
    return false
  }
}

async function tryGetPdfPages(pdfPath: string): Promise<number> {
  // Prefer pdfinfo (poppler-utils). If not installed, return 1.
  try {
    const { stdout } = await execFileAsync('pdfinfo', [pdfPath], { timeout: 15_000 })
    const match = stdout.match(/Pages:\s+(\d+)/i)
    if (match) return Number(match[1])
  } catch {
    // ignore
  }
  return 1
}

export async function generateOnePageResume({
  templateDir,
  outDir,
  outFileName,
  tex,
  entryTexFile = 'main.tex',
}: GenerateOnePageResumeArgs): Promise<GenerateOnePageResumeResult> {
  const entryPath = path.join(templateDir, entryTexFile)
  const templateExists = await fileExists(entryPath)
  if (!templateExists && !tex) {
    throw new Error(`Resume template not found: ${entryPath}`)
  }

  await fs.mkdir(outDir, { recursive: true })

  // Copy template directory into outDir so relative assets work (if any).
  // We keep this simple and overwrite existing files.
  const entries = await fs.readdir(templateDir, { withFileTypes: true }).catch(() => [])
  await Promise.all(
    entries
      .filter((e) => e.isFile())
      .map(async (e) => {
        const src = path.join(templateDir, e.name)
        const dest = path.join(outDir, e.name)
        await fs.copyFile(src, dest)
      })
  )

  const workEntry = path.join(outDir, entryTexFile)
  if (tex) {
    await fs.writeFile(workEntry, tex, 'utf8')
  } else if (!(await fileExists(workEntry))) {
    // If copy failed for some reason, fall back to reading template and writing it.
    const src = await fs.readFile(entryPath, 'utf8')
    await fs.writeFile(workEntry, src, 'utf8')
  }

  // Compile LaTeX → PDF using latexmk (must be installed on the machine).
  // Output will be `${entryBasename}.pdf` in outDir.
  const entryBase = path.parse(entryTexFile).name
  try {
    await execFileAsync(
      'latexmk',
      [
        '-pdf',
        '-interaction=nonstopmode',
        '-halt-on-error',
        '-file-line-error',
        entryTexFile,
      ],
      { cwd: outDir, timeout: 120_000 }
    )
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : 'latexmk failed (is it installed?)'
    throw new Error(`Failed to compile resume PDF: ${msg}`)
  }

  const producedPdf = path.join(outDir, `${entryBase}.pdf`)
  if (!(await fileExists(producedPdf))) {
    throw new Error(`Resume PDF not produced at expected path: ${producedPdf}`)
  }

  const finalPdfPath = path.join(outDir, outFileName)
  if (path.basename(finalPdfPath) !== path.basename(producedPdf)) {
    await fs.rename(producedPdf, finalPdfPath).catch(async () => {
      // If rename fails across devices, copy+unlink.
      await fs.copyFile(producedPdf, finalPdfPath)
      await fs.unlink(producedPdf)
    })
  }

  const pages = await tryGetPdfPages(finalPdfPath)
  return { pages, removedItems: 0, pdfPath: finalPdfPath }
}

import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export const RESUME_OWNER = {
  first: 'Anudeep',
  last: 'Adiraju',
} as const

export function sanitizeForFilename(input: string) {
  return input
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .replace(/_{2,}/g, '_')
    .slice(0, 80)
}

export function buildResumeFilename(args: { company: string; role: string; dateISO: string }) {
  const company = sanitizeForFilename(args.company || 'Company')
  const role = sanitizeForFilename(args.role || 'Role')
  // User-confirmed format: Adiraju_Anudeep_{Company}_{Role}_{YYYY-MM-DD}.pdf
  return `${RESUME_OWNER.last}_${RESUME_OWNER.first}_${company}_${role}_${args.dateISO}.pdf`
}

async function copyDir(src: string, dest: string) {
  await fs.mkdir(dest, { recursive: true })
  const entries = await fs.readdir(src, { withFileTypes: true })
  for (const e of entries) {
    const from = path.join(src, e.name)
    const to = path.join(dest, e.name)
    if (e.isDirectory()) await copyDir(from, to)
    else if (e.isFile()) await fs.copyFile(from, to)
  }
}

function injectPageCounter(tex: string) {
  if (tex.includes('PAGES:')) return tex
  return tex.replace(
    /\\end\\{document\\}/,
    '\\n% page counter injected by generator\\n\\\\AtEndDocument{\\\\typeout{PAGES:\\\\thepage}}\\n\\\\end{document}'
  )
}

function diversifyActionVerbsInItems(tex: string) {
  // Only touch bullet lines, avoid changing section headings like "Feature Engineering"
  const replacements: Record<
    string,
    { maxKeep: number; alts: string[] }
  > = {
    engineered: { maxKeep: 1, alts: ['designed', 'created', 'constructed'] },
    developed: { maxKeep: 1, alts: ['enhanced', 'expanded', 'improved'] },
    enabled: { maxKeep: 1, alts: ['facilitated', 'permitted', 'allowed'] },
  }

  const counts: Record<string, number> = { engineered: 0, developed: 0, enabled: 0 }
  const altIdx: Record<string, number> = { engineered: 0, developed: 0, enabled: 0 }

  const lines = tex.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*\\item\b/.test(lines[i])) continue

    for (const key of Object.keys(replacements)) {
      const re = new RegExp(`\\b${key}\\b`, 'g')
      lines[i] = lines[i].replace(re, (m) => {
        counts[key] += 1
        if (counts[key] <= replacements[key].maxKeep) return m
        const alts = replacements[key].alts
        const rep = alts[altIdx[key] % alts.length]
        altIdx[key] += 1
        return rep
      })
    }
  }

  return lines.join('\n')
}

function applyAtsLatexCleanups(tex: string) {
  // Improves ATS text extraction by removing math-mode wrappers like $42\\%$ or $55\\mathrm{K}+$.
  // Safe for this template style; conservative patterns only.
  let out = tex

  // $42\\%$ -> 42\\%
  out = out.replace(/\$(\d+)\s*\\%?\$/g, (_m, n) => `${n}\\%`)

  // $55\\mathrm{K}+$ -> 55K+
  out = out.replace(/\$(\d+)\s*\\mathrm\{K\}\+\$/g, (_m, n) => `${n}K+`)

  // $500\\mathrm{K}+$ -> 500K+
  out = out.replace(/\$(\d+)\s*\\mathrm\{K\}\+\$/g, (_m, n) => `${n}K+`)

  // $12+$ -> 12+
  out = out.replace(/\$(\d+)\+\$/g, (_m, n) => `${n}+`)

  // Normalize common hyphenations
  out = out.replace(/\buse-cases\b/g, 'use cases')
  out = out.replace(/\bhigh-dimensionality\b/g, 'high-dimensional')
  out = out.replace(/\bbest-fit\b/g, 'best fit')

  // Collapse accidental double spaces
  out = out.replace(/[ \t]{2,}/g, ' ')

  return out
}

function removeLastItemLine(tex: string) {
  // Conservative: remove the last line that starts with \item (template uses one-line bullets)
  const lines = tex.split('\n')
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^\s*\\item\b/.test(lines[i])) {
      lines.splice(i, 1)
      return { tex: lines.join('\n'), removed: true }
    }
  }
  return { tex, removed: false }
}

async function runLatexmk(cwd: string) {
  // latexmk must be installed on the machine/container
  const { stdout, stderr } = await execFileAsync(
    'latexmk',
    ['-pdf', '-interaction=nonstopmode', '-halt-on-error', 'main.tex'],
    { cwd, timeout: 120_000 }
  )
  return { stdout: String(stdout || ''), stderr: String(stderr || '') }
}

async function getPageCountFromLog(cwd: string) {
  const logPath = path.join(cwd, 'main.log')
  const log = await fs.readFile(logPath, 'utf8').catch(() => '')
  const m = log.match(/PAGES:(\d+)/)
  if (!m) return null
  return Number(m[1])
}

export async function generateOnePageResume(args: {
  templateDir: string
  outDir: string
  outFileName: string
}): Promise<{ pdfPath: string; pages: number; removedItems: number }> {
  // Basic validation up-front for clearer errors
  const templateMain = path.join(args.templateDir, 'main.tex')
  await fs
    .access(templateMain)
    .catch(() => {
      throw new Error(`Resume template not found: ${templateMain}`)
    })

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'resume-'))
  try {
    await copyDir(args.templateDir, tempDir)
    const mainPath = path.join(tempDir, 'main.tex')
    let tex = await fs.readFile(mainPath, 'utf8')
    tex = injectPageCounter(tex)
    tex = diversifyActionVerbsInItems(tex)
    tex = applyAtsLatexCleanups(tex)
    await fs.writeFile(mainPath, tex, 'utf8')

    let removedItems = 0
    for (let attempt = 0; attempt < 30; attempt++) {
      try {
        await runLatexmk(tempDir)
      } catch (e) {
        throw new Error(
          `LaTeX build failed. Ensure latexmk is installed (e.g. install TeX Live + latexmk). ${e instanceof Error ? e.message : ''}`.trim()
        )
      }

      const pages = (await getPageCountFromLog(tempDir)) ?? 1
      if (pages <= 1) {
        const pdfSrc = path.join(tempDir, 'main.pdf')
        const pdfDest = path.join(args.outDir, args.outFileName)
        await fs.mkdir(args.outDir, { recursive: true })
        await fs.copyFile(pdfSrc, pdfDest)
        return { pdfPath: pdfDest, pages, removedItems }
      }

      // Too long: remove last bullet and retry
      const updated = removeLastItemLine(tex)
      if (!updated.removed) {
        throw new Error('Resume overflowed beyond 1 page and no more bullet items could be removed automatically.')
      }
      tex = updated.tex
      removedItems += 1
      await fs.writeFile(mainPath, tex, 'utf8')
    }

    throw new Error('Failed to reduce resume to 1 page within retry budget.')
  } finally {
    // Best-effort cleanup
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})
  }
}

