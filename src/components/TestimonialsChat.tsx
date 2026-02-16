'use client'

import { ArrowLeft, Phone, Video, MoreVertical } from 'lucide-react'

const chats = [
  {
    user: 'Renata Sterling',
    photo: 'https://i.pravatar.cc/150?img=5',
    messages: [
      { text: 'PERFEIÇÃO! Fácil de plugar, encantador', time: '11:44', fromCustomer: true },
    ],
  },
  {
    user: 'Guilherme Mendes',
    photo: 'https://i.pravatar.cc/150?img=12',
    messages: [
      { text: 'Salvou meu tempo real. Dash absurda!', time: '1:30', fromCustomer: true },
    ],
  },
  {
    user: 'Arthur Nóbrega',
    photo: 'https://i.pravatar.cc/150?img=15',
    messages: [
      { text: 'A qualidade visual e as funcionalidades são absurdas. Parabéns!!', time: '9:18', fromCustomer: true },
    ],
  },
  {
    user: 'Gustavo Azevedo',
    photo: 'https://i.pravatar.cc/150?img=33',
    messages: [
      { text: 'A taxa de fechamento subiu um absurdo. Não preciso ficar criando relatório', time: '2:15', fromCustomer: true },
    ],
  },
  {
    user: 'Camila Foco',
    photo: 'https://i.pravatar.cc/150?img=9',
    messages: [
      { text: 'Acesso em tempo real agrega muito. Validado em 5 segundos.', time: '4:42', fromCustomer: true },
    ],
  },
  {
    user: 'André Norton',
    photo: 'https://i.pravatar.cc/150?img=45',
    messages: [
      { text: 'Os clientes simplesmente piraram com as propostas. Recomendo demais!', time: '7:20', fromCustomer: true },
    ],
  },
  {
    user: 'Lucas Botelho',
    photo: 'https://i.pravatar.cc/150?img=22',
    messages: [
      { text: 'Implementei em 1 dia. Meus relatórios agora visualizam no celular.', time: '10:05', fromCustomer: true },
    ],
  },
  {
    user: 'Marina Silva',
    photo: 'https://i.pravatar.cc/150?img=1',
    messages: [
      { text: 'Automatizei tudo. O Plify fez a diferença no fechamento.', time: '6:33', fromCustomer: true },
    ],
  },
]

function ChatBubble({ text, time, fromCustomer }: { text: string; time: string; fromCustomer: boolean }) {
  return (
    <div className={`flex ${fromCustomer ? 'justify-start' : 'justify-end'} mb-2`}>
      <div
        className={`max-w-[85%] px-3 py-2 rounded-lg ${
          fromCustomer
            ? 'bg-[#202c33] text-zinc-100 rounded-tl-none'
            : 'bg-[#005c4b] text-white rounded-tr-none'
        }`}
      >
        <p className="text-sm">{text}</p>
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[10px] text-white/60">{time}</span>
          {!fromCustomer && (
            <span className="text-[10px]">
              <svg className="w-3.5 h-3.5 inline text-avocado" viewBox="0 0 16 11" fill="currentColor">
                <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.063-.51z" />
              </svg>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function ChatWindow({ user, photo, messages }: (typeof chats)[0]) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm flex flex-col" style={{ height: 200 }}>
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        <ArrowLeft className="w-5 h-5 text-gray-500 flex-shrink-0" />
        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 ring-1 ring-gray-300">
          <img src={photo} alt={user} width={36} height={36} className="object-cover w-full h-full" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{user}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Phone className="w-4 h-4 text-gray-500" />
          <Video className="w-4 h-4 text-gray-500" />
          <MoreVertical className="w-4 h-4 text-gray-500" />
        </div>
      </div>
      <div className="flex-1 p-3 overflow-hidden bg-[#0b141a]">
        {messages.map((msg, i) => (
          <ChatBubble key={i} text={msg.text} time={msg.time} fromCustomer={msg.fromCustomer} />
        ))}
      </div>
    </div>
  )
}

export function TestimonialsChat() {
  return (
    <div className="space-y-12">
      <h2 className="text-3xl sm:text-4xl font-bold text-center">
        Os resultados são <span className="text-avocado">absurdos!</span>
      </h2>
      <p className="text-gray-500 text-center max-w-2xl mx-auto">
        Veja o que nossos usuários estão dizendo
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {chats.map((chat) => (
          <ChatWindow key={chat.user} {...chat} />
        ))}
      </div>
    </div>
  )
}
