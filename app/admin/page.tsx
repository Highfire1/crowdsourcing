import { redirect } from 'next/navigation'

import AdminPanel from './admin-panel'
import { NavHeader } from '@/components/nav-header'
import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    // not authenticated
    redirect('/auth/signin')
  }

  const user = data.user
  // Only allow specific email
  if (user.email !== 'tseng.andersonn@gmail.com') {
    redirect('/')
  }

  return (
    <div className="min-h-screen">
      <NavHeader />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Admin</h1>
        <AdminPanel />
      </main>
    </div>
  )
}
