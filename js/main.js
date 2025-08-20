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
        exportSummaryBtn: document.getElementById('export-summary-btn'),
    };

    // --- API MODULE ---
    const api = {
        async _fetch(action, options = {}) {
            const url = new URL(AppConfig.GOOGLE_SHEET_API_URL);
            if (options.method === 'GET' || !options.method) {
                url.searchParams.append('action', action);
                Object.keys(options.params || {}).forEach(key => url.searchParams.append(key, options.params[key]));
            }

            try {
                const response = await fetch(url, {
                    method: options.method || 'GET',
                    body: options.body ? JSON.stringify({ action, ...options.body }) : null,
                    headers: { 'Content-Type': 'application/json' },
                    redirect: 'follow'
                });

                if (!response.ok) throw new Error(`Lỗi mạng: ${response.statusText}`);
                
                const result = await response.json();
                if (result.status === 'error') throw new Error(result.message);
                
                return result;
            } catch (error) {
                console.error(`Lỗi API cho hành động "${action}":`, error);
                modal.alert('Lỗi Kết Nối', `Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng và ID triển khai.\nLỗi: ${error.message}`);
                throw error;
            }
        },

        loadAndCacheRecords: async () => {
            const result = await api._fetch('loadAndCacheRecords');
            state.records = result.records || [];
            localStorage.setItem('recordsCache', JSON.stringify(state.records));
            return state.records;
        },

        createRecord: (data) => api._fetch('create', { method: 'POST', body: { data } }),
        updateRecord: (data) => api._fetch('update', { method: 'POST', body: { data } }),
        getNextContractNumber: () => api._fetch('getNextContractNumber', { method: 'GET' }),
        getNextLiquidationNumber: () => api._fetch('getNextLiquidationNumber', { method: 'GET' }),

        cache: {
            invalidate: () => localStorage.removeItem('recordsCache'),
            get: () => JSON.parse(localStorage.getItem('recordsCache'))
        }
    };

    // --- UI MODULE ---
    const ui = {
        // ... (giữ nguyên hàm initCommuneSelect)
        initCommuneSelect() {
            // ...
        },

        async clearForm(isNew, resetClient = true) {
            dom.invoiceForm.reset();
            dom.invoiceItemsContainer.innerHTML = '';
            dom.totalAmountDisplay.textContent = '0';
            dom.grandTotalDisplay.textContent = '0';
            dom.calculateBtn.disabled = false;
            dom.calculateBtn.textContent = 'Tạo Hồ Sơ';
            dom.editContractBtn.style.display = 'none';
            dom.editContractBtn.disabled = false;
            dom.addParcelBtn.style.display = 'inline-block';
            state.currentInvoiceData = {};
            state.wasEditedInLiquidation = false;
            
            document.querySelectorAll('#calculator-view input, #calculator-view select, #calculator-view textarea').forEach(el => el.disabled = false);
            dom.liquidationNumberInput.disabled = true;

            if (resetClient) {
                dom.clientNameInput.value = '';
                dom.clientAddressInput.value = '';
                dom.clientPhoneInput.value = '';
                dom.clientEmailInput.value = '';
            }

            if (isNew) {
                try {
                    const { nextContractNumber } = await api.getNextContractNumber();
                    const year = new Date().getFullYear().toString().slice(-2);
                    dom.contractNumberInput.value = `${nextContractNumber}/HĐ-DV/${year}`;
                } catch (error) {
                    console.error("Không thể lấy số hợp đồng tiếp theo.", error);
                    dom.contractNumberInput.value = `Lỗi/HĐ-DV`;
                }
            }
        },

        async populateForm(record, mode) {
            await this.clearForm(false, false);
            state.currentInvoiceData = deepClone(record);

            // Populate client info
            dom.clientNameInput.value = record.clientInfo.name;
            dom.clientAddressInput.value = record.clientInfo.address;
            dom.clientPhoneInput.value = record.clientInfo.phone;
            dom.clientEmailInput.value = record.clientInfo.email;

            // Populate contract info
            dom.communeSelect.value = record.contractInfo.location;
            dom.contractNumberInput.value = record.contractInfo.fullNumber;
            dom.liquidationNumberInput.value = record.contractInfo.fullLiquidationNumber || '';

            // Populate parcels and services
            dom.invoiceItemsContainer.innerHTML = '';
            record.allOptionalItems.forEach(parcel => {
                const parcelCard = this.addParcelCard(parcel.mapSheet, parcel.parcelNo, parcel.address);
                parcel.services.forEach(service => this.addServiceToParcel(parcelCard, service));
            });

            // Populate totals
            ui.updateTotals(record.totalAmount, record.grandTotal);

            // Set UI mode
            const isViewMode = mode === 'view';
            const isLiquidationMode = mode === 'liquidate';
            
            document.querySelectorAll('#calculator-view input, #calculator-view select, #calculator-view textarea, #calculator-view button').forEach(el => {
                el.disabled = isViewMode || isLiquidationMode;
            });
            dom.addParcelBtn.style.display = (isViewMode || isLiquidationMode) ? 'none' : 'inline-block';

            if (isLiquidationMode) {
                dom.editContractBtn.style.display = 'inline-block';
                dom.calculateBtn.textContent = 'Hoàn tất Thanh lý';
                dom.calculateBtn.disabled = false;
                dom.liquidationNumberInput.disabled = false;
                try {
                    const { nextLiquidationNumber } = await api.getNextLiquidationNumber();
                    const year = new Date().getFullYear().toString().slice(-2);
                    dom.liquidationNumberInput.value = `${nextLiquidationNumber}/TL-HĐ/${year}`;
                } catch (error) {
                    console.error("Không thể lấy số thanh lý tiếp theo.", error);
                    dom.liquidationNumberInput.value = `Lỗi/TL-HĐ`;
                }
            } else if (isViewMode) {
                dom.calculateBtn.textContent = 'Đang ở Chế độ Xem';
            } else { // Edit mode
                dom.calculateBtn.textContent = 'Cập nhật Hồ sơ';
                dom.calculateBtn.disabled = false;
            }
        },
        // ... (giữ nguyên các hàm còn lại của UI)
    };

    // --- CORE LOGIC MODULE ---
    const core = {
        async loadManagerRecords() {
            ui.showLoading(true);
            try {
                let records = api.cache.get();
                if (!records) {
                    records = await api.loadAndCacheRecords();
                }
                state.records = records; // Cập nhật state
                ui.renderManagerTable(records);
            } catch (error) {
                console.error("Lỗi khi tải danh sách hồ sơ:", error);
                // Không cần alert ở đây vì api._fetch đã xử lý
            } finally {
                ui.showLoading(false);
            }
        },
        // ... (giữ nguyên các hàm còn lại của Core)
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
            
            dom.exportSummaryBtn.addEventListener('click', () => {
                modal.alert('Thông báo', 'Báo cáo tổng hợp sẽ được chuẩn bị và tải xuống. Vui lòng chờ trong giây lát.');
                const exportUrl = `${AppConfig.GOOGLE_SHEET_API_URL}?action=export_summary_excel`;
                window.open(exportUrl, '_blank');
            });

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

            // --- Refactored Export Logic ---

            const printDocument = (htmlString) => {
                const printWindow = window.open('', '_blank', 'height=800,width=1000');
                if(!printWindow) {
                    modal.alert('Lỗi In', 'Không thể mở cửa sổ in. Vui lòng kiểm tra và cho phép pop-up từ trang này.');
                    return;
                }
                printWindow.document.write(htmlString);
                printWindow.document.close();
                // Use a timeout to ensure CSS is loaded, especially in Firefox
                setTimeout(() => {
                    printWindow.focus(); // Required for some browsers
                    printWindow.print();
                    // printWindow.close(); // Optional: close window after printing
                }, 500);
            };

            const ensureDynamicContent = (record) => {
                if (!record.contractInfo.titleObject || !record.contractInfo.detailedContent) {
                    const allServiceKeys = record.allOptionalItems.flatMap(p => p.services.map(s => s.serviceKey));
                    const profile = Object.values(AppConfig.communeProfiles).find(p => p.name === record.contractInfo.location) || { type: 'phường' };
                    record.contractInfo.titleObject = core.determineContractTitleObject(allServiceKeys, record.contractInfo.location, profile.type);
                    record.contractInfo.detailedContent = core.getDetailedContent(record.contractInfo.titleObject);
                }
            };
            
            const handleExport = (generatorFunction, data) => {
                if (!state.currentInvoiceData || !state.currentInvoiceData.id) {
                    modal.alert('Thông báo', 'Vui lòng lưu hồ sơ trước khi xuất.');
                    return;
                }
                // Đảm bảo nội dung động được cập nhật trên dữ liệu gốc trước khi chuẩn bị data
                ensureDynamicContent(state.currentInvoiceData);
                const html = generatorFunction(data);
                printDocument(html);
            };

            const preparePrintData = () => {
                const record = state.currentInvoiceData || {};
                const isSimple = record.contractType === 'simple';
                const soNgayLamViec = isSimple ? 3 : 10;
                const now = new Date();
                const ngayNhanFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
                const ngayTraFormatted = calculateReturnDate(now, soNgayLamViec);
                const firstParcel = record.allOptionalItems?.[0] || {};
                const profile = Object.values(AppConfig.communeProfiles).find(p => p.name === record.contractInfo?.location) || { type: 'phường' };
                return { isSimple, soNgayLamViec, ngayNhanFormatted, ngayTraFormatted, firstParcel, profile };
            };

            dom.exportContractBtn.addEventListener('click', () => {
                const generator = state.currentInvoiceData.contractType === 'simple' 
                    ? generateSimpleContractHTML 
                    : generateContractHTML;
                handleExport(generator, state.currentInvoiceData);
            });
            
            dom.exportLiquidationBtn.addEventListener('click', () => handleExport(generateLiquidationHTML, state.currentInvoiceData));
            
            dom.exportReceiptBtn.addEventListener('click', () => {
                const { soNgayLamViec, ngayNhanFormatted, ngayTraFormatted, firstParcel, profile } = preparePrintData();
                const rec = state.currentInvoiceData || {};
                const ci = rec.clientInfo || {};
                const cti = rec.contractInfo || {};
                
                // Tính toán lại nội dung động một lần nữa để chắc chắn nó tồn tại
                ensureDynamicContent(rec);

                const dataForReceipt = {
                    date: cti.date || ngayNhanFormatted,
                    ngayNhan: ngayNhanFormatted,
                    ngayTra: ngayTraFormatted,
                    place: cti.location || '',
                    nguoiNop: ci.name || '',
                    diaChi: ci.address || '',
                    dienThoai: ci.phone || '',
                    email: ci.email || '',
                    noiDung: cti.detailedContent || 'N/A', // Sử dụng nội dung đã được đảm bảo
                    soTo: firstParcel.mapSheet || '',
                    soThua: firstParcel.parcelNo || '',
                    diaChiThuaDat: `${(profile.type || 'phường')} ${firstParcel.address || ''}`.trim(),
                    soHopDong: cti.fullNumber || '',
                    giayTo: [
                        { ten: 'Giấy chứng nhận quyền sử dụng đất (nếu có)', soBanChinh: 0, soBanSao: 1 },
                        { ten: 'Các giấy tờ khác có liên quan kèm theo', soBanChinh: 0, soBanSao: 1 }
                    ],
                    soLuongHoSo: 1,
                    thoiGianGiaiQuyet: `${soNgayLamViec} ngày làm việc`,
                    noiNhanKetQua: 'VPĐK Đất đai tỉnh Đồng Nai - Chi nhánh Long Khánh',
                    nguoiNhanKetQua: ci.name || ''
                };
                handleExport(generateReceiptHTML, dataForReceipt);
            });

            dom.exportControlSheetBtn.addEventListener('click', () => {
                const { ngayNhanFormatted, ngayTraFormatted, firstParcel, profile } = preparePrintData();
                const rec = state.currentInvoiceData || {};
                const ci = rec.clientInfo || {};
                const cti = rec.contractInfo || {};
                const fullNo = (cti.fullNumber || '').split('/')[0] || '';

                // Tính toán lại nội dung động
                ensureDynamicContent(rec);

                const dataForSheet = {
                    chuHoSo: `${ci.name || ''} – ${fullNo}`.trim(),
                    loaiThuTuc: cti.detailedContent || 'N/A', // Sử dụng nội dung đã được đảm bảo
                    ngayNhan: ngayNhanFormatted,
                    ngayTra: ngayTraFormatted,
                    diaChi: `Số tờ: ${firstParcel.mapSheet || ''}; số thửa: ${firstParcel.parcelNo || ''}; tại: ${(profile.type || 'phường')} ${firstParcel.address || ''}; Số HĐ: ${cti.fullNumber || ''}`,
                    place: cti.location || ''
                };
                handleExport(generateControlSheetHTML, dataForSheet);
            });
            
            dom.managerRecordsBody.addEventListener('click', e => {
                const recordId = e.target.closest('tr')?.dataset.recordId;
                if (!recordId || !state.cachedRecords) return;
                const record = state.cachedRecords.find(r => r.id == recordId);
                if(!record) return;

                const action = e.target.dataset.action;
                if (!action) return;

                state.currentInvoiceData = record; // Đặt dữ liệu hiện tại để các hàm xuất file có thể dùng

                switch(action) {
                    case 'liquidate':
                        ui.populateForm(record, 'liquidate');
                        ui.switchView('calculator');
                        break;
                    case 'edit':
                        ui.populateForm(record, 'edit');
                        ui.switchView('calculator');
                        break;
                    case 'view':
                        ui.populateForm(record, 'view');
                        ui.switchView('calculator');
                        break;
                    case 're-export-contract':
                        {
                            const generator = record.contractType === 'simple' ? generateSimpleContractHTML : generateContractHTML;
                            handleExport(generator, record);
                        }
                        break;
                    case 're-export-liquidation':
                        handleExport(generateLiquidationHTML, record);
                        break;
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
