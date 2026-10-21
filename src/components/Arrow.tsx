export function Arrow({ down = false }: { down?: boolean }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={down ? "arrow-down" : undefined}>
    <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}
