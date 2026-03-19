window.onload = () => {
    loadReservations();
    setInterval(loadReservations, 5000);
};

const loadData = async () => {

    let url = "http://localhost:8000/reservations?";

    try {
        const response = await axios.get(url);
        const data = response.data;

        console.log(data);

    } catch (err) {
        console.error(err);
    }
}

const loadReservations = async () => {

    const response = await axios.get("http://localhost:8000/reservations");
    const data = response.data;

    let html = "";

    let total = data.length;
    let pending = 0;
    let confirm = 0;
    let reject = 0;

    data.forEach(item => {

        if (item.status === "pending") pending++;
        if (item.status === "confirm") confirm++;
        if (item.status === "reject") reject++;

        const date = new Date(item.date);
        const formattedDate = date.toLocaleDateString("th-TH");


        let statusClass = item.status;

        html += `
        <tr>
        <td>${item.id}</td>
        <td>${item.firstname}</td>
        <td>${item.size}</td>
        <td>${formattedDate}</td>
        <td>${item.time.slice(0, 5)}</td>
        <td class ="${statusClass}">${item.status}</td>

        <td>
        <button onclick="confirmReservation(${item.id})">✔</button>
        <button onclick="rejectReservation(${item.id})">✖</button>
        </td>

        </tr>`;
    });


    document.getElementById("tableData").innerHTML = html;

    document.getElementById("totalBooking").innerText = total;
    document.getElementById("pendingBooking").innerText = pending;
    document.getElementById("confirmBooking").innerText = confirm;
    document.getElementById("rejectBooking").innerText = reject;
};


const confirmReservation = async (id) => {

    await axios.put(
        `http://localhost:8000/reservations/${id}`,
        { status: "confirm" }
    );

    loadReservations();
};


const rejectReservation = async (id) => {

    await axios.put(
        `http://localhost:8000/reservations/${id}`,
        { status: "reject" }
    );

    loadReservations();
};