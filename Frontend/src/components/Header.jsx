import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { API_BASE_URL, getMediaUrl, formatPrice } from "../config";
import { useTranslation } from "../context/LanguageContext";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { language, setLanguage, t, dir } = useTranslation();

  const langNames = {
    en: "English",
    fr: "Français",
    ar: "العربية"
  };

  // Load vehicles for autocomplete matching
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/products`);
        const data = await response.json();
        const docs = data.data?.docs || data.data?.data || [];
        setVehicles(docs);
      } catch (err) {
        console.error("Error fetching vehicles for search:", err.message);
      }
    };
    fetchVehicles();
  }, []);

  // Filter suggestions dynamically
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const filtered = vehicles.filter(car => {
      const matchText = `${car.marke} ${car.model} ${car.year} ${car.color} ${car.transmission} ${car.fuelType}`.toLowerCase();
      return matchText.includes(searchQuery.toLowerCase());
    });

    setSuggestions(filtered.slice(0, 5));
  }, [searchQuery, vehicles]);

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
    if (searchOpen) {
      setSearchQuery("");
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/inventory?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleSuggestionClick = (slug) => {
    navigate(`/vehicle/${slug}`);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const navItems = [
    { name: t("home"), path: "/" },
    { name: t("inventory"), path: "/inventory" },
    { name: t("financing"), path: "#" },
    { name: t("about"), path: "#" },
    { name: t("contact"), path: "#" },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#121414] border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link 
          to="/" 
          className="font-display-lg text-2xl md:text-3xl uppercase tracking-tighter text-primary-container font-extrabold"
        >
          Performance Auto
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-8 items-center">
          {navItems.map((item) => (
            item.path.startsWith("#") ? (
              <a
                key={item.name}
                href={item.path}
                className="text-on-background/70 font-label-bold text-sm uppercase tracking-wider hover:text-on-background transition-colors"
              >
                {item.name}
              </a>
            ) : (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `font-label-bold text-sm uppercase tracking-wider transition-colors pb-1 border-b-2 ${
                    isActive
                      ? "text-primary-container border-primary-container"
                      : "text-on-background/70 border-transparent hover:text-on-background"
                  }`
                }
              >
                {item.name}
              </NavLink>
            )
          ))}
        </nav>

        {/* Icons / Controls */}
        <div className="flex items-center gap-4">
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/5 text-[#e2e2e2] transition-colors cursor-pointer select-none"
            >
              <span className="material-symbols-outlined text-xl text-primary-container">
                language
              </span>
            </button>

            {langMenuOpen && (
              <>
                {/* Backdrop to close click outside */}
                <div 
                  className="fixed inset-0 z-40 bg-transparent" 
                  onClick={() => setLangMenuOpen(false)}
                />
                
                {/* Dropdown panel */}
                <div className="absolute right-0 mt-2 w-32 bg-[#1c1e1e] border border-white/10 rounded-sm shadow-2xl overflow-hidden z-50 animate-slideDown">
                  <div className="flex flex-col py-1">
                    {Object.entries(langNames).map(([code, name]) => (
                      <button
                        key={code}
                        onClick={() => {
                          setLanguage(code);
                          setLangMenuOpen(false);
                        }}
                        className={`px-4 py-2 text-xs transition-colors cursor-pointer hover:bg-[#282a2b] ${
                          language === code 
                            ? "text-primary-container font-extrabold" 
                            : "text-on-surface-variant/80 hover:text-white"
                        }`}
                        style={{ textAlign: dir === 'rtl' ? 'right' : 'left' }}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <span 
            className="material-symbols-outlined text-primary-container cursor-pointer hover:scale-105 transition-transform"
            onClick={toggleSearch}
          >
            {searchOpen ? "close" : "search"}
          </span>
          <span 
            className="material-symbols-outlined text-primary-container cursor-pointer md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? "close" : "menu"}
          </span>
        </div>
      </div>

      {/* Slide-Down Search Drawer */}
      {searchOpen && (
        <div className="bg-[#1a1c1c] border-b border-white/10 px-6 py-4 animate-slideDown">
          <div className="max-w-3xl mx-auto relative">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full bg-[#0c0f0f] border border-white/10 py-3.5 pl-12 pr-20 text-sm text-on-surface placeholder:text-on-surface-variant/30 outline-none focus:border-[#ffb3af]/50 rounded-sm transition-all"
                autoFocus
              />
              <span className="material-symbols-outlined absolute left-4 text-base text-on-surface-variant/50">
                search
              </span>
              
              <div className="absolute right-3 flex items-center gap-3">
                {searchQuery && (
                  <button 
                    type="button" 
                    onClick={() => setSearchQuery("")}
                    className="text-on-surface-variant/50 hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                )}
                <button
                  type="submit"
                  className="bg-primary-container text-white py-1 px-3 text-[10px] font-label-bold uppercase tracking-wider font-bold rounded-sm hover:bg-[#b50321] transition-colors"
                >
                  {t("searchBtn")}
                </button>
              </div>
            </form>

            {/* Autocomplete Suggestions Panel */}
            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-[#1e2020] border border-white/10 rounded-sm shadow-2xl overflow-hidden z-50">
                <div className="p-2 border-b border-white/5 bg-[#0c0f0f]/40">
                  <span className="text-[9px] text-on-surface-variant/60 font-label-bold uppercase tracking-wider font-semibold">
                    {t("matchingVehicles")}
                  </span>
                </div>
                <div className="divide-y divide-white/5">
                  {suggestions.map((car) => (
                    <div
                      key={car._id || car.id}
                      onClick={() => handleSuggestionClick(car.slug)}
                      className="p-3 flex items-center justify-between hover:bg-[#282a2b] cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div 
                          className="w-10 h-8 bg-cover bg-center rounded-sm border border-white/5 bg-[#0c0f0f]"
                          style={{ backgroundImage: `url('${car.imageCover ? getMediaUrl(car.imageCover) : ""}')` }}
                        ></div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white uppercase truncate group-hover:text-[#ffb3af] transition-colors">
                            {car.name || `${car.marke} ${car.model}`}
                          </h4>
                          <p className="text-[8px] text-on-surface-variant uppercase tracking-wider mt-0.5 truncate">
                            {car.year} • {car.transmission} • {car.fuelType}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-[#ffb3af] font-headline-md pl-4">
                        {formatPrice(car.price)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Empty Suggestions Feedback */}
            {searchQuery.trim() && suggestions.length === 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-[#1e2020] border border-white/10 p-4 text-center text-xs text-on-surface-variant/50 rounded-sm shadow-2xl z-50">
                {t("noVehiclesFound")}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#1E1E1E] border-b border-white/10 px-6 py-4 flex flex-col gap-4">
          {navItems.map((item) => (
            item.path.startsWith("#") ? (
              <a
                key={item.name}
                href={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="text-on-background/70 font-label-bold text-sm uppercase tracking-wider hover:text-on-background transition-colors py-2"
              >
                {item.name}
              </a>
            ) : (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `font-label-bold text-sm uppercase tracking-wider transition-colors py-2 block ${
                    isActive ? "text-primary-container" : "text-on-background/70"
                  }`
                }
              >
                {item.name}
              </NavLink>
            )
          ))}
        </div>
      )}
    </header>
  );
}
