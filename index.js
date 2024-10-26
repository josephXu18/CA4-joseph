const express = require('express');
const socket = require('socket.io');
const path = require('path');

const PORT = process.env.PORT || 3000;
const app = express();

const server = app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

const io = socket(server);

const activeUsers = new Set();
let typingUsers = new Set();

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'Index.html'));
});

io.on('connection', (socket) => {
  console.log('User has connected');

  // 处理新用户连接
  socket.on('new user', (data) => {
    socket.userId = data;
    activeUsers.add(data);


    socket.emit('typing users', [...typingUsers]);


    io.emit('new user', [...activeUsers]);
    console.log(`Active users: ${[...activeUsers]}`);
  });


  socket.on('disconnect', () => {
    activeUsers.delete(socket.userId);
    typingUsers.delete(socket.userId);
    io.emit('user disconnected', socket.userId);
    console.log(`Active users: ${[...activeUsers]}`);
    console.log(`Typing users: ${[...typingUsers]}`);
  });


  socket.on('chat message', (data) => {
    io.emit('chat message', data);
    console.log(`Received chat message "${data.message}" from ${data.nick}`);
  });


  socket.on('typing', (userName) => {
    typingUsers.add(userName);
    io.emit('typing', userName);
    console.log(`Typing users: ${[...typingUsers]}`);
  });


  socket.on('stop typing', (userName) => {
    typingUsers.delete(userName);
    io.emit('stop typing', userName);
    console.log(`Typing users: ${[...typingUsers]}`);
  });

socket.on('change username', ({ oldUsername, newUsername }) => {
  // Remove the old username from the active users set
  activeUsers.delete(oldUsername);

  // Update the user's socket ID to the new username
  socket.userId = newUsername; // Update the user's ID
  activeUsers.add(newUsername); // Add new username to the active users set

  io.emit('username changed', { oldUsername, newUsername });
});

});
