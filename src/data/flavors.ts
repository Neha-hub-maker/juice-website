import { assets } from "./assets";

export const flavors = [
  { id: "orange", name: "The classic", flavor: "Orange", note: "Bright. Bold. Beautifully familiar.", image: assets.flavorOrange, alt: "A glass of orange juice with orange halves on a cream background", color: "#eedab8" },
  { id: "green", name: "The green one", flavor: "Green juice", note: "A fresh perspective in every glass.", image: assets.flavorGreen, alt: "A tall green juice with cucumber, green apple and kiwi on a sage background", color: "#cbd3b7" },
  { id: "berry", name: "Berry good", flavor: "Berry", note: "Your daily dose of something delightful.", image: assets.flavorBerry, alt: "Deep purple berry juice surrounded by blackberries and raspberries", color: "#d3d9c4" },
  { id: "watermelon", name: "Summer state", flavor: "Watermelon", note: "A little sunshine, whatever the season.", image: assets.flavorWatermelon, alt: "Red watermelon juice with watermelon slices on a pastel green background", color: "#d1d7bc" },
  { id: "lemonade", name: "A little zest", flavor: "Lemonade", note: "For the bright side of your day.", image: assets.flavorLemonade, alt: "Lemonade with lemon slices and mint on a pale yellow background", color: "#eee2b1" },
] as const;
