// Gmail Sync - Scan emails and extract invoices
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GmailMessage {
  id: string
  threadId: string
  labelIds: string[]
  snippet: string
  payload: {
    headers: Array<{ name: string; value: string }>
    parts?: Array<{
      mimeType: string
      filename: string
      body: {
        attachmentId?: string
        data?: string
      }
    }>
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, initial_sync = false } = await req.json()

    if (!user_id) {
      throw new Error('user_id is required')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get user's Gmail tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('gmail_tokens')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (tokenError || !tokenData) {
      throw new Error('Gmail not connected')
    }

    // Check if token is expired and refresh if needed
    let accessToken = tokenData.access_token
    if (new Date(tokenData.token_expiry) < new Date()) {
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
          refresh_token: tokenData.refresh_token,
          grant_type: 'refresh_token',
        }),
      })

      const newTokens = await refreshResponse.json()
      accessToken = newTokens.access_token

      // Update tokens in database
      await supabase
        .from('gmail_tokens')
        .update({
          access_token: newTokens.access_token,
          token_expiry: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
        })
        .eq('user_id', user_id)
    }

    // Build Gmail API query
    let query = 'has:attachment (חשבונית OR invoice OR receipt OR קבלה)'

    // For initial sync, get emails from last year
    if (initial_sync) {
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      const dateStr = oneYearAgo.toISOString().split('T')[0].replace(/-/g, '/')
      query += ` after:${dateStr}`
    } else {
      // Get emails from last sync or last 7 days
      const lastSync = tokenData.gmail_last_sync || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const dateStr = new Date(lastSync).toISOString().split('T')[0].replace(/-/g, '/')
      query += ` after:${dateStr}`
    }

    // Search Gmail
    const searchResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )

    const searchData = await searchResponse.json()
    const messages = searchData.messages || []

    console.log(`Found ${messages.length} potential invoice emails`)

    let processedCount = 0
    let invoiceCount = 0

    // Process each message
    for (const message of messages.slice(0, 20)) { // Limit to 20 per sync
      try {
        // Check if already processed
        const { data: existing } = await supabase
          .from('processed_emails')
          .select('id')
          .eq('user_id', user_id)
          .eq('gmail_message_id', message.id)
          .single()

        if (existing) {
          console.log(`Skipping already processed email: ${message.id}`)
          continue
        }

        // Get full message
        const messageResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        )

        const fullMessage: GmailMessage = await messageResponse.json()

        // Extract attachments
        const attachments = fullMessage.payload.parts?.filter(
          part => part.filename && part.body.attachmentId
        ) || []

        console.log(`Message ${message.id} has ${attachments.length} attachments`)

        for (const attachment of attachments) {
          // Only process PDFs and images
          if (!attachment.mimeType.includes('pdf') && !attachment.mimeType.includes('image')) {
            continue
          }

          // Get attachment data
          const attachmentResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}/attachments/${attachment.body.attachmentId}`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          )

          const attachmentData = await attachmentResponse.json()

          // Call document classifier
          const classifyResponse = await fetch(
            `${Deno.env.get('SUPABASE_URL')}/functions/v1/classify-document`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
              },
              body: JSON.stringify({
                user_id,
                file_data: attachmentData.data,
                file_type: attachment.mimeType,
                filename: attachment.filename,
                source: 'gmail',
                gmail_message_id: message.id,
              }),
            }
          )

          const classifyResult = await classifyResponse.json()

          if (classifyResult.is_invoice) {
            invoiceCount++
          }

          processedCount++
        }

        // Mark email as processed
        await supabase.from('processed_emails').insert({
          user_id,
          email_id: message.id,
          gmail_message_id: message.id,
          status: 'processed',
        })

      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error)

        await supabase.from('processed_emails').insert({
          user_id,
          email_id: message.id,
          gmail_message_id: message.id,
          status: 'error',
          rejection_reason: error.message,
        })
      }
    }

    // Update last sync time
    await supabase
      .from('gmail_tokens')
      .update({ gmail_last_sync: new Date().toISOString() })
      .eq('user_id', user_id)

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        invoices_found: invoiceCount,
        total_emails: messages.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Gmail sync error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
