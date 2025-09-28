import { ParsingDashboard } from "@/components/parsing-dashboard";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { NavHeader } from "@/components/nav-header";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <NavHeader />
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          <div className="flex flex-col items-center justify-center gap-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SFU Course Prerequisite Parsing Crowdsourcing
              </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 ">
                Help us turn course prerequisites into data!
                </p>
            </div>
            <ParsingDashboard />
          </div>
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          {/* <p>
            Powered by{" "}
            <a
              href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Supabase
            </a>
          </p>
          <ThemeSwitcher /> */}
        </footer>
      </div>
    </main>
  );
}
