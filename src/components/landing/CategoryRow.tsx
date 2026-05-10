import Link from "next/link";

/* ─── Types ─── */

interface CategoryRowProps {
  readonly categories: readonly { name: string; count: number }[];
}

/* ─── CategoryCard ─── */

function CategoryCard({ name, count }: { readonly name: string; readonly count: number }) {
  return (
    <Link href="/opportunities" className="cat">
      <span className="cat__count">{count}</span>
      <span className="cat__name">{name}</span>
      <span className="cat__sub">View in scanner &rarr;</span>
    </Link>
  );
}

/* ─── CategoryRow (main export) ─── */

export default function CategoryRow({ categories }: CategoryRowProps) {
  const display = categories.slice(0, 3);

  return (
    <div className="cat-row">
      {display.map((cat) => (
        <CategoryCard key={cat.name} name={cat.name} count={cat.count} />
      ))}
    </div>
  );
}
