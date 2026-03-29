
import katex from 'katex';
import { deflate } from 'pako';
import { Document, Packer, Paragraph, TextRun, AlignmentType, SectionType, ImportedXmlComponent } from 'docx';
import saveAs from 'file-saver';
import { ExamMatrix, Question, QuestionType } from '../types';
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { SerializedMmlVisitor } from 'mathjax-full/js/core/MmlTree/SerializedMmlVisitor.js';
import { mml2omml } from 'mathml2omml';

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const tex = new TeX({ packages: ['base', 'ams'] });
const mj = mathjax.document('', { InputJax: tex });
const visitor = new SerializedMmlVisitor();

export function latexToOMML(latex: string): string {
  try {
    const node = mj.convert(latex, { display: false });
    const mathML = visitor.visitTree(node);
    return mml2omml(mathML);
  } catch (error) {
    console.error("Error converting LaTeX to OMML:", error);
    return "";
  }
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const cleanMathML = (mathml: string): string => {
  let clean = mathml;
  clean = clean.replace(/<semantics>[\s\S]*?<\/semantics>/g, (match) => {
    const inner = match.replace(/^<semantics>/, '').replace(/<\/semantics>$/, '');
    return inner.replace(/<annotation[\s\S]*?<\/annotation>/g, '').replace(/<annotation-xml[\s\S]*?<\/annotation-xml>/g, '');
  });
  clean = clean.replace(/<annotation encoding="application\/x-tex">[\s\S]*?<\/annotation>/g, '');
  clean = clean.replace(/\s(class|id|style)="[^"]*"/g, '');
  if (!clean.includes('xmlns="http://www.w3.org/1998/Math/MathML"')) {
    clean = clean.replace(/<math/g, '<math xmlns="http://www.w3.org/1998/Math/MathML"');
  }
  return clean;
};

const renderMathToMathML = (latex: string, displayMode: boolean) => {
  try {
    const mathML = katex.renderToString(latex, {
      throwOnError: false,
      output: 'mathml',
      displayMode,
      strict: false,
      trust: true
    });
    const mathMatch = mathML.match(/<math[\s\S]*?<\/math>/);
    return mathMatch ? cleanMathML(mathMatch[0]) : '';
  } catch {
    return '';
  }
};

const processHtmlWithMath = (html: string): string => {
  const parts = html.split(/(<[^>]*>)/g);
  return parts
    .map((part) => {
      if (part.startsWith('<')) return part;
      return part.replace(
        /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|(?<!\\)\$[^$]*?\$)/g,
        (match) => {
          let content = match;
          let displayMode = false;
          if (match.startsWith('$$')) { content = match.slice(2, -2); displayMode = true; }
          else if (match.startsWith('\\[')) { content = match.slice(2, -2); displayMode = true; }
          else if (match.startsWith('\\(')) { content = match.slice(2, -2); displayMode = false; }
          else if (match.startsWith('$')) { content = match.slice(1, -1); displayMode = false; }
          const mathML = renderMathToMathML(content, displayMode);
          if (!mathML) return match;
          return displayMode
            ? `<p class="equation" style="text-align: center; margin: 2pt 0;">${mathML}</p>`
            : `&#160;${mathML}&#160;`;
        }
      );
    })
    .join('');
};

const formatTextToHtml = (text: string): string => {
  let html = escapeHtml(text);
  html = html.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  html = html.replace(/(^|[^\w])\*([^\*]+)\*([^\w]|$)/g, '$1<i>$2</i>$3');
  html = html.replace(/\n/g, '<br/>');
  return processHtmlWithMath(html);
};

type TextSegment = {
  type: 'text' | 'math' | 'tikz';
  content: string;
  displayMode?: boolean;
};

const uint8ArrayToBinaryString = (u8: Uint8Array): string => {
  let str = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < u8.length; i += chunkSize) {
    const chunk = u8.subarray(i, i + chunkSize);
    str += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return str;
};

const removeLatexComments = (text: string): string => {
  return text
    .split('\n')
    .map((line) => {
      let commentIdx = -1;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '%') {
          let backslashes = 0;
          let j = i - 1;
          while (j >= 0 && line[j] === '\\') {
            backslashes++;
            j--;
          }
          if (backslashes % 2 === 0) {
            commentIdx = i;
            break;
          }
        }
      }
      return commentIdx !== -1 ? line.substring(0, commentIdx) : line;
    })
    .join('\n');
};

