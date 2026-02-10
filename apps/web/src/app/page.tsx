import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  Sparkles,
  TrendingUp,
  Bell,
  BarChart3,
  Search,
  Zap,
  CheckCircle2,
  ArrowRight
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xl font-bold">JobTracker</span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button asChild variant="ghost">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-sm font-mono">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            AI-Powered Job Application Tracking
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Track Your Job Search
            <span className="text-primary block mt-2">With Precision</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Stop losing track of applications. Use AI-powered search, smart reminders,
            and analytics to land your dream job faster.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button asChild size="lg" className="text-base h-12 px-8">
              <Link href="/register">
                Start Tracking Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base h-12 px-8">
              <Link href="/login">
                Sign In
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20 border-t border-border/40">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Everything You Need</h2>
            <p className="text-muted-foreground text-lg">
              Powerful features to supercharge your job search
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-primary/20">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>AI Job Search</CardTitle>
                <CardDescription>
                  Multi-source search powered by AI agents. Find opportunities from LinkedIn,
                  Indeed, Glassdoor, and more in seconds.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Application Tracking</CardTitle>
                <CardDescription>
                  Track every application from submission to offer. Never lose track of
                  where you are in the hiring process.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Smart Reminders</CardTitle>
                <CardDescription>
                  Get notified about follow-ups, interviews, and deadlines.
                  Never miss an important date again.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Analytics Dashboard</CardTitle>
                <CardDescription>
                  Visualize your job search progress. See response rates,
                  application trends, and optimize your strategy.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>
                  Track every interaction, email, and interview.
                  Keep detailed notes and stay organized.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Keyboard shortcuts, bulk operations, and CSV export.
                  Built for power users who value efficiency.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20 border-t border-border/40">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Why JobTracker?</h2>
            <p className="text-muted-foreground text-lg">
              Built by job seekers, for job seekers
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Free & Open Source</h3>
                <p className="text-muted-foreground">
                  No hidden fees, no credit card required. Your data stays yours.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Privacy First</h3>
                <p className="text-muted-foreground">
                  Your job search data is sensitive. We encrypt everything and never sell your information.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">AI-Powered Intelligence</h3>
                <p className="text-muted-foreground">
                  Leverage cutting-edge AI to search multiple job boards simultaneously and get better results.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Built for Productivity</h3>
                <p className="text-muted-foreground">
                  Keyboard shortcuts, quick actions, and a clean interface designed to save you time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 border-t border-border/40">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold">
            Ready to Take Control of Your Job Search?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join hundreds of job seekers who are landing their dream jobs faster.
          </p>
          <Button asChild size="lg" className="text-base h-12 px-8">
            <Link href="/register">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2024 JobTracker. Built with ❤️ for job seekers.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
