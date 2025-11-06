import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { record } = await req.json()

    // Verifica se já existe algum admin
    const { count } = await supabaseClient
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin')

    // Se não existe nenhum admin, promove o primeiro usuário
    if (count === 0) {
      await supabaseClient
        .from('user_roles')
        .insert({
          user_id: record.id,
          role: 'admin'
        })

      console.log(`Primeiro admin criado: ${record.id}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
