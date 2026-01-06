import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log('Received webhook payload:', JSON.stringify(body));

    // Extract user_id from the request - required field
    const userId = body.user_id;
    if (!userId) {
      console.error('Missing user_id in request');
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle both single invoice and array of invoices
    const invoicesData = Array.isArray(body.invoices) ? body.invoices : [body];

    // Helper to parse date from DD/MM/YYYY format
    const parseDate = (dateStr: string): string => {
      if (!dateStr) return new Date().toISOString().split('T')[0];
      // Check if already in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
      // Parse DD/MM/YYYY format
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      return new Date().toISOString().split('T')[0];
    };

    // Map entry method from Hebrew
    const mapEntryMethod = (format: string): string => {
      if (format === 'דיגיטלי') return 'דיגיטלי';
      if (format === 'ידני') return 'ידני';
      return 'דיגיטלי';
    };

    // Map business type - normalize variations
    const mapBusinessType = (type: string | null): string | null => {
      if (!type) return null;
      // Normalize "ספק חול" (without quotation mark) to "ספק חו"ל"
      if (type === 'ספק חול' || type === 'ספק חו"ל' || type === 'ספק חו״ל') return 'ספק חו"ל';
      if (type === 'עוסק מורשה') return 'עוסק מורשה';
      if (type === 'עוסק פטור') return 'עוסק פטור';
      if (type === 'חברה בע"מ' || type === 'חברה בע״מ') return 'חברה בע"מ';
      return type;
    };

    const invoicesToInsert = invoicesData.map((invoice: any) => {
      // Support both Hebrew and English field names - keep empty values as null
      const supplierName = invoice['שם הספק'] || invoice.supplier_name || null;
      const documentDate = invoice['תאריך מסמך'] || invoice.document_date;
      const documentType = invoice['סוג מסמך'] || invoice.document_type || null;
      const documentNumber = invoice['מספר מסמך'] || invoice.document_number || null;
      const rawTotalAmount = invoice['סכום כולל מע"מ'] || invoice['סכום כולל מע״מ'] || invoice.total_amount || invoice['סהכ'] || invoice['סה"כ'];
      const category = invoice['קטגוריה'] || invoice.category || null;
      const entryMethod = invoice['פורמט מסמך'] || invoice.entry_method || null;
      const businessType = invoice['סוג עוסק'] || invoice.business_type || null;
      const imageUrl = invoice['קישור לתמונה'] || invoice['תמונה'] || invoice.image_url || null;

      // Parse total amount - this is the only required amount field
      const parsedTotal = parseFloat(rawTotalAmount) || 0;

      // VAT calculation is now handled by database trigger based on business_type
      // Just pass total_amount and business_type, trigger will calculate VAT
      console.log(`Importing invoice - Total: ${parsedTotal}, Business Type: ${mapBusinessType(businessType)}`);

      return {
        user_id: userId,
        intake_date: invoice.intake_date || new Date().toISOString(),
        document_date: documentDate ? parseDate(documentDate) : null,
        status: invoice.status || 'חדש',
        supplier_name: supplierName,
        document_number: documentNumber,
        document_type: documentType,
        category: category,
        total_amount: parsedTotal || null,
        business_type: mapBusinessType(businessType),
        entry_method: entryMethod,
        image_url: imageUrl,
        // amount_before_vat and vat_amount will be calculated by database trigger
      };
    });

    console.log('Inserting invoices:', JSON.stringify(invoicesToInsert));

    const { data, error } = await supabase
      .from('invoices')
      .insert(invoicesToInsert)
      .select();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully inserted:', data?.length, 'invoices');

    return new Response(
      JSON.stringify({ success: true, inserted: data?.length || 0, data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
