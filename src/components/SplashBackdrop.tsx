import Image from "next/image";
import { assets } from "@/data/assets";

export function SplashBackdrop() {
  return <div className="splash-backdrop" aria-hidden="true">
    <Image src={assets.splashDark.path} alt="" fill sizes="100vw" placeholder="blur" blurDataURL={assets.splashDark.blurDataURL} className="media-cover" />
  </div>;
}
