import PDFDocument from 'pdfkit';
import User from '../models/User.js';

/**
 * Generate Agreement PDF for Entrepreneur Participation
 * @param {String} userId - User ID
 * @param {Object} businessData - Business data object
 * @param {String} language - 'en' or 'bn' for language
 * @returns {Promise<Buffer>} PDF buffer
 */
export const generateAgreementPDF = async (userId, businessData, language = 'en') => {
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
        margins: { top: 72, bottom: 72, left: 72, right: 72 }
      });

      // Collect PDF data in buffer
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Get registration date
      const registrationDate = businessData.createdAt 
        ? new Date(businessData.createdAt).toLocaleDateString('en-GB')
        : new Date().toLocaleDateString('en-GB');

      // Add content based on language
      addAgreementHeader(doc, businessData, registrationDate, language);
      
      if (language === 'bn') {
        addBanglaAgreementBody(doc);
      } else {
        addEnglishAgreementBody(doc);
      }
      
      addCompletionSection(doc, businessData, registrationDate, language);

      // Finalize PDF
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Add PDF Header - SRIJON Platform
 */
const addAgreementHeader = (doc, businessData, registrationDate, language) => {
  // Title
  doc.fontSize(26)
     .fillColor('#22c55e')
     .font('Helvetica-Bold')
     .text(
       language === 'bn' ? 'উদ্যোক্তা অংশগ্রহণ চুক্তি' : 'Entrepreneur Participation Agreement',
       { align: 'center' }
     )
     .moveDown(0.2);

  // Subtitle
  if (language === 'bn') {
    doc.fontSize(10)
       .fillColor('#666')
       .font('Helvetica')
       .text('(Entrepreneur Participation Agreement)', { align: 'center' })
       .moveDown(0.5);
  }

  // Platform name
  doc.fontSize(14)
     .fillColor('#22c55e')
     .font('Helvetica-Bold')
     .text('SRIJON Platform', { align: 'center' })
     .moveDown(0.3);

  // Registration details
  doc.fontSize(10)
     .fillColor('#555')
     .font('Helvetica')
     .text(`${language === 'bn' ? 'তারিখ' : 'Date'}: ${registrationDate}`, { align: 'center' })
     .moveDown(1);

  // Divider line
  doc.moveTo(72, doc.y)
     .lineTo(523, doc.y)
     .strokeColor('#22c55e')
     .lineWidth(2)
     .stroke()
     .moveDown(1.5);
};

/**
 * Add English Agreement Body (8 Sections)
 */
const addEnglishAgreementBody = (doc) => {
  const addSection = (number, title, content) => {
    doc.fontSize(13)
       .fillColor('#1e293b')
       .font('Helvetica-Bold')
       .text(`${number}. ${title}`, { align: 'left' })
       .moveDown(0.4);

    doc.fontSize(11)
       .fillColor('#475569')
       .font('Helvetica')
       .text(content, { align: 'justify', lineGap: 3 })
       .moveDown(0.8);
  };

  const addList = (items) => {
    items.forEach(item => {
      doc.fontSize(11)
         .fillColor('#475569')
         .font('Helvetica')
         .text(`• ${item}`, { indent: 20, align: 'justify', lineGap: 2 })
         .moveDown(0.3);
    });
    doc.moveDown(0.5);
  };

  // Section 1
  addSection(
    '1',
    'Purpose of the Agreement',
    'This agreement aims to onboard entrepreneurs under the SRIJON platform to promote, market, sell, network, and provide support services for their products/services.'
  );

  // Section 2
  doc.fontSize(13)
     .fillColor('#1e293b')
     .font('Helvetica-Bold')
     .text('2. Responsibilities of SRIJON', { align: 'left' })
     .moveDown(0.4);

  doc.fontSize(11)
     .fillColor('#475569')
     .font('Helvetica')
     .text('SRIJON agrees to—', { align: 'justify' })
     .moveDown(0.4);

  addList([
    'Promote products/services locally and internationally',
    'Support sales, marketing, fairs, exhibitions, advertising, and media coverage',
    'Feature entrepreneurs in newsletters, magazines, websites, and digital content',
    'Facilitate funding/investment connections when applicable'
  ]);

  doc.fontSize(9)
     .fillColor('#999')
     .font('Helvetica-Oblique')
     .text('Note: Services are subject to policies and conditions.', { indent: 20 })
     .moveDown(0.8);

  // Section 3
  doc.fontSize(13)
     .fillColor('#1e293b')
     .font('Helvetica-Bold')
     .text('3. Responsibilities of the Entrepreneur', { align: 'left' })
     .moveDown(0.4);

  addList([
    'Provide accurate and updated information',
    'Bear responsibility for product quality, production, and delivery',
    'Protect SRIJON brand image',
    'Avoid illegal or unethical products/services'
  ]);

  // Section 4
  doc.fontSize(13)
     .fillColor('#1e293b')
     .font('Helvetica-Bold')
     .text('4. Financial Terms', { align: 'left' })
     .moveDown(0.4);

  addList([
    'Service charges/commissions may apply',
    'Funding terms will be defined separately'
  ]);

  // Section 5
  doc.fontSize(13)
     .fillColor('#1e293b')
     .font('Helvetica-Bold')
     .text('5. Intellectual Property & Branding', { align: 'left' })
     .moveDown(0.4);

  addList([
    'Ownership remains with the entrepreneur',
    'SRIJON may use brand assets for promotion'
  ]);

  // Section 6
  doc.fontSize(13)
     .fillColor('#1e293b')
     .font('Helvetica-Bold')
     .text('6. Duration & Termination', { align: 'left' })
     .moveDown(0.4);

  addList([
    'Effective from signing date',
    'Terminable with 30 days written notice'
  ]);

  // Section 7
  doc.fontSize(13)
     .fillColor('#1e293b')
     .font('Helvetica-Bold')
     .text('7. Dispute Resolution', { align: 'left' })
     .moveDown(0.4);

  addList([
    'Mutual discussion first',
    'Governed by Bangladesh law if unresolved'
  ]);

  // Section 8
  addSection(
    '8',
    'Final Clause',
    'This agreement constitutes the full understanding between both parties.'
  );
};

