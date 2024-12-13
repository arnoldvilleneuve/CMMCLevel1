import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Shield, FileText, Home } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation() || ['/'];

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-semibold">CMMC Level 1 Assessment</span>
            </div>
            <div className="flex space-x-4">
              <Link href="/">
                <div className={`flex items-center px-3 py-2 rounded-md text-sm font-medium cursor-pointer
                  ${location === '/' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent'}`}>
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </div>
              </Link>
              <Link href="/assessment">
                <div className={`flex items-center px-3 py-2 rounded-md text-sm font-medium cursor-pointer
                  ${location === '/assessment' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent'}`}>
                  <Shield className="h-4 w-4 mr-2" />
                  Assessment
                </div>
              </Link>
              <Link href="/reports">
                <div className={`flex items-center px-3 py-2 rounded-md text-sm font-medium cursor-pointer
                  ${location === '/reports' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent'}`}>
                  <FileText className="h-4 w-4 mr-2" />
                  Reports
                </div>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
