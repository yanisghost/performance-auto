import { useState, useEffect } from "react";
import { API_BASE_URL, getMediaUrl } from "../config";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [currentImageUrl, setCurrentImageUrl] = useState("");

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      const data = await response.json();
      const docs = data.data?.docs || data.data?.data || data.data || [];
      setCategories(docs);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setImageFile(null);
    setImagePreview("");
    setCurrentImageUrl("");
    setIsEditing(false);
    setEditId("");
  };

  const handleEditClick = (cat) => {
    setIsEditing(true);
    setEditId(cat._id || cat.id);
    setName(cat.name || "");
    setDescription(cat.description || "");
    setCurrentImageUrl(cat.image ? getMediaUrl(cat.image, 'category') : "");
    setImagePreview("");
    setImageFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setActionLoading(true);

    const token = localStorage.getItem("adminToken");
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      const url = isEditing 
        ? `${API_BASE_URL}/categories/${editId}` 
        : `${API_BASE_URL}/categories`;
      
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
        throw new Error(data.message || `Failed to ${isEditing ? 'update' : 'create'} category.`);
      }

      setSuccess(`Category "${name}" ${isEditing ? 'updated' : 'created'} successfully!`);
      resetForm();
      fetchCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = async (cat) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete category "${cat.name}"?`);
    if (!confirmDelete) return;

    setError("");
    setSuccess("");
    setActionLoading(true);

    const token = localStorage.getItem("adminToken");
    const catId = cat._id || cat.id;

    try {
      const response = await fetch(`${API_BASE_URL}/categories/${catId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete category.");
      }

      setSuccess(`Category "${cat.name}" deleted successfully!`);
      fetchCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[#ffb3af] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant/80">
          Loading Categories...
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
            Category Collections
          </h2>
          <p className="text-xs text-on-surface-variant/60 uppercase tracking-widest font-semibold mt-1">
            Manage showroom body style and brand collections
          </p>
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

      {/* Main Grid split: List (left) + Form Panel (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Category List */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="font-headline-md text-sm font-bold uppercase tracking-wider text-white border-b border-white/10 pb-4">
            Active Categories ({categories.length})
          </h3>
          
          {categories.length === 0 ? (
            <div className="bg-[#1a1c1c] border border-white/5 p-12 text-center text-xs text-on-surface-variant/50 rounded-sm">
              No categories configured. Create one using the form.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categories.map((cat) => (
                <div 
                  key={cat._id || cat.id}
                  className="bg-[#1a1c1c] border border-white/5 p-4 rounded-sm flex flex-col justify-between hover:border-white/10 transition-colors"
                >
                  <div className="space-y-3">
                    {/* Thumbnail */}
                    <div 
                      className="h-32 bg-cover bg-center bg-[#0c0f0f] border border-white/5 rounded-sm"
                      style={{ backgroundImage: `url('${cat.image ? getMediaUrl(cat.image, 'category') : "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=600&auto=format&fit=crop"}')` }}
                    ></div>
                    
                    <div>
                      <h4 className="font-headline-md text-sm font-bold text-white uppercase">{cat.name}</h4>
                      <p className="text-[10px] text-[#ffb3af] font-label-bold uppercase tracking-wider mt-0.5">Slug: {cat.slug}</p>
                      <p className="text-xs text-on-surface-variant/70 mt-2 line-clamp-2 leading-relaxed">
                        {cat.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-white/5">
                    <button
                      onClick={() => handleEditClick(cat)}
                      disabled={actionLoading}
                      className="p-1.5 hover:bg-[#282a2b] hover:text-[#ffb3af] rounded-sm text-on-surface-variant transition-colors"
                      title="Edit Category"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(cat)}
                      disabled={actionLoading}
                      className="p-1.5 hover:bg-[#5d3f3d]/20 hover:text-red-400 rounded-sm text-on-surface-variant transition-colors"
                      title="Delete Category"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create / Edit Form */}
        <div className="lg:col-span-5">
          <div className="bg-[#1a1c1c] border border-white/5 p-6 rounded-sm space-y-6 sticky top-28">
            <h3 className="font-headline-md text-sm font-bold uppercase tracking-wider text-white border-b border-white/10 pb-4">
              {isEditing ? "Edit Category" : "Add Collection"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] text-on-surface-variant font-label-bold uppercase tracking-wider font-semibold mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Hatchback (Citadine)"
                  className="w-full bg-[#282a2b] border border-white/10 py-3 px-4 text-xs text-on-surface outline-none focus:border-[#ffb3af]/50 rounded-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] text-on-surface-variant font-label-bold uppercase tracking-wider font-semibold mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Sleek, practical everyday vehicles designed for performance and handling..."
                  rows="4"
                  className="w-full bg-[#282a2b] border border-white/10 py-3 px-4 text-xs text-on-surface outline-none focus:border-[#ffb3af]/50 rounded-sm resize-none transition-all leading-relaxed"
                ></textarea>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-[10px] text-on-surface-variant font-label-bold uppercase tracking-wider font-semibold mb-2">
                  Category Image
                </label>
                <div className="space-y-3">
                  {/* Preview box */}
                  {(imagePreview || currentImageUrl) && (
                    <div className="relative h-40 bg-[#0c0f0f] border border-white/10 rounded-sm overflow-hidden flex items-center justify-center">
                      <img 
                        src={imagePreview || currentImageUrl} 
                        alt="Category Preview" 
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/10 border-dashed rounded-sm cursor-pointer bg-[#282a2b]/20 hover:bg-[#282a2b]/40 hover:border-[#ffb3af]/30 transition-all">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <span className="material-symbols-outlined text-on-surface-variant text-2xl mb-2">upload_file</span>
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                          Click to upload file
                        </p>
                        <p className="text-[9px] text-on-surface-variant/50 mt-1">PNG, JPG or JPEG (Max 5MB)</p>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*"
                        className="hidden" 
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-grow bg-primary-container text-white py-3 px-4 font-label-bold uppercase tracking-widest text-xs font-bold rounded-sm shadow-md hover:bg-[#b50321] active:scale-98 transition-all disabled:opacity-55 flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    isEditing ? "Update Category" : "Create Category"
                  )}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={actionLoading}
                    className="border border-white/20 text-white py-3 px-6 font-label-bold uppercase tracking-widest text-xs font-bold rounded-sm hover:bg-[#282a2b] transition-all"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
}
