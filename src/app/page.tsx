import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CloudUpload, Bot, BarChart } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Logo className="h-8 w-8 text-primary" />
            <span className="text-xl font-semibold">ReceiptWise</span>
          </Link>
          <nav className="ml-auto flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign Up Free</Link>
            </Button>
          </nav>
        </div>
      </header>
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 sm:py-32">
          <div className="container text-center">
            <div className="mx-auto max-w-3xl space-y-6">
              <h1 className="font-headline text-4xl font-bold tracking-tight text-primary-foreground mix-blend-hard-light sm:text-5xl md:text-6xl">
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

        {/* Feature Sections */}
        <section className="py-20 sm:py-32 bg-secondary">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight">How It Works</h2>
              <p className="mt-2 text-lg text-muted-foreground">A simple three-step process to financial clarity.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-sm">
                <div className="p-4 rounded-full bg-primary/10 mb-4">
                  <CloudUpload className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">1. Upload</h3>
                <p className="text-muted-foreground">Snap a photo of your receipt or upload a file. Our system accepts various formats for your convenience.</p>
              </div>
              <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-sm">
                <div className="p-4 rounded-full bg-primary/10 mb-4">
                  <Bot className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">2. Analyze</h3>
                <p className="text-muted-foreground">Our AI instantly extracts key information: merchant, date, amount, and suggests a category.</p>
              </div>
              <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-sm">
                <div className="p-4 rounded-full bg-primary/10 mb-4">
                  <BarChart className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">3. Track</h3>
                <p className="text-muted-foreground">View your spending on the dashboard, track budgets, and gain valuable insights into your financial habits.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Visual Feature Callout */}
        <section className="py-20 sm:py-32">
            <div className="container grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-4">
                    <h2 className="text-3xl font-bold tracking-tight">Effortless Expense Management</h2>
                    <p className="text-lg text-muted-foreground">
                        Say goodbye to manual data entry. With ReceiptWise, you get a crystal-clear overview of your finances. Set budgets, categorize spending, and identify savings opportunities with our intelligent dashboard.
                    </p>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" /> AI-Powered Data Extraction</li>
                        <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" /> Smart Spending Categorization</li>
                        <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" /> Monthly Budget Tracking</li>
                        <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" /> Actionable Financial Insights</li>
                    </ul>
                </div>
                <div className="relative aspect-video rounded-lg shadow-2xl bg-muted p-2">
                    <Image src="https://placehold.co/600x400.png" data-ai-hint="dashboard screen" alt="App dashboard screenshot" fill className="object-cover rounded-md" />
                </div>
            </div>
        </section>

      </main>

      <footer className="border-t">
        <div className="container py-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} ReceiptWise. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

const CheckCircle = (props: React.SVGProps<SVGSVGElement>) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        {...props}
    >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
)
