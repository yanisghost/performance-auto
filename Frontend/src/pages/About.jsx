import { useTranslation } from "../context/LanguageContext";

export default function About() {
  const { t, dir } = useTranslation();

  const services = [
    {
      title: t("serviceBuyTitle"),
      desc: t("serviceBuyDesc"),
      icon: "shopping_bag",
    },
    {
      title: t("serviceSellTitle"),
      desc: t("serviceSellDesc"),
      icon: "sell",
    },
    {
      title: t("serviceTradeTitle"),
      desc: t("serviceTradeDesc"),
      icon: "published_with_changes",
    },
    {
      title: t("serviceConsultTitle"),
      desc: t("serviceConsultDesc"),
      icon: "forum",
    },
  ];

  return (
    <div className="bg-bg-main text-text-main min-h-screen transition-colors duration-300">
      {/* Spacer for sticky header */}
      <div className="h-24"></div>

      {/* About Content Section */}
      <main className="max-w-7xl mx-auto px-6 py-16" style={{ direction: dir }}>
        
        {/* Top Banner / Intro */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-24">
          {/* Text block */}
          <div className="lg:col-span-7 space-y-6">
            <span className="text-primary font-label-bold text-xs uppercase tracking-widest font-semibold">
              {t("aboutTitle")}
            </span>
            <h1 className="font-display-lg text-4xl md:text-5xl font-extrabold uppercase tracking-tight text-text-main">
              {t("aboutHeading")}
            </h1>
            <div className="h-1 w-24 bg-primary rounded-sm"></div>
            
            <p className="font-body-lg text-lg font-semibold text-text-main/90 leading-relaxed pt-2">
              {t("aboutIntro")}
            </p>
            <p className="font-body-lg text-sm text-text-muted leading-relaxed">
              {t("aboutVision")}
            </p>
          </div>

          {/* Visual Showcase Card */}
          <div className="lg:col-span-5 relative flex justify-center items-center">
            {/* Soft decorative background glow */}
            <div className="absolute w-72 h-72 rounded-full bg-primary/10 blur-3xl z-0"></div>

            {/* Geometric glassmorphic emblem card */}
            <div className="matte-card relative z-10 w-full max-w-sm aspect-square rounded-sm p-8 flex flex-col justify-between overflow-hidden group hover:border-primary/20 transition-all duration-300">
              {/* Card Corner Accents */}
              <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-primary/25 rounded-tr-sm"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 border-b border-l border-primary/25 rounded-bl-sm"></div>
              
              <div>
                <span className="font-mono text-[10px] text-primary tracking-widest font-bold">EST. 2026</span>
              </div>

              <div className="flex flex-col items-center py-6">
                <span className="material-symbols-outlined text-primary text-6xl group-hover:scale-110 transition-transform duration-500">
                  verified_user
                </span>
                <span className="font-display-lg text-lg font-bold uppercase tracking-widest text-text-main mt-4 italic text-center">
                  Performance Auto
                </span>
                <span className="text-[10px] text-text-muted uppercase tracking-wider mt-1 font-mono">
                  Elite Showroom
                </span>
              </div>

              <div className="flex justify-between items-center text-[10px] text-text-muted/60 font-mono">
                <span>HAMMAMET, ALGIERS</span>
                <span>AUTHENTICITY</span>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="border-t border-border-color pt-20 transition-colors duration-300">
          <div className="text-center mb-16 space-y-4">
            <h2 className="font-headline-lg text-3xl uppercase font-bold text-text-main tracking-wide">
              {t("servicesTitle")}
            </h2>
            <div className="h-1 w-24 bg-primary mx-auto rounded-sm"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, idx) => (
              <div
                key={idx}
                className="matte-card p-8 rounded-sm hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Icon Circle */}
                  <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-primary/10 flex items-center justify-center mb-6 transition-all duration-300">
                    <span className="material-symbols-outlined text-primary text-2xl group-hover:scale-110 transition-transform duration-300">
                      {service.icon}
                    </span>
                  </div>
                  
                  {/* Service Title */}
                  <h3 className="font-headline-md text-base font-bold text-text-main uppercase mb-3 tracking-wide">
                    {service.title}
                  </h3>
                  
                  {/* Service Desc */}
                  <p className="font-body-md text-xs text-text-muted leading-relaxed">
                    {service.desc}
                  </p>
                </div>
                
                {/* Bottom decorative highlight line */}
                <div className="w-0 h-0.5 bg-primary mt-6 group-hover:w-full transition-all duration-300 rounded-sm"></div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
