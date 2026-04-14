import mongoose from 'mongoose';

const businessDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Step 1: Basic Info & Contact
  productType: String,
  category: String,
  brandName: String,
  registeredName: String,
  ownerName: String,
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  ownerAge: Number,
  ownershipType: {
    type: String,
    enum: ['Single', 'Partnership', 'Ltd. Company']
  },
  partnerName: String,
  mobileNumber: String,
  whatsappSameAsMobile: Boolean,
  whatsappNumber: String,
  email: String,
  
  // Address
  division: String,
  district: String,
  thana: String,
  postOffice: String,
  postCode: String,
  detailedAddress: String,
  
  // Step 2: Product Details & Production
  products: [
  {
    category: String,
    subCategory: String,
    productName: String
  }
],

shortDescription: String,
  rawMaterialSource: {
    type: String,
    enum: ['Local', 'Imported']
  },
  productionType: {
    type: String,
    enum: ['Handmade', 'Semi-automatic', 'Automatic']
  },
  productionPlace: {
    type: String,
    enum: ['Home-based', 'Factory-based']
  },
  wholesalePrice: Number,
  moq: Number,
  bulkDiscount: {
    type: String,
    enum: ['Yes', 'No']
  },
  productionCapacity: String,

  maleWorkers: Number,
  femaleWorkers: Number,
  
  // Step 3: Market & Business Status
  buyerType: {
    retailShop: Boolean,
    corporate: Boolean,
    exportBuyer: Boolean,
    online: Boolean
  },
  exportMarkets: [{
    country: String,
    buyers: Number
  }],
  onlineBuyer: {
    facebookLink: String,
    websiteLink: String
  },
  totalCustomers: Number,
  regularCustomers: Number,
  monthlySales: Number,
  businessAge: Number,
  
  // Registration Documents
  registrationDocuments: {
    tradeLicense: Boolean,
    tradeLicenseFile: String,
    tin: Boolean,
    tinFile: String,
    bsti: Boolean,
    bstiFile: String,
    exportLicense: Boolean,
    exportLicenseFile: String,
    other: Boolean,
    certificateName: String,
    otherFile: String
  },
  
  // Bank Info
  hasBankAccount: {
    type: String,
    enum: ['Yes', 'No']
  },
  bankName: String,
bankBranch: String,
accountHolder: String,
accountNumber: String,
routingNumber: String,
  
  // Mobile Banking
  mobileBanking: {
    bkash: Boolean,
    bkashNumber: String,
    nagad: Boolean,
    nagadNumber: String,
    rocket: Boolean,
    rocketNumber: String
  },
  
  // Step 4: Future Plan & Support
  futureGoals: String,
  productionIncreasePlan: String,
  newProductsPlan: String,
  interestInOnlineExport: {
    type: String,
    enum: ['Yes', 'No']
  },
  supportNeeds: {
    marketing: Boolean,
    packaging: Boolean,
    quality: Boolean,
    financing: Boolean,
    exportSupport: Boolean,
    training: Boolean
  },
  
  // Step 5: Media Upload
  productImages: [String],
  packagingImage: String,
  productionProcessImage: String,
  video: String,
  
  // Step 6: Review & Consent
  consentAccuracy: {
    type: Boolean,
    required: true,
    default: false
  },
  consentMarketing: {
    type: Boolean,
    default: false
  },
  digitalSignature: String,
  
  // Metadata
  submissionStatus: {
    type: String,
    enum: ['draft', 'submitted'],
    default: 'draft'
  },
  currentStep: {
    type: Number,
    default: 1,
    min: 1,
    max: 6
  },
  // Agreement email guard — set to true once the PDF has been e-mailed
  // Successfully sent. Prevents duplicate sends on subsequent saves.
  isAgreementSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// ─── Indexes ─────────────────────────────────────────────────────────────────
// One user → one BusinessData document (enforces uniqueness + fast lookup)
businessDataSchema.index({ userId: 1 }, { unique: true });
businessDataSchema.index({ "products.category": 1 });

// Admin: list all drafted / submitted businesses
businessDataSchema.index({ submissionStatus: 1 });

// Admin: browse/filter businesses by product category
businessDataSchema.index({ productType: 1 });

// Admin: filter submitted businesses by category (most common admin query)
businessDataSchema.index({ productType: 1, submissionStatus: 1 });
// ─────────────────────────────────────────────────────────────────────────────


const BusinessData = mongoose.model('BusinessData', businessDataSchema);

export default BusinessData;
