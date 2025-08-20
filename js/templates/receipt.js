function generateReceiptHTML(data) {
    const generateBienNhanContent = (data, lienSo, label) => {

        return `
            <div class="header-two-cols">
                <div class="col header-left">
                    <div class="bold">VĂN PHÒNG ĐĂNG KÝ ĐẤT ĐAI</div>
                    <div class="underline-container">
                        <div class="bold">TỈNH ĐỒNG NAI – CN LONG KHÁNH</div>
                        <div class="underline-short"></div>
                    </div>
                </div>
                <div class="col header-right">
                    <div class="bold quoctitle">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                    <div class="underline-container">
                        <div class="bold slogan">Độc lập – Tự do – Hạnh phúc</div>
                        <div class="underline-short"></div>
                    </div>
                </div>
            </div>
            <div class="ngay-thang">${data.place || "TP.Long Khánh"}, ngày ${dateObj.ngay} tháng ${dateObj.thang} năm ${dateObj.nam}</div>
            <div class="giay-title">GIẤY TIẾP NHẬN HỒ SƠ VÀ HẸN TRẢ KẾT QUẢ</div>
            <span class="lien-label-below">(Liên ${lienSo}: ${label})</span>
            <div style="margin-bottom:5px;">Văn Phòng Đăng ký đất đai Tỉnh Đồng Nai – Chi nhánh Long Khánh</div>
            <div style="margin-bottom:5px;">Tiếp nhận hồ sơ của: Ông/bà: <b>${escapeHTML(data.nguoiNop)}</b></div>
            <div>Địa chỉ: ${escapeHTML(data.diaChi)} <br>
            Số điện thoại: ${escapeHTML(data.dienThoai)} – Email: ${escapeHTML(data.email || "")}</div>
            <div>Nội dung yêu cầu giải quyết: ${escapeHTML(data.noiDung)}</div>
            <div>
                Số tờ: ${escapeHTML(data.soTo)}; số thửa: ${escapeHTML(data.soThua)};
                tại: <b>${escapeHTML(data.diaChiThuaDat)}</b>;
                Số HĐ: <b>${escapeHTML(data.soHopDong)}</b>
            </div>
            <div style="margin-top:7px;"><b>Thành phần hồ sơ nộp gồm:</b></div>
            <table class="data">
                <thead>
                    <tr style="background:#eee"><th>STT</th><th>Loại giấy tờ</th><th>Bản chính</th><th>Bản sao</th></tr>
                </thead>
                <tbody>
                    ${giayToRows}
                </tbody>
            </table>
            <div style="margin:4px 0;">Số lượng hồ sơ: ${escapeHTML(data.soLuongHoSo)} (bộ)</div>
            <div>Thời gian giải quyết hồ sơ: ${escapeHTML(data.thoiGianGiaiQuyet)}</div>
            <div>Thời gian nhận hồ sơ: ngày ${ngayNhanObj.ngay} tháng ${ngayNhanObj.thang} năm ${ngayNhanObj.nam}</div>
            <div>Thời gian trả kết quả: ngày ${ngayTraObj.ngay} tháng ${ngayTraObj.thang} năm ${ngayTraObj.nam}</div>
            <div>Nhận kết quả tại: ${escapeHTML(data.noiNhanKetQua)}</div>
            <table class="footer-table" style="margin-top:10px;">
                <tr class="footer-titles">
                    <td class="center bold">NGƯỜI NỘP HỒ SƠ<br><span style="font-weight:normal">(Ký, ghi rõ họ tên)</span></td>
                    <td class="center bold">NGƯỜI NHẬN KẾT QUẢ<br><span style='font-weight:normal'>(Ký, ghi rõ họ tên)</span></td>
                    <td class="center bold">NGƯỜI TIẾP NHẬN HỒ SƠ<br><span style="font-weight:normal">(Ký, ghi rõ họ tên)</span></td>
                </tr>
                <tr class="sign-box"><td></td><td></td><td></td></tr>
                <tr>
                    <td class="center bold">${escapeHTML(data.nguoiNop)}</td>
                    <td class="center bold">${escapeHTML(data.nguoiNhanKetQua || "")}</td>
                    <td class="center bold"></td>
                </tr>
            </table>
        `;
    }

    // Thêm khối style để định dạng trang in
    const printStyle = `
        <style>
            @media print {
                @page {
                    size: A4 landscape; /* Đặt khổ giấy A4 nằm ngang */
                    margin: 1.5cm; /* Có thể điều chỉnh lề giấy nếu cần */
                }
                body {
                    -webkit-print-color-adjust: exact; /* Đảm bảo màu nền được in trên Chrome */
                    print-color-adjust: exact; /* Đảm bảo màu nền được in */
                }
            }
        </style>
    `;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Giấy Tiếp Nhận Hồ Sơ</title>
            <link rel="stylesheet" href="css/print-styles.css">
            ${printStyle}
        </head>
        <body>
            <div class="page">
                <div class="receipt-page left">
                    ${generateBienNhanContent(data, 1, 'Công chức')}
                </div>
                <div class="receipt-page">
                     ${generateBienNhanContent(data, 2, 'Giao người nộp')}
                </div>
            </div>
        </body>
        </html>`;

    return html;
}
