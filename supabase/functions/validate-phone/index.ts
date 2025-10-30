// deno-lint-ignore-file no-explicit-any
// Edge function para validar existência de número de telefone via Twilio Lookup (ou retornar 'skipped' se não configurado)
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type LookupResponse = {
  valid: boolean;
  carrier?: any;
  country_code?: string;
};

async function twilioLookup(e164: string): Promise<LookupResponse> {
  const sid = Deno.env.get('TWILIO_SID');
  const token = Deno.env.get('TWILIO_TOKEN');
  if (!sid || !token) return { valid: false };

  const auth = btoa(`${sid}:${token}`);
  const url = `https://lookups.twilio.com/v1/PhoneNumbers/${encodeURIComponent(e164)}?Type=carrier`;
  const res = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
  if (res.ok) {
    const data = await res.json();
    return { valid: true, carrier: data?.carrier, country_code: data?.country_code };
  }
  return { valid: false };
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }
  try {
    const { phone } = await req.json(); // phone esperado em formato E.164 (ex: +5511999999999) ou com DDI separado
    if (!phone || typeof phone !== 'string') {
      return new Response(JSON.stringify({ valid: false, reason: 'missing_phone' }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Normalizar para E.164: aceitar números com + ou apenas dígitos
    const digits = phone.replace(/[^\d+]/g, '');
    const e164 = digits.startsWith('+') ? digits : `+${digits}`;

    const sid = Deno.env.get('TWILIO_SID');
    const token = Deno.env.get('TWILIO_TOKEN');
    if (!sid || !token) {
      return new Response(JSON.stringify({ valid: true, skipped: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    const result = await twilioLookup(e164);
    return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ valid: false, error: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});


