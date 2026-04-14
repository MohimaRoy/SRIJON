import { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';
import { INITIAL_FORM_STATE } from '../data/formConstants';
import { validateStep } from '../utils/formSchemas';
import { useAuth } from './AuthContext';

// Map any previously-stored translated enum value to its correct English equivalent.
// Fixes existing drafts that were saved in Bengali before the frontend fix was deployed.
const ENUM_NORMALIZE_MAP = {
  // gender
  'পুরুষ': 'Male', 'মহিলা': 'Female', 'অন্যান্য': 'Other',
  // ownershipType
  'একক': 'Single', 'অংশীদারিত্ব': 'Partnership', 'লিমিটেড কোম্পানি': 'Ltd. Company',
  // rawMaterialSource
  'স্থানীয়': 'Local', 'আমদানিকৃত': 'Imported',
  // productionType
  'হস্তনির্মিত': 'Handmade', 'আধা-স্বয়ংক্রিয়': 'Semi-automatic', 'স্বয়ংক্রিয়': 'Automatic',
  // productionPlace
  'গৃহ-ভিত্তিক': 'Home-based', 'কারখানা-ভিত্তিক': 'Factory-based',
  // Yes/No fields
  'হ্যাঁ': 'Yes', 'না': 'No'
};

const ENUM_FIELDS = [
  'gender', 'ownershipType', 'rawMaterialSource', 'productionType',
  'productionPlace', 'bulkDiscount', 'hasBankAccount', 'interestInOnlineExport'
];

const normalizeLoadedData = (data) => {
  if (!data) return data;
  const out = { ...data };
  ENUM_FIELDS.forEach(field => {
    if (out[field] && ENUM_NORMALIZE_MAP[out[field]]) {
      out[field] = ENUM_NORMALIZE_MAP[out[field]];
    }
  });
  return out;
};

const FormContext = createContext();

export const useForm = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useForm must be used within a FormProvider');
  }
  return context;
};

export const FormProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing data based on auth status
  useEffect(() => {
    if (authLoading) return;
    
    if (isAuthenticated) {
      loadExistingData();
    } else {
      setFormData(INITIAL_FORM_STATE);
    }
  }, [isAuthenticated, authLoading]);

  // Listen for auth changes to reset form data
  useEffect(() => {
    const handleAuthReset = () => {
      console.log('Auth token removed - resetting form data');
      setFormData(INITIAL_FORM_STATE);
    };

    const handleAuthReload = async () => {
      console.log('Auth reload - resetting and loading new user data');
      setFormData(INITIAL_FORM_STATE);
      await loadExistingData();
    };

    window.addEventListener('form-data-reset', handleAuthReset);
    window.addEventListener('form-data-reload', handleAuthReload);

    return () => {
      window.removeEventListener('form-data-reset', handleAuthReset);
      window.removeEventListener('form-data-reload', handleAuthReload);
    };
  }, []);

  const loadExistingData = async () => {
    // Disabled obsolete seller registration data fetch
    return;
  };

  const updateFormData = (data) => {
    setFormData(prev => ({
      ...prev,
      ...data
    }));
  };

  const saveDraft = async (stepData) => {
    try {
      setLoading(true);
      setIsSaving(true);
      const dataToSave = {
        ...formData,
        ...stepData,
        submissionStatus: stepData.submissionStatus || formData.submissionStatus || 'draft'
      };

      let response;
      if (formData.businessDataId) {
        response = await api.put(`/business/${formData.businessDataId}`, dataToSave);
      } else {
        response = await api.post('/business', dataToSave);
      }

      if (response.data.success) {
        const updatedData = {
          ...formData,
          ...response.data.data,
          businessDataId: response.data.data._id
        };

        setFormData(updatedData);

        window.dispatchEvent(new CustomEvent('business-data-updated', {
          detail: updatedData
        }));

        return { success: true };
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to save draft'
      };
    } finally {
      setLoading(false);
      setIsSaving(false);
    }
  };

  const submitFinal = async () => {
    try {
      setLoading(true);
      setIsSaving(true);
      const dataToSave = {
        ...formData,
        submissionStatus: 'submitted',
        consentAccuracy: true
      };

      const response = await api.put(`/business/${formData.businessDataId}`, dataToSave);

      if (response.data.success) {
        // Now also trigger the Seller application process so they show up as pending
        try {
          await api.post('/seller/apply');
        } catch (applyErr) {
          console.error('Error applying as seller:', applyErr);
        }

        const updatedData = {
          ...formData,
          ...response.data.data
        };

        setFormData(updatedData);

        window.dispatchEvent(new CustomEvent('business-data-updated', {
          detail: updatedData
        }));

        return { success: true };
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to submit form'
      };
    } finally {
      setLoading(false);
      setIsSaving(false);
    }
  };

  const resetFormData = () => {
    setFormData(INITIAL_FORM_STATE);
  };

  const value = {
    formData,
    updateFormData,
    saveDraft,
    submitFinal,
    loading,
    isSaving,
    isUpdating: isSaving && Boolean(formData.businessDataId), // true = update, false = create
    loadExistingData,
    resetFormData,
    validateStep   // ✅ expose Zod validateStep for use in each wizard step
  };

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
};
