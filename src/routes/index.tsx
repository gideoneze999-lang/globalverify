import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Shield, Zap, Globe2, Lock, CreditCard, Headphones, MessageCircle, Send, Check } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen">
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <Stats />
      <CTA />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg gradient-primary grid place-items-center shadow-glow">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">Global<span className="text-gradient">Verify</span></span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition">Features</a>
          <a href="#how" className="hover:text-foreground transition">How it works</a>
          <a href="#stats" className="hover:text-foreground transition">Why us</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild><Link to="/login">Login</Link></Button>
          <Button asChild className="gradient-primary shadow-glow"><Link to="/signup">Get Started</Link></Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 py-20 lg:py-32 grid lg:grid-cols-2 gap-12 items-center">
        <div className="animate-fade-in-up">
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-accent shadow-cyan animate-pulse" />
            Powered by 5sim · 8 countries supported
          </div>
          <h1 className="mt-6 text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
            Premium virtual numbers,
            <span className="block font-display text-6xl md:text-7xl lg:text-8xl text-gradient mt-2">delivered instantly.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl">
            Get real WhatsApp, Telegram, Google, and PayPal verification codes in seconds. Fund your wallet in Naira and verify across the globe.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild className="gradient-primary shadow-glow text-base">
              <Link to="/signup">Create free account</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="glass">
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
          <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><Check className="w-4 h-4 text-accent" /> No setup fees</div>
            <div className="flex items-center gap-2"><Check className="w-4 h-4 text-accent" /> Pay in Naira</div>
          </div>
        </div>
        <OtpMock />
      </div>
    </section>
  );
}

