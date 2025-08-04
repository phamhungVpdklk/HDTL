function generatePhieuKiemSoatHTML(data) {
    const parseDate = (d) => {
        if (!d || d.split('/').length !== 3) return { ngay: "......", thang: "......", nam: "......" };
        const [day, month, year] = d.split('/');
        return { ngay: day, thang: month, nam: year };
    };
    const ngayNhanObj = parseDate(data.ngayNhan);
    const ngayTraObj = parseDate(data.ngayTra);

    // --- TẠO NỘI DUNG CHO BẢNG LUÂN CHUYỂN ---
    let tableRows = `
        <tr>
            <td class="col-agency">
                <p>1. Giao: Bộ phận Tiếp nhận và trả kết quả</p>
                <p>2. Nhận: ...................................</p>
            </td>
            <td class="col-time">
                <table class="nested-table">
                    <tr><td colspan="2" class="nested-time-string">....giờ....phút,.....ngày...tháng....năm 202...</td></tr>
                    <tr>
                        <td class="nested-sig-box left">Người giao</td>
                        <td class="nested-sig-box right">Người nhận</td>
                    </tr>
                </table>
            </td>
            <td class="col-result"></td>
            <td class="col-notes"></td>
        </tr>
    `;
    for (let i = 0; i < 4; i++) {
        tableRows += `
            <tr>
                <td class="col-agency">
                    <p>1. Giao: .......................................</p>
                    <p>2. Nhận: .......................................</p>
                </td>
                <td class="col-time">
                    <table class="nested-table">
                        <tr><td colspan="2" class="nested-time-string">....giờ....phút,.....ngày...tháng....năm 202...</td></tr>
                        <tr>
                            <td class="nested-sig-box left">Người giao</td>
                            <td class="nested-sig-box right">Người nhận</td>
                        </tr>
                    </table>
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
        <style>
            @page {
                size: A4 portrait;
                margin: 1cm;
            }
            body { 
                font-family: 'Times New Roman', serif; 
                font-size: 12pt; 
                color: #000;
                line-height: 1.5;
            }
            .bold { font-weight: bold; }
            .center { text-align: center; }
            .header { display: flex; justify-content: space-between; font-size: 10pt; line-height: 1.5; }
            .header .left, .header .right {
                width: 50%;
                text-align: center;
            }
            .header .underline {
                border-top: 1px solid black;
                width: 60%;
                margin: 0 auto;
            }
            .date-place {
                text-align: right;
                font-style: italic;
            }
            .main-title {
                text-align: center;
                font-weight: bold;
                font-size: 12pt;
                margin-top: 20px;
                margin-bottom: 20px;
            }
            .info p {
                margin: 0;
                margin-top: 12pt;
            }
            .main-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
                font-size: 10pt;
                table-layout: fixed;
            }
            .main-table th, .main-table td {
                border: 1px solid #000;
                padding: 0;
                text-align: center;
                vertical-align: top;
            }
            .main-table th { 
                padding: 5px;
            }
            .main-table tbody tr {
                height: 80px;
            }
            .main-table td p {
                margin: 5px 8px;
                text-align: left;
            }
            
            .nested-table {
                width: 100%;
                height: 100%;
                border-collapse: collapse;
            }
            .nested-table td {
                border: none;
                padding: 2px 5px;
                text-align: center;
            }
            .nested-time-string {
                border-bottom: 1px solid black;
                height: 10px;
            }
            .nested-sig-box {
                width: 50%;
                vertical-align: top;
                height: 70px;
                padding-top: 5px;
            }
            .nested-sig-box.left {
                border-right: 1px solid black;
            }
            
            .col-agency { width: 30%; }
            .col-time { width: 35%; }
            .col-result { width: 15%; }
            .col-notes { width: 20%; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="left">
                <span class="bold">VĂN PHÒNG ĐĂNG KÝ ĐẤT ĐAI</span><br>
                <span class="bold">TỈNH ĐỒNG NAI – CHI NHÁNH LONG KHÁNH</span>
                <div class="underline"></div>
            </div>
            <div class="right">
                <span class="bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span><br>
                <span class="bold">Độc lập – Tự do – Hạnh phúc</span>
                <div class="underline"></div>
            </div>
        </div>
        <div class="date-place">${data.place}, ngày ${ngayNhanObj.ngay} tháng ${ngayNhanObj.thang} năm ${ngayNhanObj.nam}</div>
        <div class="main-title">PHIẾU KIỂM SOÁT QUÁ TRÌNH GIẢI QUYẾT HỒ SƠ</div>
        <div class="info">
            <p><span class="bold">Chủ hồ sơ ông (bà):</span> ${data.chuHoSo}</p>
            <p><span class="bold">Loại thủ tục:</span> ${data.loaiThuTuc}</p>
            <p><span class="bold">Thời gian nhận hồ sơ:</span> ngày ${ngayNhanObj.ngay} tháng ${ngayNhanObj.thang} năm ${ngayNhanObj.nam}</p>
            <p><span class="bold">Thời gian trả kết quả giải quyết hồ sơ:</span> ngày ${ngayTraObj.ngay} tháng ${ngayTraObj.thang} năm ${ngayTraObj.nam}</p>
            <p><span class="bold">Địa chỉ:</span> ${data.diaChi}</p>
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