import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';
import {
  FaArrowLeft, FaCloudUploadAlt, FaPlus, FaTrash,
  FaCheck, FaTag, FaBoxOpen, FaCalculator,
} from 'react-icons/fa';

const emptyItem = () => ({ name: '', price: '', description: '', quantity: '', image: { url: '', publicId: '' }, uploading: false });

export default function CreateEditCombo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: '',
    description: '',
    image: null,       // { url, publicId }
    items: [emptyItem()],
    discountPercentage: 0,
    isFeatured: false,
    isActive: true,
  });

  const [uploading, setUploading] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  // Derived totals
  const rawTotal        = form.items.reduce((s, it) => s + (parseFloat(it.price) || 0), 0);
  const discountAmt     = Math.round(rawTotal * (form.discountPercentage / 100));
  const finalPrice      = rawTotal - discountAmt;

  useEffect(() => {
    if (isEdit) {
      api.get(`/combos/admin/all`)
        .then(res => {
          const combo = res.data.data?.find(c => c._id === id);
          if (combo) {
            setForm({
              name: combo.name || '',
              description: combo.description || '',
              image: combo.image || null,
              items: combo.items?.length ? combo.items.map(i => ({
                name: i.name, price: i.price, description: i.description || '',
                quantity: i.quantity || '', image: i.image || { url: '', publicId: '' }, uploading: false
              })) : [emptyItem()],
              discountPercentage: combo.discountPercentage || 0,
              isFeatured: combo.isFeatured || false,
              isActive: combo.isActive !== false,
            });
          }
        })
        .finally(() => setFetching(false));
    }
  }, [id, isEdit]);

  const handleItemImageUpload = async (index, e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    updateItem(index, 'uploading', true);
    try {
      const data = new FormData();
      data.append('file', file);
      const res = await api.post('/upload/single', data);
      if (res.data?.url) {
        updateItem(index, 'image', { url: res.data.url, publicId: res.data.public_id || '' });
      }
    } catch {
      alert('Product image upload failed.');
    } finally {
      updateItem(index, 'uploading', false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = new FormData();
      data.append('file', file);
      const res = await api.post('/upload/single', data);
      if (res.data?.url) {
        setForm(p => ({ ...p, image: { url: res.data.url, publicId: res.data.public_id || '' } }));
      }
    } catch {
      alert('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const addItem = () => setForm(p => ({ ...p, items: [...p.items, emptyItem()] }));

  const removeItem = (i) =>
    setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));

  const updateItem = (i, field, val) =>
    setForm(p => {
      const items = [...p.items];
      items[i] = { ...items[i], [field]: val };
      return { ...p, items };
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.image?.url) return alert('Please upload a combo image.');
    if (!form.items.length) return alert('Add at least one product to the combo.');
    for (const it of form.items) {
      if (!it.name.trim()) return alert('All products must have a name.');
      if (!it.price || parseFloat(it.price) <= 0) return alert('All products must have a valid price.');
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        items: form.items.map(it => ({
          name: it.name.trim(),
          price: parseFloat(it.price),
          description: it.description?.trim() || '',
          quantity: it.quantity?.trim() || '',
          image: it.image?.url ? it.image : { url: '', publicId: '' }
        })),
        discountPercentage: Number(form.discountPercentage),
      };

      if (isEdit) {
        await api.put(`/combos/${id}`, payload);
      } else {
        await api.post('/combos', payload);
      }
      navigate('/manager/combos');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save combo');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-10 h-10 rounded-full border-4 border-blue-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 font-sans">
      {/* Header */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-blue-400 mb-6 font-bold transition-all group">
        <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
        <span>Back to Combos</span>
      </button>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title card */}
        <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl shadow-violet-500/20">
          <div className="flex items-center gap-3 mb-1">
            <FaBoxOpen className="text-2xl" />
            <h1 className="text-2xl font-black">{isEdit ? 'Edit Combo Package' : 'Create New Combo'}</h1>
          </div>
          <p className="text-violet-200 text-sm">Bundle multiple products into one attractive package deal.</p>
        </div>

        {/* ── Section 1: Basic Info ───────────────────────────────── */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-7 space-y-5">
          <h2 className="font-black text-gray-700 uppercase text-xs tracking-widest">📋 Basic Info</h2>

          {/* Combo Image */}
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-3">Combo Image *</label>
            <div className="flex gap-4 items-start">
              {form.image?.url ? (
                <div className="relative w-36 h-36 rounded-2xl overflow-hidden border-2 border-violet-200 flex-shrink-0 shadow-lg">
                  <img src={form.image.url} alt="Combo" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setForm(p => ({ ...p, image: null }))}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-lg text-xs hover:bg-red-600 transition-colors">
                    <FaTrash />
                  </button>
                </div>
              ) : (
                <label className={`w-36 h-36 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer flex-shrink-0 transition-all
                  ${uploading ? 'border-violet-400 bg-violet-50' : 'border-gray-200 hover:border-violet-400 hover:bg-violet-50'}`}>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <FaCloudUploadAlt className={`text-2xl mb-1 ${uploading ? 'text-violet-400 animate-bounce' : 'text-gray-300'}`} />
                  <span className="text-[10px] font-black uppercase text-gray-400">
                    {uploading ? 'Uploading...' : 'Upload'}
                  </span>
                </label>
              )}
              <div className="text-xs text-gray-400 mt-2 space-y-1">
                <p>• This image appears in the shop listing and cart.</p>
                <p>• Use a high-quality, square image (recommended 800×800px).</p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2">Combo Name *</label>
            <input
              value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
              className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-2 focus:ring-violet-200 outline-none transition-all font-semibold text-gray-800"
              placeholder="e.g. 'Summer Harvest Bundle'" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-2">Combo Description</label>
            <textarea
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={3}
              className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-2 focus:ring-violet-200 outline-none transition-all font-medium resize-none text-gray-800"
              placeholder="Describe what makes this combo special..." />
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer bg-yellow-50 border border-yellow-100 px-4 py-2.5 rounded-xl hover:bg-yellow-100 transition-colors">
              <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(p => ({ ...p, isFeatured: e.target.checked }))}
                className="w-4 h-4 accent-yellow-500" />
              <span className="text-sm font-bold text-yellow-700">⭐ Featured Combo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer bg-green-50 border border-green-100 px-4 py-2.5 rounded-xl hover:bg-green-100 transition-colors">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                className="w-4 h-4 accent-green-500" />
              <span className="text-sm font-bold text-green-700">✅ Active (visible to customers)</span>
            </label>
          </div>
        </div>

        {/* ── Section 2: Products Inside Combo ───────────────────── */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-gray-700 uppercase text-xs tracking-widest">📦 Products Inside Combo</h2>
            <button type="button" onClick={addItem}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors shadow-md shadow-violet-200">
              <FaPlus /> Add Product
            </button>
          </div>

          {form.items.map((item, i) => (
            <div key={i} className="relative bg-gray-50 rounded-2xl p-5 border border-gray-100 group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-widest text-violet-500">Product #{i + 1}</span>
                {form.items.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)}
                    className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all text-sm">
                    <FaTrash />
                  </button>
                )}
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                {/* Image Upload for Item */}
                <div className="flex-shrink-0">
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">Image</label>
                  {item.image?.url ? (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                      <img src={item.image.url} alt="Item" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => updateItem(i, 'image', { url: '', publicId: '' })}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-md text-[10px]">
                        <FaTrash />
                      </button>
                    </div>
                  ) : (
                    <label className={`w-20 h-20 rounded-xl border border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${item.uploading ? 'bg-violet-50 border-violet-300' : 'bg-white border-gray-300 hover:bg-gray-50'}`}>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleItemImageUpload(i, e)} />
                      <FaCloudUploadAlt className={`text-xl ${item.uploading ? 'text-violet-500 animate-bounce' : 'text-gray-400'}`} />
                    </label>
                  )}
                </div>

                {/* Other Fields */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">Name *</label>
                    <input value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} required
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-100 focus:ring-2 focus:ring-violet-200 outline-none font-semibold text-sm"
                      placeholder="Product name" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">Quantity</label>
                    <input value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-100 focus:ring-2 focus:ring-violet-200 outline-none font-medium text-sm"
                      placeholder="e.g. 1 kg / 5 pcs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">Price (৳) *</label>
                    <input type="number" min="0" value={item.price} onChange={e => updateItem(i, 'price', e.target.value)} required
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-100 focus:ring-2 focus:ring-violet-200 outline-none font-semibold text-sm"
                      placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">Description</label>
                    <input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-100 focus:ring-2 focus:ring-violet-200 outline-none font-medium text-sm"
                      placeholder="Optional details..." />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Section 3: Pricing & Discount ──────────────────────── */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-7 space-y-5">
          <h2 className="font-black text-gray-700 uppercase text-xs tracking-widest"><FaCalculator className="inline mr-1" /> Pricing & Discount</h2>

          {/* Auto-calculated total */}
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
            <p className="text-xs font-black text-gray-400 uppercase mb-3">Auto-Calculated Price Summary</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between font-semibold text-gray-600">
                <span>Sum of all products:</span>
                <span className="font-black">৳{rawTotal.toLocaleString()}</span>
              </div>
              {form.discountPercentage > 0 && (
                <div className="flex justify-between text-red-500 font-semibold">
                  <span>Discount ({form.discountPercentage}% OFF):</span>
                  <span>- ৳{discountAmt.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 flex justify-between font-black text-gray-900 text-base">
                <span>Customer Pays:</span>
                <span className="text-violet-600 text-lg">৳{finalPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Discount % slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-gray-400 uppercase"><FaTag className="inline mr-1" />Discount Percentage</label>
              <span className="bg-violet-100 text-violet-700 font-black text-sm px-3 py-1 rounded-full">
                {form.discountPercentage}% OFF
              </span>
            </div>
            <input
              type="range" min="0" max="90" step="1"
              value={form.discountPercentage}
              onChange={e => setForm(p => ({ ...p, discountPercentage: Number(e.target.value) }))}
              className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-violet-600"
            />
            <div className="flex justify-between text-[10px] text-gray-300 font-bold mt-1">
              <span>0%</span><span>30%</span><span>60%</span><span>90%</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Or enter manually:</p>
            <input
              type="number" min="0" max="90" value={form.discountPercentage}
              onChange={e => setForm(p => ({ ...p, discountPercentage: Math.min(90, Math.max(0, Number(e.target.value))) }))}
              className="mt-1 w-28 px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 font-bold text-sm outline-none focus:ring-2 focus:ring-violet-200"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-4 pb-8">
          <button type="button" onClick={() => navigate(-1)}
            className="flex-1 py-4 rounded-2xl border-2 border-gray-200 font-bold text-gray-500 hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-black shadow-lg shadow-violet-300 hover:shadow-violet-400 hover:from-violet-700 hover:to-purple-800 transition-all flex items-center justify-center gap-2">
            {loading
              ? <><div className="animate-spin w-5 h-5 rounded-full border-2 border-white border-t-transparent" /> Saving...</>
              : <><FaCheck /> {isEdit ? 'Update Combo' : 'Create Combo Package'}</>}
          </button>
        </div>
      </form>
    </div>
  );
}
