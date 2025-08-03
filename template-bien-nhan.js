function generateBienNhanContent(data, lienSo, label) {
    function parseDate(d) {
        if (!d) return { ngay: "......", thang: "......", nam: "......" };
        const [day, month, year] = d.split('/');
        return { ngay: day, thang: month, nam: year };
    }
    const dateObj = parseDate(data.date);
    const ngayNhanObj = parseDate(data.ngayNhan);
    const ngayTraObj = parseDate(data.ngayTra);

    let giayToRows = "";
    if (data.giayTo && data.giayTo.length > 0) {
        data.giayTo.forEach((item, idx) => {
            giayToRows += `<tr>
                <td style="text-align:center;">${idx + 1}</td>
                <td>${item.ten}</td>
                <td style="text-align:center;">${item.soBanChinh}</td>
                <td style="text-align:center;">${item.soBanSao}</td>
            </tr>`;
        });
    }

    return `
        <div class="header-two-cols">
            <div class="col header-left">
                VĂN PHÒNG ĐĂNG KÝ ĐẤT ĐAI<br>
                <div style="display: inline-block;">
                    <b>TỈNH ĐỒNG NAI – CN LONG KHÁNH</b>
                    <div class="header-underline"></div>
                </div>
            </div>
            <div class="col header-right">
                <div class="quoctitle"><b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b></div>
                <div style="display: inline-block;">
                    <div class="slogan"><b>Độc lập – Tự do – Hạnh phúc</b></div>
                    <div class="header-underline"></div>
                </div>
            </div>
        </div>
        <div class="ngay-thang">${data.place || "TP.Long Khánh"}, ngày ${dateObj.ngay} tháng ${dateObj.thang} năm ${dateObj.nam}</div>
        <div class="giay-title">GIẤY TIẾP NHẬN HỒ SƠ VÀ HẸN TRẢ KẾT QUẢ</div>
        <span class="lien-label-below">(Liên ${lienSo}: ${label})</span>
        <div style="margin-bottom:5px;">Văn Phòng Đăng ký đất đai Tỉnh Đồng Nai – Chi nhánh Long Khánh</div>
        <div style="margin-bottom:5px;">Tiếp nhận hồ sơ của: Ông/bà: <b>${data.nguoiNop}</b></div>
        <div>Địa chỉ: ${data.diaChi} <br>
        Số điện thoại: ${data.dienThoai} – Email: ${data.email || ""}</div>
        <div>Nội dung yêu cầu giải quyết: ${data.noiDung}</div>
        <div>
            Số tờ: ${data.soTo}; số thửa: ${data.soThua};
            tại: <b>${data.diaChiThuaDat}</b>;
            Số HĐ: <b>${data.soHopDong}</b>
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
        <div style="margin:4px 0;">Số lượng hồ sơ: ${data.soLuongHoSo} (bộ)</div>
        <div>Thời gian giải quyết hồ sơ: ${data.thoiGianGiaiQuyet}</div>
        <div>Thời gian nhận hồ sơ: ngày ${ngayNhanObj.ngay} tháng ${ngayNhanObj.thang} năm ${ngayNhanObj.nam}</div>
        <div>Thời gian trả kết quả: ngày ${ngayTraObj.ngay} tháng ${ngayTraObj.thang} năm ${ngayTraObj.nam}</div>
        <div>Nhận kết quả tại: ${data.noiNhanKetQua}</div>
        <table class="footer-table" style="margin-top:10px;">
            <tr class="footer-titles">
                <td class="center bold">NGƯỜI NỘP HỒ SƠ<br><span style="font-weight:normal">(Ký, ghi rõ họ tên)</span></td>
                <td class="center bold">NGƯỜI NHẬN KẾT QUẢ<br><span style='font-weight:normal'>(Ký, ghi rõ họ tên)</span></td>
                <td class="center bold">NGƯỜI TIẾP NHẬN HỒ SƠ<br><span style="font-weight:normal">(Ký, ghi rõ họ tên)</span></td>
            </tr>
            <tr class="sign-box"><td></td><td></td><td></td></tr>
            <tr>
                <td class="center bold">${data.nguoiNop}</td>
                <td class="center bold">${data.nguoiNhanKetQua || ""}</td>
                <td class="center bold"></td>
            </tr>
        </table>
    `;
}

function generateBienNhanHTML(data) {
    return `
    <html>
    <head>
        <title>Giấy Tiếp Nhận Hồ Sơ</title>
        <meta charset="UTF-8">
        <style>
            @page {
                size: A4 landscape;
                margin: 1cm;
            }
            body { 
                font-family: 'Times New Roman', serif; 
                font-size: 11pt; 
                color: #000;
                margin: 0;
                padding: 0;
                display: flex;
            }
            .receipt-page { 
                width: 50%; 
                height: 100%;
                box-sizing: border-box; 
                padding: 0 5px;
            }
            .receipt-page.left {
                border-right: 1px dashed #999;
                padding-right: 10px;
            }
            .header-two-cols { 
                display: flex; 
                justify-content: space-between; 
                text-align: center;
                /* THAY ĐỔI: Giảm cỡ chữ tiêu đề */
                font-size: 9.5pt;
                margin-left: -15px;
                margin-right: -15px;
            }
            .header-left, .header-right { 
                flex-basis: 50%;
            }
            .header-underline { border-top: 1px solid #000; width: 80%; margin: 1px auto 0 auto; }
            .quoctitle, .slogan { font-weight: bold; }
            .ngay-thang { text-align: right; font-style: italic; margin-top: 5px; }
            .giay-title { text-align: center; font-weight: bold; font-size: 14pt; margin: 15px 0 0 0; }
            .lien-label-below { display: block; text-align: center; font-style: italic; margin-bottom: 10px; }
            table.data { width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 10pt; }
            table.data th, table.data td { border: 1px solid #333; padding: 4px; }
            table.data th { text-align: center; font-weight: bold; }
            .footer-table { width: 100%; table-layout: fixed; }
            .footer-table td { width: 33.33%; }
            .footer-table .footer-titles td { font-size: 9.5pt; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .sign-box td { height: 60px; }
        </style>
    </head>
    <body>
        <div class="receipt-page left">
            ${generateBienNhanContent(data, 1, 'Công chức')}
        </div>
        <div class="receipt-page">
             ${generateBienNhanContent(data, 2, 'Giao người nộp')}
        </div>
    </body>
    </html>
    `;
}