// =================================================================
// CẤU HÌNH TOÀN CỤC
// =================================================================

// THAY ID CỦA GOOGLE SHEET CỦA BẠN VÀO ĐÂY
const SPREADSHEET_ID = '1rpSEd5yFtXeJ0CJvVOmiljVvbzH8OZw4nC9GOSP3bP8';

// Tên các trang tính (sheets)
const SHEET_NAMES = {
  CONTRACTS: 'Contracts',
  SERVICES: 'Services_Log',
  CLIENTS: 'Clients',
  CONFIG: 'Config',
  LOG: 'Log'
};

// Ánh xạ cột cho sheet 'Contracts'
const COLS_CONTRACT = {
  ID: 1,
  STATUS: 2,
  CLIENT_ID: 3, // SĐT khách hàng
  CONTRACT_DATE: 4,
  CONTRACT_NUMBER: 5,
  LIQUIDATION_DATE: 6,
  LIQUIDATION_NUMBER: 7,
  LOCATION: 8,
  TOTAL_AMOUNT: 9,
  AMOUNT_PAID: 10,
  FULL_JSON_DATA: 11
};

// Ánh xạ cột cho sheet 'Services_Log'
const COLS_SERVICES = {
  LOG_ID: 1,
  CONTRACT_ID: 2,
  SERVICE_KEY: 3,
  SERVICE_NAME: 4,
  QUANTITY: 5,
  UNIT_PRICE: 6,
  COST: 7,
  PARCEL_MAP_SHEET: 8,
  PARCEL_NUMBER: 9
};

// Ánh xạ cột cho sheet 'Clients'
const COLS_CLIENTS = {
  ID: 1, // SĐT khách hàng
  NAME: 2,
  ADDRESS: 3,
  EMAIL: 4,
  FIRST_CONTRACT_DATE: 5,
  LAST_CONTRACT_DATE: 6
};


// =================================================================
// BỘ ĐIỀU KHIỂN CHÍNH (GET/POST)
// =================================================================

/**
 * Ghi log vào sheet 'Log'.
 * @param {string} message - Nội dung cần ghi.
 */
function writeLog(message) {
  try {
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAMES.LOG).appendRow([new Date(), message]);
  } catch (e) {
    console.error("Không thể ghi log: " + e.toString());
  }
}

/**
 * Trả về phản hồi JSON chuẩn cho client.
 * @param {object} data - Dữ liệu cần trả về.
 * @returns {ContentService.TextOutput}
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Xử lý yêu cầu POST (tạo/cập nhật hồ sơ).
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000); // Chờ tối đa 30s để tránh xung đột ghi dữ liệu

  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const data = payload.data;

    writeLog(`POST Action: ${action}`);

    switch (action) {
      case 'create':
        return createContract(data);
      case 'update':
        return updateContract(data);
      default:
        return createJsonResponse({ status: 'error', message: 'Hành động không hợp lệ.' });
    }
  } catch (error) {
    writeLog(`POST Error: ${error.toString()} | Stack: ${error.stack}`);
    return createJsonResponse({ status: 'error', message: `Lỗi máy chủ: ${error.toString()}` });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Xử lý yêu cầu GET (lấy dữ liệu/xuất file).
 */
function doGet(e) {
  try {
    const action = e.parameter.action || 'loadAndCacheRecords';
    writeLog(`GET Action: ${action}`);

    switch (action) {
      case 'loadAndCacheRecords':
        return getAllContracts();
      case 'getNextContractNumber': // <-- THÊM MỚI
        return getNextContractNumber();
      case 'getNextLiquidationNumber':
        return getNextLiquidationNumber();
      case 'export_summary_excel':
        return exportSummaryReport();
      default:
        return createJsonResponse({ status: 'error', message: 'Hành động không hợp lệ.' });
    }
  } catch (error) {
    writeLog(`GET Error: ${error.toString()} | Stack: ${error.stack}`);
    return createJsonResponse({ status: 'error', message: `Lỗi máy chủ: ${error.toString()}` });
  }
}


// =================================================================
// CÁC HÀM XỬ LÝ NGHIỆP VỤ
// =================================================================

/**
 * Lấy và tăng số hợp đồng tiếp theo.
 */
