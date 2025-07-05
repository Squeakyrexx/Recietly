import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons';
import Link from 'next/link';
import { ArrowRight, CheckCircle, CloudUpload, Bot, BarChart } from 'lucide-react';
import { DashboardPreview } from '@/components/landing/dashboard-preview';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Logo className="h-8 w-8 text-primary" />
            <span className="text-xl font-semibold">Recietly</span>
          </Link>
          <nav className="ml-auto flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </nav>
        </div>
      </header>
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-24 sm:py-32">
          <div className="container mx-auto flex flex-col items-center px-4 text-center">
            <div className="max-w-4xl space-y-6">
              <h1 className="font-headline text-4xl font-bold tracking-tight text-primary sm:text-5xl md:text-6xl">
                Turn Receipts into Insights, Instantly.
              </h1>
              <p className="max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl">
                Stop saving crumpled receipts. Recietly uses AI to automatically digitize, categorize, and analyze your spending, giving you a clear view of your financial life.
              </p>
              <div className="flex justify-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/signup">Get Started for Free <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Visual Feature Callout */}
        <section className="w-full py-24 sm:py-32 bg-card border-y">
            <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center px-4">
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold tracking-tight">Your Finances, Finally Organized.</h2>
                    <p className="text-lg text-muted-foreground">
                        Go from a shoebox of receipts to a clear, interactive dashboard. Recietly doesn't just store your expenses—it helps you understand them. Track spending against budgets, discover trends, and get AI-powered insights to help you save.
                    </p>
                    <ul className="space-y-3 text-foreground">
                        <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-primary" /> Instant AI-powered receipt capture.</li>
                        <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-primary" /> Automatic expense categorization.</li>
                        <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-primary" /> Intelligent budgeting and progress tracking.</li>
                        <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-primary" /> Tax-ready reporting for business expenses.</li>
                    </ul>
                </div>
                <div className="relative aspect-[4/3] rounded-lg bg-muted p-2 ring-1 ring-inset ring-primary/10">
                    <DashboardPreview />
                </div>
            </div>
        </section>

        {/* Feature Sections */}
        <section className="w-full py-24 sm:py-32">
          <div className="container mx-auto flex flex-col items-center px-4">
            <div className="max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight">How It Works</h2>
              <p className="mt-4 text-lg text-muted-foreground">Get started in minutes and see your financial picture come into focus.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center p-8 bg-card rounded-xl shadow-sm border">
                <div className="p-4 rounded-full bg-primary/10 mb-6">
                  <CloudUpload className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">1. Snap or Upload</h3>
                <p className="text-muted-foreground">Use our camera-first interface to instantly capture a receipt, or upload an existing file.</p>
              </div>
              <div className="flex flex-col items-center p-8 bg-card rounded-xl shadow-sm border">
                <div className="p-4 rounded-full bg-primary/10 mb-6">
                  <Bot className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">2. Review & Confirm</h3>
                <p className="text-muted-foreground">Our AI extracts the merchant, amount, and date. Simply confirm the details are correct.</p>
              </div>
              <div className="flex flex-col items-center p-8 bg-card rounded-xl shadow-sm border">
                <div className="p-4 rounded-full bg-primary/10 mb-6">
                  <BarChart className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">3. Track & Analyze</h3>
                <p className="text-muted-foreground">View your spending on the dashboard, track budgets, and gain valuable insights into your habits.</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer className="w-full border-t bg-card">
        <div className="container mx-auto py-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Recietly. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
