/**
 * Resume tailoring utilities for generating job-specific resumes
 */

// Resume inventory structure - all possible content for the resume
export interface ResumeInventoryV1 {
  personalInfo: {
    name: string
    title: string
    tagline: string
    location: string
    phone: string
    email: string
    linkedin?: string
    github?: string
    portfolio?: string
  }
  summary: {
    default: string
    variants?: Record<string, string>  // roleTrack -> custom summary
  }
  skills: {
    category: string
    items: string[]
    priority?: number
  }[]
  education: {
    degree: string
    school: string
    gpa?: string
    graduationDate: string
    coursework?: string[]
  }[]
  experience: {
    id: string
    title: string
    company: string
    dateRange: string
    bullets: {
      text: string
      keywords: string[]
      priority?: number
    }[]
    roleTrack?: string[]  // Which role tracks this experience applies to
  }[]
  projects: {
    id: string
    name: string
    subtitle: string
    link?: string
    bullets: {
      text: string
      keywords: string[]
      priority?: number
    }[]
    roleTrack?: string[]
  }[]
  certifications?: {
    category: string
    items: string[]
  }[]
}

export interface TailoredResumeResult {
  tex: string
  roleTrack: string
  debug: {
    topKeywords: string[]
    matchedExperience: string[]
    matchedProjects: string[]
    removedBullets: number
  }
}

interface TailorOptions {
  jobTitle: string
  jobDescription: string
  inventory: ResumeInventoryV1
  maxPages?: number
}

// Common role tracks for keyword matching
const ROLE_TRACKS: Record<string, string[]> = {
  'data-scientist': ['data scientist', 'machine learning', 'ml engineer', 'analytics', 'statistical'],
  'software-engineer': ['software engineer', 'developer', 'full stack', 'backend', 'frontend'],
  'ai-engineer': ['ai engineer', 'llm', 'nlp', 'deep learning', 'neural network'],
  'data-engineer': ['data engineer', 'etl', 'pipeline', 'spark', 'airflow'],
  'product-manager': ['product manager', 'pm', 'product owner', 'roadmap'],
}

function extractKeywords(text: string): string[] {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
  
  // Count frequency
  const freq: Record<string, number> = {}
  words.forEach(w => {
    freq[w] = (freq[w] || 0) + 1
  })
  
  // Sort by frequency and return top keywords
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([word]) => word)
}

function detectRoleTrack(jobTitle: string, jobDescription: string): string {
  const combined = `${jobTitle} ${jobDescription}`.toLowerCase()
  
  for (const [track, keywords] of Object.entries(ROLE_TRACKS)) {
    const matches = keywords.filter(kw => combined.includes(kw))
    if (matches.length >= 2) {
      return track
    }
  }
  
  // Default based on job title
  if (combined.includes('data')) return 'data-scientist'
  if (combined.includes('software') || combined.includes('engineer')) return 'software-engineer'
  
  return 'general'
}

function escapeLatex(text: string): string {
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}')
}

function scoreBullet(bullet: { text: string; keywords: string[]; priority?: number }, jobKeywords: string[]): number {
  let score = bullet.priority || 5
  
  // Boost score for matching keywords
  const bulletText = bullet.text.toLowerCase()
  const bulletKeywords = bullet.keywords.map(k => k.toLowerCase())
  
  for (const keyword of jobKeywords) {
    if (bulletText.includes(keyword)) score += 2
    if (bulletKeywords.some(bk => bk.includes(keyword) || keyword.includes(bk))) score += 3
  }
  
  return score
}

