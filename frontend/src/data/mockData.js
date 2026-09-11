/**
 * Centralized mock data layer for STATKARMAYOG prototype.
 *
 * Models the data architecture:
 * Officer -> Role -> Activity -> Competency -> WorkArtifact -> Assessment -> CompetencyScore -> Passport
 */

export const MOCK_OFFICER_PROFILE = {
  officer_id: 'OFF001',
  name: 'Karun Nayar',
  designation: 'Statistical Officer',
  department: 'Statistical Division',
  experience_years: 5,
  qualification: 'M.Sc. Applied Statistics & Econometrics',
  primary_domain: 'Official Statistics & Survey Operations',
  role_id: 'R01',
  current_kpis: {
    current_competency: 68,
    required_competency: 82,
    competency_gap: 14,
    learning_progress: 64,
  },
  role_details: {
    role_title: 'Statistical Officer',
    activities: [
      'Survey planning & questionnaire design',
      'Field data collection oversight & sampling selection',
      'Statistical analysis & data validation',
      'Data quality review & statistical metadata framing',
    ],
    required_competencies: [
      { cid: 'CID-D-101', name: 'Survey Design', required: 85, current: 78, gap: 7, status: 'Near Target' },
      { cid: 'CID-D-102', name: 'Sampling Methodology', required: 85, current: 54, gap: 31, status: 'High Gap' },
      { cid: 'CID-D-110', name: 'Data Quality', required: 80, current: 72, gap: 8, status: 'Near Target' },
      { cid: 'CID-D-105', name: 'Statistical Analysis', required: 80, current: 63, gap: 17, status: 'Moderate Gap' },
      { cid: 'CID-F-201', name: 'Python/Data Processing', required: 70, current: 68, gap: 2, status: 'Near Target' },
    ],
  },
};

export const MOCK_RADAR_DATA = [
  { subject: 'Survey Design', current: 78, required: 85, fullMark: 100 },
  { subject: 'Sampling Methodology', current: 54, required: 85, fullMark: 100 },
  { subject: 'Data Quality', current: 72, required: 80, fullMark: 100 },
  { subject: 'Statistical Analysis', current: 63, required: 80, fullMark: 100 },
  { subject: 'Python/Data Processing', current: 68, required: 70, fullMark: 100 },
];

export const MOCK_GAP_TABLE = [
  { key: '1', cid: 'CID-D-101', competency: 'Survey Design', required: 85, current: 78, gap: 7, status: 'Near Target', confidence: 'High', knowledge: 80, artifact: 75 },
  { key: '2', cid: 'CID-D-102', competency: 'Sampling Methodology', required: 85, current: 54, gap: 31, status: 'High Gap', confidence: 'Medium', knowledge: 50, artifact: 60 },
  { key: '3', cid: 'CID-D-110', competency: 'Data Quality', required: 80, current: 72, gap: 8, status: 'Near Target', confidence: 'High', knowledge: 75, artifact: 68 },
  { key: '4', cid: 'CID-D-105', competency: 'Statistical Analysis', required: 80, current: 63, gap: 17, status: 'Moderate Gap', confidence: 'Medium', knowledge: 65, artifact: 60 },
  { key: '5', cid: 'CID-F-201', competency: 'Python/Data Processing', required: 70, current: 68, gap: 2, status: 'Near Target', confidence: 'High', knowledge: 70, artifact: 65 },
];

export const MOCK_RECENT_EVIDENCE = [
  {
    id: 'ART001',
    document_name: 'Sampling_Plan.pdf',
    upload_date: '2026-09-08',
    status: 'Analyzed',
    confidence: 'High',
    competencies_detected: ['Sampling Methodology', 'Survey Design'],
    scores: { 'Sampling Methodology': 78, 'Survey Design': 72 },
    summary: 'Contains detailed evidence of multi-stage stratified sampling design, PSU allocation, and sample weight calculations.',
  },
  {
    id: 'ART002',
    document_name: 'Data_Quality_Report.pdf',
    upload_date: '2026-09-02',
    status: 'Analyzed',
    confidence: 'High',
    competencies_detected: ['Data Quality', 'Statistical Analysis'],
    scores: { 'Data Quality': 82, 'Statistical Analysis': 68 },
    summary: 'Includes audit framework for non-sampling error detection and data validation routines.',
  },
  {
    id: 'ART003',
    document_name: 'Survey_Design_Draft.pdf',
    upload_date: '2026-08-28',
    status: 'Analyzed',
    confidence: 'Medium',
    competencies_detected: ['Survey Design'],
    scores: { 'Survey Design': 75 },
    summary: 'Questionnaire design document for annual enterprise survey.',
  },
];

