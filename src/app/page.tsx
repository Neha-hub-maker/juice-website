import { site } from "@/config/site";

export default function Home() {
  return <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-24">
    <p className="text-sm uppercase tracking-[0.3em] text-orange-400">{site.name}</p>
    <h1 className="my-8 font-serif text-6xl md:text-8xl">Fresh starts here.</h1>
    <p className="max-w-md text-lg text-stone-300">{site.tagline}</p>
  </main>;
}
