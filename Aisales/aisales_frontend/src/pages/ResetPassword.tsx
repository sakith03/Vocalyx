import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const ResetPassword = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const submit = async () => {
    if (!token) {
      toast({ variant: 'destructive', title: 'Invalid link', description: 'Reset token is missing.' });
      return;
    }
    if (!newPassword || !confirmPassword) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Enter and confirm your new password.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Password mismatch', description: 'Passwords do not match.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:8080/api/users/perform-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      });
      if (!res.ok) throw new Error('Reset failed');
      toast({ title: 'Password reset successfully', description: 'Please log in again.' });
      navigate('/login');
    } catch (e) {
      toast({ variant: 'destructive', title: 'Reset failed', description: 'Link may be expired or invalid.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set a new password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <Button onClick={submit} disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Submitting...' : 'Reset Password'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;


