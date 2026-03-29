import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Variáveis de ambiente configuradas no Dashboard do Supabase (Edge Functions)
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.log("Resend API Key não configurada, pulando email.");
    return;
  }
  
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Z Dados <onboarding@resend.dev>', // Cadastrar seu domínio no Resend depois
      to: [to],
      subject,
      html
    })
  });
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Lida com preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    
    // Mapeamento compatível com o Payload Real da InfinitePay
    const customerEmail = payload.customer?.email || payload.billing_info?.email; 
    const paymentStatus = payload.status;
    
    if (!customerEmail) {
       return new Response('Missing Email', { status: 400, headers: corsHeaders })
    }

    if (paymentStatus === 'approved' || paymentStatus === 'paid') {
      const { error } = await supabase
        .from('perfis')
        .update({ assinatura_ativa: true })
        .eq('email', customerEmail)

      if (error) throw error;
      
      await sendEmail(
         customerEmail, 
         'Z Dados | Acesso Liberado!', 
         '<div style="font-family: Arial;"><h2>Pagamento Processado</h2><p>Seu painel Z Dados já está blindado e liberado para uso.</p></div>'
      );
      
      return new Response(JSON.stringify({ success: true, status: 'activated' }), { 
         headers: { ...corsHeaders, "Content-Type": "application/json" } 
      })
    }
    
    // Bloqueio por cancelamento/recusa
    if (paymentStatus === 'declined' || paymentStatus === 'canceled' || paymentStatus === 'refunded') {
      const { error } = await supabase
        .from('perfis')
        .update({ assinatura_ativa: false })
        .eq('email', customerEmail)
        
      if (error) throw error;
      
      await sendEmail(
         customerEmail, 
         'Z Dados | Aviso Importante', 
         '<div style="font-family: Arial;"><h2 style="color: red;">Problema no Pagamento</h2><p>Sua assinatura foi pausada ou o pagamento falhou na InfinitePay. Regularize para reativar seu acesso.</p></div>'
      );

      return new Response(JSON.stringify({ locked: true }), { 
         headers: { ...corsHeaders, "Content-Type": "application/json" } 
      })
    }

    return new Response('Evento Ignorado', { status: 200, headers: corsHeaders })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
       status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    })
  }
})
