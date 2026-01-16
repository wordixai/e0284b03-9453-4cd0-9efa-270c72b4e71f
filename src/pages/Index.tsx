import { useState, useEffect, useCallback } from "react";
import { CheckInButton } from "@/components/CheckInButton";
import { StatusCard } from "@/components/StatusCard";
import { EmergencyContact, Contact } from "@/components/EmergencyContact";
import { CheckInHistory } from "@/components/CheckInHistory";
import { AuthForm } from "@/components/AuthForm";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { HeartPulse, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase, CheckIn, EmergencyContact as DBContact } from "@/lib/supabase";

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [checkIns, setCheckIns] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Load data from Supabase
  const loadData = useCallback(async () => {
    if (!user) return;

    setDataLoading(true);
    try {
      // Load check-ins
      const { data: checkInsData, error: checkInsError } = await supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', user.id)
        .order('checked_at', { ascending: false });

      if (checkInsError) throw checkInsError;

      setCheckIns((checkInsData as CheckIn[]).map(c => new Date(c.checked_at)));

      // Load contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id);

      if (contactsError) throw contactsError;

      setContacts((contactsData as DBContact[]).map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
      })));
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('加载数据失败');
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  // Check if already checked in today
  const isCheckedToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return checkIns.some(date => {
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      return checkDate.getTime() === today.getTime();
    });
  };

  // Calculate streak
  const calculateStreak = () => {
    if (checkIns.length === 0) return 0;

    const sortedDates = [...checkIns]
      .map(d => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime());

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedDates.length; i++) {
      const checkDate = new Date(sortedDates[i]);
      checkDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);

      if (checkDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else if (i === 0 && checkDate.getTime() === new Date(today.getTime() - 86400000).getTime()) {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        if (checkDate.getTime() === yesterday.getTime()) {
          streak++;
        } else {
          break;
        }
      } else {
        break;
      }
    }
    return streak;
  };

  // Calculate hours remaining until 48h mark
  const calculateHoursRemaining = () => {
    if (checkIns.length === 0) return 48;

    const lastCheckIn = checkIns.reduce((latest, current) => {
      const currentDate = new Date(current);
      const latestDate = new Date(latest);
      return currentDate > latestDate ? current : latest;
    });

    const lastCheckInTime = new Date(lastCheckIn).getTime();
    const now = Date.now();
    const hoursElapsed = (now - lastCheckInTime) / (1000 * 60 * 60);
    return Math.max(0, Math.ceil(48 - hoursElapsed));
  };

  // Get last check-in date
  const getLastCheckIn = () => {
    if (checkIns.length === 0) return null;
    return checkIns.reduce((latest, current) => {
      const currentDate = new Date(current);
      const latestDate = new Date(latest);
      return currentDate > latestDate ? current : latest;
    });
  };

  // Handle check-in
  const handleCheckIn = async () => {
    if (isCheckedToday() || !user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('check_ins')
        .insert({
          user_id: user.id,
          checked_at: new Date().toISOString(),
        });

      if (error) throw error;

      setCheckIns(prev => [new Date(), ...prev]);
      toast.success("签到成功！", {
        description: "您的紧急联系人不会收到通知",
      });
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error('签到失败');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle contact management
  const handleAddContact = async (contact: Omit<Contact, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .insert({
          user_id: user.id,
          name: contact.name,
          email: contact.email,
        })
        .select()
        .single();

      if (error) throw error;

      setContacts(prev => [...prev, { id: data.id, name: data.name, email: data.email }]);
      toast.success("联系人已添加");
    } catch (error) {
      console.error('Error adding contact:', error);
      toast.error('添加联系人失败');
    }
  };

  const handleRemoveContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setContacts(prev => prev.filter(c => c.id !== id));
      toast.success("联系人已删除");
    } catch (error) {
      console.error('Error removing contact:', error);
      toast.error('删除联系人失败');
    }
  };

  const handleUpdateContact = async (id: string, contact: Omit<Contact, 'id'>) => {
    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .update({
          name: contact.name,
          email: contact.email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      setContacts(prev =>
        prev.map(c => (c.id === id ? { ...contact, id } : c))
      );
      toast.success("联系人已更新");
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error('更新联系人失败');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setContacts([]);
    setCheckIns([]);
    toast.success("已退出登录");
  };

  const lastCheckIn = getLastCheckIn();

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show auth form if not logged in
  if (!user) {
    return (
      <>
        <Toaster position="top-center" richColors />
        <AuthForm />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <HeartPulse className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">死了么</h1>
                <p className="text-sm text-muted-foreground">生存确认系统</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user.email}
              </span>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {dataLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Check-in Section */}
            <section className="flex flex-col items-center py-12">
              <CheckInButton
                isCheckedToday={isCheckedToday()}
                onCheckIn={handleCheckIn}
                isLoading={isLoading}
              />
              <p className="mt-6 text-center text-muted-foreground max-w-sm">
                每天点击一次签到，确认您的存活状态。<br />
                连续 48 小时未签到将通知您的紧急联系人。
              </p>
            </section>

            {/* Status Section */}
            <section>
              <StatusCard
                lastCheckIn={lastCheckIn ? new Date(lastCheckIn) : null}
                streak={calculateStreak()}
                hoursRemaining={calculateHoursRemaining()}
              />
            </section>

            {/* History Section */}
            <section>
              <CheckInHistory history={checkIns} />
            </section>

            {/* Emergency Contact Section */}
            <section>
              <EmergencyContact
                contacts={contacts}
                onAddContact={handleAddContact}
                onRemoveContact={handleRemoveContact}
                onUpdateContact={handleUpdateContact}
              />
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>保持签到，让关心您的人安心</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
