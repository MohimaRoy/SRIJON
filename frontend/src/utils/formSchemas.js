/**
 * formSchemas.js
 * Zod validation schemas for each wizard step.
 * 
 * Usage:
 *   import { validateStep } from '../utils/formSchemas';
 *   const { success, errors } = validateStep(1, stepData);
 */

import { z } from 'zod';

// --------------------------------------------------
// Step 1: Basic Info
// --------------------------------------------------
const step1Schema = z.object({
  productType: z.string().min(1, 'Product type is required'),
  brandName: z.string().min(2, 'Brand name must be at least 2 characters'),
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
  ownerAge: z
    .union([z.string(), z.number()])
    .refine((v) => {
      const n = Number(v);
      return !isNaN(n) && n >= 18 && n <= 80;
    }, { message: 'Age must be between 18 and 80' }),
  gender: z.string().min(1, 'Please select a gender'),
  ownershipType: z.string().min(1, 'Please select an ownership type'),
  mobileNumber: z
    .string()
    .regex(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits'),
  email: z.string().email('Please enter a valid email address'),
  division: z.string().min(1, 'Division is required'),
  district: z.string().min(1, 'District is required'),
  thana: z.string().min(1, 'Thana is required'),
  postOffice: z.string().min(1, 'Post office is required'),
  postCode: z
    .string()
    .regex(/^[0-9]{4}$/, 'Post code must be exactly 4 digits'),
  detailedAddress: z.string().min(5, 'Please provide a detailed address')
});

// --------------------------------------------------
// Step 2: Product Details
// --------------------------------------------------
const step2Schema = z.object({
  productName: z.string().min(2, 'Product name is required'),
  shortDescription: z
    .string()
    .min(10, 'Description must be at least 10 characters'),
  wholesalePrice: z
    .union([z.string(), z.number()])
    .refine((v) => Number(v) > 0, { message: 'Wholesale price must be greater than 0' })
});

// --------------------------------------------------
// Step 3: Market & Business
// Note: Most fields are optional (buyer types, documents, banking).
// Only businessAge has a meaningful constraint.
// --------------------------------------------------
const step3Schema = z.object({
  businessAge: z
    .union([z.string(), z.number()])
    .refine((v) => {
      const n = Number(v);
      return !isNaN(n) && n >= 0;
    }, { message: 'Business age must be 0 or more' })
    .optional()
    .or(z.literal(''))
}).passthrough(); // Allow all other Step 3 fields through without validation


// --------------------------------------------------
// Step 4: Future Plans
// --------------------------------------------------
const step4Schema = z.object({
  futureGoals: z.string().min(10, 'Please describe your future goals (min 10 characters)')
});

// --------------------------------------------------
// Step 5: Media (all optional — user can skip)
// --------------------------------------------------
const step5Schema = z.object({}).passthrough();

// --------------------------------------------------
// Step 6: Review & Consent
// --------------------------------------------------
const step6Schema = z.object({
  consentAccuracy: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm the accuracy of your information' })
  }),
  digitalSignature: z.string().min(1, 'Digital signature is required')
});

// --------------------------------------------------
// Step schema map
// --------------------------------------------------
const schemaMap = {
  1: step1Schema,
  2: step2Schema,
  3: step3Schema,
  4: step4Schema,
  5: step5Schema,
  6: step6Schema
};

/**
 * Validate a wizard step's data.
 *
 * @param {number} step - Step number (1–6)
 * @param {object} data - The step's form data object
 * @returns {{ success: boolean, errors: Record<string, string> }}
 */
export const validateStep = (step, data) => {
  const schema = schemaMap[step];
  if (!schema) return { success: true, errors: {} };

  const result = schema.safeParse(data);
  if (result.success) return { success: true, errors: {} };

  // Flatten Zod issues into a simple { fieldName: message } map
  const errors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] || '_general';
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return { success: false, errors };
};