export const removeLatexSolutions = (text: string): string => {
  let result = '';
  let i = 0;
  const len = text.length;

  while (i < len) {
    const remaining = text.substring(i);
    const match = remaining.match(/^\\loigiai\s*\{/);
    if (match) {
      const startBraceOffset = match[0].length - 1;
      let ptr = i + startBraceOffset + 1;
      let balance = 1;
      while (ptr < len && balance > 0) {
        if (text[ptr] === '{' && text[ptr - 1] !== '\\') balance++;
        else if (text[ptr] === '}' && text[ptr - 1] !== '\\') balance--;
        ptr++;
      }
      if (balance === 0) {
        i = ptr;
        if (i < len && text[i] === '\n') i++;
        continue;
      }
    }
    result += text[i];
    i++;
  }
  return result;
};

export const getTikzImageUrl = (tikzCode: string, format: 'svg' | 'png' = 'svg'): string => {
  let source = tikzCode.trim();
  source = source.replace(/\\begin\{center\}/g, '').replace(/\\end\{center\}/g, '');

  let preambleExtras = '';
  if (format === 'png') {
    preambleExtras = '\\tikzset{every picture/.append style={scale=4, transform shape}}';
  }

  if (!source.includes('\\documentclass')) {
    source = `\\documentclass[tikz,border=2pt]{standalone}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath,amsfonts,amssymb}
\\usepackage{pgfplots}
\\usepackage{tkz-tab}
\\pgfplotsset{compat=newest}
\\usetikzlibrary{arrows,arrows.meta,calc,patterns,positioning,shapes.geometric,decorations.markings,decorations.pathmorphing,intersections,through,backgrounds}
${preambleExtras}
\\begin{document}
${source}
\\end{document}`;
  }

  const data = new TextEncoder().encode(source);
  const compressed = deflate(data, { level: 9 });
  const str = uint8ArrayToBinaryString(compressed);
  const b64 = btoa(str).replace(/\+/g, '-').replace(/\//g, '_');
  return `https://kroki.io/tikz/${format}/${b64}`;
};

const preprocessLatexExam = (text: string): string => {
  let processed = text;
  processed = processed.replace(/\\documentclass\[.*?\]\{.*?\}/gs, '');
  processed = processed.replace(/\\usepackage\{.*?\}/gs, '');
  processed = processed.replace(/\\begin\{document\}/g, '');
  processed = processed.replace(/\\end\{document\}/g, '');
  processed = processed.replace(/\\hrule/gi, '');
  processed = processed.replace(/\\newcounter\{.*?\}/g, '');
  processed = processed.replace(/\\newcommand\{.*?\}.*?\}/g, '');
  processed = processed.trim();

  processed = processed.replace(/\$\$/g, '$');
  processed = processed.replace(/\\\[/g, '$');
  processed = processed.replace(/\\\]/g, '$');
  processed = processed.replace(/\\\(/g, '$');
  processed = processed.replace(/\\\)/g, '$');
  processed = processed.replace(/([^\s\n\(])(\$)/g, '$1 $2');
  processed = processed.replace(/(\$)([^\s\n\)\.,;:?!])/g, '$1 $2');

  processed = processed.replace(/(\\displaystyle)?\s*\\int/g, '\\displaystyle \\int');
  processed = processed.replace(/\\frac/g, '\\dfrac');
  processed = processed.replace(/\\ddfrac/g, '\\dfrac');

  const inner = '(?:[^{}]|{(?:[^{}]|{(?:[^{}]|{[^{}]*})*})*})*';
  const choiceRegex = new RegExp('\\\\choice\\s*\\{(' + inner + ')\\}\\s*\\{(' + inner + ')\\}\\s*\\{(' + inner + ')\\}\\s*\\{(' + inner + ')\\}', 'g');
  processed = processed.replace(choiceRegex, (match, a, b, c, d) => {
    const opts = [a, b, c, d];
    const labels = ['A.', 'B.', 'C.', 'D.'];
    return opts.map((opt, idx) => `\n${labels[idx]} ${opt.trim()}`).join('\n') + '\n';
  });

  processed = processed.replace(/\\begin\s*\{(itemize|enumerate)\}/gi, '');
  processed = processed.replace(/\\end\s*\{(itemize|enumerate)\}/gi, '');
  processed = processed.replace(/\\item\s*/gi, '\n- ');
  processed = processed.replace(/\\textbf\s*\{((?:[^{}]|{[^{}]*})*)\}/gi, '**$1**');
  processed = processed.replace(/\\textit\s*\{((?:[^{}]|{[^{}]*})*)\}/gi, '*$1*');
  processed = processed.replace(/\\underline\s*\{((?:[^{}]|{[^{}]*})*)\}/gi, '$1');

  processed = processed.replace(/\\end\s*\{(ex|bt)\}/gi, '\n');
  processed = processed.replace(/\\(Open|Close)solutionfile.*/gi, '');
  processed = processed.replace(/\\setcounter.*/gi, '');
  processed = processed.replace(/\\noindent/gi, '');

  processed = processed.replace(/\\\\/g, '\n');
  return processed;
};

const formatLatexToHtml = (content: string): string => {
  let html = escapeHtml(content);
  html = html.replace(/\\newline/g, '<br/>');
  html = html.replace(/\\centering/g, '');
  html = html.replace(/\\&/g, '&');
  html = html.replace(/\\fbox\{((?:[^{}]|{[^{}]*})*)\}/g, '<span style="border: 1px solid black; padding: 4px 8px; display: inline-block;">$1</span>');
  html = html.replace(/\\underline\{((?:[^{}]|{[^{}]*})*)\}/g, '<u>$1</u>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  html = html.replace(/(^|[^\w])\*([^\*]+)\*([^\w]|$)/g, '$1<i>$2</i>$3');
  html = html.replace(/\\\\/g, '<br/>');
  html = html.replace(/\n/g, '<br/>');
  return processHtmlWithMath(html);
};

const parseTextAndMath = (text: string): TextSegment[] => {
  const segments: TextSegment[] = [];
  const cleanPart = preprocessLatexExam(text);
  const mathRegex = /(\\begin\s*\{(?:equation|align|gather|flalign|alignat|multline|cases)\*?\}[\s\S]*?\\end\s*\{(?:equation|align|gather|flalign|alignat|multline|cases)\*?\}|\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|(?<!\\)\$[^$]*?\$)/g;

  let lastIndex = 0;
  let match;
  while ((match = mathRegex.exec(cleanPart)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: cleanPart.slice(lastIndex, match.index) });
    }
    const fullMatch = match[0];
    let content = fullMatch;
    let displayMode = false;
    if (fullMatch.startsWith('$$')) { content = fullMatch.slice(2, -2); displayMode = true; }
    else if (fullMatch.startsWith('\\[')) { content = fullMatch.slice(2, -2); displayMode = true; }
    else if (fullMatch.startsWith('\\(')) { content = fullMatch.slice(2, -2); displayMode = false; }
    else if (fullMatch.startsWith('$')) { content = fullMatch.slice(1, -1); displayMode = false; }
    else if (/^\\begin/.test(fullMatch)) { content = fullMatch; displayMode = true; }

    segments.push({ type: 'math', content, displayMode });
    lastIndex = mathRegex.lastIndex;
  }

  if (lastIndex < cleanPart.length) {
    segments.push({ type: 'text', content: cleanPart.slice(lastIndex) });
  }

  return segments;
};

