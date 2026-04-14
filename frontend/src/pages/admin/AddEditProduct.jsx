import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';
import { FaArrowLeft, FaCloudUploadAlt, FaTrash, FaCheck } from 'react-icons/fa';

const CATEGORIES = [
  { id: 'oil-ghee',       name: 'Oil & Ghee' },
  { id: 'honey',          name: 'Honey' },
  { id: 'dates',          name: 'Dates' },
  { id: 'spices',         name: 'Spices' },
  { id: 'nuts-seeds',     name: 'Nuts & Seeds' },
  { id: 'beverage',       name: 'Beverage' },
  { id: 'rice',           name: 'Rice' },
  { id: 'flours-lentils', name: 'Flours & Lentils' },
  { id: 'certified',      name: 'Certified' },
  { id: 'pickle',         name: 'Pickle' },
];

export default function AddEditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    discountPercentage: '',
    stock: '',
    unit: 'pcs',
    weightPerUnit: '',
    weightUnit: 'kg',
    isFeatured: false,
    images: [] // array of { url, public_id }
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/products/${id}`)
        .then(res => {
          if (res.data.success) {
            const p = res.data.data;
            setFormData({
              name: p.name || '',
              category: p.category || '',
              description: p.description || '',
              price: p.price || '',
              discountPercentage: p.discountPercentage || '',
              stock: p.stock || '',
              unit: p.unit || 'pcs',
              weightPerUnit: p.weightPerUnit || '',
              weightUnit: p.weightUnit || 'kg',
              isFeatured: p.isFeatured || false,
              images: p.images || []
            });
          }
        })
        .finally(() => setFetching(false));
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    const uploadedImages = [];

    for (const file of files) {
      const data = new FormData();
      data.append('file', file);
      try {
        const res = await api.post('/upload/single', data);
        if (res.data && res.data.url) {
          uploadedImages.push({ 
            url: res.data.url, 
            public_id: res.data.public_id || res.data.publicId 
          });
        }
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }

    if (uploadedImages.length > 0) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedImages]
      }));
    }
    setUploading(false);
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        unit: `${formData.weightPerUnit} ${formData.weightUnit}`.trim()
      };

      if (isEdit) {
        await api.put(`/products/${id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      navigate('/manager/my-products');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-12 text-center text-gray-500 font-bold">Loading product...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 font-sans">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6 font-bold transition-all">
        <FaArrowLeft />
        <span>Back</span>
      </button>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-[#1B2B4B] p-8 text-white">
          <h1 className="text-2xl font-bold">{isEdit ? 'Edit Product' : 'Add New Product'} 📦</h1>
          <p className="text-blue-200 text-sm mt-1">Fill in the details to list your product in the marketplace.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* Images Section */}
          <div>
            <label className="block text-sm font-bold text-gray-700 uppercase tracking-widest mb-4">Product Gallery</label>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {formData.images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm group">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => removeImage(i)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              ))}
              <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center cursor-pointer text-gray-400 gap-2">
                <input type="file" multiple className="hidden" onChange={handleImageUpload} accept="image/*" />
                <FaCloudUploadAlt size={24} className={uploading ? 'animate-bounce text-blue-500' : ''} />
                <span className="text-[10px] font-bold uppercase">{uploading ? 'Uploading...' : 'Add Photos'}</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-gray-400 uppercase mb-2">Product Name</label>
              <input 
                name="name" value={formData.name} onChange={handleChange} required
                className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all font-semibold"
                placeholder="e.g. Organic Hill Honey"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase mb-2">Category</label>
              <select 
                name="category" value={formData.category} onChange={handleChange} required
                className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all font-semibold appearance-none"
              >
                <option value="">Select Category</option>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="flex-1">
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2">Quantity Per Item</label>
                  <div className="flex gap-2">
                    <input type="number" name="weightPerUnit" value={formData.weightPerUnit} onChange={handleChange} className="w-1/2 px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 font-semibold outline-none focus:ring-2 focus:ring-blue-100" placeholder="e.g. 1" required />
                    <select name="weightUnit" value={formData.weightUnit} onChange={handleChange} className="w-1/2 px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 font-semibold outline-none focus:ring-2 focus:ring-blue-100 appearance-none">
                      <option value="kg">kg</option>
                      <option value="gm">gm</option>
                      <option value="liter">liter</option>
                      <option value="ml">ml</option>
                      <option value="pcs">pcs</option>
                      <option value="hali">hali</option>
                      <option value="dozen">dozen</option>
                      <option value="ton">ton</option>
                    </select>
                  </div>
               </div>
               <div className="flex-1">
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2">Total Stock</label>
                  <input type="number" name="stock" value={formData.stock} onChange={handleChange} className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 font-semibold outline-none focus:ring-2 focus:ring-blue-100" placeholder="0" required />
               </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase mb-2">Original Price (৳)</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} required className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 font-semibold" />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase mb-2">Discount Percentage (%) — Optional</label>
              <input type="number" min="0" max="100" name="discountPercentage" value={formData.discountPercentage} onChange={handleChange} className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 font-semibold" placeholder="e.g. 5" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-black text-gray-400 uppercase mb-2">Description</label>
              <textarea 
                name="description" value={formData.description} onChange={handleChange} rows={5}
                className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium resize-none"
                placeholder="Describe your product features, harvest details, etc."
              />
            </div>

            <div className="flex items-center gap-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
               <input type="checkbox" name="isFeatured" id ="isFeatured" checked={formData.isFeatured} onChange={handleChange} className="w-5 h-5 rounded accent-blue-600" />
               <label htmlFor="isFeatured" className="text-sm font-bold text-blue-900 cursor-pointer">Feature this product in the Spotlight 🌟</label>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex gap-4">
             <button 
                type="button" onClick={() => navigate(-1)}
                className="flex-1 py-4 rounded-2xl border border-gray-200 font-bold text-gray-500 hover:bg-gray-50 transition-all"
             >
               Cancel
             </button>
             <button 
                type="submit" disabled={loading}
                className="flex-[2] py-4 rounded-2xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 "
             >
               {loading ? 'Saving...' : <><FaCheck /> {isEdit ? 'Update Product' : 'Create Product'}</>}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
