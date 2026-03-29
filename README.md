<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# SMART PRACTICE EXAM STUDIO – AI Sinh Đề & Soạn Bài

Ứng dụng hỗ trợ giáo viên soạn bài, tạo đề thi ma trận và giải toán Polya sử dụng Google Gemini API.

## 🚀 Hướng dẫn Triển khai (Deploy) lên Vercel

### Bước 1: Đẩy code lên GitHub
1. Tạo một Repository mới trên GitHub (nên để **Private** để bảo mật).
2. Mở terminal tại thư mục dự án và chạy các lệnh sau:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <URL_REPOSITORY_CỦA_BẠN>
   git push -u origin main
   ```

### Bước 2: Kết nối với Vercel
1. Truy cập [Vercel Dashboard](https://vercel.com/dashboard) và đăng nhập.
2. Nhấn **"Add New..."** -> **"Project"**.
3. Chọn Repository GitHub bạn vừa tạo và nhấn **Import**.

### Bước 3: Cấu hình Biến môi trường (QUAN TRỌNG)
Trong màn hình "Configure Project":
1. **Framework Preset:** Vercel sẽ tự động chọn `Vite`.
2. **Root Directory:** Để mặc định (`./`).
3. **Environment Variables:** Mở mục này ra và thêm:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** `YOUR_GOOGLE_GEMINI_API_KEY` (Key lấy từ Google AI Studio)
   
   *Lưu ý: Nếu bạn muốn hỗ trợ tính năng người dùng tự nhập API Key riêng trong ứng dụng, bạn có thể bỏ qua bước này hoặc đặt một Key mặc định có giới hạn.*

4. Nhấn **Deploy**.

### Bước 4: Hoàn tất
- Vercel sẽ tiến hành Build và Deploy.
- Sau khi xong, bạn sẽ nhận được đường link (ví dụ: `project-name.vercel.app`).

## 💻 Chạy Local (Trên máy tính)

1. Cài đặt thư viện:
   ```bash
   npm install
   ```
2. Tạo file `.env.local` ở thư mục gốc và thêm API Key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
3. Chạy ứng dụng:
   ```bash
   npm run dev
   ```

## 🛠 Công nghệ sử dụng
- React 19 + TypeScript + Vite
- Tailwind CSS
- Google Gemini API SDK
- MathJax & Katex (Hiển thị công thức toán)
- Docx (Xuất file Word)