const parseContent = (text: string): TextSegment[] => {
  const cleanText = removeLatexComments(text);
  const segments: TextSegment[] = [];
  const tikzRegex = /\\begin\s*\{\s*tikzpicture\s*\}[\s\S]*?\\end\s*\{\s*tikzpicture\s*\}/gi;
  let lastIndex = 0;
  let match;
  while ((match = tikzRegex.exec(cleanText)) !== null) {
    if (match.index > lastIndex) {
      const textPart = cleanText.slice(lastIndex, match.index);
      if (textPart.trim()) segments.push(...parseTextAndMath(textPart));
    }
    segments.push({ type: 'tikz', content: match[0], displayMode: true });
    lastIndex = tikzRegex.lastIndex;
  }
  if (lastIndex < cleanText.length) {
    const textPart = cleanText.slice(lastIndex);
    if (textPart.trim()) segments.push(...parseTextAndMath(textPart));
  }
  return segments;
};

const prepareTikzImages = async (segments: TextSegment[]) => {
  const tikzSegments = segments.filter((s) => s.type === 'tikz');
  const uniqueCodes = Array.from(new Set(tikzSegments.map((s) => s.content)));
  const imageMap: Record<string, { base64: string; width: number; height: number }> = {};

  const fetchImage = async (code: string) => {
    try {
      const url = getTikzImageUrl(code, 'png');
      const response = await fetch(url);
      if (!response.ok) return;
      const blob = await response.blob();
      await new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          const img = new Image();
          img.onload = () => {
            imageMap[code] = { base64, width: img.width, height: img.height };
            resolve();
          };
          img.onerror = () => {
            imageMap[code] = { base64, width: 300, height: 300 };
            resolve();
          };
          img.src = base64;
        };
        reader.onerror = () => resolve();
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error('Error preparing TikZ image', e);
    }
  };

  await Promise.all(uniqueCodes.map(fetchImage));
  return imageMap;
};

const renderSegmentsToHtml = (
  segments: TextSegment[],
  tikzImagesMap: Record<string, { base64: string; width: number; height: number }>
) => {
  return segments
    .map((segment) => {
      if (segment.type === 'text') {
        return formatLatexToHtml(segment.content);
      }
      if (segment.type === 'tikz') {
        const imgData = tikzImagesMap[segment.content];
        if (!imgData) return '<p style="color:red;">[Lỗi TikZ]</p>';
        const dw = Math.round(imgData.width / 4);
        const dh = Math.round(imgData.height / 4);
        return `<p style="text-align:center; margin: 4pt 0;"><img src="${imgData.base64}" width="${dw > 0 ? dw : 200}" height="${dh > 0 ? dh : 200}" /></p>`;
      }
      const mathML = renderMathToMathML(segment.content, !!segment.displayMode);
      if (!mathML) return '[Lỗi Công Thức]';
      return segment.displayMode
        ? `<p class="equation" style="text-align: center; margin: 2pt 0;">${mathML}</p>`
        : `&#160;${mathML}&#160;`;
    })
    .join('');
};

