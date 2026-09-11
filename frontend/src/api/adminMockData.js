/**
 * Admin Dashboard — Mock Data.
 *
 * Response shapes match Phase 6B's planned endpoints:
 *   GET /api/admin/gap-summary
 *   GET /api/admin/training-effectiveness
 *   GET /api/admin/department-summary
 *
 * Swap these with real fetch calls in Phase 6B — no component changes needed.
 */

// ── Gap Summary ──────────────────────────────────────────────────────────────
// Each entry = one competency across the org.
export const MOCK_GAP_SUMMARY = [
  {
    cid: 'CID-D-101',
    skill_label: 'Survey Design',
    officer_count: 42,
    avg_current_level: 2.3,
    avg_required_level: 3.5,
    avg_gap: 1.2,
    officers_below_required: 28,
  },
  {
    cid: 'CID-D-102',
    skill_label: 'Sampling Techniques',
    officer_count: 42,
    avg_current_level: 2.8,
    avg_required_level: 3.0,
    avg_gap: 0.2,
    officers_below_required: 8,
  },
  {
    cid: 'CID-D-107',
    skill_label: 'Industrial Statistics',
    officer_count: 18,
    avg_current_level: 2.6,
    avg_required_level: 4.0,
    avg_gap: 1.4,
    officers_below_required: 15,
  },
  {
    cid: 'CID-D-110',
    skill_label: 'Data Quality Frameworks',
    officer_count: 42,
    avg_current_level: 1.9,
    avg_required_level: 3.0,
    avg_gap: 1.1,
    officers_below_required: 31,
  },
  {
    cid: 'CID-F-201',
    skill_label: 'Python Programming',
    officer_count: 42,
    avg_current_level: 1.6,
    avg_required_level: 2.5,
    avg_gap: 0.9,
    officers_below_required: 29,
  },
  {
    cid: 'CID-F-202',
    skill_label: 'SQL & Databases',
    officer_count: 42,
    avg_current_level: 2.4,
    avg_required_level: 2.5,
    avg_gap: 0.1,
    officers_below_required: 6,
  },
  {
    cid: 'CID-F-203',
    skill_label: 'Data Visualization',
    officer_count: 42,
    avg_current_level: 1.8,
    avg_required_level: 3.0,
    avg_gap: 1.2,
    officers_below_required: 30,
  },
  {
    cid: 'CID-F-204',
    skill_label: 'Data Privacy & Ethics',
    officer_count: 42,
    avg_current_level: 2.1,
    avg_required_level: 2.5,
    avg_gap: 0.4,
    officers_below_required: 14,
  },
  {
    cid: 'CID-G-301',
    skill_label: 'Communication & Reporting',
    officer_count: 42,
    avg_current_level: 3.1,
    avg_required_level: 3.0,
    avg_gap: 0.0,
    officers_below_required: 3,
  },
  {
    cid: 'CID-G-302',
    skill_label: 'GIS & Spatial Data',
    officer_count: 12,
    avg_current_level: 1.5,
    avg_required_level: 3.5,
    avg_gap: 2.0,
    officers_below_required: 11,
  },
];

// ── Training Effectiveness ───────────────────────────────────────────────────
// Includes declined_count > 0 for realism — not everything improves after training.
export const MOCK_TRAINING_EFFECTIVENESS = [
  {
    cid: 'CID-F-201',
    skill_label: 'Python Programming',
    officers_reassessed: 18,
    avg_improvement: 1.3,
    improved_count: 14,
    declined_count: 2,
    no_change_count: 2,
  },
  {
    cid: 'CID-D-101',
    skill_label: 'Survey Design',
    officers_reassessed: 22,
    avg_improvement: 0.8,
    improved_count: 16,
    declined_count: 3,
    no_change_count: 3,
  },
  {
    cid: 'CID-D-107',
    skill_label: 'Industrial Statistics',
    officers_reassessed: 10,
    avg_improvement: 0.5,
    improved_count: 6,
    declined_count: 1,
    no_change_count: 3,
  },
  {
    cid: 'CID-F-203',
    skill_label: 'Data Visualization',
    officers_reassessed: 15,
    avg_improvement: 1.1,
    improved_count: 11,
    declined_count: 2,
    no_change_count: 2,
  },
  {
    cid: 'CID-D-110',
    skill_label: 'Data Quality Frameworks',
    officers_reassessed: 12,
    avg_improvement: 0.4,
    improved_count: 5,
    declined_count: 4,
    no_change_count: 3,
  },
  {
    cid: 'CID-F-204',
    skill_label: 'Data Privacy & Ethics',
    officers_reassessed: 8,
    avg_improvement: 0.6,
    improved_count: 5,
    declined_count: 1,
    no_change_count: 2,
  },
  {
    cid: 'CID-G-302',
    skill_label: 'GIS & Spatial Data',
    officers_reassessed: 6,
    avg_improvement: 0.9,
    improved_count: 4,
    declined_count: 2,
    no_change_count: 0,
  },
];

// ── Department Summary ───────────────────────────────────────────────────────
export const MOCK_DEPARTMENT_SUMMARY = [
  {
    department: 'Industrial Statistics Division',
    officer_count: 12,
    avg_gap_across_all_skills: 1.1,
  },
  {
    department: 'Price Statistics Division',
    officer_count: 8,
    avg_gap_across_all_skills: 0.7,
  },
  {
    department: 'Labour Statistics Division',
    officer_count: 6,
    avg_gap_across_all_skills: 0.9,
  },
  {
    department: 'Agricultural Statistics Division',
    officer_count: 5,
    avg_gap_across_all_skills: 1.3,
  },
  {
    department: 'DIID',
    officer_count: 4,
    avg_gap_across_all_skills: 0.5,
  },
  {
    department: 'National Accounts Division',
    officer_count: 4,
    avg_gap_across_all_skills: 0.8,
  },
  {
    department: 'Social Statistics Division',
    officer_count: 3,
    avg_gap_across_all_skills: 1.5,
  },
];
