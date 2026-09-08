# Báo cáo quảng cáo tuyển dụng 300 KTV - FPT Telecom

Trang HTML tĩnh, không cần build, tự đọc dữ liệu sống từ Google Sheet đã publish.

## Cách dùng
- Mở trực tiếp: bấm đúp `index.html`.
- Deploy: đẩy 2 file này lên GitHub rồi kết nối Netlify. `netlify.toml` đã đặt publish = thư mục gốc và command rỗng nên Netlify chỉ copy file, không chạy build.

## Giao diện
Mặc định nền sáng, chữ lớn cho dễ đọc trên máy tính lẫn điện thoại. Nút "Nền tối" ở góc phải
đổi sang nền tối; lựa chọn được ghi nhớ trong trình duyệt của từng người xem.

## Cập nhật số liệu
Sửa số trong Google Sheet (tab Creative Reporting). Sheet đã bật tự động republish nên
link CSV cập nhật theo. Mở lại trang hoặc bấm "Làm mới dữ liệu" là ra số mới.

## Đổi tỷ giá / ngưỡng CPL / link Sheet
Mở `index.html` bằng trình soạn thảo, tìm khối "CẤU HÌNH" ở đầu thẻ script:
- `RATE`      : tỷ giá USD sang VNĐ (đang là 26260)
- `CPL_GOOD`  : ngưỡng CPL tốt (30000)
- `CPL_BAD`   : ngưỡng CPL xấu (50000)
- `CSV_URL`   : link CSV publish của Google Sheet
- `AD_CREATIVES` : điền nội dung text + link ảnh từng bài quảng cáo để xem demo ở Phần 3

## Ghi chú xử lý dữ liệu
Các cột CPM, CPC, CTR, Tần suất trong Sheet bị hỏng do lỗi dấu phẩy thập phân lúc paste,
nên trang này bỏ qua chúng và tự tính lại từ cột gốc (chi tiêu, hiển thị, click, tiếp cận).
Trang cũng tự loại dòng tổng (Ngày/Trang = "All") và chiến dịch ngoài phạm vi 300KTV.
