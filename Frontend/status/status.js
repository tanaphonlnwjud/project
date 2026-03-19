const checkStatus = async () => {

    const email = document.getElementById("email").value.trim().toLowerCase();
    if (!email) {
        alert("กรุณากรอกอีเมล");
        return;
    }

    const resultDOM = document.getElementById("result")
    try {

        const response = await axios.get(`http://localhost:8000/reservations?email=${email}`);

        const data = response.data

        console.log(data);

        if (data.length === 0) {

            resultDOM.innerHTML = "<p>ไม่พบข้อมูลการจอง</p>"
            return

        }

        let html = ""

        data.forEach(item => {
            const date = new Date(item.date)
            const formattedDate = date.toLocaleDateString("th-TH", {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const statusThai = item.status === 'confirm' ? 'ยืนยันแล้ว' :
                item.status === 'reject' ? 'ถูกปฏิเสธ' : 'รอการตรวจสอบ';
            html += `

                <div class="result-card">
                        <p><b>ชื่อ:</b> ${item.firstname}</p>
                        <p><b>จำนวนคน:</b> ${item.size}</p>
                        <p><b>วันที่:</b> ${formattedDate}</p>
                        <p><b>เวลา:</b> ${item.time.slice(0, 5)}</p>
                        <p><b>สถานะ:</b> 
                            <span class="status ${item.status}">
                                ${statusThai}
                            </span>
                        </p>

                </div>`;

        });

        resultDOM.innerHTML = html

    } catch (error) {
        console.error(error);
        resultDOM.innerHTML = "เกิดข้อผิดพลาด"

    }

};