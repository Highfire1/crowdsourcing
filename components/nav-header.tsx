import Link from "next/link";
import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import ThemeToggle from "@/components/theme-toggle";
import { hasEnvVars } from "@/lib/utils";

export function NavHeader() {
  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
      <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
        <div className="flex gap-5 items-center font-semibold">
          <Link href={"/"}>Home</Link>
          <Link href={"/courses"} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Courses
          </Link>
          {/* <Link href={"/account"} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Account
          </Link> */}
        </div>
        <div className="flex items-center gap-4">
          {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}