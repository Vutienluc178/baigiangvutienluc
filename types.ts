
export enum DifficultyLevel {
  VERY_EASY = 'Rất dễ (Nhận biết)',
  EASY = 'Dễ (Thông hiểu)',
  MEDIUM = 'Trung bình (Vận dụng)',
  HARD = 'Khó (Vận dụng cao)',
  VERY_HARD = 'Rất khó (Xuất sắc)',
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'Trắc nghiệm (4 chọn 1)',
  TRUE_FALSE = 'Trắc nghiệm Đúng/Sai',
  ESSAY = 'Tự luận',
  MIXED = 'Kết hợp (TN + Đúng/Sai + Tự luận)',
}

export enum Subject {
  MATH = 'Toán',
  PHYSICS = 'Vật Lý',
  CHEMISTRY = 'Hóa Học',
  BIOLOGY = 'Sinh Học',
  INFORMATICS = 'Tin Học',
  LITERATURE = 'Ngữ Văn',
  HISTORY = 'Lịch Sử',
  GEOGRAPHY = 'Địa Lý',
  ENGLISH = 'Tiếng Anh',
  GDCD = 'GDCD',
  SCIENCE = 'KHTN',
  CLASS_MEETING = 'Sinh hoạt lớp',
  LIFE_SKILLS = 'Kỹ năng sống',
  CAREER_GUIDANCE = 'Trải nghiệm hướng nghiệp',
}

export type GenMode = 'exam' | 'matrix' | 'theory' | 'polya';

export type DifferentiationLevel = 'Cơ bản' | 'Nâng cao' | 'Vận dụng';

export interface DifferentiationPlan {
  basic?: string[];
  advanced?: string[];
  application?: string[];
}

export interface MatrixRow {
  topic: string;
  level: DifficultyLevel;
  count: number;
  type: QuestionType;
  essayRequirements?: string; // Specific requirements for essay questions in this row
}

export interface ExamConfig {
  mode: GenMode;
  subject: Subject | string;
  grade: string;
  topic: string; // Used for single topic mode or as a title for matrix mode
  creatorRole?: string; // Role of the person creating the exam
  essayRequirements?: string; // Global requirements for essay questions
  // Exam specific (Single Mode)
  questionType?: QuestionType;
  questionCount?: number;
  difficultyMode?: 'progressive' | 'fixed';
  targetLevel?: DifficultyLevel;
  // Matrix Mode
  matrixRows?: MatrixRow[];
  
  includeHints?: boolean;
  // Multimodal support
  uploadedFile?: {
    data: string; // base64 string
    mimeType: string;
  } | null;
}

export interface Question {
  id: number;
  content: string;
  type: QuestionType;
  difficulty: string; // e.g., "Nhận biết", "Vận dụng"
  differentiation?: DifferentiationLevel;
  options?: string[]; // For multiple choice
  correctAnswer: string;
  solution: string; // Detailed explanation
  hints?: string[]; // Step-by-step hints
  rubric?: string[]; // Short rubric for essay
  openAnswerGuidance?: string; // Open-answer guidance for essay
}

export interface ExamMatrix {
  title?: string;
  warmup?: WarmupSlide;
  keyConcepts?: string; // New field for Core Knowledge/Formulas
  objectives?: string[]; // Learning objectives
  competencies?: string[]; // Competencies/skills
  differentiation?: DifferentiationPlan; // Differentiation guidance
  summary: string;
  questions: Question[];
}

// Structures for Study Guide (Theory & Examples)
export interface Example {
  problem: string;
  solution: string;
  explanation: string;
}

export interface WarmupSlide {
  question: string;
  imageUrl: string;
  imagePrompt?: string;
}

export interface TheorySection {
  title: string;
  objectives?: string[];
  competencies?: string[];
  differentiationLevel?: DifferentiationLevel;
  content: string; // Bullet points or paragraphs with LaTeX
  examples: Example[];
  guidingQuestions?: string[];
  activities?: string[]; // e.g., think-pair-share, exit ticket
}

export interface StudyGuideData {
  topic: string;
  overview: string;
  warmup?: WarmupSlide;
  objectives?: string[];
  competencies?: string[];
  differentiation?: DifferentiationPlan;
  exitTicket?: string[];
  sections: TheorySection[];
}

// Structures for Polya Method
export interface PolyaStep {
  stepName: string; // e.g., "Bước 1: Tìm hiểu đề bài"
  icon: 'search' | 'map' | 'wrench' | 'check';
  content: string; // LaTeX supported content
  keyPoints?: string[]; // Highlights
}

export interface PolyaData {
  title: string;
  problem: string;
  steps: PolyaStep[];
}

// Data structure for Export/Import
export interface ExportData {
  type: GenMode;
  timestamp: number;
  config: ExamConfig;
  data: ExamMatrix | StudyGuideData | PolyaData;
}
