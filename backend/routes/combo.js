import express from 'express';
import {
  createCombo,
  updateCombo,
  deleteCombo,
  getAllCombosAdmin,
  getPublicCombos,
  getComboDetail,
  checkMonthlyComboStatus,
} from '../controllers/comboController.js';
import { protect, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// ── SPECIFIC NAMED PATHS first (must come BEFORE /:id wildcard) ──────────────
router.get('/admin/all', protect, requireAdmin, getAllCombosAdmin);   // full data
router.get('/user/monthly-check', protect, checkMonthlyComboStatus); // customer check

// ── PUBLIC ROUTES ─────────────────────────────────────────────────────────────
router.get('/', getPublicCombos);     // GET /api/combos
router.get('/:id', getComboDetail);   // GET /api/combos/:id  (sanitized — no item prices)

// ── ADMIN CRUD ─────────────────────────────────────────────────────────────────
router.post('/', protect, requireAdmin, createCombo);                  // create
router.put('/:id', protect, requireAdmin, updateCombo);               // update
router.delete('/:id', protect, requireAdmin, deleteCombo);            // delete

export default router;
