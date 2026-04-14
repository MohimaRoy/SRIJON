import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { FaCloudUploadAlt, FaTrash, FaImages, FaPlus, FaBoxOpen, FaIndustry, FaFileContract, FaCheckCircle } from 'react-icons/fa';
import api from '../utils/api';

const VisualGallery = ({ onUpdate }) => {
  const { t } = useLanguage();
  const [mediaData, setMediaData] = useState({
    productImages: [],
    packagingImage: null,
    productionProcessImage: null,
    certificates: {
      tradeLicenseFile: null,
      tinFile: null,
      bstiFile: null,
      exportLicenseFile: null
    }
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAllMedia();
  }, []);

  const fetchAllMedia = async () => {
    try {
      setLoading(true);
      const response = await api.get('/gallery/all-media');
      if (response.data.success) {
        setMediaData(response.data.mediaGallery || {
          productImages: [],
          packagingImage: null,
          productionProcessImage: null,
          certificates: {
            tradeLicenseFile: null,
            tinFile: null,
            bstiFile: null,
            exportLicenseFile: null
          }
        });
      }
    } catch (error) {
      console.error('Fetch media error:', error);
      setError('Failed to load media gallery');
    } finally {
      setLoading(false);
    }
  };

  const validateFiles = (files, type = 'image') => {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const docTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    const allowedTypes = type === 'document' ? docTypes : imageTypes;
    const maxSize = 5 * 1024 * 1024; // 5MB
    const maxFiles = 10;

    if (files.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} files at once`);
      return false;
    }

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        setError(type === 'document'
          ? 'Please select valid files (JPG, PNG, WEBP, PDF)'
          : 'Please select valid image files (JPG, PNG, WEBP)');
        return false;
      }
      if (file.size > maxSize) {
        setError(`File "${file.name}" exceeds 5MB. Please choose smaller files.`);
        return false;
      }
    }

    setError('');
    return true;
  };

  // Upload product images (multiple)
  const handleProductImagesUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    if (!validateFiles(files, 'image')) {
      event.target.value = '';
      return;
    }

    setUploading(prev => ({ ...prev, productImages: true }));
    setError('');

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('images', file));

      const response = await api.post('/gallery/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        await fetchAllMedia();
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.message || 'Failed to upload images');
    } finally {
      setUploading(prev => ({ ...prev, productImages: false }));
      event.target.value = '';
    }
  };

  // Upload single media (packaging or production)
  const handleSingleMediaUpload = async (event, mediaType) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!validateFiles([file], 'image')) {
      event.target.value = '';
      return;
    }

    setUploading(prev => ({ ...prev, [mediaType]: true }));
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post(`/gallery/${mediaType}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        await fetchAllMedia();
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(prev => ({ ...prev, [mediaType]: false }));
      event.target.value = '';
    }
  };

  // Upload certificate
  const handleCertificateUpload = async (event, certType) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!validateFiles([file], 'document')) {
      event.target.value = '';
      return;
    }

    setUploading(prev => ({ ...prev, [certType]: true }));
    setError('');

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('certificateType', certType);

      const response = await api.post('/gallery/certificate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        await fetchAllMedia();
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.message || 'Failed to upload certificate');
    } finally {
      setUploading(prev => ({ ...prev, [certType]: false }));
      event.target.value = '';
    }
  };

  // Delete product image
  const handleDeleteProductImage = async (imageUrl) => {
    if (!window.confirm('Are you sure you want to remove this image?')) {
      return;
    }

    try {
      const response = await api.delete('/gallery/images', {
        data: { imageUrl }
      });

      if (response.data.success) {
        await fetchAllMedia();
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError(error.response?.data?.message || 'Failed to delete image');
    }
  };

  // Delete single media
  const handleDeleteSingleMedia = async (mediaType) => {
    if (!window.confirm('Are you sure you want to remove this image?')) {
      return;
    }

    try {
      const response = await api.delete(`/gallery/${mediaType}`);

      if (response.data.success) {
        await fetchAllMedia();
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError(error.response?.data?.message || 'Failed to delete image');
    }
  };

  // Delete certificate
  const handleDeleteCertificate = async (certType) => {
    if (!window.confirm('Are you sure you want to remove this certificate?')) {
      return;
    }

    try {
      const response = await api.delete('/gallery/certificate', {
        data: { certificateType: certType }
      });

      if (response.data.success) {
        await fetchAllMedia();
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError(error.response?.data?.message || 'Failed to delete certificate');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center bg-gray-50/50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <FaImages className="text-emerald-600" /> {t('visualGallery.title') || 'Visual Gallery'}
          </h3>
        </div>
        <div className="p-12 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-3"></div>
            <p className="text-gray-500">{t('visualGallery.loading', 'Loading...')}</p>
          </div>
        </div>
      </div>
    );
  }

  const totalMediaCount =
    (mediaData.productImages?.length || 0) +
    (mediaData.packagingImage ? 1 : 0) +
    (mediaData.productionProcessImage ? 1 : 0) +
    Object.values(mediaData.certificates || {}).filter(Boolean).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <FaImages className="text-emerald-600" /> {t('visualGallery.title') || 'Visual Gallery'}
        </h3>
        <span className="text-xs bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-medium">
          {totalMediaCount} {totalMediaCount === 1 ? t('visualGallery.item' || 'item') : t('visualGallery.items' || 'items')}
        </span>
      </div>

      {/* Content */}
      <div className="p-6 space-y-8">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* SECTION 1: Product Images */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <FaImages className="text-blue-500" /> {t('visualGallery.productShowcase' || 'Product Showcase')}
            </h4>
            <span className="text-xs text-gray-500">
              {mediaData.productImages?.length || 0} {t('visualGallery.images' || 'images')}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Upload Button */}
            <label className="border-2 border-dashed border-emerald-300 bg-emerald-50/50 rounded-xl flex flex-col items-center justify-center aspect-square cursor-pointer hover:bg-emerald-50 transition-colors group">
              {uploading.productImages ? (
                <div className="animate-pulse flex flex-col items-center">
                  <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mb-2"></div>
                  <span className="text-xs text-emerald-600 font-medium">{t('visualGallery.uploading' || 'Uploading...')}</span>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-emerald-500 mb-2 group-hover:scale-110 transition-transform">
                    <FaPlus />
                  </div>
                    <span className="text-sm font-bold text-emerald-700">{t('visualGallery.addImages' || 'Add Images')}</span>
                    <span className="text-xs text-emerald-600/70">{t('visualGallery.max10' || 'Max 10')}</span>
                </>
              )}
              <input
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleProductImagesUpload}
                className="hidden"
                disabled={uploading.productImages}
              />
            </label>

            {/* Image Cards */}
            {mediaData.productImages?.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="relative group rounded-xl overflow-hidden aspect-square border border-gray-200 shadow-sm bg-gray-100"
              >
                <img
                  src={url}
                  alt={`Product ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => handleDeleteProductImage(url)}
                    className="bg-white text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors shadow-lg transform hover:scale-110"
                    title={t('visualGallery.deleteImage' || 'Delete image')}
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
                <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>

          {mediaData.productImages?.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-100">
              <FaCloudUploadAlt className="text-4xl text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">{t('visualGallery.noProductImages' || 'No product images yet. Click "Add Images" to upload.')}</p>
            </div>
          )}
        </div>

        {/* SECTION 2: Single Media Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Packaging Image */}
          <SingleMediaCard
            title={t('visualGallery.packagingImage' || 'Packaging Image')}
            icon={<FaBoxOpen className="text-amber-500" />}
            image={mediaData.packagingImage}
            uploading={uploading.packaging}
            onUpload={(e) => handleSingleMediaUpload(e, 'packaging')}
            onDelete={() => handleDeleteSingleMedia('packaging')}
          />

          {/* Production Process Image */}
          <SingleMediaCard
            title={t('visualGallery.productionProcess' || 'Production Process')}
            icon={<FaIndustry className="text-indigo-500" />}
            image={mediaData.productionProcessImage}
            uploading={uploading.production}
            onUpload={(e) => handleSingleMediaUpload(e, 'production')}
            onDelete={() => handleDeleteSingleMedia('production')}
          />
        </div>

        {/* SECTION 3: Certificates */}
        <div>
          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2 mb-4">
            <FaFileContract className="text-purple-500" /> {t('visualGallery.registrationDocuments' || 'Registration Documents')}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CertificateCard
              title={t('visualGallery.tradeLicense' || 'Trade License')}
              certType="tradeLicense"
              file={mediaData.certificates?.tradeLicenseFile}
              uploading={uploading.tradeLicense}
              onUpload={(e) => handleCertificateUpload(e, 'tradeLicense')}
              onDelete={() => handleDeleteCertificate('tradeLicense')}
            />
            <CertificateCard
              title={t('visualGallery.tinCertificate' || 'TIN Certificate')}
              certType="tin"
              file={mediaData.certificates?.tinFile}
              uploading={uploading.tin}
              onUpload={(e) => handleCertificateUpload(e, 'tin')}
              onDelete={() => handleDeleteCertificate('tin')}
            />
            <CertificateCard
              title={t('visualGallery.bstiApproval' || 'BSTI Approval')}
              certType="bsti"
              file={mediaData.certificates?.bstiFile}
              uploading={uploading.bsti}
              onUpload={(e) => handleCertificateUpload(e, 'bsti')}
              onDelete={() => handleDeleteCertificate('bsti')}
            />
            <CertificateCard
              title={t('visualGallery.exportLicense' || 'Export License')}
              certType="exportLicense"
              file={mediaData.certificates?.exportLicenseFile}
              uploading={uploading.exportLicense}
              onUpload={(e) => handleCertificateUpload(e, 'exportLicense')}
              onDelete={() => handleDeleteCertificate('exportLicense')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Single Media Card Component
const SingleMediaCard = ({ title, icon, image, uploading, onUpload, onDelete }) => {
  const { t } = useLanguage();
  return (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h5 className="text-sm font-bold text-gray-700 flex items-center gap-2">
          {icon} {title}
        </h5>
        {image && <FaCheckCircle className="text-emerald-500" />}
      </div>

      {image ? (
        <div className="relative rounded-lg overflow-hidden aspect-video group border border-gray-200 bg-white">
          <img src={image} alt={title} className="w-full h-full object-contain p-2" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <label className="bg-white text-gray-800 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-gray-100 transition">
              {t('visualGallery.change', 'Change')}
              <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
            </label>
            <button
              onClick={onDelete}
              className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-600 transition"
            >
              {t('visualGallery.delete', 'Delete')}
            </button>
          </div>
        </div>
      ) : (
        <label className="border-2 border-dashed border-gray-300 bg-white rounded-lg aspect-video flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors">
          {uploading ? (
            <div className="w-8 h-8 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin"></div>
          ) : (
            <>
              <FaCloudUploadAlt className="text-3xl text-gray-400 mb-2" />
              <span className="text-xs text-gray-500 font-medium">{t('visualGallery.clickToUpload', 'Click to upload')}</span>
            </>
          )}
          <input type="file" accept="image/*" onChange={onUpload} className="hidden" disabled={uploading} />
        </label>
      )}
    </div>
  );
};

// Certificate Card Component
const CertificateCard = ({ title, certType, file, uploading, onUpload, onDelete }) => {
  const { t } = useLanguage();
  const isImage = file?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPdf = file?.match(/\.pdf$/i);

  return (
    <div className="bg-purple-50/30 p-4 rounded-xl border border-purple-100">
      <div className="flex items-center justify-between mb-3">
        <h5 className="text-sm font-bold text-gray-700">{title}</h5>
        {file ? (
          <FaCheckCircle className="text-emerald-500" />
        ) : (
            <span className="text-xs text-gray-400 font-medium">{t('visualGallery.notUploaded', 'Not uploaded')}</span>
        )}
      </div>

      {file ? (
        <div className="space-y-2">
          {isImage && (
            <div className="relative rounded-lg overflow-hidden aspect-video bg-white border border-purple-200">
              <img src={file} alt={title} className="w-full h-full object-contain p-2" />
            </div>
          )}
          <div className="flex gap-2">
            <a
              href={file}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-white border border-purple-200 text-purple-700 px-3 py-2 rounded-lg text-xs font-bold hover:bg-purple-50 transition text-center"
            >
              {t('visualGallery.view', 'View')} {isPdf ? 'PDF' : 'File'}
            </a>
            <label className="flex-1 bg-white border border-purple-200 text-gray-700 px-3 py-2 rounded-lg text-xs font-bold hover:bg-gray-50 transition text-center cursor-pointer">
              {t('visualGallery.replace', 'Replace')}
              <input type="file" accept="image/*,.pdf" onChange={onUpload} className="hidden" />
            </label>
            <button
              onClick={onDelete}
              className="bg-red-500 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-red-600 transition"
            >
              {t('visualGallery.delete', 'Delete')}
            </button>
          </div>
        </div>
      ) : (
        <label className="border-2 border-dashed border-purple-200 bg-white rounded-lg py-6 flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/30 transition-colors">
          {uploading ? (
            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
          ) : (
            <>
              <FaCloudUploadAlt className="text-3xl text-purple-300 mb-2" />
                  <span className="text-xs text-purple-600 font-bold">{t('visualGallery.upload', 'Upload')} {title}</span>
                  <span className="text-[10px] text-gray-400 mt-1">{t('visualGallery.jpgPngOrPdf', 'JPG, PNG or PDF')}</span>
            </>
          )}
          <input type="file" accept="image/*,.pdf" onChange={onUpload} className="hidden" disabled={uploading} />
        </label>
      )}
    </div>
  );
};

export default VisualGallery;
