import { ParsingDashboard } from "@/components/parsing-dashboard";
import { NavHeader } from "@/components/nav-header";
import { MessageCircle } from "lucide-react";

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
            
            {/* Discord Card */}
            <div className="w-full max-w-4xl">
              <a 
                href="https://discord.gg/BVDvgdVgDf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block group"
              >
                <div className="text-center p-6 bg-[#5865F2]/5 dark:bg-[#5865F2]/10 rounded-lg border border-[#5865F2]/20 dark:border-[#5865F2]/30 hover:border-[#5865F2]/40 dark:hover:border-[#5865F2]/50 transition-all duration-200 hover:shadow-lg">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="rounded-full bg-[#5865F2]/10 dark:bg-[#5865F2]/20 p-2">
                      <MessageCircle className="h-6 w-6 text-[#5865F2]" />
                    </div>
                    <h3 className="text-xl font-semibold text-[#5865F2]">Join the Discord</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Come say hi and tell us if you have any questions, suggestions, or feedback :)
                  </p>
                </div>
              </a>
            </div>
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
