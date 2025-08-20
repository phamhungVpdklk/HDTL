function generateControlSheetHTML(data) {
    const parseDate = (d) => {
        if (!d || d.split('/').length !== 3) return { ngay: "......", thang: "......", nam: "......" };
        const [day, month, year] = d.split('/');
        return { ngay: day, thang: month, nam: year };
    };
    const ngayNhanObj = parseDate(data.ngayNhan);
    const ngayTraObj = parseDate(data.ngayTra);

    // --- TẠO NỘI DUNG CHO BẢNG LUÂN CHUYỂN ---
    let tableRows = '';
    const numberOfRows = 5; // Tạo 5 hàng trống để theo dõi
    for (let i = 0; i < numberOfRows; i++) {
        tableRows += `
            <tr>
                <td class="col-agency">
                    <div class="agency-content agency-left">
                        1. Giao: ...............................<br>
                        ...............................<br>
                        2. Nhận: ...............................<br>
                        ...............................
                    </div>
                </td>
                <td class="col-time">
                    <div class="time-string">....giờ....phút,ngày...tháng....năm 202...</div>
                    <div class="signatures-row">
                        <div class="signature-cell">Người giao<br><br><br><br><br></div>
                        <div class="signature-cell">Người nhận<br><br><br><br><br></div>
                    </div>
                </td>
                <td class="col-result"></td>
                <td class="col-notes"></td>
            </tr>
        `;
    }
    // ---------------------------------------------

    return `
    <html>
    <head>
        <title>Phiếu Kiểm Soát Quá Trình Giải Quyết Hồ Sơ</title>
        <meta charset="UTF-8">
        <link rel="stylesheet" href="../../print.css">
    </head>
    <body class="control-sheet-body">
        <div class="header">
            <div class="left">
                <span class="bold">VĂN PHÒNG ĐĂNG KÝ ĐẤT ĐAI</span><br>
                <div class="underline-container">
                    <span class="bold">TỈNH ĐỒNG NAI – CHI NHÁNH LONG KHÁNH</span>
                    <div class="underline-short"></div>
                </div>
            </div>
            <div class="right">
                <span class="bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span><br>
                <div class="underline-container">
                    <span class="bold">Độc lập – Tự do – Hạnh phúc</span>
                    <div class="underline-short"></div>
                </div>
            </div>
        </div>
        <div class="main-title">PHIẾU KIỂM SOÁT QUÁ TRÌNH GIẢI QUYẾT HỒ SƠ</div>
        <div class="info">
            <p><span class="bold">Chủ hồ sơ ông (bà):</span> ${escapeHTML(data.chuHoSo)}</p>
            <p><span class="bold">Loại thủ tục:</span> ${escapeHTML(data.loaiThuTuc)}</p>
            <p><span class="bold">Thời gian nhận hồ sơ:</span> ngày ${ngayNhanObj.ngay} tháng ${ngayNhanObj.thang} năm ${ngayNhanObj.nam}</p>
            <p><span class="bold">Thời gian trả kết quả giải quyết hồ sơ:</span> ngày ${ngayTraObj.ngay} tháng ${ngayTraObj.thang} năm ${ngayTraObj.nam}</p>
            <p><span class="bold">Địa chỉ:</span> ${escapeHTML(data.diaChi)}</p>
            <p class="bold">Cơ quan (bộ phận) giải quyết hồ sơ:</p>
        </div>
        <table class="main-table">
            <thead>
                <tr>
                    <th class="col-agency">TÊN CƠ QUAN</th>
                    <th class="col-time">THỜI GIAN GIAO, NHẬN HỒ SƠ</th>
                    <th class="col-result">KẾT QUẢ GIẢI QUYẾT HỒ SƠ<br>(Trước hạn/đúng hạn/quá hạn)</th>
                    <th class="col-notes">GHI CHÚ</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    </body>
    </html>
    `;
}
