import Image from "next/image";
import { site } from "@/config/site";
import { Arrow } from "./Arrow";
import { assets } from "@/data/assets";

export function OrderCTA() {
  return <section id="contact" className="order-section" aria-labelledby="order-title">
    <div className="order-glow" aria-hidden="true"><Image src={assets.splashDark.path} alt="" fill sizes="(max-width: 700px) 100vw, 65vw" placeholder="blur" blurDataURL={assets.splashDark.blurDataURL} className="media-cover" /></div>
    <div className="wrap order-content"><p className="eyebrow">03 / Make it a ritual</p><h2 id="order-title">See you on<br /><em>the fresh side.</em></h2>
      <p>Your next favorite glass is waiting.</p>
      {site.contact.orderUrl ? <a className="button button-orange" href={site.contact.orderUrl}>Order now <Arrow diagonal /></a> : <p className="coming-soon">Ordering details coming soon</p>}
      <div className="contact-details"><div><span className="eyebrow">Find us</span><p>{site.contact.address}</p></div><div><span className="eyebrow">Come on by</span><p>{site.contact.hours}</p></div>
        {(site.contact.email || site.contact.phone) && <div><span className="eyebrow">Say hello</span>{site.contact.email && <p><a href={`mailto:${site.contact.email}`}>{site.contact.email}</a></p>}{site.contact.phone && <p><a href={`tel:${site.contact.phone}`}>{site.contact.phone}</a></p>}</div>}
      </div>
    </div>
  </section>;
}
