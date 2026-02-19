import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">HireAgent</h1>
          <p className="text-muted-foreground text-sm">
            Get hired with AI agents
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
