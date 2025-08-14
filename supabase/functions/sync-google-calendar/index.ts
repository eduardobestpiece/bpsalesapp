import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { calendarId, accessToken, timeMin, timeMax } = await req.json()

    if (!calendarId || !accessToken) {
      return new Response(
        JSON.stringify({ error: 'Calendar ID and access token are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch events from Google Calendar
    const googleCalendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
    const params = new URLSearchParams({
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ahead
      singleEvents: 'true',
      orderBy: 'startTime'
    })

    const response = await fetch(`${googleCalendarUrl}?${params}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('Google Calendar API error:', await response.text())
      return new Response(
        JSON.stringify({ error: 'Failed to fetch Google Calendar events' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const calendarData = await response.json()
    const events = calendarData.items || []

    // Get user's company_id
    const { data: crmUser } = await supabase
      .from('crm_users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!crmUser?.company_id) {
      return new Response(
        JSON.stringify({ error: 'User company not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Clear existing events for this calendar
    await supabase
      .from('google_calendar_events')
      .delete()
      .eq('user_id', user.id)
      .eq('calendar_id', calendarId)

    // Insert new events
    const eventsToInsert = events
      .filter((event: any) => event.start && event.end)
      .map((event: any) => ({
        user_id: user.id,
        company_id: crmUser.company_id,
        google_event_id: event.id,
        calendar_id: calendarId,
        title: event.summary || 'Evento sem título',
        start_time: event.start.dateTime || event.start.date,
        end_time: event.end.dateTime || event.end.date,
        all_day: !event.start.dateTime // If no dateTime, it's an all-day event
      }))

    if (eventsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('google_calendar_events')
        .insert(eventsToInsert)

      if (insertError) {
        console.error('Database insert error:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to save events to database' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        eventsCount: eventsToInsert.length,
        message: `Sincronizados ${eventsToInsert.length} eventos do Google Calendar`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Sync error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})