export function tailorResumeToJob(options: TailorOptions): TailoredResumeResult {
  const { jobTitle, jobDescription, inventory, maxPages = 1 } = options
  
  const roleTrack = detectRoleTrack(jobTitle, jobDescription)
  const jobKeywords = extractKeywords(`${jobTitle} ${jobDescription}`)
  
  // Build header
  const info = inventory.personalInfo
  const links: string[] = []
  if (info.linkedin) links.push(`\\href{${info.linkedin}}{LinkedIn}`)
  if (info.github) links.push(`\\href{${info.github}}{GitHub}`)
  if (info.portfolio) links.push(`\\href{${info.portfolio}}{Portfolio}`)
  
  const header = `
\\begin{center}
    {\\Large \\textbf{${escapeLatex(info.name)}}} \\\\
    {\\small ${escapeLatex(info.tagline || info.title)}} \\\\
    \\vspace{1pt}
    {\\small ${escapeLatex(info.location)} $|$ ${escapeLatex(info.phone)} $|$ ${escapeLatex(info.email)}${links.length ? ` $|$ ${links.join(' $|$ ')}` : ''}}
\\end{center}
`

  // Build summary
  const summaryText = inventory.summary.variants?.[roleTrack] || inventory.summary.default
  const summary = `
\\section{PROFESSIONAL SUMMARY}
{\\small ${escapeLatex(summaryText)}}
`

  // Build skills section
  const skillsItems = inventory.skills
    .sort((a, b) => (a.priority || 5) - (b.priority || 5))
    .map(s => `\\textbf{${escapeLatex(s.category)}:} ${s.items.join(', ')}`)
    .join(' \\\\\n')
  
  const skills = `
\\section{TECHNICAL SKILLS}
{\\small
${skillsItems}}
`

  // Build education
  const eduItems = inventory.education
    .map(e => {
      let line = `\\textbf{${escapeLatex(e.degree)}} $|$ ${escapeLatex(e.school)}`
      if (e.gpa) line += ` $|$ GPA: ${e.gpa}`
      line += ` \\hfill ${escapeLatex(e.graduationDate)}`
      if (e.coursework?.length) {
        line += ` \\\\\n\\textbf{Relevant Coursework:} ${e.coursework.join(', ')}`
      }
      return line
    })
    .join(' \\\\\n')
  
  const education = `
\\section{EDUCATION}
{\\small ${eduItems}}
`

  // Score and select experience bullets
  const matchedExperience: string[] = []
  const experienceItems = inventory.experience
    .filter(exp => !exp.roleTrack || exp.roleTrack.includes(roleTrack) || exp.roleTrack.includes('general'))
    .map(exp => {
      matchedExperience.push(exp.id)
      
      // Score bullets and select top ones
      const scoredBullets = exp.bullets
        .map(b => ({ ...b, score: scoreBullet(b, jobKeywords) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, maxPages === 1 ? 4 : 6)  // Limit bullets for 1-page resume
      
      const bulletItems = scoredBullets
        .map(b => `    \\item ${escapeLatex(b.text)}`)
        .join('\n')
      
      return `
\\subsection{${escapeLatex(exp.title)} $|$ ${escapeLatex(exp.company)} \\hfill ${escapeLatex(exp.dateRange)}}
{\\small
\\begin{itemize}
${bulletItems}
\\end{itemize}}`
    })
    .join('\n')
  
  const experience = `
\\section{EXPERIENCE}
${experienceItems}
`

  // Score and select projects
  const matchedProjects: string[] = []
  const projectItems = inventory.projects
    .filter(proj => !proj.roleTrack || proj.roleTrack.includes(roleTrack) || proj.roleTrack.includes('general'))
    .slice(0, maxPages === 1 ? 2 : 4)  // Limit projects for 1-page
    .map(proj => {
      matchedProjects.push(proj.id)
      
      const scoredBullets = proj.bullets
        .map(b => ({ ...b, score: scoreBullet(b, jobKeywords) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 2)  // 2 bullets per project max
      
      const bulletItems = scoredBullets
        .map(b => `    \\item ${escapeLatex(b.text)}`)
        .join('\n')
      
      const linkPart = proj.link ? ` $|$ \\href{${proj.link}}{Link}` : ''
      
      return `
\\subsection{${escapeLatex(proj.name)} $|$ ${escapeLatex(proj.subtitle)}${linkPart}}
{\\small
\\begin{itemize}
${bulletItems}
\\end{itemize}}`
    })
    .join('\n')
  
  const projects = projectItems ? `
\\section{PROJECTS}
${projectItems}
` : ''

  // Build certifications
  let certifications = ''
  if (inventory.certifications?.length) {
    const certItems = inventory.certifications
      .map(c => `\\textbf{${escapeLatex(c.category)}:} ${c.items.join(', ')}`)
      .join(' \\\\\n')
    
    certifications = `
\\section{CERTIFICATIONS}
{\\small
${certItems}}
`
  }

  // Assemble full document
  const tex = `\\documentclass[10pt,letterpaper]{article}
\\usepackage[letterpaper,margin=0.35in,top=0.3in,bottom=0.3in]{geometry}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{titlesec}
\\pdfgentounicode=1
\\pagestyle{empty}

% TIGHT FORMATTING FOR 1 PAGE
\\setlength{\\parindent}{0pt}
\\setlist{nosep,leftmargin=*,itemsep=1pt,topsep=1pt}
\\titleformat{\\section}{\\normalsize\\bfseries}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{5pt}{2pt}
\\titleformat{\\subsection}{\\small\\bfseries}{}{0em}{}
\\titlespacing{\\subsection}{0pt}{2pt}{1pt}

\\begin{document}
${header}
${summary}
${skills}
${education}
${experience}
${projects}
${certifications}
\\end{document}
`

  return {
    tex,
    roleTrack,
    debug: {
      topKeywords: jobKeywords.slice(0, 10),
      matchedExperience,
      matchedProjects,
      removedBullets: 0,  // Calculated during actual generation
    },
  }
}
