'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Shield } from 'lucide-react'

export function ContractSecurityGate({
  open,
  onContinue,
}: {
  open: boolean
  onContinue: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-600" aria-hidden />
            <DialogTitle>Seus dados estão protegidos</DialogTitle>
          </div>
          <DialogDescription className="text-left space-y-3 pt-2 text-slate-600">
            <p>
              Esta página usa conexão segura (HTTPS). O trânsito entre o seu navegador e os servidores Plify é
              criptografado, reduzindo o risco de interceptação.
            </p>
            <p>
              A assinatura, a selfie e os metadados (horário, IP quando disponível e localização, se autorizada) são
              vinculados ao documento para comprovação e auditoria.
            </p>
          </DialogDescription>
        </DialogHeader>
        <Button type="button" className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700" onClick={onContinue}>
          Entendi, continuar
        </Button>
      </DialogContent>
    </Dialog>
  )
}
