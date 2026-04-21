export default function Loading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="flex items-center gap-4 text-ink-mid">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-bronze opacity-60 animate-ping" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-bronze" />
        </span>
        <span className="text-[11px] font-body tracking-[0.35em] uppercase">
          Loading
        </span>
      </div>
    </div>
  );
}
