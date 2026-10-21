import { site } from "@/config/site";
import { SplashBackdrop } from "./SplashBackdrop";
import { Arrow } from "./Arrow";

export function OrderCTA() {
  return <section id="contact" className="order-section section-dark" aria-labelledby="contact-heading" tabIndex={-1}>
    <SplashBackdrop />
    <div className="container-page order-content">
      <p className="eyebrow">MAKE IT A RITUAL</p>
      <h2 id="contact-heading">See you on<br /><span>the fresh side.</span></h2>
      <p className="order-intro">Your next favorite glass is waiting.</p>
      {site.orderUrl ? <a className="button button-primary" href={site.orderUrl}>Order now <Arrow /></a> : <p className="order-notice">{site.orderNotice}</p>}
      <div className="contact-grid">
        <div><h3>Find us</h3><p>{site.contact.address}</p></div>
        <div><h3>Come on by</h3><p>{site.contact.hours}</p></div>
        <div><h3>Say hello</h3>{site.contact.email ? <p><a href={`mailto:${site.contact.email}`}>{site.contact.email}</a></p> : <p>{site.contact.notice}</p>}{site.contact.phone && <p><a href={`tel:${site.contact.phone}`}>{site.contact.phone}</a></p>}</div>
      </div>
    </div>
  </section>;
}
