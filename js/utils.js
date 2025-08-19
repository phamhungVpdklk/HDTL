// --- HÀM BẢO MẬT ---
/**
 * Chuyển đổi các ký tự HTML đặc biệt thành các thực thể an toàn để chống XSS.
 * @param {string} str Chuỗi đầu vào.
 * @returns {string} Chuỗi đã được làm sạch.
 */
function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>"']/g, match => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[match]));
}

// --- HÀM ĐỊNH DẠNG & TÍNH TOÁN ---

/**
 * Định dạng một số thành chuỗi tiền tệ Việt Nam.
 * @param {number} amount Số tiền.
 * @returns {string} Chuỗi đã định dạng (ví dụ: "1.234.567 ₫").
 */
function formatCurrency(amount) {
    if (isNaN(amount) || amount === 0) return '0 ₫';
    return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}

/**
 * Chuyển đổi một số thành chữ tiếng Việt.
 * @param {number} num Số cần chuyển đổi.
 * @returns {string} Số đã được chuyển thành chữ.
 */
function numberToWords(num) {
    if (num == null || isNaN(num)) return "";
    if (num === 0) return 'Không đồng';

    const a = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười', 'mười một', 'mười hai', 'mười ba', 'mười bốn', 'mười lăm', 'mười sáu', 'mười bảy', 'mười tám', 'mười chín'];
    const b = ['', '', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'];
    const g = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ', 'tỷ tỷ'];

    let i = 0, j = 0, str = "", s = num.toString();
    if (s.length > 27) return "Số quá lớn!";

    let n = s.split('').reverse();
    while (n.length % 3 !== 0) n.push("0");

    for (i = 0; i < n.length; i += 3) {
        let n1 = parseInt(n[i]), n2 = parseInt(n[i + 1]), n3 = parseInt(n[i + 2]);
        let gr = n.slice(i, i + 3).join('');
        if (gr !== "000") {
            let s1 = a[n1], s2 = b[n2], s3 = a[n3];
            let block = "";

            if (n3 > 0) {
                block += s3 + " trăm";
                if (n2 == 0 && n1 > 0) block += " linh";
            }
            if (n2 > 1) {
                block += " " + s2;
                if (n1 === 1) s1 = "mốt";
                if (n1 === 5) s1 = "lăm";
            } else if (n2 == 1) {
                block += " mười";
                if (n1 === 5) s1 = "lăm";
            }
            
            if (s1 !== "" && n2 !== 1) block += " " + s1;
            
            str = block.trim() + " " + g[i / 3] + " " + str;
        }
    }

    str = str.trim();
    if (str.length > 0) str = str.charAt(0).toUpperCase() + str.slice(1);
    
    return str + " đồng";
}


/**
 * Tính toán chi phí dựa trên diện tích.
 */
function calculateAreaBased(service, area) {
    for (const tier of service.tiers) {
        // *** THAY ĐỔI QUAN TRỌNG: Sửa từ '<' thành '<=' để bao gồm cả cận trên của bậc giá ***
        if (area <= tier.max_area) return tier.price;
    }
    return service.tiers[service.tiers.length - 1].price;
}

/**
 * Tính toán chi phí với chiết khấu lũy tiến.
 */
function calculateProgressiveDiscount(service, quantity) {
    let totalCost = 0;
    let remainingQty = quantity;
    let lastMaxCount = 0;
    for (const tier of service.tiers) {
        if (remainingQty <= 0) break;
        const tierMax = tier.max_count === 'infinity' ? Infinity : tier.max_count;
        const countInTier = Math.min(remainingQty, tierMax - lastMaxCount);
        totalCost += countInTier * service.base_price * tier.rate;
        remainingQty -= countInTier;
        lastMaxCount = tier.max_count;
    }
    return totalCost;
}

/**
 * Tính ngày trả kết quả dựa trên số ngày làm việc (bỏ qua T7, CN).
 */
function calculateReturnDate(startDate, workingDays) {
    let currentDate = new Date(startDate.getTime());
    let hour = currentDate.getHours();
    let minutes = currentDate.getMinutes();
    let day = currentDate.getDay();

    if (hour >= 17 || day === 0 || day === 6) { // Nếu sau 5h chiều, hoặc là T7/CN
        currentDate.setDate(currentDate.getDate() + (day === 5 ? 3 : (day === 6 ? 2 : 1))); // Next working day
        currentDate.setHours(8, 0, 0, 0);
    } else if (hour < 8) {
        currentDate.setHours(8, 0, 0, 0);
    } else if ((hour === 11 && minutes >= 30) || (hour >= 12 && hour < 13)) {
         currentDate.setHours(13, 0, 0, 0);
    }

    while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(8, 0, 0, 0);
    }

    let daysAdded = 0;
    while (daysAdded < workingDays) {
        currentDate.setDate(currentDate.getDate() + 1);
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) { // 0=Sunday, 6=Saturday
            daysAdded++;
        }
    }
    
    const dd = String(currentDate.getDate()).padStart(2, '0');
    const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
    const yyyy = currentDate.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}


// --- HÀM TIỆN ÍCH GIAO DIỆN (MODAL) ---
const modal = {
    overlay: document.getElementById('modal-overlay'),
    box: document.getElementById('modal-box'),
    title: document.getElementById('modal-title'),
    message: document.getElementById('modal-message'),
    okBtn: document.getElementById('modal-ok-btn'),
    cancelBtn: document.getElementById('modal-cancel-btn'),
    promptContainer: document.getElementById('modal-prompt-input-container'),
    promptInput: document.getElementById('modal-prompt-input'),
    _resolve: null,

    init() {
        this.okBtn.addEventListener('click', () => this.handleOk());
        this.cancelBtn.addEventListener('click', () => this.handleCancel());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.handleCancel();
        });
    },

    handleOk() {
        const value = this.promptContainer.classList.contains('hidden') ? true : this.promptInput.value;
        this.hide();
        if (this._resolve) this._resolve(value);
    },

    handleCancel() {
        this.hide();
        if (this._resolve) this._resolve(null); // null indicates cancellation
    },

    show() {
        this.overlay.classList.remove('hidden');
    },

    hide() {
        this.overlay.classList.add('hidden');
        this.promptContainer.classList.add('hidden');
    },

    alert(title, message) {
        return new Promise(resolve => {
            this._resolve = resolve;
            this.title.textContent = title;
            this.message.textContent = message;
            this.cancelBtn.classList.add('hidden');
            this.promptContainer.classList.add('hidden');
            this.okBtn.textContent = 'OK';
            this.show();
        });
    },

    confirm(title, message) {
        return new Promise(resolve => {
            this._resolve = resolve;
            this.title.textContent = title;
            this.message.textContent = message;
            this.cancelBtn.classList.remove('hidden');
            this.promptContainer.classList.add('hidden');
            this.okBtn.textContent = 'Đồng ý';
            this.cancelBtn.textContent = 'Hủy';
            this.show();
        });
    },

    prompt(title, message, defaultValue = '') {
        return new Promise(resolve => {
            this._resolve = resolve;
            this.title.textContent = title;
            this.message.textContent = message;
            this.promptContainer.classList.remove('hidden');
            this.promptInput.value = defaultValue;
            this.cancelBtn.classList.remove('hidden');
            this.okBtn.textContent = 'Xác nhận';
            this.cancelBtn.textContent = 'Hủy';
            this.show();
            setTimeout(() => this.promptInput.focus(), 100);
        });
    }
};

modal.init();
