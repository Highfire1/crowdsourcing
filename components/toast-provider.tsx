'use client'

import { Toaster } from 'react-hot-toast'

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--border))',
        },
        success: {
          iconTheme: {
            primary: 'hsl(var(--primary))',
            secondary: 'hsl(var(--primary-foreground))',
          },
        },
        error: {
          iconTheme: {
            primary: 'hsl(var(--destructive))',
            secondary: 'hsl(var(--destructive-foreground))',
          },
        },
      }}
    />
  )
}