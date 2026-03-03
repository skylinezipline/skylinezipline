import { Metadata } from "next";
import { Mountain, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = { title: "Login | Zipline OS" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-skyline-950 via-slate-900 to-forest-950 p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-skyline-500 shadow-lg">
            <Mountain className="h-9 w-9 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Skyline Ziplines</h1>
            <p className="flex items-center justify-center gap-1 text-sm text-skyline-400">
              <Zap className="h-3.5 w-3.5" />
              Operations OS
            </p>
          </div>
        </div>

        <Card className="border-slate-700 bg-slate-800/80 backdrop-blur">
          <CardHeader className="pb-4 text-center">
            <h2 className="text-lg font-semibold text-white">Staff Sign In</h2>
            <CardDescription className="text-slate-400">
              Use your Skyline staff credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-3" action="/api/auth/callback/credentials" method="POST">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Email</label>
                <Input
                  name="email"
                  type="email"
                  placeholder="you@skylinezipline.com"
                  className="border-slate-600 bg-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-skyline-500"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <Input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className="border-slate-600 bg-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-skyline-500"
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full bg-skyline-600 hover:bg-skyline-700">
                Sign In
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-600" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-slate-800 px-2 text-slate-400">or</span>
              </div>
            </div>

            <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700">
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </Button>

            <p className="text-center text-xs text-slate-500">
              Contact your manager if you need access
            </p>

            {/* Dev hint */}
            <div className="rounded border border-slate-600 bg-slate-700/50 p-3 text-xs text-slate-400">
              <strong className="text-slate-300">Demo:</strong>{" "}
              admin@skylinezipline.com / demo1234
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
