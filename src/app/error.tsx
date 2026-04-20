'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-[#FAFAF7]" style={{ fontFamily: '"Outfit", system-ui, sans-serif' }}>
        <div className="text-center px-4">
          <p className="text-[140px] leading-none font-light text-[#EDE6DB]" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
            500
          </p>
          <h2 className="text-xl font-medium text-[#1D1B18] mt-2 mb-3" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
            Something Went Wrong
          </h2>
          <p className="text-sm text-[#9B9590] mb-10">
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            className="inline-flex items-center px-8 py-3.5 bg-[#2D2621] text-[#FAFAF7] text-sm font-medium tracking-wider uppercase transition-colors hover:bg-[#4A3F36]"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
