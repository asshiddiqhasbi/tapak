export function FootprintIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Footprint sole */}
      <path
        d="M12.2 4.5C10.6 4.5 9.4 5.7 9.1 7.4C8.7 9.7 7.9 12.4 7 14.9C6.2 17.1 5.8 18.8 6.7 20.4C7.6 21.9 9.6 22.5 12 22.5C14.4 22.5 16.4 21.9 17.3 20.4C18.2 18.8 17.8 17.1 17 14.9C16.1 12.4 15.3 9.7 14.9 7.4C14.6 5.7 13.4 4.5 11.8 4.5H12.2Z"
      />
      {/* Footprint toes */}
      <circle cx="8.2" cy="2.2" r="1.3" />
      <circle cx="11" cy="1.3" r="1.4" />
      <circle cx="13.8" cy="1.5" r="1.3" />
      <circle cx="16.4" cy="2.5" r="1.1" />
      <circle cx="18.5" cy="4" r="0.9" />
    </svg>
  )
}

export default function Logo({
  showText = true,
  size = "md",
}: {
  showText?: boolean
  size?: "sm" | "md" | "lg"
}) {
  const iconSizes = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-9 w-9",
  }

  const textSizes = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-3xl",
  }

  return (
    <div className="flex items-center gap-2.5 group">
      <div className="flex items-center justify-center p-1.5 rounded-xl bg-accent-muted border border-accent/20 group-hover:border-accent/50 transition-colors">
        <FootprintIcon className={`${iconSizes[size]} text-accent`} />
      </div>
      {showText && (
        <span
          className={`font-bold tracking-tight text-foreground group-hover:text-accent transition-colors ${textSizes[size]}`}
        >
          Tapak
        </span>
      )}
    </div>
  )
}
