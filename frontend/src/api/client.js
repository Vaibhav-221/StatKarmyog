/**
 * API client for the Skill Intelligence Platform.
 *
 * Each function tries the real FastAPI backend, then falls back
 * to mock data so the dashboard always renders something.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
});

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA — matches Pydantic schemas from app/schemas/schemas.py
// Modeled after OFF001 (Rakesh Kumar) from officer_profiles.json
// ═══════════════════════════════════════════════════════════════════════════

const MOCK_PROFILE = {
  officer_id: 'OFF001',
  name: 'Rakesh Kumar',
  designation: 'Junior Statistical Officer (JSO) - Industrial Statistics',
  role_id: 'R01',
  department: 'Industrial Statistics Division',
  experience_years: 3,
  qualification: 'M.Sc. Statistics',
  past_trainings: ['SSS Induction Training 2023'],
  current_skills: {
    'Survey Design': 2,
    Sampling: 2,
    'Industrial Statistics': 3,
    'Data Quality Frameworks': 1,
    Python: 1,
    SQL: 2,
    'Data Visualization': 1,
    'Data Privacy': 1,
    Communication: 3,
    Ethics: 3,
  },
};

const MOCK_GAPS = {
  officer_id: 'OFF001',
  role_id: 'R01',
  gaps: [
    { skill: 'Survey Design',           current_level: 2, expected_level: 3, gap_size: 1, score_source: 'profile-fallback', confidence_level: 'profile-only' },
    { skill: 'Data Quality Frameworks',  current_level: 1, expected_level: 2, gap_size: 1, score_source: 'profile-fallback', confidence_level: 'profile-only' },
    { skill: 'Industrial Statistics',    current_level: 3, expected_level: 4, gap_size: 1, score_source: 'profile-fallback', confidence_level: 'profile-only' },
    { skill: 'Data Visualization',       current_level: 1, expected_level: 3, gap_size: 2, score_source: 'profile-fallback', confidence_level: 'profile-only' },
    { skill: 'Python',                   current_level: 1, expected_level: 2, gap_size: 1, score_source: 'profile-fallback', confidence_level: 'profile-only' },
    { skill: 'Data Privacy',             current_level: 1, expected_level: 2, gap_size: 1, score_source: 'profile-fallback', confidence_level: 'profile-only' },
    { skill: 'Sampling',                 current_level: 2, expected_level: 2, gap_size: 0, score_source: 'profile-fallback', confidence_level: 'profile-only' },
    { skill: 'SQL',                      current_level: 2, expected_level: 2, gap_size: 0, score_source: 'profile-fallback', confidence_level: 'profile-only' },
    { skill: 'Communication',            current_level: 3, expected_level: 3, gap_size: 0, score_source: 'profile-fallback', confidence_level: 'profile-only' },
    { skill: 'Ethics',                   current_level: 3, expected_level: 3, gap_size: 0, score_source: 'profile-fallback', confidence_level: 'profile-only' },
  ],
};

const MOCK_RECOMMENDATIONS = [
  { course_id: 'C009', course_title: 'Advanced Python for Data Science',                   semantic_score: 0.95, tag_overlap_score: 1.0, final_score: 0.97, matched_skills: ['Python', 'Data Visualization'] },
  { course_id: 'C022', course_title: 'Industrial Statistics Deep Dive',                    semantic_score: 0.88, tag_overlap_score: 0.80, final_score: 0.85, matched_skills: ['Industrial Statistics'] },
  { course_id: 'C001', course_title: 'Database Management and Data Visualization',         semantic_score: 0.82, tag_overlap_score: 0.90, final_score: 0.85, matched_skills: ['Data Visualization', 'SQL'] },
  { course_id: 'C003', course_title: 'SSS Induction Training - Core Statistics',           semantic_score: 0.78, tag_overlap_score: 0.70, final_score: 0.75, matched_skills: ['Survey Design', 'Sampling'] },
  { course_id: 'C082', course_title: 'Big Data, AI with Python, ML, AI-ready Data',        semantic_score: 0.72, tag_overlap_score: 0.60, final_score: 0.67, matched_skills: ['Python', 'Data Quality Frameworks'] },
];

const MOCK_ENROLLMENTS = [
  { enrollment_id: 'E0001', officer_id: 'OFF001', course_id: 'C009', course_title: 'Advanced Python for Data Science',                           status: 'Completed',   enrolled_date: '2026-04-10', progress_percent: 100, completion_date: '2026-09-01' },
  { enrollment_id: 'E0002', officer_id: 'OFF001', course_id: 'C022', course_title: 'Industrial Statistics Deep Dive',                            status: 'In-Progress', enrolled_date: '2026-05-15', progress_percent: 30,  completion_date: null },
  { enrollment_id: 'E0003', officer_id: 'OFF001', course_id: 'C082', course_title: 'Big Data, AI with Python, ML, AI-ready Data (ISS Probationary)', status: 'Enrolled',    enrolled_date: '2026-06-20', progress_percent: 0,   completion_date: null },
  { enrollment_id: 'E0004', officer_id: 'OFF001', course_id: 'C001', course_title: 'Database Management and Data Visualization',                 status: 'Completed',   enrolled_date: '2026-07-25', progress_percent: 100, completion_date: '2026-09-01' },
  { enrollment_id: 'E0005', officer_id: 'OFF001', course_id: 'C003', course_title: 'SSS Induction Training - Core Statistics',                   status: 'In-Progress', enrolled_date: '2026-08-05', progress_percent: 30,  completion_date: null },
];

const MOCK_PASSPORT = {
  officer_id: 'OFF001',
  competencies: [
    {
      cid: 'CID-F-201',
      skill_label: 'Python',
      history: [
        { recorded_on: '2026-08-20', combined_score: 1.5, confidence_level: 'low (1 source)', source: 'baseline_quiz' },
        { recorded_on: '2026-09-02', combined_score: 3.5, confidence_level: 'low (1 source)', source: 'quiz_after_course_C078' },
      ],
      latest_score: 3.5,
      first_score: 1.5,
      improved: true,
      delta: 2.0,
    },
    {
      cid: 'CID-D-101',
      skill_label: 'Survey Design',
      history: [
        { recorded_on: '2026-08-20', combined_score: 2.0, confidence_level: 'low (1 source)', source: 'baseline_quiz' },
        { recorded_on: '2026-09-05', combined_score: 2.6, confidence_level: 'medium (2 sources)', source: 'quiz_plus_artifact' },
      ],
      latest_score: 2.6,
      first_score: 2.0,
      improved: true,
      delta: 0.6,
    },
    {
      cid: 'CID-D-107',
      skill_label: 'Industrial Statistics',
      history: [
        { recorded_on: '2026-08-22', combined_score: 3.0, confidence_level: 'low (1 source)', source: 'baseline_quiz' },
      ],
      latest_score: 3.0,
      first_score: 3.0,
      improved: null,
      delta: 0.0,
    },
    {
      cid: 'CID-D-110',
      skill_label: 'Data Quality Frameworks',
      history: [
        { recorded_on: '2026-08-15', combined_score: 2.5, confidence_level: 'low (1 source)', source: 'baseline_quiz' },
        { recorded_on: '2026-09-01', combined_score: 1.8, confidence_level: 'low (1 source)', source: 'quiz_reassessment' },
      ],
      latest_score: 1.8,
      first_score: 2.5,
      improved: false,
      delta: -0.7,
    },
  ],
};

// Mock profiles for the officer selector on Login
export const MOCK_OFFICERS = [
  { officer_id: 'OFF001', name: 'Rakesh Kumar',          designation: 'JSO - Industrial Statistics',     department: 'Industrial Statistics Division',   role: 'officer' },
  { officer_id: 'OFF002', name: 'Sunita Verma',          designation: 'SSO - Price Statistics',           department: 'Price Statistics Division',         role: 'officer' },
  { officer_id: 'OFF003', name: 'Arjun Nair',            designation: 'ISS Officer - Labour Statistics',  department: 'Labour Statistics Division',        role: 'officer' },
  { officer_id: 'OFF004', name: 'Priya Deshmukh',        designation: 'SO - GIS & Spatial Data',          department: 'Agricultural Statistics Division',  role: 'officer' },
  { officer_id: 'OFF005', name: 'Vikram Singh Rathore',  designation: 'Deputy Director - DIID',           department: 'DIID',                             role: 'officer' },
  { officer_id: 'OFF006', name: 'Ananya Iyer',           designation: 'JSO - Industrial Statistics',      department: 'Industrial Statistics Division',    role: 'officer' },
  { officer_id: 'ADM001', name: 'Dr. Meena Agarwal',    designation: 'Director — Training & Analytics',  department: 'MoSPI / NSSTA',                    role: 'admin' },
];

// ═══════════════════════════════════════════════════════════════════════════
// API FUNCTIONS  — each tries the real endpoint, falls back to mock
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch full officer profile.
 * @param {string} officerId
 * @returns {Promise<{data: object, isMock: boolean}>}
 */