/**
 * Phân tách nội dung và tạo các thành phần docx (Text hoặc Equation)
 * @param text Nội dung chứa LaTeX $...$
 * @param mode 'equation' | 'latex'
 * @param isCorrect Nếu là đáp án đúng thì gạch chân/bold (dành cho Text)
 */
const parseContentToDocx = (text: string, mode: 'equation' | 'latex', isCorrect: boolean = false) => {
  if (!text) return [];
  
  // Tách nội dung dựa trên $...$ (LaTeX)
  const parts = text.split(/(\$[^$]+\$)/g);
  
  return parts.filter(Boolean).map(part => {
    if (part.startsWith('$') && part.endsWith('$')) {
      if (mode === 'equation') {
        const latex = part.slice(1, -1);
        const omml = latexToOMML(latex);
        if (omml) {
          try {
            const wrapper = ImportedXmlComponent.fromXmlString(omml);
            return (wrapper as any).root[0] as any;
          } catch (e) {
            console.error("Error creating OMML component:", e);
          }
        }
        // Fallback to text if conversion fails
        return new TextRun({
          text: part,
          size: 26,
          font: "Times New Roman",
          italics: true
        });
      } else {
        // Chế độ LaTeX: Giữ nguyên $...$ dưới dạng văn bản thường
        return new TextRun({
          text: part,
          size: 26, // 13pt
          font: "Times New Roman",
          underline: isCorrect ? {} : undefined,
          bold: isCorrect
        });
      }
    }
    
    return new TextRun({
      text: part.replace(/\*\*/g, ""), // Xóa markdown bold
      size: 26,
      font: "Times New Roman",
      underline: isCorrect ? {} : undefined,
      bold: isCorrect
    });
  });
};

/**
 * Kiểm tra xem một phương án có phải là đáp án đúng không
 */
const isOptionCorrect = (q: Question, label: string, index: number): boolean => {
  if (!q.correctAnswer) return false;
  const correctStr = q.correctAnswer.trim().toUpperCase();
  
  if (q.type === QuestionType.TRUE_FALSE || q.type.includes('Đúng/Sai')) {
    const tfLabels = ['A', 'B', 'C', 'D'];
    const currentLabel = tfLabels[index];
    // Check if the correct answer string contains "A: ĐÚNG" or "A: Đ"
    return correctStr.includes(`${currentLabel}: ĐÚNG`) || correctStr.includes(`${currentLabel}: Đ`);
  }

  const mcLabels = ["A", "B", "C", "D"];
  
  if (mcLabels.includes(correctStr)) {
    return mcLabels[index] === correctStr;
  }
  
  const cleanLabel = label.trim().replace(/[\.\)]/g, "").toUpperCase();
  if (cleanLabel === correctStr) {
    return true;
  }

  return false;
};

/**
 * Hàm xuất Word dùng chung cho cả 2 dạng
 */
