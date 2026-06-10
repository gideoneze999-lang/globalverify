import { MessageCircle, Send } from "lucide-react";

export function SupportButtons() {
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-4 z-[9999]">
      {/* WhatsApp Button */}
      <a
        href="https://wa.me/234XXXXXXXXXX" // Placeholder - will ask user for actual number
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-[0_8px_30px_rgb(37,211,102,0.4)] transition-all duration-300 hover:scale-110 hover:shadow-[0_8px_30px_rgb(37,211,102,0.6)] active:scale-95"
        aria-label="Contact support on WhatsApp"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="absolute right-full mr-3 px-2 py-1 rounded bg-background/80 backdrop-blur-sm border border-border text-foreground text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          WhatsApp Support
        </span>
      </a>

      {/* Telegram Button */}
      <a
        href="https://t.me/yourusername" // Placeholder - will ask user for actual username
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center justify-center w-14 h-14 bg-[#0088cc] text-white rounded-full shadow-[0_8px_30px_rgb(0,136,204,0.4)] transition-all duration-300 hover:scale-110 hover:shadow-[0_8px_30px_rgb(0,136,204,0.6)] active:scale-95"
        aria-label="Contact support on Telegram"
      >
        <Send className="w-7 h-7" />
        <span className="absolute right-full mr-3 px-2 py-1 rounded bg-background/80 backdrop-blur-sm border border-border text-foreground text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Telegram Support
        </span>
      </a>
    </div>
  );
}
