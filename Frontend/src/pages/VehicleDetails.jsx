import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { API_BASE_URL, getMediaUrl, formatPrice } from "../config";
import { useTranslation } from "../context/LanguageContext";

export default function VehicleDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t, language } = useTranslation();

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMedia, setActiveMedia] = useState('');
  const [relatedCars, setRelatedCars] = useState([]);
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
  // Finance Calculator States
  const [downPayment, setDownPayment] = useState(0);
  const [term, setTerm] = useState(60);
  const [monthlyPayment, setMonthlyPayment] = useState(0);

  // Lightbox & Zoom States
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleLightboxPrev = () => {
    setLightboxIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1));
    resetZoom();
  };

  const handleLightboxNext = () => {
    setLightboxIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));
    resetZoom();
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) {
        setPanOffset({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleMouseDown = (e) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || zoomLevel <= 1) return;
    const nextX = e.clientX - dragStart.x;
    const nextY = e.clientY - dragStart.y;
    const maxOffset = (zoomLevel - 1) * 300;
    setPanOffset({
      x: Math.max(-maxOffset, Math.min(maxOffset, nextX)),
      y: Math.max(-maxOffset, Math.min(maxOffset, nextY))
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (zoomLevel <= 1 || e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({ 
      x: e.touches[0].clientX - panOffset.x, 
      y: e.touches[0].clientY - panOffset.y 
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || zoomLevel <= 1 || e.touches.length !== 1) return;
    const nextX = e.touches[0].clientX - dragStart.x;
    const nextY = e.touches[0].clientY - dragStart.y;
    const maxOffset = (zoomLevel - 1) * 300;
    setPanOffset({
      x: Math.max(-maxOffset, Math.min(maxOffset, nextX)),
      y: Math.max(-maxOffset, Math.min(maxOffset, nextY))
    });
  };

  const isVideo = (url) => {
    return url && (url.endsWith('.mp4') || url.endsWith('.mov') || url.endsWith('.webm') || url.includes('video') || url.includes('.mov') || url.includes('mp4') || url.includes('webm'));
  };

  // Fetch product detail
  useEffect(() => {
    const fetchCar = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/products?slug=${slug}`);
        const data = await response.json();
        const docs = data.data?.docs || data.data?.data || [];
        if (docs.length > 0) {
          setCar(docs[0]);
        } else {
          setCar(null);
        }
      } catch (err) {
        console.error("Error fetching car details:", err.message);
        setCar(null);
      } finally {
        setLoading(false);
      }
    };
    fetchCar();
  }, [slug]);

  // Re-build media items list & default values when car loads
  const mediaItems = car ? [
    ...(car.video ? [getMediaUrl(car.video, 'video')] : []),
    getMediaUrl(car.imageCover),
    ...(car.images ? car.images.map(img => getMediaUrl(img)) : [])
  ] : [];

  useEffect(() => {
    if (car) {
      setActiveMedia(getMediaUrl(car.imageCover) || '');
      setDownPayment(Math.round(car.price * 0.2));
    }
  }, [car]);

  // Recalculate monthly payment dynamically
  useEffect(() => {
    if (!car) return;
    const targetPrice = car.finalPrice !== undefined && car.finalPrice < car.price ? car.finalPrice : car.price;
    const principal = targetPrice - downPayment;
    const annualRate = 0.059; // 5.9% APR
    const monthlyRate = annualRate / 12;
    
    if (principal <= 0) {
      setMonthlyPayment(0);
      return;
    }

    if (monthlyRate === 0) {
      setMonthlyPayment(Math.round(principal / term));
      return;
    }

    const payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, term)) / 
                    (Math.pow(1 + monthlyRate, term) - 1);
    
    setMonthlyPayment(Math.round(payment));
  }, [downPayment, term, car]);

  // Fetch related cars from backend
  useEffect(() => {
    if (car && car.category) {
      const fetchRelated = async () => {
        try {
          const catParam = car.category._id || car.category;
          const response = await fetch(`${API_BASE_URL}/products?category=${catParam}&limit=4`);
          const data = await response.json();
          const docs = data.data?.docs || data.data?.data || [];
          setRelatedCars(docs.filter(c => c._id !== car._id).slice(0, 3));
        } catch (err) {
          console.error("Error fetching related cars:", err.message);
        }
      };
      fetchRelated();
    }
  }, [car]);

  // Features list
  const standardFeatures = [
    { name: "Bluetooth", icon: "bluetooth" },
    { name: "Navigation", icon: "explore" },
    { name: "Leather Seats", icon: "airline_seat_recline_extra" },
    { name: "Sunroof", icon: "wb_sunny" },
    { name: "Backup Camera", icon: "videocam" },
    { name: "Parking Sensors", icon: "sensors" },
    { name: "Apple CarPlay", icon: "smartphone" },
    { name: "Android Auto", icon: "android" },
    { name: "Cruise Control", icon: "speed" }
  ];

  if (loading) {
    return (
      <div className="bg-[#0F0F0F] text-white min-h-screen flex flex-col items-center justify-center py-20 px-6">
        <div className="w-10 h-10 border-4 border-[#ffb3af] border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl uppercase font-bold tracking-wider">Loading Specifications...</h2>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="bg-[#0F0F0F] text-white min-h-screen flex flex-col items-center justify-center py-20 px-6">
        <span className="material-symbols-outlined text-5xl text-[#ffb3af] mb-4">error</span>
        <h2 className="text-2xl font-bold uppercase mb-2">Vehicle Not Found</h2>
        <p className="text-on-surface-variant/70 mb-6">The vehicle you are looking for does not exist or has been sold.</p>
        <button 
          onClick={() => navigate("/inventory")}
          className="bg-primary-container text-white px-8 py-3 font-label-bold uppercase text-xs tracking-widest hover:bg-[#b50321] transition-all font-semibold rounded-sm"
        >
          Back to Inventory
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#0F0F0F] text-[#e2e2e2] min-h-screen">
      
      {/* Spacer for sticky header */}
      <div className="h-20"></div>

      <main className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Header Title Section */}
        <section className="mb-10 border-b border-white/5 pb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <span className="text-[#ffb3af] font-label-bold text-xs uppercase tracking-widest font-semibold">
                High-Performance Series
              </span>
              <h1 className="font-display-lg text-4xl md:text-5xl font-extrabold uppercase mt-2 mb-2 tracking-tight">
                {car.name || `${car.marke} ${car.model} ${car.year}`}
              </h1>
              <div className="flex items-center gap-4 text-on-surface-variant/80 text-sm">
                <span className="font-body-md font-semibold text-[#ffb3af]">{car.badge || car.condition || 'Occasion'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                <span className="font-body-md">Stock: #{car.slug.toUpperCase()}-STOCK</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-label-bold uppercase font-bold ${
                  car.availability === 'Vendu' 
                    ? 'bg-[#B50321] text-white' 
                    : car.availability === 'Réservé'
                      ? 'bg-amber-600 text-white'
                      : 'bg-green-600 text-white'
                }`}>
                  {car.availability === 'Vendu' 
                    ? t("statusSold") 
                    : car.availability === 'Réservé' 
                      ? t("statusReserved") 
                      : t("statusAvailable")}
                </span>
              </div>
            </div>
            <div className="md:text-right">
              <p className="font-label-bold text-[10px] text-on-surface-variant/60 uppercase tracking-widest font-semibold mb-1">
                {t("msrpLabel")}
              </p>
              <div className="font-display-lg text-3xl md:text-4xl text-primary-container font-extrabold flex flex-wrap items-center gap-x-3 justify-end">
                {car.finalPrice < car.price ? (
                  <>
                    <span className="line-through text-white/40 text-lg font-normal font-sans">
                      {formatPrice(car.price)}
                    </span>
                    <span>{formatPrice(car.finalPrice)}</span>
                  </>
                ) : (
                  <span>{formatPrice(car.price)}</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Main Columns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Gallery & Details */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-video w-full overflow-hidden border border-white/10 bg-[#0C0C0C] rounded-sm flex items-center justify-center">
                {isVideo(activeMedia) ? (
                  <video 
                    className="w-full h-full object-contain animate-fadeIn" 
                    src={activeMedia} 
                    controls 
                    autoPlay 
                    loop 
                    poster={getMediaUrl(car.imageCover)}
                  />
                ) : (
                  <img 
                    className="w-full h-full object-contain cursor-zoom-in animate-fadeIn" 
                    src={activeMedia} 
                    alt={car.name} 
                    onClick={() => {
                      const idx = mediaItems.indexOf(activeMedia);
                      setLightboxIndex(idx >= 0 ? idx : 0);
                      setLightboxOpen(true);
                    }}
                  />
                )}
                {/* Favorite button overlay */}
                <button
                  onClick={() => toggleFavorite(car)}
                  className="absolute top-4 right-4 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-sm transition-all hover:scale-110 cursor-pointer border border-white/15"
                >
                  <span className={`material-symbols-outlined text-lg ${isFavorited(car._id) ? "text-red-500 fill-1" : "text-white"}`}>
                    favorite
                  </span>
                </button>

                {!isVideo(activeMedia) && (
                  <button
                    onClick={() => {
                      const idx = mediaItems.indexOf(activeMedia);
                      setLightboxIndex(idx >= 0 ? idx : 0);
                      setLightboxOpen(true);
                    }}
                    className="absolute top-4 right-14 bg-black/60 hover:bg-black/90 text-white w-8 h-8 rounded-full border border-white/15 flex items-center justify-center cursor-pointer transition-all duration-200"
                    title="Zoom Image"
                  >
                    <span className="material-symbols-outlined text-sm">zoom_in</span>
                  </button>
                )}
                <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-md px-4 py-2 flex items-center gap-2 border border-white/10 rounded-sm">
                  <span className="material-symbols-outlined text-white text-sm">
                    {isVideo(activeMedia) ? "videocam" : "photo_camera"}
                  </span>
                  <span className="font-label-bold text-xs text-white font-semibold font-mono">
                    {mediaItems.indexOf(activeMedia) + 1} / {mediaItems.length}
                  </span>
                </div>
              </div>
              
              {/* Thumbnail strip */}
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                {mediaItems.map((media, idx) => {
                  const mediaVideo = isVideo(media);
                  return (
                    <div 
                      key={idx}
                      onClick={() => setActiveMedia(media)}
                      className={`aspect-square border-2 overflow-hidden cursor-pointer rounded-sm relative transition-all ${
                        activeMedia === media ? "border-[#ffb3af]" : "border-white/10 opacity-60 hover:opacity-100"
                      }`}
                    >
                      {mediaVideo ? (
                        <div 
                          className="w-full h-full bg-cover bg-center flex items-center justify-center relative group"
                          style={{ backgroundImage: `url('${getMediaUrl(car.imageCover)}')` }}
                        >
                          <div className="absolute inset-0 bg-black/55 group-hover:bg-black/35 transition-colors" />
                          <span className="material-symbols-outlined text-[#ffb3af] text-3xl relative z-10 drop-shadow-md">play_circle</span>
                          <span className="absolute bottom-1 right-1 text-[8px] bg-black/85 px-1.5 py-0.5 text-white uppercase font-bold tracking-wider rounded-sm z-10 font-mono">VIDEO</span>
                        </div>
                      ) : (
                        <img className="w-full h-full object-cover" src={media} alt={`${car.name} thumb ${idx}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Core Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 border border-white/10 rounded-sm overflow-hidden">
              <div className="bg-[#121414] p-6 flex flex-col items-center text-center">
                <span className="text-on-surface-variant/60 font-label-bold text-[10px] uppercase mb-2 font-semibold">{t("conditionLabel")}</span>
                <span className="font-headline-md text-base font-bold text-white uppercase">{(car.badge || car.condition || 'Occasion').replace(" Arrival", "")}</span>
              </div>
              <div className="bg-[#121414] p-6 flex flex-col items-center text-center">
                <span className="text-on-surface-variant/60 font-label-bold text-[10px] uppercase mb-2 font-semibold">{t("mileageLabel")}</span>
                <span className="font-headline-md text-base font-bold text-white uppercase">{car.mileage !== undefined ? `${car.mileage.toLocaleString()} km` : (car.specs?.speed || 'N/A')}</span>
              </div>
              <div className="bg-[#121414] p-6 flex flex-col items-center text-center">
                <span className="text-on-surface-variant/60 font-label-bold text-[10px] uppercase mb-2 font-semibold">{t("transLabel")}</span>
                <span className="font-headline-md text-base font-bold text-white uppercase">
                  {car.transmission === "Manual" || car.transmission === "Manuelle" ? t("transmissionManual") : t("transmissionAuto")}
                </span>
              </div>
              <div className="bg-[#121414] p-6 flex flex-col items-center text-center">
                <span className="text-on-surface-variant/60 font-label-bold text-[10px] uppercase mb-2 font-semibold">{t("fuelLabel")}</span>
                <span className="font-headline-md text-base font-bold text-white uppercase">
                  {car.fuelType === "Diesel" ? t("fuelDiesel") : (car.fuelType === "Essence" || car.fuelType === "Gasoline" ? t("fuelGasoline") : car.fuelType)}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-6">
              <h2 className="font-headline-lg text-2xl font-bold border-l-4 border-primary-container pl-6 uppercase tracking-wider">
                Engineering Excellence
              </h2>
              <p className="font-body-lg text-sm text-on-surface-variant leading-relaxed">
                {car.description}
              </p>
              <p className="font-body-lg text-sm text-on-surface-variant leading-relaxed">
                Distilled from motor racing heritage into a road-legal performance masterpiece, this vehicle delivers extreme tactile feedback, rapid-fire response times, and unparalleled prestige. Every design detail is crafted by wind tunnels and racetracks to enable maximum control on the asphalt.
              </p>
            </div>

            {/* Standard Features */}
            <div className="space-y-6">
              <h3 className="font-headline-md text-lg font-bold uppercase tracking-wide">Standard Features</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {standardFeatures.map((feat, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-[#1e2020] border border-white/5 rounded-sm">
                    <span className="material-symbols-outlined text-primary-container">{feat.icon}</span>
                    <span className="font-label-bold text-xs font-semibold">{feat.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="space-y-6">
              <h3 className="font-headline-md text-lg font-bold uppercase tracking-wide">{t("specsTitle")}</h3>
              <div className="border-t border-white/10 divide-y divide-white/10">
                <div className="flex justify-between py-4">
                  <span className="font-label-bold text-xs text-on-surface-variant/80 uppercase font-semibold">Acceleration (0-60 MPH)</span>
                  <span className="font-body-lg text-sm text-white font-medium">{car.specs?.acceleration || "N/A"}</span>
                </div>
                <div className="flex justify-between py-4">
                  <span className="font-label-bold text-xs text-on-surface-variant/80 uppercase font-semibold">Top Speed</span>
                  <span className="font-body-lg text-sm text-white font-medium">{car.specs?.topSpeed || "N/A"}</span>
                </div>
                <div className="flex justify-between py-4">
                  <span className="font-label-bold text-xs text-on-surface-variant/80 uppercase font-semibold">{t("hpLabel")}</span>
                  <span className="font-body-lg text-sm text-white font-medium">{car.horsepower ? `${car.horsepower} hp` : (car.specs?.horsepower || "N/A")}</span>
                </div>
                <div className="flex justify-between py-4">
                  <span className="font-label-bold text-xs text-on-surface-variant/80 uppercase font-semibold">{t("transLabel")}</span>
                  <span className="font-body-lg text-sm text-white font-medium">
                    {car.transmission === "Manual" || car.transmission === "Manuelle" ? t("transmissionManual") : t("transmissionAuto")}
                  </span>
                </div>
                <div className="flex justify-between py-4">
                  <span className="font-label-bold text-xs text-on-surface-variant/80 uppercase font-semibold">{t("fuelLabel")}</span>
                  <span className="font-body-lg text-sm text-white font-medium">
                    {car.fuelType === "Diesel" ? t("fuelDiesel") : (car.fuelType === "Essence" || car.fuelType === "Gasoline" ? t("fuelGasoline") : car.fuelType)}
                  </span>
                </div>
                <div className="flex justify-between py-4">
                  <span className="font-label-bold text-xs text-on-surface-variant/80 uppercase font-semibold">{t("paintLabel")}</span>
                  <span className="font-body-lg text-sm text-white font-medium">
                    {car.repaintOption === "No" || car.repaintOption === "Non" ? t("paintNo") : t("paintYes")}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Action Sidebar */}
          <div className="lg:col-span-4 lg:sticky lg:top-28 h-fit space-y-6">
            
            {/* Action Box */}
            <div className="bg-[#1e2020] p-6 border border-white/10 space-y-6 rounded-sm">
              <div className="space-y-3">
                <button 
                  className="w-full bg-primary-container hover:bg-[#b50321] transition-all py-4 font-label-bold text-xs uppercase font-bold text-white rounded-sm"
                  onClick={() => alert("Booking service coming soon!")}
                >
                  Schedule Test Drive
                </button>
                <button 
                  className="w-full border border-white/20 hover:border-white transition-all py-4 font-label-bold text-xs uppercase font-bold text-white rounded-sm"
                  onClick={() => alert("Quote request sent to showroom sales representatives!")}
                >
                  Request Quote
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 border border-white/10 hover:bg-[#282a2b] py-3 text-xs font-semibold rounded-sm transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-base">mail</span>
                  {t("contactBtn")}
                </button>
                <button className="flex items-center justify-center gap-2 border border-white/10 hover:bg-[#282a2b] py-3 text-xs font-semibold rounded-sm transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-base">chat</span>
                  {t("whatsappBtn")}
                </button>
              </div>

              <hr className="border-white/10" />

              {/* Loan Estimator */}
              <div className="space-y-6">
                <h4 className="font-label-bold text-xs text-white uppercase tracking-wider font-semibold">{t("financeEstimator")}</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-[10px] text-on-surface-variant/80 font-label-bold uppercase font-semibold">{t("downPayment")}</span>
                      <span className="text-white text-xs font-semibold">{formatPrice(downPayment, car.price)}</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max={car.price < 5000 ? Math.max(0, car.price - 10) : Math.max(0, car.price - 10000)}
                      step={car.price < 5000 ? 5 : 5000}
                      value={downPayment}
                      onChange={(e) => setDownPayment(Number(e.target.value))}
                      className="w-full h-1 bg-[#282a2b] rounded-full appearance-none cursor-pointer accent-primary-container"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-[10px] text-on-surface-variant/80 font-label-bold uppercase font-semibold">{t("termLabel")}</span>
                      <span className="text-white text-xs font-semibold">{term} {t("months")}</span>
                    </div>
                    <input 
                      type="range"
                      min="24"
                      max="84"
                      step="12"
                      value={term}
                      onChange={(e) => setTerm(Number(e.target.value))}
                      className="w-full h-1 bg-[#282a2b] rounded-full appearance-none cursor-pointer accent-primary-container"
                    />
                  </div>
                </div>

                <div className="bg-[#0c0f0f] p-4 border border-white/5 text-center rounded-sm">
                  <span className="text-[10px] text-on-surface-variant/80 font-label-bold uppercase font-semibold">{t("monthlyPaymentLabel")}</span>
                  <div className="text-primary-container font-headline-lg text-2xl font-extrabold mt-1">
                    {formatPrice(monthlyPayment, car.price)} / mo
                  </div>
                  <p className="text-[9px] text-on-surface-variant/60 mt-2">{t("calculationNote")}</p>
                </div>
              </div>
            </div>

            {/* Small Showroom Badge */}
            <div className="p-4 bg-[#1a1c1c] border border-white/5 flex items-center gap-4 rounded-sm">
              <div className="w-10 h-10 bg-[#282a2b] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary-container text-xl">verified_user</span>
              </div>
              <div>
                <p className="font-label-bold text-xs text-white font-semibold uppercase">Performance Auto Elite</p>
                <p className="text-[10px] text-on-surface-variant">Los Angeles, CA • 4.9 ★ (154 reviews)</p>
              </div>
            </div>

          </div>

        </div>

        {/* You May Also Like Section */}
        {relatedCars.length > 0 && (
          <section className="mt-24 border-t border-white/5 pt-16">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="font-headline-lg text-2xl font-bold uppercase tracking-wide">{t("relatedVehicles")}</h2>
                <div className="h-1 w-24 bg-primary-container mt-2"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedCars.map((related) => (
                <div 
                  key={related._id || related.id} 
                  onClick={() => {
                    navigate(`/vehicle/${related.slug}`);
                  }}
                  className="matte-card flex flex-col group rounded-sm cursor-pointer hover:border-[#ffb3af]/20 transition-all duration-300"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      src={getMediaUrl(related.imageCover)} 
                      alt={related.name || `${related.marke} ${related.model}`} 
                    />

                    {/* Favorite button overlay */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(related);
                      }}
                      className="absolute top-4 right-4 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-all hover:scale-110 cursor-pointer"
                    >
                      <span className={`material-symbols-outlined text-lg ${isFavorited(related._id) ? "text-red-500 fill-1" : "text-white"}`}>
                        favorite
                      </span>
                    </button>

                    {(related.availability === 'Vendu' || related.availability === 'Réservé' || related.badge || related.condition) && (
                      <div className={`absolute top-4 left-4 z-20 text-white px-3 py-1 font-label-bold text-[10px] uppercase font-bold rounded-sm shadow-md ${
                        related.availability === 'Vendu'
                          ? 'bg-[#B50321]'
                          : related.availability === 'Réservé'
                            ? 'bg-amber-600'
                            : 'bg-primary-container'
                      }`}>
                        {related.availability === 'Vendu' 
                          ? t("statusSold") 
                          : related.availability === 'Réservé' 
                            ? t("statusReserved") 
                            : (related.badge || related.condition)}
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h4 className="font-headline-md text-base font-bold text-white uppercase">
                      {related.name || `${related.marke} ${related.model} ${related.year}`}
                    </h4>
                    <p className="text-[#ffb3af] font-headline-md text-sm font-bold mt-2 flex flex-wrap items-center gap-x-2">
                      {related.finalPrice < related.price ? (
                        <>
                          <span className="line-through text-white/40 text-xs font-normal font-sans">
                            {formatPrice(related.price)}
                          </span>
                          <span>{formatPrice(related.finalPrice)}</span>
                        </>
                      ) : (
                        <span>{formatPrice(related.price)}</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Premium Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[999] bg-[#070909]/98 flex flex-col justify-between p-4 md:p-8 animate-slideDown select-none">
          {/* Top Panel */}
          <div className="flex justify-between items-center z-50">
            <span className="font-mono text-xs text-on-surface-variant/80 font-bold">
              {lightboxIndex + 1} / {mediaItems.length}
            </span>
            <button
              onClick={() => {
                setLightboxOpen(false);
                resetZoom();
              }}
              className="w-10 h-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-all duration-200"
              title="Close Gallery"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Main Viewer */}
          <div className="flex-grow flex items-center justify-center relative overflow-hidden my-4">
            {/* Prev Button */}
            <button
              onClick={handleLightboxPrev}
              className="absolute left-2 md:left-6 z-50 w-12 h-12 rounded-full border border-white/10 bg-white/5 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-all"
            >
              <span className="material-symbols-outlined text-2xl">chevron_left</span>
            </button>

            {/* Content Container */}
            <div 
              className={`w-full max-w-5xl max-h-[70vh] flex items-center justify-center overflow-hidden transition-all duration-200 ${
                zoomLevel > 1 ? "cursor-grab active:cursor-grabbing" : ""
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUpOrLeave}
            >
              {isVideo(mediaItems[lightboxIndex]) ? (
                <video 
                  className="max-w-full max-h-[70vh] object-contain pointer-events-auto" 
                  src={mediaItems[lightboxIndex]} 
                  controls 
                  autoPlay 
                  loop 
                />
              ) : (
                <img 
                  className="max-w-full max-h-[70vh] object-contain select-none pointer-events-none" 
                  src={mediaItems[lightboxIndex]} 
                  alt="Zoomable Detail" 
                  style={{
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                    transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
                  }}
                />
              )}
            </div>

            {/* Next Button */}
            <button
              onClick={handleLightboxNext}
              className="absolute right-2 md:right-6 z-50 w-12 h-12 rounded-full border border-white/10 bg-white/5 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-all"
            >
              <span className="material-symbols-outlined text-2xl">chevron_right</span>
            </button>
          </div>

          {/* Bottom Controls Bar */}
          <div className="flex flex-col items-center gap-3 z-50 pb-2">
            {!isVideo(mediaItems[lightboxIndex]) && (
              <div className="flex items-center gap-4 border border-white/10 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full">
                <button
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 1}
                  className="text-white hover:text-[#ffb3af] disabled:opacity-40 disabled:hover:text-white cursor-pointer transition-colors"
                  title="Zoom Out"
                >
                  <span className="material-symbols-outlined text-xl">zoom_out</span>
                </button>
                
                <span className="font-mono text-xs font-bold text-white px-2">
                  {zoomLevel.toFixed(1)}x
                </span>

                <button
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 4}
                  className="text-white hover:text-[#ffb3af] disabled:opacity-40 disabled:hover:text-white cursor-pointer transition-colors"
                  title="Zoom In"
                >
                  <span className="material-symbols-outlined text-xl">zoom_in</span>
                </button>

                <div className="w-px h-4 bg-white/10 mx-2" />

                <button
                  onClick={resetZoom}
                  disabled={zoomLevel === 1}
                  className="text-white hover:text-[#ffb3af] disabled:opacity-40 disabled:hover:text-white cursor-pointer transition-colors"
                  title="Reset Zoom"
                >
                  <span className="material-symbols-outlined text-xl">restart_alt</span>
                </button>
              </div>
            )}
            <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-widest text-center">
              {isVideo(mediaItems[lightboxIndex]) ? "Playing Promotional Video" : "Drag or swipe to pan when zoomed"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
