function generateLiquidationHTML(data) {
    const formatDate = (dateString_ddmmyyyy) => { if (!dateString_ddmmyyyy || dateString_ddmmyyyy.split('/').length !== 3) { return { ngay: '......', thang: '......', nam: '......' }; } const parts = dateString_ddmmyyyy.split('/'); return { ngay: parts[0], thang: parts[1], nam: parts[2] }; };
    const liquidationDate = formatDate(data.contractInfo.liquidationDate);
    const contractDate = formatDate(data.contractInfo.date);
    const authText = AppConfig.REPRESENTATIVE_INFO.authorization.replace('{YEAR}', liquidationDate.nam);

    let rowsHTML = `<tr> <td class="bold">I</td> <td class="bold">Tổng chi phí thực hiện</td> <td></td><td></td><td></td> <td class="bold currency">${formatCurrency(data.totalSection1)}</td> </tr>`;
    let serviceCounter = 1;
    data.allOptionalItems.forEach(parcel => {
        parcel.services.forEach(service => {
            const unitText = service.unit === 'm²' ? 'm<sup>2</sup>' : service.unit;
            // *** THAY ĐỔI QUAN TRỌNG: Thêm logic mặc định cho locationType ***
            const locationType = data.contractInfo.locationType || 'phường';
            const description = service.type === 'area_based'
                ? `${escapeHTML(service.name)} (Tờ ${escapeHTML(parcel.mapSheet)}, Thửa ${escapeHTML(parcel.parcelNo)}, Dt ${parcel.area} m², tại ${locationType} ${escapeHTML(parcel.address)})`
                : `${escapeHTML(service.name)} (Tờ ${escapeHTML(parcel.mapSheet)}, Thửa ${escapeHTML(parcel.parcelNo)}, tại ${locationType} ${escapeHTML(parcel.address)})`;
            rowsHTML += `<tr> <td>${serviceCounter++}</td> <td>${description}</td> <td>${unitText}</td> <td>${service.quantity}</td> <td class="currency">${formatCurrency(service.unitPrice)}</td> <td class="currency">${formatCurrency(service.cost)}</td> </tr>`;
        });
    });
    rowsHTML += `<tr> <td class="bold">II</td> <td class="bold">Phôtô</td> <td>${data.photoData.unit}</td> <td>${data.photoData.quantity}</td> <td class="currency">${formatCurrency(data.photoData.price)}</td> <td class="bold currency">${formatCurrency(data.photoData.cost)}</td> </tr>`;
    rowsHTML += `<tr> <td colspan="5" class="bold align-right">Cộng (I+II)</td> <td class="bold currency">${formatCurrency(data.totalBeforeVat)}</td> </tr>`;
    rowsHTML += `<tr> <td colspan="5" class="bold align-right">Thuế GTGT ${data.vatRateValue}%</td> <td class="bold currency">${formatCurrency(data.vatAmount)}</td> </tr>`;
    rowsHTML += `<tr> <td class="bold">III</td> <td class="bold">Khai thác thông tin</td> <td>${data.infoData.unit}</td> <td>${data.infoData.quantity}</td> <td class="currency">${formatCurrency(data.infoData.price)}</td> <td class="bold currency">${formatCurrency(data.infoData.cost)}</td> </tr>`;
    rowsHTML += `<tr> <td colspan="5" class="bold align-right total-row">Tổng cộng</td> <td class="bold currency total-row">${formatCurrency(data.grandTotal)}</td> </tr>`;
    
    return `<html><head><title>Biên bản thanh lý hợp đồng</title><link rel="stylesheet" href="../../print.css"></head><body>
            <div class="header">
                <table class="header-table">
                    <tr>
                        <td style="width: 50%;">
                            <div class="bold">VĂN PHÒNG ĐĂNG KÝ ĐẤT ĐAI</div>
                            <div class="underline-container">
                                <div class="bold">TỈNH ĐỒNG NAI – CHI NHÁNH LONG KHÁNH</div>
                                <div class="underline-short"></div>
                            </div>
                            <div>Số: ${escapeHTML(data.contractInfo.fullLiquidationNumber)}</div>
                        </td>
                        <td style="width: 50%;">
                            <div class="bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT&nbsp;NAM</div>
                            <div class="underline-container">
                                <div class="bold">Độc lập - Tự do - Hạnh phúc</div>
                                <div class="underline-short"></div>
                            </div>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="main-title">BIÊN BẢN THANH LÝ HỢP ĐỒNG</div>
            <div class="content"> <p>Căn cứ vào hợp đồng đã ký số ${escapeHTML(data.contractInfo.fullNumber)} ngày ${contractDate.ngay} tháng ${contractDate.thang} năm ${contractDate.nam}</p> <p>Hôm nay, ngày ${liquidationDate.ngay} tháng ${liquidationDate.thang} năm ${liquidationDate.nam}, chúng tôi gồm:</p> </div> <div class="parties"> <table class="parties-table"> <tr><td colspan="2"><strong class="bold"><u>Bên A:</u></strong></td></tr> <tr><td style="width: 90px;">Ông (Bà):</td><td><strong class="bold">${escapeHTML(data.clientInfo.name)}</strong></td></tr> <tr><td>Địa chỉ:</td><td>${escapeHTML(data.clientInfo.address)}</td></tr> <tr><td colspan="2" style="height: 10px;"></td></tr> <tr><td colspan="2"><strong class="bold"><u>Bên B: VĂN PHÒNG ĐĂNG KÝ ĐẤT ĐAI TỈNH ĐỒNG NAI – CN LONG KHÁNH</strong></u></td></tr> <tr><td>Đại diện:</td><td>Ông <span class="bold">${escapeHTML(AppConfig.REPRESENTATIVE_INFO.name)}</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Chức vụ: ${escapeHTML(AppConfig.REPRESENTATIVE_INFO.position)}</td></tr> <tr> <td colspan="2" class="italic">${escapeHTML(authText)}</td> </tr> <tr><td>Địa chỉ:</td><td>Đường CMT8, phường Xuân An, thành phố Long Khánh, tỉnh Đồng Nai</td></tr> <tr><td>Điện thoại:</td><td>0251.3877249</td></tr> <tr><td>Tài khoản số:</td><td>0121000677979 tại Ngân hàng Vietcombank Đồng Nai- PGD Long Khánh</td></tr> <tr><td>Mã số thuế:</td><td>3600727427-004</td></tr> </table> </div> <div class="content"> <p>Bên B đã thực hiện khối lượng và giá trị công trình theo các hạng mục sau:</p> </div> <table class="cost-table"> <thead> <tr> <th>Số TT</th> <th>Nội dung công việc</th> <th>ĐVT</th> <th>K. lượng</th> <th>Đơn giá (đồng)</th> <th>Thành tiền (đồng)</th> </tr> </thead> <tbody> ${rowsHTML} </tbody> </table> <p class="amount-in-words" style="text-align: center;" class="italic bold">(Bằng chữ: ${numberToWords(data.grandTotal)})</p> 
            <div class="content"> 
                <p><strong><u>Tài liệu bàn giao:</u></strong> ${data.photoData.quantity} Bản vẽ thửa đất.</p> 
                <p><strong><u>Thanh toán:</u></strong></p> 
                <p>- Bên A đã thanh toán cho bên B số tiền là: ${formatCurrency(data.amountPaid)}</p> 
                <p>- Bên A còn phải thanh toán cho bên B số tiền là: ${formatCurrency(data.amountOwed)}</p> 
                <p>- Bên B phải trả lại số tiền thừa cho bên A là: ${formatCurrency(data.refundAmount)}</p> 
                <div class="page-break"></div>
                <p><strong><u>Kết luận:</u></strong></p> 
                <p>Hai bên cùng thống nhất nghiệm thu, thanh lý hợp đồng và bàn giao tài liệu tại Văn phòng Đăng ký đất đai tỉnh Đồng Nai – chi nhánh Long Khánh.</p> 
                <p>Biên bản này được lập thành 03 bản, bên A giữ 01 bản, bên B giữ 02 bản có giá trị như nhau./.</p> 
            </div> 
            <div class="footer"> 
                <table class="footer-table"> 
                    <tr> 
                        <td style="width: 50%;"><strong>ĐẠI DIỆN BÊN A</strong><br><span style="font-weight: normal;" class="italic">(Ký, ghi rõ họ tên)</span></td> 
                        <td style="width: 50%;"><strong>ĐẠI DIỆN BÊN B</strong><br><span style="font-weight: normal;" class="italic">(Ký, ghi rõ họ tên)</span></td> 
                    </tr> 
                    <tr><td colspan="2" style="height: 60px;"></td></tr> 
                    <tr> 
                        <td><strong class="bold">${escapeHTML(data.clientInfo.name)}</strong></td> 
                        <td><strong class="bold">${escapeHTML(AppConfig.REPRESENTATIVE_INFO.name)}</strong></td> 
                    </tr> 
                </table> 
            </div>
        </body></html>`;
}
