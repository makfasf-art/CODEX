const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const rooms = new Map();

app.use(express.static(path.join(__dirname, '../public')));
app.get('/api/status', (_, res) => {
  res.json({
    name: process.env.BOT_NAME || 'V9 ULTRA',
    game: 'Tic-Tac-Toe WebSocket',
    rooms: rooms.size
  });
});

function send(ws, data) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
}

function checkWinner(b) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a,c,d] of lines)
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  return b.every(Boolean) ? 'DRAW' : null;
}

wss.on('connection', ws => {
  ws.on('message', raw => {
    let msg;
    try { msg = JSON.parse(raw.toString()); }
    catch { return send(ws, { type: 'error', message: 'JSON tidak valid' }); }

    if (msg.type === 'join') {
      const id = String(msg.room || 'umum').slice(0, 32);
      let room = rooms.get(id);
      if (!room || room.result) {
        room = { board: Array(9).fill(''), turn: 'X', players: [], result: null };
        rooms.set(id, room);
      }
      if (!room.players.includes(ws) && room.players.length < 2)
        room.players.push(ws);
      ws.roomId = id;
      ws.symbol = room.players[0] === ws ? 'X' :
        room.players[1] === ws ? 'O' : null;
      send(ws, { type: 'joined', room: id, symbol: ws.symbol });
      broadcast(id);
    }

    if (msg.type === 'move') {
      const room = rooms.get(ws.roomId);
      const p = Number(msg.pos);
      if (!room || !ws.symbol || room.result ||
          room.turn !== ws.symbol || !Number.isInteger(p) ||
          p < 0 || p > 8 || room.board[p] ||
          room.players.length !== 2) {
        return send(ws, { type: 'error', message: 'Langkah tidak valid' });
      }
      room.board[p] = ws.symbol;
      room.result = checkWinner(room.board);
      if (!room.result) room.turn = room.turn === 'X' ? 'O' : 'X';
      broadcast(ws.roomId);
    }

    if (msg.type === 'restart') {
      const room = rooms.get(ws.roomId);
      if (room && room.players.includes(ws)) {
        room.board = Array(9).fill('');
        room.turn = 'X';
        room.result = null;
        broadcast(ws.roomId);
      }
    }
  });

  ws.on('close', () => {
    const room = rooms.get(ws.roomId);
    if (room) {
      room.players = room.players.filter(p => p !== ws);
      broadcast(ws.roomId);
      if (!room.players.length) rooms.delete(ws.roomId);
    }
  });
});

function broadcast(id) {
  const room = rooms.get(id);
  if (!room) return;
  for (const p of room.players) {
    send(p, {
      type: 'state',
      board: room.board,
      turn: room.turn,
      result: room.result,
      players: room.players.length
    });
  }
}

const port = Number(process.env.PORT || 3000);
server.listen(port, '0.0.0.0', () =>
  console.log(`Web game: http://localhost:${port}`)
);
