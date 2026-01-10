// Gmail OAuth Callback Handler
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state') // user_id

    if (!code || !state) {
      throw new Error('Missing code or state parameter')
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
        redirect_uri: Deno.env.get('GOOGLE_REDIRECT_URI')!,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      throw new Error(`Token exchange failed: ${error}`)
    }

    const tokens = await tokenResponse.json()

    // Get user's Gmail email
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    const profile = await profileResponse.json()

    // Calculate token expiry
    const expiresIn = tokens.expires_in || 3600
    const tokenExpiry = new Date(Date.now() + expiresIn * 1000).toISOString()

    // Store tokens in database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Store Gmail tokens
    const { error: tokenError } = await supabase
      .from('gmail_tokens')
      .upsert({
        user_id: state,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: tokenExpiry,
        gmail_email: profile.email,
      })

    if (tokenError) throw tokenError

    // Update user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        gmail_connected: true,
        gmail_email: profile.email,
      })
      .eq('id', state)

    if (profileError) throw profileError

    // Trigger initial sync (async, don't wait)
    fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/gmail-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
      },
      body: JSON.stringify({ user_id: state, initial_sync: true }),
    }).catch(console.error)

    // Redirect back to app
    return Response.redirect(`${Deno.env.get('APP_URL')}/dashboard?gmail=connected`, 302)

  } catch (error) {
    console.error('OAuth callback error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