function getNextContractNumber() {
    const contractsSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAMES.CONTRACTS);
    const lastRow = contractsSheet.getLastRow();
    if (lastRow < 2) {
        return createJsonResponse({ status: 'success', nextContractNumber: 1 });
    }
    // Lấy tất cả các số hợp đồng trong cột
    const contractNumberColumn = contractsSheet.getRange(2, COLS_CONTRACT.CONTRACT_NUMBER, lastRow - 1, 1).getValues();
    let maxNumber = 0;
    contractNumberColumn.forEach(row => {
        const fullNumber = row[0];
        if (typeof fullNumber === 'string' && fullNumber.includes('/')) {
            const numPart = parseInt(fullNumber.split('/')[0], 10);
            if (!isNaN(numPart) && numPart > maxNumber) {
                maxNumber = numPart;
            }
        }
    });
    const nextNumber = maxNumber + 1;
    writeLog(`Provided next contract number: ${nextNumber}`);
    return createJsonResponse({ status: 'success', nextContractNumber: nextNumber });
}


/**
 * Tạo một hợp đồng mới và cập nhật các sheet liên quan.
 * @param {object} data - Dữ liệu hợp đồng từ client.
 */
function createContract(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const contractsSheet = ss.getSheetByName(SHEET_NAMES.CONTRACTS);
  
  // Tạo ID duy nhất cho hợp đồng
  data.id = data.id || Date.now().toString();

  // 1. Ghi vào sheet Contracts
  const contractRow = [];
  contractRow[COLS_CONTRACT.ID - 1] = data.id;
  contractRow[COLS_CONTRACT.STATUS - 1] = data.status;
  contractRow[COLS_CONTRACT.CLIENT_ID - 1] = data.clientInfo.phone;
  contractRow[COLS_CONTRACT.CONTRACT_DATE - 1] = data.contractInfo.date;
  contractRow[COLS_CONTRACT.CONTRACT_NUMBER - 1] = data.contractInfo.fullNumber;
  contractRow[COLS_CONTRACT.LIQUIDATION_DATE - 1] = data.contractInfo.liquidationDate;
  contractRow[COLS_CONTRACT.LIQUIDATION_NUMBER - 1] = data.contractInfo.fullLiquidationNumber;
  contractRow[COLS_CONTRACT.LOCATION - 1] = data.contractInfo.location;
  contractRow[COLS_CONTRACT.TOTAL_AMOUNT - 1] = data.grandTotal;
  contractRow[COLS_CONTRACT.AMOUNT_PAID - 1] = data.amountPaid;
  contractRow[COLS_CONTRACT.FULL_JSON_DATA - 1] = JSON.stringify(data);
  
  contractsSheet.appendRow(contractRow);
  
  // 2. Ghi vào sheet Services_Log
  logServices(ss, data.id, data.services);

  // 3. Cập nhật sheet Clients
  updateClient(ss, data.clientInfo, data.contractInfo.date);

  writeLog(`Created Contract ID: ${data.id}`);
  return createJsonResponse({ status: 'success', message: 'Tạo hợp đồng thành công!', createdRecord: data });
}

/**
 * Cập nhật một hợp đồng đã có.
 * @param {object} data - Dữ liệu hợp đồng từ client.
 */
function updateContract(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const contractsSheet = ss.getSheetByName(SHEET_NAMES.CONTRACTS);
  const idColumnValues = contractsSheet.getRange(2, COLS_CONTRACT.ID, contractsSheet.getLastRow() - 1, 1).getValues();
  let foundRowIndex = -1;

  for (let i = 0; i < idColumnValues.length; i++) {
    if (idColumnValues[i][0] == data.id) {
      foundRowIndex = i + 2; // +2 vì mảng bắt đầu từ 0 và sheet bắt đầu từ hàng 2
      break;
    }
  }

  if (foundRowIndex === -1) {
    writeLog(`Update failed: Contract ID ${data.id} not found.`);
    return createJsonResponse({ status: 'error', message: 'Không tìm thấy hợp đồng để cập nhật.' });
  }

  // 1. Cập nhật sheet Contracts
  const contractRow = contractsSheet.getRange(foundRowIndex, 1, 1, Object.keys(COLS_CONTRACT).length);
  const updatedContractData = [
    data.id, data.status, data.clientInfo.phone, data.contractInfo.date,
    data.contractInfo.fullNumber, data.contractInfo.liquidationDate, data.contractInfo.fullLiquidationNumber,
    data.contractInfo.location, data.grandTotal, data.amountPaid, JSON.stringify(data)
  ];
  contractRow.setValues([updatedContractData]);

  // 2. Cập nhật sheet Services_Log (Xóa cũ, ghi mới)
  deleteServicesByContractId(ss, data.id);
  logServices(ss, data.id, data.services);

  // 3. Cập nhật sheet Clients
  updateClient(ss, data.clientInfo, data.contractInfo.date);

  writeLog(`Updated Contract ID: ${data.id}`);
  return createJsonResponse({ status: 'success', message: 'Cập nhật hợp đồng thành công!', updatedRecord: data });
}

