function generateContractHTML(data) {
    const formatDate = (dateString_ddmmyyyy) => { if (!dateString_ddmmyyyy || dateString_ddmmyyyy.split('/').length !== 3) { return { ngay: '......', thang: '......', nam: '......' }; } const parts = dateString_ddmmyyyy.split('/'); return { ngay: parts[0], thang: parts[1], nam: parts[2] }; };
    const contractDate = formatDate(data.contractInfo.date);
    const authText = AppConfig.REPRESENTATIVE_INFO.authorization.replace('{YEAR}', contractDate.nam);
    
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
    
    const mainTitleText = data.contractInfo.titleObject ? data.contractInfo.titleObject.line1 : 'Hợp đồng Dịch vụ';
    const locationText = data.contractInfo.titleObject ? data.contractInfo.titleObject.line2 : `Tại ${data.contractInfo.locationType || 'phường'} ${data.contractInfo.location}, tỉnh Đồng Nai`;

    return `<html><head><title>Hợp đồng đo đạc</title><link rel="stylesheet" href="../../print.css"></head>
        <body>
            <div class="header">
                <table class="header-table">
                    <tr>
                        <td style="width: 50%;">
                            <div class="bold">VĂN PHÒNG ĐĂNG KÝ ĐẤT ĐAI</div>
                            <div class="underline-container">
                                <div class="bold">TỈNH ĐỒNG NAI – CHI NHÁNH LONG KHÁNH</div>
                                <div class="underline-short"></div>
                            </div>
                            <div>Số: ${escapeHTML(data.contractInfo.fullNumber)}</div>
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
            <div class="main-title">HỢP ĐỒNG</div>
            <div class="sub-title">${escapeHTML(mainTitleText)}</div>
            <div class="location-title">${escapeHTML(locationText)}</div>
            <div class="content italic"> <p class="indent">- Căn cứ Quyết định số 17/2023/QĐ-UBND ngày 10/4/2023 về việc quy định phí đo đạc, lập bản đồ địa trên địa bàn tỉnh Đồng Nai;</p> <p class="indent">- Căn cứ Quyết định số 2625/QĐ-UBND ngày 28/7/2020 về việc tổ chức triển khai thực hiện Nghị Quyết số 15/2020 NQ-HĐND ngày 10/07/2020 quy định phí khai thác và sử dụng tài liệu đất đai trên địa bàn tỉnh Đồng Nai;</p> <p class="indent">- Căn cứ vào năng lực và nhu cầu của hai bên.</p> </div>
            <p class="italic">Hôm nay, ngày ${contractDate.ngay} tháng ${contractDate.thang} năm ${contractDate.nam}, tại Văn phòng Đăng ký đất đai tỉnh Đồng Nai chi nhánh Long Khánh, chúng tôi gồm có:</p>
            <div class="party-info">
                <p><strong class="bold"><u>Bên A:</u></strong></p>
                <p class="party-detail">- Ông (Bà): <strong class="bold">${escapeHTML(data.clientInfo.name)}</strong></p>
                <p class="party-detail">- Địa chỉ: ${escapeHTML(data.clientInfo.address)}</p>
                <p class="party-detail">- Số điện thoại: ${escapeHTML(data.clientInfo.phone)}</p>
                <br>
                <p><strong class="bold"><u>Bên B: VĂN PHÒNG ĐĂNG KÝ ĐẤT ĐAI TỈNH ĐỒNG NAI – CN LONG KHÁNH</strong></u></p>
                <p class="party-detail">- Đại diện: Ông <span class="bold">${escapeHTML(AppConfig.REPRESENTATIVE_INFO.name)}</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Chức vụ: ${escapeHTML(AppConfig.REPRESENTATIVE_INFO.position)}</p>
                <p class="party-detail italic">${escapeHTML(authText)}</p>
                <p class="party-detail">- Địa chỉ: Đường CMT8, phường Xuân An, thành phố Long Khánh, tỉnh Đồng Nai</p>
                <p class="party-detail">- Điện thoại: 0251.3877249</p>
                <p class="party-detail">- Tài khoản số: 0121000677979 ngân hàng Vietcombank Đồng Nai- Phòng giao dịch Long Khánh - Mã số thuế: 3600727427-004</p>
            </div>
            <div class="content"> <p class="bold indent">Điều 1: Bên B nhận thực hiện khối lượng công việc và giá trị công trình tạm tính như sau:</p> </div>
            <table class="cost-table"> <thead> <tr> <th>Số TT</th> <th>Nội dung công việc</th> <th>ĐVT</th> <th>K. lượng</th> <th>Đơn giá (đồng)</th> <th>Thành tiền (đồng)</th> </tr> </thead> <tbody> ${rowsHTML} </tbody> </table>
            <p class="amount-in-words" style="text-align: center;" class="italic bold">(Bằng chữ: ${numberToWords(data.grandTotal)})</p>
            <p class="italic">* Tổng giá trị công trình sẽ được thanh toán theo khối lượng thực tế đã thực hiện bằng biên bản thanh lý hợp đồng.</p>
            <div class="page-break"></div>
            <div class="page-2-content">
                <div class="content"> <p class="bold indent">Điều 2. Trách nhiệm của hai bên:</p> <p class="bold">Bên A:</p> <p class="indent">- Thống nhất thời gian, địa điểm để bên B triển khai thực hiện;</p> <p class="indent">- Xác định mốc ranh giới thửa đất (khu đất) tại thực địa thể hiện bằng cọc sắt, cọc bê tông hoặc vạch sơn, Chỉ dẫn mốc ranh giới thửa đất (khu đất) cần đo vẽ và chịu trách nhiệm về việc chỉ dẫn, xác định ranh giới thửa đất (khu đất);</p> <p class="indent">- Có trách nhiệm thông báo cho địa phương về kế hoạch đo đạc thửa đất (khu đất), liên hệ với địa phương để phối hợp trong quá trình đo đạc tại thực địa;</p> <p class="indent">- Chịu trách nhiệm trong việc thỏa thuận ranh giới thửa đất (khu đất) với các chủ sử dụng đất liền kề để ký xác nhận bản mô tả ranh giới, mốc giới thửa đất;</p> <p class="indent">- Liên hệ UBND xã (phường, thị trấn) để ký xác nhận bản mô tả ranh giới, mốc giới thửa đất;</p> <p class="indent">- Trong trường hợp có sự tranh chấp về ranh giới thửa đất hoặc không thỏa thuận được ranh giới thửa đất với chủ sử dụng đất liền kề trong thời gian thực hiện hợp đồng đo đạc dịch vụ thì thông báo cho Văn phòng Đăng ký đất đai tỉnh Đồng Nai để tạm ngưng hoặc hủy hợp đồng đo đạc dịch vụ đã ký kết;</p> <p class="indent">- Trường hợp ranh giới, diện tích thửa đất đang sử dụng có thay đổi so với các tài liệu pháp lý liên quan (Giấy chứng nhận quyền sử dụng đất, bản vẽ có chữ ký và đóng dấu của cơ quan quản lý nhà nước về đất đai, bản án của Tòa án về giải quyết tranh chấp đất đai hoặc biên bản giải quyết của cơ quan có thẩm quyền trong việc giải quyết tranh chấp đất đai, ...) thì nêu rõ nguyên nhân để ghi vào phiếu xác nhận kết quả đo đạc cũng như bản mô tả ranh giới, mốc giới thửa đất và chịu trách nhiệm về sự thay đổi đó;</p> <p class="indent">- Thanh toán chi phí cho bên B theo điều 4 hợp đồng.</p> <p class="bold">Bên B:</p> <p class="indent">- Bên B có trách nhiệm đo chỉnh lý thửa đất đúng theo sự chỉ dẫn ranh giới thửa đất của bên A;</p> <p class="indent">- Xuất phiếu xác nhận kết quả đo đạc cho Bên A biết để ký xác nhận;</p> <p class="indent">- Vẽ bản mô tả ranh giới, mốc giới thửa đất giao cho Bên A đi ký xác nhận ranh giới với các chủ sử dụng đất liền kề và xác nhận của UBND xã (phường, thị trấn);</p> <p class="indent">- Đảm bảo độ chính xác về kết quả đo vẽ theo yêu cầu kỹ thuật.</p> <p class="bold indent">Điều 3. Thời gian triển khai và bàn giao hồ sơ:</p> <p class="indent">- Thời gian triển khai: Trong thời hạn 3 ngày làm việc kể từ ngày ký hợp đồng (thời gian cụ thể do hai bên thống nhất ).</p> <p class="indent">- Ngày hoàn thành, bàn giao sản phẩm: Sau 10 ngày làm việc (không tính ngày lễ, chủ nhật) kể từ ngày hợp đồng được triển khai thực hiện;</p><p class="indent">- Trường hợp bên A cung cấp tài liệu nhiều lần thì thời gian thực hiện phải tính từ ngày bàn giao tài liệu cuối cùng.</p>
                <p class="indent">- Hồ sơ bàn giao gồm: ${data.photoData.quantity} bản vẽ.</p> 
                <p class="bold indent">Điều 4. Thời hạn và phương thức thanh toán:</p> <p class="indent">Bên A thanh toán cho bên B bằng tiền mặt hoặc chuyển khoản:</p><p class="indent">- Đợt 1: Thanh toán ${formatCurrency(data.grandTotal)} ngay sau ký hợp đồng - PT:</p><p class="indent">- Đợt 2: Thanh lý hợp đồng, bàn giao sản phẩm.</p> 
                <p class="bold indent">Điều 5. Điều khoản chung:</p> <p class="indent">Hai bên cam kết thực hiện các nội dung đã thỏa thuận trong hợp đồng:</p> <p class="indent">- Trường hợp khi đo lần 1 không thực hiện được không phải lỗi bên B, nếu đi đo thêm các lần tiếp theo thì bên A phải thanh toán thêm chi phí phát sinh;</p> <p class="indent">- Trường hợp quá thời hạn 60 ngày kể từ ngày ký hợp đồng mà hợp đồng không thực hiện được do lỗi của bên A như: không cung cấp được tài liệu bổ sung (nếu có), không giải quyết được tranh chấp, khiếu nại liên quan đến thửa đất, khu đất (nếu có) thì bên B có quyền đơn phương chấm dứt hợp đồng;</p><p class="indent">Bên A phải thanh toán cho bên B các chi phí mà bên B đã thực hiện;</p><p class="indent">- Mọi vướng mắc trong hợp đồng (nếu có) sẽ được hai bên cùng thỏa thuận giải quyết, nếu không thỏa thuận được thì tranh chấp sẽ do Tòa án quyết định;</p><p class="indent">Hợp đồng này được lập thành 03 bản, bên A giữ 01 bản, bên B giữ 02 bản có giá trị như nhau./.</p> </div>
                <div class="footer"> <table class="footer-table"> <tr> <td style="width: 50%;"><strong>ĐẠI DIỆN BÊN A</strong><br><span style="font-weight: normal;" class="italic">(Ký, ghi rõ họ tên)</span></td> <td style="width: 50%;"><strong>ĐẠI DIỆN BÊN B</strong><br><span style="font-weight: normal;" class="italic">(Ký, ghi rõ họ tên)</span></td> </tr> <tr><td colspan="2" style="height: 60px;"></td></tr> <tr> <td><strong class="bold">${escapeHTML(data.clientInfo.name)}</strong></td> <td><strong class="bold">${escapeHTML(AppConfig.REPRESENTATIVE_INFO.name)}</strong></td> </tr> </table> </div>
            </div>
        </body></html>`;
}
