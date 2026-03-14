import { NextRequest, NextResponse } from 'next/server'

const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const SYSTEM_INSTRUCTION = `Você é uma IA integrada ao sistema Plify (gestão de clientes, propostas, contratos, projetos, financeiro e marketing). Responda SEMPRE em português do Brasil, de forma clara e direta.

REGRA IMPORTANTE SOBRE INFORMAÇÕES ATUALIZADAS:
- Você tem acesso à busca na web. USE-A sempre que o usuário perguntar sobre: datas, prazos, calendário, declaração de IR/IRPF, Receita Federal, notícias recentes, regras oficiais ou qualquer informação que possa ter sido divulgada recentemente.
- NUNCA responda que "as datas ainda não foram anunciadas" ou que "não há informação" sem antes usar a busca para conferir as últimas notícias e comunicados oficiais.
- Para IRPF, impostos e prazos governamentais, busque na web e traga o calendário e as datas mais atuais disponíveis, com fontes quando possível.
- Dê respostas completas e úteis, com datas, prazos e dicas práticas quando o tema for relevante (ex.: o que já pode ser feito, documentação necessária).`

const MSG_EM_CRIACAO =
  'Esta função ainda está em criação. Em breve você poderá conversar com a IA aqui.'

interface HistoryItem {
  role: 'user' | 'assistant'
  content: string
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message: unknown }).message)
  return 'Erro desconhecido.'
}

export async function POST(req: NextRequest) {
  const apiKey = (process.env.GEMINI_API_KEY ?? '').trim()
  if (!apiKey) {
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

    // Montar contents: histórico + mensagem atual (formato da API REST)
    const contents: { role: string; parts: { text: string }[] }[] = []
    if (Array.isArray(history)) {
      for (const h of history) {
        if (!h?.content) continue
        contents.push({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }],
        })
      }
    }
    contents.push({ role: 'user', parts: [{ text: message }] })

    const body = {
      systemInstruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }],
      },
      contents,
      tools: [{ google_search: {} }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    }

    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[]
      error?: { message?: string; status?: string }
    }

    if (!res.ok) {
      const errMsg = data.error?.message ?? `HTTP ${res.status}`
      console.error('Chat IA (Gemini) API error:', errMsg, data)
      if (/API key not valid|403|401/i.test(errMsg)) {
        return NextResponse.json(
          { error: 'Chave da API inválida ou sem permissão. Verifique a configuração no Google AI Studio.' },
          { status: 500 },
        )
      }
      if (/429|quota|rate limit/i.test(errMsg)) {
        return NextResponse.json(
          { error: 'Limite de uso da API atingido. Tente novamente mais tarde.' },
          { status: 500 },
        )
      }
      if (/404|not found/i.test(errMsg)) {
        return NextResponse.json(
          { error: 'Modelo não encontrado. Verifique o nome do modelo na API.' },
          { status: 500 },
        )
      }
      return NextResponse.json({ error: errMsg }, { status: 500 })
    }

    const textPart = data.candidates?.[0]?.content?.parts?.[0]?.text
    const reply = (textPart?.trim() ?? '') || 'Não consegui gerar uma resposta agora.'

    return NextResponse.json({ reply })
  } catch (err) {
    const msg = getErrorMessage(err)
    console.error('Chat IA (Gemini) error:', msg, err)

    let userMessage = 'Erro ao falar com a IA. Tente novamente.'
    if (/API key not valid|invalid.*api.*key|403|401/i.test(msg)) {
      userMessage = 'Chave da API inválida ou sem permissão. Verifique a configuração no Google AI Studio.'
    } else if (/429|quota|rate limit/i.test(msg)) {
      userMessage = 'Limite de uso da API atingido. Tente novamente mais tarde.'
    } else if (/404|not found/i.test(msg)) {
      userMessage = 'Modelo não encontrado. Verifique o nome do modelo na API.'
    } else if (msg && msg.length < 200) {
      userMessage = msg
    }

    return NextResponse.json({ error: userMessage }, { status: 500 })
  }
}
