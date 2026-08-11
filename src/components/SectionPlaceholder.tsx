'use client';

interface SectionPlaceholderProps {
  sectionName: string;
  icon?: string;
}

export function SectionPlaceholder({ sectionName, icon = '📚' }: SectionPlaceholderProps) {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 md:py-20">
      <div className="max-w-lg w-full text-center">
        {/* Icon */}
        <div className="mb-6 inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#173B2D]/10 border-2 border-[#C8A24A]/30">
          <span className="text-4xl md:text-5xl">{icon}</span>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C8A24A]/10 border border-[#C8A24A]/30 mb-5">
          <span className="w-2 h-2 rounded-full bg-[#C8A24A] animate-pulse"></span>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#7C8F6E]">
            {sectionName}
          </span>
        </div>

        {/* Title */}
        <h1 className="font-serif text-2xl md:text-3xl text-[#173B2D] mb-3">
          Section Under Development
        </h1>

        {/* Description */}
        <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed mb-6">
          <p>
            This section is currently being updated to provide a more comprehensive, verified, and enhanced learning experience.
          </p>
          <p>
            We are working on improving the quality, structure, search performance, and educational value of this module.
          </p>
        </div>

        {/* Thank you note */}
        <div className="inline-block px-5 py-3 bg-[#F5EFE0] rounded-lg border border-[#E8DCC3]">
          <p className="text-sm text-[#7C8F6E] italic">
            Thank you for your patience.
          </p>
        </div>

        {/* Future update note */}
        <p className="text-xs text-stone-400 mt-6">
          New content will be available in a future update.
        </p>

        {/* Decorative line */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <div className="h-px w-12 bg-[#C8A24A]/30"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-[#C8A24A]/50"></div>
          <div className="h-px w-12 bg-[#C8A24A]/30"></div>
        </div>
      </div>
    </div>
  );
}
