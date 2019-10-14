import 'dotenv/config';
import 'babel-polyfill';
import express from 'express';
import http from 'http';
import SocketIO from 'socket.io';

const app = express();

const server = http.createServer(app);
const io = SocketIO(server);

let currStatus = null;

let currTimeout = null;

function calcTimeLeft(start, length, now = Date.now()) {
  const end = start + length;
  return end - now;
}

io.sockets.on('connection', socket => {
  console.log(`${socket.id} connected!`);

  socket.on('new', () => socket.emit('res', currStatus));

  socket.on('start', obj => {
    console.log(
      `${socket.id} start countdown on ${obj.startAt} for ${obj.cdLength} millisecond(s)`
    );
    currStatus = {
      id: socket.id,
      startAt: obj.startAt,
      cdLength: obj.cdLength,
      stopped: false,
    };
    socket.emit('res', currStatus);
    socket.broadcast.emit('res', currStatus);
    clearTimeout(currTimeout);
    currTimeout = setTimeout(() => {
      let stopAt = obj.startAt + obj.cdLength;
      currStatus = {
        id: socket.id,
        startAt: obj.startAt,
        cdLength: obj.cdLength,
        stopped: true,
        stopAt,
      };
      console.log('Countdown reach zero!');
      socket.emit('res', currStatus);
      socket.broadcast.emit('res', currStatus);
    }, calcTimeLeft(obj.startAt, obj.cdLength));
  });

  socket.on('stop', obj => {
    console.log(`${socket.id} stop countdown on ${obj.stopAt}`);
    clearTimeout(currTimeout);
    currStatus = {
      id: socket.id,
      startAt: currStatus.startAt,
      cdLength: currStatus.cdLength,
      stopped: true,
      stopAt: obj.stopAt,
    };
    socket.emit('res', currStatus);
    socket.broadcast.emit('res', currStatus);
  });

  socket.on('reset', () => {
    console.log(`${socket.id} reset clock`);
    clearTimeout(currTimeout);
    currStatus = null;
    socket.emit('res', {
      reset: true,
    });
    socket.broadcast.emit('res', {
      reset: true,
    });
  });

  socket.on('disconnect', () => console.log(`${socket.id} disconnected!`));
});

let port = process.env.PORT || 3000;

server.listen(port, () => console.log(`Listening on port ${port}`));
