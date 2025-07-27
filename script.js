document.addEventListener('DOMContentLoaded', () => {
    // --- CƠ SỞ DỮ LIỆU ---
    const communeProfiles = {
        "long_khanh": { name: "Long Khánh", liquidationSymbol: "TLHĐ.LK.VPĐK", contractSymbol: "HĐBV.LK.VPĐK" },
        "bao_vinh": { name: "Bảo Vinh", liquidationSymbol: "TLHĐ.BV.VPĐK", contractSymbol: "HĐDV.BV.VPĐK" },
        "binh_loc": { name: "Bình Lộc", liquidationSymbol: "TLHĐ.BL.VPĐK", contractSymbol: "HĐDV.BL.VPĐK" },
        "xuan_lap": { name: "Xuân Lập", liquidationSymbol: "TLHĐ.XL.VPĐK", contractSymbol: "HĐDV.XL.VPĐK" },
        "hang_gon": { name: "Hàng Gòn", liquidationSymbol: "TLHĐ.HG.VPĐK", contractSymbol: "HĐDV.HG.VPĐK" }
    };
    const pricingData = { "do_chinh_ly": { "name": "Đo chỉnh lý bản trích đo địa chính", "unit": "m²", "type": "area_based", "vat_applicable": true, "tiers": [ { "max_area": 100, "price": 913000 }, { "max_area": 300, "price": 1085000 }, { "max_area": 500, "price": 1150000 }, { "max_area": 1000, "price": 1408000 }, { "max_area": 3000, "price": 1933000 }, { "max_area": 10000, "price": 2969000 }, { "max_area": 100000, "price": 3563000 }, { "max_area": 500000, "price": 4157000 } ] }, "doi_soat_ban_do": { "name": "Đối soát bản đồ địa chính", "unit": "m²", "type": "area_based", "vat_applicable": true, "tiers": [ { "max_area": 100, "price": 310000 }, { "max_area": 300, "price": 369000 }, { "max_area": 500, "price": 391000 }, { "max_area": 1000, "price": 479000 }, { "max_area": 3000, "price": 657000 }, { "max_area": 10000, "price": 1010000 }, { "max_area": 100000, "price": 1212000 }, { "max_area": 500000, "price": 1414000 } ] }, "bien_ve_a4": { "name": "Biên vẽ hồ sơ kỹ thuật A4", "unit": "Thửa", "type": "progressive_discount", "vat_applicable": true, "base_price": 235000, "tiers": [ { "max_count": 1, "rate": 1.0 }, { "max_count": 10, "rate": 0.8 }, { "max_count": 100, "rate": 0.5 }, { "max_count": "infinity", "rate": 0.4 } ] }, "xuat_ho_so_a4": { "name": "Xuất hồ sơ kỹ thuật thửa đất A4", "unit": "Thửa", "type": "fixed_rate", "vat_applicable": true, "price": 90000 }, "cong_ngoai_nghiep": { "name": "Công ngoại nghiệp", "unit": "công", "type": "fixed_rate", "vat_applicable": true, "price": 225000 }, "cong_noi_nghiep": { "name": "Công nội nghiệp", "unit": "công", "type": "fixed_rate", "vat_applicable": true, "price": 202000 }, "do_vi_tri_moc": { "name": "Đo xác định vị trí mốc", "unit": "mốc", "type": "fixed_rate", "vat_applicable": true, "price": 149000 }, "pho_to": { "name": "Phô tô tài liệu", "unit": "tờ", "type": "fixed_rate", "vat_applicable": true, "price": 2000 }, "khai_thac_thong_tin": { "name": "Khai thác thông tin", "unit": "file", "type": "fixed_rate", "vat_applicable": false, "price": 40000 } };
    
    // --- LẤY CÁC ELEMENT TRÊN GIAO DIỆN ---
    const calculatorView = document.getElementById('calculator-view');
    const managerView = document.getElementById('manager-view');
    const showManagerBtn = document.getElementById('show-manager-btn');
    const showCalculatorBtn = document.getElementById('show-calculator-btn');
    const communeSelect = document.getElementById('commune-select');
    const contractFullNumberInput = document.getElementById('contract-full-number');
    const contractDateInput = document.getElementById('contract-date');
    const liquidationFullNumberInput = document.getElementById('liquidation-full-number');
    const liquidationDateInput = document.getElementById('liquidation-date');
    const clientNameInput = document.getElementById('client-name');
    const clientPhoneInput = document.getElementById('client-phone');
    const clientAddressInput = document.getElementById('client-address');
    const addParcelBtn = document.getElementById('add-parcel-btn');
    const invoiceItemsContainer = document.getElementById('invoice-items');
    const invoiceForm = document.getElementById('invoice-form');
    const resultsContainer = document.getElementById('results-container');
    const resultsDisplay = document.getElementById('results-display');
    const vatRateInput = document.getElementById('vat-rate');
    const emptyState = document.querySelector('.empty-state');
    const photoQtyInput = document.getElementById('photo-qty');
    const infoQtyInput = document.getElementById('info-qty');
    const exportContractBtn = document.getElementById('export-contract-btn');
    const exportLiquidationBtn = document.getElementById('export-liquidation-btn');
    const managerRecordsBody = document.getElementById('manager-records-body');
    const totalRecordsEl = document.getElementById('total-records');
    const totalRevenueEl = document.getElementById('total-revenue');
    const exportDataBtn = document.getElementById('export-data-btn');
    const importDataBtn = document.getElementById('import-data-btn');
    const importDataInput = document.getElementById('import-data-input');

    let currentInvoiceData = {};
    const DB_KEY = 'doDacRecordsDB';

    // --- CÁC HÀM QUẢN LÝ DỮ LIỆU ---
    const getRecords = () => JSON.parse(localStorage.getItem(DB_KEY)) || [];
    const saveRecords = (records) => localStorage.setItem(DB_KEY, JSON.stringify(records));

    // --- CHUYỂN ĐỔI GIAO DIỆN ---
    function switchView(viewToShow) {
        if (viewToShow === 'manager') {
            calculatorView.classList.add('hidden');
            managerView.classList.remove('hidden');
            renderManagerTable();
        } else {
            managerView.classList.add('hidden');
            calculatorView.classList.remove('hidden');
        }
    }

    showManagerBtn.addEventListener('click', () => switchView('manager'));
    showCalculatorBtn.addEventListener('click', () => switchView('calculator'));

    // --- KHỞI TẠO GIAO DIỆN TÍNH TOÁN ---
    for (const key in communeProfiles) { const option = document.createElement('option'); option.value = key; option.textContent = communeProfiles[key].name; communeSelect.appendChild(option); }
    const today = new Date(); const day = String(today.getDate()).padStart(2, '0'); const month = String(today.getMonth() + 1).padStart(2, '0'); const year = today.getFullYear(); liquidationDateInput.value = `${day}/${month}/${year}`;
    function updateContractFields() { const selectedProfile = communeProfiles[communeSelect.value]; const currentContractNumber = contractFullNumberInput.value.split('/')[0]; const currentLiquidationNumber = liquidationFullNumberInput.value.split('/')[0]; contractFullNumberInput.value = `${currentContractNumber}/${selectedProfile.contractSymbol}`; liquidationFullNumberInput.value = `${currentLiquidationNumber}/${selectedProfile.liquidationSymbol}`; }
    communeSelect.addEventListener('change', updateContractFields);
    updateContractFields();

    // --- CÁC HÀM XỬ LÝ SỰ KIỆN ---
    addParcelBtn.addEventListener('click', () => { if (emptyState) emptyState.remove(); const parcelId = `parcel-${Date.now()}`; let optionsHTML = '<option value="">-- Chọn dịch vụ --</option>'; for (const key in pricingData) { if (key !== 'pho_to' && key !== 'khai_thac_thong_tin') { optionsHTML += `<option value="${key}">${pricingData[key].name}</option>`; } } const parcelHTML = ` <div class="parcel-card" id="${parcelId}"> <div class="parcel-header"> <h4>Hồ sơ Thửa đất</h4> <button type="button" class="remove-parcel-btn">&times; Xóa Hồ sơ</button> </div> <div class="parcel-details"> <div class="form-group"> <label>Tờ bản đồ số:</label> <input type="text" class="map-sheet-input"> </div> <div class="form-group"> <label>Thửa đất số:</label> <input type="text" class="parcel-no-input"> </div> <div class="form-group"> <label>Diện tích (m²):</label> <input type="text" inputmode="decimal" class="area-input" placeholder="Ví dụ: 100.2 hoặc 100,2"> </div> <div class="form-group full-width"> <label>Địa chỉ:</label> <input type="text" class="address-input"> </div> </div> <div class="services-list"></div> <div class="parcel-service-controls"> <select class="service-select-in-card">${optionsHTML}</select> <button type="button" class="add-service-to-parcel-btn">+ Thêm DV vào hồ sơ</button> </div> </div>`; invoiceItemsContainer.insertAdjacentHTML('beforeend', parcelHTML); });
    invoiceItemsContainer.addEventListener('click', (e) => { if (e.target.classList.contains('add-service-to-parcel-btn')) { const controlsDiv = e.target.closest('.parcel-service-controls'); const parcelCard = e.target.closest('.parcel-card'); const select = controlsDiv.querySelector('select'); const serviceKey = select.value; if (!serviceKey) return; const service = pricingData[serviceKey]; const serviceId = `service-${Date.now()}`; const valueInputHTML = service.type !== 'area_based' ? `<input type="text" inputmode="decimal" class="calc-value-input" placeholder="Nhập ${service.unit}">` : `<span style="color: #888;">(tính theo diện tích hồ sơ)</span>`; const serviceHTML = ` <div class="service-item-line" id="${serviceId}" data-service-key="${serviceKey}"> <label>${service.name}:</label> ${valueInputHTML} <button type="button" class="remove-service-btn">&times;</button> </div>`; parcelCard.querySelector('.services-list').insertAdjacentHTML('beforeend', serviceHTML); select.value = ''; } if (e.target.classList.contains('remove-service-btn')) e.target.closest('.service-item-line').remove(); if (e.target.classList.contains('remove-parcel-btn')) e.target.closest('.parcel-card').remove(); });
    
    invoiceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const contractInfo = { location: communeProfiles[communeSelect.value].name, fullNumber: contractFullNumberInput.value, date: contractDateInput.value, fullLiquidationNumber: liquidationFullNumberInput.value, liquidationDate: liquidationDateInput.value };
        const clientInfo = { name: clientNameInput.value, phone: clientPhoneInput.value, address: clientAddressInput.value };
        let totalSection1 = 0;
        const allOptionalItems = [];
        document.querySelectorAll('.parcel-card').forEach(card => {
            const parcelInfo = { mapSheet: card.querySelector('.map-sheet-input').value || 'N/A', parcelNo: card.querySelector('.parcel-no-input').value || 'N/A', address: card.querySelector('.address-input').value || 'N/A', area: parseFloat((card.querySelector('.area-input').value || '0').replace(',', '.')) || 0, services: [] };
            card.querySelectorAll('.service-item-line').forEach(line => {
                const serviceKey = line.dataset.serviceKey;
                const service = pricingData[serviceKey];
                let value = (service.type === 'area_based') ? parcelInfo.area : parseFloat((line.querySelector('.calc-value-input')?.value || '0').replace(',', '.')) || 0;
                if (value > 0) {
                    let cost = 0;
                    switch (service.type) { case 'area_based': cost = calculateAreaBased(service, value); break; case 'progressive_discount': cost = calculateProgressiveDiscount(service, value); break; case 'fixed_rate': cost = service.price * value; break; }
                    let quantity, unitPrice;
                    if (service.type === 'area_based') { quantity = 1; unitPrice = cost; } else if (service.type === 'progressive_discount') { quantity = value; unitPrice = (value > 0) ? cost / value : 0; } else { quantity = value; unitPrice = service.price; }
                    parcelInfo.services.push({ name: service.name, unit: service.unit, quantity: quantity, unitPrice: unitPrice, cost: cost, type: service.type });
                    totalSection1 += cost;
                }
            });
            if (parcelInfo.services.length > 0) allOptionalItems.push(parcelInfo);
        });

        const photoQty = parseFloat(photoQtyInput.value) || 0;
        const totalSection2 = photoQty * pricingData.pho_to.price;
        const infoQty = parseFloat(infoQtyInput.value) || 0;
        const totalSection3 = infoQty * pricingData.khai_thac_thong_tin.price;
        const totalBeforeVat = totalSection1 + totalSection2;
        const vatRateValue = parseFloat(vatRateInput.value) || 0;
        const VAT_RATE = vatRateValue / 100;
        const vatAmount = totalBeforeVat * VAT_RATE;
        const grandTotal = totalBeforeVat + vatAmount + totalSection3;

        currentInvoiceData = { id: Date.now(), contractInfo, clientInfo, allOptionalItems, totalSection1, photoData: { ...pricingData.pho_to, quantity: photoQty, cost: totalSection2 }, infoData: { ...pricingData.khai_thac_thong_tin, quantity: infoQty, cost: totalSection3 }, totalBeforeVat, vatRateValue, vatAmount, grandTotal, amountPaid: 0, amountOwed: grandTotal, refundAmount: 0 };
        
        let records = getRecords();
        records.push(currentInvoiceData);
        saveRecords(records);
        alert(`Đã lưu hồ sơ mới cho khách hàng "${clientInfo.name}"!`);
        
        displayResultsOnPage(currentInvoiceData);
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
        displayHTML += ` <div class="payment-section"> <div class="payment-line"> <label for="amount-paid-input">Bên A đã thanh toán:</label> <input type="text" inputmode="decimal" id="amount-paid-input" placeholder="Nhập số tiền..."> </div> <div class="payment-line"> <label>Bên A còn phải thanh toán:</label> <span class="payment-value" id="amount-owed-value">${formatCurrency(data.grandTotal)}</span> </div> <div class="payment-line"> <label>Tiền thừa trả lại Bên A:</label> <span class="payment-value" id="refund-value">${formatCurrency(0)}</span> </div> </div> `;
        resultsDisplay.innerHTML = displayHTML;
        resultsContainer.classList.remove('hidden');
        exportContractBtn.classList.remove('hidden');
        exportLiquidationBtn.classList.remove('hidden');
    }

    resultsContainer.addEventListener('input', (e) => {
        if (e.target.id === 'amount-paid-input') {
            const amountPaidString = (e.target.value || '0').replace(/[\.,]/g, '');
            const amountPaid = parseFloat(amountPaidString) || 0;
            const balance = currentInvoiceData.grandTotal - amountPaid;
            const amountOwed = Math.max(0, balance);
            const refundAmount = Math.max(0, -balance);
            document.getElementById('amount-owed-value').textContent = formatCurrency(amountOwed);
            document.getElementById('refund-value').textContent = formatCurrency(refundAmount);
            currentInvoiceData.amountPaid = amountPaid;
            currentInvoiceData.amountOwed = amountOwed;
            currentInvoiceData.refundAmount = refundAmount;

            // Cập nhật lại record trong localStorage
            let records = getRecords();
            const recordIndex = records.findIndex(r => r.id === currentInvoiceData.id);
            if (recordIndex > -1) {
                records[recordIndex] = currentInvoiceData;
                saveRecords(records);
            }
        }
    });

    exportLiquidationBtn.addEventListener('click', () => { if (!currentInvoiceData.grandTotal && currentInvoiceData.grandTotal !== 0) { alert("Chưa có dữ liệu để xuất."); return; } const printableHTML = generateLiquidationHTML(currentInvoiceData); const printWindow = window.open('', '_blank'); printWindow.document.write(printableHTML); printWindow.document.close(); printWindow.focus(); });
    exportContractBtn.addEventListener('click', () => { if (!currentInvoiceData.grandTotal && currentInvoiceData.grandTotal !== 0) { alert("Chưa có dữ liệu để xuất."); return; } const printableHTML = generateContractHTML(currentInvoiceData); const printWindow = window.open('', '_blank'); printWindow.document.write(printableHTML); printWindow.document.close(); printWindow.focus(); });

    // --- LOGIC CHO TRANG QUẢN LÝ ---
    function renderManagerTable() {
        const records = getRecords();
        managerRecordsBody.innerHTML = '';
        let totalRevenue = 0;

        if (records.length === 0) {
            managerRecordsBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Chưa có hồ sơ nào được lưu.</td></tr>';
        }

        records.sort((a, b) => b.id - a.id); // Sắp xếp mới nhất lên đầu

        records.forEach(record => {
            totalRevenue += record.grandTotal;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${record.contractInfo.liquidationDate || 'N/A'}</td>
                <td>${record.clientInfo.name || 'N/A'}</td>
                <td>${record.contractInfo.fullNumber || 'N/A'}</td>
                <td>${formatCurrency(record.grandTotal)}</td>
                <td>
                    <div class="actions-group">
                        <button class="load-btn" data-id="${record.id}">Tải lại</button>
                        <button class="re-export-btn" data-type="contract" data-id="${record.id}">HĐ</button>
                        <button class="re-export-btn" data-type="liquidation" data-id="${record.id}">Thanh lý</button>
                        <button class="delete-btn" data-id="${record.id}">Xóa</button>
                    </div>
                </td>
            `;
            managerRecordsBody.appendChild(tr);
        });

        totalRecordsEl.textContent = records.length;
        totalRevenueEl.textContent = formatCurrency(totalRevenue);
    }
    
    managerRecordsBody.addEventListener('click', e => {
        const id = e.target.dataset.id;
        if (!id) return;
        
        let records = getRecords();
        const record = records.find(r => r.id == id);
        
        if (e.target.classList.contains('load-btn')) {
            populateForm(record);
            switchView('calculator');
        }
        if (e.target.classList.contains('delete-btn')) {
            if (confirm(`Bạn có chắc muốn xóa hồ sơ của khách hàng "${record.clientInfo.name}"?`)) {
                const newRecords = records.filter(r => r.id != id);
                saveRecords(newRecords);
                renderManagerTable();
            }
        }
        if (e.target.classList.contains('re-export-btn')) {
            const type = e.target.dataset.type;
            const html = type === 'contract' ? generateContractHTML(record) : generateLiquidationHTML(record);
            const printWindow = window.open('', '_blank');
            printWindow.document.write(html);
            printWindow.document.close();
        }
    });

    function populateForm(record) {
        // Điền thông tin hợp đồng và khách hàng
        communeSelect.value = Object.keys(communeProfiles).find(key => communeProfiles[key].name === record.contractInfo.location);
        clientNameInput.value = record.clientInfo.name;
        clientPhoneInput.value = record.clientInfo.phone;
        clientAddressInput.value = record.clientInfo.address;
        contractFullNumberInput.value = record.contractInfo.fullNumber;
        contractDateInput.value = record.contractInfo.date;
        liquidationFullNumberInput.value = record.contractInfo.fullLiquidationNumber;
        liquidationDateInput.value = record.contractInfo.liquidationDate;
        photoQtyInput.value = record.photoData.quantity;
        infoQtyInput.value = record.infoData.quantity;
        vatRateInput.value = record.vatRateValue;

        // Xóa các hồ sơ thửa đất cũ và tạo lại
        invoiceItemsContainer.innerHTML = '';
        record.allOptionalItems.forEach(parcel => {
            const parcelId = `parcel-${Date.now()}-${Math.random()}`;
            let optionsHTML = '<option value="">-- Chọn dịch vụ --</option>';
            for (const key in pricingData) { if (key !== 'pho_to' && key !== 'khai_thac_thong_tin') { optionsHTML += `<option value="${key}">${pricingData[key].name}</option>`; } }
            const parcelHTML = `...`; // Tương tự hàm add, nhưng điền sẵn giá trị
            invoiceItemsContainer.insertAdjacentHTML('beforeend', `...`);
            // Cần code chi tiết để điền lại các dịch vụ bên trong
        });
        
        // Hiển thị lại kết quả đã tính
        currentInvoiceData = record;
        displayResultsOnPage(record);
        document.getElementById('amount-paid-input').value = record.amountPaid;
    }
    
    // --- SAO LƯU & PHỤC HỒI ---
    exportDataBtn.addEventListener('click', () => {
        const records = getRecords();
        if(records.length === 0) {
            alert("Không có dữ liệu để sao lưu.");
            return;
        }
        const dataStr = JSON.stringify(records, null, 2);
        const dataBlob = new Blob([dataStr], {type: "application/json"});
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sao_luu_ho_so_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });

    importDataBtn.addEventListener('click', () => importDataInput.click());
    importDataInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const records = JSON.parse(event.target.result);
                if (Array.isArray(records) && confirm(`Bạn có chắc muốn ghi đè toàn bộ dữ liệu hiện tại với ${records.length} hồ sơ từ file sao lưu?`)) {
                    saveRecords(records);
                    renderManagerTable();
                    alert("Phục hồi dữ liệu thành công!");
                } else {
                    alert("File không hợp lệ.");
                }
            } catch (error) {
                alert("Lỗi khi đọc file: " + error.message);
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset input
    });


    // --- CÁC HÀM TÍNH TOÁN VÀ TIỆN ÍCH ---
    function calculateAreaBased(service, area) { for (const tier of service.tiers) { if (area < tier.max_area) return tier.price; } return service.tiers[service.tiers.length - 1].price; }
    function calculateProgressiveDiscount(service, quantity) { let totalCost = 0; let remainingQty = quantity; let lastMaxCount = 0; for (const tier of service.tiers) { if (remainingQty <= 0) break; const tierMax = tier.max_count === 'infinity' ? Infinity : tier.max_count; const countInTier = Math.min(remainingQty, tierMax - lastMaxCount); totalCost += countInTier * service.base_price * tier.rate; remainingQty -= countInTier; lastMaxCount = tier.max_count; } return totalCost; }
    function formatCurrency(value) { return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }); }
    function numberToWords(n) { if (n === 0) return 'Không đồng'; if (n === null || n === undefined) return ''; const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']; const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ']; function readChunk(chunk) { let tram = parseInt(chunk[0]); let chuc = parseInt(chunk[1]); let donvi = parseInt(chunk[2]); let result = []; if (tram > 0) { result.push(digits[tram], 'trăm'); } if (chuc > 1) { result.push(digits[chuc], 'mươi'); } else if (chuc === 1) { result.push('mười'); } else if (chuc === 0 && donvi !== 0 && (tram > 0 || chunk.isFirstChunk === false)) { result.push('linh'); } if (donvi > 0) { if (chuc > 1 && donvi === 1) { result.push('mốt'); } else if (chuc > 0 && donvi === 5) { result.push('lăm'); } else { result.push(digits[donvi]); } } return result.join(' '); } let numStr = n.toString(); if (numStr.length > 18) return "Số quá lớn"; let groups = []; while (numStr.length > 0) { groups.unshift(numStr.slice(-3)); numStr = numStr.slice(0, -3); } let finalResult = []; groups.forEach((group, index) => { if (group !== '000') { let paddedGroup = group.padStart(3, '0'); paddedGroup.isFirstChunk = (index === 0 && groups.length > 1); let text = readChunk(paddedGroup); finalResult.push(text, units[groups.length - 1 - index]); } }); let finalStr = finalResult.join(' ').replace(/\s+/g, ' ').trim(); return finalStr.charAt(0).toUpperCase() + finalStr.slice(1) + ' đồng'; }

    // --- CÁC HÀM TẠO FILE ĐỂ IN/XUẤT ---
    function generateLiquidationHTML(data) {
        const formatDate = (dateString_ddmmyyyy) => { if (!dateString_ddmmyyyy || dateString_ddmmyyyy.split('/').length !== 3) { return { ngay: '......', thang: '......', nam: '......' }; } const parts = dateString_ddmmyyyy.split('/'); return { ngay: parts[0], thang: parts[1], nam: parts[2] }; };
        const liquidationDate = formatDate(data.contractInfo.liquidationDate);
        const contractDate = formatDate(data.contractInfo.date);
        let rowsHTML = `<tr> <td class="bold">I</td> <td class="bold">Tổng chi phí thực hiện</td> <td></td><td></td><td></td> <td class="bold currency">${formatCurrency(data.totalSection1)}</td> </tr>`; let serviceCounter = 1; data.allOptionalItems.forEach(parcel => { parcel.services.forEach(service => { const unitText = service.unit === 'm²' ? 'm<sup>2</sup>' : service.unit; const description = service.type === 'area_based' ? `${service.name} (Tờ ${parcel.mapSheet}, Thửa ${parcel.parcelNo}, Dt ${parcel.area} m²)` : `${service.name} (Tờ ${parcel.mapSheet}, Thửa ${parcel.parcelNo})`; rowsHTML += `<tr> <td>${serviceCounter++}</td> <td>${description}</td> <td>${unitText}</td> <td>${service.quantity}</td> <td class="currency">${formatCurrency(service.unitPrice)}</td> <td class="currency">${formatCurrency(service.cost)}</td> </tr>`; }); }); rowsHTML += `<tr> <td class="bold">II</td> <td class="bold">Phôtô</td> <td>${data.photoData.unit}</td> <td>${data.photoData.quantity}</td> <td class="currency">${formatCurrency(data.photoData.price)}</td> <td class="bold currency">${formatCurrency(data.photoData.cost)}</td> </tr>`; rowsHTML += `<tr> <td colspan="5" class="bold align-right">Cộng (I+II)</td> <td class="bold currency">${formatCurrency(data.totalBeforeVat)}</td> </tr>`; rowsHTML += `<tr> <td colspan="5" class="bold align-right">Thuế GTGT ${data.vatRateValue}%</td> <td class="bold currency">${formatCurrency(data.vatAmount)}</td> </tr>`; rowsHTML += `<tr> <td class="bold">III</td> <td class="bold">Khai thác thông tin</td> <td>${data.infoData.unit}</td> <td>${data.infoData.quantity}</td> <td class="currency">${formatCurrency(data.infoData.price)}</td> <td class="bold currency">${formatCurrency(data.infoData.cost)}</td> </tr>`; rowsHTML += `<tr> <td colspan="5" class="bold align-right total-row">Tổng cộng</td> <td class="bold currency total-row">${formatCurrency(data.grandTotal)}</td> </tr>`;
        return `<html><head><title>Biên bản thanh lý hợp đồng</title><style> @page { size: A4; margin: 1cm 1.5cm; } body { font-family: 'Times New Roman', Times, serif; font-size: 14px; line-height: 1.15; color: #000; } .bold { font-weight: bold; } .italic { font-style: italic; } .header-table { width: 100%; border-collapse: collapse; font-size: 13px; table-layout: fixed;} .header-table td { border: none; padding: 0; vertical-align: top; text-align: center; } .org-main { font-weight: bold; } .line-separator { border-top: 1px solid #000; margin: 1px auto; } .main-title { font-size: 16px; font-weight: bold; text-align: center; margin: 20px 0; } .content p { text-indent: 30px; margin: 2px 0; text-align: justify; } .parties-table { width: 100%; border: none; } .parties-table td { border: none; padding: 1px 0; vertical-align: top; } .cost-table { width: 100%; border-collapse: collapse; margin: 10px 0; } .cost-table th, .cost-table td { border: 1px solid #333; padding: 2px 4px; text-align: left; vertical-align: top; font-size: 13px; line-height: 1.1; } .cost-table th { background-color: #f2f2f2; text-align: center; font-weight: bold;} .cost-table td:nth-child(1), .cost-table td:nth-child(3), .cost-table td:nth-child(4) { text-align: center; } .align-right { text-align: right; } .total-row { font-size: 1.1em; } .currency { text-align: right !important; } .footer-table { width: 100%; border: none; margin-top: 20px; } .footer-table td { text-align: center; font-weight: bold; border: none; padding: 0; } thead { display: table-header-group; } tr { page-break-inside: avoid; } .footer, .amount-in-words { page-break-inside: avoid; } .amount-in-words { margin-top: 5px; } </style></head><body> <div class="header"> <table class="header-table"> <tr> <td style="width: 50%;"> <div class="bold">VĂN PHÒNG ĐĂNG KÝ ĐẤT ĐAI</div> <div class="bold org-main">TỈNH ĐỒNG NAI CHI NHÁNH LONG KHÁNH</div> <div class="line-separator" style="width: 45%;"></div> <div>Số: ${data.contractInfo.fullLiquidationNumber}</div> </td> <td style="width: 50%;"> <div class="bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT&nbsp;NAM</div> <div style="display: inline-block; text-align: center;"> <div class="bold">Độc lập - Tự do - Hạnh phúc</div> <div class="line-separator" style="width: 100%;"></div> </div> </td> </tr> </table> </div> <p style="text-align: right;" class="italic">${data.contractInfo.location}, ngày ${liquidationDate.ngay} tháng ${liquidationDate.thang} năm ${liquidationDate.nam}</p> <div class="main-title">BIÊN BẢN THANH LÝ HỢP ĐỒNG</div> <div class="content"> <p>Căn cứ vào hợp đồng đã ký số ${data.contractInfo.fullNumber} ngày ${contractDate.ngay} tháng ${contractDate.thang} năm ${contractDate.nam}</p> <p>Hôm nay, ngày ${liquidationDate.ngay} tháng ${liquidationDate.thang} năm ${liquidationDate.nam}, chúng tôi gồm:</p> </div> <div class="parties"> <table class="parties-table"> <tr><td colspan="2"><strong class="bold"><u>Bên A:</u></strong></td></tr> <tr><td style="width: 90px;">Ông (Bà):</td><td><strong class="bold">${data.clientInfo.name}</strong></td></tr> <tr><td>Địa chỉ:</td><td>${data.clientInfo.address}</td></tr> <tr><td colspan="2" style="height: 10px;"></td></tr> <tr><td colspan="2"><strong class="bold"><u>Bên B: VĂN PHÒNG ĐĂNG KÝ ĐẤT ĐAI TỈNH ĐỒNG NAI – CN LONG KHÁNH</strong></u></td></tr> <tr><td>Đại diện:</td><td>Ông <span class="bold">Phạm Văn Hải</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Chức vụ: Phó Giám đốc</td></tr> <tr> <td colspan="2" class="italic"> (Theo ủy quyền số ....../GUQ.VPĐK-CNLK ngày ....../....../${liquidationDate.nam} của Giám đốc Văn phòng Đăng ký đất đai tỉnh Đồng Nai- chi nhánh Long Khánh) </td> </tr> <tr><td>Địa chỉ:</td><td>Đường CMT8, phường Long Khánh, thành phố Long Khánh, tỉnh Đồng Nai</td></tr> <tr><td>Điện thoại:</td><td>0251.213299 – Fax 061.3894322</td></tr> <tr><td>Tài khoản số:</td><td>0121000677979 tại Ngân hàng Vietcombank Đồng Nai- PGD Long Khánh</td></tr> <tr><td>Mã số thuế:</td><td>3600727427-004</td></tr> </table> </div> <div class="content"> <p>Bên B đã thực hiện khối lượng và giá trị công trình theo các hạng mục sau:</p> </div> <table class="cost-table"> <thead> <tr> <th>Số TT</th> <th>Nội dung công việc</th> <th>ĐVT</th> <th>K. lượng</th> <th>Đơn giá (đồng)</th> <th>Thành tiền (đồng)</th> </tr> </thead> <tbody> ${rowsHTML} </tbody> </table> <p class="amount-in-words" style="text-align: center;" class="italic bold">(Bằng chữ: ${numberToWords(data.grandTotal)})</p> <div class="content"> <p><strong><u>Tài liệu bàn giao:</u></strong> ${data.photoData.quantity} Bản vẽ thửa đất.</p> <p><strong><u>Thanh toán:</u></strong></p> <p>- Bên A đã thanh toán cho bên B số tiền là: ${formatCurrency(data.amountPaid)}</p> <p>- Bên A còn phải thanh toán cho bên B số tiền là: ${formatCurrency(data.amountOwed)}</p> <p>- Bên B phải trả lại số tiền thừa cho bên A là: ${formatCurrency(data.refundAmount)}</p> <p><strong><u>Kết luận:</u></strong></p> <p>Hai bên cùng thống nhất nghiệm thu, thanh lý hợp đồng và bàn giao tài liệu tại Văn phòng Đăng ký đất đai tỉnh Đồng Nai – chi nhánh Long Khánh.</p> <p>Biên bản này được lập thành 03 bản, bên A giữ 01 bản, bên B giữ 02 bản có giá trị như nhau./.</p> </div> <div class="footer"> <table class="footer-table"> <tr> <td style="width: 50%;"><strong>ĐẠI DIỆN BÊN A</strong><br><span style="font-weight: normal;" class="italic">(Ký, ghi rõ họ tên)</span></td> <td style="width: 50%;"><strong>ĐẠI DIỆN BÊN B</strong><br><span style="font-weight: normal;" class="italic">(Ký, ghi rõ họ tên)</span></td> </tr> <tr><td colspan="2" style="height: 60px;"></td></tr> <tr> <td><strong class="bold">${data.clientInfo.name}</strong></td> <td><strong class="bold">Phạm Văn Hải</strong></td> </tr> </table> </div> </body></html>`;
    }

    function generateContractHTML(data) {
        const formatDate = (dateString_ddmmyyyy) => { if (!dateString_ddmmyyyy || dateString_ddmmyyyy.split('/').length !== 3) { return { ngay: '......', thang: '......', nam: '......' }; } const parts = dateString_ddmmyyyy.split('/'); return { ngay: parts[0], thang: parts[1], nam: parts[2] }; };
        const contractDate = formatDate(data.contractInfo.date);
        let rowsHTML = `<tr> <td class="bold">I</td> <td class="bold">Tổng chi phí thực hiện</td> <td></td><td></td><td></td> <td class="bold currency">${formatCurrency(data.totalSection1)}</td> </tr>`; let serviceCounter = 1; data.allOptionalItems.forEach(parcel => { parcel.services.forEach(service => { const unitText = service.unit === 'm²' ? 'm<sup>2</sup>' : service.unit; const description = service.type === 'area_based' ? `${service.name} (Tờ ${parcel.mapSheet}, Thửa ${parcel.parcelNo}, Dt ${parcel.area} m²)` : `${service.name} (Tờ ${parcel.mapSheet}, Thửa ${parcel.parcelNo})`; rowsHTML += `<tr> <td>${serviceCounter++}</td> <td>${description}</td> <td>${unitText}</td> <td>${service.quantity}</td> <td class="currency">${formatCurrency(service.unitPrice)}</td> <td class="currency">${formatCurrency(service.cost)}</td> </tr>`; }); }); rowsHTML += `<tr> <td class="bold">II</td> <td class="bold">Phôtô</td> <td>${data.photoData.unit}</td> <td>${data.photoData.quantity}</td> <td class="currency">${formatCurrency(data.photoData.price)}</td> <td class="bold currency">${formatCurrency(data.photoData.cost)}</td> </tr>`; rowsHTML += `<tr> <td colspan="5" class="bold align-right">Cộng (I+II)</td> <td class="bold currency">${formatCurrency(data.totalBeforeVat)}</td> </tr>`; rowsHTML += `<tr> <td colspan="5" class="bold align-right">Thuế GTGT ${data.vatRateValue}%</td> <td class="bold currency">${formatCurrency(data.vatAmount)}</td> </tr>`; rowsHTML += `<tr> <td class="bold">III</td> <td class="bold">Khai thác thông tin</td> <td>${data.infoData.unit}</td> <td>${data.infoData.quantity}</td> <td class="currency">${formatCurrency(data.infoData.price)}</td> <td class="bold currency">${formatCurrency(data.infoData.cost)}</td> </tr>`; rowsHTML += `<tr> <td colspan="5" class="bold align-right total-row">Tổng cộng</td> <td class="bold currency total-row">${formatCurrency(data.grandTotal)}</td> </tr>`;
        return `<html><head><title>Hợp đồng đo đạc</title><style> 
                        @page { 
                            size: A4; 
                            margin-top: 1cm;
                            margin-bottom: 1cm;
                            margin-left: 1.5cm;
                            margin-right: 1.5cm;
                        } 
                        body { font-family: 'Times New Roman', Times, serif; font-size: 14px; line-height: 1.15; color: #000; } 
                        .bold { font-weight: bold; } .italic { font-style: italic; } .underline { text-decoration: underline; } 
                        .header-table { width: 100%; border-collapse: collapse; font-size: 13px; table-layout: fixed;} 
                        .header-table td { border: none; padding: 0; vertical-align: top; text-align: center; } 
                        .org-main { font-weight: bold; } 
                        .line-separator { border-top: 1px solid #000; margin: 1px auto; } 
                        .main-title { font-size: 16px; font-weight: bold; text-align: center; margin: 10px 0; } 
                        .content p { margin: 2px 0; text-align: justify; } 
                        .content .indent {text-indent: 30px;} 
                        .parties-table { width: 100%; border: none; } 
                        .parties-table td { border: none; padding: 1px 0; vertical-align: top; } 
                        .cost-table { width: 100%; border-collapse: collapse; margin: 10px 0; } 
                        .cost-table th, .cost-table td { border: 1px solid #333; padding: 2px 4px; text-align: left; vertical-align: top; font-size: 13px; line-height: 1.1;} 
                        .cost-table th { background-color: #f2f2f2; text-align: center; font-weight: bold;} 
                        .cost-table td:nth-child(1), .cost-table td:nth-child(3), .cost-table td:nth-child(4) { text-align: center; } 
                        .align-right { text-align: right; } 
                        .total-row { font-size: 1.1em; } 
                        .currency { text-align: right !important; } 
                        .footer-table { width: 100%; border: none; margin-top: 25px; } 
                        .footer-table td { text-align: center; font-weight: bold; border: none; padding: 0; } 
                        thead { display: table-header-group; }
                        tr { page-break-inside: avoid; }
                        .footer, .amount-in-words { page-break-inside: avoid; }
                        .amount-in-words { margin-top: 5px; }
                    </style></head>
                <body>
                    <div class="header"> <table class="header-table"> <tr> <td style="width: 50%;"> <div class="bold">VĂN PHÒNG ĐĂNG KÝ ĐẤT ĐAI</div> <div class="bold org-main">TỈNH ĐỒNG NAI CHI NHÁNH LONG KHÁNH</div> <div class="line-separator" style="width: 45%;"></div> <div>Số: ${data.contractInfo.fullNumber}</div> </td> <td style="width: 50%;"> <div class="bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT&nbsp;NAM</div> <div style="display: inline-block; text-align: center;"> <div class="bold">Độc lập - Tự do - Hạnh phúc</div> <div class="line-separator" style="width: 100%;"></div> </div> </td> </tr> </table> </div>
                    <p style="text-align: right;" class="italic">${data.contractInfo.location}, ngày ${contractDate.ngay} tháng ${contractDate.thang} năm ${contractDate.nam}</p>
                    <div class="main-title">HỢP ĐỒNG<br>Đo vẽ chỉnh lý bản đồ địa chính khu đất (thửa đất)</div>
                    <div class="content italic"> <p class="indent">- Căn cứ Quyết định số 17/2023/QĐ-UBND ngày 10/4/2023 về việc quy định phí đo đạc, lập bản đồ địa trên địa bàn tỉnh Đồng Nai;</p> <p class="indent">- Căn cứ Quyết định số 2625/QĐ-UBND ngày 28/7/2020 về việc tổ chức triển khai thực hiện Nghị Quyết số 15/2020 NQ-HĐND ngày 10/07/2020 quy định phí khai thác và sử dụng tài liệu đất đai trên địa bàn tỉnh Đồng Nai;</p> <p class="indent">- Căn cứ vào năng lực và nhu cầu của hai bên.</p> </div>
                    <p class="italic">Hôm nay, ngày ${contractDate.ngay} tháng ${contractDate.thang} năm ${contractDate.nam}, tại Văn phòng Đăng ký đất đai tỉnh Đồng Nai chi nhánh Long Khánh, chúng tôi gồm có:</p>
                    <div class="parties"> <table class="parties-table"> <tr><td colspan="2"><strong class="bold"><u>Bên A:</u></strong></td></tr> <tr><td style="width: 120px;">- Ông (Bà):</td><td><strong class="bold">${data.clientInfo.name}</strong></td></tr> <tr><td>- Địa chỉ:</td><td>${data.clientInfo.address}</td></tr> <tr><td>- Số điện thoại:</td><td>${data.clientInfo.phone}</td></tr><tr><td colspan="2" style="height: 10px;"></td></tr> <tr><td colspan="2"><strong class="bold"><u>Bên B: VĂN PHÒNG ĐĂNG KÝ ĐẤT ĐAI TỈNH ĐỒNG NAI – CN LONG KHÁNH</strong></u></td></tr> <tr><td>- Đại diện:</td><td>Ông <span class="bold">Phạm Văn Hải</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Chức vụ: Phó Giám đốc</td></tr>
                    <tr><td colspan="2" class="italic">(Theo ủy quyền số ......../GUQ.VPĐK-CNLK ngày ..../..../${contractDate.nam} của Giám đốc Văn phòng Đăng ký đất đai tỉnh Đồng Nai- chi nhánh Long Khánh )</td></tr>
                    <tr><td>- Địa chỉ:</td><td>Đường CMT8, phường Long Khánh, tỉnh Đồng Nai</td></tr> <tr><td>- Điện thoại:</td><td>0251.213299 – Fax 061.3894322</td></tr> <tr><td>- Tài khoản số:</td><td>0121000677979 ngân hàng Vietcombank Đồng Nai- Phòng giao dịch Long Khánh - Mã số thuế: 3600727427-004</td></tr> </table> </div>
                    <div class="content"> <p class="bold indent">Điều 1: Bên B nhận thực hiện khối lượng công việc và giá trị công trình tạm tính như sau:</p> </div>
                    <table class="cost-table"> <thead> <tr> <th>Số TT</th> <th>Nội dung công việc</th> <th>ĐVT</th> <th>K. lượng</th> <th>Đơn giá (đồng)</th> <th>Thành tiền (đồng)</th> </tr> </thead> <tbody> ${rowsHTML} </tbody> </table>
                    <p class="amount-in-words" style="text-align: center;" class="italic bold">(Bằng chữ: ${numberToWords(data.grandTotal)})</p>
                    <p class="italic">* Tổng giá trị công trình sẽ được thanh toán theo khối lượng thực tế đã thực hiện bằng biên bản thanh lý hợp đồng.</p>
                    <div class="content"> <p class="bold indent">Điều 2. Trách nhiệm của hai bên:</p> <p class="bold">Bên A:</p> <p class="indent">- Thống nhất thời gian, địa điểm để bên B triển khai thực hiện;</p> <p class="indent">- Xác định mốc ranh giới thửa đất (khu đất) tại thực địa thể hiện bằng cọc sắt, cọc bê tông hoặc vạch sơn, Chỉ dẫn mốc ranh giới thửa đất (khu đất) cần đo vẽ và chịu trách nhiệm về việc chỉ dẫn, xác định ranh giới thửa đất (khu đất);</p> <p class="indent">- Có trách nhiệm thông báo cho địa phương về kế hoạch đo đạc thửa đất (khu đất), liên hệ với địa phương để phối hợp trong quá trình đo đạc tại thực địa;</p> <p class="indent">- Chịu trách nhiệm trong việc thỏa thuận ranh giới thửa đất (khu đất) với các chủ sử dụng đất liền kề để ký xác nhận bản mô tả ranh giới, mốc giới thửa đất;</p> <p class="indent">- Liên hệ UBND xã (phường, thị trấn) để ký xác nhận bản mô tả ranh giới, mốc giới thửa đất;</p> <p class="indent">- Trong trường hợp có sự tranh chấp về ranh giới thửa đất hoặc không thỏa thuận được ranh giới thửa đất với chủ sử dụng đất liền kề trong thời gian thực hiện hợp đồng đo đạc dịch vụ thì thông báo cho Văn phòng Đăng ký đất đai tỉnh Đồng Nai để tạm ngưng hoặc hủy hợp đồng đo đạc dịch vụ đã ký kết;</p> <p class="indent">- Trường hợp ranh giới, diện tích thửa đất đang sử dụng có thay đổi so với các tài liệu pháp lý liên quan (Giấy chứng nhận quyền sử dụng đất, bản vẽ có chữ ký và đóng dấu của cơ quan quản lý nhà nước về đất đai, bản án của Tòa án về giải quyết tranh chấp đất đai hoặc biên bản giải quyết của cơ quan có thẩm quyền trong việc giải quyết tranh chấp đất đai, ...) thì nêu rõ nguyên nhân để ghi vào phiếu xác nhận kết quả đo đạc cũng như bản mô tả ranh giới, mốc giới thửa đất và chịu trách nhiệm về sự thay đổi đó;</p> <p class="indent">- Thanh toán chi phí cho bên B theo điều 4 hợp đồng.</p> <p class="bold">Bên B:</p> <p class="indent">- Bên B có trách nhiệm đo chỉnh lý thửa đất đúng theo sự chỉ dẫn ranh giới thửa đất của bên A;</p> <p class="indent">- Xuất phiếu xác nhận kết quả đo đạc cho Bên A biết để ký xác nhận;</p> <p class="indent">- Vẽ bản mô tả ranh giới, mốc giới thửa đất giao cho Bên A đi ký xác nhận ranh giới với các chủ sử dụng đất liền kề và xác nhận của UBND xã (phường, thị trấn);</p> <p class="indent">- Đảm bảo độ chính xác về kết quả đo vẽ theo yêu cầu kỹ thuật.</p> <p class="bold indent">Điều 3. Thời gian triển khai và bàn giao hồ sơ:</p> <p class="indent">- Thời gian triển khai: Trong thời hạn 3 ngày làm việc kể từ ngày ký hợp đồng (thời gian cụ thể do hai bên thống nhất ).</p> <p class="indent">- Ngày hoàn thành, bàn giao sản phẩm: Sau 10 ngày làm việc (không tính ngày lễ, chủ nhật) kể từ ngày hợp đồng được triển khai thực hiện;</p><p class="indent">- Trường hợp bên A cung cấp tài liệu nhiều lần thì thời gian thực hiện phải tính từ ngày bàn giao tài liệu cuối cùng.</p><p class="indent">- Hồ sơ bàn giao gồm: ${data.photoData.quantity} bản vẽ.</p> <p class="bold indent">Điều 4. Thời hạn và phương thức thanh toán:</p> <p class="indent">Bên A thanh toán cho bên B bằng tiền mặt hoặc chuyển khoản:</p><p class="indent">- Đợt 1:  Tạm ứng  100% ngay sau ký hợp đồng - PT:</p><p class="indent">- Đợt 2: Thanh lý hợp đồng, bàn giao sản phẩm.</p> <p class="bold indent">Điều 5. Điều khoản chung:</p> <p class="indent">Hai bên cam kết thực hiện các nội dung đã thỏa thuận trong hợp đồng:</p> <p class="indent">- Trường hợp khi đo lần 1 không thực hiện được không phải lỗi bên B, nếu đi đo thêm các lần tiếp theo thì bên A phải thanh toán thêm chi phí phát sinh;</p> <p class="indent">- Trường hợp quá thời hạn 60 ngày kể từ ngày ký hợp đồng mà hợp đồng không thực hiện được do lỗi của bên A như: không cung cấp được tài liệu bổ sung (nếu có), không giải quyết được tranh chấp, khiếu nại liên quan đến thửa đất, khu đất (nếu có) thì bên B có quyền đơn phương chấm dứt hợp đồng;</p><p class="indent">Bên A phải thanh toán cho bên B các chi phí mà bên B đã thực hiện;</p><p class="indent">- Mọi vướng mắc trong hợp đồng (nếu có) sẽ được hai bên cùng thỏa thuận giải quyết, nếu không thỏa thuận được thì tranh chấp sẽ do Tòa án quyết định;</p><p class="indent">Hợp đồng này được lập thành 04 bản, bên A giữ 02 bản, bên B giữ 02 bản có giá trị như nhau./.</p> </div>
                    <div class="footer"> <table class="footer-table"> <tr> <td style="width: 50%;"><strong>ĐẠI DIỆN BÊN A</strong><br><span style="font-weight: normal;" class="italic">(Ký, ghi rõ họ tên)</span></td> <td style="width: 50%;"><strong>ĐẠI DIỆN BÊN B</strong><br><span style="font-weight: normal;" class="italic">(Ký, ghi rõ họ tên)</span></td> </tr> <tr><td colspan="2" style="height: 60px;"></td></tr> <tr> <td><strong class="bold">${data.clientInfo.name}</strong></td> <td><strong class="bold">Phạm Văn Hải</strong></td> </tr> </table> </div>
                </body></html>`;
    }
});