import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle } from 'lucide-react';

export default function WarningAlert() {
  const [warning, setWarning] = useState<{ id: string; message: string } | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    checkForWarnings();
  }, []);

  const checkForWarnings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from('user_warnings')
        .select('id, warning_message')
        .eq('user_id', user.id)
        .is('dismissed_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setWarning({ id: data.id, message: data.warning_message });
        setOpen(true);
      }
    } catch (error) {
      console.error('Error checking warnings:', error);
    }
  };

  const handleDismiss = async () => {
    if (!warning) return;

    try {
      const { error } = await supabase
        .from('user_warnings')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('id', warning.id);

      if (error) throw error;

      setOpen(false);
      setWarning(null);
    } catch (error) {
      console.error('Error dismissing warning:', error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Warning from Administrator
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base whitespace-pre-wrap">
            {warning?.message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleDismiss}>
            I Understand
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
