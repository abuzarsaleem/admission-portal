export function AdmissionsHero() {
  return (
    <section className="relative overflow-hidden border-b border-[#dce5f6] bg-gradient-to-r from-[#eef4ff] via-[#f5f8ff] to-[#e8f0ff]">
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-full max-w-xl bg-cover bg-center opacity-90 md:w-[48%]"
        style={{
          backgroundImage:
            "linear-gradient(90deg, #eef4ff 0%, transparent 28%), url('https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80')",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#6374ab]">ADMISSIONS</p>
        <h1 className="mt-2 max-w-xl text-3xl font-bold tracking-tight text-[#071759] sm:text-4xl">
          Find Your Future at Taleem.
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-[#354a8d] sm:text-base">
          Browse open admission intakes, explore available programmes, and prepare your application
          when you are ready.
        </p>
        <p
          className="mt-6 font-serif text-2xl italic text-[#7c8db5]/80 sm:mt-8 sm:text-3xl"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          Learn · Grow · Belong
        </p>
      </div>
    </section>
  )
}