/**
 * Add Bangla Agreement Body (8 Sections)
 */
const addBanglaAgreementBody = (doc) => {
  const addSection = (number, title, content) => {
    doc.fontSize(13)
       .fillColor('#1e293b')
       .font('Helvetica-Bold')
       .text(`${number}. ${title}`, { align: 'left' })
       .moveDown(0.4);

    doc.fontSize(11)
       .fillColor('#475569')
       .font('Helvetica')
       .text(content, { align: 'justify', lineGap: 3 })
       .moveDown(0.8);
  };

  const addList = (items) => {
    items.forEach(item => {
      doc.fontSize(11)
         .fillColor('#475569')
         .font('Helvetica')
         .text(`• ${item}`, { indent: 20, align: 'justify', lineGap: 2 })
         .moveDown(0.3);
    });
    doc.moveDown(0.5);
  };

  // Section 1
  addSection(
    '১',
    'চুক্তির উদ্দেশ্য',
    'এই চুক্তির উদ্দেশ্য হলো উদ্যোক্তাকে SRIJON প্ল্যাটফর্মের আওতায় অন্তর্ভুক্ত করে তার পণ্য ও/অথবা সেবা প্রচার, বিপণন, বিক্রয় সহায়তা, নেটওয়ার্কিং এবং প্রয়োজন অনুযায়ী অন্যান্য সহায়ক সেবা প্রদান করা।'
  );

  // Section 2
  doc.fontSize(13)
     .fillColor('#1e293b')
     .font('Helvetica-Bold')
     .text('২. SRIJON-এর দায়িত্ব', { align: 'left' })
     .moveDown(0.4);

  doc.fontSize(11)
     .fillColor('#475569')
     .font('Helvetica')
     .text('SRIJON নিম্নলিখিত বিষয়ে সম্মত হলো—', { align: 'justify' })
     .moveDown(0.4);

  addList([
    'উদ্যোক্তার পণ্য/সেবা দেশীয় ও আন্তর্জাতিক বাজারে প্রচারের উদ্যোগ গ্রহণ করবে',
    'বিক্রয়, মার্কেটিং, মেলা, প্রদর্শনী, বিজ্ঞাপন ও মিডিয়া কাভারেজে সহযোগিতা প্রদান করবে',
    'নিউজলেটার, ম্যাগাজিন, ওয়েবসাইট বা অন্যান্য ডিজিটাল কনটেন্টে উদ্যোক্তাকে অন্তর্ভুক্ত করতে পারবে',
    'প্রয়োজনে অর্থায়ন, বিনিয়োগ সংযোগ বা অন্যান্য সহায়ক সেবা প্রদানের প্রচেষ্টা চালাবে'
  ]);

  doc.fontSize(9)
     .fillColor('#999')
     .font('Helvetica-Oblique')
     .text('বি.দ্র.: সকল সেবা নীতিমালা ও শর্তসাপেক্ষ', { indent: 20 })
     .moveDown(0.8);

  // Section 3
  doc.fontSize(13)
     .fillColor('#1e293b')
     .font('Helvetica-Bold')
     .text('৩. উদ্যোক্তার দায়িত্ব', { align: 'left' })
     .moveDown(0.4);

  addList([
    'সকল তথ্য সঠিক ও হালনাগাদ রাখবে',
    'পণ্যের মান, উৎপাদন, সরবরাহ ও ডেলিভারির দায়ভার বহন করবে',
    'SRIJON-এর ব্র্যান্ড ইমেজ ক্ষুণ্ন করবে না',
    'আইনবিরোধী পণ্য/সেবা প্রচার করবে না'
  ]);

  // Section 4
  doc.fontSize(13)
     .fillColor('#1e293b')
     .font('Helvetica-Bold')
     .text('৪. আর্থিক বিষয়', { align: 'left' })
     .moveDown(0.4);

  addList([
    'সার্ভিস চার্জ / কমিশন প্রযোজ্য হতে পারে',
    'বিনিয়োগ সুবিধা পৃথক চুক্তিতে নির্ধারিত হবে'
  ]);

  // Section 5
  doc.fontSize(13)
     .fillColor('#1e293b')
     .font('Helvetica-Bold')
     .text('৫. মেধাস্বত্ব ও ব্র্যান্ড ব্যবহার', { align: 'left' })
     .moveDown(0.4);

  addList([
    'উদ্যোক্তা নিজস্ব মালিক থাকবে',
    'SRIJON প্রচারের উদ্দেশ্যে ব্র্যান্ড ব্যবহার করতে পারবে'
  ]);

  // Section 6
  doc.fontSize(13)
     .fillColor('#1e293b')
     .font('Helvetica-Bold')
     .text('৬. চুক্তির মেয়াদ ও বাতিল', { align: 'left' })
     .moveDown(0.4);

  addList([
    'স্বাক্ষরের তারিখ হতে কার্যকর',
    '৩০ দিনের নোটিশে বাতিলযোগ্য'
  ]);

  // Section 7
  doc.fontSize(13)
     .fillColor('#1e293b')
     .font('Helvetica-Bold')
     .text('৭. বিরোধ নিষ্পত্তি', { align: 'left' })
     .moveDown(0.4);

  addList([
    'পারস্পরিক আলোচনায় সমাধান',
    'প্রয়োজনে বাংলাদেশের আইন প্রযোজ্য'
  ]);

  // Section 8
  addSection(
    '৮',
    'চূড়ান্ত শর্ত',
    'এটি পূর্ণাঙ্গ সমঝোতা হিসেবে বিবেচিত হবে'
  );
};

