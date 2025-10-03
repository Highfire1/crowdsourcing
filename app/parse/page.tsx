import { NavHeader } from '@/components/nav-header'
import { ClientParseWrapper } from './client-parse-wrapper'

export default function ParsePage() {
  return (
    <main className="h-[100vh] flex flex-col items-stretch">
      <NavHeader />

      <div className="flex-1 w-full flex flex-col">
        <div className="w-full pb-4 flex-1 flex items-stretch">
          <div className="flex-1 m-2">
            <ClientParseWrapper />
          </div>
        </div>
      </div>
    </main>
  )
}
