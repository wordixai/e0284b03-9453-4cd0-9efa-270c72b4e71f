import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InactiveUser {
  user_id: string
  email: string
  last_check_in: string
  hours_since_check_in: number
}

interface EmergencyContact {
  id: string
  user_id: string
  name: string
  email: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const resend = resendApiKey ? new Resend(resendApiKey) : null

    // Find users who haven't checked in for more than 48 hours
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    // Get the latest check-in for each user
    const { data: latestCheckIns, error: checkInsError } = await supabase
      .from('check_ins')
      .select('user_id, checked_at')
      .order('checked_at', { ascending: false })

    if (checkInsError) {
      throw new Error(`Error fetching check-ins: ${checkInsError.message}`)
    }

    // Group by user and get the latest check-in
    const userLastCheckIn = new Map<string, string>()
    for (const checkIn of latestCheckIns || []) {
      if (!userLastCheckIn.has(checkIn.user_id)) {
        userLastCheckIn.set(checkIn.user_id, checkIn.checked_at)
      }
    }

    // Find inactive users (last check-in > 48 hours ago)
    const inactiveUsers: InactiveUser[] = []
    for (const [userId, lastCheckIn] of userLastCheckIn) {
      const lastCheckInDate = new Date(lastCheckIn)
      const hoursSinceCheckIn = (Date.now() - lastCheckInDate.getTime()) / (1000 * 60 * 60)

      if (hoursSinceCheckIn >= 48) {
        // Get user email
        const { data: userData } = await supabase.auth.admin.getUserById(userId)
        if (userData?.user?.email) {
          inactiveUsers.push({
            user_id: userId,
            email: userData.user.email,
            last_check_in: lastCheckIn,
            hours_since_check_in: Math.round(hoursSinceCheckIn),
          })
        }
      }
    }

    // Send notifications for each inactive user
    const notifications: { userId: string; contactEmail: string; status: string }[] = []

    for (const user of inactiveUsers) {
      // Get emergency contacts for this user
      const { data: contacts, error: contactsError } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.user_id)

      if (contactsError) {
        console.error(`Error fetching contacts for user ${user.user_id}:`, contactsError)
        continue
      }

      if (!contacts || contacts.length === 0) {
        console.log(`No emergency contacts for user ${user.user_id}`)
        continue
      }

      // Check if we already sent a notification in the last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: recentNotifications } = await supabase
        .from('notification_logs')
        .select('id')
        .eq('user_id', user.user_id)
        .gte('sent_at', twentyFourHoursAgo)

      if (recentNotifications && recentNotifications.length > 0) {
        console.log(`Already sent notification for user ${user.user_id} in the last 24 hours`)
        continue
      }

      // Send email to each contact
      for (const contact of contacts as EmergencyContact[]) {
        if (!resend) {
          console.log(`[DEV MODE] Would send email to ${contact.email} about ${user.email}`)
          notifications.push({
            userId: user.user_id,
            contactEmail: contact.email,
            status: 'skipped_no_api_key',
          })
          continue
        }

        try {
          const lastCheckInFormatted = new Date(user.last_check_in).toLocaleString('zh-CN', {
            timeZone: 'Asia/Shanghai',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })

          await resend.emails.send({
            from: '死了么 <onboarding@resend.dev>',
            to: contact.email,
            subject: `紧急通知：${user.email} 已超过48小时未签到`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #ef4444;">紧急通知</h1>
                <p>亲爱的 ${contact.name}，</p>
                <p>您被设为 <strong>${user.email}</strong> 的紧急联系人。</p>
                <p>该用户已经超过 <strong>${user.hours_since_check_in} 小时</strong>未在"死了么"应用中签到。</p>
                <p>上次签到时间：<strong>${lastCheckInFormatted}</strong></p>
                <p>请尽快与该用户取得联系，确认其安全状况。</p>
                <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
                <p style="color: #6b7280; font-size: 14px;">
                  此邮件由"死了么"生存确认系统自动发送。
                </p>
              </div>
            `,
          })

          // Log the notification
          await supabase.from('notification_logs').insert({
            user_id: user.user_id,
            contact_id: contact.id,
            status: 'sent',
          })

          notifications.push({
            userId: user.user_id,
            contactEmail: contact.email,
            status: 'sent',
          })
        } catch (emailError) {
          console.error(`Error sending email to ${contact.email}:`, emailError)
          notifications.push({
            userId: user.user_id,
            contactEmail: contact.email,
            status: 'failed',
          })
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        inactiveUsers: inactiveUsers.length,
        notificationsSent: notifications.filter(n => n.status === 'sent').length,
        notifications,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in check-inactive-users function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
