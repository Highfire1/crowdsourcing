import { NavHeader } from '@/components/nav-header'
import { ClientVerifyWrapper } from './client-verify-wrapper'

export default function VerifyPage() {
  return (
    <main className="h-[100vh] flex flex-col items-stretch">
      <NavHeader />

      <div className="flex-1 w-full flex flex-col">
        <div className="w-full py-4 flex-1 flex items-stretch">
          <div className="flex-1 m-2">
            <ClientVerifyWrapper />
          </div>
        </div>
      </div>
    </main>
  )
}