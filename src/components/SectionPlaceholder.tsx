type Props = {
  id: string;
  title: string;
  primary?: boolean;
  tone?: "dark" | "light";
  transition?: "to-light" | "to-dark";
};

export function SectionPlaceholder({ id, title, primary = false, tone = "dark", transition }: Props) {
  const Heading = primary ? "h1" : "h2";
  const transitions = { "to-light": "transition-to-light", "to-dark": "transition-to-dark" };
  return <section id={id} aria-labelledby={`${id}-heading`} tabIndex={-1}
    className={`section-placeholder section-${tone}${transition ? ` ${transitions[transition]}` : ""}`}>
    <div className="container-page"><Heading id={`${id}-heading`} className="font-display text-display">{title}</Heading></div>
  </section>;
}
