import PDFDocument from 'pdfkit';
import User from '../models/User.js';

// Generate PDF for business data
export const generateBusinessDataPDF = async (userId, businessData) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Fetch user data
      const user = await User.findById(userId);
      if (!user) {
        return reject(new Error('User not found'));
      }

      // Create PDF document
      const doc = new PDFDocument({ 
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      // Collect PDF data in buffer
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Helper function for section headers
      const addSectionHeader = (title) => {
        doc.fontSize(16)
           .fillColor('#22c55e')
           .text(title, { underline: true })
           .moveDown(0.5);
      };

      // Helper function for field labels and values (with safe rendering)
      const addField = (label, value, indent = 0) => {
        // Safe value check - handle 0, false, empty string
        const safeValue = value !== undefined && value !== null && value !== '' ? String(value) : null;
        
        if (safeValue !== null) {
          doc.fontSize(10)
             .fillColor('#333')
             .text(`${' '.repeat(indent)}${label}: `, { continued: true })
             .fillColor('#555')
             .text(safeValue)
             .moveDown(0.3);
        }
      };

      // === HEADER ===
      doc.fontSize(24)
         .fillColor('#22c55e')
         .font('Helvetica-Bold')
        .text('SRIJON Business Profile', { align: 'center' })
         .moveDown(0.3);

      doc.fontSize(12)
         .fillColor('#666')
         .font('Helvetica')
         .text('Agricultural Entrepreneur Registration', { align: 'center' })
         .moveDown(1);

      // Divider line
      doc.moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .strokeColor('#22c55e')
         .lineWidth(2)
         .stroke()
         .moveDown(1);

      // === USER INFORMATION ===
      addSectionHeader('Personal Information');
      addField('Name', user?.name);
      addField('Email', user?.email);
      addField('Registration Date', user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A');
      doc.moveDown(0.5);

      // === STEP 1: BASIC INFO & CONTACT ===
      addSectionHeader('Step 1: Basic Information & Contact');
      addField('Product Type', businessData?.productType);
      addField('Category', businessData?.category);
      addField('Brand Name', businessData?.brandName);
      addField('Registered Name', businessData?.registeredName);
      addField('Owner Name', businessData?.ownerName);
      addField('Gender', businessData?.gender);
      addField('Owner Age', businessData?.ownerAge);
      addField('Ownership Type', businessData?.ownershipType);
      addField('Partner Name', businessData?.partnerName);
      addField('Mobile Number', businessData?.mobileNumber);
      addField('WhatsApp Number', businessData?.whatsappNumber);
      addField('Email', businessData?.email);
      
      doc.moveDown(0.3);
      doc.fontSize(11).fillColor('#22c55e').text('Address:');
      addField('Division', businessData?.division, 2);
      addField('District', businessData?.district, 2);
      addField('Thana', businessData?.thana, 2);
      addField('Post Office', businessData?.postOffice, 2);
      addField('Post Code', businessData?.postCode, 2);
      addField('Detailed Address', businessData?.detailedAddress, 2);
      doc.moveDown(0.5);

      // === STEP 2: PRODUCT DETAILS & PRODUCTION ===
      addSectionHeader('Step 2: Product Details & Production');
      addField('Product Name', businessData?.productName);
      addField('Short Description', businessData?.shortDescription);
      addField('Raw Material Source', businessData?.rawMaterialSource);
      addField('Production Type', businessData?.productionType);
      addField('Production Place', businessData?.productionPlace);
      addField('Wholesale Price', businessData?.wholesalePrice ? `৳${businessData.wholesalePrice}` : undefined);
      addField('Minimum Order Quantity (MOQ)', businessData?.moq);
      addField('Bulk Discount Available', businessData?.bulkDiscount);
      addField('Production Capacity', businessData?.productionCapacity);

      addField('Male Workers', businessData?.maleWorkers !== undefined ? businessData.maleWorkers : undefined);
      addField('Female Workers', businessData?.femaleWorkers !== undefined ? businessData.femaleWorkers : undefined);
      doc.moveDown(0.5);

      // === STEP 3: MARKET & BUSINESS STATUS ===
      addSectionHeader('Step 3: Market & Business Status');
      addField('Target Market', businessData?.targetMarket);
      
      if (businessData.buyerType) {
        doc.fontSize(11).fillColor('#22c55e').text('Buyer Types:');
        if (businessData.buyerType.individual) addField('Individual Buyers', 'Yes', 2);
        if (businessData.buyerType.retailShop) addField('Retail Shops', 'Yes', 2);
        if (businessData.buyerType.corporate) addField('Corporate', 'Yes', 2);
        if (businessData.buyerType.exportBuyer) addField('Export Buyers', 'Yes', 2);
      }
      
      if (businessData.salesChannel) {
        doc.moveDown(0.3);
        doc.fontSize(11).fillColor('#22c55e').text('Sales Channels:');
        if (businessData.salesChannel.online) addField('Online Sales', 'Yes', 2);
        if (businessData.salesChannel.offline) addField('Offline Sales', 'Yes', 2);
        addField('Facebook', businessData.salesChannel.facebookLink, 2);
        addField('Website', businessData.salesChannel.websiteLink, 2);
        addField('Shop Address', businessData.salesChannel.shopAddress, 2);
      }
      
      addField('Total Customers', businessData?.totalCustomers);
      addField('Regular Customers', businessData?.regularCustomers);
      addField('Monthly Sales', businessData?.monthlySales ? `৳${businessData.monthlySales}` : undefined);
      addField('Business Age (Years)', businessData?.businessAge);
      doc.moveDown(0.5);

      // Check if new page needed
      if (doc.y > 650) doc.addPage();

      // === REGISTRATION DOCUMENTS ===
      if (businessData.registrationDocuments) {
        addSectionHeader('Registration Documents');
        const docs = businessData.registrationDocuments;
        if (docs.tradeLicense) addField('Trade License', docs.tradeLicenseFile || 'Available');
        if (docs.tin) addField('TIN Certificate', docs.tinFile || 'Available');
        if (docs.bsti) addField('BSTI Certificate', docs.bstiFile || 'Available');
        if (docs.exportLicense) addField('Export License', docs.exportLicenseFile || 'Available');
        if (docs.other) addField('Other Certificate', docs.otherFile || 'Available');
        doc.moveDown(0.5);
      }

      // === BANK INFORMATION ===
      addSectionHeader('Banking Information');
      addField('Has Bank Account', businessData.hasBankAccount);
      if (businessData.hasBankAccount === 'Yes') {
        addField('Bank Name', businessData.bankName, 2);
        addField('Branch', businessData.bankBranch, 2);
        addField('Account Holder', businessData.accountHolder, 2);
        addField('Account Number', businessData.accountNumber, 2);
      }
      
      if (businessData.mobileBanking) {
        doc.moveDown(0.3);
        doc.fontSize(11).fillColor('#22c55e').text('Mobile Banking:');
        const mb = businessData.mobileBanking;
        if (mb.bkash) addField('bKash', mb.bkashNumber, 2);
        if (mb.nagad) addField('Nagad', mb.nagadNumber, 2);
        if (mb.rocket) addField('Rocket', mb.rocketNumber, 2);
      }
      doc.moveDown(0.5);

      // === STEP 4: FUTURE PLAN & SUPPORT ===
      addSectionHeader('Step 4: Future Plans & Support Needs');
      addField('Future Goals', businessData?.futureGoals);
      addField('Production Increase Plan', businessData?.productionIncreasePlan);
      addField('New Products Plan', businessData?.newProductsPlan);
      addField('Interest in Online Export', businessData?.interestInOnlineExport);
      addField('Need Funding', businessData?.needFunding ? 'Yes' : 'No');
      addField('Need Training', businessData?.needTraining ? 'Yes' : 'No');
      
      if (businessData.supportNeeds) {
        doc.moveDown(0.3);
        doc.fontSize(11).fillColor('#22c55e').text('Support Needs:');
        const support = businessData.supportNeeds;
        if (support.marketing) addField('Marketing Support', 'Yes', 2);
        if (support.packaging) addField('Packaging Support', 'Yes', 2);
        if (support.quality) addField('Quality Improvement', 'Yes', 2);
        if (support.financing) addField('Financing', 'Yes', 2);
        if (support.exportSupport) addField('Export Support', 'Yes', 2);
        if (support.training) addField('Training', 'Yes', 2);
      }
      doc.moveDown(0.5);

      // === STEP 5: MEDIA ===
      addSectionHeader('Step 5: Media & Documentation');
      
      if (businessData.productImages && businessData.productImages.length > 0) {
        doc.fontSize(11).fillColor('#22c55e').text('Product Images:');
        businessData.productImages.forEach((img, idx) => {
          addField(`Image ${idx + 1}`, img, 2);
        });
      }
      
      addField('Packaging Image', businessData?.packagingImage);
      addField('Production Process Image', businessData?.productionProcessImage);
      addField('Video', businessData?.video);
      doc.moveDown(0.5);

      // === STEP 6: CONSENT ===
      addSectionHeader('Step 6: Consent & Verification');
      addField('Data Accuracy Consent', businessData?.consentAccuracy ? 'Confirmed' : 'Not Confirmed');
      addField('Marketing Consent', businessData?.consentMarketing ? 'Yes' : 'No');
      addField('Digital Signature', businessData?.digitalSignature ? 'Provided' : 'Not Provided');
      addField('Submission Status', businessData?.submissionStatus);
      doc.moveDown(1);

      // === FOOTER ===
      doc.moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .strokeColor('#e5e7eb')
         .lineWidth(1)
         .stroke()
         .moveDown(0.5);

      doc.fontSize(9)
         .fillColor('#999')
         .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' })
         .moveDown(0.2)
        .text('© SRIJON - Agricultural Entrepreneur Platform', { align: 'center' })
         .moveDown(0.2)
         .text('This document contains confidential business information', { align: 'center' });

      // Finalize PDF
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

export default { generateBusinessDataPDF };
