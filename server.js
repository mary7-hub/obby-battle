const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });
console.log("[SERVER] Оффлайн-сервер запущен на порту 8080! Ждем Мари и Ксеяо...");
const players = {};
wss.on('connection', (ws) => {
    let playerId = null;
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'join') {
                playerId = data.id;
                players[playerId] = { id: data.id, name: data.name, x: data.x, y: data.y, img: data.img, deaths: 0, ws: ws };
                ws.send(JSON.stringify({ type: 'init', players: Object.values(players).map(p => ({ id: p.id, name: p.name, x: p.x, y: p.y, img: p.img, deaths: p.deaths })) }));
                broadcast({ type: 'newPlayer', id: data.id, name: data.name, x: data.x, y: data.y, img: data.img, deaths: 0 }, playerId);
            }
            if (data.type === 'move' && playerId) {
                players[playerId].x = data.x; players[playerId].y = data.y;
                broadcast({ type: 'update', id: playerId, x: data.x, y: data.y }, playerId);
            }
            if (data.type === 'death' && playerId) {
                players[playerId].deaths = data.deaths;
                broadcast({ type: 'updateDeaths', id: playerId, deaths: data.deaths }, playerId);
            }
        } catch (err) { console.error(err); }
    });
    ws.on('close', () => { if (playerId && players[playerId]) { delete players[playerId]; broadcast({ type: 'remove', id: playerId }); } });
});
function broadcast(data, skipId = null) {
    const msg = JSON.stringify(data);
    Object.keys(players).forEach(id => { if (id !== skipId && players[id].ws.readyState === WebSocket.OPEN) players[id].ws.send(msg); });
}
