document.addEventListener('DOMContentLoaded', () => {
    // --- CẤU HÌNH API ---
    const GOOGLE_SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbx1ME3Or6CtwKzel554Y5Aiyegs_ymbX4IgtM9Ax87gxDhfN-fXFijfo-BNhYI9QGqHQA/exec';

    // --- CƠ SỞ DỮ LIỆU TĨNH ---
    const communeProfiles = {
        "long_khanh": { name: "Long Khánh", liquidationSymbol: "TLHĐ.LK.VPĐK", contractSymbol: "HĐBV.LK.VPĐK" },
        "bao_vinh": { name: "Bảo Vinh", liquidationSymbol: "TLHĐ.BV.VPĐK", contractSymbol: "HĐDV.BV.VPĐK" },
        "binh_loc": { name: "Bình Lộc", liquidationSymbol: "TLHĐ.BL.VPĐK", contractSymbol: "HĐDV.BL.VPĐK" },
        "xuan_lap": { name: "Xuân Lập", liquidationSymbol: "TLHĐ.XL.VPĐK", contractSymbol: "HĐDV.XL.VPĐK" },
        "hang_gon": { name: "Hàng Gòn", liquidationSymbol: "TLHĐ.HG.VPĐK", contractSymbol: "HĐDV.HG.VPĐK" }
    };
    const pricingData = { 
        "do_chinh_ly": { "name": "Trích đo bản đồ địa chính", "unit": "m²", "type": "area_based", "vat_applicable": true, "tiers": [ { "max_area": 100, "price": 913000 }, { "max_area": 300, "price": 1085000 }, { "max_area": 500, "price": 1150000 }, { "max_area": 1000, "price": 1408000 }, { "max_area": 3000, "price": 1933000 }, { "max_area": 10000, "price": 2969000 }, { "max_area": 100000, "price": 3563000 }, { "max_area": 500000, "price": 4157000 } ] }, 
        "doi_soat_ban_do": { "name": "Đối soát bản đồ địa chính", "unit": "m²", "type": "area_based", "vat_applicable": true, "tiers": [ { "max_area": 100, "price": 310000 }, { "max_area": 300, "price": 369000 }, { "max_area": 500, "price": 391000 }, { "max_area": 1000, "price": 479000 }, { "max_area": 3000, "price": 657000 }, { "max_area": 10000, "price": 1010000 }, { "max_area": 100000, "price": 1212000 }, { "max_area": 500000, "price": 1414000 } ] }, 
        "bien_ve": { "name": "Trích lục và biên vẽ thửa đất", "unit": "Thửa", "type": "progressive_discount", "vat_applicable": true, "base_price": 235000, "tiers": [ { "max_count": 1, "rate": 1.0 }, { "max_count": 10, "rate": 0.8 }, { "max_count": 100, "rate": 0.5 }, { "max_count": "infinity", "rate": 0.4 } ] }, 
        "xuat_ho_so_a4": { "name": "Xuất hồ sơ kỹ thuật thửa đất A4", "unit": "Thửa", "type": "fixed_rate", "vat_applicable": true, "price": 90000 }, 
        "cong_ngoai_nghiep": { "name": "Công ngoại nghiệp", "unit": "công", "type": "fixed_rate", "vat_applicable": true, "price": 225000 }, 
        "cong_noi_nghiep": { "name": "Công nội nghiệp", "unit": "công", "type": "fixed_rate", "vat_applicable": true, "price": 202000 }, 
        "do_vi_tri_moc": { "name": "Đo xác định vị trí mốc", "unit": "mốc", "type": "fixed_rate", "vat_applicable": true, "price": 149000 }, 
        "pho_to": { "name": "Phô tô tài liệu", "unit": "tờ", "type": "fixed_rate", "vat_applicable": true, "price": 2000 }, 
        "khai_thac_thong_tin": { "name": "Khai thác thông tin", "unit": "file", "type": "fixed_rate", "vat_applicable": false, "price": 40000 } 
    };
    
    // --- LẤY CÁC ELEMENT TRÊN GIAO DIỆN ---
    const calculatorView = document.getElementById('calculator-view');
    const managerView = document.getElementById('manager-view');
    const showManagerBtn = document.getElementById('show-manager-btn');
    const showCalculatorBtn = document.getElementById('show-calculator-btn');
    const clearFormBtn = document.getElementById('clear-form-btn');
    const communeSelect = document.getElementById('commune-select');
    const contractFullNumberInput = document.getElementById('contract-full-number');
    const contractDateInput = document.getElementById('contract-date');
    const liquidationSection = document.getElementById('liquidation-section');
    const liquidationFullNumberInput = document.getElementById('liquidation-full-number');
    const liquidationDateInput = document.getElementById('liquidation-date');
    const clientNameInput = document.getElementById('client-name');
    const clientPhoneInput = document.getElementById('client-phone');
    const clientEmailInput = document.getElementById('client-email');
    const clientAddressInput = document.getElementById('client-address');
    const editContractBtn = document.getElementById('edit-contract-btn');
    const addParcelBtn = document.getElementById('add-parcel-btn');
    const invoiceItemsContainer = document.getElementById('invoice-items');
    const invoiceForm = document.getElementById('invoice-form');
    const calculateBtn = document.getElementById('calculate-btn');
    const resultsContainer = document.getElementById('results-container');
    const resultsDisplay = document.getElementById('results-display');
    const vatRateInput = document.getElementById('vat-rate');
    const photoQtyInput = document.getElementById('photo-qty');
    const infoQtyInput = document.getElementById('info-qty');
    const exportControlSheetBtn = document.getElementById('export-control-sheet-btn');
    const exportContractBtn = document.getElementById('export-contract-btn');
    const exportLiquidationBtn = document.getElementById('export-liquidation-btn');
    const exportReceiptBtn = document.getElementById('export-receipt-btn');
    const managerRecordsBody = document.getElementById('manager-records-body');
    const totalRecordsEl = document.getElementById('total-records');
    const totalRevenueEl = document.getElementById('total-revenue');

    let currentInvoiceData = {};
    let isLiquidationMode = false;
    let isEditMode = false;
    let cachedRecords = null;
    let wasEditedInLiquidation = false;
    
    function calculateReturnDate(startDate, workingDays) {
        let currentDate = new Date(startDate.getTime());
        let hour = currentDate.getHours();
        let minutes = currentDate.getMinutes();
        let day = currentDate.getDay();

        if (hour >= 17 || day === 0 || day === 6) {
            currentDate.setDate(currentDate.getDate() + 1);
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
            if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
                daysAdded++;
            }
        }
        
        const dd = String(currentDate.getDate()).padStart(2, '0');
        const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
        const yyyy = currentDate.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    }

    // --- CÁC HÀM GIAO TIẾP API ---
    async function loadAndCacheRecords() {
        try {
            const response = await fetch(GOOGLE_SHEET_API_URL);
            if (!response.ok) throw new Error('Không thể kết nối tới Google Sheets.');
            cachedRecords = await response.json();
            return true;
        } catch (error) {
            console.error('Lỗi khi tải và cache dữ liệu:', error);
            cachedRecords = [];
            return false;
        }
    }

    async function sendData(action, data) {
        try {
            const payload = { action, data };
            await fetch(GOOGLE_SHEET_API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            cachedRecords = null;
            return true;
        } catch (error) {
            console.error(`Lỗi khi thực hiện ${action}:`, error);
            alert(`Đã xảy ra lỗi khi gửi dữ liệu lên Google Sheets.`);
            return false;
        }
    }
    
    async function getNextContractNumber() {
        try {
            const response = await fetch(`${GOOGLE_SHEET_API_URL}?action=getNextContractNumber`);
            if (!response.ok) throw new Error('Không thể lấy số hợp đồng.');
            const data = await response.json();
            return data.nextContractNumber;
        } catch (error) {
            console.error('Lỗi khi lấy số HĐ:', error);
            alert('Không thể lấy số hợp đồng tự động. Vui lòng thử lại.');
            return null;
        }
    }
    
    async function getNextLiquidationNumber() {
        try {
            const response = await fetch(`${GOOGLE_SHEET_API_URL}?action=getNextLiquidationNumber`);
            if (!response.ok) throw new Error('Không thể lấy số thanh lý.');
            const data = await response.json();
            return data.nextLiquidationNumber;
        } catch (error) {
            console.error('Lỗi khi lấy số TL:', error);
            alert('Không thể lấy số thanh lý tự động. Vui lòng thử lại.');
            return null;
        }
    }
    
    // --- QUẢN LÝ GIAO DIỆN ---
    async function switchView(viewToShow) {
        if (viewToShow === 'manager') {
            calculatorView.classList.add('hidden');
            managerView.classList.remove('hidden');
            await renderManagerTable();
        } else {
            managerView.classList.add('hidden');
            calculatorView.classList.remove('hidden');
        }
    }
    showManagerBtn.addEventListener('click', () => switchView('manager'));
    showCalculatorBtn.addEventListener('click', () => { clearForm(true); switchView('calculator'); });
    clearFormBtn.addEventListener('click', () => clearForm(true));

    // --- FORM LOGIC ---
    for (const key in communeProfiles) { const option = document.createElement('option'); option.value = key; option.textContent = communeProfiles[key].name; communeSelect.appendChild(option); }
    
    function setDefaultDate() {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        const formattedDate = `${day}/${month}/${year}`;
        liquidationDateInput.value = formattedDate;
        contractDateInput.value = formattedDate;
    }

    function updateContractFields() {
        const selectedProfile = communeProfiles[communeSelect.value];
        const contractNumberBase = contractFullNumberInput.value.split('/')[0] || '';
        contractFullNumberInput.value = `${contractNumberBase}/${selectedProfile.contractSymbol}`;
        
        const liquidationNumberBase = liquidationFullNumberInput.value.split('/')[0] || '';
        liquidationFullNumberInput.value = `${liquidationNumberBase}/${selectedProfile.liquidationSymbol}`;
    }
    communeSelect.addEventListener('change', updateContractFields);
    
    addParcelBtn.addEventListener('click', () => { 
        if(document.querySelector('.empty-state')) document.querySelector('.empty-state').remove();
        addParcelCard(); 
    });
    invoiceItemsContainer.addEventListener('click', (e) => { if (e.target.classList.contains('add-service-to-parcel-btn')) { const controlsDiv = e.target.closest('.parcel-service-controls'); const parcelCard = e.target.closest('.parcel-card'); const select = controlsDiv.querySelector('select'); const serviceKey = select.value; if (!serviceKey) return; addServiceToParcel(parcelCard, {serviceKey: serviceKey}); select.value = ''; } if (e.target.classList.contains('remove-service-btn')) { e.target.closest('.service-item-line').remove(); } if (e.target.classList.contains('remove-parcel-btn')) { e.target.closest('.parcel-card').remove(); } });
    
    editContractBtn.addEventListener('click', () => {
        if (!confirm("Bạn có chắc muốn mở khóa để chỉnh sửa hợp đồng gốc không? Mọi thay đổi sẽ được lưu lại khi hoàn tất thanh lý.")) return;
        
        wasEditedInLiquidation = true;
        document.querySelectorAll('#calculator-view input, #calculator-view select').forEach(el => {
            if (el.id !== 'contract-full-number' && el.id !== 'liquidation-full-number') {
                el.disabled = false;
            }
        });
        addParcelBtn.style.display = 'inline-block';
        
        invoiceItemsContainer.querySelectorAll('.parcel-card').forEach(card => {
             card.querySelectorAll('input, select, button').forEach(el => el.disabled = false);
        });

        calculateBtn.textContent = 'Tính toán lại & Hoàn tất Thanh lý';
        editContractBtn.classList.add('hidden');
    });

    invoiceForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        let errors = [];
        if (!clientNameInput.value.trim()) errors.push("Tên khách hàng");
        if (!clientAddressInput.value.trim()) errors.push("Địa chỉ khách hàng");
        
        document.querySelectorAll('.parcel-card').forEach((card, index) => {
            const mapSheet = card.querySelector('.map-sheet-input').value.trim();
            const parcelNo = card.querySelector('.parcel-no-input').value.trim();
            const area = card.querySelector('.area-input').value.trim();
            if (!mapSheet) errors.push(`Số tờ (Hồ sơ ${index + 1})`);
            if (!parcelNo) errors.push(`Số thửa (Hồ sơ ${index + 1})`);
            if (!area) errors.push(`Diện tích (Hồ sơ ${index + 1})`);
        });

        if (errors.length > 0) {
            alert("Vui lòng điền đầy đủ các thông tin bắt buộc:\n- " + errors.join("\n- "));
            return;
        }
        
        const contractInfo = { location: communeProfiles[communeSelect.value].name, fullNumber: contractFullNumberInput.value, date: contractDateInput.value, fullLiquidationNumber: liquidationFullNumberInput.value, liquidationDate: liquidationDateInput.value };
        const clientInfo = { name: clientNameInput.value, phone: clientPhoneInput.value, email: clientEmailInput.value, address: clientAddressInput.value };
        let totalSection1 = 0;
        const allOptionalItems = [];
        const selectedCommuneName = communeProfiles[communeSelect.value].name;

        document.querySelectorAll('.parcel-card').forEach(card => {
            const parcelInfo = { 
                mapSheet: card.querySelector('.map-sheet-input').value || 'N/A', 
                parcelNo: card.querySelector('.parcel-no-input').value || 'N/A', 
                address: selectedCommuneName, 
                area: parseFloat((card.querySelector('.area-input').value || '0').replace(',', '.')) || 0, 
                services: [] 
            };
            card.querySelectorAll('.service-item-line').forEach(line => {
                const serviceKey = line.dataset.serviceKey;
                const service = pricingData[serviceKey];
                let value = (service.type === 'area_based') ? parcelInfo.area : parseFloat((line.querySelector('.calc-value-input')?.value || '0').replace(',', '.')) || 0;
                if (value > 0) {
                    let cost = 0;
                    switch (service.type) { case 'area_based': cost = calculateAreaBased(service, value); break; case 'progressive_discount': cost = calculateProgressiveDiscount(service, value); break; case 'fixed_rate': cost = service.price * value; break; }
                    let quantity, unitPrice;
                    if (service.type === 'area_based') { quantity = 1; unitPrice = cost; } else if (service.type === 'progressive_discount') { quantity = value; unitPrice = (value > 0) ? cost / value : 0; } else { quantity = value; unitPrice = service.price; }
                    parcelInfo.services.push({ serviceKey, name: service.name, unit: service.unit, quantity, unitPrice, cost, type: service.type, value });
                    totalSection1 += cost;
                }
            });
            if (parcelInfo.services.length > 0) allOptionalItems.push(parcelInfo);
        });

        let contractType = 'complex';
        if (allOptionalItems.some(parcel => parcel.services.some(service => service.serviceKey === 'bien_ve'))) {
            contractType = 'simple';
        }

        const photoQty = parseFloat(photoQtyInput.value) || 0;
        const totalSection2 = photoQty * pricingData.pho_to.price;
        const infoQty = parseFloat(infoQtyInput.value) || 0;
        const totalSection3 = infoQty * pricingData.khai_thac_thong_tin.price;
        const totalBeforeVat = totalSection1 + totalSection2;
        const vatRateValue = parseFloat(vatRateInput.value) || 0;
        const VAT_RATE = vatRateValue / 100;
        const vatAmount = totalBeforeVat * VAT_RATE;
        const grandTotal = totalBeforeVat + vatAmount + totalSection3;
        const amountPaidEl = document.getElementById('amount-paid-input');
        const amountPaid = amountPaidEl ? (parseFloat((amountPaidEl.value || '0').replace(/[\.,]/g, '')) || 0) : 0;
        
        calculateBtn.disabled = true;
        let success = false;

        if (isLiquidationMode || isEditMode) {
            calculateBtn.textContent = 'Đang cập nhật...';
            
            const reason = prompt("Vui lòng nhập lý do Cập nhật/Thanh lý:");
            if (reason === null || !reason.trim()) {
                alert("Bạn phải nhập lý do để tiếp tục.");
                calculateBtn.disabled = false;
                calculateBtn.textContent = isLiquidationMode ? 'Hoàn tất & Lưu Thanh lý' : 'Cập nhật Hợp đồng';
                return;
            }
            if (!currentInvoiceData.editHistory) {
                currentInvoiceData.editHistory = [];
            }
            currentInvoiceData.editHistory.push({
                timestamp: new Date().toLocaleString('vi-VN'),
                reason: reason.trim()
            });
            
            const newStatus = isLiquidationMode ? "Đã hoàn thành" : "Chưa thanh lý";

            currentInvoiceData = { ...currentInvoiceData, contractInfo, clientInfo, allOptionalItems, totalSection1, photoData: { ...pricingData.pho_to, quantity: photoQty, cost: totalSection2 }, infoData: { ...pricingData.khai_thac_thong_tin, quantity: infoQty, cost: totalSection3 }, totalBeforeVat, vatRateValue, vatAmount, grandTotal, amountPaid, amountOwed: Math.max(0, grandTotal - amountPaid), refundAmount: Math.max(0, amountPaid - grandTotal), contractType, status: newStatus };
            
            success = await sendData('update', currentInvoiceData);
            if (success) {
                alert(`Đã cập nhật thành công hợp đồng của khách hàng "${clientInfo.name}"!`);
                displayResultsOnPage(currentInvoiceData);
                if (isLiquidationMode) {
                    calculateBtn.style.display = 'none';
                    editContractBtn.classList.add('hidden');
                }
            }
        } 
        else {
            calculateBtn.textContent = 'Đang lưu...';
            const nextNumber = await getNextContractNumber();
            if (nextNumber === null) {
                calculateBtn.disabled = false;
                calculateBtn.textContent = 'Lưu Hợp đồng';
                return;
            }
            contractInfo.fullNumber = `${nextNumber}/${communeProfiles[communeSelect.value].contractSymbol}`;
            contractFullNumberInput.value = contractInfo.fullNumber;

            currentInvoiceData = { id: Date.now(), contractInfo, clientInfo, allOptionalItems, totalSection1, photoData: { ...pricingData.pho_to, quantity: photoQty, cost: totalSection2 }, infoData: { ...pricingData.khai_thac_thong_tin, quantity: infoQty, cost: totalSection3 }, totalBeforeVat, vatRateValue, vatAmount, grandTotal, amountPaid, amountOwed: Math.max(0, grandTotal - amountPaid), refundAmount: Math.max(0, amountPaid - grandTotal), contractType, status: "Chưa thanh lý" };
            
            success = await sendData('create', currentInvoiceData);
            if (success) {
                alert(`Đã lưu hợp đồng mới #${nextNumber} cho khách hàng "${clientInfo.name}"!`);
                displayResultsOnPage(currentInvoiceData);
            }
        }
        
        calculateBtn.disabled = false;
        calculateBtn.textContent = isLiquidationMode ? 'Hoàn tất & Lưu Thanh lý' : isEditMode ? 'Cập nhật Hợp đồng' : 'Lưu Hợp đồng';
    });

    function displayResultsOnPage(data) {
        let displayHTML = `<div class="result-group-header">I. Tổng chi phí thực hiện</div>`;
        if (data.allOptionalItems.length > 0) { data.allOptionalItems.forEach((parcel, index) => { displayHTML += `<div class="result-parcel-header">${index + 1}. Hồ sơ (Tờ: ${parcel.mapSheet}, Thửa: ${parcel.parcelNo}, Dt: ${parcel.area} m², Tại: ${parcel.address})</div>`; parcel.services.forEach(service => { displayHTML += `<div class="result-line"><span>- ${service.name}</span><span>${formatCurrency(service.cost)}</span></div>`; }); }); } else { displayHTML += `<div class="result-line"><span>(Không có)</span><span>${formatCurrency(0)}</span></div>`; }
        displayHTML += `<div class="result-section-item"><span>II. Phôtô (${data.photoData.quantity} ${data.photoData.unit})</span><span>${formatCurrency(data.photoData.cost)}</span></div>`;
        displayHTML += `<div class="sub-total"><span>Cộng (I + II)</span><span>${formatCurrency(data.totalBeforeVat)}</span></div>`;
        displayHTML += `<div class="sub-total"><span>Thuế GTGT (${data.vatRateValue}%)</span><span>${formatCurrency(data.vatAmount)}</span></div>`;
        displayHTML += `<div class="result-section-item"><span>III. Khai thác thông tin (${data.infoData.quantity} ${data.infoData.unit})</span><span>${formatCurrency(data.infoData.cost)}</span></div>`;
        displayHTML += `<div class="grand-total"><span>Tổng cộng</span><span>${formatCurrency(data.grandTotal)}</span></div>`;
        displayHTML += `<div class="total-in-words"><span>(Bằng chữ: ${numberToWords(data.grandTotal)})</span></div>`;
        displayHTML += ` <div class="payment-section"> <div class="payment-line"> <label for="amount-paid-input">Bên A đã thanh toán:</label> <input type="text" inputmode="decimal" id="amount-paid-input" value="${data.amountPaid > 0 ? data.amountPaid.toLocaleString('vi-VN') : ''}" placeholder="Nhập số tiền..."> </div> <div class="payment-line"> <label>Bên A còn phải thanh toán:</label> <span class="payment-value" id="amount-owed-value">${formatCurrency(data.amountOwed)}</span> </div> <div class="payment-line"> <label>Tiền thừa trả lại Bên A:</label> <span class="payment-value" id="refund-value">${formatCurrency(data.refundAmount)}</span> </div> </div> `;
        
        if (data.editHistory && data.editHistory.length > 0) {
            displayHTML += `<div class="history-section"><h4>Lịch sử Chỉnh sửa</h4><ul>`;
            data.editHistory.forEach(item => {
                displayHTML += `<li><strong>${item.timestamp}:</strong> ${item.reason}</li>`;
            });
            displayHTML += `</ul></div>`;
        }

        resultsDisplay.innerHTML = displayHTML;
        resultsContainer.classList.remove('hidden');
        exportControlSheetBtn.classList.remove('hidden');
        exportReceiptBtn.classList.remove('hidden');
        exportContractBtn.classList.remove('hidden');
        exportLiquidationBtn.classList.remove('hidden');
    }

    resultsContainer.addEventListener('input', (e) => {
        if (e.target.id === 'amount-paid-input') {
            const amountPaidString = (e.target.value || '0').replace(/[\.,]/g, '');
            currentInvoiceData.amountPaid = parseFloat(amountPaidString) || 0;
            const balance = currentInvoiceData.grandTotal - currentInvoiceData.amountPaid;
            currentInvoiceData.amountOwed = Math.max(0, balance);
            currentInvoiceData.refundAmount = Math.max(0, -balance);
            document.getElementById('amount-owed-value').textContent = formatCurrency(currentInvoiceData.amountOwed);
            document.getElementById('refund-value').textContent = formatCurrency(currentInvoiceData.refundAmount);
        }
    });

    function printDocument(htmlString) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(htmlString);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); }, 250);
    }
    
    exportControlSheetBtn.addEventListener('click', () => { if (!currentInvoiceData.id) { alert("Vui lòng lưu hồ sơ trước khi xuất."); return; } const isSimple = currentInvoiceData.contractType === 'simple'; const soNgayLamViec = isSimple ? 3 : 10; const now = new Date(); const ngayNhanFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`; const ngayTraFormatted = calculateReturnDate(now, soNgayLamViec); const firstParcel = currentInvoiceData.allOptionalItems[0] || {}; const phieuKiemSoatData = { chuHoSo: `${currentInvoiceData.clientInfo.name} – ${currentInvoiceData.contractInfo.fullNumber.split('/')[0]}`, loaiThuTuc: isSimple ? "Trích lục và biên vẽ..." : "Đo đạc tách, hợp thửa...", ngayNhan: ngayNhanFormatted, ngayTra: ngayTraFormatted, diaChi: `Số tờ: ${firstParcel.mapSheet}; số thửa: ${firstParcel.parcelNo}; tại: ${firstParcel.address}; Số HĐ: ${currentInvoiceData.contractInfo.fullNumber}`, place: currentInvoiceData.contractInfo.location }; const printableHTML = generatePhieuKiemSoatHTML(phieuKiemSoatData); printDocument(printableHTML); });
    exportLiquidationBtn.addEventListener('click', () => { if (!currentInvoiceData.id) { alert("Vui lòng lưu hồ sơ trước khi xuất."); return; } const printableHTML = generateLiquidationHTML(currentInvoiceData); printDocument(printableHTML); });
    exportContractBtn.addEventListener('click', () => { if (!currentInvoiceData.id) { alert("Vui lòng lưu hồ sơ trước khi xuất."); return; } let printableHTML = ''; if (currentInvoiceData.contractType === 'simple') { printableHTML = generateSimpleContractHTML(currentInvoiceData); } else { printableHTML = generateContractHTML(currentInvoiceData); } printDocument(printableHTML); });
    exportReceiptBtn.addEventListener('click', () => { if (!currentInvoiceData.id) { alert("Vui lòng lưu hồ sơ trước khi xuất."); return; } const isSimple = currentInvoiceData.contractType === 'simple'; const soNgayLamViec = isSimple ? 3 : 10; const thoiGianGiaiQuyet = `${soNgayLamViec} ngày làm việc`; const now = new Date(); const ngayNhanFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`; const ngayTraFormatted = calculateReturnDate(now, soNgayLamViec); const firstParcel = currentInvoiceData.allOptionalItems[0] || {}; const bienNhanData = { date: ngayNhanFormatted, ngayNhan: ngayNhanFormatted, ngayTra: ngayTraFormatted, place: currentInvoiceData.contractInfo.location, nguoiNop: currentInvoiceData.clientInfo.name, maHoSo: `HS-${currentInvoiceData.id}`, diaChi: currentInvoiceData.clientInfo.address, dienThoai: currentInvoiceData.clientInfo.phone, email: currentInvoiceData.clientInfo.email, noiDung: isSimple ? "Trích lục và biên vẽ..." : "Đo đạc tách, hợp thửa...", soTo: firstParcel.mapSheet, soThua: firstParcel.parcelNo, diaChiThuaDat: firstParcel.address, soHopDong: currentInvoiceData.contractInfo.fullNumber, giayTo: [ { ten: 'Giấy chứng nhận quyền sử dụng đất (nếu có)', soBanChinh: 0, soBanSao: 1 }, { ten: 'Các giấy tờ khác có liên quan kèm theo', soBanChinh: 0, soBanSao: 1 } ], soLuongHoSo: 1, thoiGianGiaiQuyet, noiNhanKetQua: 'VPĐK Đất đai tỉnh Đồng Nai - Chi nhánh Long Khánh', nguoiNhanKetQua: currentInvoiceData.clientInfo.name }; const printableHTML = generateBienNhanHTML(bienNhanData); printDocument(printableHTML); });
    
    async function renderManagerTable() {
        if (cachedRecords === null) {
            await loadAndCacheRecords();
        }
        
        managerRecordsBody.innerHTML = '';
        let totalRevenue = 0;
        if (cachedRecords.length === 0) { 
            managerRecordsBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Chưa có hồ sơ nào.</td></tr>';
            totalRecordsEl.textContent = 0;
            totalRevenueEl.textContent = formatCurrency(0);
            return;
        }
        cachedRecords.sort((a, b) => b.id - a.id);
        cachedRecords.forEach(record => {
            totalRevenue += record.grandTotal;
            const tr = document.createElement('tr');
            tr.dataset.record = JSON.stringify(record);
            const isCompleted = record.status === "Đã hoàn thành";
            tr.innerHTML = `
                <td>${record.contractInfo.date}</td>
                <td>${record.clientInfo.name || 'N/A'}</td>
                <td>${record.contractInfo.fullNumber || 'N/A'}</td>
                <td>${formatCurrency(record.grandTotal)}</td>
                <td><span class="status ${isCompleted ? 'completed' : 'pending'}">${record.status}</span></td>
                <td>
                    <div class="actions-group">
                        ${!isCompleted ? '<button class="edit-btn">Sửa</button><button class="liquidate-btn">Thanh lý</button>' : '<button class="view-btn">Xem</button>'}
                        <button class="re-export-btn" data-type="contract">HĐ</button>
                    </div>
                </td>
            `;
            managerRecordsBody.appendChild(tr);
        });
        totalRecordsEl.textContent = cachedRecords.length;
        totalRevenueEl.textContent = formatCurrency(totalRevenue);
    }
    
    managerRecordsBody.addEventListener('click', e => {
        const recordString = e.target.closest('tr')?.dataset.record;
        if (!recordString) return;
        
        const record = JSON.parse(recordString);

        if (e.target.classList.contains('liquidate-btn')) { 
            populateForm(record, 'liquidate'); 
            switchView('calculator'); 
        }
        if (e.target.classList.contains('edit-btn')) { 
            populateForm(record, 'edit'); 
            switchView('calculator'); 
        }
        if (e.target.classList.contains('view-btn')) { 
            populateForm(record, 'view'); 
            switchView('calculator'); 
        }
        if (e.target.classList.contains('re-export-btn')) { 
            currentInvoiceData = record;
            const type = e.target.dataset.type;
            let html = '';
            if (type === 'contract') {
                if (record.contractType === 'simple') html = generateSimpleContractHTML(record);
                else html = generateContractHTML(record);
            }
            if (html) printDocument(html);
        }
    });

    function addParcelCard(parcelData = {}) {
        const parcelId = `parcel-${Date.now()}-${Math.random()}`;
        let optionsHTML = '<option value="">-- Chọn dịch vụ --</option>';
        for (const key in pricingData) { if (key !== 'pho_to' && key !== 'khai_thac_thong_tin') { optionsHTML += `<option value="${key}">${pricingData[key].name}</option>`; } }
        const parcelHTML = `
            <div class="parcel-card" id="${parcelId}">
                <div class="parcel-header"> <h4>Hồ sơ Thửa đất</h4> <button type="button" class="remove-parcel-btn">&times; Xóa Hồ sơ</button> </div>
                <div class="parcel-details">
                    <div class="form-group"> <label>Tờ bản đồ số:</label> <input type="text" class="map-sheet-input" value="${parcelData.mapSheet || ''}"> </div>
                    <div class="form-group"> <label>Thửa đất số:</label> <input type="text" class="parcel-no-input" value="${parcelData.parcelNo || ''}"> </div>
                    <div class="form-group"> <label>Diện tích (m²):</label> <input type="text" inputmode="decimal" class="area-input" value="${parcelData.area || ''}" placeholder="Ví dụ: 100.2 hoặc 100,2"> </div>
                </div>
                <div class="services-list"></div>
                <div class="parcel-service-controls"> <select class="service-select-in-card">${optionsHTML}</select> <button type="button" class="add-service-to-parcel-btn">+ Thêm DV vào hồ sơ</button> </div>
            </div>`;
        invoiceItemsContainer.insertAdjacentHTML('beforeend', parcelHTML);
        return document.getElementById(parcelId);
    }
    
    function addServiceToParcel(parcelCard, serviceData) {
       const service = pricingData[serviceData.serviceKey];
       const serviceId = `service-${Date.now()}-${Math.random()}`;
       const valueInputHTML = service.type !== 'area_based' 
           ? `<input type="text" inputmode="decimal" class="calc-value-input" value="${serviceData.value || ''}" placeholder="Nhập ${service.unit}">`
           : `<span style="color: #888;">(tính theo diện tích hồ sơ)</span>`;
       const serviceHTML = `
           <div class="service-item-line" id="${serviceId}" data-service-key="${serviceData.serviceKey}">
               <label>${service.name}:</label> ${valueInputHTML} <button type="button" class="remove-service-btn">&times;</button>
           </div>`;
       parcelCard.querySelector('.services-list').insertAdjacentHTML('beforeend', serviceHTML);
    }

    function populateForm(record, mode = 'view') {
        clearForm(false, true);
        currentInvoiceData = record;
        isLiquidationMode = (mode === 'liquidate');
        isEditMode = (mode === 'edit');
        const isViewMode = (mode === 'view');

        // Điền dữ liệu
        communeSelect.value = Object.keys(communeProfiles).find(key => communeProfiles[key].name === record.contractInfo.location);
        clientNameInput.value = record.clientInfo.name;
        clientPhoneInput.value = record.clientInfo.phone;
        clientAddressInput.value = record.clientInfo.address;
        clientEmailInput.value = record.clientInfo.email || '';
        contractFullNumberInput.value = record.contractInfo.fullNumber;
        contractDateInput.value = record.contractInfo.date;
        liquidationFullNumberInput.value = record.contractInfo.fullLiquidationNumber || '';
        liquidationDateInput.value = record.contractInfo.liquidationDate || '';
        photoQtyInput.value = record.photoData.quantity;
        infoQtyInput.value = record.infoData.quantity;
        vatRateInput.value = record.vatRateValue;

        invoiceItemsContainer.innerHTML = '';
        if(!record.allOptionalItems || record.allOptionalItems.length === 0) {
            invoiceItemsContainer.innerHTML = '<p class="empty-state">Chưa có hồ sơ thửa đất nào được thêm.</p>';
        } else {
            record.allOptionalItems.forEach(parcelData => {
                const newCard = addParcelCard(parcelData);
                if (parcelData.services) {
                    parcelData.services.forEach(serviceData => {
                        addServiceToParcel(newCard, serviceData);
                    });
                }
            });
        }
        
        // Cấu hình giao diện
        if (isViewMode) {
            document.querySelectorAll('#calculator-view input, #calculator-view select, #calculator-view button').forEach(el => el.disabled = true);
            calculateBtn.style.display = 'none';
            liquidationSection.style.display = 'flex';
            editContractBtn.classList.add('hidden');
        } else if (isLiquidationMode) {
            document.querySelectorAll('#calculator-view input, #calculator-view select').forEach(el => el.disabled = true);
            addParcelBtn.style.display = 'none';
            invoiceItemsContainer.querySelectorAll('.parcel-card').forEach(card => card.querySelectorAll('input, select, button').forEach(el => el.disabled = true));
            liquidationSection.style.display = 'flex';
            calculateBtn.textContent = 'Hoàn tất & Lưu Thanh lý';
            calculateBtn.style.display = 'block';
            liquidationDateInput.disabled = false;
            editContractBtn.classList.remove('hidden');
            getNextLiquidationNumber().then(num => {
                if (num) liquidationFullNumberInput.value = `${num}/${communeProfiles[communeSelect.value].liquidationSymbol}`;
                else liquidationFullNumberInput.value = 'Lỗi lấy số TL';
            });
        } else if (isEditMode) {
            calculateBtn.textContent = 'Cập nhật Hợp đồng';
            calculateBtn.style.display = 'block';
            liquidationSection.style.display = 'none';
        }
        
        displayResultsOnPage(record);
        document.getElementById('amount-paid-input').disabled = isViewMode;
    }
    
    function clearForm(shouldConfirm, noConfirm = false) {
        if (!noConfirm && (isLiquidationMode || isEditMode) && !confirm("Bạn đang trong chế độ cập nhật. Hành động này sẽ hủy các thay đổi và tạo một hợp đồng mới. Bạn có chắc không?")) return;
        if (!noConfirm && !isLiquidationMode && !isEditMode && !confirm("Hành động này sẽ xóa toàn bộ thông tin chưa lưu. Bạn có chắc không?")) return;
        
        isLiquidationMode = false;
        isEditMode = false;
        wasEditedInLiquidation = false;
        invoiceForm.reset();
        clientNameInput.value = '';
        clientPhoneInput.value = '';
        clientEmailInput.value = '';
        clientAddressInput.value = '';
        contractFullNumberInput.value = 'Đang lấy số...';
        liquidationFullNumberInput.value = '';
        photoQtyInput.value = 5;
        infoQtyInput.value = 1;
        invoiceItemsContainer.innerHTML = '<p class="empty-state">Chưa có hồ sơ thửa đất nào được thêm.</p>';
        resultsContainer.classList.add('hidden');
        currentInvoiceData = {};
        
        document.querySelectorAll('#calculator-view input, #calculator-view select').forEach(el => el.disabled = false);
        contractFullNumberInput.disabled = true;
        addParcelBtn.style.display = 'inline-block';
        calculateBtn.style.display = 'block';
        calculateBtn.textContent = 'Lưu Hợp đồng';
        liquidationSection.style.display = 'none';
        editContractBtn.classList.add('hidden');

        setDefaultDate();
        communeSelect.value = "long_khanh";
        
        getNextContractNumber().then(num => {
            if (num) {
                contractFullNumberInput.value = `${num}/${communeProfiles[communeSelect.value].contractSymbol}`;
            } else {
                contractFullNumberInput.value = 'Lỗi lấy số HĐ';
            }
        });
    }
    
    function calculateAreaBased(service, area) { for (const tier of service.tiers) { if (area < tier.max_area) return tier.price; } return service.tiers[service.tiers.length - 1].price; }
    function calculateProgressiveDiscount(service, quantity) { let totalCost = 0; let remainingQty = quantity; let lastMaxCount = 0; for (const tier of service.tiers) { if (remainingQty <= 0) break; const tierMax = tier.max_count === 'infinity' ? Infinity : tier.max_count; const countInTier = Math.min(remainingQty, tierMax - lastMaxCount); totalCost += countInTier * service.base_price * tier.rate; remainingQty -= countInTier; lastMaxCount = tier.max_count; } return totalCost; }
    
    // --- KHỞI TẠO BAN ĐẦU ---
    clearForm(false, true);
    loadAndCacheRecords();
});