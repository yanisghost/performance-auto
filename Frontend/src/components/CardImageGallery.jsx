import { useState } from "react";
import { getMediaUrl } from "../config";
import { useTranslation } from "../context/LanguageContext";

export default function CardImageGallery({ car, isFavorited, toggleFavorite, aspectClass = "aspect-[16/10]" }) {
  const { t } = useTranslation();
  const [activeIdx, setActiveIdx] = useState(0);
  const cardImages = [car.imageCover, ...(car.images || [])].filter(Boolean);

  const handlePrev = (e) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev === 0 ? cardImages.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev === cardImages.length - 1 ? 0 : prev + 1));
  };

  const selectIdx = (e, index) => {
    e.stopPropagation();
    setActiveIdx(index);
  };

  const activeImage = cardImages[activeIdx] || car.imageCover;

  return (
    <div className={`relative ${aspectClass} overflow-hidden bg-bg-main flex items-center justify-center border-b border-border-color group/gallery`}>
      {/* Blurred background filling edge to edge */}
      <div 
        className="absolute inset-0 bg-cover bg-center blur-md opacity-40 scale-110 transition-all duration-300"
        style={{ backgroundImage: `url('${getMediaUrl(activeImage)}')` }}
      ></div>
      
      {/* Contained sharp image in front */}
      <img 
        className="relative z-10 max-w-full max-h-full object-contain p-2 transition-transform duration-500" 
        src={getMediaUrl(activeImage)} 
        alt={car.name || `${car.marke} ${car.model}`}
      />

      {/* Navigation Arrows (Visible on hover of gallery) */}
      {cardImages.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-all hover:scale-110 opacity-0 group-hover/gallery:opacity-100 cursor-pointer"
            aria-label="Previous image"
          >
            <span className="material-symbols-outlined text-sm font-bold">arrow_back_ios_new</span>
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-all hover:scale-110 opacity-0 group-hover/gallery:opacity-100 cursor-pointer"
            aria-label="Next image"
          >
            <span className="material-symbols-outlined text-sm font-bold">arrow_forward_ios</span>
          </button>
        </>
      )}

      {/* Pagination Dots (Visible on hover of gallery or active) */}
      {cardImages.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1 bg-black/30 backdrop-blur-sm py-1 px-2 rounded-full opacity-0 group-hover/gallery:opacity-100 transition-opacity duration-300">
          {cardImages.map((_, i) => (
            <button
              key={i}
              onClick={(e) => selectIdx(e, i)}
              className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${i === activeIdx ? "bg-primary scale-125" : "bg-white/40 hover:bg-white/70"}`}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Favorite button overlay */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(car);
        }}
        className="absolute top-4 right-4 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-all hover:scale-110 cursor-pointer"
      >
        <span className={`material-symbols-outlined text-lg ${isFavorited(car._id) ? "text-primary fill-1" : "text-white"}`}>
          favorite
        </span>
      </button>

      {/* Status Badge overlay */}
      {(car.availability === 'Vendu' || car.availability === 'Réservé' || car.badge) && (
        <div className={`absolute top-4 left-4 z-20 text-white px-3 py-1 font-label-bold text-[10px] uppercase font-bold tracking-wider rounded-sm shadow-md ${
          car.availability === 'Vendu'
            ? 'bg-[#B50321]'
            : car.availability === 'Réservé'
              ? 'bg-amber-600'
              : 'bg-primary'
        }`}>
          {car.availability === 'Vendu' 
            ? t("statusSold") 
            : car.availability === 'Réservé' 
              ? t("statusReserved") 
              : car.badge}
        </div>
      )}
    </div>
  );
}
