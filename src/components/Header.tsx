import { site } from "@/config/site";
import { MotionToggle } from "./MotionProvider";

export function Header() {
  return <header className="site-header">
    <div className="navbar container-page">
      <a className="logo" href="#home" aria-label={`${site.name} home`}>{site.name}<span aria-hidden="true">.</span></a>
      <nav className="nav-links" aria-label="Main navigation">
        <a href="#ritual">Ritual</a>
        <a href="#flavors">Flavors</a>
        <a href="#contact">Visit</a>
        <MotionToggle />
      </nav>
      <a className="button button-primary order-link" href={site.orderUrl ?? "#contact"}>Order</a>
    </div>
  </header>;
}
