// Connect to the server using Socket.io
const socket = io();

// Select DOM elements
const inboxPeople = document.querySelector('.inbox__people');
const messageForm = document.querySelector('.message_form');
const inputField = document.querySelector('.message_form__input');
const messageBox = document.querySelector('.messages__history');
const typingIndicator = document.querySelector('.typing-indicator'); // Typing indicator element
const notificationContainer = document.getElementById('notificationContainer'); // 提示框容器

let userName = '';
let isTyping = false;
let typingTimeout;
let typingUsers = []; // Array to keep track of all typing users

// Prompt the user for a username (for demonstration purposes)
const newUserConnected = () => {
  userName = `User-${Math.floor(Math.random() * 1000000)}`;
  socket.emit('new user', userName);
  addUser(userName);
};

// Add a user to the active users list
const addUser = (userName) => {
  if (document.querySelector(`.${userName}-userlist`)) {
    return;
  }
  const userBox = `
    <div class="chat_id ${userName}-userlist">
      <h5>${userName}</h5>
    </div>
  `;
  inboxPeople.innerHTML += userBox;
};

// Initialize user connection
newUserConnected();

// Listen for new users
socket.on('new user', function (data) {
  data.forEach(function (user) {
    addUser(user);
  });

  // 显示每个新用户加入的提示框
  showUserNotification(data[data.length - 1]); // 传递最新加入的用户
});

// Remove user from the list when they disconnect
socket.on('user disconnected', function (userName) {
  document.querySelector(`.${userName}-userlist`).remove();
});

// Send a chat message
messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!inputField.value) {
    return;
  }
  socket.emit('chat message', {
    message: inputField.value,
    nick: userName,
  });
  inputField.value = '';
  isTyping = false;
  socket.emit('stop typing', userName); // 停止输入事件
});

// Detect when the user is typing
inputField.addEventListener('input', () => {
  if (!isTyping) {
    isTyping = true;
    socket.emit('typing', userName); // Notify server that the user is typing
  }

  // 每次输入时重置定时器
  clearTimeout(typingTimeout);

  // 在 2 秒后如果没有继续输入，则发送 "stop typing" 事件
  typingTimeout = setTimeout(() => {
    isTyping = false;
    socket.emit('stop typing', userName); // 通知服务器用户停止输入
  }, 2000);
});

// Display a new message
socket.on('chat message', function (data) {
  addNewMessage({ user: data.nick, message: data.message });
  hideTypingIndicator(); // 隐藏输入指示
});

// Function to add a new message to the chat window
const addNewMessage = ({ user, message }) => {
  const time = new Date();
  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const messageElement = `
    <div class="${user === userName ? 'outgoing' : 'incoming'}__message">
      <div class="${user === userName ? 'sent' : 'received'}__message">
        <p>${message}</p>
        <div class="message__info">
          ${user !== userName ? `<span class="message__author">${user}</span>` : ''}
          <span class="time_date">${formattedTime}</span>
        </div>
      </div>
    </div>
  `;

  messageBox.innerHTML += messageElement;
};

// Function to show user notification when new user joins
const showUserNotification = (newUserName) => {
  // 创建提示框的DOM元素
  const notification = document.createElement('div');
  notification.classList.add('notification');
  notification.textContent = `${newUserName} has joined the chat!`;

  // 将提示框添加到容器中
  notificationContainer.appendChild(notification);

  // 使用 setTimeout 来显示提示框
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);

  // 3 秒后自动移除提示框
  setTimeout(() => {
    notification.classList.remove('show');
    // 再等待过渡完成后移除提示框
    setTimeout(() => {
      notificationContainer.removeChild(notification);
    }, 500);
  }, 3000);
};
