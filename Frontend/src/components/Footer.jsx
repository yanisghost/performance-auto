import { Link } from "react-router-dom";
import { useTranslation } from "../context/LanguageContext";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="w-full bg-bg-header border-t border-border-color pt-16 pb-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand Column */}
        <div className="flex flex-col gap-6">
          <div className="font-display-lg text-2xl uppercase font-bold text-on-surface">
            Performance Auto
          </div>
          <p className="text-on-surface-variant/80 text-sm max-w-xs leading-relaxed">
            {t("footerDesc")}
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-on-surface-variant hover:text-primary-container transition-colors">
              <span className="material-symbols-outlined">face_nod</span>
            </a>
            <a href="#" className="text-on-surface-variant hover:text-primary-container transition-colors">
              <span className="material-symbols-outlined">photo_camera</span>
            </a>
            <a href="#" className="text-on-surface-variant hover:text-primary-container transition-colors">
              <span className="material-symbols-outlined">videocam</span>
            </a>
          </div>
        </div>

        {/* Quick Links Column */}
        <div className="flex flex-col gap-4">
          <h5 className="font-label-bold uppercase text-sm text-on-surface tracking-wider">{t("quickLinks") || "Quick Links"}</h5>
          <nav className="flex flex-col gap-2">
            <Link to="/inventory" className="text-on-surface-variant text-sm hover:text-primary-container transition-colors">
              {t("inventory")}
            </Link>
            <Link to="/inventory?badge=New+Arrival" className="text-on-surface-variant text-sm hover:text-primary-container transition-colors">
              {t("newArrivals")}
            </Link>
            <Link to="/inventory?badge=Certified+Pre-Owned" className="text-on-surface-variant text-sm hover:text-primary-container transition-colors">
              {t("preOwned")}
            </Link>
            <a href="#" className="text-on-surface-variant text-sm hover:text-primary-container transition-colors">
              {t("financing")}
            </a>
            <a href="#" className="text-on-surface-variant text-sm hover:text-primary-container transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-on-surface-variant text-sm hover:text-primary-container transition-colors">
              Terms of Service
            </a>
          </nav>
        </div>

        {/* Contact Info Column */}
        <div className="flex flex-col gap-4">
          <h5 className="font-label-bold uppercase text-sm text-on-surface tracking-wider">{t("contact") || "Contact"}</h5>
          <a 
            href="https://maps.app.goo.gl/EARgjyCVFErQ4VMu5" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-start gap-2 text-on-surface-variant text-sm hover:text-primary-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-primary-container text-sm mt-1">location_on</span>
            <span>{t("footerAddress")}</span>
          </a>
          <a 
            href="tel:0550812332"
            className="flex items-center gap-2 text-on-surface-variant text-sm hover:text-primary-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-primary-container text-sm">call</span>
            <span>{t("footerPhone")}</span>
          </a>
          <div className="mt-2">
            <h6 className="text-xs font-label-bold uppercase text-on-surface/80 mb-2 tracking-wider">Working Hours</h6>
            <p className="text-on-surface-variant text-xs mb-1">Mon - Fri: 9:00 AM - 8:00 PM</p>
            <p className="text-on-surface-variant text-xs mb-1">Sat: 10:00 AM - 6:00 PM</p>
            <p className="text-on-surface-variant text-xs">Sun: Closed</p>
          </div>
        </div>

        {/* Newsletter Column */}
        <div className="flex flex-col gap-4">
          <h5 className="font-label-bold uppercase text-sm text-on-surface tracking-wider">Newsletter</h5>
          <p className="text-on-surface-variant text-xs leading-relaxed">
            Subscribe to receive exclusive offers and inventory updates.
          </p>
          <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
            <input 
              className="bg-bg-card text-text-main border border-border-color focus:border-primary-container focus:ring-0 px-3 py-2 text-sm placeholder:text-text-muted/40 outline-none rounded-sm" 
              placeholder="Email Address" 
              type="email"
              required
            />
            <button className="bg-primary-container text-white py-2 font-label-bold uppercase text-xs tracking-widest hover:brightness-110 transition-all font-semibold rounded-sm">
              Subscribe
            </button>
          </form>
          {/* Decorative Map Box */}
          <div className="mt-4 h-24 w-full matte-card overflow-hidden rounded-sm relative flex items-center justify-center bg-bg-main">
            <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: "url('https://maps.googleapis.com/maps/api/staticmap?center=Algiers&zoom=11&size=300x100&sensor=false&key=')" }}></div>
            <span className="relative z-10 text-xs font-label-bold uppercase tracking-wider text-on-surface/60">{t("footerAddress").split(",")[1] || "Algiers Showroom"}</span>
          </div>
        </div>

      </div>

      {/* Sub-footer */}
      <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-border-color flex flex-col md:flex-row justify-between items-center gap-4 transition-colors duration-300">
        <p className="text-on-surface-variant text-xs">
          {t("copyright")}
        </p>
        <div className="flex gap-6">
          <a href="#" className="text-on-surface-variant hover:text-primary-container text-xs uppercase font-label-bold">Privacy</a>
          <a href="#" className="text-on-surface-variant hover:text-primary-container text-xs uppercase font-label-bold">Terms</a>
          <a href="#" className="text-on-surface-variant hover:text-primary-container text-xs uppercase font-label-bold">Cookies</a>
        </div>
      </div>
    </footer>
  );
}
