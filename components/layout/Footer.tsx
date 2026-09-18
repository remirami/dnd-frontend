"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // The combat arena, campaign manager, and gauntlet lobby are full-screen interactive game interfaces.
  // Hide the footer here so it does not distract or block controls and logs.
  if (pathname?.startsWith("/combat") || pathname?.startsWith("/gauntlet")) {
    return null;
  }

  return (
    <footer className="w-full bg-[#0c0d12] border-t border-slate-900/40 py-8 px-4 text-center font-lora">
      <div className="max-w-4xl mx-auto space-y-1 text-[11px] text-[#404552] leading-relaxed">
        <p>
          This project uses the System Reference Document 5.1 (&ldquo;SRD 5.1&rdquo; and &ldquo;SRD 5.2&rdquo;) provided by Wizards of the Coast LLC under the terms of the Creative Commons Attribution 4.0 International License (CC-BY 4.0).
        </p>
        <p>
          &ldquo;Wizards of the Coast&rdquo;, &ldquo;Dungeons & Dragons&rdquo;, and their logos are trademarks of Wizards of the Coast LLC in the United States and other countries. This website is not affiliated with, endorsed, sponsored, or specifically approved by Wizards of the Coast LLC.
        </p>
      </div>
    </footer>
  );
}
