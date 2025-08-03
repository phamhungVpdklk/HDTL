// template-appointment.js
function generateAppointmentSlipHTML(data) {
    // --- HÀM HỖ TRỢ ---
    const formatDate = (dateString_ddmmyyyy) => {
        if (!dateString_ddmmyyyy || dateString_ddmmyyyy.split('/').length !== 3) {
            return { ngay: '......', thang: '......', nam: '......' };
        }
        const parts = dateString_ddmmyyyy.split('/');
        return { ngay: parts[0], thang: parts[1], nam: parts[2] };
    };

    const addWeekdays = (startDate, days) => {
        let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        let daysAdded = 0;
        while (daysAdded < days) {
            currentDate.setDate(currentDate.getDate() + 1);
            if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
                daysAdded++;
            }
        }
        return currentDate;
    };
    
    const slipContent = (copyNumber) => {
        const { ngay, thang, nam } = formatDate(data.contractInfo.date);
        const jsDate = new Date(parseInt(nam), parseInt(thang) - 1, parseInt(ngay));
        const appointmentDate = addWeekdays(jsDate, 3);
        const dd = String(appointmentDate.getDate()).padStart(2,'0');
        const mm = String(appointmentDate.getMonth()+1).padStart(2,'0');
        const yyyy = appointmentDate.getFullYear();
        
        // Lấy khu vực làm việc từ thông tin hợp đồng
        const location = data.contractInfo.location;

        return `
            <div class="slip">
                <h2>GIẤY HẸN LÀM VIỆC (Bản ${copyNumber})</h2>
                <p><b>Ngày hẹn:</b> ${dd}/${mm}/${yyyy}</p>
                <p><b>Khách hàng:</b> ${data.clientInfo.name}</p>
                <p><b>Địa chỉ khách hàng:</b> ${data.clientInfo.address}</p>
                <p><b>Địa điểm công việc:</b> ${location}</p>
                <p><b>Nội dung:</b> Đo đạc tại thực địa.</p>
            </div>
        `;
    };

    return `
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Giấy hẹn</title>
            <style>
                body { font-family: 'Times New Roman', serif; font-size: 13pt; }
                .slip { 
                    page-break-after: always; 
                    padding: 20px; 
                    border: 1px solid #ccc; 
                    margin: 20px;
                    height: 40vh;
                }
                h2 { text-align: center; }
            </style>
        </head>
        <body>
            ${slipContent(1)}
            ${slipContent(2)}
        </body>
        </html>
    `;
}