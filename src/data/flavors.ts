import type { ImageAsset } from "./assets";
import { assets } from "./assets";

export type Flavor = {
  id: string;
  name: string;
  tagline: string;
  price: string | null;
  image: ImageAsset;
  alt: string;
  color: string;
};

export const PRICE_PLACEHOLDER = "Price coming soon";
export const flavors: readonly Flavor[] = [
  { id: "green", name: "Green juice", tagline: "Your daily green light.", price: null, image: assets.flavorGreen, alt: "Tall green juice surrounded by cucumber, green apple and kiwi", color: "#cbd3b7" },
  { id: "lemonade", name: "Lemonade", tagline: "A little zest for the everyday.", price: null, image: assets.flavorLemonade, alt: "Lemonade with lemon slices and mint on a pale yellow background", color: "#eee2b1" },
  { id: "berry", name: "Berry", tagline: "Rich color. Bright personality.", price: null, image: assets.flavorBerry, alt: "Purple berry juice surrounded by blackberries and raspberries", color: "#d3d9c4" },
  { id: "watermelon", name: "Watermelon", tagline: "A sip of the sunny side.", price: null, image: assets.flavorWatermelon, alt: "Red watermelon juice with watermelon slices on a pastel green background", color: "#d1d7bc" },
  { id: "orange", name: "Orange", tagline: "The classic, freshly reimagined.", price: null, image: assets.flavorOrange, alt: "A glass of orange juice with orange halves on a cream background", color: "#eedab8" },
];
