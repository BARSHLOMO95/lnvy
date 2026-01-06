import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Running VAT migration...');

    // Drop existing triggers and function
    const dropSQL = `
      DROP TRIGGER IF EXISTS calculate_vat_on_insert ON public.invoices;
      DROP TRIGGER IF EXISTS calculate_vat_on_update ON public.invoices;
      DROP FUNCTION IF EXISTS public.calculate_vat_on_invoice();
    `;

    // Create new function
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.calculate_vat_with_business_type()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SET search_path = public
      AS $$
      BEGIN
        -- Normalize business_type variants for foreign supplier
        IF NEW.business_type IN ('ספק חול', 'ספק חו"ל', 'ספק חו״ל') THEN
          NEW.business_type := 'ספק חו"ל';
        END IF;

        -- Calculate VAT based on business_type
        IF NEW.total_amount IS NOT NULL AND NEW.total_amount > 0 THEN
          IF NEW.business_type IN ('ספק חו"ל', 'עוסק פטור') THEN
            NEW.vat_amount := 0;
            NEW.amount_before_vat := NEW.total_amount;
          ELSE
            NEW.amount_before_vat := ROUND((NEW.total_amount / 1.18)::numeric, 2);
            NEW.vat_amount := ROUND((NEW.total_amount - NEW.amount_before_vat)::numeric, 2);
          END IF;
        END IF;

        RETURN NEW;
      END;
      $$;
    `;

    // Create triggers
    const createTriggersSQL = `
      CREATE TRIGGER calculate_vat_on_insert
      BEFORE INSERT ON public.invoices
      FOR EACH ROW
      EXECUTE FUNCTION public.calculate_vat_with_business_type();

      CREATE TRIGGER calculate_vat_on_update
      BEFORE UPDATE ON public.invoices
      FOR EACH ROW
      WHEN (
        OLD.total_amount IS DISTINCT FROM NEW.total_amount OR
        OLD.business_type IS DISTINCT FROM NEW.business_type OR
        OLD.document_type IS DISTINCT FROM NEW.document_type
      )
      EXECUTE FUNCTION public.calculate_vat_with_business_type();
    `;

    // Execute migrations
    const { error: dropError } = await supabase.rpc('exec', { sql: dropSQL });
    if (dropError) console.log('Drop error (might be ok):', dropError);

    const { error: funcError } = await supabase.rpc('exec', { sql: createFunctionSQL });
    if (funcError) throw new Error(`Function creation error: ${funcError.message}`);

    const { error: trigError } = await supabase.rpc('exec', { sql: createTriggersSQL });
    if (trigError) throw new Error(`Trigger creation error: ${trigError.message}`);

    console.log('Migration completed successfully!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'VAT migration completed successfully!'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Migration error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
