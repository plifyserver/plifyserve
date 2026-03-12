import { NextRequest, NextResponse } from 'next/server'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
// Modelo via OpenRouter (ex.: free: google/gemini-2.0-flash-exp:free)
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free'

interface HistoryItem {
  role: 'user' | 'assistant'
  content: string
}

const MSG_EM_CRIACAO =
  'Esta função ainda está em criação. Em breve você poderá conversar com a IA aqui.'

export async function POST(req: NextRequest) {
  if (!OPENROUTER_API_KEY) {
    return NextResponse.json({ reply: MSG_EM_CRIACAO })
  }

  try {
    const { message, history } = (await req.json()) as {
      message: string
      history?: HistoryItem[]
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Mensagem inválida.' }, { status: 400 })
    }

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      {
        role: 'system',
        content:
          'Você é uma IA integrada ao sistema Plify (gestão de clientes, propostas, contratos, projetos, financeiro e marketing). Responda SEMPRE em português do Brasil, de forma clara e direta, ajudando o usuário a resolver dúvidas de negócio, organizar tarefas e pensar estratégias.',
      },
    ]

    if (Array.isArray(history)) {
      for (const h of history) {
        if (!h?.content) continue
        messages.push({
          role: h.role === 'assistant' ? 'assistant' : 'user',
          content: h.content,
        })
      }
    }

    messages.push({ role: 'user', content: message })

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('OpenRouter error:', res.status, text)
      return NextResponse.json(
        { error: 'Erro ao chamar a API (OpenRouter). Tente novamente.' },
        { status: 500 },
      )
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
    }

    const reply =
      data.choices?.[0]?.message?.content?.trim() ?? 'Não consegui gerar uma resposta agora.'

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Chat IA error:', err)
    return NextResponse.json(
      { error: 'Erro interno ao processar a mensagem.' },
      { status: 500 },
    )
  }
}
