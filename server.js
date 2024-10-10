const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcrypt');
const app = express();
const port = 8000;


const db = new sqlite3.Database('./users.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the users database.');
});


db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
)`);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/register', (req, res) => {
    const { email, password } = req.body;
    const sql = 'INSERT INTO users (email, password) VALUES (?, ?)';

    db.run(sql, [email, password], function(err) {
        if (err) {
            return res.status(400).json({ message: 'Пользователь с такой почтой уже существует.' });
        }
        res.status(201).json({ id: this.lastID, email });
    });
});

app.post('/authorization', (req, res) => {
    const { email, password } = req.body; 
    const sql = 'SELECT * FROM users WHERE email = ? pa';

    db.get(sql, [email, password], async (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Ошибка сервера' });
        }
        if (!row) {
            return res.status(400).json({ message: 'Пользователя с такой почтой не существует' });
        }

        
        const match = await bcrypt.compare(password, row.password);
        if (!match) {
            return res.status(400).json({ message: 'Неверный пароль' });
        }

        
        res.status(200).json({ id: row.id, email: row.email }); 
    });
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});