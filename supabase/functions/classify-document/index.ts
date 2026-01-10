// Document Classifier using OpenAI GPT-4 Vision
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, file_data, file_type, filename, source, gmail_message_id } = await req.json()

    if (!user_id || !file_data) {
      throw new Error('Missing required fields')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Check user's document limit
    const { data: profile } = await supabase
      .from('profiles')
      .select('document_count, document_limit')
      .eq('id', user_id)
      .single()

    if (profile && profile.document_count >= profile.document_limit) {
      throw new Error('Document limit reached. Please upgrade your plan.')
    }

    console.log(`Classifying document: ${filename}`)

    // Prepare image for OpenAI
    const imageData = `data:${file_type};base64,${file_data}`

    // Call OpenAI GPT-4 Vision
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert document classifier for Israeli invoices and receipts. Your task is to:
1. Determine if the document is a valid tax invoice (חשבונית מס), receipt (קבלה), or invoice (חשבונית).
2. Extract key information if it's an invoice.

REJECT these documents:
- Purchase orders (אישור הזמנה)
- Transaction confirmations (אישור עסקה)
- Bank statements (דפי חשבון)
- Delivery notes (תעודת משלוח)
- Quotes (הצעת מחיר)
- Personal emails or letters

ACCEPT only:
- Tax invoices (חשבונית מס / חשבונית מס קבלה)
- Receipts with VAT (קבלה)
- Regular invoices (חשבונית)

Respond ONLY with valid JSON in this exact format:
{
  "is_invoice": true/false,
  "document_type": "חשבונית מס" | "קבלה" | "אישור הזמנה" | "אחר",
  "confidence": 0-100,
  "rejection_reason": "reason if rejected",
  "data": {
    "supplier_name": "...",
    "document_number": "...",
    "document_date": "YYYY-MM-DD",
    "total_amount": number,
    "vat_amount": number,
    "business_type": "עוסק מורשה" | "עוסק פטור" | "חברה בע\\"מ" | "ספק חו\\"ל",
    "category": "..."
  }
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this document and determine if it\'s a valid invoice. Extract all relevant information.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      throw new Error(`OpenAI API error: ${error}`)
    }

    const openaiResult = await openaiResponse.json()
    const content = openaiResult.choices[0].message.content

    // Parse JSON response
    let classification
    try {
      // Remove markdown code blocks if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content
      classification = JSON.parse(jsonStr)
    } catch (e) {
      console.error('Failed to parse OpenAI response:', content)
      throw new Error('Invalid response from AI')
    }

    console.log('Classification result:', classification)

    // If it's an invoice, create it in the database
    if (classification.is_invoice && classification.data) {
      const invoiceData = {
        user_id,
        supplier_name: classification.data.supplier_name || 'לא זוהה',
        document_number: classification.data.document_number || `AUTO-${Date.now()}`,
        document_type: classification.document_type || 'חשבונית מס',
        document_date: classification.data.document_date || new Date().toISOString().split('T')[0],
        intake_date: new Date().toISOString().split('T')[0],
        total_amount: classification.data.total_amount || 0,
        business_type: classification.data.business_type || 'עוסק מורשה',
        category: classification.data.category || 'כללי',
        status: 'חדש',
        entry_method: 'דיגיטלי',
        image_url: null, // TODO: Upload to storage
      }

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single()

      if (invoiceError) {
        throw invoiceError
      }

      // Update processed_emails with invoice_id
      if (gmail_message_id) {
        await supabase
          .from('processed_emails')
          .update({ invoice_id: invoice.id, status: 'processed' })
          .eq('user_id', user_id)
          .eq('gmail_message_id', gmail_message_id)
      }

      // Increment user's document count
      await supabase.rpc('increment_document_count', { user_id_param: user_id })

      return new Response(
        JSON.stringify({
          ...classification,
          invoice_id: invoice.id,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } else {
      // Document rejected
      if (gmail_message_id) {
        await supabase
          .from('processed_emails')
          .update({
            status: 'rejected',
            rejection_reason: classification.rejection_reason || 'Not an invoice',
          })
          .eq('user_id', user_id)
          .eq('gmail_message_id', gmail_message_id)
      }

      return new Response(
        JSON.stringify(classification),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

  } catch (error) {
    console.error('Document classification error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
