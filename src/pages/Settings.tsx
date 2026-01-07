import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Mail, CheckCircle2, XCircle, Loader2, RefreshCw, AlertCircle } from 'lucide-react';

interface GmailStatus {
  connected: boolean;
  email: string | null;
  lastSync: string | null;
  documentCount: number;
  documentLimit: number;
}

const Settings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [gmailStatus, setGmailStatus] = useState<GmailStatus>({
    connected: false,
    email: null,
    lastSync: null,
    documentCount: 0,
    documentLimit: 5,
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (authLoading) return; // Wait for auth to load

    if (!user) {
      navigate('/auth');
      return;
    }
    fetchGmailStatus();
  }, [user, authLoading, navigate]);

  const fetchGmailStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('gmail_connected, gmail_email, gmail_last_sync, document_count, document_limit')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      setGmailStatus({
        connected: data.gmail_connected || false,
        email: data.gmail_email,
        lastSync: data.gmail_last_sync,
        documentCount: data.document_count || 0,
        documentLimit: data.document_limit || 5,
      });
    } catch (error) {
      console.error('Error fetching Gmail status:', error);
      toast.error('שגיאה בטעינת הגדרות Gmail');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGmail = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gmail-oauth-callback`;

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email');
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');
    authUrl.searchParams.append('state', user?.id || '');

    window.location.href = authUrl.toString();
  };

  const handleDisconnectGmail = async () => {
    try {
      const { error } = await supabase
        .from('gmail_tokens')
        .delete()
        .eq('user_id', user?.id);

      if (error) throw error;

      await supabase
        .from('profiles')
        .update({
          gmail_connected: false,
          gmail_email: null,
          gmail_last_sync: null,
        })
        .eq('id', user?.id);

      setGmailStatus({
        connected: false,
        email: null,
        lastSync: null,
        documentCount: gmailStatus.documentCount,
        documentLimit: gmailStatus.documentLimit,
      });

      toast.success('Gmail נותק בהצלחה');
    } catch (error) {
      console.error('Error disconnecting Gmail:', error);
      toast.error('שגיאה בניתוק Gmail');
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('gmail-sync', {
        body: { user_id: user?.id, initial_sync: false },
      });

      if (error) throw error;

      toast.success(`סונכרנו ${data.invoices_found || 0} חשבוניות חדשות`);
      fetchGmailStatus();
    } catch (error) {
      console.error('Error syncing Gmail:', error);
      toast.error('שגיאה בסנכרון Gmail');
    } finally {
      setSyncing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const usagePercentage = (gmailStatus.documentCount / gmailStatus.documentLimit) * 100;

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">הגדרות</h1>
          <p className="text-muted-foreground mt-2">נהל את חיבורי Gmail ומגבלות החשבון</p>
        </div>

        {/* Gmail Integration Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>חיבור Gmail</CardTitle>
                  <CardDescription>חבר את חשבון Gmail לסריקה אוטומטית של חשבוניות</CardDescription>
                </div>
              </div>
              {gmailStatus.connected ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  מחובר
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  לא מחובר
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {gmailStatus.connected ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">חשבון מחובר:</span>
                    <span className="font-medium">{gmailStatus.email}</span>
                  </div>
                  {gmailStatus.lastSync && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">סנכרון אחרון:</span>
                      <span className="font-medium">
                        {new Date(gmailStatus.lastSync).toLocaleString('he-IL')}
                      </span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex gap-3">
                  <Button
                    onClick={handleSyncNow}
                    disabled={syncing}
                    variant="outline"
                    className="gap-2"
                  >
                    {syncing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        מסנכרן...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        סנכרן עכשיו
                      </>
                    )}
                  </Button>
                  <Button onClick={handleDisconnectGmail} variant="destructive">
                    נתק חשבון
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>
                    חבר את חשבון Gmail שלך כדי לאפשר סריקה אוטומטית של חשבוניות מהמייל.
                    המערכת תסרוק מיילים משנה אחורה ותמשיך לעקוב אחר חשבוניות חדשות.
                  </p>
                </div>
                <Button onClick={handleConnectGmail} className="w-full gap-2">
                  <Mail className="h-4 w-4" />
                  התחבר עם Gmail
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document Limits Card */}
        <Card>
          <CardHeader>
            <CardTitle>מגבלות מסמכים</CardTitle>
            <CardDescription>מעקב אחר שימוש במסמכים החודשי</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">מסמכים בחודש הנוכחי:</span>
                <span className="font-bold text-lg">
                  {gmailStatus.documentCount} / {gmailStatus.documentLimit}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    usagePercentage >= 100
                      ? 'bg-destructive'
                      : usagePercentage >= 80
                      ? 'bg-yellow-500'
                      : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>

              {usagePercentage >= 100 && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>הגעת למגבלת המסמכים החודשית. שדרג לתכנית Pro להמשך שימוש.</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Pricing Plans */}
            <div className="space-y-3">
              <h4 className="font-semibold">תכניות תמחור:</h4>
              <div className="grid gap-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Free</p>
                    <p className="text-sm text-muted-foreground">עד 5 מסמכים בחודש</p>
                  </div>
                  <Badge variant="outline">₪0</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border-2 border-primary rounded-lg">
                  <div>
                    <p className="font-medium">Pro</p>
                    <p className="text-sm text-muted-foreground">עד 50 מסמכים בחודש</p>
                  </div>
                  <Badge variant="default">₪50/חודש</Badge>
                </div>
              </div>

              {gmailStatus.documentLimit === 5 && (
                <Button className="w-full" disabled>
                  שדרג ל-Pro (בקרוב)
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