export async function getOfficerProfile(officerId) {
  try {
    const res = await api.get(`/api/officers/${officerId}`);
    return { data: res.data, isMock: false };
  } catch {
    console.warn(`[API] Officer profile fallback to mock for ${officerId}`);
    // If we have the default mock, use it; otherwise adapt the ID
    return { data: { ...MOCK_PROFILE, officer_id: officerId }, isMock: true };
  }
}

/**
 * Fetch gap analysis for an officer.
 * @param {string} officerId
 * @returns {Promise<{data: object, isMock: boolean}>}
 */
export async function getGapAnalysis(officerId) {
  try {
    const res = await api.get(`/api/officers/${officerId}/gaps`);
    return { data: res.data, isMock: false };
  } catch {
    console.warn(`[API] Gap analysis fallback to mock for ${officerId}`);
    return { data: { ...MOCK_GAPS, officer_id: officerId }, isMock: true };
  }
}

/**
 * Fetch hybrid semantic course recommendations.
 * @param {string} officerId
 * @returns {Promise<{data: object[], isMock: boolean}>}
 */
export async function getRecommendations(officerId) {
  try {
    const res = await api.get(`/api/officers/${officerId}/recommendations/semantic`, {
      params: { top_n: 6 },
    });
    return { data: res.data, isMock: false };
  } catch {
    console.warn(`[API] Recommendations fallback to mock for ${officerId}`);
    return { data: MOCK_RECOMMENDATIONS, isMock: true };
  }
}

