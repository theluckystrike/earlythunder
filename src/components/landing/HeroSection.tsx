import Link from "next/link";

/** Apple-style hero with massive typography and generous whitespace. */
export default function HeroSection() {
  return (
    <section className="min-h-[85vh] flex flex-col justify-center max-w-6xl mx-auto px-6">
      <h1 className="text-5xl md:text-7xl lg:text-[80px] font-semibold tracking-tighter leading-[1.05]">
        <span className="text-text-primary">Hear the storm</span>
        <br />
        <span className="text-text-secondary">before anyone else.</span>
      </h1>
      <p className="text-xl md:text-2xl text-text-secondary font-normal mt-8 max-w-2xl leading-relaxed">
        A systematic approach to identifying asymmetric opportunities before
        they reach mainstream awareness.
      </p>
      <HeroButtons />
    </section>
  );
}

function HeroButtons() {
  return (
    <div className="flex gap-4 mt-10">
      <Link
        href="/opportunities"
        className="bg-text-primary text-black font-medium px-7 py-3 rounded-full text-base hover:opacity-90 transition"
      >
        Explore opportunities &rarr;
      </Link>
      <Link
        href="/methodology"
        className="text-text-secondary hover:text-text-primary font-medium text-base transition flex items-center"
      >
        How it works
      </Link>
    </div>
  );
}
