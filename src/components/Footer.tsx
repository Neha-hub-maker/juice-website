import { site } from "@/config/site";
import { SplashBackdrop } from "./SplashBackdrop";
import { SocialLinks } from "./SocialLinks";

export function Footer() {
  return <footer id="footer" className="site-footer section-dark">
    <SplashBackdrop />
    <div className="container-page footer-content">
      <div className="footer-top"><a className="logo" href="#home">{site.name}<span aria-hidden="true">.</span></a><SocialLinks /></div>
      <div className="footer-bottom"><p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p><a href="#home">Back to top <span aria-hidden="true">↑</span></a></div>
    </div>
  </footer>;
}
