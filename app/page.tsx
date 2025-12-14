import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  FileText, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Brain, 
  Shield, 
  Zap, 
  Layout, 
  MousePointer2,
  Lock,
  Plus,
  PanelLeft,
  ChevronLeft,
  ChevronRight,
  Home as HomeIcon,
  Bell,
  Share
} from "lucide-react";
import { BrowserWindowReveal } from "@/components/browser-window-reveal";
import { ToolsToAeraSection } from "@/components/tools-to-aera-section";
import { GalleryPreviewSection } from "@/components/gallery-preview-section";

export default function Home() {
  return (
    <div className="min-h-screen bg-[oklch(22%_0.11_240.79)] text-white relative isolate">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[url('/bg.png')] bg-auto bg-repeat opacity-[0.06]" />
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(90%_60%_at_50%_0%,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0)_60%)]" />
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[28rem] w-[60rem] -translate-x-1/2 rounded-[999px] bg-black/20 blur-3xl" />

        <header className="relative mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15">
              <Image src="/symbol-black.svg" alt="Miza" width={18} height={18} className="invert" />
            </span>
            <span className="text-lg tracking-wide">Aera</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <Link href="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Features</Link>
            <Link href="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Pricing</Link>
            <Link href="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Blog</Link>
            <Link href="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Changelog</Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
              <Link href="/login">Login</Link>
            </Button>
            <Button
              asChild
              className="bg-white text-black hover:bg-white/90 focus-visible:ring-white/40"
            >
              <Link href="/register">Kostenlos starten</Link>
            </Button>
          </div>
        </header>

        <main className="relative mx-auto w-full max-w-[100rem] px-6 pb-20 pt-32">
          {/* Hero Section */}
          <section className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/70">
              Aera.so · Your AI Workspace
            </p>
            <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              Where everything
              <span className="block">comes together.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-white/75 sm:text-lg">
              Bring your documents, links, and ideas together in one place. Organize everything
              visually and use AI to learn faster and craft better content.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild className="bg-white text-black hover:bg-white/90">
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          </section>

          {/* Hero Image / Interface Mockup */}
          <section className="relative mx-auto mt-40 mb-32 w-full max-w-[95rem] px-6">
            <div className="relative w-full">
              {/* Blur Effect */}
              <div className="absolute left-1/2 top-12 h-[520px] w-[92%] -translate-x-1/2 rounded-3xl bg-black/15 blur-2xl" />
              
              {/* Card Container */}
              <div className="relative z-10 w-full rounded-3xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur">
                <div className="relative overflow-hidden rounded-2xl bg-white">
                  {/* Dashboard Aspect Ratio */}
                  <div className="relative aspect-[1.8/1] w-full min-h-[780px]">
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.04),rgba(0,0,0,0.02))]" />
                    {/* Mock Content */}
                    <div className="absolute left-1/2 top-12 w-[70%] -translate-x-1/2 space-y-6">
                        <div className="h-14 w-full rounded-2xl bg-white shadow-sm ring-1 ring-black/5 flex items-center px-6 gap-4">
                            <Search className="size-5 text-black/40" />
                            <div className="h-2.5 w-32 rounded-full bg-black/5" />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="aspect-[1.6/1] rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden relative">
                                <div className="absolute inset-0 bg-black/5" />
                            </div>
                            <div className="aspect-[1.6/1] rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden relative">
                                <div className="absolute inset-0 bg-black/5" />
                            </div>
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* You Don't Need 50 Tools Section - Scroll Animated */}
          <ToolsToAeraSection />

          {/* Gallery Preview Section - Scroll Animated */}
          <GalleryPreviewSection />

          {/* A White Space That's Not Blank */}
          <section className="mt-40">
             <div className="grid gap-20 lg:gap-32 lg:grid-cols-2 lg:items-center">
                {/* Mockup Card */}
                <div className="order-2 lg:order-1 relative h-[550px] w-full rounded-3xl bg-white shadow-2xl overflow-hidden">
                    <div className="p-5">
                        {/* Tabs */}
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <button className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/70">Note</button>
                            <button className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/70">Canvas</button>
                            <button className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white">Link</button>
                            <button className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/70">Prompt</button>
                            <button className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/70">Upload</button>
                        </div>
                        
                        {/* Input area */}
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex-1 flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs text-black/50">
                                <span>Transcription complete</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mb-6">
                            <span className="text-xs text-black/40">Save to:</span>
                            <span className="text-xs text-black/70">Home</span>
                            <button className="ml-auto rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white">
                                Capture
                            </button>
                        </div>
                        
                        {/* Content Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Large card with image placeholder */}
                            <div className="col-span-1 row-span-2 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 p-3 h-48 relative overflow-hidden">
                                <div className="absolute inset-0 bg-black/5" />
                                <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur rounded-lg p-2 text-xs text-black/70">
                                    Content preview...
                                </div>
                            </div>
                            {/* Right side content */}
                            <div className="space-y-3">
                                <div className="rounded-xl bg-black/5 p-3">
                                    <p className="text-xs font-medium text-black mb-1">The Complete Guide</p>
                                    <div className="h-1.5 w-2/3 bg-black/10 rounded-full" />
                                </div>
                                <div className="rounded-xl bg-blue-50 p-3 h-20 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-transparent" />
                                </div>
                            </div>
                        </div>
                        
                        {/* Bottom items */}
                        <div className="mt-4 space-y-3">
                            <div className="flex items-center gap-3 rounded-xl border border-black/5 bg-white p-3">
                                <div className="size-10 rounded-lg bg-red-100" />
                                <div>
                                    <p className="text-sm font-medium text-black">YouTube Video Script</p>
                                    <p className="text-xs text-black/50">Nov 3</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 rounded-xl border border-black/5 bg-white p-3">
                                <div className="size-10 rounded-lg bg-amber-100" />
                                <div>
                                    <p className="text-sm font-medium text-black">Writing</p>
                                    <p className="text-xs text-black/50">Nov 3 · 2.8 MB</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Text Content */}
                <div className="order-1 lg:order-2 lg:pl-8">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/50 mb-6 flex items-center gap-2">
                        <Layout className="size-3" />
                        Canvas
                    </p>
                    <h2 className="text-4xl font-normal tracking-tight sm:text-5xl lg:text-6xl leading-[1.1] font-serif">
                        A White Space <br/> That's Not Blank
                    </h2>
                    <p className="mt-8 text-lg text-white/70 max-w-md">
                        Think of it as an infinite canvas that actually understands what you put on it. Drag, drop, connect, and generate.
                    </p>
                    <p className="mt-4 text-base text-white/50 max-w-md">
                        Everything you add to your workspace is automatically transcribed, tagged, downloaded, and ready to reference with AI.
                    </p>
                </div>
             </div>
          </section>

          {/* Feature Grid: Visual Search & Secure AI */}
          <section className="mt-40 grid gap-8 md:grid-cols-2">
             {/* Visual Search */}
             <div className="rounded-3xl bg-white/5 border border-white/10 p-8 overflow-hidden relative group hover:bg-white/10 transition-colors">
                <div className="relative z-10">
                    <p className="text-xs font-medium uppercase tracking-wider text-white/50 mb-4">AI Search</p>
                    <h3 className="text-3xl font-medium mb-4">The World's Most <br/> Focused Visual Search</h3>
                    <p className="text-white/70 mb-8 max-w-xs">
                        Find anything you've ever seen or saved. Just ask.
                    </p>
                </div>
                <div className="absolute right-0 bottom-0 w-2/3 h-2/3 bg-black/20 rounded-tl-2xl border-t border-l border-white/10 translate-x-4 translate-y-4">
                    {/* Mock Interface */}
                    <div className="p-4">
                        <div className="flex gap-2 mb-4">
                             <div className="h-8 w-8 rounded bg-white/10" />
                             <div className="h-8 w-full rounded bg-white/10" />
                        </div>
                    </div>
                </div>
             </div>

             {/* Secure AI */}
             <div className="rounded-3xl bg-white/5 border border-white/10 p-8 overflow-hidden relative group hover:bg-white/10 transition-colors">
                <div className="relative z-10">
                    <p className="text-xs font-medium uppercase tracking-wider text-white/50 mb-4">Privacy First</p>
                    <h3 className="text-3xl font-medium mb-4">Secure AI <br/> For Obsessives</h3>
                    <p className="text-white/70 mb-8 max-w-xs">
                        Your data stays yours. Encryption at rest and in transit.
                    </p>
                </div>
                <div className="absolute right-4 top-4">
                    <Lock className="size-6 text-white/30" />
                </div>
                <div className="absolute right-0 bottom-0 w-full h-1/2 bg-[linear-gradient(to_top,rgba(0,0,0,0.5),transparent)]" />
             </div>
          </section>
        </main>
      </div>

      {/* Light Section - Browser Window Container */}
      <BrowserWindowReveal>
            {/* Browser Window */}
            <div className="overflow-hidden rounded-t-[2.5rem] bg-[#F6F6F6] shadow-2xl ring-1 ring-black/5">
                {/* Window Header */}
                <div className="sticky top-0 z-20 flex items-center justify-between border-b border-black/5 bg-[#FDFDFD] px-6 py-4 text-black/60">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                             <Plus className="size-5 hover:text-black cursor-pointer" />
                        </div>
                        <div className="flex items-center gap-4">
                             <Search className="size-4 opacity-50" />
                             <PanelLeft className="size-4 opacity-50" />
                        </div>
                        <div className="flex items-center gap-2 text-black/40">
                             <ChevronLeft className="size-5" />
                             <ChevronRight className="size-5" />
                        </div>
                        <div className="flex items-center gap-2 rounded-md bg-black/5 px-3 py-1 text-xs font-medium text-black/70">
                             <HomeIcon className="size-3" />
                             <span>Home</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Bell className="size-4 hover:text-black cursor-pointer" />
                        <Share className="size-4 hover:text-black cursor-pointer" />
                    </div>
                </div>

                {/* Window Content */}
                <div className="bg-white p-8 sm:p-20 pb-0 sm:pb-0">
                   <div className="mx-auto max-w-6xl">
                       <div className="text-center mb-20">
                           <h2 className="text-4xl sm:text-6xl tracking-tight text-black mb-6">
                               What If You Never Forgot <br/> Where That Idea Was?
                           </h2>
                           <p className="text-xl text-black/60 max-w-2xl mx-auto">
                               A library of everything you've learned, ready to be remixed into something new.
                           </p>
                       </div>
            
                       {/* Feature Grid Light */}
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-32">
                          <div className="p-8 rounded-3xl bg-[#F4F4F4] group hover:bg-[#EAEAEA] transition-colors">
                              <div className="h-48 w-full bg-white rounded-2xl mb-6 shadow-sm flex items-center justify-center">
                                 <div className="flex gap-2">
                                     <div className="size-8 bg-blue-500 rounded-full opacity-20" />
                                     <div className="size-8 bg-red-500 rounded-full opacity-20" />
                                     <div className="size-8 bg-yellow-500 rounded-full opacity-20" />
                                 </div>
                              </div>
                              <h3 className="text-xl font-medium mb-2">Just like your brain</h3>
                              <p className="text-black/60">Associative linking helps you find connections you didn't know existed.</p>
                          </div>
                          
                          <div className="p-8 rounded-3xl bg-[#F4F4F4] group hover:bg-[#EAEAEA] transition-colors">
                              <div className="h-48 w-full bg-white rounded-2xl mb-6 shadow-sm flex items-center justify-center p-6">
                                  <div className="w-full space-y-2">
                                      <div className="h-2 w-full bg-black/5 rounded-full" />
                                      <div className="h-2 w-3/4 bg-black/5 rounded-full" />
                                      <div className="h-8 w-full bg-black/5 rounded-lg mt-4" />
                                  </div>
                              </div>
                              <h3 className="text-xl font-medium mb-2">Talk to your notes</h3>
                              <p className="text-black/60">Ask questions and get answers based on your personal knowledge base.</p>
                          </div>
            
                          <div className="md:col-span-2 lg:col-span-1 p-8 rounded-3xl bg-[#2A2A2A] text-white">
                               <div className="h-48 w-full bg-white/10 rounded-2xl mb-6 flex items-center justify-center border border-white/10">
                                   <Zap className="size-10 text-white/50" />
                               </div>
                               <h3 className="text-xl font-medium mb-2">Instant Capture</h3>
                               <p className="text-white/60">Save from anywhere. Web, mobile, or desktop.</p>
                          </div>
                       </div>

                       {/* Artisan Level Work Section (Merged) */}
                       <div className="border-t border-black/10 pt-20 mb-16 text-center">
                            <h2 className="text-3xl sm:text-5xl font-serif">For Those Who Value <br/> Artisan Level Work, Not Slop</h2>
                       </div>
                        
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Column 1 */}
                            <div className="rounded-2xl border-t-4 border-orange-400 bg-orange-50/50 p-6 min-h-[300px]">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-orange-400" /> Think
                                </h3>
                                <div className="aspect-[4/5] rounded-lg bg-black/5 w-full" />
                            </div>
                            {/* Column 2 */}
                            <div className="rounded-2xl border-t-4 border-blue-400 bg-blue-50/50 p-6 min-h-[300px]">
                                 <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-blue-400" /> Argue
                                </h3>
                                 <div className="space-y-3">
                                     <div className="p-3 bg-white rounded-lg shadow-sm text-sm">Ideally, we should focus on...</div>
                                     <div className="p-3 bg-white/50 rounded-lg shadow-sm text-sm">But what about...</div>
                                 </div>
                            </div>
                            {/* Column 3 */}
                            <div className="rounded-2xl border-t-4 border-green-400 bg-green-50/50 p-6 min-h-[300px]">
                                 <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-green-400" /> Draft
                                </h3>
                                <div className="space-y-2">
                                    <div className="h-2 w-full bg-black/5 rounded" />
                                    <div className="h-2 w-full bg-black/5 rounded" />
                                    <div className="h-2 w-2/3 bg-black/5 rounded" />
                                </div>
                            </div>
                            {/* Column 4 */}
                            <div className="rounded-2xl border-t-4 border-purple-400 bg-purple-50/50 p-6 min-h-[300px]">
                                 <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-purple-400" /> Share
                                </h3>
                                <div className="aspect-video bg-white rounded-lg shadow-sm mt-4" />
                            </div>
                       </div>
                   </div>
                </div>
            </div>
      </BrowserWindowReveal>

      {/* Footer / Waitlist CTA */}
      <section className="bg-[oklch(22%_0.11_240.79)] text-white py-32 relative overflow-hidden">
         <div className="pointer-events-none absolute inset-0 -z-10 bg-[url('/bg.png')] bg-auto bg-repeat opacity-[0.06]" />
         <div className="relative z-10 mx-auto w-full max-w-4xl px-6 text-center">
             <div className="mb-8 flex justify-center">
                <span className="grid size-12 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                  <Image src="/symbol-black.svg" alt="Miza" width={24} height={24} className="invert" />
                </span>
             </div>
             <h2 className="text-4xl sm:text-6xl font-semibold tracking-tight mb-8">
                 Join The Waitlist
             </h2>
             <p className="text-xl text-white/70 mb-10">
                 We're rolling out access gradually to ensure the best experience.
             </p>
             <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                 <Button asChild size="lg" className="bg-white text-black hover:bg-white/90 h-12 px-8 text-base">
                    <Link href="/register">Request Access</Link>
                 </Button>
             </div>
             
             {/* Background Grid of cards effect */}
             <div className="mt-20 relative h-[400px] w-full mask-linear-fade">
                  <div className="absolute inset-0 grid grid-cols-2 md:grid-cols-4 gap-4 opacity-20 [transform:perspective(1000px)_rotateX(12deg)] origin-top">
                      {[...Array(8)].map((_, i) => (
                          <div key={i} className="rounded-xl bg-white/10 h-60 w-full border border-white/5" />
                      ))}
                  </div>
             </div>
         </div>
         
         <footer className="mt-20 border-t border-white/10">
            <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-6 py-10 text-sm text-white/75 sm:flex-row">
              <span>© {new Date().getFullYear()} Miza</span>
              <div className="flex items-center gap-6">
                <Link href="/datenschutz" className="hover:text-white">
                  Datenschutz
                </Link>
                <Link href="/impressum" className="hover:text-white">
                  Impressum
                </Link>
                <Link href="/agb" className="hover:text-white">
                  AGB
                </Link>
              </div>
            </div>
          </footer>
      </section>
    </div>
  );
}
