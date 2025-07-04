import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle, CloudUpload, Bot, BarChart } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Logo className="h-8 w-8 text-primary" />
            <span className="text-xl font-semibold">ReceiptWise</span>
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
        <section className="py-24 sm:py-32">
          <div className="container text-center">
            <div className="mx-auto max-w-4xl space-y-6">
              <h1 className="font-headline text-4xl font-bold tracking-tight text-primary sm:text-5xl md:text-6xl">
                Turn Receipts into Insights, Instantly.
              </h1>
              <p className="max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl">
                Snap, upload, and let our AI do the rest. ReceiptWise effortlessly transforms your paper and digital receipts into organized, actionable financial data.
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
        <section className="py-24 sm:py-32 bg-card border-y">
            <div className="container grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold tracking-tight">Effortless Expense Management</h2>
                    <p className="text-lg text-muted-foreground">
                        Say goodbye to manual data entry. With ReceiptWise, you get a crystal-clear overview of your finances. Set budgets, categorize spending, and identify savings opportunities with our intelligent dashboard.
                    </p>
                    <ul className="space-y-3 text-foreground">
                        <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-primary" /> AI-Powered Data Extraction</li>
                        <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-primary" /> Smart Spending Categorization</li>
                        <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-primary" /> Monthly Budget Tracking</li>
                        <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-primary" /> Actionable Financial Insights</li>
                    </ul>
                </div>
                <div className="relative aspect-video rounded-lg shadow-2xl bg-muted p-2 ring-1 ring-inset ring-primary/10">
                    <Image src="https://placehold.co/600x400.png" data-ai-hint="dashboard screen" alt="App dashboard screenshot" fill className="object-cover rounded-md" />
                </div>
            </div>
        </section>

        {/* Feature Sections */}
        <section className="py-24 sm:py-32">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight">A Simple Process to Financial Clarity</h2>
              <p className="mt-4 text-lg text-muted-foreground">Just three simple steps stand between you and a smarter way to manage expenses.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center p-8 bg-card rounded-xl shadow-sm border">
                <div className="p-4 rounded-full bg-primary/10 mb-6">
                  <CloudUpload className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">1. Upload</h3>
                <p className="text-muted-foreground">Snap a photo of your receipt or upload a file. Our system accepts various formats for your convenience.</p>
              </div>
              <div className="flex flex-col items-center p-8 bg-card rounded-xl shadow-sm border">
                <div className="p-4 rounded-full bg-primary/10 mb-6">
                  <Bot className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">2. Analyze</h3>
                <p className="text-muted-foreground">Our AI instantly extracts key information: merchant, date, amount, and suggests a category.</p>
              </div>
              <div className="flex flex-col items-center p-8 bg-card rounded-xl shadow-sm border">
                <div className="p-4 rounded-full bg-primary/10 mb-6">
                  <BarChart className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">3. Track</h3>
                <p className="text-muted-foreground">View your spending on the dashboard, track budgets, and gain valuable insights into your financial habits.</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t bg-card">
        <div className="container py-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} ReceiptWise. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
