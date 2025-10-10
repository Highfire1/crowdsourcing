import Link from "next/link";
import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { hasEnvVars } from "@/lib/utils";
import { ThemeSwitcher } from "./theme-switcher";

export function NavHeader() {
  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
      <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm text-black dark:text-white overflow-x-auto">
        <div className="flex gap-5 items-center font-semibold whitespace-nowrap">
          <Link href={"/"}>Home</Link>
          <Link href={"/guide"} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Guide
          </Link>
          <Link href={"/courses"} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Courses
          </Link>
          <Link href={"/parse"} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Parse
          </Link>
          <Link href={"/verify"} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Verify
          </Link>
          <Link href={"/leaderboard"} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Leaderboard
          </Link>
          
          {/* <Link href={"/account"} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Account
          </Link> */}
        </div>
        <div className="flex items-center gap-4 shrink-0 ml-4">
          {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
          <ThemeSwitcher />
        </div>
      </div>
    </nav>
  );
}