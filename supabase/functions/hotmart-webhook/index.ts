import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const HOTMART_TOKEN = Deno.env.get('HOTMART_TOKEN') // Configure isso no Dashboard do Supabase

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hotmart-hcode',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Verificação de Segurança (Hcode da Hotmart)
    const hcode = req.headers.get('x-hotmart-hcode')
    if (HOTMART_TOKEN && hcode !== HOTMART_TOKEN) {
      console.error('Falha na autenticação do Webhook: Token inválido')
      return new Response('Unauthorized', { status: 401 })
    }

    const payload = await req.json()
    const { event, data } = payload
    
    // 2. Extrair dados do cliente
    const customerEmail = data.buyer?.email
    const status = event // Ex: PURCHASE_APPROVED, PURCHASE_COMPLETE, etc.

    if (!customerEmail) {
      return new Response('Missing Email', { status: 400 })
    }

    console.log(`Processando evento ${event} para ${customerEmail}`)

    // 3. Lógica de Ativação (Compra aprovada ou Completa)
    if (event === 'PURCHASE_APPROVED' || event === 'PURCHASE_COMPLETE') {
      const { error } = await supabase
        .from('perfis')
        .update({ assinatura_ativa: true })
        .eq('email', customerEmail)

      if (error) throw error
      console.log(`Assinatura ATIVADA para ${customerEmail}`)
    }

    // 4. Lógica de Bloqueio (Reembolso, Cancelamento ou Expiração)
    if (['PURCHASE_REFUNDED', 'PURCHASE_CANCELED', 'SUBSCRIPTION_CANCELLATION', 'PURCHASE_EXPIRED'].includes(event)) {
      const { error } = await supabase
        .from('perfis')
        .update({ assinatura_ativa: false })
        .eq('email', customerEmail)

      if (error) throw error
      console.log(`Assinatura SUSPENSA para ${customerEmail}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('Erro no Webhook:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
