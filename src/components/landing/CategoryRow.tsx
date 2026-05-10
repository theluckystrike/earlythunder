import Link from "next/link";

/* --- Types --- */

interface CategoryRowProps {
  readonly categories: readonly { name: string; count: number }[];
}

/* --- CategoryCard --- */

function CategoryCard({ name, count }: { readonly name: string; readonly count: number }) {
  return (
    <Link href="/opportunities" className="cat">
      <div className="cat__count mono">{count}</div>
      <div className="cat__name">{name}</div>
      <div className="cat__sub">View in scanner &rarr;</div>
    </Link>
  );
}

/* --- CategoryRow (main export) --- */

export default function CategoryRow({ categories }: CategoryRowProps) {
  const display = categories.slice(0, 3);

  return (
    <section className="section">
      <div className="cat-row">
        {display.map((cat) => (
          <CategoryCard key={cat.name} name={cat.name} count={cat.count} />
        ))}
      </div>
    </section>
  );
}
