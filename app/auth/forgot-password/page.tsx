// Fallback standalone page for forgot-password (component missing in this workspace)
function ForgotPasswordFormFallback() {
  return (
    <div className="border rounded p-6">
      <h3 className="text-lg font-semibold mb-2">Forgot your password?</h3>
      <p className="text-sm text-muted-foreground">This demo page is a placeholder because the original component was not found.</p>
    </div>
  )
}

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <ForgotPasswordFormFallback />
      </div>
    </div>
  )
}
