import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { API_BASE_URL, getMediaUrl, formatPrice } from "../config";
import { useTranslation } from "../context/LanguageContext";
import CardImageGallery from "../components/CardImageGallery";

export default function Inventory() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, language } = useTranslation();
  const [favorites, setFavorites] = useState([]);

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

  const isFavorited = (id) => {
    return favorites.some(fav => fav._id === id);
  };

  const toggleFavorite = (car) => {
    try {
      const saved = JSON.parse(localStorage.getItem("favorites")) || [];
      const index = saved.findIndex(fav => fav._id === car._id);
      if (index > -1) {
        saved.splice(index, 1);
      } else {
        saved.push({
          _id: car._id,
          name: car.name,
          marke: car.marke,
          model: car.model,
          year: car.year,
          price: car.price,
          finalPrice: car.finalPrice,
          imageCover: car.imageCover,
          slug: car.slug,
          availability: car.availability
        });
      }
      localStorage.setItem("favorites", JSON.stringify(saved));
      window.dispatchEvent(new Event("favorites-updated"));
    } catch (e) {
      console.error("Error toggling favorite:", e.message);
    }
  };

  const [categoriesList, setCategoriesList] = useState([
    { label: "All Collections", value: "all" },
    { label: "Sedan (Berline)", value: "luxury-cars" },
    { label: "SUV / 4x4", value: "suvs" },
    { label: "Sports / Coupe", value: "sports-cars" },
    { label: "Hatchback (Citadine)", value: "hatchbacks" },
    { label: "Electric / Hybrid", value: "electric-hybrid" }
  ]);

  const [brandsList, setBrandsList] = useState([
    { value: "all", label: "All Brands" }
  ]);
  const [yearsList, setYearsList] = useState([
    { value: "all", label: "All Years" }
  ]);
  const [selectedTransmission, setSelectedTransmission] = useState("all");
  const [selectedFuelType, setSelectedFuelType] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  
  const [minPriceLimit, setMinPriceLimit] = useState(0);
  const [maxPriceLimit, setMaxPriceLimit] = useState(200000);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/products`);
        const data = await response.json();
        const docs = data.data?.docs || data.data?.data || [];
        setCars(docs);

        if (docs.length > 0) {
          // Dynamic Brands
          const uniqueBrands = [...new Set(docs.map(c => c.marke).filter(Boolean))].sort();
          setBrandsList([
            { value: "all", label: t("allBrands") },
            ...uniqueBrands.map(b => ({ value: b, label: b }))
          ]);

          // Dynamic Years
          const uniqueYears = [...new Set(docs.map(c => c.year).filter(Boolean))].sort((a, b) => b - a);
          setYearsList([
            { value: "all", label: t("allYears") },
            ...uniqueYears.map(y => ({ value: String(y), label: String(y) }))
          ]);

          // Dynamic Price limits
          const prices = docs.map(c => c.price).filter(p => typeof p === 'number');
          if (prices.length > 0) {
            const minP = Math.min(...prices);
            const maxP = Math.max(...prices);
            setMinPriceLimit(Math.floor(minP * 0.9));
            const newMax = Math.ceil(maxP * 1.1);
            setMaxPriceLimit(newMax);
            setMaxPrice(newMax);
          }
        }
      } catch (err) {
        console.error("Error fetching inventory cars:", err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        const data = await response.json();
        const docs = data.data?.docs || data.data?.data || data.data || [];
        if (docs.length > 0) {
          const list = [
            { label: "All Collections", value: "all" },
            ...docs.map(cat => ({
              label: cat.name,
              value: cat.slug || cat._id
            }))
          ];
          setCategoriesList(list);
        }
      } catch (err) {
        console.error("Error fetching categories in Inventory:", err.message);
      }
    };

    fetchCars();
    fetchCategories();
  }, [language]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [maxPrice, setMaxPrice] = useState(200000);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Read search parameters from URL on load
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    const badgeParam = searchParams.get("badge");
    const searchParam = searchParams.get("search");

    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
    if (badgeParam) {
      if (badgeParam.includes("New")) {
        setSelectedConditions(["New Arrival"]);
      } else if (badgeParam.includes("Pre-Owned")) {
        setSelectedConditions(["Certified Pre-Owned"]);
      }
    }
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [searchParams]);

  // Filter and Sort Logic
  const filteredCars = cars
    .filter((car) => {
      // 1. Search Query
      const matchesSearch = car.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            car.description.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Condition (badge)
      const matchesCondition = selectedConditions.length === 0 || 
                               selectedConditions.includes(car.badge);

      // 3. Price
      const matchesPrice = car.price <= maxPrice;

      // 4. Category
      const matchesCategory = selectedCategory === "all" || 
                              car.category === selectedCategory || 
                              (car.category && typeof car.category === "object" && 
                               (car.category.slug === selectedCategory || car.category._id === selectedCategory || car.category.name === selectedCategory));

      // 5. Brand (Make)
      const matchesBrand = selectedBrand === "all" || car.marke === selectedBrand;

      // 6. Transmission
      const matchesTransmission = selectedTransmission === "all" || 
                                  car.transmission === selectedTransmission ||
                                  (selectedTransmission === "Automatic" && car.transmission === "Automatique") ||
                                  (selectedTransmission === "Manual" && car.transmission === "Manuelle");

      // 7. Fuel Type
      const matchesFuelType = selectedFuelType === "all" || 
                              car.fuelType === selectedFuelType ||
                              (selectedFuelType === "Gasoline" && car.fuelType === "Essence");

      // 8. Year
      const matchesYear = selectedYear === "all" || String(car.year) === selectedYear;

      return matchesSearch && matchesCondition && matchesPrice && matchesCategory && matchesBrand && matchesTransmission && matchesFuelType && matchesYear;
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") {
        return a.price - b.price;
      }
      if (sortBy === "price-desc") {
        return b.price - a.price;
      }
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      // default: newest/highest rating
      return b.ratingsAverage - a.ratingsAverage;
    });

  const handleConditionChange = (condition) => {
    if (selectedConditions.includes(condition)) {
      setSelectedConditions(selectedConditions.filter((c) => c !== condition));
    } else {
      setSelectedConditions([...selectedConditions, condition]);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedConditions([]);
    setMaxPrice(maxPriceLimit);
    setSelectedCategory("all");
    setSelectedBrand("all");
    setSelectedTransmission("all");
    setSelectedFuelType("all");
    setSelectedYear("all");
    setSortBy("newest");
    setSearchParams({});
  };

  const transmissionsList = [
    { value: "all", label: t("allTransmissions") },
    { value: "Automatic", label: t("transmissionAuto") },
    { value: "Manual", label: t("transmissionManual") }
  ];

  const fuelsList = [
    { value: "all", label: t("allFuels") },
    { value: "Gasoline", label: t("fuelGasoline") },
    { value: "Diesel", label: t("fuelDiesel") },
    { value: "Electric", label: t("fuelElectric") },
    { value: "Hybrid", label: t("fuelHybrid") }
  ];



  return (
    <div className="bg-bg-main text-text-main min-h-screen transition-colors duration-300">
      
      {/* Hero Section */}
      <section className="relative h-[280px] flex items-end pb-12 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ 
            backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDTW_XZcmGjZMahOYztN49ObghHK99JqVbxAZlfnRAP5tbJbpFCD1huELkB28DPbjOcRpPvJp0NgNoSXTiPXJXKogrPKm8TW4CqpqWoccSznlppETSitAjjI3vqMAEWnI8-AxXRio8wObjtAyE0dUGzXjNcPjGmF__6ThnxatWPwjv27xU5_UeFu-tl-au2nJQfRNNAe0Eire3lpDeiYMtGXeKizvBiLdzi6NW3Ois3_v9co9bgwYPY_w')"
          }}
        ></div>
        <div className="absolute inset-0 luxury-overlay"></div>
        <div className="relative w-full max-w-7xl mx-auto px-6 z-10">
          <h1 className="font-display-lg text-4xl md:text-5xl uppercase italic font-extrabold tracking-tighter">
            {t("inventoryTitle")}
          </h1>
          <p className="font-body-lg text-sm text-on-surface-variant max-w-2xl mt-3 leading-relaxed">
            {t("inventorySubtitle")}
          </p>
        </div>
      </section>

      {/* Main content grid */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="sticky top-28 space-y-6">
            <div>
              <h2 className="font-headline-md text-[#ffb3af] text-xl font-bold uppercase mb-1">{t("filtersTitle")}</h2>
              <p className="font-caption text-[10px] text-on-surface-variant uppercase tracking-wider">{t("precisionSearch")}</p>
            </div>

            <div className="relative border-b border-border-color pb-4">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-bg-card border border-border-color py-2.5 pl-3 pr-10 text-sm text-text-main placeholder:text-text-muted/40 outline-none rounded-sm"
                placeholder={t("searchInventoryPlaceholder")}
              />
              <span className="material-symbols-outlined absolute right-3 top-3 text-sm text-on-surface-variant">search</span>
            </div>

            {/* Category Filter dropdown */}
            <div className="space-y-2 border-b border-border-color pb-4">
              <h3 className="font-label-bold text-xs text-[#ffb3af] uppercase tracking-wider font-semibold">{t("categoryLabel")}</h3>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-bg-card border border-border-color text-sm text-text-main py-2.5 px-3 rounded-sm outline-none cursor-pointer"
              >
                {categoriesList.map((cat) => (
                  <option key={cat.value} value={cat.value} className="bg-bg-card text-text-main">
                    {cat.value === "all" ? t("allCollections") : cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Filter dropdown */}
            <div className="space-y-2 border-b border-border-color pb-4">
              <h3 className="font-label-bold text-xs text-primary uppercase tracking-wider font-semibold">{t("brandLabel")}</h3>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full bg-bg-card border border-border-color text-sm text-text-main py-2.5 px-3 rounded-sm outline-none cursor-pointer"
              >
                {brandsList.map((brand) => (
                  <option key={brand.value} value={brand.value} className="bg-bg-card text-text-main">
                    {brand.value === "all" ? t("allBrands") : brand.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Transmission Filter dropdown */}
            <div className="space-y-2 border-b border-border-color pb-4">
              <h3 className="font-label-bold text-xs text-primary uppercase tracking-wider font-semibold">{t("transmissionLabel") || "Transmission"}</h3>
              <select
                value={selectedTransmission}
                onChange={(e) => setSelectedTransmission(e.target.value)}
                className="w-full bg-bg-card border border-border-color text-sm text-text-main py-2.5 px-3 rounded-sm outline-none cursor-pointer"
              >
                {transmissionsList.map((tr) => (
                  <option key={tr.value} value={tr.value} className="bg-bg-card text-text-main">
                    {tr.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Fuel Type Filter dropdown */}
            <div className="space-y-2 border-b border-border-color pb-4">
              <h3 className="font-label-bold text-xs text-primary uppercase tracking-wider font-semibold">{t("fuelLabel") || "Fuel Type"}</h3>
              <select
                value={selectedFuelType}
                onChange={(e) => setSelectedFuelType(e.target.value)}
                className="w-full bg-bg-card border border-border-color text-sm text-text-main py-2.5 px-3 rounded-sm outline-none cursor-pointer"
              >
                {fuelsList.map((f) => (
                  <option key={f.value} value={f.value} className="bg-bg-card text-text-main">
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Filter dropdown */}
            <div className="space-y-2 border-b border-border-color pb-4">
              <h3 className="font-label-bold text-xs text-primary uppercase tracking-wider font-semibold">{t("yearLabel") || "Year"}</h3>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-bg-card border border-border-color text-sm text-text-main py-2.5 px-3 rounded-sm outline-none cursor-pointer"
              >
                {yearsList.map((yr) => (
                  <option key={yr.value} value={yr.value} className="bg-bg-card text-text-main">
                    {yr.value === "all" ? t("allYears") : yr.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Condition Checkboxes */}
            <div className="space-y-3 border-b border-border-color pb-4">
              <h3 className="font-label-bold text-xs text-[#ffb3af] uppercase tracking-wider font-semibold">{t("conditionLabel")}</h3>
              <div className="space-y-2 mt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={selectedConditions.includes("New Arrival")}
                    onChange={() => handleConditionChange("New Arrival")}
                    className="w-4 h-4 bg-bg-card border-border-color rounded accent-primary-container"
                  />
                  <span className="text-sm text-text-main group-hover:text-[#ffb3af] transition-colors font-medium">{t("newArrivals")}</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={selectedConditions.includes("Certified Pre-Owned")}
                    onChange={() => handleConditionChange("Certified Pre-Owned")}
                    className="w-4 h-4 bg-bg-card border-border-color rounded accent-primary-container"
                  />
                  <span className="text-sm text-text-main group-hover:text-[#ffb3af] transition-colors font-medium">{t("preOwned")}</span>
                </label>
              </div>
            </div>

            {/* Price Slider */}
            <div className="space-y-3 border-b border-border-color pb-4">
              <div className="flex justify-between items-center">
                <h3 className="font-label-bold text-xs text-primary uppercase tracking-wider font-semibold">{t("priceLabel")}</h3>
                <span className="text-xs font-semibold text-white bg-primary-container px-2 py-0.5 rounded-sm">
                  {formatPrice(maxPrice)}
                </span>
              </div>
              <input 
                type="range"
                min={minPriceLimit}
                max={maxPriceLimit}
                step={maxPriceLimit > 10000 ? 5000 : 25}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-1 bg-bg-card rounded-lg appearance-none cursor-pointer accent-primary-container"
              />
              <div className="flex justify-between text-[10px] text-text-muted">
                <span>{formatPrice(minPriceLimit)}</span>
                <span>{formatPrice(maxPriceLimit)}</span>
              </div>
            </div>

            {/* Reset Button */}
            <button 
              onClick={handleResetFilters}
              className="w-full py-3 border border-border-color text-text-main font-label-bold text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all font-semibold rounded-sm cursor-pointer"
            >
              {t("resetBtn")}
            </button>
          </div>
        </aside>

        {/* Results Grid */}
        <section className="flex-grow">
          {/* Sorting / Header */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-border-color gap-4">
            <span className="text-sm text-text-muted">
              {t("showingResults").replace("{count}", filteredCars.length).replace("{total}", cars.length)}
            </span>
            <div className="flex items-center gap-3">
              <span className="font-label-bold text-xs uppercase text-text-muted tracking-wider font-semibold">{t("sorting")}:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-bg-card border border-border-color text-xs text-text-main font-label-bold uppercase py-2 pl-3 pr-8 rounded-sm focus:ring-1 focus:ring-primary-container cursor-pointer"
              >
                <option value="newest">{t("sortingNewest")}</option>
                <option value="price-asc">{t("sortingPriceAsc")}</option>
                <option value="price-desc">{t("sortingPriceDesc")}</option>
                <option value="name">{t("sortingName")}</option>
              </select>
            </div>
          </div>

          {/* Grid Layout */}
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="matte-card flex flex-col h-[400px] animate-pulse">
                  <div className="h-56 bg-white/5"></div>
                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="h-4 bg-white/5 w-1/3 rounded"></div>
                      <div className="h-6 bg-white/5 w-2/3 rounded"></div>
                    </div>
                    <div className="h-10 bg-white/5 w-full rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCars.length === 0 ? (
            <div className="text-center py-20 bg-bg-card rounded-sm border border-border-color">
              <span className="material-symbols-outlined text-4xl text-text-muted/50 mb-3">
                search_off
              </span>
              <h3 className="text-lg font-bold text-text-main uppercase mb-2">{t("noResults")}</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredCars.map((car) => (
                <div 
                  key={car._id || car.id} 
                  onClick={() => navigate(`/vehicle/${car.slug}`)}
                  className="matte-card flex flex-col group rounded-sm hover:border-[#ffb3af]/20 transition-all duration-300 cursor-pointer"
                >
                  <CardImageGallery 
                    car={car} 
                    isFavorited={isFavorited} 
                    toggleFavorite={toggleFavorite} 
                    aspectClass="h-64" 
                  />

                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="text-on-surface-variant/60 font-label-bold text-[10px] uppercase tracking-wider font-semibold">
                            {car.marke || (car.name ? car.name.split(" ")[1] : '')}
                          </span>
                          <h3 className="font-headline-md text-lg font-bold text-text-main mt-1 italic">
                            {car.model || (car.name ? car.name.split(" ").slice(2).join(" ") : 'Vehicle')}
                          </h3>
                        </div>
                        <span className="text-[#ffb3af] font-headline-md text-lg font-bold flex flex-wrap items-center gap-x-2 justify-end">
                          {car.finalPrice < car.price ? (
                            <>
                              <span className="line-through text-white/40 text-xs font-normal font-sans">
                                {formatPrice(car.price)}
                              </span>
                              <span>{formatPrice(car.finalPrice)}</span>
                            </>
                          ) : (
                            <span>{formatPrice(car.price)}</span>
                          )}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6 pb-4 border-b border-white/5">
                        <div className="flex items-center gap-2 text-on-surface-variant/80">
                          <span className="material-symbols-outlined text-sm text-[#ffb3af]">speed</span>
                          <span className="text-xs font-label-bold uppercase font-semibold">
                            {car.mileage !== undefined ? `${car.mileage.toLocaleString()} km` : (car.specs?.speed || 'N/A')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-on-surface-variant/80">
                          <span className="text-[#ffb3af] flex items-center justify-center">
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              width="22" 
                              height="22" 
                              viewBox="-30 -22 167.4 167.4" 
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="53.7" cy="61.44" r="76" fill="none" stroke="currentColor" strokeWidth="6" />
                              <path fill="currentColor" stroke="none" d="M43.32,39.18V57.89h20.6V39.18a8.64,8.64,0,1,1,9.5,0V57.89H94V39.18a8.64,8.64,0,1,1,9.5,0V62c0,.21,0,.42,0,.64s0,.43,0,.64V85A8.65,8.65,0,1,1,94,85V67.39H73.42V85a8.65,8.65,0,1,1-9.5,0V67.39H43.32V85a8.64,8.64,0,1,1-9.5,0V67.39H8.65A4.74,4.74,0,0,1,3.9,62.64V39.18a8.64,8.64,0,1,1,9.5,0V57.89H33.82V39.18a8.65,8.65,0,1,1,9.5,0Zm-40.77-23V.14H9.38A6.65,6.65,0,0,1,11.32.4a3.64,3.64,0,0,1,1.53.87,4,4,0,0,1,1,1.65,8,8,0,0,1,.36,2.6A7.91,7.91,0,0,1,14,7.25a4.59,4.59,0,0,1-.47,1.24,3.06,3.06,0,0,1-.69.85,5,5,0,0,1-.85.6l2.78,6.21H10.57L8.32,10.63H6.73v5.52ZM6.73,7.31h1.9a1.8,1.8,0,0,0,.6-.09,1.07,1.07,0,0,0,.44-.32,1.35,1.35,0,0,0,.27-.55,3.09,3.09,0,0,0,.09-.8,3,3,0,0,0-.09-.8,1.12,1.12,0,0,0-.27-.51A1.16,1.16,0,0,0,9.23,4a1.82,1.82,0,0,0-.6-.08H6.73V7.31Zm91,115.57a6.23,6.23,0,0,1-2.22-.36,3.35,3.35,0,0,1-1.58-1.21,6.18,6.18,0,0,1-.93-2.39,19.18,19.18,0,0,1-.32-3.82,17.1,17.1,0,0,1,.42-4.13,6.48,6.48,0,0,1,1.24-2.61,4.43,4.43,0,0,1,2-1.35,8,8,0,0,1,2.65-.4c.76,0,1.49,0,2.21.09a11.21,11.21,0,0,1,1.92.34v3.32H99.48a2.42,2.42,0,0,0-2,.73,3.31,3.31,0,0,0-.58,2.07,4.18,4.18,0,0,1,.81-.29,4.84,4.84,0,0,1,.94-.13c.36,0,.8,0,1.34,0a5.26,5.26,0,0,1,2.57.51,2.71,2.71,0,0,1,1.22,1.4,5.86,5.86,0,0,1,.32,2v2.32a4.61,4.61,0,0,1-.5,2.28,3,3,0,0,1-1.44,1.28,5.38,5.38,0,0,1-2.17.41Zm.86-3.75H99a1,1,0,0,0,.56-.13.75.75,0,0,0,.29-.38,2,2,0,0,0,.08-.59v-.6a2,2,0,0,0-.1-.73.62.62,0,0,0-.34-.35,1.94,1.94,0,0,0-.72-.11H96.87a9.13,9.13,0,0,0,.09,1.42,2.32,2.32,0,0,0,.29.89,1.18,1.18,0,0,0,.54.45,2.37,2.37,0,0,0,.81.13Zm-29,3.62v-3H63l-.74-1.88,4.64-11.18h4.26l-3.92,9.52h2.41v-2.37l.8-2.07h3.39v4.44H75.1v2.89l-1.29.65v3Zm-36.59,0v-3.32l5-5.09a10,10,0,0,0,.8-.88,4.18,4.18,0,0,0,.5-.8,1.73,1.73,0,0,0,.19-.79,1.51,1.51,0,0,0-.17-.75,1,1,0,0,0-.53-.42,3,3,0,0,0-.92-.13H33.29v-3.32c.71-.15,1.49-.3,2.36-.44a20.68,20.68,0,0,1,3-.2,7.13,7.13,0,0,1,3,.51,3.14,3.14,0,0,1,1.56,1.53,6.13,6.13,0,0,1,.46,2.48,6.06,6.06,0,0,1-.28,1.92,6.3,6.3,0,0,1-.81,1.62,12.1,12.1,0,0,1-1.28,1.51L38.55,119h5.56v3.75ZM98.68,16.28c-.81,0-1.69-.05-2.66-.14l-2.84-.29V12.53h5.69a1.43,1.43,0,0,0,.93-.23.87.87,0,0,0,.3-.54,3.66,3.66,0,0,0,0-.52v-.67a1.45,1.45,0,0,0-.2-.84.9.9,0,0,0-.79-.3h-1a1.13,1.13,0,0,0-.74.19.85.85,0,0,0-.27.56h-4l.45-10h10V3.89h-6.4l-.11,2.43A1.92,1.92,0,0,1,98,6a7.28,7.28,0,0,1,1-.08h1.63a3.65,3.65,0,0,1,2,.52,3.13,3.13,0,0,1,1.19,1.4,4.86,4.86,0,0,1,.38,2v2.35a4.18,4.18,0,0,1-.61,2.38,3.5,3.5,0,0,1-1.86,1.34,10.14,10.14,0,0,1-3.17.42Zm-29.18,0c-1.15,0-2.26-.05-3.34-.15s-2.07-.25-3-.43V12.33h4.7a7.38,7.38,0,0,0,1.3-.08,1.16,1.16,0,0,0,.64-.28.81.81,0,0,0,.17-.54V11a1,1,0,0,0-.19-.62,1.17,1.17,0,0,0-.57-.36,3.15,3.15,0,0,0-.9-.14l-3.84-.17V6.49l3.65-.23A4,4,0,0,0,69.4,6a.7.7,0,0,0,.41-.69V5.12a1,1,0,0,0-.44-.89A3.37,3.37,0,0,0,67.78,4h-4.4V.61c.94-.16,1.92-.3,3-.44A19.27,19.27,0,0,1,69.48,0a6.08,6.08,0,0,1,2.38.46,3.34,3.34,0,0,1,1.55,1.34,4.41,4.41,0,0,1,.53,2.27V5.16a5.24,5.24,0,0,1-.09,1,2.82,2.82,0,0,1-.32.84,2.34,2.34,0,0,1-.56.66,2.79,2.79,0,0,1-.84.45,2.19,2.19,0,0,1,.9.49,2.77,2.77,0,0,1,.62.78,3.93,3.93,0,0,1,.38,1,5.22,5.22,0,0,1,.13,1.21v.63a3.66,3.66,0,0,1-1.24,3,5.17,5.17,0,0,1-3.42,1Zm-31.74-.13V4H35.22V1.3l3-1.29h3.7V16.15Z" />
                            </svg>
                          </span>
                          <span className="text-xs font-label-bold uppercase font-semibold">
                            {car.transmission || car.specs?.transmission || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-on-surface-variant/80">
                          <span className="material-symbols-outlined text-sm text-[#ffb3af]">ev_station</span>
                          <span className="text-xs font-label-bold uppercase font-semibold">
                            {car.fuelType || car.specs?.fuel || 'N/A'}
                          </span>
                        </div>
                         <div className="flex items-center gap-2 text-on-surface-variant/80">
                           <span className="text-[#ffb3af] flex items-center justify-center">
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                width="18" 
                                height="18" 
                                viewBox="0 0 122.88 110.29" 
                                fill="currentColor"
                              >
                                <path d="M18.09,26.09c1.68,0.61,4.16-0.76,7.97-5.34c1.44,0.53,2.57,1.71,3.06,4.24c0.94,4.82-0.55,7.91-2.62,12.15 c-2.25,4.63-4.61,9.02-3.6,15.06c-4.13,0.51-7.93,0.38-11.38-0.46c-1.96-0.17-3.58-0.05-4.78,0.42c-1.22,0.47-2.01,1.3-2.3,2.55 c-0.7,4.68-2.53,7.66-4.41,10.56c-0.1,2.38-0.03,4.68,0.89,6.62l0.53,1.36l0.24,3.05c0.32,4.08,1.77,7.49,5.07,1.96 c0.34-2.11,0.02-4.22-0.95-6.33l-1.52-0.69c0.09-2.97,0.39-5.84,1.36-8.37c0.75-2.47,2.12-4.24,4.19-5.25l2.12-0.24l-1.24,3.18 c-0.29,3.36-0.72,6.42-1.89,8.02c-0.66,2.36-0.36,3.82,0.88,4.42c0.96,0.39,1.84,2.15,2.65,5.6c0.86,1.96,1.94,3.04,3.24,3.24 c1.36-0.34,1.6-3.03,1.06-7.31c-1.04-1.27-2.08-1.78-3.13-1.89c0.19-2.27,0.1-4.48-0.3-6.61c0.19-2.65,0.97-5.13,3.36-7.19 c0.92,2.5,4.89,3.59,9.91,4.19l3.3-3.42c8.75,8.3,18.93,13.06,28.78,9.44c0.72,0.51,1,2.52,1.25,6.01 c2.01,2.89,3.92,8.19,5.82,11.98c1.4,2.92,1.11,5.33-0.24,7.43c-3.04,1.29-5.95,3.26-7.75,5.38c-2.93,0.13-5.16,0.27-7,1.22 c-1.26,0.99-2.02,2.23-2.18,3.77l1.53,0.59l-1.71,2.36c0.61,2.05,2.61,2.6,6.52,2.44l2.27-3.91l4.36-1.24 c1.6-3.18,4.16-6.26,9.61-9.02c3.64,0.2,5.57-1.75,5.37-6.37c-1.84-4.18-2.51-8.19-0.83-11.85c7.72-4.75,12.49-12.02,11.91-20.17 c12.31-3.22-6.38,28.39,28.91,21.44c2.04-0.4,4.16-1.14,6.42-1.98c-4.56-0.78-17.68-4.03-19.99-9.55 c-5.91-8.38-12.1-14.5-18.69-17.4c-4.47-5.68-12.36-7.87-22.06-8.2c-2.9-0.26-5.44-1.03-7.43-2.59 c2.01-14.21-11.58-21.19-1.65-16.81C48.79,12.28,35.64,8.92,44.92,9.99c-4.77-4.36-10.79-6.77-19.34-5.25 c-1.82-2.65-6.17-8.32-4.84-1.53l-2.18-1.95l-0.12,6.84c-2.59,1.98-4.01,8.57-6.02,12.85c-1.71,1.7-2.37,3.74-1.83,6.9 C13.27,31.3,17.49,30.45,18.09,26.09L18.09,26.09z" fill="currentColor"/>
                              </svg>
                           </span>
                           <span className="text-xs font-label-bold uppercase font-semibold">
                             {car.horsepower ? `${car.horsepower} HP` : (car.specs?.horsepower || 'N/A')}
                           </span>
                         </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => navigate(`/vehicle/${car.slug}`)}
                      className="w-full py-3 border border-white/20 font-label-bold text-xs uppercase tracking-widest hover:bg-primary-container hover:border-primary-container hover:text-white transition-all font-semibold rounded-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