function OtpMock() {
  const [items, setItems] = useState<Array<{ id: number; app: "WhatsApp" | "Telegram"; code: string; time: string }>>([
    { id: 1, app: "WhatsApp", code: "748 213", time: "now" },
  ]);

  useEffect(() => {
    const codes = ["489 027", "612 884", "305 711", "927 360", "184 502"];
    const apps: Array<"WhatsApp" | "Telegram"> = ["Telegram", "WhatsApp"];
    let i = 0;
    const interval = setInterval(() => {
      setItems((prev) => {
        const next = [
          { id: Date.now(), app: apps[i % 2], code: codes[i % codes.length], time: "now" },
          ...prev.map((p) => ({ ...p, time: "1m ago" })),
        ].slice(0, 4);
        i++;
        return next;
      });
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
      <div className="absolute -inset-6 gradient-primary opacity-20 blur-3xl rounded-full" />
      <div className="relative glass rounded-2xl p-6 shadow-glow">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-xs text-muted-foreground">Inbox</div>
            <div className="font-semibold">+234 901 ••• 4827</div>
          </div>
          <div className="text-xs text-accent flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" /> Live
          </div>
        </div>
        <div className="space-y-2.5">
          {items.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-xl bg-background/40 border border-border/40 p-3 animate-fade-in-up">
              <div className={`w-10 h-10 rounded-lg grid place-items-center ${m.app === "WhatsApp" ? "bg-green-500/15 text-green-400" : "bg-sky-500/15 text-sky-400"}`}>
                {m.app === "WhatsApp" ? <MessageCircle className="w-5 h-5" /> : <Send className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{m.app}</div>
                <div className="text-xs text-muted-foreground truncate">Your code is <span className="text-foreground font-semibold tracking-wider">{m.code}</span></div>
              </div>
              <div className="text-[10px] text-muted-foreground">{m.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Features() {
  const items = [
    { icon: Zap, title: "Instant delivery", body: "Numbers issued in under 5 seconds." },
    { icon: Globe2, title: "8 countries", body: "Nigeria, US, UK, Netherlands, Canada, Germany, France, Australia." },
    { icon: Lock, title: "Secure wallet", body: "Naira balance, encrypted transactions, no card on file." },
    { icon: Shield, title: "Real numbers", body: "Powered by 5sim — no virtual junk, real OTPs guaranteed." },
    { icon: CreditCard, title: "Bank transfer", body: "Fund with Moniepoint, get credited within minutes." },
    { icon: Headphones, title: "24/7 support", body: "WhatsApp & Telegram support whenever you need it." },
  ];
  return (
    <section id="features" className="container mx-auto px-4 sm:px-6 py-24">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <p className="text-accent text-sm uppercase tracking-widest">Features</p>
        <h2 className="font-display text-5xl md:text-6xl text-gradient mt-2">Built for verification</h2>
        <p className="mt-4 text-muted-foreground">Everything you need to verify accounts, send gifts, and shop digital — in one platform.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((f) => (
          <div key={f.title} className="glass rounded-2xl p-7 hover:shadow-glow transition-shadow">
            <div className="w-11 h-11 rounded-xl gradient-primary grid place-items-center mb-4">
              <f.icon className="w-5 h-5 text-primary-foreground" />
            </div>
            <h3 className="font-semibold text-lg">{f.title}</h3>
            <p className="text-sm text-muted-foreground mt-1.5">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Create account", d: "Sign up free in under 30 seconds." },
    { n: "02", t: "Fund wallet", d: "Transfer Naira via Moniepoint, get credited fast." },
    { n: "03", t: "Pick country & service", d: "Choose from 6 platforms across 8 countries." },
    { n: "04", t: "Receive your OTP", d: "Real WhatsApp / Telegram codes delivered instantly." },
  ];
  return (
    <section id="how" className="container mx-auto px-4 sm:px-6 py-24">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <p className="text-accent text-sm uppercase tracking-widest">How it works</p>
        <h2 className="font-display text-5xl md:text-6xl text-gradient mt-2">Four simple steps</h2>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {steps.map((s) => (
          <div key={s.n} className="glass rounded-2xl p-7 relative overflow-hidden">
            <div className="absolute -top-6 -right-4 font-display text-7xl text-primary/20 leading-none">{s.n}</div>
            <div className="relative">
              <div className="text-sm text-accent font-semibold">Step {s.n}</div>
              <h3 className="font-semibold text-lg mt-1">{s.t}</h3>
              <p className="text-sm text-muted-foreground mt-2">{s.d}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    { v: "50K+", l: "Numbers delivered" },
    { v: "8", l: "Countries" },
    { v: "6", l: "Platforms" },
    { v: "99.8%", l: "Uptime" },
  ];
  return (
    <section id="stats" className="container mx-auto px-4 sm:px-6 py-16">
      <div className="glass rounded-3xl p-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center shadow-glow">
        {stats.map((s) => (
          <div key={s.l}>
            <div className="font-display text-5xl md:text-6xl text-gradient">{s.v}</div>
            <div className="text-sm text-muted-foreground mt-1">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="container mx-auto px-4 sm:px-6 py-24">
      <div className="relative overflow-hidden rounded-3xl glass p-12 md:p-16 text-center">
        <div className="absolute inset-0 gradient-primary opacity-15" />
        <div className="relative">
          <h2 className="font-display text-5xl md:text-7xl text-gradient">Start verifying today</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Join thousands using GlobalVerify for instant OTPs and premium digital services.</p>
          <Button size="lg" asChild className="mt-8 gradient-primary shadow-glow text-base">
            <Link to="/signup">Create your free account</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/50 mt-12">
      <div className="container mx-auto px-4 sm:px-6 py-14 grid sm:grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg gradient-primary grid place-items-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold">GlobalVerify</span>
          </div>
          <p className="text-muted-foreground">Nigeria's premium virtual number & digital services platform.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Product</h4>
          <ul className="space-y-2 text-muted-foreground">
            <li><a href="#features" className="hover:text-foreground">Features</a></li>
            <li><a href="#how" className="hover:text-foreground">How it works</a></li>
            <li><Link to="/signup" className="hover:text-foreground">Sign up</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Support</h4>
          <ul className="space-y-2 text-muted-foreground">
            <li><a className="hover:text-foreground" href="#">WhatsApp</a></li>
            <li><a className="hover:text-foreground" href="#">Telegram</a></li>
            <li><a className="hover:text-foreground" href="#">Help center</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Connect</h4>
          <div className="flex gap-2">
            <a href="#" className="w-9 h-9 rounded-lg glass grid place-items-center hover:shadow-cyan transition"><MessageCircle className="w-4 h-4" /></a>
            <a href="#" className="w-9 h-9 rounded-lg glass grid place-items-center hover:shadow-cyan transition"><Send className="w-4 h-4" /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-border/30 text-xs text-muted-foreground text-center py-5">
        © {new Date().getFullYear()} GlobalVerify. All rights reserved.
      </div>
    </footer>
  );
}
