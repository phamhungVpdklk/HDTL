// utils.js

/**
 * Formats a number as Vietnamese currency (VND).
 * @param {number} amount The number to format.
 * @returns {string} A string representing the amount in VND.
 */
function formatCurrency(amount) {
    if (typeof amount !== 'number') {
        amount = 0;
    }
    return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}

/**
 * Converts a number to its equivalent in Vietnamese words.
 * @param {number} n The number to convert.
 * @returns {string} The number in Vietnamese words, followed by "đồng".
 */
function numberToWords(n) {
    if (n === 0) return 'Không đồng';

    const units = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
    const teens = ["mười", "mười một", "mười hai", "mười ba", "mười bốn", "mười lăm", "mười sáu", "mười bảy", "mười tám", "mười chín"];
    const tens = ["", "mười", "hai mươi", "ba mươi", "bốn mươi", "năm mươi", "sáu mươi", "bảy mươi", "tám mươi", "chín mươi"];
    const powers = ["", "nghìn", "triệu", "tỷ"];

    function convertChunk(num) {
        if (num === 0) return "";
        let result = "";
        const hundred = Math.floor(num / 100);
        const rest = num % 100;

        if (hundred > 0) {
            result += units[hundred] + " trăm ";
        }

        if (rest > 0) {
            if (rest < 10) {
                if(hundred > 0) result += "linh ";
                result += units[rest];
            } else if (rest < 20) {
                result += teens[rest - 10];
            } else {
                const ten = Math.floor(rest / 10);
                const unit = rest % 10;
                result += tens[ten];
                if (unit > 0) {
                    let unitWord = units[unit];
                    if (unit === 1 && ten > 1) unitWord = "mốt";
                    if (unit === 5) unitWord = "lăm";
                    result += " " + unitWord;
                }
            }
        }
        return result.trim();
    }

    if (n < 0) return "Âm " + numberToWords(Math.abs(n));
    
    let parts = [];
    let powerIndex = 0;
    
    while (n > 0) {
        let chunk = n % 1000;
        if (chunk > 0) {
            let chunkStr = convertChunk(chunk);
            if (powerIndex > 0) {
                 chunkStr += " " + powers[powerIndex];
            }
            parts.unshift(chunkStr);
        }
        n = Math.floor(n / 1000);
        powerIndex++;
    }

    let finalResult = parts.join(' ');
    // Capitalize the first letter and add "đồng" at the end.
    return finalResult.charAt(0).toUpperCase() + finalResult.slice(1) + " đồng";
}