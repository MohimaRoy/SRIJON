import { useState, useRef } from 'react';
import { FaCamera, FaTrash, FaUser, FaTimes, FaCheck } from 'react-icons/fa';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const ProfilePicture = ({ user, onUpdate }) => {
  const { t } = useLanguage();
  const { updateUser } = useAuth();
  const [currentPicture, setCurrentPicture] = useState(
    user?.profilePictures?.length > 0
      ? user.profilePictures[user.profilePictures.length - 1].url
      : null
  );
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Validate file
  const validateFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      setError(t('profilePicture.invalidFileType'));
      return false;
    }

    if (file.size > maxSize) {
      setError(t('profilePicture.fileTooLarge'));
      return false;
    }

    setError('');
    return true;
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!validateFile(file)) {
      event.target.value = '';
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage({ file, url: reader.result });
      setShowPreview(true);
    };
    reader.readAsDataURL(file);
  };

  // Upload/Update profile picture
  const handleUpload = async () => {
    if (!previewImage) return;

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('profilePicture', previewImage.file);

      const endpoint = currentPicture ? '/profile/picture' : '/profile/picture';
      const method = currentPicture ? 'put' : 'post';

      const response = await api[method](endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        const newUrl = response.data.profilePicture.url;
        const newPublicId = response.data.profilePicture.publicId;
        setCurrentPicture(newUrl);
        setShowPreview(false);
        setPreviewImage(null);

        // Sync global AuthContext so Navbar/Dropdown avatar updates immediately
        updateUser({
          profilePictures: [
            ...(user?.profilePictures || []),
            { url: newUrl, publicId: newPublicId }
          ]
        });

        // Notify parent component to refresh user data
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.message || t('profilePicture.uploadFailed'));
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Delete profile picture
  const handleDelete = async () => {
    if (!currentPicture) return;

    if (!window.confirm(t('profilePicture.confirmRemove'))) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.delete('/profile/picture');

      if (response.data.success) {
        const remainingUrl = response.data.profilePicture
          ? response.data.profilePicture.url
          : null;
        setCurrentPicture(remainingUrl);

        // Sync global AuthContext so Navbar/Dropdown avatar updates immediately
        updateUser({
          profilePictures: remainingUrl
            ? [{ url: remainingUrl }]
            : []
        });

        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError(error.response?.data?.message || t('profilePicture.deleteFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Cancel preview
  const cancelPreview = () => {
    setShowPreview(false);
    setPreviewImage(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* Profile Picture Display */}
      <div className="relative group w-28 h-28">
        <div className="w-full h-full bg-slate-100 rounded-full shadow-md flex items-center justify-center text-4xl font-bold text-slate-400 border-4 border-white overflow-hidden ring-1 ring-slate-200">
          {currentPicture ? (
            <img
              src={currentPicture}
              alt={t('profilePicture.altText')}
              className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
            />
          ) : (
            <FaUser className="text-slate-300 text-4xl" />
          )}
        </div>

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-slate-900/60 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center cursor-pointer backdrop-blur-[1px]">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="text-white hover:text-blue-200 transition-colors transform hover:scale-110"
            title={currentPicture ? t('profilePicture.changePicture') : t('profilePicture.uploadPicture')}
          >
            <FaCamera size={24} />
          </button>
        </div>

        {/* Loading Overlay */}
        {loading && !showPreview && (
          <div className="absolute inset-0 bg-white/80 rounded-full flex items-center justify-center z-10">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex flex-col items-center gap-2 w-full max-w-[200px]">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1.5 py-1"
        >
          <FaCamera /> {currentPicture ? t('profilePicture.changePhoto') : t('profilePicture.uploadPhoto')}
        </button>

        {currentPicture && (
          <button
            onClick={handleDelete}
            disabled={loading}
            className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors flex items-center gap-1.5 py-1"
          >
            <FaTrash size={10} /> {t('profilePicture.remove')}
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-2.5 bg-red-50 border border-red-100 rounded-lg w-full text-center">
          <p className="text-xs font-semibold text-red-600">{error}</p>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && previewImage && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative">

            <button
              onClick={cancelPreview}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100"
            >
              <FaTimes size={16} />
            </button>

            <h3 className="text-lg font-bold text-slate-800 mb-6 text-center">{t('profilePicture.previewTitle')}</h3>

            <div className="mb-6 relative">
              <div className="w-40 h-40 mx-auto bg-slate-100 rounded-full overflow-hidden border-4 border-white shadow-lg ring-1 ring-slate-200">
                <img
                  src={previewImage.url}
                  alt={t('profilePicture.previewAlt')}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Checkmark Badge */}
              <div className="absolute bottom-1 right-1/2 translate-x-12 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-md border-2 border-white">
                <FaCheck size={12} />
              </div>
            </div>

            <p className="text-xs text-slate-500 text-center mb-6 px-4">
              {t('profilePicture.previewHint')}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={cancelPreview}
                disabled={loading}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-bold text-sm disabled:opacity-50"
              >
                {t('profilePicture.cancel')}
              </button>
              <button
                onClick={handleUpload}
                disabled={loading}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold text-sm shadow-lg shadow-blue-500/20 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : t('profilePicture.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePicture;