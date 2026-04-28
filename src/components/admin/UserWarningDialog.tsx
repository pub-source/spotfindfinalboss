import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UserWarningDialogProps {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function UserWarningDialog({
  userId,
  userName,
  open,
  onOpenChange,
  onSuccess,
}: UserWarningDialogProps) {
  const [warningMessage, setWarningMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!warningMessage.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a warning message',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('user_warnings').insert({
        user_id: userId,
        admin_id: user.id,
        warning_message: warningMessage.trim(),
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Warning sent successfully',
      });

      setWarningMessage('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error sending warning:', error);
      toast({
        title: 'Error',
        description: 'Failed to send warning',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Warn User</DialogTitle>
          <DialogDescription>
            Send a warning message to {userName}. This message will be displayed when they log in.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Textarea
            placeholder="Enter warning message..."
            value={warningMessage}
            onChange={(e) => setWarningMessage(e.target.value)}
            rows={5}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Warning'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
