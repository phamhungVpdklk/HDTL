function generateSimpleContractHTML(data) {
    const formatDate = (dateString_ddmmyyyy) => { if (!dateString_ddmmyyyy || dateString_ddmmyyyy.split('/').length !== 3) { return { ngay: '......', thang: '......', nam: '......' }; } const parts = dateString_ddmmyyyy.split('/'); return { ngay: parts[0], thang: parts[1], nam: parts[2] }; };
    const contractDate = formatDate(data.contractInfo.date);
    const firstParcel = data.allOptionalItems[0] || { mapSheet: '...', parcelNo: '...' };

    let rowsHTML = `<tr> <td class="bold">I</td> <td class="bold">Tổng chi phí thực hiện</td> <td></td><td></td><td></td> <td class="bold currency">${formatCurrency(data.totalSection1)}</td> </tr>`;
    let serviceCounter = 1;
    data.allOptionalItems.forEach(parcel => {
        parcel.services.forEach(service => {
            // THAY ĐỔI: Bỏ phần hiển thị địa chỉ khỏi mô tả
            const description = `Biên vẽ thửa ${parcel.parcelNo} tờ số ${parcel.mapSheet}`;
            rowsHTML += `<tr> <td>${serviceCounter++}</td> <td>${description}</td> <td>Thửa</td> <td>${service.quantity}</td> <td class="currency">${formatCurrency(service.unitPrice)}</td> <td class="currency">${formatCurrency(service.cost)}</td> </tr>`;
        });
    });
    rowsHTML += `<tr> <td class="bold">II</td> <td class="bold">Photo bản đồ</td> <td>${data.photoData.unit}</td> <td>${data.photoData.quantity}</td> <td class="currency">${formatCurrency(data.photoData.price)}</td> <td class="bold currency">${formatCurrency(data.photoData.cost)}</td> </tr>`;
    rowsHTML += `<tr> <td colspan="5" class="bold align-right">Cộng (I+II)</td> <td class="bold currency">${formatCurrency(data.totalBeforeVat)}</td> </tr>`;
    rowsHTML += `<tr> <td colspan="5" class="bold align-right">Thuế GTGT ${data.vatRateValue}%</td> <td class="bold currency">${formatCurrency(data.vatAmount)}</td> </tr>`;
    rowsHTML += `<tr> <td class="bold">III</td> <td class="bold">Khai thác thông tin</td> <td>${data.infoData.unit}</td> <td>${data.infoData.quantity}</td> <td class="currency">${formatCurrency(data.infoData.price)}</td> <td class="bold currency">${formatCurrency(data.infoData.cost)}</td> </tr>`;
    rowsHTML += `<tr> <td colspan="5" class="bold align-right total-row">Tổng cộng</td> <td class="bold currency total-row">${formatCurrency(data.grandTotal)}</td> </tr>`;
    
    return `<html><head><title>Hợp đồng Biên Vẽ</title><style>
            @page {
                size: A4 portrait;
                margin-left: 1.5cm;
                margin-top: 1cm;
                margin-right: 1cm;
                margin-bottom: 1cm;
            }
            body { font-family: 'Times', serif; font-size: 13pt; line-height: 1.0; color: #000; }
            .bold { font-weight: bold; } .italic { font-style: italic; }
            .header-table { width: 100%; border-collapse: collapse; }
            .header-table td { width: 50%; vertical-align: top; text-align: center; }
            .main-title { font-size: 14pt; font-weight: bold; text-align: center; margin-top: 10px; }
            .sub-title { font-size: 13pt; font-weight: bold; text-align: center; margin-bottom: 10px; }
            .content p { margin: 5px 0; text-align: justify; }
            .content .indent { text-indent: 25px; }
            .party-info { margin-top: 10px; margin-bottom: 10px; }
            .party-info p { margin: 2px 0; }
            .party-detail { padding-left: 20px; }
            .cost-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            .cost-table th, .cost-table td { border: 1px solid #333; padding: 4px; text-align: left; }
            .cost-table th { text-align: center; font-weight: bold; }
            .cost-table td:nth-child(1), .cost-table td:nth-child(3), .cost-table td:nth-child(4) { text-align: center; }
            .currency { text-align: right !important; }
            .align-right { text-align: right; }
            .footer-table { width: 100%; border: none; margin-top: 25px; }
            .footer-table td { text-align: center; font-weight: bold; width: 50%; }
            .page-break { page-break-before: always; }
        </style></head>
        <body>
            <table class="header-table">
                <tr>
                    <td><span class="bold">VĂN PHÒNG ĐĂNG KÝ ĐẤT ĐAI</span><br><span class="bold">TỈNH ĐỒNG NAI CHI NHÁNH LONG KHÁNH</span></td>
                    <td><span class="bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span><br><span class="bold">Độc lập - Tự do - Hạnh phúc</span></td>
                </tr>
                <tr>
                    <td>Số: ${data.contractInfo.fullNumber}</td>
                    <td></td>
                </tr>
            </table>
            <div class="main-title">HỢP ĐỒNG</div>
            <div class="sub-title">Biên vẽ BĐĐC thửa đất tại ${firstParcel.address}</div>
            
            <div class="content italic">
                <p class="indent">Căn cứ Quyết định số 17/2023/QĐ-UBND ngày 10/4/2023 về việc quy định phí đo đạc, lập bản đồ địa trên địa bàn tỉnh Đồng Nai;</p>
                <p class="indent">Căn cứ Quyết định số 2625/QĐ-UBND ngày 28/7/2020 về việc tổ chức triển khai thực hiện Nghị Quyết số 15/2020 NQ-HĐND ngày 10/07/2020 quy định phí khai thác và sử dụng tài liệu đất đai trên địa bàn tỉnh Đồng Nai</p>
                <p class="indent">Căn cứ vào năng lực và nhu cầu của hai bên.</p>
            </div>

            <p class="italic">Hôm nay, ngày ${contractDate.ngay} tháng ${contractDate.thang} năm ${contractDate.nam}, tại Văn phòng Đăng ký đất đai tỉnh Đồng Nai chi nhánh Long Khánh, chúng tôi gồm có:</p>
            
            <div class="party-info">
                <p><b class="bold">Bên A:</b></p>
                <p class="party-detail">- Ông (bà): <b class="bold">${data.clientInfo.name}</b> - người yêu cầu biên vẽ</p>
                <p class="party-detail">- Địa chỉ: ${data.clientInfo.address}</p>
                <p class="party-detail">- Điện thoại: ${data.clientInfo.phone}</p>
                <br>
                <p><b class="bold">Bên B: Văn phòng Đăng ký đất đai tỉnh Đồng Nai – CN Long Khánh</b></p>
                <p class="party-detail">- Ông: <b class="bold">Phạm Văn Hải</b> – Chức vụ: Phó Giám đốc</p>
                <p class="party-detail italic">(Theo ủy quyền số ......../GUQ.VPĐK-CNLK ngày ..../..../${contractDate.nam} của Giám đốc Văn phòng Đăng ký đất đai tỉnh Đồng Nai- chi nhánh Long Khánh)</p>
                <p class="party-detail">- Địa chỉ: Đường CMT 8, phường Xuân Hòa, thành phố Long Khánh, tỉnh Đồng Nai.</p>
                <p class="party-detail">- Điện thoại: 0251.2213299 - Fax 061.3894322</p>
                <p class="party-detail">- Tài khoản số: 0121000677979 ngân hàng Vietcombank Đồng Nai- Phòng giao dịch Long Khánh</p>
                <p class="party-detail">- Mã số thuế: 3600727427-004</p>
            </div>

            <div class="content">
                <p>Hai bên thỏa thuận ký kết hợp đồng với các điều khoản sau:</p>
                <p class="bold">Điều 1: Bên B nhận thực hiện khối lượng công việc và giá trị công trình tạm tính như sau:</p>
                <table class="cost-table"> <thead> <tr> <th>Số TT</th> <th>Nội dung công việc</th> <th>ĐVT</th> <th>K. lượng</th> <th>Đơn giá (đồng)</th> <th>Thành tiền (đồng)</th> </tr> </thead> <tbody> ${rowsHTML} </tbody> </table>
                <p class="italic" style="text-align:center;">(Bằng chữ: ${numberToWords(data.grandTotal)})</p>
                <p class="italic">* Tổng giá trị công trình sẽ được thanh toán theo khối lượng thực tế và theo Phiếu yêu cầu đính kèm Hợp đồng này, thực hiện bằng biên bản thanh lý hợp đồng.</p>
                
                <div class="page-break"></div>

                <p class="bold">Điều 2. Trách nhiệm của hai bên:</p>
                <p class="bold">Bên A:</p>
                <p class="indent">- Bàn giao tài liệu liên quan đến thửa đất trước khi ký hợp đồng;</p>
                <p class="indent">- Cử người có trách nhiệm cùng phối hợp thường xuyên với bên B trong quá trình thực hiện hợp đồng;</p>
                <p class="indent">- Thanh toán chi phí cho bên B theo điều 4 của hợp đồng;</p>
                <p class="bold">Bên B:</p>
                <p class="indent">- Bên B có trách nhiệm biên vẽ bản đồ địa chính khu đất (thửa đất);</p>
                <p class="indent">- Xuất hồ sơ kỹ thuật thửa đất (nếu có);</p>
                <p class="indent">- Đảm bảo các yêu cầu kỹ thuật.</p>
                <p class="bold">Điều 3. Thời gian triển khai và bàn giao hồ sơ:</p>
                <p class="indent">- Ngày triển khai thực hiện hợp đồng sẽ chính thức bắt đầu từ ngày bên A cung cấp đủ tài liệu liên quan đến việc thực hiện hợp đồng, thanh toán tiền đợt 1 cho bên B. Hợp đồng này có hiệu lực kể từ ngày được hai bên ký.</p>
                <p class="indent">- Ngày hoàn thành, bàn giao sản phẩm: Sau 03 ngày làm việc (không tính ngày lễ, chủ nhật) kể từ ngày hợp đồng được triển khai thực hiện;</p>
                <p class="indent">- Trường hợp bên A cung cấp tài liệu nhiều lần thì thời gian thực hiện phải tính từ ngày bàn giao tài liệu cuối cùng.</p>
                <p class="indent">- Hồ sơ bàn giao gồm: ${data.photoData.quantity} tờ A3.</p>
                <p class="bold">Điều 4. Thời hạn và phương thức thanh toán:</p>
                <p class="indent">Bên A thanh toán cho bên B bằng tiền mặt hoặc chuyển khoản:</p>
                <p class="indent">- Đợt 1: 100% ngay sau ký hợp đồng</p>
                <p class="indent">- Đợt 2: Thanh lý hợp đồng, bàn giao sản phẩm.</p>
                <p class="bold">Điều 5. Điều khoản chung:</p>
                <p class="indent">Hai bên cam kết thực hiện các nội dung đã thỏa thuận trong hợp đồng</p>
                <p class="indent">- Trong quá trình biên vẽ nếu phát hiện sự khác nhau giữa các hồ sơ liên quan, bên A cùng bên B kiểm tra thực địa, nếu diện tích và ranh giới thay đổi bên B sẽ thực địa trích đo BĐĐC và tính theo đơn giá đo vẽ khi thanh lý hợp đồng;</p>
                <p class="indent">- Trường hợp do thay đổi nội dung hợp đồng hoặc có vấn đề khác phát sinh trong quá trình thực hiện hợp đồng thì hai bên cùng bàn bạc thỏa thuận và thể hiện bằng văn bản;</p>
                <p class="indent">- Trường hợp quá thời hạn 60 ngày kể từ ngày ký hợp đồng mà hợp đồng không thực hiện được do lỗi của bên A như: không cung cấp được tài liệu bổ sung (nếu có) thì bên B có quyền đơn phương chấm dứt hợp đồng;</p>
                <p class="indent">- Mọi vướng mắc trong hợp đồng (nếu có) sẽ được hai bên cùng thỏa thuận giải quyết, nếu không thỏa thuận được thì tranh chấp sẽ do Tòa án quyết định;</p>
                <p class="indent">Hợp đồng này được lập thành 03 bản, bên A giữ 01 bản, bên B giữ 02 bản có giá trị như nhau./.</p>
            </div>
            <table class="footer-table">
                <tr><td colspan="2" style="height: 20px;"></td></tr>
                <tr><td><b class="bold">ĐẠI DIỆN BÊN A</b></td><td><b class="bold">ĐẠI DIỆN BÊN B</b></td></tr>
                <tr><td colspan="2" style="height: 60px;"></td></tr>
                <tr><td><b class="bold">${data.clientInfo.name}</b></td><td><b class="bold">Phạm Văn Hải</b></td></tr>
            </table>
        </body></html>`;
}