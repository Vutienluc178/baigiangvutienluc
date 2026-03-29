
import { Subject, DifficultyLevel, QuestionType } from './types';

export const SUBJECTS = [
  Subject.MATH,
  Subject.PHYSICS,
  Subject.CHEMISTRY,
  Subject.BIOLOGY,
  Subject.INFORMATICS,
  Subject.SCIENCE,
  Subject.ENGLISH,
  Subject.LITERATURE,
  Subject.HISTORY,
  Subject.GEOGRAPHY,
  Subject.GDCD,
  Subject.CLASS_MEETING,
  Subject.LIFE_SKILLS,
  Subject.CAREER_GUIDANCE,
];

export const GRADES = [
  'Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5',
  'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9',
  'Lớp 10', 'Lớp 11', 'Lớp 12', 'Ôn thi THPT QG'
];

export const DIFFICULTY_LEVELS = [
  DifficultyLevel.VERY_EASY,
  DifficultyLevel.EASY,
  DifficultyLevel.MEDIUM,
  DifficultyLevel.HARD,
  DifficultyLevel.VERY_HARD,
];

export const QUESTION_TYPES = [
  QuestionType.MULTIPLE_CHOICE,
  QuestionType.TRUE_FALSE,
  QuestionType.ESSAY,
  QuestionType.MIXED,
];

export const CREATOR_ROLES = [
  'Giáo viên bộ môn',
  'Chuyên gia luyện thi',
  'Giảng viên đại học',
  'Người ra đề thi HSG',
  'Chuyên gia giáo dục',
  'Gia sư tận tâm'
];

export const SAMPLE_TOPICS = {
  [Subject.MATH]: ['Hàm số', 'Hình học không gian', 'Số phức', 'Tích phân', 'Xác suất thống kê'],
  [Subject.PHYSICS]: ['Dao động cơ', 'Sóng ánh sáng', 'Điện xoay chiều', 'Hạt nhân nguyên tử'],
  [Subject.CHEMISTRY]: ['Este - Lipit', 'Kim loại kiềm', 'Hóa học hữu cơ', 'Sự điện li'],
  [Subject.ENGLISH]: ['Tenses', 'Passive Voice', 'Conditional Sentences', 'Vocabulary: Environment'],
  [Subject.CLASS_MEETING]: ['Sơ kết thi đua tuần', 'Chủ điểm: Tôn sư trọng đạo', 'Văn hóa ứng xử học đường', 'Xây dựng kế hoạch cá nhân', 'An toàn giao thông'],
  [Subject.LIFE_SKILLS]: ['Kỹ năng quản lý thời gian', 'Phòng chống bạo lực học đường', 'Tư duy phản biện', 'Kỹ năng giao tiếp hiệu quả', 'Quản lý cảm xúc'],
  [Subject.CAREER_GUIDANCE]: ['Khám phá năng lực bản thân', 'Tìm hiểu thế giới nghề nghiệp', 'Xu hướng thị trường lao động', 'Lập kế hoạch nghề nghiệp', 'Kỹ năng phỏng vấn'],
};

export const EDU_WEBSITES = [
  { 
    id: 'oeis', 
    name: 'OEIS', 
    fullName: 'Online Encyclopedia of Integer Sequences',
    url: 'https://oeis.org/', 
    icon: '🔢', 
    description: 'Bách khoa toàn thư về các dãy số nguyên. Tìm quy luật và đặc điểm chuyên sâu của dãy số.' 
  },
  { 
    id: 'coolmath', 
    name: 'COOLMATHGAMES', 
    fullName: 'Cool Math Games',
    url: 'https://www.coolmathgames.com/', 
    icon: '🎮', 
    description: 'Thiên đường trò chơi tư duy toán học: logic, hình học, số học.' 
  },
  { 
    id: 'wolfram', 
    name: 'WOLFRAM DEMONSTRATIONS', 
    fullName: 'Wolfram Demonstrations Project',
    url: 'https://demonstrations.wolfram.com/', 
    icon: '📊', 
    description: 'Kho tàng mô phỏng tương tác khổng lồ về hình học, hàm số...' 
  },
  { 
    id: 'thetawise', 
    name: 'THETAWISE', 
    fullName: 'Thetawise AI',
    url: 'https://thetawise.ai/', 
    icon: '🤖', 
    description: 'Chatbot AI chuyên biệt cho Toán học, giải thích từng bước.' 
  },
  { 
    id: '3blue1brown', 
    name: '3BLUE1BROWN', 
    fullName: '3Blue1Brown',
    url: 'https://www.3blue1brown.com/', 
    icon: '📹', 
    description: 'Video giải thích toán học bằng hình ảnh cực kỳ đẹp mắt và dễ hiểu.' 
  },
  { 
    id: 'smath', 
    name: 'SMATH STUDIO', 
    fullName: 'SMath Studio Cloud',
    url: 'https://smath.com/cloud/', 
    icon: '📝', 
    description: 'Phần mềm soạn thảo văn bản toán học mạnh mẽ, tính toán trực tiếp.' 
  },
  { 
    id: 'aplusclick', 
    name: 'APLUSCLICK', 
    fullName: 'A+ Click Math',
    url: 'https://aplusclick.org/', 
    icon: '🧠', 
    description: 'Hàng ngàn câu đố tư duy và bài tập toán từ tiểu học đến THPT.' 
  },
  { 
    id: 'mathplayground', 
    name: 'MATHPLAYGROUND', 
    fullName: 'Math Playground',
    url: 'https://www.mathplayground.com/', 
    icon: '🎡', 
    description: 'Trò chơi toán học tuyệt vời cho học sinh Tiểu học và THCS.' 
  },
  { 
    id: 'numberphile', 
    name: 'NUMBERPHILE', 
    fullName: 'Numberphile',
    url: 'https://www.numberphile.com/', 
    icon: '📽️', 
    description: 'Những câu chuyện kể từ các nhà toán học về thế giới con số.' 
  }
];
