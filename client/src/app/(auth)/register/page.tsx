'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [orgName, setOrgName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return { score: 0, label: '', color: 'bg-muted' };
    if (pass.length > 8) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;

    if (score <= 25) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 50) return { score, label: 'Fair', color: 'bg-orange-500' };
    if (score <= 75) return { score, label: 'Good', color: 'bg-yellow-500' };
    return { score, label: 'Strong', color: 'bg-green-500' };
  };

  const passStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register({ name, email, password, orgName });
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error creating account');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full text-center">
        <div className="text-6xl mb-6 animate-fade-up">🎉</div>
        <h2 className="text-3xl font-bold tracking-tight mb-4 animate-fade-up" style={{ animationDelay: '100ms' }}>
          Account created!
        </h2>
        <p className="text-muted-foreground animate-fade-up" style={{ animationDelay: '200ms' }}>
          Setting up your workspace... Redirecting to dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full transform transition-all">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Create your account</h2>
        <p className="text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-500 hover:text-brand-400 font-medium transition-colors">
            Login
          </Link>
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm" style={{ animation: "slideIn 0.3s ease-out" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="bg-surface-card border-surface-border focus-visible:ring-brand-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-surface-card border-surface-border focus-visible:ring-brand-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="orgName">Organization Name</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger type="button" tabIndex={-1}>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>This will be your team's workspace name</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="orgName"
            placeholder="Acme Corp"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            required
            className="bg-surface-card border-surface-border focus-visible:ring-brand-500"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-surface-card border-surface-border focus-visible:ring-brand-500"
          />
          {password && (
            <div className="pt-1 flex items-center justify-between text-xs">
              <span className={`font-medium ${passStrength.color.replace('bg-', 'text-')}`}>
                {passStrength.label}
              </span>
              <div className="w-24 h-1.5 bg-surface-muted rounded-full overflow-hidden flex">
                <div 
                  className={`h-full ${passStrength.color} transition-all duration-300 ease-out`}
                  style={{ width: `${passStrength.score}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="bg-surface-card border-surface-border focus-visible:ring-brand-500"
          />
        </div>

        <Button 
          type="submit" 
          className="w-full bg-brand-600 hover:bg-brand-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all mt-2"
          disabled={loading}
        >
          {loading ? <LoadingSpinner className="mr-2 h-4 w-4 text-white" /> : null}
          Create Account
        </Button>
      </form>
    </div>
  );
}
