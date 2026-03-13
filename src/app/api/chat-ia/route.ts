import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = 'gemini-1.5-flash-latest'

const SYSTEM_INSTRUCTION =
  'Você é uma IA integrada ao sistema Plify (gestão de clientes, propostas, contratos, projetos, financeiro e marketing). Responda SEMPRE em português do Brasil, de forma clara e direta, ajudando o usuário a resolver dúvidas de negócio, organizar tarefas e pensar estratégias.'

const MSG_EM_CRIACAO =
  'Esta função ainda está em criação. Em breve você poderá conversar com a IA aqui.'

interface HistoryItem {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
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

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: SYSTEM_INSTRUCTION,
    })

    const geminiHistory: { role: 'user' | 'model'; parts: { text: string }[] }[] = []
    if (Array.isArray(history)) {
      for (const h of history) {
        if (!h?.content) continue
        geminiHistory.push({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }],
        })
      }
    }

    const chat = model.startChat({ history: geminiHistory })
    const result = await chat.sendMessage(message)
    const reply = result.response.text()?.trim() ?? 'Não consegui gerar uma resposta agora.'

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Chat IA (Gemini) error:', err)
    return NextResponse.json(
      { error: 'Erro interno ao processar a mensagem.' },
      { status: 500 },
    )
  }
}
