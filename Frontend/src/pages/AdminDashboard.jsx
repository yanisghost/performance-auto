import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL, formatPrice } from "../config";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const headers = {
          "Authorization": `Bearer ${token}`
        };

        // Fetch products
        const productsResponse = await fetch(`${API_BASE_URL}/products`, { headers });
        const productsData = await productsResponse.json();
        const docs = productsData.data?.docs || productsData.data?.data || [];
        setVehicles(docs);

        // Fetch categories
        const categoriesResponse = await fetch(`${API_BASE_URL}/categories`, { headers });
        const categoriesData = await categoriesResponse.json();
        const catDocs = categoriesData.data?.docs || categoriesData.data?.data || categoriesData.data || [];
        setCategories(catDocs);

      } catch (err) {
        console.error("Error loading dashboard data:", err.message);
        setError("Could not load dashboard statistics. Please ensure the backend is running.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Compute stats
  const totalModelsCount = vehicles.length;
  const totalStock = vehicles.reduce((sum, car) => sum + (car.stock || 0), 0);
  const totalCategoriesCount = categories.length;
  
  // Inventory Value (Algerian scale format dynamically supported by formatPrice!)
  const totalValue = vehicles.reduce((sum, car) => sum + ((car.price || 0) * (car.stock || 1)), 0);

  // Group by brand (make)
  const brandCounts = vehicles.reduce((acc, car) => {
    acc[car.marke] = (acc[car.marke] || 0) + 1;
    return acc;
  }, {});

  const sortedBrands = Object.entries(brandCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[#ffb3af] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant/80">
          Gathering Statistics...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h2 className="font-display-lg text-2xl uppercase tracking-wider font-extrabold text-white">
          Overview Dashboard
        </h2>
        <p className="text-xs text-on-surface-variant/60 uppercase tracking-widest font-semibold mt-1">
          Welcome to the Performance Auto Management Interface
        </p>
      </div>

      {error && (
        <div className="bg-[#5d3f3d]/20 border border-[#ae8885] text-[#ffb3af] px-4 py-3 text-xs rounded-sm mb-6 flex items-start gap-2">
          <span className="material-symbols-outlined text-sm flex-shrink-0 mt-0.5">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1 */}
        <div className="bg-[#1a1c1c] border border-white/5 p-6 rounded-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-on-surface-variant/60 font-label-bold uppercase tracking-wider font-semibold block mb-1">
              Vehicle Models
            </span>
            <span className="font-display-lg text-3xl font-extrabold text-white">
              {totalModelsCount}
            </span>
          </div>
          <div className="w-12 h-12 bg-primary-container/10 border border-primary-container/20 rounded-sm flex items-center justify-center">
            <span className="material-symbols-outlined text-primary-container text-2xl">directions_car</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#1a1c1c] border border-white/5 p-6 rounded-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-on-surface-variant/60 font-label-bold uppercase tracking-wider font-semibold block mb-1">
              Total Stock Count
            </span>
            <span className="font-display-lg text-3xl font-extrabold text-white">
              {totalStock}
            </span>
          </div>
          <div className="w-12 h-12 bg-primary-container/10 border border-primary-container/20 rounded-sm flex items-center justify-center">
            <span className="material-symbols-outlined text-primary-container text-2xl">inventory_2</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#1a1c1c] border border-white/5 p-6 rounded-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-on-surface-variant/60 font-label-bold uppercase tracking-wider font-semibold block mb-1">
              Collections
            </span>
            <span className="font-display-lg text-3xl font-extrabold text-white">
              {totalCategoriesCount}
            </span>
          </div>
          <div className="w-12 h-12 bg-[#ffb3af]/10 border border-[#ffb3af]/20 rounded-sm flex items-center justify-center">
            <span className="material-symbols-outlined text-[#ffb3af] text-2xl">category</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-[#1a1c1c] border border-white/5 p-6 rounded-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-on-surface-variant/60 font-label-bold uppercase tracking-wider font-semibold block mb-1">
              Inventory Value
            </span>
            <span className="font-display-lg text-xl font-extrabold text-[#ffb3af] block mt-1.5 truncate">
              {formatPrice(totalValue)}
            </span>
          </div>
          <div className="w-12 h-12 bg-[#ffb3af]/10 border border-[#ffb3af]/20 rounded-sm flex items-center justify-center">
            <span className="material-symbols-outlined text-[#ffb3af] text-2xl">database</span>
          </div>
        </div>

      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Panel 1: Quick Actions */}
        <div className="bg-[#1a1c1c] border border-white/5 p-6 rounded-sm space-y-6">
          <h3 className="font-headline-md text-sm font-bold uppercase tracking-wider text-white border-b border-white/10 pb-4">
            Quick Operations
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link 
              to="/admin/vehicles?action=add"
              className="flex items-center gap-4 bg-[#282a2b] border border-white/5 hover:border-[#ffb3af]/30 hover:bg-[#333535] p-4 rounded-sm transition-all"
            >
              <div className="w-10 h-10 bg-primary-container/20 rounded-sm flex items-center justify-center">
                <span className="material-symbols-outlined text-primary-container text-lg">add_circle</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase">Add Vehicle</h4>
                <p className="text-[9px] text-on-surface-variant/70 mt-0.5">Create a new listing</p>
              </div>
            </Link>

            <Link 
              to="/admin/categories?action=add"
              className="flex items-center gap-4 bg-[#282a2b] border border-white/5 hover:border-[#ffb3af]/30 hover:bg-[#333535] p-4 rounded-sm transition-all"
            >
              <div className="w-10 h-10 bg-[#ffb3af]/20 rounded-sm flex items-center justify-center">
                <span className="material-symbols-outlined text-[#ffb3af] text-lg">create_new_folder</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase">Add Category</h4>
                <p className="text-[9px] text-on-surface-variant/70 mt-0.5">Create a brand collection</p>
              </div>
            </Link>

            <Link 
              to="/admin/vehicles"
              className="flex items-center gap-4 bg-[#282a2b] border border-white/5 hover:border-[#ffb3af]/30 hover:bg-[#333535] p-4 rounded-sm transition-all"
            >
              <div className="w-10 h-10 bg-white/10 rounded-sm flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-lg">list_alt</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase">Manage Listings</h4>
                <p className="text-[9px] text-on-surface-variant/70 mt-0.5">Search, edit, & delete cars</p>
              </div>
            </Link>

            <Link 
              to="/admin/categories"
              className="flex items-center gap-4 bg-[#282a2b] border border-white/5 hover:border-[#ffb3af]/30 hover:bg-[#333535] p-4 rounded-sm transition-all"
            >
              <div className="w-10 h-10 bg-white/10 rounded-sm flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-lg">grid_view</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase">Manage Categories</h4>
                <p className="text-[9px] text-on-surface-variant/70 mt-0.5">Update layout collections</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Panel 2: Brand Distribution */}
        <div className="bg-[#1a1c1c] border border-white/5 p-6 rounded-sm space-y-6">
          <h3 className="font-headline-md text-sm font-bold uppercase tracking-wider text-white border-b border-white/10 pb-4">
            Brand Distribution
          </h3>
          {sortedBrands.length === 0 ? (
            <div className="text-center py-10 text-xs text-on-surface-variant/50">
              No vehicles available in inventory.
            </div>
          ) : (
            <div className="space-y-4">
              {sortedBrands.map(([brand, count]) => {
                const percent = totalModelsCount > 0 ? (count / totalModelsCount) * 100 : 0;
                return (
                  <div key={brand} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-white">
                      <span>{brand}</span>
                      <span className="text-[#ffb3af]">{count} Listings ({Math.round(percent)}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#282a2b] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary-container rounded-full" 
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
