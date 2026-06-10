import { MessageCircle, Send } from "lucide-react";

export function SupportButtons() {
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-4 z-[9999]">
      {/* WhatsApp Button */}
      <a
        href="https://wa.me/2349160819483"
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-[0_8px_30px_rgb(37,211,102,0.4)] transition-all duration-300 hover:scale-110 hover:shadow-[0_8px_30px_rgb(37,211,102,0.6)] active:scale-95"
        aria-label="Contact support on WhatsApp"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="absolute right-full mr-3 px-3 py-1.5 rounded-lg bg-background/90 backdrop-blur-md border border-border/50 text-foreground text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 whitespace-nowrap pointer-events-none shadow-xl">
          WhatsApp Support
        </span>
      </a>

      {/* Telegram Button */}
      <a
        href="https://t.me/geeupdatecamp"
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center justify-center w-14 h-14 bg-[#0088cc] text-white rounded-full shadow-[0_8px_30px_rgb(0,136,204,0.4)] transition-all duration-300 hover:scale-110 hover:shadow-[0_8px_30px_rgb(0,136,204,0.6)] active:scale-95"
        aria-label="Contact support on Telegram"
      >
        <Send className="w-7 h-7" />
        <span className="absolute right-full mr-3 px-3 py-1.5 rounded-lg bg-background/90 backdrop-blur-md border border-border/50 text-foreground text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 whitespace-nowrap pointer-events-none shadow-xl">
          Telegram Support
        </span>
      </a>

    </div>
  );
}
