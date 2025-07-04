import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="flex flex-col items-center justify-center space-y-6 text-center">
        <div className="rounded-full bg-primary/10 p-4">
          <div className="rounded-full bg-primary/20 p-4">
            <Logo className="h-16 w-16 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="font-headline text-4xl font-bold tracking-tight text-primary-foreground mix-blend-hard-light sm:text-5xl md:text-6xl">
            Welcome to ReceiptWise
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
            Snap, upload, and let AI do the rest. Turn your receipts into crystal-clear spending insights effortlessly.
          </p>
        </div>
        <Link href="/dashboard">
          <Button size="lg" className="gap-2">
            Get Started
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
              className="h-5 w-5"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Button>
        </Link>
      </div>
    </main>
  );
}
