import { Geist, Geist_Mono, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { Providers } from "@/context/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Bengali-capable font, applied automatically when the UI language is `bn`
// (see the `:lang(bn)` rule in globals.css).
const notoBengali = Noto_Sans_Bengali({
  variable: "--font-noto-bengali",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "Importora | Authentic Global Pantry & Lifestyle Goods in Bangladesh",
  description:
    "Shop genuine imported KitKat chocolates, Korean buldak ramen, British Quaker oats, Horlicks, luxury personal care, and sneakers with fast cash-on-delivery across Bangladesh.",
};

// Runs before paint to apply the stored theme, preventing a flash of the
// wrong theme on first render. Kept tiny and inline (no hydration impact
// because it only touches the <html> class list, matching what ThemeProvider
// later reconciles).
const themeInitScript = `(function(){try{var t=localStorage.getItem('importora_theme');if(t==='dark'){document.documentElement.classList.add('dark');}else if(t==='light'){document.documentElement.classList.remove('dark');}else if(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.add('dark');}}catch(e){}})();`;

// Same idea for language: set <html lang> before paint so the Bengali font
// and any :lang() styling apply immediately.
const langInitScript = `(function(){try{var l=localStorage.getItem('importora_lang');if(l==='bn'||l==='en'){document.documentElement.lang=l;}}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${notoBengali.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: langInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
