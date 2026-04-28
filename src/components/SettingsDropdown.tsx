import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Settings, User, Lock, Shield, AlertTriangle, Trash2, Ban, Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import UserEditDialog from './admin/UserEditDialog';
import UserWarningDialog from './admin/UserWarningDialog';
import BanIPDialog from './admin/BanIPDialog';
import IPAddressListDialog from './admin/IPAddressListDialog';

export function SettingsDropdown() {
  const { user, isAdmin, logout } = useAuth();
  const { toast } = useToast();
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [warnDialogOpen, setWarnDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [ipListOpen, setIpListOpen] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [zipCode, setZipCode] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setFullName(data.full_name || '');
        setPhoneNumber(data.phone_number || '');
        setZipCode(data.zip_code || '');
      }
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: users, refetch: refetchUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data: profiles } = await supabase.from('profiles').select('*');
      const { data: roles } = await supabase.from('user_roles').select('*');
      
      return profiles?.map(profile => ({
        ...profile,
        role: roles?.find(r => r.user_id === profile.user_id)?.role || 'user'
      }));
    },
    enabled: isAdmin,
  });

  const handleProfileUpdate = async () => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone_number: phoneNumber,
        zip_code: zipCode,
      })
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Profile updated successfully.',
      });
      setProfileOpen(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Password reset email sent. Check your inbox.',
      });
      setPasswordOpen(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    // Admin can delete user profile record
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete user.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'User deleted successfully.',
      });
      refetchUsers();
    }
  };

  const handleGrantAdmin = async (userId: string) => {
    // Check if user already has admin role
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    if (existingRole) {
      toast({
        title: 'Info',
        description: 'User is already an admin.',
      });
      return;
    }

    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role: 'admin' });
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to grant admin role.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Admin role granted successfully.',
      });
      refetchUsers();
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full justify-start gap-3 px-3 py-2 h-auto font-medium text-sm">
            <Settings className="h-5 w-5" />
            Management
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-background border-border z-50">
          <DropdownMenuLabel>User Settings</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setProfileOpen(true)}>
            <User className="mr-2 h-4 w-4" />
            Edit Profile
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setPasswordOpen(true)}>
            <Lock className="mr-2 h-4 w-4" />
            Reset Password
          </DropdownMenuItem>

          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Management</DropdownMenuLabel>
              
              <DropdownMenuItem onClick={() => setUsersOpen(true)}>
                <Shield className="mr-2 h-4 w-4" />
                Grant Admin
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setUsersOpen(true)}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Warn User
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setUsersOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete User
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setBanDialogOpen(true)}>
                <Ban className="mr-2 h-4 w-4" />
                Ban IP Address
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setIpListOpen(true)}>
                <Activity className="mr-2 h-4 w-4" />
                IP Records
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Profile Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Username</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter username"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="zip">Zip Code</Label>
              <Input
                id="zip"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="Enter zip code"
              />
            </div>
            <Button onClick={handleProfileUpdate} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We'll send a password reset link to your email address: <strong>{user?.email}</strong>
            </p>
            <Button onClick={handlePasswordReset} className="w-full">
              Send Reset Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Management Dialog */}
      <Dialog open={usersOpen} onOpenChange={setUsersOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Management</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {users?.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{u.full_name || 'No name'}</p>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{u.role}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGrantAdmin(u.user_id)}
                    disabled={u.role === 'admin'}
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    {u.role === 'admin' ? 'Admin' : 'Grant Admin'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedUser(u);
                      setWarnDialogOpen(true);
                      setUsersOpen(false);
                    }}
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Warn
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteUser(u.user_id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {selectedUser && (
        <>
          <UserEditDialog
            user={selectedUser}
            open={!!selectedUser && !warnDialogOpen}
            onOpenChange={(open) => {
              if (!open) setSelectedUser(null);
            }}
            onSuccess={() => {
              refetchUsers();
              setSelectedUser(null);
            }}
          />
          <UserWarningDialog
            userId={selectedUser.user_id}
            userName={selectedUser.full_name || selectedUser.email}
            open={warnDialogOpen}
            onOpenChange={(open) => {
              setWarnDialogOpen(open);
              if (!open) setSelectedUser(null);
            }}
            onSuccess={() => {
              setWarnDialogOpen(false);
              setSelectedUser(null);
            }}
          />
        </>
      )}

      <BanIPDialog
        open={banDialogOpen}
        onOpenChange={setBanDialogOpen}
        onSuccess={() => {
          toast({
            title: 'Success',
            description: 'IP address banned successfully.',
          });
          setBanDialogOpen(false);
        }}
      />

      <IPAddressListDialog
        open={ipListOpen}
        onOpenChange={setIpListOpen}
      />
    </>
  );
}
