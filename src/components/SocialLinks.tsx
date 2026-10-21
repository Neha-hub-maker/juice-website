import { site } from "@/config/site";

export function SocialLinks() {
  const links = [
    { label: "Instagram", href: site.contact.instagramUrl },
    { label: "Facebook", href: site.contact.facebookUrl },
  ];
  return <ul className="social-links" aria-label="Social media">
    {links.map(link => <li key={link.label}>{link.href
      ? <a href={link.href}>{link.label} <span aria-hidden="true">↗</span></a>
      : <span className="social-placeholder">{link.label} <span className="social-status">coming soon</span></span>}
    </li>)}
  </ul>;
}
