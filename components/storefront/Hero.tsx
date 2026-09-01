interface HeroProps {
  title: string;
  subtitle?: string;
  badges?: string[];
}

export default function Hero({ title, subtitle, badges = [] }: HeroProps) {
  return (
    <section className="bg-gradient-to-br from-brand to-brand-hover text-white py-8">
      <div className="container-store">
        <h2 className="text-2xl md:text-3xl font-bold mb-2 leading-tight">{title}</h2>
        {subtitle && (
          <p className="text-white/90 text-sm md:text-base">{subtitle}</p>
        )}
        {badges.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {badges.map((b, i) => (
              <span key={i} className="bg-white/20 px-3 py-1 rounded-full">
                {b}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}