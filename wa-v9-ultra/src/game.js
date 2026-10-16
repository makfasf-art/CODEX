const games = new Map();

function board() {
  return Array(9).fill(null);
}

function winner(b) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a,c,d] of lines) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  }
  return b.every(Boolean) ? 'draw' : null;
}

function render(b) {
  return b.map((v,i) => v || String(i+1))
    .reduce((a,v,i) => {
      a.push(v);
      if (i % 3 === 2) a.push('\n');
      return a;
    }, []).join(' ');
}

function start(chat, player) {
  games.set(chat, {
    board: board(),
    turn: 'X',
    player,
    started: Date.now()
  });
  return games.get(chat);
}

function move(chat, pos, player) {
  const g = games.get(chat);
  if (!g) return { error: 'Belum ada game. Ketik .ttt' };
  if (g.player !== player) return { error: 'Pemain tidak cocok.' };
  if (!Number.isInteger(pos) || pos < 1 || pos > 9)
    return { error: 'Pilih angka 1 sampai 9.' };
  if (g.board[pos - 1])
    return { error: 'Kotak sudah terisi.' };

  g.board[pos - 1] = g.turn;
  const result = winner(g.board);
  const output = { board: render(g.board), result };

  if (result) games.delete(chat);
  else g.turn = g.turn === 'X' ? 'O' : 'X';

  return { ...output, turn: result ? null : g.turn };
}

module.exports = { games, start, move, render };
