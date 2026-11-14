export function ParachuteIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2 11a10 9 0 0 1 20 0Z" />
      <path d="M2 11l8 8M22 11l-8 8M12 11v8" />
      <rect x="10" y="19" width="4" height="3" rx="1" />
    </svg>
  );
}
