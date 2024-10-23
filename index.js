const express = require('express');
const socket = require('socket.io');

const PORT = process.env.PORT || 3000;
const app = express();

const server = app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

const io = socket(server);

const activeUsers = new Set();
let typingUsers = new Set(); // 用于追踪当前正在输入的用户

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('User has connected');

  // 处理新用户连接
  socket.on('new user', (data) => {
    socket.userId = data;
    activeUsers.add(data);

    // 向新用户发送当前所有正在输入的用户
    socket.emit('typing users', [...typingUsers]);

    // 向所有用户广播新的活跃用户列表
    io.emit('new user', [...activeUsers]);
    console.log(`Active users: ${[...activeUsers]}`);
  });

  // 处理用户断开连接
  socket.on('disconnect', () => {
    activeUsers.delete(socket.userId);
    typingUsers.delete(socket.userId); // 移除断开连接的用户
    io.emit('user disconnected', socket.userId);
    console.log(`Active users: ${[...activeUsers]}`);
    console.log(`Typing users: ${[...typingUsers]}`);
  });

  // 处理用户发送的聊天消息
  socket.on('chat message', (data) => {
    io.emit('chat message', data);
    console.log(`Received chat message "${data.message}" from ${data.nick}`);
  });

  // 处理用户开始输入
  socket.on('typing', (userName) => {
    typingUsers.add(userName); // 将用户加入正在输入的列表
    io.emit('typing', userName); // 广播给其他用户
    console.log(`Typing users: ${[...typingUsers]}`);
  });

  // 处理用户停止输入
  socket.on('stop typing', (userName) => {
    typingUsers.delete(userName); // 将用户从正在输入的列表中移除
    io.emit('stop typing', userName); // 广播给其他用户
    console.log(`Typing users: ${[...typingUsers]}`);
  });
});
