import Link from "next/link";

/** Apple-style hero with massive typography and generous whitespace. */
export default function HeroSection() {
  return (
    <section className="min-h-[85vh] flex flex-col justify-center max-w-6xl mx-auto px-6">
      <h1 className="text-5xl md:text-7xl lg:text-[80px] font-semibold tracking-tighter leading-[1.05]">
        <span className="text-text-primary">Follow the money</span>
        <br />
        <span className="text-text-secondary">that cannot lie.</span>
      </h1>
      <p className="text-xl md:text-2xl text-text-secondary font-normal mt-8 max-w-2xl leading-relaxed">
        An autonomous intelligence pipeline scanning 154+ protocols for convergence
        signals, earnings yield, and deadline catalysts -- before the crowd arrives.
      </p>
      <HeroButtons />
    </section>
  );
}

function HeroButtons() {
  return (
    <div className="flex gap-4 mt-10">
      <Link
        href="/intelligence"
        className="bg-text-primary text-black font-medium px-7 py-3 rounded-full text-base hover:opacity-90 transition"
      >
        View intelligence &rarr;
      </Link>
      <Link
        href="/opportunities"
        className="text-text-secondary hover:text-text-primary font-medium text-base transition flex items-center"
      >
        Explore opportunities
      </Link>
    </div>
  );
}
