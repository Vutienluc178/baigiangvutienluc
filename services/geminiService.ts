
import { GoogleGenAI, Type } from "@google/genai";
import { ExamConfig, Question, QuestionType, ExamMatrix, StudyGuideData, MatrixRow, DifficultyLevel, PolyaData } from "../types";

const createClient = (apiKey?: string) => {
  // Prioritize custom key, fallback to env, then empty string (which will cause SDK error)
  const key = apiKey || process.env.API_KEY || "";
  return new GoogleGenAI({ apiKey: key });
};

export const suggestMatrixStructure = async (subject: string, grade: string, title: string, creatorRole?: string, apiKey?: string): Promise<MatrixRow[]> => {
  const ai = createClient(apiKey);
  const modelName = "gemini-2.5-flash";

  const prompt = `
VAI TRÒ: Bạn là một ${creatorRole || 'chuyên gia khảo thí'} xuất sắc.
Hãy gợi ý một cấu trúc ma trận đề thi chuẩn cho:
Môn: ${subject}
Lớp: ${grade}
Tiêu đề/Phạm vi: ${title}

TRẢ VỀ JSON MẢNG MatrixRow:
[
  { "topic": "Tên chuyên đề", "level": "Mức độ", "count": số_câu, "type": "Loại câu" }
]
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });
    return JSON.parse(response.text) as MatrixRow[];
  } catch (error) {
    console.error("Matrix suggestion failed:", error);
    return [];
  }
};

export const generateExam = async (config: ExamConfig, apiKey?: string): Promise<ExamMatrix> => {
  const ai = createClient(apiKey);
  const modelName = "gemini-2.5-flash"; // Updated model for better performance/cost balance

  let structureInstruction = "";
  if (config.mode === 'matrix' && config.matrixRows) {
      config.matrixRows.forEach((row, idx) => {
          let rowInstr = `- Phần ${idx+1}: ${row.count} câu, Chủ đề: "${row.topic}", Mức: ${row.level}, Dạng: ${row.type}.`;
          if (row.essayRequirements) {
              rowInstr += ` Yêu cầu riêng cho phần tự luận này: ${row.essayRequirements}`;
          }
          structureInstruction += rowInstr + "\n";
      });
  } else {
      structureInstruction = `Chủ đề: "${config.topic}", Số lượng: ${config.questionCount} câu, Dạng: ${config.questionType}, Mức độ ưu tiên: ${config.difficultyMode === 'fixed' ? config.targetLevel : 'Phân hóa từ Nhận biết đến Vận dụng cao'}.`;
      if (config.essayRequirements) {
          structureInstruction += `\nYÊU CẦU RIÊNG CHO CÂU HỎI TỰ LUẬN: ${config.essayRequirements}`;
      }
  }

  // Nâng cấp Prompt để đáp ứng tiêu chuẩn giáo viên 20 năm kinh nghiệm
  // Cập nhật: QUY ĐỊNH CHUẨN FORM CHO TỪNG LOẠI CÂU HỎI
  let promptText = `
VAI TRÒ: Bạn là một ${config.creatorRole || 'TỔ TRƯỞNG CHUYÊN MÔN'} XUẤT SẮC CÓ 20 NĂM KINH NGHIỆM.
Phong cách: Chặt chẽ về bản chất nhưng CỰC KỲ NGẮN GỌN, XÚC TÍCH trong trình bày.

NHIỆM VỤ: Soạn một chuyên đề luyện tập môn ${config.subject} lớp ${config.grade}.

QUY ĐỊNH NGHIÊM NGẶT VỀ DẠNG CÂU HỎI (TYPE):
1. Với dạng 'Trắc nghiệm (4 chọn 1)':
   - Field 'options': Mảng chứa đúng 4 chuỗi văn bản tương ứng A, B, C, D.
   - Field 'correctAnswer': Chỉ chứa 1 ký tự 'A', 'B', 'C', hoặc 'D'.

2. Với dạng 'Trắc nghiệm Đúng/Sai':
   - Nội dung câu hỏi là vấn đề chính (Stem).
   - Field 'options': Mảng chứa 4 phát biểu con (a, b, c, d) cần xét tính đúng sai.
   - Field 'correctAnswer': Chuỗi mô tả đáp án, ví dụ: "a: Đúng, b: Sai, c: Đúng, d: Sai".

3. Với dạng 'Tự luận':
   - Field 'options': Để mảng rỗng [].
   - Field 'correctAnswer': Kết quả cuối cùng ngắn gọn.
   - Field 'solution': Trình bày lời giải đầy đủ.

YÊU CẦU CẤU TRÚC JSON (BẮT BUỘC):
1. warmup (Slide Khởi động): AI tạo 1 câu hỏi dẫn dắt hấp dẫn vào bài mới/đề thi.
   - Trả về object gồm 'question' (văn bản câu hỏi) và 'imageUrl' (link ảnh minh họa hấp dẫn, nếu không có hãy dùng https://picsum.photos/seed/{keyword}/800/600 với keyword là từ khóa tiếng Anh liên quan đến chủ đề).
   - 'imagePrompt': Mô tả ngắn gọn để AI có thể dùng sinh ảnh sau này.

2. keyConcepts (Kiến thức trọng tâm): Tóm tắt công thức và định lý quan trọng nhất.

3. questions (Danh sách câu hỏi):
   - NỘI DUNG CÂU HỎI: Rõ ràng, số liệu tính toán ra kết quả đẹp.
   - OPTIONS: Tuân thủ quy định dạng câu hỏi ở trên.
   - DIFFICULTY: Dán nhãn chính xác.
   - SOLUTION (Lời giải chi tiết - QUAN TRỌNG):
     + YÊU CẦU CỐT LÕI: Lời giải phải NGẮN GỌN, XÚC TÍCH. Đi thẳng vào công thức và phép tính.
     + ĐỊNH DẠNG: BẮT BUỘC dùng ký tự \\n để ngắt dòng giữa các bước giải. Ví dụ: "Bước 1...\\nBước 2...\\nKết luận...".
     + KHÔNG viết văn hoa, dài dòng. KHÔNG giải thích lại đề bài.
     + Phần thay số: Viết gộp bước. Ví dụ thay vì viết "Ta có 2 + 3 = 5, suy ra x = 5", hãy viết "Ta có: $x = 2 + 3 = 5$".
     + SỬ DỤNG LATEX: Mọi công thức phải đặt trong $...$. Escape backslash kép (\\\\).

NỘI DUNG CỤ THỂ CẦN SOẠN:
${structureInstruction}

HÃY TRẢ VỀ JSON CHUẨN THEO SCHEMA DƯỚI ĐÂY.
  `;

  const questionSchema = {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.INTEGER },
      content: { type: Type.STRING },
      type: { type: Type.STRING, description: "Loại câu hỏi (Trắc nghiệm (4 chọn 1) | Trắc nghiệm Đúng/Sai | Tự luận)" },
      difficulty: { type: Type.STRING },
      options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Danh sách lựa chọn hoặc các ý a,b,c,d cho câu Đ/S" },
      correctAnswer: { type: Type.STRING },
      solution: { type: Type.STRING },
      hints: { type: Type.ARRAY, items: { type: Type.STRING } },
      differentiation: { type: Type.STRING, description: "Phân hóa (Cơ bản/Nâng cao/Vận dụng)"}
    },
    required: ["id", "content", "type", "difficulty", "correctAnswer", "solution", "hints", "options"],
  };

  const warmupSchema = {
    type: Type.OBJECT,
    properties: {
      question: { type: Type.STRING },
      imageUrl: { type: Type.STRING },
      imagePrompt: { type: Type.STRING },
    },
    required: ["question", "imageUrl"],
  };

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING },
      warmup: warmupSchema,
      keyConcepts: { type: Type.STRING, description: "Tóm tắt kiến thức trọng tâm, công thức quan trọng của chuyên đề." },
      objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
      competencies: { type: Type.ARRAY, items: { type: Type.STRING } },
      questions: {
        type: Type.ARRAY,
        items: questionSchema,
      },
    },
    required: ["summary", "keyConcepts", "questions", "warmup"],
  };

  try {
    const parts: any[] = [{ text: promptText }];
    if (config.uploadedFile) {
        parts.push({ inlineData: { mimeType: config.uploadedFile.mimeType, data: config.uploadedFile.data } });
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.3, // Giảm temperature để tăng độ chính xác toán học
      },
    });

    const parsed = JSON.parse(response.text);
    return parsed as ExamMatrix;
  } catch (error: any) {
    console.error("Lỗi sinh đề:", error);
    throw new Error("Lỗi hệ thống AI: " + (error.message || "Vui lòng kiểm tra API Key."));
  }
};

export const generateStudyGuide = async (config: ExamConfig, apiKey?: string): Promise<StudyGuideData> => {
  const ai = createClient(apiKey);
  const modelName = "gemini-2.5-flash";

  const promptText = `
VAI TRÒ: Bạn là một ${config.creatorRole || 'chuyên gia sư phạm'} và thiết kế bài giảng điện tử tài năng.
Hãy soạn một bài giảng slide (Study Guide) chi tiết cho:
Môn: ${config.subject}
Lớp: ${config.grade}
Chủ đề: "${config.topic}"

YÊU CẦU NỘI DUNG:
1. Slide Khởi động (Warm-up): AI tạo 1 câu hỏi dẫn dắt hấp dẫn vào bài mới.
   - Trả về 'warmup' object gồm 'question' (văn bản câu hỏi) và 'imageUrl' (link ảnh minh họa hấp dẫn, nếu không có hãy dùng https://picsum.photos/seed/{keyword}/800/600 với keyword là từ khóa tiếng Anh liên quan đến chủ đề).
   - 'imagePrompt': Mô tả ngắn gọn để AI có thể dùng sinh ảnh sau này.
2. Tổng quan bài học hấp dẫn.
3. Mục tiêu và Năng lực cần đạt rõ ràng (theo định hướng GDPT 2018).
4. Phân hóa dạy học: Kế hoạch hỗ trợ học sinh Cơ bản, Nâng cao, Vận dụng.
5. Các phần (sections) tương ứng với các slide/hoạt động dạy học.
   - Mỗi section có tiêu đề, nội dung chính (Content).
   - Ví dụ minh họa (Examples) có lời giải chi tiết.
   - Câu hỏi gợi mở (Guiding Questions) để giáo viên tương tác.
   - Hoạt động (Activities) đề xuất (ví dụ: Thảo luận nhóm, Trò chơi...).
6. Exit Ticket: 2-3 câu hỏi kiểm tra cuối giờ.

QUY TẮC ĐỊNH DẠNG & TRÌNH BÀY:
- LaTeX: Dùng $...$ cho công thức toán. Escape backslash (\\\\) trong chuỗi JSON.
- Content & Solution: QUAN TRỌNG! Sử dụng ký tự \\n để ngắt dòng giữa các ý hoặc các bước giải. Ứng dụng sẽ sử dụng tính năng "Click để hiện tiếp" dựa trên ký tự này.
- DifferentiationLevel trong section: Chọn "Cơ bản", "Nâng cao" hoặc "Vận dụng".

TRẢ VỀ JSON KHỚP SCHEMA.
  `;

  // Define Schemas for Study Guide
  const exampleSchema = {
    type: Type.OBJECT,
    properties: {
      problem: { type: Type.STRING },
      solution: { type: Type.STRING },
      explanation: { type: Type.STRING },
    },
    required: ["problem", "solution", "explanation"],
  };

  const warmupSchema = {
    type: Type.OBJECT,
    properties: {
      question: { type: Type.STRING },
      imageUrl: { type: Type.STRING },
      imagePrompt: { type: Type.STRING },
    },
    required: ["question", "imageUrl"],
  };

  const theorySectionSchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
      competencies: { type: Type.ARRAY, items: { type: Type.STRING } },
      differentiationLevel: { type: Type.STRING },
      content: { type: Type.STRING },
      examples: { type: Type.ARRAY, items: exampleSchema },
      guidingQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
      activities: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["title", "content", "examples"],
  };

  const differentiationPlanSchema = {
    type: Type.OBJECT,
    properties: {
      basic: { type: Type.ARRAY, items: { type: Type.STRING } },
      advanced: { type: Type.ARRAY, items: { type: Type.STRING } },
      application: { type: Type.ARRAY, items: { type: Type.STRING } },
    }
  };

  const studyGuideSchema = {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING },
      overview: { type: Type.STRING },
      warmup: warmupSchema,
      objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
      competencies: { type: Type.ARRAY, items: { type: Type.STRING } },
      differentiation: differentiationPlanSchema,
      exitTicket: { type: Type.ARRAY, items: { type: Type.STRING } },
      sections: { type: Type.ARRAY, items: theorySectionSchema },
    },
    required: ["topic", "overview", "sections", "warmup"],
  };

  try {
    const parts: any[] = [{ text: promptText }];
    if (config.uploadedFile) {
        parts.push({ inlineData: { mimeType: config.uploadedFile.mimeType, data: config.uploadedFile.data } });
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: studyGuideSchema,
        temperature: 0.4,
      },
    });
    return JSON.parse(response.text) as StudyGuideData;
  } catch (error: any) {
    console.error("Lỗi sinh bài giảng:", error);
    throw new Error("Lỗi sinh bài giảng: " + (error.message || "Vui lòng kiểm tra API Key."));
  }
};

export const generatePolyaSolution = async (config: ExamConfig, apiKey?: string): Promise<PolyaData> => {
  const ai = createClient(apiKey);
  const modelName = "gemini-2.5-flash";

  const promptText = `
  VAI TRÒ: Bạn là một ${config.creatorRole || 'giáo sư toán học'} lỗi lạc, người áp dụng phương pháp của George Polya để hướng dẫn học sinh giải toán.
  Hãy phân tích bài toán sau đây theo 4 bước của Polya.

  BÀI TOÁN: "${config.topic}"

  QUY TẮC QUAN TRỌNG VỀ ĐỊNH DẠNG JSON:
  1. Trả về đúng định dạng JSON.
  2. Với các công thức Toán học (LaTeX), bạn PHẢI sử dụng double backslash (\\\\) thay vì single backslash (\\).
     Ví dụ: Viết "$\\\\frac{1}{2}$" thay vì "$\\frac{1}{2}$".
  3. TRÌNH BÀY: QUAN TRỌNG! Sử dụng \\n để tách dòng các bước tư duy. Ứng dụng sẽ hiển thị từng dòng khi click (Click-to-reveal).

  YÊU CẦU ĐẦU RA (JSON):
  Hãy trả về một object JSON duy nhất với cấu trúc sau:
  {
    "title": "Tên ngắn gọn của bài toán",
    "problem": "Nội dung bài toán (có thể format lại cho đẹp bằng LaTeX)",
    "steps": [
      {
        "stepName": "Bước 1: Tìm hiểu đề bài",
        "icon": "search",
        "content": "Phân tích giả thiết (Cái đã cho), kết luận (Cái cần tìm).\\nVẽ hình nếu cần thiết (mô tả bằng lời).\\nĐịnh dạng LaTeX $...$ chuẩn.",
        "keyPoints": ["Giả thiết: ...", "Yêu cầu: ..."]
      },
      {
        "stepName": "Bước 2: Xây dựng chương trình giải",
        "icon": "map",
        "content": "Tìm mối liên hệ giữa giả thiết và kết luận.\\nNhớ lại các định lý, công thức liên quan.\\nLập kế hoạch từng bước.",
        "keyPoints": ["Sử dụng định lý...", "Đặt ẩn phụ...", "Chứng minh..."]
      },
      {
        "stepName": "Bước 3: Thực hiện chương trình giải",
        "icon": "wrench",
        "content": "Trình bày lời giải chi tiết, rõ ràng, tính toán chính xác.\\nDùng LaTeX cho công thức.\\nTách các bước tính bằng \\n.",
        "keyPoints": []
      },
      {
        "stepName": "Bước 4: Kiểm tra và khai thác",
        "icon": "check",
        "content": "Kiểm tra lại kết quả.\\nThử lại bằng cách khác (nếu có).\\nMở rộng bài toán hoặc tổng quát hóa.",
        "keyPoints": ["Cách khác: ...", "Bài toán tương tự..."]
      }
    ]
  }
  `;

  const polyaSchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      problem: { type: Type.STRING },
      steps: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            stepName: { type: Type.STRING },
            icon: { type: Type.STRING },
            content: { type: Type.STRING },
            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["stepName", "icon", "content", "keyPoints"]
        }
      }
    },
    required: ["title", "problem", "steps"]
  };

  try {
    const parts: any[] = [{ text: promptText }];
    if (config.uploadedFile) {
        parts.push({ inlineData: { mimeType: config.uploadedFile.mimeType, data: config.uploadedFile.data } });
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: polyaSchema,
        temperature: 0.3,
      },
    });

    return JSON.parse(response.text) as PolyaData;
  } catch (error: any) {
    console.error("Lỗi sinh Polya:", error);
    throw new Error("Lỗi hệ thống AI: " + (error.message || "Vui lòng kiểm tra API Key."));
  }
};
