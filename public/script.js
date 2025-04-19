let socket = io();

// Переключение между формами
function toggleForm() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  
  if (loginForm.style.display !== 'none') {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
  } else {
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
  }
}

// Регистрация
document.getElementById('registerForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const username = document.getElementById('register-username').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;

  const response = await fetch('/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, email, password }),
  });

  const data = await response.json();
  if (response.status === 201) {
    alert('Регистрация успешна! Перейдите к авторизации.');
    toggleForm();
  } else {
    alert(data.message || 'Ошибка регистрации');
  }
});

// Авторизация
document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
  
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
  
    const data = await response.json();
    if (response.status === 200) {
      alert('Авторизация успешна!');
      localStorage.setItem('token', data.token);
      document.getElementById('login-form').style.display = 'none';
      document.getElementById('gameArea').style.display = 'block';
    } else {
      alert(data.message || 'Ошибка авторизации');
    }
  });

// Присоединение игрока
document.getElementById('joinBtn').addEventListener('click', () => {
  const playerName = document.getElementById('username').value;
  if (playerName) {
    socket.emit('join', { username: playerName });
  } else {
    alert('Введите имя игрока');
  }
});

// Получение списка игроков
socket.on('players', (players) => {
  const playersList = document.getElementById('playersList');
  playersList.innerHTML = '';
  Object.values(players).forEach(player => {
    const li = document.createElement('li');
    li.textContent = `${player.username} - (${player.x}, ${player.y})`;
    playersList.appendChild(li);
  });
});

// Переключение видимости пароля при регистрации
const registerPasswordInput = document.getElementById('register-password');
const showRegisterPassword = document.getElementById('show-register-password');

if (registerPasswordInput && showRegisterPassword) {
  showRegisterPassword.addEventListener('change', () => {
    registerPasswordInput.type = showRegisterPassword.checked ? 'text' : 'password';
  });
}

// Переключение видимости пароля при авторизации
const loginPasswordInput = document.getElementById('login-password');
const showLoginPassword = document.getElementById('show-login-password');

if (loginPasswordInput && showLoginPassword) {
  showLoginPassword.addEventListener('change', () => {
    loginPasswordInput.type = showLoginPassword.checked ? 'text' : 'password';
  });
}

// 🔁 Восстановление сессии при загруз
window.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (token) {
      const response = await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (response.ok) {
        const user = await response.json();
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('gameArea').style.display = 'block';
        document.getElementById('username').value = user.username;
        socket.emit('join', { username: user.username });
      } else {
        localStorage.removeItem('token'); // если токен невалидный — удалим
      }
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token'); // удалить токен
  document.getElementById('gameArea').style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('loginForm').reset();
  socket.emit('disconnect'); // отключение от сокета
});




//МОНЕТЫ

// Показать модалку
/* document.getElementById('openCoinModal').addEventListener('click', async () => {
  await updateCoinBalance();
  document.getElementById('coinModal').style.display = 'block';
}); */

// Получить монеты
/* document.getElementById('collectCoinsBtn').addEventListener('click', async () => {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/collect-coins', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await res.json();
  if (res.ok) {
    alert(data.message);
    updateCoinBalance();
  } else {
    alert(data.message);
  }
}); */

// Обновление баланса
/* async function updateCoinBalance() {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/coins', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  document.getElementById('coinBalance').textContent = data.coins;

  // Авто-таймер до следующего сбора
  if (data.last_collected_at) {
    const lastTime = new Date(data.last_collected_at);
    const now = new Date();
    const diff = 300 - Math.floor((now - lastTime) / 1000);
    if (diff > 0) {
      const timerEl = document.getElementById('coinTimerText');
      let remaining = diff;
      timerEl.textContent = `Подождите ${Math.ceil(remaining / 60)} минут...`;
      const interval = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
          clearInterval(interval);
          timerEl.textContent = 'Нажмите кнопку ниже, чтобы получить монеты:';
        } else {
          timerEl.textContent = `Подождите ${Math.ceil(remaining / 60)} минут...`;
        }
      }, 1000);
    }
  }
} */

// ✨ Красивое сообщение в модалке
function showMagicMessage(text) {
    const messageEl = document.getElementById('coinTimerText');
    messageEl.textContent = text;
    messageEl.style.opacity = 0;
    messageEl.style.transition = 'opacity 0.6s ease';
    setTimeout(() => {
      messageEl.style.opacity = 1;
    }, 50);
  }
  
  // 🌙 Красиво показать окно
  const openBtn = document.getElementById('openCoinModal');
  const modal = document.getElementById('coinModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  
  openBtn.addEventListener('click', async () => {
    await updateCoinBalance();
    modal.style.display = 'flex';
  });
  
  closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });
  
  // 🪄 Получить монеты
  document.getElementById('collectCoinsBtn').addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/collect-coins', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  
    const data = await res.json();
    if (res.ok) {
      showMagicMessage(data.message || 'Вы получили 100 монет! 💰');
      updateCoinBalance();
    } else {
      if (data.remaining) {
        const mins = Math.floor(data.remaining / 60);
        const secs = data.remaining % 60;
        showMagicMessage(`Подождите ${mins} мин ${secs} сек...`);
      } else {
        showMagicMessage(data.message || 'Ошибка!');
      }
    }
  });
  
  // 🔄 Обновить баланс и таймер
  async function updateCoinBalance() {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/coins', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    document.getElementById('coinBalance').textContent = data.coins;
  
    if (data.last_collected_at) {
      const lastTime = new Date(data.last_collected_at);
      const now = new Date();
      let remaining = Math.floor(300 - (now - lastTime) / 1000);
  
      if (remaining > 0) {
        const timerEl = document.getElementById('coinTimerText');
        const interval = setInterval(() => {
          const mins = Math.floor(remaining / 60);
          const secs = remaining % 60;
          timerEl.textContent = `Подождите ${mins} мин ${secs} сек...`;
          remaining--;
  
          if (remaining <= 0) {
            clearInterval(interval);
            showMagicMessage('Нажмите кнопку ниже, чтобы получить монеты ✨');
          }
        }, 1000);
      } else {
        showMagicMessage('Нажмите кнопку ниже, чтобы получить монеты ✨');
      }
    } else {
      showMagicMessage('Нажмите кнопку ниже, чтобы получить монеты ✨');
    }
  }