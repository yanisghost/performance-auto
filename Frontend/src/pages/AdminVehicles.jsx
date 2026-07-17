import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { API_BASE_URL, getMediaUrl, formatPrice } from "../config";

export default function AdminVehicles() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Views state
  const [view, setView] = useState("list"); // 'list' or 'form'
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");

  // Form Field States
  const [marke, setMarke] = useState("");
  const [model, setModel] = useState("");
  const [version, setVersion] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [mileage, setMileage] = useState(0);
  const [fuelType, setFuelType] = useState("Gasoline");
  const [horsepower, setHorsepower] = useState(150);
  const [transmission, setTransmission] = useState("Automatique");
  const [color, setColor] = useState("");
  const [paint, setPaint] = useState("Non");
  const [condition, setCondition] = useState("Controlé");
  const [availability, setAvailability] = useState("Disponible");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState(1);
  const [description, setDescription] = useState("");

  // File Upload States
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [currentCoverUrl, setCurrentCoverUrl] = useState("");

  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [currentGalleryUrls, setCurrentGalleryUrls] = useState([]);

  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState("");
  const [currentVideoUrl, setCurrentVideoUrl] = useState("");

  // Search Filter
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch Vehicles & Categories
  const fetchVehicles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      const data = await response.json();
      const docs = data.data?.docs || data.data?.data || [];
      setVehicles(docs);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch vehicles.");
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      const data = await response.json();
      const docs = data.data?.docs || data.data?.data || data.data || [];
      setCategories(docs);
      if (docs.length > 0 && !category) {
        setCategory(docs[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchVehicles();
      await fetchCategories();
      setLoading(false);

      // Check url search parameter if action=add
      if (searchParams.get("action") === "add") {
        handleAddClick();
        setSearchParams({}); // Clear query param
      }
    };
    init();
  }, [searchParams]);

  // Form Resets
  const resetForm = () => {
    setMarke("");
    setModel("");
    setVersion("");
    setYear(new Date().getFullYear());
    setMileage(0);
    setFuelType("Gasoline");
    setHorsepower(150);
    setTransmission("Automatique");
    setColor("");
    setPaint("Non");
    setCondition("Controlé");
    setAvailability("Disponible");
    setPrice("");
    setDiscountPrice("");
    setCostPrice("");
    if (categories.length > 0) {
      setCategory(categories[0]._id);
    } else {
      setCategory("");
    }
    setStock(1);
    setDescription("");

    // Files
    setCoverFile(null);
    setCoverPreview("");
    setCurrentCoverUrl("");
    setGalleryFiles([]);
    setGalleryPreviews([]);
    setCurrentGalleryUrls([]);
    setVideoFile(null);
    setVideoPreview("");
    setCurrentVideoUrl("");

    setIsEditing(false);
    setEditId("");
  };

  const handleAddClick = () => {
    resetForm();
    setIsEditing(false);
    setView("form");
  };

  const handleEditClick = (car) => {
    resetForm();
    setIsEditing(true);
    setEditId(car._id || car.id);
    setMarke(car.marke || "");
    setModel(car.model || "");
    setVersion(car.version || "");
    setYear(car.year || new Date().getFullYear());
    setMileage(car.mileage || 0);
    setFuelType(car.fuelType || "Gasoline");
    setHorsepower(car.horsepower || 150);
    setTransmission(car.transmission || "Automatique");
    setColor(car.color || "");
    setPaint(car.paint || "Non");
    setCondition(car.condition || "Controlé");
    setAvailability(car.availability || "Disponible");
    setPrice(car.price || "");
    const activeDiscount = car.discounts?.find(d => d.active && !d.requiresCode);
    setDiscountPrice(activeDiscount ? activeDiscount.discountPrice : "");
    setCostPrice(car.costPrice || "");
    setCategory(car.category?._id || car.category || "");
    setStock(car.stock || 1);
    setDescription(car.description || "");

    // Existing media
    setCurrentCoverUrl(car.imageCover ? getMediaUrl(car.imageCover) : "");
    setCurrentGalleryUrls(car.images ? car.images.map(img => getMediaUrl(img)) : []);
    setCurrentVideoUrl(car.video ? getMediaUrl(car.video, 'video') : "");

    setView("form");
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setGalleryFiles([...galleryFiles, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setGalleryPreviews([...galleryPreviews, ...newPreviews]);
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const removeGalleryFile = (index, type = "new") => {
    if (type === "new") {
      const updatedFiles = galleryFiles.filter((_, i) => i !== index);
      const updatedPreviews = galleryPreviews.filter((_, i) => i !== index);
      setGalleryFiles(updatedFiles);
      setGalleryPreviews(updatedPreviews);
    } else {
      const updatedUrls = currentGalleryUrls.filter((_, i) => i !== index);
      setCurrentGalleryUrls(updatedUrls);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setActionLoading(true);

    const token = localStorage.getItem("adminToken");
    const formData = new FormData();
    formData.append("marke", marke);
    formData.append("model", model);
    formData.append("version", version);
    formData.append("year", year);
    formData.append("mileage", mileage);
    formData.append("fuelType", fuelType);
    formData.append("horsepower", horsepower);
    formData.append("transmission", transmission);
    formData.append("color", color);
    formData.append("paint", paint);
    formData.append("condition", condition);
    formData.append("availability", availability);
    formData.append("price", price);
    formData.append("costPrice", costPrice);

    // Validation: check if discountPrice is valid
    if (discountPrice !== "" && discountPrice !== null && discountPrice !== undefined) {
      const dPrice = Number(discountPrice);
      if (isNaN(dPrice) || dPrice <= 0) {
        setError("Discounted price must be a valid positive number.");
        setActionLoading(false);
        return;
      }
      if (dPrice >= Number(price)) {
        setError("Discounted price must be strictly less than the regular price.");
        setActionLoading(false);
        return;
      }
      formData.append("discounts", JSON.stringify([{
        discountPrice: dPrice,
        requiresCode: false,
        active: true
      }]));
    } else {
      formData.append("discounts", JSON.stringify([]));
    }
    formData.append("category", category);
    formData.append("stock", stock);
    formData.append("description", description);

    // Media
    if (coverFile) {
      formData.append("imageCover", coverFile);
    }
    if (galleryFiles.length > 0) {
      galleryFiles.forEach(file => {
        formData.append("images", file);
      });
    }
    if (videoFile) {
      formData.append("video", videoFile);
    }

    // If editing, we also want to send the server-retained list of files
    if (isEditing) {
      const retainedImages = currentGalleryUrls.map(url => {
        const parts = url.split("/");
        return `server:${parts[parts.length - 1]}`;
      });
      // Append order structure to backend
      const order = [];
      if (coverFile) {
        order.push("file:imageCover:0");
      } else if (currentCoverUrl) {
        const parts = currentCoverUrl.split("/");
        order.push(`server:${parts[parts.length - 1]}`);
      }
      retainedImages.forEach(img => order.push(img));
      galleryFiles.forEach((_, idx) => order.push(`fileIndex:${idx}`));
      
      formData.append("imageOrder", JSON.stringify(order));
    }

    try {
      const url = isEditing 
        ? `${API_BASE_URL}/products/${editId}` 
        : `${API_BASE_URL}/products`;
      
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to ${isEditing ? 'update' : 'create'} listing.`);
      }

      setSuccess(`Listing for "${marke} ${model}" ${isEditing ? 'updated' : 'created'} successfully!`);
      setView("list");
      resetForm();
      fetchVehicles();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = async (car) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete listing: ${car.name || `${car.marke} ${car.model}`}?`);
    if (!confirmDelete) return;

    setError("");
    setSuccess("");
    setActionLoading(true);

    const token = localStorage.getItem("adminToken");
    const carId = car._id || car.id;

    try {
      const response = await fetch(`${API_BASE_URL}/products/${carId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete listing.");
      }

      setSuccess(`Listing deleted successfully!`);
      fetchVehicles();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter listings by search keyword
  const filteredVehicles = vehicles.filter(car => {
    const label = `${car.marke} ${car.model} ${car.color} ${car.condition} ${car.fuelType} ${car.transmission}`.toLowerCase();
    return label.includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[#ffb3af] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant/80">
          Loading Inventory...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display-lg text-2xl uppercase tracking-wider font-extrabold text-white">
            Vehicle Catalog
          </h2>
          <p className="text-xs text-on-surface-variant/60 uppercase tracking-widest font-semibold mt-1">
            Create, modify, and review vehicle collections
          </p>
        </div>
        <div>
          {view === "list" ? (
            <button
              onClick={handleAddClick}
              className="bg-primary-container text-white py-3 px-6 font-label-bold uppercase tracking-widest text-xs font-bold rounded-sm shadow-md hover:bg-[#b50321] active:scale-98 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              Add Listing
            </button>
          ) : (
            <button
              onClick={() => setView("list")}
              className="border border-white/20 text-white py-3 px-6 font-label-bold uppercase tracking-widest text-xs font-bold rounded-sm hover:bg-[#282a2b] transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Back to Catalog
            </button>
          )}
        </div>
      </div>

      {(error || success) && (
        <div className="space-y-3">
          {error && (
            <div className="bg-[#5d3f3d]/20 border border-[#ae8885] text-[#ffb3af] px-4 py-3 text-xs rounded-sm flex items-start gap-2 animate-fadeIn">
              <span className="material-symbols-outlined text-sm flex-shrink-0 mt-0.5">error</span>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="bg-primary-container/10 border border-primary-container/20 text-[#ffb3af] px-4 py-3 text-xs rounded-sm flex items-start gap-2 animate-fadeIn">
              <span className="material-symbols-outlined text-sm flex-shrink-0 mt-0.5">check_circle</span>
              <span>{success}</span>
            </div>
          )}
        </div>
      )}

      {/* -------------------- LIST VIEW -------------------- */}
      {view === "list" && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-[#1a1c1c] border border-white/5 p-4 rounded-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search catalog by make, model, specs..."
                className="w-full bg-[#282a2b] border border-white/10 py-2.5 pl-3 pr-10 text-xs text-on-surface placeholder:text-on-surface-variant/40 outline-none rounded-sm"
              />
              <span className="material-symbols-outlined absolute right-3 top-3 text-sm text-on-surface-variant">search</span>
            </div>
            <div className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
              Showing {filteredVehicles.length} of {vehicles.length} listings
            </div>
          </div>

          {filteredVehicles.length === 0 ? (
            <div className="bg-[#1a1c1c] border border-white/5 p-12 text-center text-xs text-on-surface-variant/50 rounded-sm">
              No vehicles match your query. Add a new listing or clear filters.
            </div>
          ) : (
            <div className="bg-[#1a1c1c] border border-white/5 rounded-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-on-surface-variant font-label-bold uppercase tracking-wider text-[10px]">
                      <th className="p-4">Car Details</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Stock</th>
                      <th className="p-4">Price (DZD Scale)</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredVehicles.map((car) => (
                      <tr key={car._id || car.id} className="hover:bg-[#282a2b]/25 transition-colors">
                        
                        {/* Car detail cell */}
                        <td className="p-4 flex items-center gap-4">
                          <div 
                            className="w-16 h-12 bg-cover bg-center rounded-sm bg-[#0c0f0f] border border-white/5 flex-shrink-0"
                            style={{ backgroundImage: `url('${car.imageCover ? getMediaUrl(car.imageCover) : ""}')` }}
                          ></div>
                          <div>
                            <h4 className="font-bold text-white uppercase text-xs">{car.name || `${car.marke} ${car.model}`}</h4>
                            <p className="text-[9px] text-on-surface-variant/75 uppercase tracking-wider mt-0.5">
                              {car.year} • {car.transmission} • {car.fuelType} • {car.horsepower} hp
                            </p>
                          </div>
                        </td>

                        {/* Category cell */}
                        <td className="p-4 font-semibold text-white uppercase tracking-wider text-[10px]">
                          {car.category?.name || "N/A"}
                        </td>

                        {/* Status cell */}
                        <td className="p-4 font-semibold">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-bold ${
                            car.availability === 'Vendu' 
                              ? 'bg-red-950/40 text-red-400 border border-red-800/30' 
                              : car.availability === 'Réservé'
                                ? 'bg-amber-950/40 text-amber-400 border border-amber-800/30'
                                : 'bg-green-950/40 text-green-400 border border-green-800/30'
                          }`}>
                            {car.availability || 'Disponible'}
                          </span>
                        </td>

                        {/* Stock cell */}
                        <td className="p-4 font-semibold text-white">
                          {car.stock} unit{car.stock > 1 ? 's' : ''}
                        </td>

                        {/* Price cell */}
                        <td className="p-4 font-bold font-headline-md">
                          {car.finalPrice < car.price ? (
                            <div className="flex flex-col">
                              <span className="text-[#ffb3af]">{formatPrice(car.finalPrice)}</span>
                              <span className="line-through text-on-surface-variant/40 text-[10px] font-normal font-sans">
                                {formatPrice(car.price)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[#ffb3af]">{formatPrice(car.price)}</span>
                          )}
                        </td>

                        {/* Actions cell */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditClick(car)}
                              disabled={actionLoading}
                              className="p-1.5 hover:bg-[#282a2b] hover:text-[#ffb3af] rounded-sm text-on-surface-variant transition-colors"
                              title="Edit Listing"
                            >
                              <span className="material-symbols-outlined text-base">edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteClick(car)}
                              disabled={actionLoading}
                              className="p-1.5 hover:bg-[#5d3f3d]/20 hover:text-red-400 rounded-sm text-on-surface-variant transition-colors"
                              title="Delete Listing"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------- FORM VIEW -------------------- */}
      {view === "form" && (
        <form onSubmit={handleSubmit} className="bg-[#1a1c1c] border border-white/5 p-6 md:p-8 rounded-sm space-y-8">
          
          <div className="border-b border-white/10 pb-4">
            <h3 className="font-headline-md text-sm font-bold uppercase tracking-wider text-white">
              {isEditing ? `Edit Listing Specifications: ${marke} ${model}` : "Register New Vehicle Specifications"}
            </h3>
            <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-widest mt-1">
              Provide detail parameters matching Mongoose validation constraints
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Make */}
            <div>
              <label className="block text-[10px] text-on-surface-variant font-label-bold uppercase tracking-wider font-semibold mb-2">
                Brand / Manufacturer (Marke)
              </label>
              <input
                type="text"
                required
                value={marke}
                onChange={(e) => setMarke(e.target.value)}
                placeholder="e.g. Porsche"
                className="w-full bg-[#282a2b] border border-white/10 py-3 px-4 text-xs text-on-surface outline-none focus:border-[#ffb3af]/50 rounded-sm transition-all"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-[10px] text-on-surface-variant font-label-bold uppercase tracking-wider font-semibold mb-2">
                Model
              </label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. 911 GT3 RS"
                className="w-full bg-[#282a2b] border border-white/10 py-3 px-4 text-xs text-on-surface outline-none focus:border-[#ffb3af]/50 rounded-sm transition-all"
              />
            </div>

            {/* Version */}
            <div>
              <label className="block text-[10px] text-on-surface-variant font-label-bold uppercase tracking-wider font-semibold mb-2">
                Version / Trim (Optional)
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g. PDK 4.0L"
                className="w-full bg-[#282a2b] border border-white/10 py-3 px-4 text-xs text-on-surface outline-none focus:border-[#ffb3af]/50 rounded-sm transition-all"
              />
            </div>

            {/* Year */}
            <div>
              <label className="block text-[10px] text-on-surface-variant font-label-bold uppercase tracking-wider font-semibold mb-2">
                Year of Manufacture
              </label>
              <input
                type="number"
                required
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full bg-[#282a2b] border border-white/10 py-3 px-4 text-xs text-on-surface outline-none focus:border-[#ffb3af]/50 rounded-sm transition-all"
              />
            </div>

            {/* Mileage */}
            <div>
              <label className="block text-[10px] text-on-surface-variant font-label-bold uppercase tracking-wider font-semibold mb-2">
                Mileage (kilometrage)
              </label>
              <input
                type="number"
                required
                value={mileage}
                onChange={(e) => setMileage(Number(e.target.value))}
                className="w-full bg-[#282a2b] border border-white/10 py-3 px-4 text-xs text-on-surface outline-none focus:border-[#ffb3af]/50 rounded-sm transition-all"
              />
            </div>

            {/* Horsepower */}
            <div>
              <label className="block text-[10px] text-on-surface-variant font-label-bold uppercase tracking-wider font-semibold mb-2">
                Horsepower (HP)
              </label>
              <input
                type="number"
                required
                value={horsepower}
                onChange={(e) => setHorsepower(Number(e.target.value))}
                className="w-full bg-[#282a2b] border border-white/10 py-3 px-4 text-xs text-on-surface outline-none focus:border-[#ffb3af]/50 rounded-sm transition-all"
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-[10px] text-on-surface-variant font-label-bold uppercase tracking-wider font-semibold mb-2">
                Color (Couleur)
              </label>
              <input
                type="text"
                required
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Crayon Gray"
                className="w-full bg-[#282a2b] border border-white/10 py-3 px-4 text-xs text-on-surface outline-none focus:border-[#ffb3af]/50 rounded-sm transition-all"
              />
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="block text-[10px] text-on-surface-variant font-label-bold uppercase tracking-wider font-semibold mb-2">
                Collection Category
              </label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#282a2b] border border-white/10 py-3 px-4 text-xs text-on-surface outline-none focus:border-[#ffb3af]/50 rounded-sm cursor-pointer"
              >
                {categories.length === 0 ? (
                  <option value="">No categories available</option>
                ) : (
                  categories.map(cat => (
                    <option key={cat._id || cat.id} value={cat._id || cat.id} className="bg-[#1E1E1E]">
                      {cat.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Stock */}
            <div>
              <label className="block text-[10px] text-on-surface-variant font-label-bold uppercase tracking-wider font-semibold mb-2">
                Stock Quantity
              </label>
              <input
                type="number"
                required
                min="0"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full bg-[#282a2b] border border-white/10 py-3 px-4 text-xs text-on-surface outline-none focus:border-[#ffb3af]/50 rounded-sm transition-all"
              />
            </div>

            {/* Fuel Type */}
            <div>
              <label className="block text-[10px] text-on-surface-variant font-label-bold uppercase tracking-wider font-semibold mb-2">
                Fuel Type
              </label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="w-full bg-[#282a2b] border border-white/10 py-3 px-4 text-xs text-on-surface outline-none focus:border-[#ffb3af]/50 rounded-sm cursor-pointer"
              >
                <option value="Gasoline" className="bg-[#1E1E1E]">Gasoline</option>
                <option value="Diesel" className="bg-[#1E1E1E]">Diesel</option>
                <option value="Electric" className="bg-[#1E1E1E]">Electric</option>
                <option value="Hybrid" className="bg-[#1E1E1E]">Hybrid</option>
              </select>
            </div>

            {/* Transmission */}
            <div>
              <label className="block text-[10px] text-on-surface-variant font-label-bold uppercase tracking-wider font-semibold mb-2">
                Transmission
              </label>
              <select
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
                className="w-full bg-[#282a2b] border border-white/10 py-3 px-4 text-xs text-on-surface outline-none focus:border-[#ffb3af]/50 rounded-sm cursor-pointer"
              >
                <option value="Automatique" className="bg-[#1E1E1E]">Automatique</option>
                <option value="Manuelle" className="bg-[#1E1E1E]">Manuelle</option>
              </select>
            </div>

            {/* Paint Re-painted */}
            <div>
              <label className="block text-[10px] text-on-surface-variant font-label-bold uppercase tracking-wider font-semibold mb-2">
                Re-painted (Raccord)
              </label>
              <select
                value={paint}
                onChange={(e) => setPaint(e.target.value)}
                className="w-full bg-[#282a2b] border border-white/10 py-3 px-4 text-xs text-on-surface outline-none focus:border-[#ffb3af]/50 rounded-sm cursor-pointer"
              >
                <option value="Non" className="bg-[#1E1E1E]">Non (Origin)</option>
                <option value="Oui" className="bg-[#1E1E1E]">Oui (Repainted)</option>
              </select>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-[10px] text-on-surface-variant font-label-bold uppercase tracking-wider font-semibold mb-2">
                Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full bg-[#282a2b] border border-white/10 py-3 px-4 text-xs text-on-surface outline-none focus:border-[#ffb3af]/50 rounded-sm cursor-pointer"
              >
                <option value="Controlé" className="bg-[#1E1E1E]">Controlé</option>
                <option value="Neuf" className="bg-[#1E1E1E]">Neuf (Brand New)</option>
                <option value="Occasion" className="bg-[#1E1E1E]">Occasion (Pre-Owned)</option>
                <option value="Endommagé" className="bg-[#1E1E1E]">Endommagé</option>
              </select>
            </div>

            {/* Availability Status */}
            <div>
              <label className="block text-[10px] text-on-surface-variant font-label-bold uppercase tracking-wider font-semibold mb-2">
                Availability Status
              </label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full bg-[#282a2b] border border-white/10 py-3 px-4 text-xs text-on-surface outline-none focus:border-[#ffb3af]/50 rounded-sm cursor-pointer"
              >
                <option value="Disponible" className="bg-[#1E1E1E]">Disponible (Available)</option>
                <option value="Vendu" className="bg-[#1E1E1E]">Vendu (Sold)</option>
                <option value="Réservé" className="bg-[#1E1E1E]">Réservé (Reserved)</option>
              </select>
            </div>

            {/* Regular Selling Price */}
            <div>
              <label className="block text-[10px] text-[#ffb3af] font-label-bold uppercase tracking-wider font-semibold mb-2">
                Regular Price (DZD Scale, e.g. 820 or 1020)
              </label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 820 (meaning 820 Millions)"
                className="w-full bg-[#282a2b] border border-[#ffb3af]/25 py-3 px-4 text-xs text-on-surface outline-none focus:border-[#ffb3af] rounded-sm transition-all"
              />
            </div>

            {/* Discounted Price */}
            <div>
              <label className="block text-[10px] text-green-400 font-label-bold uppercase tracking-wider font-semibold mb-2">
                Discounted Price (Optional, DZD Scale, e.g. 780)
              </label>
              <input
                type="number"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                placeholder="Leave blank if no discount"
                className="w-full bg-[#282a2b] border border-green-500/25 py-3 px-4 text-xs text-on-surface outline-none focus:border-green-500 rounded-sm transition-all"
              />
            </div>

            {/* Purchase Cost Price */}
            <div>
              <label className="block text-[10px] text-on-surface-variant font-label-bold uppercase tracking-wider font-semibold mb-2">
                Cost Price (DZD Scale, e.g. 700)
              </label>
              <input
                type="number"
                required
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="e.g. 700"
                className="w-full bg-[#282a2b] border border-white/10 py-3 px-4 text-xs text-on-surface outline-none focus:border-[#ffb3af]/50 rounded-sm transition-all"
              />
            </div>

          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] text-on-surface-variant font-label-bold uppercase tracking-wider font-semibold mb-2">
              Vehicle Description / Selling Narrative
            </label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a comprehensive spec summary and vehicle history review..."
              rows="5"
              className="w-full bg-[#282a2b] border border-white/10 py-3.5 px-4 text-xs text-on-surface outline-none focus:border-[#ffb3af]/50 rounded-sm resize-none transition-all leading-relaxed"
            ></textarea>
          </div>

          {/* MEDIA UPLOADS PANEL */}
          <div className="border-t border-white/10 pt-8 space-y-6">
            
            <div className="pb-2">
              <h4 className="font-headline-md text-sm font-bold uppercase tracking-wider text-white">
                Vehicle Media Management
              </h4>
              <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-widest mt-1">
                Upload image assets and a promotional video
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Cover Image Upload */}
              <div className="space-y-3">
                <label className="block text-[10px] text-on-surface-variant font-label-bold uppercase tracking-wider font-semibold">
                  Cover Image (Required)
                </label>
                
                {(coverPreview || currentCoverUrl) && (
                  <div className="relative h-44 bg-[#0c0f0f] border border-white/10 rounded-sm overflow-hidden flex items-center justify-center">
                    <img 
                      src={coverPreview || currentCoverUrl} 
                      alt="Cover Preview" 
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}

                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/10 border-dashed rounded-sm cursor-pointer bg-[#282a2b]/20 hover:bg-[#282a2b]/40 hover:border-[#ffb3af]/30 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <span className="material-symbols-outlined text-on-surface-variant text-xl mb-2">image</span>
                      <p className="text-[9px] text-on-surface-variant uppercase tracking-wider font-semibold">
                        Select Cover file
                      </p>
                      <p className="text-[8px] text-on-surface-variant/50 mt-1">PNG, JPG or JPEG (Max 10MB)</p>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden" 
                      onChange={handleCoverChange}
                    />
                  </label>
                </div>
              </div>

              {/* Gallery Images Upload */}
              <div className="space-y-3">
                <label className="block text-[10px] text-on-surface-variant font-label-bold uppercase tracking-wider font-semibold">
                  Gallery Images
                </label>
                
                {/* Previews grid */}
                {(galleryPreviews.length > 0 || currentGalleryUrls.length > 0) && (
                  <div className="grid grid-cols-4 gap-2 bg-[#0c0f0f] border border-white/10 p-2 rounded-sm h-44 overflow-y-auto align-content-start">
                    
                    {/* Retained server images */}
                    {currentGalleryUrls.map((url, index) => (
                      <div key={`server-${index}`} className="relative aspect-square border border-white/10 rounded-sm overflow-hidden flex items-center justify-center group bg-[#1E1E1E]">
                        <img src={url} alt="Server Gallery" className="max-h-full max-w-full object-contain" />
                        <button
                          type="button"
                          onClick={() => removeGalleryFile(index, "server")}
                          className="absolute inset-0 bg-red-950/80 items-center justify-center text-white hidden group-hover:flex transition-opacity"
                        >
                          <span className="material-symbols-outlined text-xs">delete</span>
                        </button>
                      </div>
                    ))}

                    {/* New loaded images */}
                    {galleryPreviews.map((url, index) => (
                      <div key={`new-${index}`} className="relative aspect-square border border-[#ffb3af]/20 rounded-sm overflow-hidden flex items-center justify-center group bg-[#1E1E1E]">
                        <img src={url} alt="New Gallery" className="max-h-full max-w-full object-contain" />
                        <button
                          type="button"
                          onClick={() => removeGalleryFile(index, "new")}
                          className="absolute inset-0 bg-red-950/80 items-center justify-center text-white hidden group-hover:flex transition-opacity"
                        >
                          <span className="material-symbols-outlined text-xs">delete</span>
                        </button>
                      </div>
                    ))}

                  </div>
                )}

                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/10 border-dashed rounded-sm cursor-pointer bg-[#282a2b]/20 hover:bg-[#282a2b]/40 hover:border-[#ffb3af]/30 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <span className="material-symbols-outlined text-on-surface-variant text-xl mb-2">collections</span>
                      <p className="text-[9px] text-on-surface-variant uppercase tracking-wider font-semibold">
                        Add Gallery files
                      </p>
                      <p className="text-[8px] text-on-surface-variant/50 mt-1">Multi-file select supported</p>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*"
                      multiple
                      className="hidden" 
                      onChange={handleGalleryChange}
                    />
                  </label>
                </div>
              </div>

              {/* Video Upload */}
              <div className="space-y-3">
                <label className="block text-[10px] text-on-surface-variant font-label-bold uppercase tracking-wider font-semibold">
                  Promotional Video
                </label>
                
                {(videoPreview || currentVideoUrl) && (
                  <div className="relative h-44 bg-[#0c0f0f] border border-white/10 rounded-sm overflow-hidden flex items-center justify-center">
                    <video 
                      src={videoPreview || currentVideoUrl} 
                      className="max-h-full max-w-full"
                      controls
                    />
                  </div>
                )}

                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/10 border-dashed rounded-sm cursor-pointer bg-[#282a2b]/20 hover:bg-[#282a2b]/40 hover:border-[#ffb3af]/30 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <span className="material-symbols-outlined text-on-surface-variant text-xl mb-2">videocam</span>
                      <p className="text-[9px] text-on-surface-variant uppercase tracking-wider font-semibold">
                        Select Video file
                      </p>
                      <p className="text-[8px] text-on-surface-variant/50 mt-1">MP4, WEBM or MOV (Max 50MB)</p>
                    </div>
                    <input 
                      type="file" 
                      accept="video/*"
                      className="hidden" 
                      onChange={handleVideoChange}
                    />
                  </label>
                </div>
              </div>

            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-6 border-t border-white/10">
            <button
              type="submit"
              disabled={actionLoading}
              className="bg-primary-container text-white py-3.5 px-8 font-label-bold uppercase tracking-widest text-xs font-bold rounded-sm shadow-md hover:bg-[#b50321] active:scale-98 transition-all disabled:opacity-55 flex items-center justify-center gap-2"
            >
              {actionLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting Listing Specs...
                </>
              ) : (
                isEditing ? "Update Listing Specs" : "Register Listing Specs"
              )}
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              disabled={actionLoading}
              className="border border-white/20 text-white py-3.5 px-8 font-label-bold uppercase tracking-widest text-xs font-bold rounded-sm hover:bg-[#282a2b] transition-all"
            >
              Cancel
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
