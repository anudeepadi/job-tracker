export type RoleTrack = 'SWE' | 'DS' | 'DE' | 'MLE' | 'ANALYST' | 'GENERAL'

export type ResumeInventoryV1 = {
  profile: {
    name: string
    titleByTrack?: Partial<Record<RoleTrack, string>>
    location?: string
    email?: string
    phone?: string
    links?: Array<{ label: string; url: string }>
  }
  summaryBullets?: Array<{ text: string; tags?: string[] }>
  skills?: Array<{ category: string; items: string[] }>
  experience?: Array<{
    company: string
    title: string
    start?: string
    end?: string
    bullets: Array<{ text: string; tags?: string[] }>
  }>
  projects?: Array<{
    name: string
    subtitle?: string
    link?: { label: string; url: string }
    bullets: Array<{ text: string; tags?: string[] }>
  }>
  achievements?: string[]
}

export type TailorInput = {
  jobTitle: string
  jobDescription: string
  inventory: ResumeInventoryV1
  roleTrackOverride?: RoleTrack
  bulletBudgets?: {
    summary?: number
    experience?: number
    projects?: number
    achievements?: number
  }
}

export type TailorOutput = {
  roleTrack: RoleTrack
  tex: string
  removedItems: number
  debug: {
    topKeywords: string[]
  }
}

const STOPWORDS = new Set([
  'a','an','and','are','as','at','be','by','for','from','has','have','in','is','it','its','of','on','or','that','the','their','this','to','with','you','your',
  'we','our','they','will','can','may','must','should','able','etc','using','use','used','work','working',
])

function normalizeText(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9+.#/ -]/g, ' ')
}

function tokenize(s: string): string[] {
  return normalizeText(s)
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => t.length >= 2)
    .filter((t) => !STOPWORDS.has(t))
}

function countTokens(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const t of tokens) m.set(t, (m.get(t) ?? 0) + 1)
  return m
}

function guessRoleTrack(jobTitle: string): RoleTrack {
  const t = jobTitle.toLowerCase()
  if (/(data\s*engineer|etl|pipeline|analytics\s*engineer)/.test(t)) return 'DE'
  if (/(machine\s*learning|ml\s*engineer|mlops|ai\s*engineer)/.test(t)) return 'MLE'
  if (/(data\s*scientist|research\s*scientist|applied\s*scientist)/.test(t)) return 'DS'
  if (/(analyst|business\s*intelligence|bi\b|reporting)/.test(t)) return 'ANALYST'
  if (/(software|swe\b|developer|backend|frontend|full\s*stack|fullstack|platform\s*engineer|engineer)/.test(t))
    return 'SWE'
  return 'GENERAL'
}

function trackBoostKeywords(track: RoleTrack): string[] {
  switch (track) {
    case 'SWE':
      return ['typescript','javascript','react','next','node','api','backend','frontend','system','design','testing','performance','services','microservices']
    case 'DS':
      return ['python','sql','statistics','model','feature','experiment','ab','analysis','nlp','time','series','dashboard','visualization','pandas','sklearn']
    case 'DE':
      return ['sql','etl','pipeline','spark','airflow','dbt','warehouse','lake','kafka','batch','stream','data','quality','governance']
    case 'MLE':
      return ['ml','model','training','inference','pytorch','tensorflow','serving','mlops','deployment','monitoring','llm','rag','vector','evaluation']
    case 'ANALYST':
      return ['sql','dashboard','tableau','powerbi','metrics','kpi','stakeholders','reporting','analysis','excel']
    default:
      return []
  }
}

function scoreText(text: string, tags: string[] | undefined, profile: Map<string, number>, track: RoleTrack): number {
  const tokens = tokenize(text)
  const boosted = new Set(trackBoostKeywords(track))
  let score = 0
  for (const t of tokens) {
    const freq = profile.get(t) ?? 0
    if (!freq) continue
    score += boosted.has(t) ? freq * 3 : freq
  }
  if (tags?.length) {
    for (const tag of tags) {
      const tt = tokenize(tag)
      for (const tok of tt) {
        const freq = profile.get(tok) ?? 0
        if (!freq) continue
        score += boosted.has(tok) ? freq * 2 : freq
      }
    }
  }
  return score
}

function escapeLatex(s: string): string {
  return s
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/~/g, '\\textasciitilde{}')
}

function latexLink(label: string, url: string): string {
  return `\\href{${escapeLatex(url)}}{${escapeLatex(label)}}`
}

