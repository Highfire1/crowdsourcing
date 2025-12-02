import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const supabase = await createClient();

  // You can also use getUser() which will be slower.
  const { data } = await supabase.auth.getClaims();
  const { data: userData } = await supabase.auth.getUser();

  const user = data?.claims;
  const userMeta = userData?.user?.user_metadata || {};

  return user ? (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm">Hey, {userMeta?.user_name || user.email}!</span>
        <Button asChild size="sm" variant="outline">
          <Link href="/account">Account</Link>
        </Button>
      </div>
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"default"}>
        <Link href="/auth/signin">Sign in</Link>
      </Button>
    </div>
  );
}