export const MOCK_RECOMMENDED_COURSES = [
  {
    course_id: 'C022',
    title: 'Sampling Methods in Official Statistics',
    provider: 'iGOT Karmayogi / NSSTA',
    competency: 'Sampling Methodology',
    gap: 31,
    difficulty: 'Intermediate',
    duration: '6 Hours',
    reason: 'Recommended because your current competency is below the required level.',
    progress: 0,
    status: 'Not Started',
  },
  {
    course_id: 'C015',
    title: 'Advanced Statistical Data Validation',
    provider: 'NSSTA Academy',
    competency: 'Statistical Analysis',
    gap: 17,
    difficulty: 'Advanced',
    duration: '4.5 Hours',
    reason: 'Targets your moderate gap in statistical data validation.',
    progress: 30,
    status: 'In-Progress',
  },
  {
    course_id: 'C009',
    title: 'Python for Statistical Computing & Automation',
    provider: 'iGOT Karmayogi',
    competency: 'Python/Data Processing',
    gap: 2,
    difficulty: 'Intermediate',
    duration: '8 Hours',
    reason: 'Refine efficiency in automated data processing.',
    progress: 100,
    status: 'Completed',
  },
];

export const MOCK_PASSPORT_DATA = {
  officer_name: 'Karun Nayar',
  role: 'Statistical Officer',
  department: 'Statistical Division',
  competencies: [
    {
      cid: 'CID-D-102',
      skill_label: 'Sampling Methodology',
      current_score: 82,
      required_score: 85,
      previous_score: 54,
      improvement: 28,
      confidence: 'High',
      evidence_checkmarks: {
        knowledge_assessment: true,
        work_artifact: true,
        ai_quiz: true,
        reassessment: true,
      },
      history: [
        { month: 'June', score: 54 },
        { month: 'July', score: 61 },
        { month: 'August', score: 72 },
        { month: 'September', score: 82 },
      ],
    },
    {
      cid: 'CID-D-101',
      skill_label: 'Survey Design',
      current_score: 78,
      required_score: 85,
      previous_score: 70,
      improvement: 8,
      confidence: 'High',
      evidence_checkmarks: {
        knowledge_assessment: true,
        work_artifact: true,
        ai_quiz: true,
        reassessment: false,
      },
      history: [
        { month: 'June', score: 70 },
        { month: 'July', score: 72 },
        { month: 'August', score: 75 },
        { month: 'September', score: 78 },
      ],
    },
    {
      cid: 'CID-D-110',
      skill_label: 'Data Quality',
      current_score: 72,
      required_score: 80,
      previous_score: 65,
      improvement: 7,
      confidence: 'High',
      evidence_checkmarks: {
        knowledge_assessment: true,
        work_artifact: true,
        ai_quiz: false,
        reassessment: false,
      },
      history: [
        { month: 'June', score: 65 },
        { month: 'July', score: 68 },
        { month: 'August', score: 70 },
        { month: 'September', score: 72 },
      ],
    },
  ],
};

export const MOCK_PROGRESS_DATA = {
  initial_gap: 31,
  current_gap: 3,
  gap_reduction: 28,
  overall_trend: [
    { label: 'Week 1', gap: 31, score: 54 },
    { label: 'Week 2', gap: 24, score: 61 },
    { label: 'Week 3', gap: 13, score: 72 },
    { label: 'Week 4', gap: 3, score: 82 },
  ],
};

export const MOCK_ADMIN_INTELLIGENCE = {
  kpis: {
    total_officers: 142,
    active_learners: 118,
    avg_competency: 74,
    avg_improvement: 18.5,
  },
  top_gaps: [
    { competency: 'Sampling Methodology', gap: 26, officers: 64 },
    { competency: 'Data Quality Frameworks', gap: 21, officers: 48 },
    { competency: 'Statistical Analysis', gap: 16, officers: 38 },
    { competency: 'Python/Data Processing', gap: 12, officers: 29 },
  ],
  pre_post_improvement: [
    { competency: 'Sampling Methodology', pre: 52, post: 78, improvement: 26 },
    { competency: 'Survey Design', pre: 68, post: 82, improvement: 14 },
    { competency: 'Data Quality', pre: 60, post: 76, improvement: 16 },
    { competency: 'Statistical Analysis', pre: 58, post: 72, improvement: 14 },
  ],
  demand_insights: 'Sampling Methodology appears as a recurring competency gap across the selected prototype cohort.',
};
