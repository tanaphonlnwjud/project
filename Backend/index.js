require('dotenv').config();

const bodyParser = require('body-parser');
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');


const app = express();
app.use(cors());
app.use(bodyParser.json());

const port = 8000;

let conn = null;

const initMySQL = async () => {
    try{
    conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    console.log('✔ Connected to MySQL database');
}catch(err){
    console.error("❌ MySQL connection error:", err);
}
};

const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    family: 4,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls:{
        rejectUnauthorized: false
    }
    
});



app.post('/reservations', async (req, res) => {

    try {

        const { email, firstname, lastname, size, date, time, description } = req.body;

        const [users] = await conn.query(
            "SELECT id FROM users WHERE email=?",
            [email]
        );

        let userId;

        if (users.length === 0) {


            const [resultUser] = await conn.query(
                "INSERT INTO users (email, firstname, lastname) VALUES (?,?,?)",
                [email, firstname, lastname]
            );

            userId = resultUser.insertId;

        } else {

            userId = users[0].id;

        }

        const [existing] = await conn.query(
            "SELECT * FROM reservations WHERE user_id=? AND date=? AND time=?",
            [userId, date, time]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                message: "คุณได้จองเวลานี้ไปแล้ว"
            });
        }

        const [result] = await conn.query(
            "INSERT INTO reservations (user_id, size, date, time, description, status) VALUES (?,?,?,?,?,?)",
            [userId, size, date, time, description, 'pending']
        );

        res.json({
            message: "จองสำเร็จ",
            id: result.insertId
        });

    } catch (err) {

        console.error(err);
        res.status(500).json({ error: 'Error reservationing' });

    }
});

app.get('/reservations', async (req, res) => {
    try {
        const email = req.query.email?.trim().toLowerCase();
        const name = req.query.name;
        const date = req.query.date;

        let query = `
            SELECT 
                r.id,
                u.firstname,
                u.email,
                r.size,
                r.date,
                r.time,
                r.status
            FROM reservations r
            JOIN users u ON r.user_id = u.id
            WHERE 1=1
        `;

        let params = [];

        if (name) {
            query += " AND u.firstname LIKE ?";
            params.push(`%${name}%`);
        }

        if (date) {
            query += " AND r.date = ?";
            params.push(date);
        }

        if (email) {
            query += " AND LOWER(u.email) = ?";
            params.push(email);
        }

        query += " ORDER BY r.id DESC";

        const [rows] = await conn.query(query, params);

        res.json(rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'error' });
    }
});



app.put('/reservations/:id', async (req, res) => {

    try {

        const { status } = req.body;
        const id = req.params.id;

        if (!["confirm", "reject"].includes(status)) {
            return res.status(400).json({
                error: "สถานะไม่ถูกต้อง"
            });
        }

        await conn.query(
            "UPDATE reservations SET status=? WHERE id=?",
            [status, id]
        );

        const [rows] = await conn.query(`
            SELECT u.email, u.firstname, r.date, r.time
            FROM reservations r
            JOIN users u ON r.user_id = u.id
            WHERE r.id = ?`, [id]);

        const user = rows[0];

        if (!user) {
            return res.status(404).json({
                error: "ไม่พอข้อมูลผู้ใช้"
            });
        }

        const dateobj = new Date(user.date);

        const formattedDate = dateobj.toLocaleDateString("th-TH", {
            timeZone: "Asia/Bangkok",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    
        let subject = "";
        let text = "";

        if (status === "confirm") {
            subject = "ยืนยันการจองโต๊ะ";
            text = `สวัสดีคุณ ${user.firstname} การจองของคุณวันที่ ${formattedDate} เวลา ${user.time.slice(0, 5)} น. ได้รับการยืนยันแล้ว`;
        } else if (status === "reject") {
            subject = "การจองถูกปฎิเสธ";
            text = `ขออภัยคุณ ${user.firstname} การจองของคุณวันที่ ${formattedDate} เวลา ${user.time.slice(0, 5)} น. ถูกปฎิเสธ`;
        }

        await transporter.sendMail({
            from: "tanaphon.thok@ku.th",
            to: user.email,
            subject: subject,
            text: text
        });

        res.json({ success: true });

    } catch (err) {

        console.error('something wrong:', err);
        res.status(500).json({ error: 'Error sending email' });

    }
});



app.get("/reservations/:id", async (req, res) => {
    try {
        let id = req.params.id;
        const [rows] = await conn.query(`
            SELECT
            r.id,
            u.firstname,
            u.lastname,
            u.email,
            r.size,
            r.date,
            r.time,
            r.status,
            r.description
            FROM reservations r
            JOIN users u ON r.user_id = u.id
            WHERE r.id = ?`, [id]);
        if (rows.length === 0) {
            throw { statusCode: 404, message: 'Reservation not found' };
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('Error fetching reservation:', err);
        let statusCode = err.statusCode || 500;
        res.status(statusCode).json({
            error: err.message || 'Error fetching user'
        });
    }
});

app.get('/test-email', async (req, res) => {
    try {
        await transporter.sendMail({
            from: "tanaphon.thok@ku.th",
            to: "อีเมลตัวเอง@gmail.com",
            subject: "ทดสอบระบบ",
            text: "ส่งสำเร็จแล้ว 🎉"
        });

        res.send("ส่งเมลสำเร็จ");
    } catch (err) {
        console.error(err);
        res.send("ส่งไม่สำเร็จ");
    }
});

app.listen(port, async () => {

    await initMySQL();
    console.log(`Server is running on http://localhost:${port}`);

});