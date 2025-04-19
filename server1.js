const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const nodemailer = require('nodemailer');
const cors = require('cors');
const pool = require('./db');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Функция для аутентификации токена
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Регистрация с подтверждением email
app.post('/api/register', async (req, res) => {
  const { username, password, email } = req.body;

  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: 'Неверный формат email' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
    if (rows.length > 0) {
      return res.status(400).json({ message: 'Пользователь с таким логином или email уже существует' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    await pool.query(
      'INSERT INTO users (username, password, email, verification_token) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, email, verificationToken]
    );

    const verifyLink = `http://localhost:3000/api/verify-email?token=${verificationToken}`;

    const transporter = nodemailer.createTransport({
        host: 'smtp.mail.ru',
        port: 587,  // 465 для SSL или 587 для TLS
        secure: false,  // true для SSL, false для TLS
        auth: {
          user: process.env.EMAIL_USER,  // ваш почтовый адрес
          pass: process.env.EMAIL_APP_PASSWORD,  // ваш пароль от почты
        },
      });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Подтверждение Email',
      html: `<h2>Подтвердите свою почту</h2><p>Нажмите <a href="${verifyLink}">сюда</a>, чтобы подтвердить адрес email.</p>`
    };

    // Используем промис вместо колбэка для лучшего контроля над выполнением
    await transporter.sendMail(mailOptions);
    console.log('Письмо отправлено');

    // Если письмо успешно отправлено, отправляем сообщение пользователю
    return res.status(201).json({ message: 'Письмо с подтверждением отправлено на почту' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Ошибка сервера, попробуйте позже' });
  }
});

// Подтверждение email
app.get('/api/verify-email', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send('Неверная ссылка.');

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE verification_token = ?', [token]);
    if (rows.length === 0) return res.status(400).send('Недействительный токен.');

    await pool.query('UPDATE users SET is_verified = true, verification_token = NULL WHERE id = ?', [rows[0].id]);

    // 🔁 Редирект на клиентскую страницу после успешного подтверждения
    res.redirect('http://localhost:3000/email-verified.html'); // можешь подставить свой путь
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка подтверждения.');
  }
});

// Авторизация с проверкой подтверждения email
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Неверные данные' });
    }

    if (!user.is_verified) {
      return res.status(403).json({ message: 'Email не подтверждён. Проверьте почту.' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера, попробуйте позже' });
  }
});

// Защищённый маршрут для получения данных о пользователе
app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (rows.length > 0) {
      res.json({
        id: rows[0].id,
        username: rows[0].username,
        x: rows[0].x,
        y: rows[0].y,
        inventory: rows[0].inventory
      });
    } else {
      res.status(404).json({ message: 'Пользователь не найден' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера, попробуйте позже' });
  }
});

// Сокеты: игроки
let players = {};

io.on('connection', (socket) => {
  console.log('Игрок подключился:', socket.id);

  socket.on('join', (data) => {
    players[socket.id] = { username: data.username, x: 0, y: 0 };
    io.emit('players', players);
  });


  socket.on('move', (coords) => {
    if (players[socket.id]) {
      players[socket.id].x = coords.x;
      players[socket.id].y = coords.y;
      io.emit('players', players);
    }
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('players', players);
  });
});

server.listen(3000, () => {
  console.log('Сервер запущен на http://localhost:3000');
});
