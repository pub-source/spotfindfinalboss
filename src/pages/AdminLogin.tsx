import { useState } from 'react';
import { AdminLoginForm } from '@/components/AdminLoginForm';
import { SignUpForm } from '@/components/SignUpForm';
import heroImage from '@/assets/hero-travel.jpg';

export default function AdminLogin() {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center relative"
      style={{ backgroundImage: `url(${heroImage})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-purple-900/60 to-black/70" />
      <div className="relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-slate-200">Secure access for administrators</p>
        </div>
        {isSignUp ? (
          <SignUpForm onSwitchToLogin={() => setIsSignUp(false)} />
        ) : (
          <AdminLoginForm onSwitchToSignUp={() => setIsSignUp(true)} />
        )}
      </div>
    </div>
  );
}
