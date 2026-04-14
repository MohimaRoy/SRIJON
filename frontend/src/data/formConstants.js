// ============================================================
// INITIAL_FORM_STATE — Single source of truth for form data.
// Used by FormContext for both the initial useState value and
// resetting after logout. Import this wherever you need the
// blank slate form shape.
// ============================================================

export const INITIAL_FORM_STATE = {
  // --- Step 1: Basic Info ---
  productType: '',
  category: '',
  brandName: '',
  registeredName: '',
  ownerName: '',
  gender: '',
  ownerAge: '',
  ownershipType: '',
  partnerName: '',
  mobileNumber: '',
  whatsappSameAsMobile: false,
  whatsappNumber: '',
  email: '',
  division: '',
  district: '',
  thana: '',
  postOffice: '',
  postCode: '',
  detailedAddress: '',

  // --- Step 2: Product Details ---
  productName: '',
  shortDescription: '',
  rawMaterialSource: '',
  productionType: '',
  productionPlace: '',
  wholesalePrice: '',
  moq: '',
  bulkDiscount: '',
  productionCapacity: '',

  maleWorkers: '',
  femaleWorkers: '',

  // --- Step 3: Market & Business ---
  targetMarket: '',
  buyerType: {
    individual: false,
    retailShop: false,
    corporate: false,
    exportBuyer: false
  },
  salesChannel: {
    online: false,
    offline: false,
    facebookLink: '',
    websiteLink: '',
    shopAddress: ''
  },
  totalCustomers: '',
  regularCustomers: '',
  monthlySales: '',
  businessAge: '',
  registrationDocuments: {
    tradeLicense: false,
    tradeLicenseFile: '',
    tin: false,
    tinFile: '',
    bsti: false,
    bstiFile: '',
    exportLicense: false,
    exportLicenseFile: '',
    other: false,
    otherFile: ''
  },
  hasBankAccount: '',
  bankName: '',
  bankBranch: '',
  accountHolder: '',
  accountNumber: '',
  mobileBanking: {
    bkash: false,
    bkashNumber: '',
    nagad: false,
    nagadNumber: '',
    rocket: false,
    rocketNumber: ''
  },

  // --- Step 4: Future Plans ---
  futureGoals: '',
  productionIncreasePlan: '',
  newProductsPlan: '',
  interestInOnlineExport: '',
  needFunding: false,
  needTraining: false,
  supportNeeds: {
    marketing: false,
    packaging: false,
    quality: false,
    financing: false,
    exportSupport: false,
    training: false
  },

  // --- Step 5: Media ---
  productImages: [],
  packagingImage: '',
  productionProcessImage: '',
  video: '',

  // --- Step 6: Review & Consent ---
  consentAccuracy: false,
  consentMarketing: false,
  digitalSignature: '',

  // --- Metadata ---
  currentStep: 1,
  submissionStatus: 'draft',
  businessDataId: null
};