export function tailorResumeToJob(input: TailorInput): TailorOutput {
  const roleTrack = input.roleTrackOverride ?? guessRoleTrack(input.jobTitle)
  const budgets = {
    summary: input.bulletBudgets?.summary ?? 3,
    experience: input.bulletBudgets?.experience ?? 6,
    projects: input.bulletBudgets?.projects ?? 4,
    achievements: input.bulletBudgets?.achievements ?? 3,
  }

  const jdTokens = tokenize(`${input.jobTitle}\n${input.jobDescription}`)
  const boosted = trackBoostKeywords(roleTrack)
  const tokenProfile = countTokens([...jdTokens, ...boosted])

  const allKeywords = [...tokenProfile.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([k]) => k)

  const summary = (input.inventory.summaryBullets ?? [])
    .map((b) => ({ ...b, score: scoreText(b.text, b.tags, tokenProfile, roleTrack) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, budgets.summary)

  const experienceBullets: Array<{ header: string; text: string; score: number }> = []
  for (const exp of input.inventory.experience ?? []) {
    for (const b of exp.bullets) {
      experienceBullets.push({
        header: `${exp.title} | ${exp.company}${exp.start || exp.end ? ` (${exp.start ?? ''}${exp.start && exp.end ? '–' : ''}${exp.end ?? ''})` : ''}`,
        text: b.text,
        score: scoreText(b.text, b.tags, tokenProfile, roleTrack),
      })
    }
  }
  const topExperience = experienceBullets
    .sort((a, b) => b.score - a.score)
    .slice(0, budgets.experience)

  const projectBullets: Array<{ header: string; text: string; score: number; link?: { label: string; url: string } }> = []
  for (const proj of input.inventory.projects ?? []) {
    for (const b of proj.bullets) {
      projectBullets.push({
        header: proj.subtitle ? `${proj.name} | ${proj.subtitle}` : proj.name,
        text: b.text,
        score: scoreText(b.text, b.tags, tokenProfile, roleTrack),
        link: proj.link,
      })
    }
  }
  const topProjects = projectBullets
    .sort((a, b) => b.score - a.score)
    .slice(0, budgets.projects)

  const achievements = (input.inventory.achievements ?? []).slice(0, budgets.achievements)

  const profile = input.inventory.profile
  const headline =
    profile.titleByTrack?.[roleTrack] ??
    profile.titleByTrack?.GENERAL ??
    profile.titleByTrack?.DS ??
    profile.titleByTrack?.SWE ??
    ''

  const links = (profile.links ?? []).slice(0, 6)

  const skills = (input.inventory.skills ?? []).slice(0, 6)

  // Very compact, ATS-friendly LaTeX, independent of the static template.
  const tex = [
    '\\documentclass[10pt,letterpaper]{article}',
    '\\usepackage[letterpaper,margin=0.35in,top=0.3in,bottom=0.3in]{geometry}',
    '\\usepackage{enumitem}',
    '\\usepackage[hidelinks]{hyperref}',
    '\\usepackage{titlesec}',
    '\\pdfgentounicode=1',
    '\\pagestyle{empty}',
    '\\setlength{\\parindent}{0pt}',
    '\\setlist{nosep,leftmargin=*,itemsep=1pt,topsep=1pt}',
    '\\titleformat{\\section}{\\normalsize\\bfseries}{}{0em}{}[\\titlerule]',
    '\\titlespacing{\\section}{0pt}{5pt}{2pt}',
    '\\titleformat{\\subsection}{\\small\\bfseries}{}{0em}{}',
    '\\titlespacing{\\subsection}{0pt}{2pt}{1pt}',
    '\\begin{document}',
    '',
    '\\begin{center}',
    `  {\\Large \\textbf{${escapeLatex(profile.name)}}} \\\\`,
    headline ? `  {\\small ${escapeLatex(headline)}} \\\\` : '  {\\small } \\\\',
    '  \\vspace{1pt}',
    `  {\\small ${[
      profile.location ? escapeLatex(profile.location) : null,
      profile.phone ? escapeLatex(profile.phone) : null,
      profile.email ? escapeLatex(profile.email) : null,
      ...links.map((l) => latexLink(l.label, l.url)),
    ]
      .filter(Boolean)
      .join(' $|$ ')} }`,
    '\\end{center}',
    '',
    '\\section{PROFESSIONAL SUMMARY}',
    '{\\small',
    summary.length ? '\\begin{itemize}' : escapeLatex(''),
    ...summary.map((b) => `  \\item ${escapeLatex(b.text)}`),
    summary.length ? '\\end{itemize}' : '',
    '}',
    '',
    '\\section{TECHNICAL SKILLS}',
    '{\\small',
    ...skills.map(
      (s) => `\\textbf{${escapeLatex(s.category)}:} ${escapeLatex(s.items.join(', '))} \\\\`
    ),
    '}',
    '',
    '\\section{EXPERIENCE HIGHLIGHTS}',
    '{\\small',
    topExperience.length ? '\\begin{itemize}' : escapeLatex(''),
    ...topExperience.map((b) => `  \\item ${escapeLatex(b.text)}`),
    topExperience.length ? '\\end{itemize}' : '',
    '}',
    '',
    '\\section{PROJECT HIGHLIGHTS}',
    '{\\small',
    topProjects.length ? '\\begin{itemize}' : escapeLatex(''),
    ...topProjects.map((b) => {
      const header = b.link ? `${escapeLatex(b.header)} (${latexLink(b.link.label, b.link.url)})` : escapeLatex(b.header)
      return `  \\item \\textbf{${header}}: ${escapeLatex(b.text)}`
    }),
    topProjects.length ? '\\end{itemize}' : '',
    '}',
    '',
    '\\section{CERTIFICATIONS \\& ACHIEVEMENTS}',
    '{\\small',
    achievements.length ? '\\begin{itemize}' : escapeLatex(''),
    ...achievements.map((a) => `  \\item ${escapeLatex(a)}`),
    achievements.length ? '\\end{itemize}' : '',
    '}',
    '',
    '\\end{document}',
    '',
  ].join('\n')

  return {
    roleTrack,
    tex,
    removedItems: 0,
    debug: { topKeywords: allKeywords },
  }
}

