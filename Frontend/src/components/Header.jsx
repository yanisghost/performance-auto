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
  const [favorites, setFavorites] = useState([]);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const navigate = useNavigate();
  const { language, setLanguage, t, dir } = useTranslation();

  useEffect(() => {
    const html = document.documentElement;
    if (theme === "light") {
      html.classList.remove("dark");
    } else {
      html.classList.add("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  const langNames = {
    en: "English",
    fr: "Français",
    ar: "العربية"
  };

  // Load and synchronize favorites
  useEffect(() => {
    const loadFavorites = () => {
      try {
        const saved = JSON.parse(localStorage.getItem("favorites")) || [];
        setFavorites(saved);
      } catch {
        setFavorites([]);
      }
    };
    loadFavorites();
    window.addEventListener("favorites-updated", loadFavorites);
    return () => window.removeEventListener("favorites-updated", loadFavorites);
  }, []);

  const removeFavorite = (id) => {
    try {
      const saved = JSON.parse(localStorage.getItem("favorites")) || [];
      const updated = saved.filter(fav => fav._id !== id);
      localStorage.setItem("favorites", JSON.stringify(updated));
      window.dispatchEvent(new Event("favorites-updated"));
    } catch (e) {
      console.error("Error removing favorite:", e.message);
    }
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
    { name: t("about"), path: "/about" },
    { name: t("contact"), path: "#" },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-bg-header border-b border-border-color transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
        {/* Logo */}
        <Link 
          to="/" 
          className="font-display-lg text-lg sm:text-2xl md:text-3xl uppercase tracking-tighter text-primary-container font-extrabold select-none truncate"
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
                className="text-text-main/70 font-label-bold text-sm uppercase tracking-wider hover:text-text-main transition-colors"
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
                      : "text-text-main/70 border-transparent hover:text-text-main"
                  }`
                }
              >
                {item.name}
              </NavLink>
            )
          ))}
        </nav>

        {/* Icons / Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center justify-center w-8 h-8 sm:w-9 h-9 rounded-full hover:bg-bg-card-hover text-text-main transition-colors cursor-pointer select-none"
            >
              <span className="material-symbols-outlined text-lg sm:text-xl text-primary-container">
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
                <div className="absolute right-0 mt-2 w-32 bg-bg-card border border-border-color rounded-sm shadow-2xl overflow-hidden z-50 animate-slideDown">
                  <div className="flex flex-col py-1">
                    {Object.entries(langNames).map(([code, name]) => (
                      <button
                        key={code}
                        onClick={() => {
                          setLanguage(code);
                          setLangMenuOpen(false);
                        }}
                        className={`px-4 py-2 text-xs transition-colors cursor-pointer hover:bg-bg-card-hover ${
                          language === code 
                            ? "text-primary-container font-extrabold" 
                            : "text-text-muted hover:text-text-main"
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

          {/* Favorites Heart Icon */}
          <button
            onClick={() => setFavoritesOpen(true)}
            className="relative flex items-center justify-center w-8 h-8 sm:w-9 h-9 rounded-full hover:bg-bg-card-hover text-text-main transition-colors cursor-pointer select-none mr-0.5"
            aria-label="Favorites list"
          >
            <span className="material-symbols-outlined text-lg sm:text-xl text-primary-container">
              favorite
            </span>
            {favorites.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#d90429] text-[8px] font-bold text-white shadow-md">
                {favorites.length}
              </span>
            )}
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 sm:w-9 h-9 rounded-full hover:bg-white/5 text-primary-container transition-colors cursor-pointer select-none mr-0.5"
            aria-label="Toggle theme"
          >
            <span className="material-symbols-outlined text-lg sm:text-xl">
              {theme === "dark" ? "light_mode" : "dark_mode"}
            </span>
          </button>

          {/* Search Trigger */}
          <button
            onClick={toggleSearch}
            className="flex items-center justify-center w-8 h-8 sm:w-9 h-9 rounded-full hover:bg-bg-card-hover text-primary-container transition-colors cursor-pointer select-none"
            aria-label="Toggle search"
          >
            <span className="material-symbols-outlined text-lg sm:text-xl">
              {searchOpen ? "close" : "search"}
            </span>
          </button>

          {/* Mobile Hamburger Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center justify-center w-8 h-8 sm:w-9 h-9 rounded-full hover:bg-bg-card-hover text-primary-container transition-colors cursor-pointer select-none md:hidden"
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined text-lg sm:text-xl">
              {mobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {/* Slide-Down Search Drawer */}
      {searchOpen && (
        <div className="bg-bg-card border-b border-border-color px-6 py-4 animate-slideDown">
          <div className="max-w-3xl mx-auto relative">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full bg-bg-main border border-border-color py-3.5 pl-12 pr-20 text-sm text-text-main placeholder:text-text-muted/45 outline-none focus:border-[#ffb3af]/50 rounded-sm transition-all"
                autoFocus
              />
              <span className="material-symbols-outlined absolute left-4 text-base text-text-muted/50">
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
              <div className="absolute left-0 right-0 mt-2 bg-bg-card border border-border-color rounded-sm shadow-2xl overflow-hidden z-50">
                <div className="p-2 border-b border-border-color bg-bg-main/40">
                  <span className="text-[9px] text-text-muted/65 font-label-bold uppercase tracking-wider font-semibold">
                    {t("matchingVehicles")}
                  </span>
                </div>
                <div className="divide-y divide-border-color">
                  {suggestions.map((car) => (
                    <div
                      key={car._id || car.id}
                      onClick={() => handleSuggestionClick(car.slug)}
                      className="p-3 flex items-center justify-between hover:bg-bg-card-hover cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div 
                          className="w-10 h-8 bg-cover bg-center rounded-sm border border-border-color bg-bg-main"
                          style={{ backgroundImage: `url('${car.imageCover ? getMediaUrl(car.imageCover) : ""}')` }}
                        ></div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-text-main uppercase truncate group-hover:text-[#ffb3af] transition-colors">
                            {car.name || `${car.marke} ${car.model}`}
                          </h4>
                          <p className="text-[8px] text-text-muted uppercase tracking-wider mt-0.5 truncate">
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
              <div className="absolute left-0 right-0 mt-2 bg-bg-card border border-border-color p-4 text-center text-xs text-text-muted/50 rounded-sm shadow-2xl z-50">
                {t("noVehiclesFound")}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-bg-card border-b border-border-color px-6 py-4 flex flex-col gap-4">
          {navItems.map((item) => (
            item.path.startsWith("#") ? (
              <a
                key={item.name}
                href={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="text-text-main/70 font-label-bold text-sm uppercase tracking-wider hover:text-text-main transition-colors py-2"
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
                    isActive ? "text-primary-container" : "text-text-main/70"
                  }`
                }
              >
                {item.name}
              </NavLink>
            )
          ))}
        </div>
      )}

      {/* Slide-Over Favorites Drawer */}
      {favoritesOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setFavoritesOpen(false)}
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex">
            {/* Drawer Container */}
            <div 
              className={`w-screen max-w-md bg-[#121414] border-l border-white/10 flex flex-col shadow-2xl h-full transform transition-transform duration-300 ease-in-out`}
              style={{ direction: dir }}
            >
              {/* Header */}
              <div className="px-6 py-6 border-b border-white/10 flex justify-between items-center bg-[#181a1a]">
                <h2 className="font-headline-md text-lg font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500 fill-1">favorite</span>
                  {t("favoritesTitle")}
                </h2>
                <button 
                  onClick={() => setFavoritesOpen(false)}
                  className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/5 text-on-surface-variant transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-grow overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {favorites.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center space-y-6 py-12">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-on-surface-variant/40">
                      <span className="material-symbols-outlined text-4xl">favorite_border</span>
                    </div>
                    <div>
                      <p className="text-sm text-on-surface-variant/60 font-semibold">{t("favoritesEmpty")}</p>
                    </div>
                    <button
                      onClick={() => {
                        setFavoritesOpen(false);
                        navigate("/inventory");
                      }}
                      className="bg-primary-container hover:bg-[#b50321] text-white text-xs font-label-bold uppercase tracking-widest px-6 py-3 rounded-sm transition-all shadow-lg hover:shadow-red-950/20"
                    >
                      {t("favoritesExplore")}
                    </button>
                  </div>
                ) : (
                  favorites.map((car) => (
                    <div 
                      key={car._id}
                      onClick={() => {
                        setFavoritesOpen(false);
                        navigate(`/vehicle/${car.slug}`);
                      }}
                      className="flex gap-4 p-3 rounded-sm border border-white/5 hover:border-white/15 bg-[#1a1c1c]/50 hover:bg-[#1a1c1c] transition-all cursor-pointer group relative overflow-hidden"
                    >
                      {/* Image Thumbnail */}
                      <div className="w-24 h-16 rounded-sm overflow-hidden flex-shrink-0 border border-white/10">
                        <img 
                          src={getMediaUrl(car.imageCover)} 
                          alt={car.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-grow flex flex-col justify-between min-w-0 pr-6">
                        <div>
                          <span className="text-[9px] text-[#ffb3af] font-label-bold uppercase tracking-wider font-semibold">
                            {car.marke}
                          </span>
                          <h4 className="font-headline-md text-xs font-bold text-white truncate uppercase italic">
                            {car.model}
                          </h4>
                        </div>
                        <div className="flex justify-between items-end mt-1">
                          <span className="text-white font-headline-md text-xs font-bold">
                            {formatPrice(car.finalPrice !== undefined && car.finalPrice < car.price ? car.finalPrice : car.price)}
                          </span>
                          {/* Availability Badge */}
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${
                            car.availability === 'Vendu' 
                              ? 'bg-red-950/50 text-red-400 border border-red-500/20' 
                              : car.availability === 'Réservé'
                                ? 'bg-amber-950/50 text-amber-400 border border-amber-500/20'
                                : 'bg-green-950/50 text-green-400 border border-green-500/20'
                          }`}>
                            {car.availability === 'Vendu' 
                              ? t("statusSold") 
                              : car.availability === 'Réservé' 
                                ? t("statusReserved") 
                                : t("statusAvailable")}
                          </span>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFavorite(car._id);
                        }}
                        className="absolute right-2 top-2 p-1 text-on-surface-variant/40 hover:text-red-500 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title={t("favoritesRemove")}
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
