const AppConfig = {
    // URL của Google Apps Script API (cần được triển khai lại để có CORS)
    GOOGLE_SHEET_API_URL: 'https://script.google.com/macros/s/AKfycbx1ME3Or6CtwKzel554Y5Aiyegs_ymbX4IgtM9Ax87gxDhfN-fXFijfo-BNhYI9QGqHQA/exec',

    // Thông tin người đại diện (tránh hard-code trong template)
    REPRESENTATIVE_INFO: {
        name: 'Phạm Văn Hải',
        position: 'Phó Giám đốc',
        // Cập nhật giấy ủy quyền nếu cần
        authorization: `(Theo ủy quyền số ....../GUQ.VPĐK-CNLK ngày ....../....../{YEAR} của Giám đốc Văn phòng Đăng ký đất đai tỉnh Đồng Nai- chi nhánh Long Khánh)`
    },

    // Các cài đặt mặc định
    DEFAULT_VAT_RATE: 8,
    DEFAULT_PHOTO_QTY: 5,
    DEFAULT_INFO_QTY: 1,

    // Cấu hình các khu vực
    communeProfiles: {
        "long_khanh": { name: "Long Khánh", liquidationSymbol: "TLHĐ.LK.VPĐK", contractSymbol: "HĐBV.LK.VPĐK" },
        "bao_vinh": { name: "Bảo Vinh", liquidationSymbol: "TLHĐ.BV.VPĐK", contractSymbol: "HĐDV.BV.VPĐK" },
        "binh_loc": { name: "Bình Lộc", liquidationSymbol: "TLHĐ.BL.VPĐK", contractSymbol: "HĐDV.BL.VPĐK" },
        "xuan_lap": { name: "Xuân Lập", liquidationSymbol: "TLHĐ.XL.VPĐK", contractSymbol: "HĐDV.XL.VPĐK" },
        "hang_gon": { name: "Hàng Gòn", liquidationSymbol: "TLHĐ.HG.VPĐK", contractSymbol: "HĐDV.HG.VPĐK" }
    }
};