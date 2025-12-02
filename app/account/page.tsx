import { redirect } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/logout-button";
import { CalendarIcon, MailIcon, UserIcon } from "lucide-react";
import { NavHeader } from "@/components/nav-header";

export default async function AccountPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/signin");
  }

  const user = data.claims;
  
  // Get additional user metadata if available
  const { data: userData } = await supabase.auth.getUser();
  const userMeta = userData?.user?.user_metadata || {};
  
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <NavHeader />
        <div className="flex-1 w-full flex flex-col gap-8 max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <LogoutButton />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Your account details from GitHub
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                {userMeta.avatar_url ? (
                  <Image 
                    src={userMeta.avatar_url} 
                    alt={userMeta.full_name || userMeta.user_name || "User avatar"}
                    width={64}
                    height={64}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-semibold text-primary">
                    {userMeta.full_name?.charAt(0) || userMeta.user_name?.charAt(0) || user.email?.charAt(0) || "?"}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">
                  {userMeta.full_name || userMeta.user_name || "GitHub User"}
                </h3>
                {userMeta.user_name && (
                  <p className="text-sm text-muted-foreground">
                    @{userMeta.user_name}
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MailIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user.email}</span>
              </div>
              
              {user.created_at && (
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Member since {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Badge variant="secondary" className="text-xs">
                Authenticated via GitHub
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>
              Technical information about your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">User ID</span>
                <span className="text-sm text-muted-foreground font-mono">
                  {user.sub?.slice(0, 8)}...
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm font-medium">Provider</span>
                <span className="text-sm text-muted-foreground">
                  {userMeta.provider || "GitHub"}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm font-medium">Email Verified</span>
                <Badge variant={user.email_verified ? "default" : "secondary"}>
                  {user.email_verified ? "Yes" : "No"}
                </Badge>
              </div>
            </div>

            {/* Raw user data for debugging */}
            <details className="mt-4">
              <summary className="text-sm font-medium cursor-pointer hover:text-foreground">
                Raw User Data
              </summary>
              <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto mt-2 bg-muted">
                {JSON.stringify({ ...user, ...userMeta }, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      </div>
        </div>
      </div>
    </main>
  );
}