'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1000);
  };

  if (success) {
    return (
      <div className="w-full text-center">
        <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-fade-up">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h2 className="text-3xl font-bold tracking-tight mb-4 animate-fade-up" style={{ animationDelay: '100ms' }}>
          Check your email
        </h2>
        <p className="text-muted-foreground animate-fade-up mb-8" style={{ animationDelay: '200ms' }}>
          We&apos;ve sent a password reset link to <br/>
          <span className="font-medium text-foreground">{email}</span>
        </p>
        <div className="animate-fade-up" style={{ animationDelay: '300ms' }}>
          <Link href="/login">
            <Button variant="outline" className="w-full border-surface-border">
              Return to login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Reset password</h2>
        <p className="text-muted-foreground">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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

        <Button 
          type="submit" 
          className="w-full bg-brand-600 hover:bg-brand-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all"
          disabled={loading}
        >
          {loading ? <LoadingSpinner className="mr-2 h-4 w-4 text-white" /> : null}
          Send reset link
        </Button>
      </form>

      <div className="mt-8 text-center">
        <Link href="/login" className="text-sm font-medium text-brand-500 hover:text-brand-400">
          Back to login
        </Link>
      </div>
    </div>
  );
}