/**
 * Add Completion Section - Entrepreneur Details + Blank Signature Lines
 */
const addCompletionSection = (doc, businessData, registrationDate, language) => {
  // Add new page if needed
  if (doc.y > 600) {
    doc.addPage();
  }

  // Divider
  doc.moveDown(1);
  doc.moveTo(72, doc.y)
     .lineTo(523, doc.y)
     .strokeColor('#e5e7eb')
     .lineWidth(1)
     .stroke()
     .moveDown(1.5);

  // Entrepreneur Section
  doc.fontSize(12)
     .fillColor('#1e293b')
     .font('Helvetica-Bold')
     .text(language === 'bn' ? 'উদ্যোক্তার পক্ষে' : 'On behalf of the Entrepreneur', { align: 'left' })
     .moveDown(0.8);

  // Entrepreneur Name
  doc.fontSize(10)
     .fillColor('#475569')
     .font('Helvetica')
     .text(`${language === 'bn' ? 'উদ্যোক্তার নাম' : 'Entrepreneur Name'}: `, { continued: true })
     .font('Helvetica-Bold')
     .text(businessData.ownerName || 'N/A')
     .moveDown(0.5);

  // Business Name
  doc.font('Helvetica')
     .text(`${language === 'bn' ? 'প্রতিষ্ঠানের নাম' : 'Business Name'}: `, { continued: true })
     .font('Helvetica-Bold')
     .text(businessData.brandName || businessData.registeredName || 'N/A')
     .moveDown(0.5);

  // Date
  doc.font('Helvetica')
     .text(`${language === 'bn' ? 'তারিখ' : 'Date'}: `, { continued: true })
     .font('Helvetica-Bold')
     .text(registrationDate)
     .moveDown(0.8);

  // Signature line
  doc.font('Helvetica')
     .text(`${language === 'bn' ? 'স্বাক্ষর' : 'Signature'}: `, { continued: true })
     .text('_______________________________________')
     .moveDown(2);

  // SRIJON Section
  doc.fontSize(12)
     .fillColor('#1e293b')
     .font('Helvetica-Bold')
     .text(language === 'bn' ? 'SRIJON-এর পক্ষে' : 'On behalf of SRIJON', { align: 'left' })
     .moveDown(0.8);

  // Name & Designation
  doc.fontSize(10)
     .fillColor('#475569')
     .font('Helvetica')
     .text(`${language === 'bn' ? 'নাম ও পদবি' : 'Name & Designation'}: `, { continued: true })
     .text('_______________________________')
     .moveDown(0.6);

  // Signature
  doc.text(`${language === 'bn' ? 'স্বাক্ষর' : 'Signature'}: `, { continued: true })
     .text('_______________________________________')
     .moveDown(0.6);

  // Date
  doc.text(`${language === 'bn' ? 'তারিখ' : 'Date'}: `, { continued: true })
     .text('_______________________________________')
     .moveDown(2);

  // Footer
  doc.moveTo(72, doc.y)
     .lineTo(523, doc.y)
     .strokeColor('#e5e7eb')
     .lineWidth(1)
     .stroke()
     .moveDown(0.5);

  doc.fontSize(9)
     .fillColor('#999')
     .font('Helvetica')
     .text(
       language === 'bn' 
         ? `তৈরির তারিখ: ${new Date().toLocaleDateString('bn-BD')}`
         : `Generated on: ${new Date().toLocaleString('en-GB')}`, 
       { align: 'center' }
     )
     .moveDown(0.2)
     .text('© SRIJON - Agricultural Entrepreneur Platform', { align: 'center' });
};

export default { generateAgreementPDF };
