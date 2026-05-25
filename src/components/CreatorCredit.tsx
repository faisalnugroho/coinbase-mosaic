'use client';

export default function CreatorCredit() {
  return (
    <footer className="w-full py-4 px-6 text-center border-t border-[#1a1b3a] bg-[#0a0b1e]">
      <p className="text-white/30 text-sm">
        Created by{' '}
        <a
          href="https://x.com/Zkfync"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#0052FF] hover:text-[#0045d9] transition-colors font-medium"
        >
          @Zkfync
        </a>
      </p>
    </footer>
  );
}
