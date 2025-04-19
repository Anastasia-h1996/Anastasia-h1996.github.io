/* const socket = io();
const joinBtn = document.getElementById('joinBtn');
const usernameInput = document.getElementById('username');
const playersList = document.getElementById('playersList');
const gameArea = document.getElementById('gameArea');

let username = '';

joinBtn.addEventListener('click', () => {
  username = usernameInput.value.trim();
  if (!username) return alert('Введите имя!');
  socket.emit('join', { username });
  gameArea.style.display = 'block';
});

// Получаем список игроков и отображаем
socket.on('players', (players) => {
  playersList.innerHTML = '';
  for (const id in players) {
    const player = players[id];
    const li = document.createElement('li');
    li.textContent = `${player.username}: (${player.x}, ${player.y})`;
    playersList.appendChild(li);
  }
}); */