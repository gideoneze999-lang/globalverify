import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Shield, Zap, Globe2, Lock, CreditCard, Headphones, MessageCircle, Send, Check } from "lucide-react";
import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen">
      <Nav />
      <Hero />
      <ServicesStrip />
      <Features />
      <HowItWorks />
      <Stats />
      <CTA />
      <Footer />
    </div>
  );
}

function ServicesStrip() {
  const services = [
    { name: "WhatsApp", color: "#25D366", path: "M19.05 4.91A9.82 9.82 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.46 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.01zM12.05 20.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.21 8.21 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23a8.18 8.18 0 0 1 8.23 8.24c0 4.54-3.69 8.23-8.22 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.12.17 1.73 2.64 4.2 3.7.59.25 1.05.4 1.4.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.07-.11-.23-.17-.48-.29z" },
    { name: "Telegram", color: "#229ED9", path: "M21.5 4.5L2.5 11.8c-1.3.5-1.3 1.3-.2 1.6l4.8 1.5 1.9 5.7c.2.6.4.8 1 .8.5 0 .7-.2 1-.5l2.4-2.3 5 3.7c.9.5 1.6.2 1.8-.9l3.3-15.5c.3-1.3-.5-1.9-1.4-1.5zM18.4 8L9 14l-.4 4 1.2-3.7 9.6-6c.4-.3.1-.5 0-.3z" },
    { name: "Google", color: "#4285F4", path: "M21.35 11.1h-9.17v2.92h5.27c-.5 2.4-2.5 3.78-5.27 3.78a5.78 5.78 0 0 1 0-11.56c1.4 0 2.66.5 3.65 1.32l2.2-2.2A8.94 8.94 0 0 0 12.18 3a9 9 0 1 0 0 18c4.5 0 8.6-3.27 8.6-9 0-.55-.05-1.13-.13-1.9z" },
    { name: "PayPal", color: "#00457C", path: "M7.6 22h-3l-.5-.5 2.3-14.6L6.8 6h7.1c1.8 0 3.4.4 4.3 1.4.9 1 1 2.2.7 3.9l-.1.4v.3l.5.3c.5.3.8.6 1 1 .4.6.5 1.4.3 2.5-.2 1.2-.6 2.3-1.2 3.1-.6.8-1.3 1.5-2.2 1.9-.8.4-1.9.6-3 .6h-.4c-.3 0-.5.1-.7.3-.2.2-.3.4-.4.7v.2l-.7 4.3v.2c-.1 0-.1.1-.2.1H7.6zm6.3-15c-.3 0-.6.2-.7.5l-1 6.3c0 .2.1.4.4.4h1.4c2.3 0 4-1 4.5-3.7v-.5c0-.5-.2-.9-.5-1.2-.6-.6-1.8-.8-3.4-.8h-.7z" },
    { name: "Instagram", color: "#E4405F", path: "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23a3.7 3.7 0 0 1-.9 1.38c-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.85 5.85 0 0 0-2.13 1.38A5.85 5.85 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.73 1.46 1.38 2.13a5.85 5.85 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.85 5.85 0 0 0 2.13-1.38 5.85 5.85 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.85 5.85 0 0 0-1.38-2.13A5.85 5.85 0 0 0 19.86.63C19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 12 8a4 4 0 0 1 0 8zm6.41-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" },
    { name: "Facebook", color: "#1877F2", path: "M24 12a12 12 0 1 0-13.88 11.85v-8.38H7.08V12h3.04V9.36c0-3 1.79-4.66 4.53-4.66 1.31 0 2.68.23 2.68.23v2.95h-1.51c-1.49 0-1.95.93-1.95 1.87V12h3.32l-.53 3.47h-2.79v8.38A12 12 0 0 0 24 12z" },
    { name: "X", color: "#ffffff", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
    { name: "TikTok", color: "#ffffff", path: "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.66a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.09z" },
  ];
  return (
    <section className="container mx-auto px-4 sm:px-6 py-12">
      <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-6">Verify across every major platform</p>
      <div className="glass rounded-2xl p-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-5">
        {services.map((s) => (
          <div key={s.name} className="flex flex-col items-center gap-1.5 group">
            <div className="w-12 h-12 rounded-xl bg-background/30 grid place-items-center group-hover:shadow-cyan transition">
              <svg viewBox="0 0 24 24" width="24" height="24" fill={s.color} aria-label={s.name}>
                <path d={s.path} />
              </svg>
            </div>
            <span className="text-[11px] text-muted-foreground">{s.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="GlobalVerify logo" width={36} height={36} className="w-9 h-9 object-contain drop-shadow-[0_0_12px_rgba(139,92,246,0.45)]" />
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
            <img src={logo} alt="GlobalVerify logo" width={32} height={32} loading="lazy" className="w-8 h-8 object-contain" />
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
            <li><a className="hover:text-foreground" href="https://wa.me/2349160819483" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
            <li><a className="hover:text-foreground" href="https://t.me/geeupdatecamp" target="_blank" rel="noopener noreferrer">Telegram</a></li>
            <li><Link to="/dashboard/support" className="hover:text-foreground">Help center</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Connect</h4>
          <div className="flex gap-2">
            <a href="https://wa.me/2349160819483" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="w-9 h-9 rounded-lg glass grid place-items-center hover:shadow-cyan transition"><MessageCircle className="w-4 h-4" /></a>
            <a href="https://t.me/geeupdatecamp" target="_blank" rel="noopener noreferrer" aria-label="Telegram" className="w-9 h-9 rounded-lg glass grid place-items-center hover:shadow-cyan transition"><Send className="w-4 h-4" /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-border/30 text-xs text-muted-foreground text-center py-5">
        © {new Date().getFullYear()} GlobalVerify. All rights reserved.
      </div>
    </footer>
  );
}