/**
 * Fetch enrollment records for an officer.
 * @param {string} officerId
 * @returns {Promise<{data: object[], isMock: boolean}>}
 */
export async function getEnrollments(officerId) {
  try {
    const res = await api.get(`/api/officers/${officerId}/enrollments`);
    return { data: res.data, isMock: false };
  } catch {
    console.warn(`[API] Enrollments fallback to mock for ${officerId}`);
    return { data: MOCK_ENROLLMENTS, isMock: true };
  }
}

/**
 * Fetch Competency Passport history for an officer.
 * @param {string} officerId
 * @returns {Promise<{data: object, isMock: boolean}>}
 */
export async function getPassportSummary(officerId) {
  try {
    const res = await api.get(`/api/passport/${officerId}`);
    return { data: res.data, isMock: false };
  } catch {
    console.warn(`[API] Passport summary fallback to mock for ${officerId}`);
    return { data: { ...MOCK_PASSPORT, officer_id: officerId }, isMock: true };
  }
}

/**
 * Trigger re-assessment for a competency.
 * @param {string} officerId
 * @param {string} cid
 * @returns {Promise<{data: object, isMock: boolean}>}
 */
export async function triggerReassessment(officerId, cid) {
  try {
    const res = await api.post(`/api/passport/${officerId}/reassess`, { cid });
    return { data: res.data, isMock: false };
  } catch {
    console.warn(`[API] Reassessment trigger fallback to mock for ${officerId}`);
    return {
      data: {
        cid,
        recommended_action: 'retake_quiz',
        message: "Re-assessment ready. Route officer to quiz generation for this competency's linked course material.",
      },
      isMock: true,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN API FUNCTIONS — mock data for Phase 6, real fetch in Phase 6B
// ═══════════════════════════════════════════════════════════════════════════

import {
  MOCK_GAP_SUMMARY,
  MOCK_TRAINING_EFFECTIVENESS,
  MOCK_DEPARTMENT_SUMMARY,
} from './adminMockData';

/**
 * Fetch org-wide gap summary for admin analytics.
 * Phase 6B: GET /api/admin/gap-summary
 * @param {string} [department]
 * @returns {Promise<{data: object[], note?: string, isMock: boolean}>}
 */
export async function getGapSummary(department) {
  try {
    const params = department ? { department } : {};
    const res = await api.get('/api/admin/gap-summary', { params });
    const items = Array.isArray(res.data) ? res.data : (res.data.items || []);
    return { data: items, note: res.data.note, isMock: false };
  } catch {
    return { data: MOCK_GAP_SUMMARY, isMock: true };
  }
}

/**
 * Fetch training effectiveness data for admin analytics.
 * Phase 6B: GET /api/admin/training-effectiveness
 * @returns {Promise<{data: object[], message?: string, note?: string, isMock: boolean}>}
 */
export async function getTrainingEffectiveness() {
  try {
    const res = await api.get('/api/admin/training-effectiveness');
    const items = Array.isArray(res.data) ? res.data : (res.data.items || []);
    return { data: items, message: res.data.message, note: res.data.note, isMock: false };
  } catch {
    return { data: MOCK_TRAINING_EFFECTIVENESS, isMock: true };
  }
}

/**
 * Fetch department summary for admin analytics.
 * Phase 6B: GET /api/admin/department-summary
 * @returns {Promise<{data: object[], note?: string, isMock: boolean}>}
 */
export async function getDepartmentSummary() {
  try {
    const res = await api.get('/api/admin/department-summary');
    const items = Array.isArray(res.data) ? res.data : (res.data.items || []);
    return { data: items, note: res.data.note, isMock: false };
  } catch {
    return { data: MOCK_DEPARTMENT_SUMMARY, isMock: true };
  }
}

/**
 * Upload work artifact for evidence analysis.
 * @param {FormData} formData
 * @returns {Promise<{data: object, isMock: boolean}>}
 */
export async function uploadArtifact(formData) {
  try {
    const res = await api.post('/api/artifacts/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { data: res.data, isMock: false };
  } catch {
    return {
      data: {
        document_name: formData.get('file')?.name || 'Sampling_Plan.pdf',
        detected_competencies: [
          { name: 'Sampling Methodology', score: 78 },
          { name: 'Survey Design', score: 72 },
          { name: 'Data Quality', score: 64 },
        ],
        confidence: 'High',
        summary: 'AI-assisted competency evidence detected related to sampling strategy, sample selection, and survey design.',
      },
      isMock: true,
    };
  }
}

/**
 * Generate AI quiz from uploaded file or material via backend API.
 * @param {FormData} formData
 * @returns {Promise<{data: object, isMock: boolean}>}
 */
export async function generateQuizApi(formData) {
  try {
    const res = await api.post('/api/quiz/generate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { data: res.data, isMock: false };
  } catch {
    return {
      data: {
        attempt_id: 'ATT-DEMO-' + Date.now(),
        questions: [
          {
            question_id: 'Q1',
            text: 'Which sampling method is most appropriate when the population is divided into distinct subgroups (strata)?',
            options: ['Simple Random Sampling', 'Stratified Random Sampling', 'Systematic Sampling', 'Cluster Sampling'],
            cid: 'CID-D-102',
            skill_label: 'Sampling Methodology',
          },
          {
            question_id: 'Q2',
            text: 'In official statistical sample surveys, what does Primary Sampling Unit (PSU) refer to?',
            options: ['The final individual household surveyed', 'The first-stage sampling unit, such as a census village or urban block', 'The non-sampling error rate', 'The variance multiplier'],
            cid: 'CID-D-102',
            skill_label: 'Sampling Methodology',
          },
        ],
      },
      isMock: true,
    };
  }
}

/**
 * Submit quiz answers to backend API.
 * @param {object} payload - { attempt_id, officer_id, answers }
 * @returns {Promise<{data: object, isMock: boolean}>}
 */
export async function submitQuizApi(payload) {
  try {
    const res = await api.post('/api/quiz/submit', payload);
    return { data: res.data, isMock: false };
  } catch {
    return {
      data: {
        attempt_id: payload.attempt_id || 'ATT-DEMO',
        total_questions: 10,
        correct_count: 8,
        score_percent: 80.0,
        passed: true,
        score_summaries: [
          { cid: 'CID-D-102', skill_label: 'Sampling Methodology', quiz_score: 80.0, artifact_score: 78.0, combined_score: 79.2, confidence_level: 'medium (2 sources)' },
        ],
      },
      isMock: true,
    };
  }
}

export default api;

