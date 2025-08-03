function generateBienNhanContent(data, lienSo, label) {
    function parseDate(d) {
        if (!d) return { ngay: "......", thang: "......", nam: "......" };
        const [day, month, year] = d.split('/');
        return { ngay: day, thang: month, nam: year };
    }
    const dateObj = parseDate(data.date);
    const ngayNhanObj = parseDate(data.ngayNhan);
    const ngayTraObj = parseDate(data.ngayTra);

    // Tạo bảng giấy tờ, dòng 2 luôn là "Các giấy tờ khác có liên quan kèm theo"
    let giayToRows = "";
    data.giayTo.forEach((item, idx) => {
        let ten = idx === 1 ? "Các giấy tờ khác có liên quan kèm theo" : item.ten;
        giayToRows += `<tr>
            <td>${idx + 1}</td>
            <td>${ten}</td>
            <td style="text-align:center">${item.soBanChinh}</td>
            <td style="text-align:center">${item.soBanSao}</td>
        </tr>`;
    });

    return `
        <div class="header-two-cols">
            <div class="col header-left">
                VĂN PHÒNG ĐĂNG KÝ ĐẤT ĐAI<br>
                TỈNH ĐỒNG NAI – CN LONG KHÁNH
                <div class="header-underline"></div>
            </div>
            <div class="col header-right">
                <div class="quoctitle">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div class="slogan">Độc lập – Tự do – Hạnh phúc</div>
                <div class="header-underline"></div>
            </div>
        </div>
        <div class="ngay-thang">${data.place || "TP.Long Khánh"}, ngày ${dateObj.ngay} tháng ${dateObj.thang} năm ${dateObj.nam}</div>
        <div class="giay-title">GIẤY TIẾP NHẬN HỒ SƠ VÀ HẸN TRẢ KẾT QUẢ</div>
        <span class="lien-label-below">Liên ${lienSo} (${label})</span>
        <div style="margin-bottom:5px;">Tiếp nhận hồ sơ của: Ông/bà: <b>${data.nguoiNop}</b> – ${data.maHoSo || ""}</div>
        <div>Địa chỉ: ${data.diaChi} <br>
        Số điện thoại: ${data.dienThoai} – Email: ${data.email || ""}</div>
        <div>Nội dung yêu cầu giải quyết: ${data.noiDung}</div>
        <div>
            Số tờ: ${data.soTo}; số thửa: ${data.soThua};
            Địa chỉ thửa đất: <b>${data.diaChiThuaDat}</b>;
            Số hợp đồng: <b>${data.soHopDong}</b>
        </div>
        <div style="margin-top:7px;"><b>Thành phần hồ sơ nộp gồm:</b></div>
        <table class="data">
            <tr style="background:#eee"><th>STT</th><th>Loại giấy tờ</th><th>Bản chính</th><th>Bản sao</th></tr>
            ${giayToRows}
        </table>
        <div style="margin:4px 0;">Số lượng hồ sơ: ${data.soLuongHoSo} (bộ)</div>
        <div>Thời gian giải quyết hồ sơ: ${data.thoiGianGiaiQuyet}</div>
        <div>Thời gian nhận hồ sơ: ngày ${ngayNhanObj.ngay} tháng ${ngayNhanObj.thang} năm ${ngayNhanObj.nam}</div>
        <div>Thời gian trả kết quả: ngày ${ngayTraObj.ngay} tháng ${ngayTraObj.thang} năm ${ngayTraObj.nam}</div>
        <div>Nhận kết quả tại: ${data.noiNhanKetQua}</div>
        <table class="footer-table" style="margin-top:10px;">
            <tr>
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