/**
 * Ghi nhật ký các dịch vụ của một hợp đồng.
 * @param {Spreadsheet} ss - Đối tượng Spreadsheet.
 * @param {string} contractId - ID của hợp đồng.
 * @param {Array} services - Mảng các đối tượng dịch vụ.
 */
function logServices(ss, contractId, services) {
  // KIỂM TRA AN TOÀN: Nếu không có dịch vụ nào được cung cấp, hoặc services không phải là mảng, thì bỏ qua.
  if (!Array.isArray(services) || services.length === 0) {
    writeLog(`Contract ID ${contractId}: No services to log.`);
    return;
  }

  const servicesSheet = ss.getSheetByName(SHEET_NAMES.SERVICES);
  const logIdStart = servicesSheet.getLastRow() + 1;
  
  const newServiceRows = services.map((service, index) => {
    return [
      logIdStart + index,
      contractId,
      service.key,
      service.name,
      service.quantity,
      service.price,
      service.cost,
      service.parcelMapSheet,
      service.parcelNumber
    ];
  });

  if (newServiceRows.length > 0) {
    servicesSheet.getRange(logIdStart, 1, newServiceRows.length, newServiceRows[0].length).setValues(newServiceRows);
  }
}

/**
 * Xóa tất cả dịch vụ liên quan đến một Contract ID.
 * @param {Spreadsheet} ss - Đối tượng Spreadsheet.
 * @param {string} contractId - ID của hợp đồng.
 */
function deleteServicesByContractId(ss, contractId) {
  const servicesSheet = ss.getSheetByName(SHEET_NAMES.SERVICES);
  const lastRow = servicesSheet.getLastRow();
  if (lastRow < 2) return;

  const contractIdColumn = servicesSheet.getRange(2, COLS_SERVICES.CONTRACT_ID, lastRow - 1, 1).getValues();
  const rowsToDelete = [];
  for (let i = 0; i < contractIdColumn.length; i++) {
    if (contractIdColumn[i][0] == contractId) {
      rowsToDelete.push(i + 2);
    }
  }

  // Xóa từ dưới lên để tránh sai chỉ số
  for (let i = rowsToDelete.length - 1; i >= 0; i--) {
    servicesSheet.deleteRow(rowsToDelete[i]);
  }
}

/**
 * Cập nhật hoặc thêm mới một khách hàng.
 * @param {Spreadsheet} ss - Đối tượng Spreadsheet.
 * @param {object} clientInfo - Thông tin khách hàng.
 * @param {string} contractDate - Ngày của hợp đồng.
 */
function updateClient(ss, clientInfo, contractDate) {
  const clientsSheet = ss.getSheetByName(SHEET_NAMES.CLIENTS);
  const lastRow = clientsSheet.getLastRow();

  // Xử lý trường hợp sheet Clients trống hoặc chỉ có tiêu đề
  if (lastRow < 2) {
    // Đây là khách hàng đầu tiên, chỉ cần thêm vào
    const newClientRow = [
      clientInfo.phone, clientInfo.name, clientInfo.address,
      clientInfo.email, contractDate, contractDate
    ];
    clientsSheet.appendRow(newClientRow);
    return; // Kết thúc hàm
  }

  // Nếu có dữ liệu, tiến hành tìm kiếm
  const idColumnValues = clientsSheet.getRange(2, COLS_CLIENTS.ID, lastRow - 1, 1).getValues();
  let foundRowIndex = -1;

  for (let i = 0; i < idColumnValues.length; i++) {
    if (idColumnValues[i][0] == clientInfo.phone) {
      foundRowIndex = i + 2;
      break;
    }
  }

  if (foundRowIndex !== -1) {
    // Khách hàng đã tồn tại -> Cập nhật
    const clientRow = clientsSheet.getRange(foundRowIndex, 1, 1, 6);
    const clientData = clientRow.getValues()[0];
    clientData[COLS_CLIENTS.NAME - 1] = clientInfo.name;
    clientData[COLS_CLIENTS.ADDRESS - 1] = clientInfo.address;
    clientData[COLS_CLIENTS.EMAIL - 1] = clientInfo.email;
    clientData[COLS_CLIENTS.LAST_CONTRACT_DATE - 1] = contractDate; // Cập nhật ngày HĐ cuối
    clientRow.setValues([clientData]);
  } else {
    // Khách hàng mới -> Thêm mới
    const newClientRow = [
      clientInfo.phone,
      clientInfo.name,
      clientInfo.address,
      clientInfo.email,
      contractDate, // Ngày HĐ đầu tiên
      contractDate  // Ngày HĐ cuối cùng
    ];
    clientsSheet.appendRow(newClientRow);
  }
}

