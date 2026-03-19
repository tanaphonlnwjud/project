let selectedTime = "";
document.querySelectorAll(".time-btn").forEach(btn => {
    btn.addEventListener("click", () => {

        document.querySelectorAll(".time-btn").forEach(b => b.classList.remove("active"));

        btn.classList.add("active");

        selectedTime = btn.dataset.time;
    });
});

const vaildateData = (userData) => {
    let errors = [];
    if (!userData.email) {
        errors.push("กรุณากรอกอีเมล")
    }
    if (userData.email && !userData.email.endsWith("@gmail.com")) {
        errors.push("กรุณากรอกอีเมลเป็น @gmail.com");
    }
    if (!userData.firstname) {
        errors.push("กรุณากรอกชื่อ");
    }
    if (!userData.lastname) {
        errors.push("กรุณากรอกนามสกุล");
    }
    if (!userData.time) {
        errors.push("กรุณาเลือกเวลา");
    }
    if (!userData.size) {
        errors.push("กรุณาใส่จำนวนคน");
    }
    if (!userData.date) {
        errors.push("กรุณาเลือกวันที่");
    }
    if (!selectedTime) {
        alert("กรุณาเลือกเวลา");
        return;
    }
    return errors;
}

const submitData = async () => {
    let emailDOM = document.querySelector("input[name='email']");
    let firstnameDOM = document.querySelector("input[name='firstname']");
    let lastnameDOM = document.querySelector("input[name='lastname']");
    let sizeDOM = document.querySelector("input[name='size']");
    let dateDOM = document.querySelector("input[name='date']");
    let descriptionDOM = document.querySelector("textarea[name='description']");

    let messageDOM = document.getElementById('message');

    try {

        let userData = {
            email: emailDOM.value,
            firstname: firstnameDOM.value,
            lastname: lastnameDOM.value,
            size: sizeDOM.value,
            date: dateDOM.value,
            time: selectedTime,
            description: descriptionDOM.value
        }

        console.log('submitData', userData);

        const errors = vaildateData(userData);
        if (errors.length > 0) {
            throw {
                message: "กรุณากรอกข้อมูลให้ครบถ้วน",
                errors: errors
            }
        }

        
        const response = await axios.post('http://localhost:8000/reservations', userData)
        console.log('response', response);
        messageDOM.innerText = "บันทึกข้อมูลสำเร็จ";
        messageDOM.className = "message success";
    } catch (error) {
        console.log('error message', error.message);
        console.log('error', error.errors);
        let htmlData = '<div>';

        if (error.response) {
            htmlData += `<div>${error.response.data.message}</div>`;
        } else {
            htmlData += `<div> ${error.message} </div>`;
            htmlData += '<ul>';
            for (let i = 0; i < error.errors.length; i++) {

                htmlData += `<li> ${error.errors[i]} </li>`;

            }

        }

        htmlData += '</ul>';
        htmlData += '</div>';

        messageDOM.innerHTML = htmlData;
        messageDOM.className = 'message danger';

    }
}

