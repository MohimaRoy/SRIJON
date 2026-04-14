// Validation helper functions for form steps
// This ensures users cannot skip required fields

export const validateStep1 = (data) => {
  const errors = {};
  
  // Product Info
  if (!data.productType?.trim()) errors.productType = 'Product type is required';
  if (!data.category?.trim()) errors.category = 'Category is required';
  if (!data.brandName?.trim()) errors.brandName = 'Brand name is required';
  
  // Owner Info
  if (!data.ownerName?.trim()) errors.ownerName = 'Owner name is required';
  if (!data.gender) errors.gender = 'Gender is required';
  if (!data.ownerAge || data.ownerAge < 18) errors.ownerAge = 'Valid age (18+) is required';
  if (!data.ownershipType) errors.ownershipType = 'Ownership type is required';
  
  if (data.ownershipType === 'Partnership' && !data.partnerName?.trim()) {
    errors.partnerName = 'Partner name is required for partnership';
  }
  
  // Contact Info
  if (!data.mobileNumber?.trim()) errors.mobileNumber = 'Mobile number is required';
  if (!data.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Valid email is required';
  }
  
  // Address
  if (!data.division) errors.division = 'Division is required';
  if (!data.district) errors.district = 'District is required';
  if (!data.thana) errors.thana = 'Thana is required';
  if (!data.postOffice?.trim()) errors.postOffice = 'Post office is required';
  if (!data.postCode?.trim()) errors.postCode = 'Post code is required';
  if (!data.detailedAddress?.trim()) errors.detailedAddress = 'Detailed address is required';
  
  return { 
    isValid: Object.keys(errors).length === 0, 
    errors 
  };
};

export const validateStep2 = (data) => {
  const errors = {};
  
  if (!data.productName?.trim()) errors.productName = 'Product name is required';
  if (!data.shortDescription?.trim()) errors.shortDescription = 'Product description is required';
  if (!data.rawMaterialSource) errors.rawMaterialSource = 'Raw material source is required';
  if (!data.productionType) errors.productionType = 'Production type is required';
  if (!data.productionPlace) errors.productionPlace = 'Production place is required';
  
  // Pricing
  if (!data.wholesalePrice || data.wholesalePrice <= 0) errors.wholesalePrice = 'Valid wholesale price is required';
  if (!data.moq || data.moq <= 0) errors.moq = 'Minimum order quantity is required';
  if (!data.bulkDiscount) errors.bulkDiscount = 'Bulk discount option is required';
  
  // Production Capacity
  if (!data.productionCapacity?.trim()) errors.productionCapacity = 'Production capacity is required';
  if (data.maleWorkers === undefined || data.maleWorkers === null || data.maleWorkers === '') {
    errors.maleWorkers = 'Number of male workers is required (can be 0)';
  }
  if (data.femaleWorkers === undefined || data.femaleWorkers === null || data.femaleWorkers === '') {
    errors.femaleWorkers = 'Number of female workers is required (can be 0)';
  }
  
  return { 
    isValid: Object.keys(errors).length === 0, 
    errors 
  };
};

export const validateStep3 = (data) => {
  const errors = {};
  
  // Buyer Type validation
  const hasBuyerType = Object.values(data.buyerType || {}).some(val => val === true);
  if (!hasBuyerType) {
    errors.buyerType = 'Please select at least one buyer type';
  }
  
  // Export Buyer validation
  if (data.buyerType?.exportBuyer) {
    if (!data.exportMarkets || data.exportMarkets.length === 0) {
      errors.exportMarkets = 'Please select at least one export country';
    } else {
      // Check that all countries have buyer counts
      const missingCounts = data.exportMarkets.some(m => !m.buyers || m.buyers <= 0);
      if (missingCounts) {
        errors.exportMarkets = 'Please enter number of buyers for all selected countries';
      }
    }
  }
  
  // Online Buyer validation
  if (data.buyerType?.online) {
    const hasFacebook = data.onlineBuyer?.facebookLink?.trim();
    const hasWebsite = data.onlineBuyer?.websiteLink?.trim();
    if (!hasFacebook && !hasWebsite) {
      errors.onlineBuyer = 'Please provide at least one link (Facebook or Website)';
    }
  }
  
  // Others document validation
  if (data.registrationDocuments?.other) {
    if (!data.registrationDocuments.certificateName?.trim()) {
      errors.certificateName = 'Please enter the certificate/document name';
    }
    if (!data.registrationDocuments.otherFile) {
      errors.otherFile = 'Please upload the document file';
    }
  }
  
  // Bank account validation (keep existing)
  if (!data.hasBankAccount) {
    errors.hasBankAccount = 'Bank account information is required';
  }
  
  if (data.hasBankAccount === 'Yes') {
    if (!data.bankName?.trim()) errors.bankName = 'Bank name is required';
    if (!data.accountHolder?.trim()) errors.accountHolder = 'Account holder name is required';
    if (!data.accountNumber?.trim()) errors.accountNumber = 'Account number is required';
  }
  
  return { 
    isValid: Object.keys(errors).length === 0, 
    errors 
  };
};

export const validateStep4 = (data) => {
  const errors = {};
  
  if (!data.interestInOnlineExport) errors.interestInOnlineExport = 'Interest in online export is required';
  
  // At least some future planning info should be provided
  if (!data.futureGoals?.trim() && !data.productionIncreasePlan?.trim() && !data.newProductsPlan?.trim()) {
    errors.futureGoals = 'Please provide at least one future plan or goal';
  }
  
  return { 
    isValid: Object.keys(errors).length === 0, 
    errors 
  };
};

export const validateStep5 = (data) => {
  const errors = {};
  
  // Step 5 is now optional - users can skip media upload
  // No validation required
  
  return { 
    isValid: Object.keys(errors).length === 0, 
    errors 
  };
};

export const validateStep6 = (data) => {
  const errors = {};
  
  if (!data.consentAccuracy) {
    errors.consentAccuracy = 'You must certify that all information is correct';
  }
  
  if (!data.digitalSignature?.trim()) {
    errors.digitalSignature = 'Digital signature is required';
  }
  
  return { 
    isValid: Object.keys(errors).length === 0, 
    errors 
  };
};

export default {
  validateStep1,
  validateStep2,
  validateStep3,
  validateStep4,
  validateStep5,
  validateStep6
};
