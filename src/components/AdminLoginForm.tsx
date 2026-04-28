import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AdminLoginFormProps {
  onSwitchToSignUp: () => void;
}

export function AdminLoginForm({ onSwitchToSignUp }: AdminLoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  
  const { signIn, resetPassword, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const checkAdminRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    
    return !!data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        setError(error);
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          toast({
            title: "Multiple failed attempts",
            description: "Use forgot password to reset your credentials",
            variant: "destructive",
          });
        }
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const isAdmin = await checkAdminRole(user.id);
          
          if (!isAdmin) {
            await logout();
            setError('Access denied. Admin privileges required.');
            setFailedAttempts(failedAttempts + 1);
            toast({
              title: "Access Denied",
              description: "This portal is for administrators only",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Admin login successful!",
              description: "Welcome to Admin Portal",
            });
            navigate('/admin/dashboard');
          }
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setFailedAttempts(failedAttempts + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error } = await resetPassword(resetEmail);
      
      if (error) {
        setError(error);
      } else {
        setResetSent(true);
        toast({
          title: "Password reset email sent",
          description: "Check your email for the reset link",
        });
      }
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-12 w-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-slate-300">Enter your email to receive a reset link</p>
        </div>

        <Card className="backdrop-blur-sm bg-slate-900/90 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Forgot Password</CardTitle>
            <CardDescription className="text-slate-300">
              {resetSent 
                ? "Check your email for the password reset link" 
                : "We'll send you a link to reset your password"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!resetSent ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-white">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="Enter your admin email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                  />
                </div>

                {error && (
                  <Alert className="bg-destructive/10 border-destructive/20">
                    <AlertDescription className="text-destructive">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>

                <Button
                  type="button"
                  variant="link"
                  className="w-full text-slate-300 hover:text-white"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetSent(false);
                    setError('');
                  }}
                >
                  Back to Login
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-400 text-sm">
                    Password reset email sent successfully. Please check your inbox and follow the link to reset your password.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetSent(false);
                    setError('');
                  }}
                >
                  Back to Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="h-12 w-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Admin Access</h1>
        <p className="text-slate-300">Authorized personnel only</p>
      </div>

      <Card className="backdrop-blur-sm bg-slate-900/90 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Admin Login</CardTitle>
          <CardDescription className="text-slate-300">
            Enter your admin credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <Alert className="bg-destructive/10 border-destructive/20">
                <AlertDescription className="text-destructive">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {failedAttempts > 0 && failedAttempts < 3 && (
              <Alert className="bg-yellow-500/10 border-yellow-500/20">
                <AlertDescription className="text-yellow-400">
                  Failed attempt {failedAttempts}/3
                </AlertDescription>
              </Alert>
            )}

            {failedAttempts >= 3 ? (
              <Button
                type="button"
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot Password?
              </Button>
            ) : (
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Admin Sign In'}
              </Button>
            )}
          </form>

          <div className="mt-6 text-center">
            <Button
              variant="link"
              className="text-slate-300 hover:text-white p-0 h-auto"
              onClick={onSwitchToSignUp}
            >
              Request admin access
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
