import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { HeroSection } from '@/components/hero-section'
import {
  Bot,
  Search,
  FileText,
  BarChart3,
  Bell,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Target,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Search,
    title: 'AI-Powered Job Search',
    description:
      'Agents scour LinkedIn, Indeed, Glassdoor, and more — simultaneously. You get curated matches in seconds.',
  },
  {
    icon: FileText,
    title: 'Resume Tailoring',
    description:
      'AI analyzes each job description and rewrites your resume to match. Higher response rates, less effort.',
  },
  {
    icon: BarChart3,
    title: 'Smart Analytics',
    description:
      'Track response rates, pipeline velocity, and interview conversion. Data-driven job hunting.',
  },
  {
    icon: Bell,
    title: 'Job Alerts',
    description:
      'Set it and forget it. Get notified when new jobs matching your criteria appear across all platforms.',
  },
] as const

const STATS = [
  { value: '6+', label: 'Job Sources' },
  { value: '10x', label: 'Faster Search' },
  { value: '3x', label: 'More Interviews' },
  { value: '100%', label: 'Free & Open Source' },
] as const

const PLATFORMS = [
  'LinkedIn',
  'Indeed',
  'Glassdoor',
  'Adzuna',
  'Google Jobs',
  'Remote.co',
] as const

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center">
                <Bot className="h-5 w-5 text-[#0a0a0a]" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                HireAgent
              </span>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button asChild variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm" className="bg-white text-black hover:bg-white/90 rounded-full">
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dark Hero */}
      <HeroSection />

      {/* Platform logos */}
      <section className="relative z-10 border-t border-border/30 bg-muted/30">
        <div className="container mx-auto px-6 py-8">
          <p className="text-center text-sm text-muted-foreground mb-6 uppercase tracking-widest font-mono">
            Searches across
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {PLATFORMS.map((name) => (
              <div
                key={name}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background border border-border/50 text-sm font-medium text-muted-foreground"
              >
                <div className="h-6 w-6 rounded bg-foreground/10 flex items-center justify-center text-xs font-bold text-foreground/60">
                  {name[0]}
                </div>
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-border/30">
        <div className="container mx-auto px-6 py-16 md:py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center space-y-2">
                <div className="text-4xl md:text-5xl font-bold tracking-tight">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="border-t border-border/30 bg-muted/20">
        <div className="container mx-auto px-6 py-20 md:py-28">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                AI agents that work for you
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Stop spending hours on job boards. Let intelligent agents handle
                the grunt work while you prepare for interviews.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {FEATURES.map((feature) => {
                const Icon = feature.icon
                return (
                  <div
                    key={feature.title}
                    className="group p-8 rounded-2xl border border-border/50 bg-background hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                  >
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section className="border-t border-border/30">
        <div className="container mx-auto px-6 py-20 md:py-28">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                Your unfair advantage
              </h2>
              <p className="text-muted-foreground text-lg">
                Built by engineers who were tired of the job search grind
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">10x Faster</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    AI agents search 6+ platforms simultaneously. What took
                    hours now takes seconds.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    Higher Hit Rate
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    AI-tailored resumes match job descriptions precisely.
                    Stand out from the crowd.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Privacy First</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Your data stays yours. Open source, self-hostable, no data
                    selling. Ever.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    Always Improving
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Agents learn from your preferences and get smarter over
                    time. Better matches, fewer misses.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative border-t border-border/30">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[400px] rounded-full bg-gradient-to-br from-primary/10 via-orange-500/5 to-amber-500/10 blur-3xl" />
        </div>
        <div className="relative container mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
              Stop applying.
              <br />
              <span className="text-muted-foreground">
                Start getting hired.
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Let AI agents do the heavy lifting. Your next opportunity is one
              click away.
            </p>
            <Button
              asChild
              size="lg"
              className="h-14 px-10 text-lg rounded-xl"
            >
              <Link href="/register">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-foreground flex items-center justify-center">
                <Bot className="h-4 w-4 text-background" />
              </div>
              <span className="font-semibold text-sm">HireAgent</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Open source. Built for job seekers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
