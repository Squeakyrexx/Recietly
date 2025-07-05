export function DashboardPreview() {
  return (
    <svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" className="w-full h-full rounded-md bg-card shadow-lg ring-1 ring-border">
      {/* Background */}
      <rect width="600" height="400" fill="hsl(var(--background))" />

      {/* Header-like bar */}
      <rect width="600" height="40" fill="hsl(var(--card))" />
      <rect x="15" y="12" width="80" height="16" rx="4" fill="hsl(var(--muted-foreground))" />
      <circle cx="570" cy="20" r="10" fill="hsl(var(--muted))" />

      {/* Main content area */}
      {/* Total Spending Card */}
      <rect x="20" y="60" width="170" height="80" rx="8" fill="hsl(var(--card))" />
      <rect x="30" y="70" width="100" height="8" rx="2" fill="hsl(var(--muted))" />
      <rect x="30" y="95" width="80" height="20" rx="4" fill="hsl(var(--primary))" />

      {/* Budget Summary Card */}
      <rect x="200" y="60" width="380" height="80" rx="8" fill="hsl(var(--card))" />
      <rect x="210" y="70" width="100" height="8" rx="2" fill="hsl(var(--muted))" />
      <rect x="210" y="95" width="150" height="10" rx="3" fill="hsl(var(--muted))" />
      <rect x="210" y="95" width="100" height="10" rx="3" fill="hsl(var(--primary))" />
      <rect x="210" y="115" width="150" height="10" rx="3" fill="hsl(var(--muted))" />
      <rect x="210" y="115" width="120" height="10" rx="3" fill="hsl(var(--primary))" />

      {/* Category Spending Chart Card */}
      <rect x="20" y="150" width="360" height="230" rx="8" fill="hsl(var(--card))" />
      <rect x="30" y="160" width="150" height="10" rx="3" fill="hsl(var(--muted))" />
      {/* Bars for chart */}
      <rect x="50" y="250" width="30" height="120" fill="hsl(var(--chart-1))" rx="2" />
      <rect x="100" y="290" width="30" height="80" fill="hsl(var(--chart-2))" rx="2" />
      <rect x="150" y="220" width="30" height="150" fill="hsl(var(--chart-1))" rx="2" />
      <rect x="200" y="310" width="30" height="60" fill="hsl(var(--chart-2))" rx="2" />
      <rect x="250" y="270" width="30" height="100" fill="hsl(var(--chart-1))" rx="2" />
      <rect x="300" y="240" width="30" height="130" fill="hsl(var(--chart-2))" rx="2" />

      {/* Top Spending Card */}
      <rect x="390" y="150" width="190" height="230" rx="8" fill="hsl(var(--card))" />
      <rect x="400" y="160" width="120" height="10" rx="3" fill="hsl(var(--muted))" />
      {/* List items */}
      <circle cx="410" cy="190" r="10" fill="hsl(var(--muted))" />
      <rect x="430" y="185" width="80" height="10" rx="3" fill="hsl(var(--muted))" />
      <rect x="530" y="185" width="40" height="10" rx="3" fill="hsl(var(--muted-foreground))" />

      <circle cx="410" cy="225" r="10" fill="hsl(var(--muted))" />
      <rect x="430" y="220" width="70" height="10" rx="3" fill="hsl(var(--muted))" />
      <rect x="530" y="220" width="40" height="10" rx="3" fill="hsl(var(--muted-foreground))" />

      <circle cx="410" cy="260" r="10" fill="hsl(var(--muted))" />
      <rect x="430" y="255" width="85" height="10" rx="3" fill="hsl(var(--muted))" />
      <rect x="530" y="255" width="40" height="10" rx="3" fill="hsl(var(--muted-foreground))" />
      
      <circle cx="410" cy="295" r="10" fill="hsl(var(--muted))" />
      <rect x="430" y="290" width="65" height="10" rx="3" fill="hsl(var(--muted))" />
      <rect x="530" y="290" width="40" height="10" rx="3" fill="hsl(var(--muted-foreground))" />
    </svg>
  );
}