/**
 * Lấy tất cả hợp đồng từ sheet (chỉ lấy cột JSON để tối ưu).
 */
function getAllContracts() {
  const contractsSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAMES.CONTRACTS);
  const lastRow = contractsSheet.getLastRow();
  if (lastRow < 2) {
    return createJsonResponse({ status: 'success', records: [] });
  }
  
  const jsonColumnValues = contractsSheet.getRange(2, COLS_CONTRACT.FULL_JSON_DATA, lastRow - 1, 1).getValues();
  const records = jsonColumnValues.map(row => {
    try {
      return JSON.parse(row[0]);
    } catch (e) {
      writeLog(`JSON Parse Error at row: ${row[0]}`);
      return null;
    }
  }).filter(Boolean);
  
  writeLog(`Loaded ${records.length} records.`);
  return createJsonResponse({ status: 'success', records: records });
}

/**
 * Lấy và tăng số thanh lý tiếp theo từ sheet Config.
 */
function getNextLiquidationNumber() {
  const configSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAMES.CONFIG);
  const range = configSheet.getRange("B1");
  const currentNumber = range.getValue();
  const nextNumber = (typeof currentNumber === 'number' ? currentNumber : 0) + 1;
  range.setValue(nextNumber);
  
  writeLog(`Provided next liquidation number: ${nextNumber}`);
  return createJsonResponse({ status: 'success', nextLiquidationNumber: nextNumber });
}

/**
 * Tạo báo cáo tổng hợp từ sheet 'Contracts' và xuất ra file Excel (XLS).
 * Hàm này sẽ lấy các cột chính và tạo tiêu đề tiếng Việt.
 */
function exportSummaryReport() {
  const contractsSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAMES.CONTRACTS);
  const lastRow = contractsSheet.getLastRow();
  if (lastRow < 2) {
    return ContentService.createTextOutput("Không có dữ liệu để xuất báo cáo.").downloadAsFile("Report_Error.txt");
  }
  
  // Lấy dữ liệu từ sheet Contracts, không lấy cột JSON cuối cùng
  const range = contractsSheet.getRange(2, 1, lastRow - 1, Object.keys(COLS_CONTRACT).length - 1);
  const data = range.getDisplayValues(); // Dùng getDisplayValues để lấy giá trị đã định dạng

  // Tạo tiêu đề tiếng Việt cho file xuất ra
  const vietnameseHeaders = [
    "Mã Hợp Đồng", "Trạng Thái", "Mã Khách Hàng (SĐT)", "Ngày Hợp Đồng", "Số Hợp Đồng",
    "Ngày Thanh Lý", "Số Thanh Lý", "Khu Vực", "Tổng Tiền", "Đã Thanh Toán"
  ];

  // Tạo nội dung HTML cho file Excel
  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
    <x:Name>BaoCaoHopDong</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>
    </x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
    <body><table>
      <thead><tr>${vietnameseHeaders.map(h => `<th><b>${h}</b></th>`).join('')}</tr></thead>
      <tbody>
  `;

  data.forEach(row => {
    html += '<tr>';
    row.forEach(cell => {
      // Định dạng số dưới dạng text để Excel không làm hỏng ID hoặc số dài
      const cellValue = isNaN(cell) || cell.includes('/') || cell.includes('-') ? cell : `&apos;${cell}`;
      html += `<td>${cellValue || ''}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table></body></html>';

  const fileName = `BaoCaoTongHop_${new Date().toISOString().slice(0,10)}.xls`;
  return ContentService.createTextOutput(html)
    .setMimeType(ContentService.MimeType.MICROSOFT_EXCEL)
    .downloadAsFile(fileName);
}