export const exportExamToWord = async (data: ExamMatrix, subject: string, grade: string, mode: 'equation' | 'latex' | 'student_equation' | 'student_equation_v3' = 'equation', customFileName?: string) => {
  if (mode === 'equation' || mode === 'student_equation' || mode === 'student_equation_v3') {
    const allSegments: TextSegment[] = [];
    const collectSegments = (value?: string) => {
      if (!value) return;
      allSegments.push(...parseContent(value));
    };

    if ((mode === 'student_equation' || mode === 'student_equation_v3') && data.keyConcepts) {
      collectSegments(data.keyConcepts);
    }

    data.questions.forEach((q) => {
      collectSegments(q.content);
      if (q.options) q.options.forEach((opt) => collectSegments(opt));
      if (mode === 'equation' || mode === 'student_equation_v3') {
        collectSegments(q.solution);
        collectSegments(q.correctAnswer);
      } else if (mode === 'student_equation' && (!q.options || q.options.length === 0)) {
        collectSegments(q.correctAnswer);
      }
    });

    const tikzImagesMap = await prepareTikzImages(allSegments);

    const bodyParts: string[] = [];

    bodyParts.push(
      `<p style="text-align:center;font-weight:bold;">SỞ GIÁO DỤC VÀ ĐÀO TẠO</p>`,
      `<p style="text-align:center;font-weight:bold;font-size:16pt;">ĐỀ KIỂM TRA MÔN ${escapeHtml(subject.toUpperCase())} - KHỐI ${escapeHtml(grade.toUpperCase())}</p>`,
      `<p style="text-align:center;font-style:italic;">Thời gian làm bài: 45 phút (không kể thời gian giao đề)</p>`,
      `<p>&nbsp;</p>`
    );

    if (mode === 'student_equation' || mode === 'student_equation_v3') {
      bodyParts.push(`<p><b>I. KIẾN THỨC TRỌNG TÂM</b></p>`);
      if (data.keyConcepts) {
        bodyParts.push(`<div>${renderSegmentsToHtml(parseContent(data.keyConcepts), tikzImagesMap)}</div>`);
      }
      bodyParts.push(`<p>&nbsp;</p>`);
      bodyParts.push(`<p><b>II. CÂU HỎI</b></p>`);
    } else {
      bodyParts.push(`<p><b>I. PHẦN CÂU HỎI</b></p>`);
    }

    const mcQuestions = data.questions.filter(q => q.type === QuestionType.MULTIPLE_CHOICE);
    const tfQuestions = data.questions.filter(q => q.type === QuestionType.TRUE_FALSE);
    const essayQuestions = data.questions.filter(q => q.type === QuestionType.ESSAY);
    const otherQuestions = data.questions.filter(q => 
      q.type !== QuestionType.MULTIPLE_CHOICE && 
      q.type !== QuestionType.TRUE_FALSE && 
      q.type !== QuestionType.ESSAY
    );

    const sections = [
      { title: "PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn.", questions: mcQuestions, labels: ["A. ", "B. ", "C. ", "D. "] },
      { title: "PHẦN II. Câu trắc nghiệm đúng sai", questions: tfQuestions, labels: ["a) ", "b) ", "c) ", "d) "] },
      { title: "PHẦN III. Câu trắc nghiệm trả lời ngắn.", questions: essayQuestions, labels: [] },
      { title: "PHẦN IV. Câu hỏi khác", questions: otherQuestions, labels: ["A. ", "B. ", "C. ", "D. "] }
    ];

    sections.forEach(section => {
      if (section.questions.length > 0) {
        bodyParts.push(`<p><b>${section.title}</b></p>`);
        section.questions.forEach((q, index) => {
          bodyParts.push(
            `<div><b>Câu ${index + 1}:</b> ${renderSegmentsToHtml(parseContent(q.content), tikzImagesMap)}</div>`
          );

          if (q.options && q.options.length > 0) {
            const isMC = q.type === QuestionType.MULTIPLE_CHOICE;
            const isTF = q.type === QuestionType.TRUE_FALSE;
            q.options.forEach((opt, oi) => {
              const label = section.labels[oi] || "";
              const cleanOpt = opt.replace(/^[A-D][\.\)\s]+/, "").replace(/^[a-d][\.\)\s]+/, "");
              
              let labelHtml = escapeHtml(label);
              if ((mode === 'student_equation' || mode === 'student_equation_v3') && isOptionCorrect(q, label, oi)) {
                labelHtml = `<u>${escapeHtml(label.trim())}</u> `;
              }
              
              let renderedOpt = renderSegmentsToHtml(parseContent(cleanOpt), tikzImagesMap).trim();
              if (mode === 'student_equation' || mode === 'student_equation_v3') {
                const plainText = renderedOpt.replace(/<[^>]+>/g, '').replace(/(&#160;|&nbsp;|\s)+$/g, '');
                if (!plainText.match(/[\.\;\!\?]$/)) {
                  if (renderedOpt.endsWith('</p>')) {
                    renderedOpt = renderedOpt.slice(0, -4) + '&#160;.</p>';
                  } else {
                    renderedOpt += '.';
                  }
                }
              }
              
              bodyParts.push(`<div style="margin-left:18pt;">${labelHtml} ${renderedOpt}</div>`);
            });
          } else if ((mode === 'student_equation' || mode === 'student_equation_v3') && (!q.options || q.options.length === 0) && q.correctAnswer) {
            if (mode === 'student_equation_v3') {
              bodyParts.push(
                `<div style="margin-top:4pt;"><b>Đáp án:</b> ${renderSegmentsToHtml(parseContent(q.correctAnswer), tikzImagesMap)}</div>`
              );
            } else {
              bodyParts.push(
                `<div style="margin-top:4pt;">&lt;Key=${renderSegmentsToHtml(parseContent(q.correctAnswer), tikzImagesMap)}&gt;</div>`
              );
            }
          }
        });
      }
    });

    if (mode === 'equation' || mode === 'student_equation_v3') {
      bodyParts.push(`<p style="page-break-before:always;"></p>`);
      bodyParts.push(`<p style="text-align:center;font-weight:bold;font-size:16pt;">ĐÁP ÁN & LỜI GIẢI CHI TIẾT</p>`);

      sections.forEach(section => {
        if (section.questions.length > 0) {
          bodyParts.push(`<p><b>${section.title}</b></p>`);
          section.questions.forEach((q, index) => {
            bodyParts.push(
              `<div><b>Câu ${index + 1}:</b> ${renderSegmentsToHtml(parseContent(q.content), tikzImagesMap)}</div>`
            );

            if (q.options && q.options.length > 0) {
              q.options.forEach((opt, oi) => {
                const label = section.labels[oi] || "";
                const cleanOpt = opt.replace(/^[A-D][\.\)\s]+/, "").replace(/^[a-d][\.\)\s]+/, "");
                bodyParts.push(`<div style="margin-left:18pt;">${escapeHtml(label)} ${renderSegmentsToHtml(parseContent(cleanOpt), tikzImagesMap)}</div>`);
              });
            }

            bodyParts.push(
              `<div><b>=> Chọn đáp án:</b> <span style="color:#d00000;font-weight:bold;">${renderSegmentsToHtml(parseContent(q.correctAnswer), tikzImagesMap)}</span></div>`,
              `<div><i>Lời giải chi tiết:</i> ${renderSegmentsToHtml(parseContent(q.solution), tikzImagesMap)}</div>`,
              `<hr/>`
            );
          });
        }
      });
    }

    const fullHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns:m='http://schemas.microsoft.com/office/2004/12/omml' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset="utf-8">
        <style>
          @page { size: 21cm 29.7cm; margin: 1.27cm; }
          body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.2; }
          p { margin: 0 0 4pt 0; }
          p.equation { margin: 3pt 0; text-align: center; }
          math { vertical-align: middle; }
          hr { border: 0; border-top: 1px solid #ccc; margin: 8pt 0; }
        </style>
      </head>
      <body>${bodyParts.join('')}</body></html>
    `;

    const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
    const fileName = customFileName || `De_Thi_Equation_${subject}`.replace(/\s+/g, '_');
    saveAs(blob, `${fileName}.doc`);
    return;
  }

  const children: any[] = [
    // --- TIÊU ĐỀ ---
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "SỞ GIÁO DỤC VÀ ĐÀO TẠO", size: 24, font: "Times New Roman" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: `ĐỀ KIỂM TRA MÔN ${subject.toUpperCase()} - KHỐI ${grade.toUpperCase()}`, bold: true, size: 30, font: "Times New Roman" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: `Thời gian làm bài: 45 phút (không kể thời gian giao đề)`, italics: true, size: 22, font: "Times New Roman" }),
      ],
    }),
    new Paragraph({ text: "", spacing: { after: 400 } }),
    
    // --- PHẦN 1: ĐỀ BÀI ---
  ];

  const mcQuestions = data.questions.filter(q => q.type === QuestionType.MULTIPLE_CHOICE);
  const tfQuestions = data.questions.filter(q => q.type === QuestionType.TRUE_FALSE);
  const essayQuestions = data.questions.filter(q => q.type === QuestionType.ESSAY);
  const otherQuestions = data.questions.filter(q => 
    q.type !== QuestionType.MULTIPLE_CHOICE && 
    q.type !== QuestionType.TRUE_FALSE && 
    q.type !== QuestionType.ESSAY
  );

  const sections = [
    { title: "PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn.", questions: mcQuestions, labels: ["A. ", "B. ", "C. ", "D. "] },
    { title: "PHẦN II. Câu trắc nghiệm đúng sai", questions: tfQuestions, labels: ["a) ", "b) ", "c) ", "d) "] },
    { title: "PHẦN III. Câu trắc nghiệm trả lời ngắn.", questions: essayQuestions, labels: [] },
    { title: "PHẦN IV. Câu hỏi khác", questions: otherQuestions, labels: ["A. ", "B. ", "C. ", "D. "] }
  ];

  sections.forEach(section => {
    if (section.questions.length > 0) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: section.title, bold: true, size: 28, font: "Times New Roman", underline: {} })],
          spacing: { before: 400, after: 200 }
        })
      );

      section.questions.forEach((q, index) => {
        children.push(
          new Paragraph({
            spacing: { before: 240, after: 120 },
            children: [
              new TextRun({ text: `Câu ${index + 1}: `, bold: true, size: 26, font: "Times New Roman" }),
              ...parseContentToDocx(q.content, mode),
            ],
          })
        );

        if (q.options && q.options.length > 0) {
          children.push(
            new Paragraph({
              spacing: { after: 120 },
              children: q.options.flatMap((opt, oi) => {
                const label = section.labels[oi] || "";
                const cleanOpt = opt.replace(/^[A-D][\.\)\s]+/, "").replace(/^[a-d][\.\)\s]+/, "");
                // Dạng LaTeX (Dạng 2) thì gạch chân đáp án đúng ở đề
                const isCorrect = mode === 'latex' ? isOptionCorrect(q, label, oi) : false;
                
                return [
                  new TextRun({ 
                    text: label, 
                    bold: isCorrect, 
                    size: 26, 
                    font: "Times New Roman",
                    underline: isCorrect ? {} : undefined 
                  }),
                  ...parseContentToDocx(cleanOpt, mode, isCorrect),
                  new TextRun({ text: "            " }),
                ];
              }),
            })
          );
        }
      });
    }
  });

  // --- NGẮT TRANG ---
  children.push(new Paragraph({ text: "", pageBreakBefore: true }));

  // --- PHẦN 2: HƯỚNG DẪN GIẢI ---
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 400 },
      children: [
        new TextRun({ text: "PHẦN II: HƯỚNG DẪN GIẢI CHI TIẾT", bold: true, size: 32, font: "Times New Roman" }),
      ],
    })
  );

  sections.forEach(section => {
    if (section.questions.length > 0) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: section.title, bold: true, size: 28, font: "Times New Roman", underline: {} })],
          spacing: { before: 400, after: 200 }
        })
      );

      section.questions.forEach((q, index) => {
        // Viết lại câu hỏi trong phần lời giải (Dạng 2 hoặc Equation đều nên có để tiện theo dõi)
        children.push(
          new Paragraph({
            spacing: { before: 400, after: 150 },
            children: [
              new TextRun({ text: `Câu ${index + 1}: `, bold: true, size: 26, font: "Times New Roman" }),
              ...parseContentToDocx(q.content, mode),
            ],
          })
        );

        // Hiển thị lại các phương án
        if (q.options && q.options.length > 0) {
          children.push(
            new Paragraph({
              spacing: { after: 150 },
              children: q.options.flatMap((opt, oi) => {
                const label = section.labels[oi] || "";
                const cleanOpt = opt.replace(/^[A-D][\.\)\s]+/, "").replace(/^[a-d][\.\)\s]+/, "");
                const isCorrect = isOptionCorrect(q, label, oi);
                return [
                  new TextRun({ text: label, bold: isCorrect, size: 24, font: "Times New Roman", underline: isCorrect ? {} : undefined }),
                  ...parseContentToDocx(cleanOpt, mode, isCorrect),
                  new TextRun({ text: "      " }),
                ];
              }),
            })
          );
        }

        children.push(
          new Paragraph({
            spacing: { before: 100, after: 100 },
            children: [
              new TextRun({ text: "=> Chọn đáp án: ", bold: true, size: 26, font: "Times New Roman" }),
              new TextRun({ text: q.correctAnswer, bold: true, color: "FF0000", size: 26, font: "Times New Roman" }),
            ],
          }),
          new Paragraph({
            spacing: { before: 100, after: 300 },
            children: [
              new TextRun({ text: "Lời giải chi tiết: ", bold: true, italics: true, size: 26, font: "Times New Roman" }),
              ...parseContentToDocx(q.solution, mode),
            ],
          }),
          new Paragraph({
            border: { bottom: { color: "CCCCCC", space: 1, style: "single", size: 6 } }
          })
        );
      });
    }
  });

  const doc = new Document({
    sections: [{
      properties: { type: SectionType.CONTINUOUS },
      children: children
    }]
  });

  try {
    const blob = await Packer.toBlob(doc);
    const fileName = customFileName ? `${customFileName}.docx` : `De_Thi_Latex_Dang2_${subject}.docx`;
    saveAs(blob, fileName.replace(/\s+/g, '_'));
  } catch (error) {
    console.error("Lỗi khi tạo file Word:", error);
    alert("Không thể tạo file Word. Vui lòng thử lại.");
  }
};

export const exportExamToLatex2 = (data: ExamMatrix, subject: string, customFileName?: string) => {
  const mcQuestions = data.questions.filter(q => q.type === QuestionType.MULTIPLE_CHOICE);
  const tfQuestions = data.questions.filter(q => q.type === QuestionType.TRUE_FALSE);
  const essayQuestions = data.questions.filter(q => q.type === QuestionType.ESSAY);
  
  const cleanHtmlToLatex = (html: string) => {
    if (!html) return '';
    let text = html;
    text = text.replace(/<br\s*\/?>/gi, '\n\t');
    text = text.replace(/<\/p>/gi, '\n\t');
    text = text.replace(/<[^>]+>/g, '');
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    return text.trim();
  };

  let latexContent = `\\section{${subject}}\n\n`;

  if (mcQuestions.length > 0) {
    latexContent += `\\subsection{Trắc nghiệm một phương án đúng}\n`;
    latexContent += `\\setcounter{ex}{0}\n`;
    latexContent += `\\Opensolutionfile{ans}[Ans/ans_mc]\n\n`;

    mcQuestions.forEach((q, index) => {
      latexContent += `%%%================ex_${index + 1}================%%%\n`;
      latexContent += `\\begin{ex}\n`;
      latexContent += `\t${cleanHtmlToLatex(q.content)}\n`;
      latexContent += `\t\\choice\n`;
      
      q.options.forEach((opt, oi) => {
        const label = ["A", "B", "C", "D"][oi] || "";
        const isCorrect = isOptionCorrect(q, label, oi);
        const cleanOpt = cleanHtmlToLatex(opt.replace(/^[A-D][\\.\\)\\s]+/, "").replace(/^[a-d][\\.\\)\\s]+/, ""));
        if (isCorrect) {
          latexContent += `\t\t{\\True ${cleanOpt}}\n`;
        } else {
          latexContent += `\t\t{${cleanOpt}}\n`;
        }
      });
      
      latexContent += `\t\\loigiai{\n`;
      latexContent += `\t\t${cleanHtmlToLatex(q.solution || 'Lời giải')}\n`;
      latexContent += `\t}\n`;
      latexContent += `\\end{ex}\n\n`;
    });

    latexContent += `\\Closesolutionfile{ans}\n\n\n`;
  }

  if (tfQuestions.length > 0) {
    latexContent += `\\subsection{Trắc nghiệm đúng sai}\n`;
    latexContent += `\\setcounter{ex}{0}\n`;
    latexContent += `\\Opensolutionfile{ansbook}[Ansbook/ans_tf]\n\n`;

    tfQuestions.forEach((q, index) => {
      latexContent += `%%%================tf_${index + 1}================%%%\n`;
      latexContent += `\\begin{ex}%[2D4V2-2]\n`;
      latexContent += `\t${cleanHtmlToLatex(q.content)}\n`;
      latexContent += `\t\\choiceTF\n`;
      
      q.options.forEach((opt, oi) => {
        const label = ["A", "B", "C", "D"][oi] || "";
        const isCorrect = isOptionCorrect(q, label, oi);
        const cleanOpt = cleanHtmlToLatex(opt.replace(/^[A-D][\\.\\)\\s]+/, "").replace(/^[a-d][\\.\\)\\s]+/, ""));
        if (isCorrect) {
          latexContent += `\t\t{\\True ${cleanOpt}}\n`;
        } else {
          latexContent += `\t\t{${cleanOpt}}\n`;
        }
      });
      
      latexContent += `\t\\loigiai{\n`;
      latexContent += `\t\t\\begin{itemchoice}\n`;
      
      const solutionText = cleanHtmlToLatex(q.solution || 'Lời giải');
      const lines = solutionText.split('\n').filter(l => l.trim().length > 0);
      if (lines.length > 1) {
        lines.forEach(line => {
          latexContent += `\t\t\t\\itemch ${line.trim()} \\\\\n`;
        });
      } else {
        latexContent += `\t\t\t\\itemch ${solutionText} \\\\\n`;
      }
      
      latexContent += `\t\t\\end{itemchoice}\n`;
      latexContent += `\t}\n`;
      latexContent += `\\end{ex}\n\n`;
    });

    latexContent += `\\Closesolutionfile{ansbook}\n\n\n`;
  }

  if (essayQuestions.length > 0) {
    latexContent += `\\subsection{Trả lời ngắn}\n`;
    latexContent += `\\setcounter{bt}{0}\n`;
    latexContent += `\\Opensolutionfile{ansbt}[Ansbook/ans_sa]\n\n`;

    essayQuestions.forEach((q, index) => {
      latexContent += `%%%================sa_${index + 1}================%%%\n`;
      latexContent += `\\begin{bt}\n`;
      latexContent += `\t${cleanHtmlToLatex(q.content)}\n`;
      latexContent += `\t\\shortans{${cleanHtmlToLatex(q.correctAnswer || 'đáp số')}}\n`;
      latexContent += `\t\\loigiai{\n`;
      latexContent += `\t\t${cleanHtmlToLatex(q.solution || 'Lời giải')}\n`;
      latexContent += `\t}\n`;
      latexContent += `\\end{bt}\n\n`;
    });

    latexContent += `\\Closesolutionfile{ansbt}\n\n\n`;
  }

  latexContent += `%\\newpage\n`;
  latexContent += `\\begin{center}\n`;
  latexContent += `\t{\\Large\\bfseries\\sffamily PHẦN ĐÁP ÁN}\n`;
  latexContent += `\\end{center}\n`;
  latexContent += `\t\\setcounter{subsection}{0}\n\n\n`;

  if (mcQuestions.length > 0) {
    latexContent += `\\subsection{Phần trắc nghiệm}\n`;
    latexContent += `\t\\begin{flushleft}\n`;
    latexContent += `\t\t\\input{Ans/ans_mc}\n`;
    latexContent += `\t\\end{flushleft}\n\n`;
  }

  if (tfQuestions.length > 0) {
    latexContent += `\\subsection{Phần đúng sai}\n`;
    latexContent += `\t\\begin{flushleft}\n`;
    latexContent += `\t\t\\input{Ansbook/ans_tf}\n`;
    latexContent += `\t\\end{flushleft}\n\n`;
  }

  if (essayQuestions.length > 0) {
    latexContent += `\\subsection{Phần trả lời ngắn}\n`;
    latexContent += `\t\\begin{flushleft}\n`;
    latexContent += `\t\t\\input{Ansbook/ans_sa}\n`;
    latexContent += `\t\\end{flushleft}\n`;
  }

  const blob = new Blob(['\\ufeff', latexContent], { type: 'text/plain;charset=utf-8' });
  const fileName = customFileName || `De_Thi_Latex_2_${subject}`.replace(/\s+/g, '_');
  saveAs(blob, `${fileName}.tex`);
};
