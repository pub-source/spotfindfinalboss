import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface IPAddressListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LoginHistory {
  id: string;
  user_id: string;
  ip_address: string;
  user_agent: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
}

export default function IPAddressListDialog({ open, onOpenChange }: IPAddressListDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: loginHistory, isLoading } = useQuery({
    queryKey: ['login-history', open],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_login_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      // Fetch user profiles separately
      const userIds = [...new Set(data.map(record => record.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      // Merge the data
      return data.map(record => ({
        ...record,
        profiles: profiles?.find(p => p.user_id === record.user_id) || null,
      })) as LoginHistory[];
    },
    enabled: open,
  });

  const filteredHistory = loginHistory?.filter((record) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      record.ip_address.toLowerCase().includes(searchLower) ||
      record.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      record.profiles?.email?.toLowerCase().includes(searchLower)
    );
  });

  // Get unique IP count
  const uniqueIPs = new Set(loginHistory?.map(record => record.ip_address)).size;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>IP Address Login History</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Input
              placeholder="Search by IP, name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
            <div className="flex gap-2">
              <Badge variant="outline">Total Logins: {loginHistory?.length || 0}</Badge>
              <Badge variant="outline">Unique IPs: {uniqueIPs || 0}</Badge>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Device/Browser</TableHead>
                    <TableHead>Login Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No login history found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredHistory?.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {record.profiles?.full_name || 'Unknown'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {record.profiles?.email || 'No email'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{record.ip_address}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                          {record.user_agent || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(record.created_at), 'MMM dd, yyyy HH:mm:ss')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
