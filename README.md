# FPT 300 KTV — Campaign Intelligence Report

Báo cáo web tương tác cho chiến dịch tuyển dụng "300 Kỹ thuật viên" của FPT Telecom.

## Nội dung
- Tổng quan KPI
- Insight & Performance
- Creative Performance
- Audience Intelligence
- Action Plan
- Xuất PDF bằng Print

## Nguồn dữ liệu — Google Sheet sống
Web KHÔNG còn nhúng số liệu cứng. Mỗi lần mở trang (hoặc bấm nút "Làm mới"),
`src/App.jsx` tự tải file CSV publish từ Google Sheet "report ads" (tab
"Creative Reporting"), tự lọc các dòng có tên chiến dịch chứa "300KTV", rồi tự
tính lại toàn bộ chỉ số (CTR, CPM, CPC, CPL, breakdown theo creative/độ tuổi...).

Link CSV đang dùng nằm ở hằng số `SHEET_CSV_URL` đầu file `src/App.jsx`. Sheet
gốc phải luôn bật "Xuất bản lên web" (Publish to web) ở đúng tab "Creative
Reporting", định dạng CSV, và tick "Automatically republish when changes are
made" — vậy chỉ cần sửa số trong Sheet, mở lại (F5) trang web là ra số mới,
không cần build/deploy lại.

Nếu cần đổi sang Sheet khác hoặc tab khác: publish lại theo đúng các bước đã
làm, lấy link CSV mới, thay vào `SHEET_CSV_URL`.

## Chạy local
npm install
npm run dev

## Build
npm run build

## Deploy Netlify
Import repository vào Netlify, build command `npm run build`, publish directory `dist`.
File `netlify.toml` đã cấu hình sẵn.
