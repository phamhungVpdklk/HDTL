/**
 * @file main.js
 * @description File logic chính cho ứng dụng tính phí dịch vụ.
 */

(function() {
    'use strict';

    /**
     * @typedef {'create' | 'edit' | 'view' | 'liquidate'} AppMode
     * @description Chế độ hoạt động hiện tại của ứng dụng.
     */

    // --- STATE MANAGEMENT ---
    const state = {
        /** @type {AppMode} */
        mode: 'create',
        currentInvoiceData: {},
        cachedRecords: null,
        pricingData: {},
        wasEditedInLiquidation: false,
    };

    // --- DOM ELEMENT CACHING ---
    const dom = {
        calculatorView: document.getElementById('calculator-view'),
        managerView: document.getElementById('manager-view'),
        showManagerBtn: document.getElementById('show-manager-btn'),
        showCalculatorBtn: document.getElementById('show-calculator-btn'),
        clearFormBtn: document.getElementById('clear-form-btn'),
        communeSelect: document.getElementById('commune-select'),
        contractFullNumberInput: document.getElementById('contract-full-number'),
        contractDateInput: document.getElementById('contract-date'),
        liquidationSection: document.getElementById('liquidation-section'),
        liquidationFullNumberInput: document.getElementById('liquidation-full-number'),
        liquidationDateInput: document.getElementById('liquidation-date'),
        clientNameInput: document.getElementById('client-name'),
        clientPhoneInput: document.getElementById('client-phone'),
        clientEmailInput: document.getElementById('client-email'),
        clientAddressInput: document.getElementById('client-address'),
        editContractBtn: document.getElementById('edit-contract-btn'),
        addParcelBtn: document.getElementById('add-parcel-btn'),
        invoiceItemsContainer: document.getElementById('invoice-items'),
        invoiceForm: document.getElementById('invoice-form'),
        calculateBtn: document.getElementById('calculate-btn'),
        resultsContainer: document.getElementById('results-container'),
        resultsDisplay: document.getElementById('results-display'),
        vatRateInput: document.getElementById('vat-rate'),
        photoQtyInput: document.getElementById('photo-qty'),
        infoQtyInput: document.getElementById('info-qty'),
        exportControlSheetBtn: document.getElementById('export-control-sheet-btn'),
        exportContractBtn: document.getElementById('export-contract-btn'),
        exportLiquidationBtn: document.getElementById('export-liquidation-btn'),
        exportReceiptBtn: document.getElementById('export-receipt-btn'),
        managerRecordsBody: document.getElementById('manager-records-body'),
        exportCsvBtn: document.getElementById('export-csv-btn'),
        dashboardFilters: document.querySelector('.dashboard-filters'),
        kpiTotalRevenue: document.getElementById('kpi-total-revenue'),
        kpiActualRevenue: document.getElementById('kpi-actual-revenue'),
        kpiTotalContracts: document.getElementById('kpi-total-contracts'),
        kpiCompletionRate: document.getElementById('kpi-completion-rate'),
        revenueByCommuneChartCanvas: document.getElementById('revenueByCommuneChart'),
        contractTypeChartCanvas: document.getElementById('contractTypeChart'),
        searchInput: document.getElementById('search-input'),
        statusFilter: document.getElementById('status-filter'),
        communeFilter: document.getElementById('commune-filter'),
        clientSuggestions: document.getElementById('client-suggestions'),
        updateStatus: document.getElementById('update-status'),
    };

    // --- API COMMUNICATION MODULE ---
    const api = {
        cache: {
            KEY: 'recordsCache',
            get() {
                const cachedData = localStorage.getItem(this.KEY);
                return cachedData ? JSON.parse(cachedData) : null;
            },
            set(data) {
                try {
                    localStorage.setItem(this.KEY, JSON.stringify(data));
                } catch (e) {
                    console.error("Lỗi khi lưu cache:", e);
                }
            },
            invalidate() {
                localStorage.removeItem(this.KEY);
                state.cachedRecords = null;
            }
        },

        async fetchFromAPI(action, params = {}) {
            const url = new URL(AppConfig.GOOGLE_SHEET_API_URL);
            const allParams = { ...params, action, cacheBust: new Date().getTime() };
            Object.keys(allParams).forEach(key => url.searchParams.append(key, allParams[key]));

            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Lỗi mạng khi gọi API action: ${action}`);
                return await response.json();
            } catch (error) {
                console.error(`Lỗi API (${action}):`, error);
                modal.alert('Lỗi Kết Nối', `Không thể kết nối tới máy chủ. Vui lòng kiểm tra lại kết nối mạng.\nLỗi: ${error.message}`);
                return null;
            }
        },
        
        async getNextLiquidationNumber() {
            return this.fetchFromAPI('getNextLiquidationNumber');
        },

        async loadAndCacheRecords() {
            const result = await this.fetchFromAPI('getRecords');
            if (result && result.status === 'success') {
                state.cachedRecords = result.data;
                this.cache.set(result.data);
                return true;
            }
            return false;
        },

        async searchClients(query) {
            return this.fetchFromAPI('searchClients', { query });
        },

        async sendData(action, data) {
            try {
                const payload = { action, data };
                const response = await fetch(AppConfig.GOOGLE_SHEET_API_URL, {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    throw new Error(`Lỗi mạng: ${response.status} ${response.statusText}`);
                }

                const result = await response.json();
                if (result.status === 'success') {
                    console.log('Phản hồi từ server:', result.message);
                    return result;
                } else {
                    throw new Error(result.message || 'Lỗi không xác định từ máy chủ.');
                }

            } catch (error) {
                console.error(`Lỗi khi gửi dữ liệu (${action}):`, error);
                modal.alert('Lỗi Gửi Dữ Liệu', `Không thể lưu dữ liệu lên máy chủ.\nLỗi: ${error.message}`);
                return null;
            }
        },
    };

    // --- UI MODULE ---
    const ui = {
        async switchView(viewToShow) {
            if (viewToShow === 'manager') {
                dom.calculatorView.classList.add('hidden');
                dom.managerView.classList.remove('hidden');

                const cachedData = api.cache.get();
                if (cachedData) {
                    state.cachedRecords = cachedData;
                    this.applyFiltersAndRenderTable();
                    if(dom.updateStatus) dom.updateStatus.textContent = 'Đang kiểm tra dữ liệu mới...';
                } else {
                    dom.managerRecordsBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Đang tải dữ liệu lần đầu...</td></tr>';
                }

                const success = await api.loadAndCacheRecords();
                if (success) {
                    this.applyFiltersAndRenderTable();
                }
                if(dom.updateStatus) dom.updateStatus.textContent = '';

            } else {
                dom.managerView.classList.add('hidden');
                dom.calculatorView.classList.remove('hidden');
            }
        },

        updateContractFields() {
            const selectedProfile = AppConfig.communeProfiles[dom.communeSelect.value];
            if(!selectedProfile) return;
            
            if (state.mode === 'create') {
                dom.contractFullNumberInput.value = `Tự động / ${selectedProfile.contractSymbol}`;
                dom.liquidationFullNumberInput.value = `Tự động / ${selectedProfile.liquidationSymbol}`;
            } else {
                 const contractNumberBase = dom.contractFullNumberInput.value.split('/')[0] || '';
                if (contractNumberBase && !isNaN(contractNumberBase)) {
                     dom.contractFullNumberInput.value = `${contractNumberBase}/${selectedProfile.contractSymbol}`;
                }
                const liquidationNumberBase = dom.liquidationFullNumberInput.value.split('/')[0] || '';
                 if (liquidationNumberBase && !isNaN(liquidationNumberBase)) {
                    dom.liquidationFullNumberInput.value = `${liquidationNumberBase}/${selectedProfile.liquidationSymbol}`;
                }
            }
        },
        
        setDefaultDate() {
            const today = new Date();
            const day = String(today.getDate()).padStart(2, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const year = today.getFullYear();
            const formattedDate = `${day}/${month}/${year}`;
            dom.liquidationDateInput.value = formattedDate;
            dom.contractDateInput.value = formattedDate;
        },

        addParcelCard(parcelData = {}) {
            if (dom.invoiceItemsContainer.querySelector('.empty-state')) {
                dom.invoiceItemsContainer.innerHTML = '';
            }
            const parcelId = `parcel-${Date.now()}-${Math.random()}`;
            let optionsHTML = '<option value="">-- Chọn dịch vụ --</option>';
            for (const key in state.pricingData) {
                if (key !== 'pho_to' && key !== 'khai_thac_thong_tin') {
                    optionsHTML += `<option value="${key}">${state.pricingData[key].name}</option>`;
                }
            }
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
            dom.invoiceItemsContainer.insertAdjacentHTML('beforeend', parcelHTML);
            return document.getElementById(parcelId);
        },

        addServiceToParcel(parcelCard, serviceData) {
            const service = state.pricingData[serviceData.serviceKey];
            if (!service) return;
            const serviceId = `service-${Date.now()}-${Math.random()}`;
            const valueInputHTML = service.type !== 'area_based'
                ? `<input type="text" inputmode="decimal" class="calc-value-input" value="${serviceData.value || '1'}" placeholder="Nhập ${service.unit}">`
                : `<span style="color: #888;">(tính theo diện tích hồ sơ)</span>`;
            const serviceHTML = `
                <div class="service-item-line" id="${serviceId}" data-service-key="${serviceData.serviceKey}">
                    <label>${service.name}:</label> ${valueInputHTML} <button type="button" class="remove-service-btn">&times;</button>
                </div>`;
            parcelCard.querySelector('.services-list').insertAdjacentHTML('beforeend', serviceHTML);
        },
        
        applyFiltersAndRenderTable() {
            if (!state.cachedRecords) {
                this.renderManagerTable([]);
                return;
            };

            const searchTerm = dom.searchInput.value.toLowerCase().trim();
            const status = dom.statusFilter.value;
            const commune = dom.communeFilter.value;

            const filteredRecords = state.cachedRecords.filter(record => {
                if (status !== 'all' && record.status !== status) {
                    return false;
                }
                if (commune !== 'all' && record.contractInfo.location !== commune) {
                    return false;
                }
                if (searchTerm) {
                    const clientName = record.clientInfo.name.toLowerCase();
                    const clientPhone = record.clientInfo.phone.toLowerCase();
                    const contractNumber = record.contractInfo.fullNumber.toLowerCase();
                    if (!clientName.includes(searchTerm) && !clientPhone.includes(searchTerm) && !contractNumber.includes(searchTerm)) {
                        return false;
                    }
                }
                return true;
            });

            this.renderManagerTable(filteredRecords);
        },

        renderManagerTable(recordsToRender) {
            dom.managerRecordsBody.innerHTML = '';
            
            if (!recordsToRender || recordsToRender.length === 0) {
                dom.managerRecordsBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Không tìm thấy hồ sơ nào phù hợp.</td></tr>';
            } else {
                recordsToRender.sort((a,b) => b.id - a.id).forEach(record => {
                    const tr = document.createElement('tr');
                    tr.dataset.recordId = record.id;
                    const isCompleted = record.status === "Đã hoàn thành";
                    tr.innerHTML = `
                        <td>${escapeHTML(record.contractInfo.date)}</td>
                        <td>${escapeHTML(record.clientInfo.name || 'N/A')}</td>
                        <td>${escapeHTML(record.contractInfo.fullNumber || 'N/A')}</td>
                        <td>${formatCurrency(record.grandTotal)}</td>
                        <td><span class="status ${isCompleted ? 'completed' : 'pending'}">${escapeHTML(record.status)}</span></td>
                        <td>
                            <div class="actions-group">
                                ${!isCompleted ? '<button class="edit-btn">Sửa</button><button class="liquidate-btn">Thanh lý</button>' : '<button class="view-btn">Xem</button>'}
                                <button class="re-export-btn" data-type="contract">HĐ</button>
                            </div>
                        </td>
                    `;
                    dom.managerRecordsBody.appendChild(tr);
                });
            }
            
            this.updateDashboard(state.cachedRecords || []); 
        },

        displayResultsOnPage(data) {
            let displayHTML = `<div class="result-group-header">I. Tổng chi phí thực hiện</div>`;
            if (data.allOptionalItems.length > 0) {
                data.allOptionalItems.forEach((parcel, index) => {
                    displayHTML += `<div class="result-parcel-header">${index + 1}. Hồ sơ (Tờ: ${escapeHTML(parcel.mapSheet)}, Thửa: ${escapeHTML(parcel.parcelNo)}, Dt: ${parcel.area} m², Tại: ${escapeHTML(parcel.address)})</div>`;
                    parcel.services.forEach(service => {
                        displayHTML += `<div class="result-line"><span>- ${escapeHTML(service.name)}</span><span>${formatCurrency(service.cost)}</span></div>`;
                    });
                });
            } else {
                displayHTML += `<div class="result-line"><span>(Không có)</span><span>${formatCurrency(0)}</span></div>`;
            }
            displayHTML += `<div class="result-section-item"><span>II. Phôtô (${data.photoData.quantity} ${data.photoData.unit})</span><span>${formatCurrency(data.photoData.cost)}</span></div>`;
            displayHTML += `<div class="sub-total"><span>Cộng (I + II)</span><span>${formatCurrency(data.totalBeforeVat)}</span></div>`;
            displayHTML += `<div class="sub-total"><span>Thuế GTGT (${data.vatRateValue}%)</span><span>${formatCurrency(data.vatAmount)}</span></div>`;
            displayHTML += `<div class="result-section-item"><span>III. Khai thác thông tin (${data.infoData.quantity} ${data.infoData.unit})</span><span>${formatCurrency(data.infoData.cost)}</span></div>`;
            displayHTML += `<div class="grand-total"><span>Tổng cộng</span><span>${formatCurrency(data.grandTotal)}</span></div>`;
            displayHTML += `<div class="total-in-words"><span>(Bằng chữ: ${numberToWords(data.grandTotal)})</span></div>`;
            displayHTML += ` <div class="payment-section"> <div class="payment-line"> <label for="amount-paid-input">Bên A đã thanh toán:</label> <input type="text" inputmode="decimal" id="amount-paid-input" value="${data.amountPaid > 0 ? data.amountPaid.toLocaleString('vi-VN') : ''}" placeholder="Nhập số tiền..."> </div> <div class="payment-line"> <label>Bên A còn phải thanh toán:</label> <span class="payment-value" id="amount-owed-value">${formatCurrency(data.amountOwed)}</span> </div> <div class="payment-line"> <label>Tiền thừa trả lại Bên A:</label> <span class="payment-value" id="refund-value">${formatCurrency(data.refundAmount)}</span> </div> </div> `;
            if (data.editHistory && data.editHistory.length > 0) {
                displayHTML += `<div class="history-section" style="margin-top:15px; padding-top:10px; border-top:1px dashed #ccc;"><h4>Lịch sử Chỉnh sửa</h4><ul style="padding-left:20px; font-size:14px;">`;
                data.editHistory.forEach(item => {
                    displayHTML += `<li><strong>${escapeHTML(item.timestamp)}:</strong> ${escapeHTML(item.reason)}</li>`;
                });
                displayHTML += `</ul></div>`;
            }

            dom.resultsDisplay.innerHTML = displayHTML;
            dom.resultsContainer.classList.remove('hidden');
            dom.exportControlSheetBtn.classList.remove('hidden');
            dom.exportReceiptBtn.classList.remove('hidden');
            dom.exportContractBtn.classList.remove('hidden');
            if (state.mode === 'liquidate' || (state.mode === 'view' && data.status === 'Đã hoàn thành')) {
                 dom.exportLiquidationBtn.classList.remove('hidden');
            } else {
                 dom.exportLiquidationBtn.classList.add('hidden');
            }
        },
        
        async clearForm(shouldConfirm = false, noConfirm = false) {
            if (!noConfirm && shouldConfirm) {
                const title = "Xác nhận Tạo mới";
                const message = state.mode !== 'create' 
                    ? "Bạn đang trong chế độ cập nhật. Hành động này sẽ hủy các thay đổi và tạo một hợp đồng mới. Bạn có chắc không?"
                    : "Hành động này sẽ xóa toàn bộ thông tin chưa lưu. Bạn có chắc không?";
                const confirmed = await modal.confirm(title, message);
                if (!confirmed) return;
            }
            
            state.mode = 'create';
            state.wasEditedInLiquidation = false;
            state.currentInvoiceData = {};
            
            dom.invoiceForm.reset();
            dom.clientNameInput.value = '';
            dom.clientPhoneInput.value = '';
            dom.clientEmailInput.value = '';
            dom.clientAddressInput.value = '';

            dom.contractFullNumberInput.value = 'Tự động tạo sau khi lưu';
            dom.liquidationFullNumberInput.value = 'Tự động tạo sau khi lưu';

            dom.photoQtyInput.value = AppConfig.DEFAULT_PHOTO_QTY;
            dom.infoQtyInput.value = AppConfig.DEFAULT_INFO_QTY;
            dom.vatRateInput.value = AppConfig.DEFAULT_VAT_RATE;
            dom.invoiceItemsContainer.innerHTML = '<p class="empty-state">Chưa có hồ sơ thửa đất nào được thêm.</p>';
            dom.resultsContainer.classList.add('hidden');
            
            document.querySelectorAll('#calculator-view input, #calculator-view select, #calculator-view button').forEach(el => el.disabled = false);
            dom.contractFullNumberInput.disabled = true;
            dom.liquidationFullNumberInput.disabled = true;
            dom.addParcelBtn.style.display = 'inline-block';
            dom.calculateBtn.style.display = 'block';
            dom.calculateBtn.textContent = 'Lưu Hợp đồng';
            dom.liquidationSection.classList.add('hidden');
            dom.editContractBtn.classList.add('hidden');
    
            this.setDefaultDate();
            dom.communeSelect.value = "long_khanh";
            this.updateContractFields();
        },

        async populateForm(record, mode) {
            await this.clearForm(false, true); 
            state.currentInvoiceData = { ...record }; 
            state.mode = mode;

            dom.communeSelect.value = Object.keys(AppConfig.communeProfiles).find(key => AppConfig.communeProfiles[key].name === record.contractInfo.location);
            dom.clientNameInput.value = record.clientInfo.name;
            dom.clientPhoneInput.value = record.clientInfo.phone;
            dom.clientAddressInput.value = record.clientInfo.address;
            dom.clientEmailInput.value = record.clientInfo.email || '';
            dom.contractFullNumberInput.value = record.contractInfo.fullNumber;
            dom.contractDateInput.value = record.contractInfo.date;
            dom.liquidationFullNumberInput.value = record.contractInfo.fullLiquidationNumber || '';
            dom.liquidationDateInput.value = record.contractInfo.liquidationDate || '';
            dom.photoQtyInput.value = record.photoData.quantity;
            dom.infoQtyInput.value = record.infoData.quantity;
            dom.vatRateInput.value = record.vatRateValue;
            
            dom.invoiceItemsContainer.innerHTML = '';
            if(!record.allOptionalItems || record.allOptionalItems.length === 0) {
                dom.invoiceItemsContainer.innerHTML = '<p class="empty-state">Chưa có hồ sơ thửa đất nào được thêm.</p>';
            } else {
                record.allOptionalItems.forEach(parcelData => {
                    const newCard = this.addParcelCard(parcelData);
                    if (parcelData.services) {
                        parcelData.services.forEach(serviceData => {
                            this.addServiceToParcel(newCard, serviceData);
                        });
                    }
                });
            }

            const allElementsToToggle = document.querySelectorAll('#calculator-view input, #calculator-view select, #calculator-view button');
            allElementsToToggle.forEach(el => {
                if (!el.closest('.top-buttons') && !el.closest('.export-buttons')) {
                    el.disabled = true;
                }
            });
            
            if (mode === 'view') {
                dom.calculateBtn.style.display = 'none';
                dom.liquidationSection.classList.toggle('hidden', record.status !== 'Đã hoàn thành');
                dom.editContractBtn.classList.add('hidden');
            } else if (mode === 'liquidate') {
                dom.addParcelBtn.style.display = 'none';
                dom.liquidationSection.classList.remove('hidden');
                dom.calculateBtn.textContent = 'Hoàn tất & Lưu Thanh lý';
                dom.calculateBtn.style.display = 'block';
                dom.calculateBtn.disabled = false;
                dom.liquidationDateInput.disabled = false;
                dom.editContractBtn.classList.remove('hidden');
                dom.editContractBtn.disabled = false;

                dom.liquidationFullNumberInput.value = "Đang lấy số...";
                const result = await api.getNextLiquidationNumber();
                if (result && result.nextLiquidationNumber) {
                    const selectedProfile = AppConfig.communeProfiles[dom.communeSelect.value];
                    dom.liquidationFullNumberInput.value = `${result.nextLiquidationNumber}/${selectedProfile.liquidationSymbol}`;
                } else {
                    dom.liquidationFullNumberInput.value = 'Lỗi lấy số TL';
                }

            } else if (mode === 'edit') {
                 document.querySelectorAll('#calculator-view input, #calculator-view select, #calculator-view button').forEach(el => {
                     if (!el.closest('.top-buttons') && !el.closest('.export-buttons')) el.disabled = false;
                 });
                dom.calculateBtn.textContent = 'Cập nhật Hợp đồng';
                dom.liquidationSection.classList.add('hidden');
                dom.contractFullNumberInput.disabled = true;
                dom.liquidationFullNumberInput.disabled = true;
            }
            
            this.displayResultsOnPage(record);
             const amountPaidInput = document.getElementById('amount-paid-input');
             if(amountPaidInput) {
                amountPaidInput.disabled = (mode === 'view');
             }
        },
        
        _charts: {}, 

        updateDashboard(records) {
            const totalContracts = records.length;
            const totalRevenue = records.reduce((sum, rec) => sum + (rec.grandTotal || 0), 0);
            const completedRecords = records.filter(rec => rec.status === 'Đã hoàn thành');
            const actualRevenue = completedRecords.reduce((sum, rec) => sum + (rec.grandTotal || 0), 0);
            const completionRate = totalContracts > 0 ? (completedRecords.length / totalContracts) * 100 : 0;

            dom.kpiTotalContracts.textContent = totalContracts;
            dom.kpiTotalRevenue.textContent = formatCurrency(totalRevenue);
            dom.kpiActualRevenue.textContent = formatCurrency(actualRevenue);
            dom.kpiCompletionRate.textContent = `${completionRate.toFixed(1)}%`;

            const revenueByCommune = {};
            Object.values(AppConfig.communeProfiles).forEach(profile => {
                revenueByCommune[profile.name] = 0;
            });
            completedRecords.forEach(rec => {
                const location = rec.contractInfo.location;
                if (revenueByCommune[location] !== undefined) {
                    revenueByCommune[location] += rec.grandTotal || 0;
                }
            });
            
            const communeLabels = Object.keys(revenueByCommune);
            const communeData = Object.values(revenueByCommune);
            this.renderBarChart(dom.revenueByCommuneChartCanvas, 'revenueByCommune', communeLabels, communeData, 'Doanh thu');

            const contractTypes = { 'Đo đạc phức tạp': 0, 'Trích lục đơn giản': 0 };
            records.forEach(rec => {
                if (rec.contractType === 'simple') {
                    contractTypes['Trích lục đơn giản']++;
                } else {
                    contractTypes['Đo đạc phức tạp']++;
                }
            });

            const typeLabels = Object.keys(contractTypes);
            const typeData = Object.values(contractTypes);
            this.renderPieChart(dom.contractTypeChartCanvas, 'contractType', typeLabels, typeData);
        },

        renderBarChart(canvas, chartId, labels, data, label) {
            if (this._charts[chartId]) {
                this._charts[chartId].destroy();
            }
            this._charts[chartId] = new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: label,
                        data: data,
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: { y: { beginAtZero: true } },
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        },

        renderPieChart(canvas, chartId, labels, data) {
            if (this._charts[chartId]) {
                this._charts[chartId].destroy();
            }
            this._charts[chartId] = new Chart(canvas, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(75, 192, 192, 0.6)'],
                        borderColor: ['rgba(255, 99, 132, 1)', 'rgba(75, 192, 192, 1)'],
                        borderWidth: 1
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        },

        renderClientSuggestions(clients) {
            if (!clients || clients.length === 0) {
                this.clearClientSuggestions();
                return;
            }
            dom.clientSuggestions.innerHTML = clients.map(client => `
                <div class="suggestion-item" 
                     data-name="${escapeHTML(client.name)}" 
                     data-phone="${escapeHTML(client.phone)}" 
                     data-address="${escapeHTML(client.address)}" 
                     data-email="${escapeHTML(client.email)}">
                    <div class="suggestion-name">${escapeHTML(client.name)}</div>
                    <div class="suggestion-details">${escapeHTML(client.phone)} - ${escapeHTML(client.address)}</div>
                </div>
            `).join('');
            dom.clientSuggestions.style.display = 'block';
        },

        clearClientSuggestions() {
            dom.clientSuggestions.innerHTML = '';
            dom.clientSuggestions.style.display = 'none';
        },

        autofillClientData(clientData) {
            dom.clientNameInput.value = clientData.name;
            dom.clientPhoneInput.value = clientData.phone;
            dom.clientAddressInput.value = clientData.address;
            dom.clientEmailInput.value = clientData.email;
        },
    };

    // --- CORE LOGIC MODULE ---
    const core = {
        validateForm() {
            let errors = [];
            if (!dom.clientNameInput.value.trim()) errors.push("Tên khách hàng");
            if (!dom.clientAddressInput.value.trim()) errors.push("Địa chỉ khách hàng");
            const parcelCards = document.querySelectorAll('.parcel-card');
            if (parcelCards.length === 0) {
                errors.push("Ít nhất một hồ sơ thửa đất");
            } else {
                parcelCards.forEach((card, index) => {
                    if (!card.querySelector('.map-sheet-input').value.trim()) errors.push(`Số tờ (Hồ sơ ${index + 1})`);
                    if (!card.querySelector('.parcel-no-input').value.trim()) errors.push(`Số thửa (Hồ sơ ${index + 1})`);
                    if (!card.querySelector('.area-input').value.trim()) errors.push(`Diện tích (Hồ sơ ${index + 1})`);
                });
            }
            return errors;
        },

        buildInvoiceDataFromDOM() {
            const selectedCommuneProfile = AppConfig.communeProfiles[dom.communeSelect.value];
            const contractInfo = {
                location: selectedCommuneProfile.name,
                fullNumber: `TẠM/${selectedCommuneProfile.contractSymbol}`,
                date: dom.contractDateInput.value,
                fullLiquidationNumber: `TẠM/${selectedCommuneProfile.liquidationSymbol}`,
                liquidationDate: dom.liquidationDateInput.value
            };
            const clientInfo = {
                name: dom.clientNameInput.value,
                phone: dom.clientPhoneInput.value,
                email: dom.clientEmailInput.value,
                address: dom.clientAddressInput.value
            };
            const allOptionalItems = [];
            let totalSection1 = 0;
            document.querySelectorAll('.parcel-card').forEach(card => {
                const area = parseFloat((card.querySelector('.area-input').value || '0').replace(',', '.')) || 0;
                const parcelInfo = {
                    mapSheet: card.querySelector('.map-sheet-input').value || 'N/A',
                    parcelNo: card.querySelector('.parcel-no-input').value || 'N/A',
                    address: selectedCommuneProfile.name,
                    area,
                    services: []
                };
                card.querySelectorAll('.service-item-line').forEach(line => {
                    const serviceKey = line.dataset.serviceKey;
                    const service = state.pricingData[serviceKey];
                    let value = (service.type === 'area_based') ? area : parseFloat((line.querySelector('.calc-value-input')?.value || '0').replace(',', '.')) || 0;
                    if (value > 0) {
                        let cost = 0;
                        if (service.type === 'area_based') cost = calculateAreaBased(service, value);
                        else if (service.type === 'progressive_discount') cost = calculateProgressiveDiscount(service, value);
                        else if (service.type === 'fixed_rate') cost = service.price * value;
                        
                        let quantity = (service.type === 'area_based') ? 1 : value;
                        let unitPrice = (service.type === 'area_based') ? cost : (service.type === 'progressive_discount' ? (value > 0 ? cost / value : 0) : service.price);

                        parcelInfo.services.push({ serviceKey, name: service.name, unit: service.unit, quantity, unitPrice, cost, type: service.type, value });
                        totalSection1 += cost;
                    }
                });
                if (parcelInfo.services.length > 0) allOptionalItems.push(parcelInfo);
            });
            const contractType = allOptionalItems.some(p => p.services.some(s => s.serviceKey === 'bien_ve')) ? 'simple' : 'complex';
            const photoQty = parseFloat(dom.photoQtyInput.value) || 0;
            const infoQty = parseFloat(dom.infoQtyInput.value) || 0;
            const totalSection2 = photoQty * (state.pricingData.pho_to?.price || 0);
            const totalSection3 = infoQty * (state.pricingData.khai_thac_thong_tin?.price || 0);
            const totalBeforeVat = totalSection1 + totalSection2;
            const vatRateValue = parseFloat(dom.vatRateInput.value) || 0;
            const vatAmount = totalBeforeVat * (vatRateValue / 100);
            const grandTotal = totalBeforeVat + vatAmount + totalSection3;
            const amountPaidEl = document.getElementById('amount-paid-input');
            const amountPaid = amountPaidEl ? (parseFloat((amountPaidEl.value || '0').replace(/[\.,]/g, '')) || 0) : 0;

            return { contractInfo, clientInfo, allOptionalItems, totalSection1, photoData: { ...state.pricingData.pho_to, quantity: photoQty, cost: totalSection2 }, infoData: { ...state.pricingData.khai_thac_thong_tin, quantity: infoQty, cost: totalSection3 }, totalBeforeVat, vatRateValue, vatAmount, grandTotal, amountPaid, amountOwed: Math.max(0, grandTotal - amountPaid), refundAmount: Math.max(0, amountPaid - grandTotal), contractType };
        },
        
        async handleFormSubmit(e) {
            e.preventDefault();
            const errors = this.validateForm();
            if (errors.length > 0) {
                modal.alert("Lỗi Nhập Liệu", "Vui lòng điền đầy đủ các thông tin bắt buộc:\n- " + errors.join("\n- "));
                return;
            }

            let invoiceData = this.buildInvoiceDataFromDOM();
            let result = null;
            dom.calculateBtn.disabled = true;

            if (state.mode === 'create') {
                dom.calculateBtn.textContent = 'Đang lưu...';
                
                const dataToCreate = { ...invoiceData, id: Date.now(), status: "Chưa thanh lý" };
                result = await api.sendData('create', dataToCreate);

                if (result && result.createdRecord) {
                    state.currentInvoiceData = result.createdRecord; 
                    await modal.alert('Thành công', `Đã lưu hợp đồng mới #${state.currentInvoiceData.contractInfo.fullNumber.split('/')[0]} cho khách hàng "${state.currentInvoiceData.clientInfo.name}"!`);
                    ui.displayResultsOnPage(state.currentInvoiceData);
                }
            } else {
                dom.calculateBtn.textContent = 'Đang cập nhật...';
                let reason = '';
                if(state.wasEditedInLiquidation || state.mode === 'liquidate') {
                    reason = await modal.prompt('Lý do cập nhật/thanh lý', 'Vui lòng nhập lý do để tiếp tục:');
                    if (reason === null) { 
                        dom.calculateBtn.disabled = false;
                        dom.calculateBtn.textContent = state.mode === 'liquidate' ? 'Hoàn tất & Lưu Thanh lý' : 'Cập nhật Hợp đồng';
                        return;
                    }
                     if(!reason.trim()){
                        modal.alert('Thông báo', 'Bạn phải nhập lý do để tiếp tục.');
                        dom.calculateBtn.disabled = false;
                        dom.calculateBtn.textContent = state.mode === 'liquidate' ? 'Hoàn tất & Lưu Thanh lý' : 'Cập nhật Hợp đồng';
                        return;
                    }
                }
                 
                if (!state.currentInvoiceData.editHistory) state.currentInvoiceData.editHistory = [];
                if(reason) {
                    state.currentInvoiceData.editHistory.push({
                        timestamp: new Date().toLocaleString('vi-VN'),
                        reason: reason.trim()
                    });
                }
                
                const newStatus = state.mode === 'liquidate' ? "Đã hoàn thành" : "Chưa thanh lý";
                const dataToUpdate = { 
                    ...state.currentInvoiceData, 
                    ...invoiceData, 
                    contractInfo: {
                        ...invoiceData.contractInfo,
                        fullNumber: state.currentInvoiceData.contractInfo.fullNumber,
                        fullLiquidationNumber: dom.liquidationFullNumberInput.value || state.currentInvoiceData.contractInfo.fullLiquidationNumber,
                    },
                    status: newStatus 
                };
                
                result = await api.sendData('update', dataToUpdate);

                if (result && result.updatedRecord) {
                    state.currentInvoiceData = result.updatedRecord;
                    await modal.alert('Thành công', `Đã cập nhật thành công hợp đồng của khách hàng "${state.currentInvoiceData.clientInfo.name}"!`);
                    ui.displayResultsOnPage(state.currentInvoiceData);
                    if (state.mode === 'liquidate') {
                        dom.calculateBtn.style.display = 'none';
                        dom.editContractBtn.classList.add('hidden');
                    }
                }
            }
            if(result) {
                api.cache.invalidate();
            }

            dom.calculateBtn.disabled = false;
            dom.calculateBtn.textContent = state.mode === 'liquidate' ? 'Hoàn tất & Lưu Thanh lý' : (state.mode === 'edit' ? 'Cập nhật Hợp đồng' : 'Lưu Hợp đồng');
        }
    };

    // --- EVENT BINDING MODULE ---
    const events = {
        init() {
            dom.showManagerBtn.addEventListener('click', () => ui.switchView('manager'));
            dom.showCalculatorBtn.addEventListener('click', () => { ui.clearForm(true, false).then(() => ui.switchView('calculator')); });
            dom.clearFormBtn.addEventListener('click', () => ui.clearForm(true, false));
            dom.communeSelect.addEventListener('change', () => ui.updateContractFields());
            dom.addParcelBtn.addEventListener('click', () => ui.addParcelCard());
            dom.invoiceForm.addEventListener('submit', (e) => core.handleFormSubmit(e));
            dom.exportCsvBtn.addEventListener('click', () => {
                modal.alert('Thông báo', 'Báo cáo sẽ được chuẩn bị và tải xuống. Vui lòng chờ trong giây lát.');
                const exportUrl = `${AppConfig.GOOGLE_SHEET_API_URL}?action=export_csv`;
                window.open(exportUrl, '_blank');
            });
            dom.invoiceItemsContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('add-service-to-parcel-btn')) {
                    const parcelCard = e.target.closest('.parcel-card');
                    const select = parcelCard.querySelector('select.service-select-in-card');
                    if (select.value) {
                        ui.addServiceToParcel(parcelCard, { serviceKey: select.value });
                        select.value = '';
                    }
                }
                if (e.target.classList.contains('remove-service-btn')) e.target.closest('.service-item-line').remove();
                if (e.target.classList.contains('remove-parcel-btn')) e.target.closest('.parcel-card').remove();
            });

            dom.editContractBtn.addEventListener('click', async () => {
                const confirmed = await modal.confirm("Mở khóa Chỉnh sửa?", "Bạn có chắc muốn mở khóa để chỉnh sửa hợp đồng gốc không? Mọi thay đổi sẽ được lưu lại khi hoàn tất thanh lý.");
                if (!confirmed) return;
                
                state.wasEditedInLiquidation = true;
                document.querySelectorAll('#calculator-view input, #calculator-view select').forEach(el => {
                    if (el.id !== 'contract-full-number' && el.id !== 'liquidation-full-number') {
                        el.disabled = false;
                    }
                });
                dom.addParcelBtn.style.display = 'inline-block';
                dom.invoiceItemsContainer.querySelectorAll('.parcel-card button, .parcel-card select, .parcel-card input').forEach(el => el.disabled = false);
                dom.calculateBtn.textContent = 'Tính toán lại & Hoàn tất Thanh lý';
                dom.editContractBtn.classList.add('hidden');
            });
            
            dom.resultsContainer.addEventListener('input', (e) => {
                if (e.target.id === 'amount-paid-input' && state.currentInvoiceData.contractInfo) {
                    const amountPaid = parseFloat((e.target.value || '0').replace(/[\.,]/g, '')) || 0;
                    state.currentInvoiceData.amountPaid = amountPaid;
                    const balance = state.currentInvoiceData.grandTotal - amountPaid;
                    state.currentInvoiceData.amountOwed = Math.max(0, balance);
                    state.currentInvoiceData.refundAmount = Math.max(0, -balance);
                    document.getElementById('amount-owed-value').textContent = formatCurrency(state.currentInvoiceData.amountOwed);
                    document.getElementById('refund-value').textContent = formatCurrency(state.currentInvoiceData.refundAmount);
                }
            });

            const printDocument = (htmlString) => {
                const printWindow = window.open('', '_blank');
                if(!printWindow) {
                    modal.alert('Lỗi In', 'Không thể mở cửa sổ in. Vui lòng kiểm tra và cho phép pop-up từ trang này.');
                    return;
                }
                printWindow.document.write(htmlString);
                printWindow.document.close();
                setTimeout(() => { printWindow.print(); }, 250);
            };

            dom.exportContractBtn.addEventListener('click', () => {
                if(!state.currentInvoiceData.id) { modal.alert('Thông báo', 'Vui lòng lưu hồ sơ trước khi xuất.'); return; }
                let html = state.currentInvoiceData.contractType === 'simple' ? generateSimpleContractHTML(state.currentInvoiceData) : generateContractHTML(state.currentInvoiceData);
                printDocument(html);
            });
            dom.exportLiquidationBtn.addEventListener('click', () => {
                if(!state.currentInvoiceData.id) { modal.alert('Thông báo', 'Vui lòng lưu hồ sơ trước khi xuất.'); return; }
                printDocument(generateLiquidationHTML(state.currentInvoiceData));
            });
            
            dom.exportReceiptBtn.addEventListener('click', () => {
                if(!state.currentInvoiceData.id) { modal.alert('Thông báo', 'Vui lòng lưu hồ sơ trước khi xuất.'); return; }
                const isSimple = state.currentInvoiceData.contractType === 'simple';
                const soNgayLamViec = isSimple ? 3 : 10;
                const now = new Date();
                const ngayNhanFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
                const ngayTraFormatted = calculateReturnDate(now, soNgayLamViec);
                const firstParcel = state.currentInvoiceData.allOptionalItems[0] || {};
                const data = {
                    date: ngayNhanFormatted, ngayNhan: ngayNhanFormatted, ngayTra: ngayTraFormatted, place: state.currentInvoiceData.contractInfo.location,
                    nguoiNop: state.currentInvoiceData.clientInfo.name, diaChi: state.currentInvoiceData.clientInfo.address, dienThoai: state.currentInvoiceData.clientInfo.phone,
                    email: state.currentInvoiceData.clientInfo.email, noiDung: isSimple ? "Trích lục và biên vẽ..." : "Đo đạc tách, hợp thửa...",
                    soTo: firstParcel.mapSheet, soThua: firstParcel.parcelNo, diaChiThuaDat: firstParcel.address, soHopDong: state.currentInvoiceData.contractInfo.fullNumber,
                    giayTo: [{ ten: 'Giấy chứng nhận quyền sử dụng đất (nếu có)', soBanChinh: 0, soBanSao: 1 }, { ten: 'Các giấy tờ khác có liên quan kèm theo', soBanChinh: 0, soBanSao: 1 }],
                    soLuongHoSo: 1, thoiGianGiaiQuyet: `${soNgayLamViec} ngày làm việc`, noiNhanKetQua: 'VPĐK Đất đai tỉnh Đồng Nai - Chi nhánh Long Khánh', nguoiNhanKetQua: state.currentInvoiceData.clientInfo.name
                };
                printDocument(generateReceiptHTML(data));
            });

            dom.exportControlSheetBtn.addEventListener('click', () => {
                if(!state.currentInvoiceData.id) { modal.alert('Thông báo', 'Vui lòng lưu hồ sơ trước khi xuất.'); return; }
                const isSimple = state.currentInvoiceData.contractType === 'simple';
                const soNgayLamViec = isSimple ? 3 : 10;
                const now = new Date();
                const ngayNhanFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
                const ngayTraFormatted = calculateReturnDate(now, soNgayLamViec);
                const firstParcel = state.currentInvoiceData.allOptionalItems[0] || {};
                const data = {
                    chuHoSo: `${state.currentInvoiceData.clientInfo.name} – ${state.currentInvoiceData.contractInfo.fullNumber.split('/')[0]}`,
                    loaiThuTuc: isSimple ? "Trích lục và biên vẽ..." : "Đo đạc tách, hợp thửa...", ngayNhan: ngayNhanFormatted, ngayTra: ngayTraFormatted,
                    diaChi: `Số tờ: ${firstParcel.mapSheet}; số thửa: ${firstParcel.parcelNo}; tại: ${firstParcel.address}; Số HĐ: ${state.currentInvoiceData.contractInfo.fullNumber}`,
                    place: state.currentInvoiceData.contractInfo.location
                };
                printDocument(generateControlSheetHTML(data));
            });
            
            dom.managerRecordsBody.addEventListener('click', e => {
                const recordId = e.target.closest('tr')?.dataset.recordId;
                if (!recordId || !state.cachedRecords) return;
                const record = state.cachedRecords.find(r => r.id == recordId);
                if(!record) return;

                const targetClass = e.target.classList;
                if (targetClass.contains('liquidate-btn')) { ui.populateForm(record, 'liquidate'); ui.switchView('calculator'); }
                else if (targetClass.contains('edit-btn')) { ui.populateForm(record, 'edit'); ui.switchView('calculator'); }
                else if (targetClass.contains('view-btn')) { ui.populateForm(record, 'view'); ui.switchView('calculator'); }
                else if (targetClass.contains('re-export-btn')) {
                    state.currentInvoiceData = record;
                    let html = record.contractType === 'simple' ? generateSimpleContractHTML(record) : generateContractHTML(record);
                    if (html) printDocument(html);
                }
            });

            dom.dashboardFilters.addEventListener('click', e => {
                if (e.target.classList.contains('filter-btn')) {
                    if (!state.cachedRecords) return; 

                    dom.dashboardFilters.querySelector('.active').classList.remove('active');
                    e.target.classList.add('active');

                    const range = e.target.dataset.range;
                    const now = new Date();
                    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    
                    const filteredRecords = state.cachedRecords.filter(rec => {
                        const dateParts = rec.contractInfo.date.split('/');
                        if (dateParts.length !== 3) return false;
                        const recDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
                        if (isNaN(recDate.getTime())) return false;

                        if (range === 'today') {
                            return recDate >= startOfDay;
                        }
                        if (range === 'week') {
                            const startOfWeek = new Date(startOfDay);
                            const dayOfWeek = now.getDay(); 
                            const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                            startOfWeek.setDate(diff);
                            return recDate >= startOfWeek;
                        }
                        if (range === 'month') {
                            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                            return recDate >= startOfMonth;
                        }
                        return true; 
                    });
                    
                    ui.updateDashboard(filteredRecords);
                }
            });

            dom.searchInput.addEventListener('input', () => {
                ui.applyFiltersAndRenderTable();
            });
            dom.statusFilter.addEventListener('change', () => {
                ui.applyFiltersAndRenderTable();
            });
            dom.communeFilter.addEventListener('change', () => {
                ui.applyFiltersAndRenderTable();
            });

            let debounceTimer;
            dom.clientNameInput.addEventListener('input', (e) => {
                const query = e.target.value;
                clearTimeout(debounceTimer);

                if (query.length < 2) {
                    ui.clearClientSuggestions();
                    return;
                }

                debounceTimer = setTimeout(async () => {
                    const result = await api.searchClients(query);
                    if (result && result.status === 'success') {
                        ui.renderClientSuggestions(result.data);
                    }
                }, 300);
            });

            dom.clientNameInput.addEventListener('blur', () => {
                setTimeout(() => {
                    ui.clearClientSuggestions();
                }, 150);
            });

            dom.clientSuggestions.addEventListener('mousedown', (e) => {
                const item = e.target.closest('.suggestion-item');
                if (item) {
                    ui.autofillClientData(item.dataset);
                    ui.clearClientSuggestions();
                }
            });
        }
    };

    // --- INITIALIZATION ---
    async function init() {
        try {
            const response = await fetch('pricing.json');
            if (!response.ok) throw new Error('Network response was not ok');
            state.pricingData = await response.json();
        } catch (error) {
            console.error('Lỗi nghiêm trọng: Không thể tải file pricing.json.', error);
            modal.alert('Lỗi Tải Dữ Liệu', 'Không thể tải được đơn giá dịch vụ. Ứng dụng không thể tiếp tục.');
            return;
        }

        for (const key in AppConfig.communeProfiles) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = AppConfig.communeProfiles[key].name;
            dom.communeSelect.appendChild(option);

            const filterOption = document.createElement('option');
            filterOption.value = AppConfig.communeProfiles[key].name;
            filterOption.textContent = AppConfig.communeProfiles[key].name;
            dom.communeFilter.appendChild(filterOption);
        }

        events.init();
        await ui.clearForm(false, true);
    }

    document.addEventListener('DOMContentLoaded', init);

})();