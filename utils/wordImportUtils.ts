
import mammoth from 'mammoth';
import { ExamMatrix, Question, QuestionType } from '../types';

/**
 * Phân tích văn bản thô để tìm cấu trúc đề thi (Câu 1... A. B. C. D.)
 * @param text Văn bản thuần từ file Word
 */
const parseExamTextToMatrix = (text: string): ExamMatrix => {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const questions: Question[] = [];
  
  let currentQuestion: Partial<Question> | null = null;
  let currentContent = "";
  let currentOptions: string[] = [];
  let currentSolution = "";
  
  // Regex nhận diện bắt đầu câu hỏi (VD: Câu 1:, Bài 1., Question 1)
  const questionStartRegex = /^(?:Câu|Bài|Question)\s+(\d+)[:.]/i;
  // Regex nhận diện đáp án (VD: A., B:, c))
  const optionRegex = /^(?:[A-D])[.:)]\s+(.*)/i;
  // Regex nhận diện lời giải
  const solutionRegex = /^(?:Lời giải|Hướng dẫn|Giải|Đáp án)[:.]/i;

  const saveCurrentQuestion = () => {
    if (currentQuestion && currentContent) {
        // Nếu không tìm thấy options rõ ràng, coi là tự luận hoặc options nằm cùng dòng (xử lý đơn giản trước)
        let type = QuestionType.ESSAY;
        if (currentOptions.length === 4) type = QuestionType.MULTIPLE_CHOICE;
        else if (currentOptions.length > 0) type = QuestionType.MULTIPLE_CHOICE; // Chấp nhận ít hơn 4

        questions.push({
            id: questions.length + 1,
            content: currentContent.trim(),
            type: type,
            difficulty: "Nhận biết", // Mặc định
            options: currentOptions.length > 0 ? currentOptions : undefined,
            correctAnswer: "A", // Mặc định, người dùng sẽ sửa
            solution: currentSolution.trim() || "Chưa có lời giải chi tiết."
        });
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const questionMatch = line.match(questionStartRegex);
    const solutionMatch = line.match(solutionRegex);
    const optionMatch = line.match(optionRegex);

    if (questionMatch) {
        saveCurrentQuestion(); // Lưu câu trước đó
        
        // Reset cho câu mới
        currentQuestion = { id: parseInt(questionMatch[1]) };
        currentContent = line.replace(questionStartRegex, "").trim() + "\n";
        currentOptions = [];
        currentSolution = "";
    } else if (solutionMatch) {
        // Bắt đầu phần lời giải của câu hiện tại
        // Đánh dấu để các dòng tiếp theo cộng vào solution
        currentSolution += line.replace(solutionRegex, "").trim() + "\n";
    } else if (optionMatch && currentQuestion && !currentSolution) {
        // Là dòng đáp án (và chưa đến phần lời giải)
        // Check xem dòng này có chứa nhiều đáp án không (VD: A. 1   B. 2   C. 3   D. 4)
        // Logic tách dòng đơn giản:
        currentOptions.push(line);
    } else {
        // Nội dung tiếp diễn
        if (currentQuestion) {
            if (currentSolution) {
                currentSolution += line + "\n";
            } else {
                // Nếu chưa có options hoặc dòng này không giống options, cộng vào content
                // Tuy nhiên nếu đã có options rồi mà gặp dòng không phải option, có thể là option tiếp theo bị xuống dòng hoặc nội dung câu hỏi
                // Ở đây ta đơn giản hóa: nếu đã bắt đầu options, các dòng tiếp theo mà không khớp optionRegex thì vẫn coi là content của option trước (multiline option) hoặc lỗi format. 
                // Để an toàn: cộng vào content nếu chưa có options
                if (currentOptions.length === 0) {
                    currentContent += line + "\n";
                } else {
                    // Multiline option support simple
                    currentOptions[currentOptions.length - 1] += " " + line;
                }
            }
        }
    }
  }
  saveCurrentQuestion(); // Lưu câu cuối

  return {
    summary: "Đề thi nhập từ Word",
    questions: questions,
    keyConcepts: "Tự động trích xuất từ tài liệu."
  };
};

export const parseDocxToExam = async (file: File): Promise<any> => {
  const arrayBuffer = await file.arrayBuffer();
  
  try {
    // 1. Trích xuất Raw Text từ Word
    const result = await mammoth.extractRawText({ arrayBuffer });
    const rawText = result.value.trim();

    // 2. Thử Parse JSON trực tiếp (Trường hợp file Word chỉ chứa chuỗi JSON)
    // Tìm cặp ngoặc nhọn đầu và cuối để loại bỏ rác nếu có
    const jsonStartIndex = rawText.indexOf('{');
    const jsonEndIndex = rawText.lastIndexOf('}');
    
    if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
        try {
            const potentialJson = rawText.substring(jsonStartIndex, jsonEndIndex + 1);
            const parsed = JSON.parse(potentialJson);
            
            // Kiểm tra sơ bộ xem có đúng cấu trúc mong đợi không
            if (parsed.questions || parsed.sections || parsed.steps) {
                console.log("Phát hiện JSON hợp lệ trong file Word");
                return {
                    data: parsed,
                    type: parsed.questions ? 'exam' : parsed.sections ? 'theory' : 'polya'
                };
            }
        } catch (e) {
            console.log("File Word không chứa JSON hợp lệ, chuyển sang phân tích văn bản thường.");
        }
    }

    // 3. Nếu không phải JSON, phân tích theo cấu trúc đề thi thông thường
    const examMatrix = parseExamTextToMatrix(rawText);
    if (examMatrix.questions.length > 0) {
        return {
            data: examMatrix,
            type: 'exam',
            config: {
                mode: 'exam',
                subject: 'Khác',
                grade: 'Khác',
                topic: file.name.replace('.docx', '')
            }
        };
    }

    throw new Error("Không thể nhận diện câu hỏi trong file Word. Vui lòng đảm bảo định dạng 'Câu 1:', 'A.', 'B.'...");

  } catch (error: any) {
    console.error(error);
    throw new Error("Lỗi đọc file Word: " + error.message);
  }
};
