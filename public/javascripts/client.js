// Connect to the server using Socket.io
const socket = io();

// Select DOM elements
const inboxPeople = document.querySelector('.inbox__people');
const messageForm = document.querySelector('.message_form');
const inputField = document.querySelector('.message_form__input');
const messageBox = document.querySelector('.messages__history');
const typingIndicator = document.querySelector('.typing-indicator'); // Typing indicator element
const notificationContainer = document.getElementById('notificationContainer'); // 提示框容器
const usernameInput = document.querySelector('.username_input');
const changeUsernameButton = document.querySelector('.change_username_button');
let userName = '';
let isTyping = false;
let typingTimeout;
let typingUsers = []; // Array to keep track of all typing users
const prefixedUserName = `User-${userName}`;
// Prompt the user for a username (for demonstration purposes)
const newUserConnected = () => {
  userName = `User-${Math.floor(Math.random() * 1000000)}`;
  socket.emit('new user', userName);
  addUser(userName);
};

// Add a user to the active users list
const addUser = (userName) => {
  const userList = document.getElementById('userList'); // 获取用户列表容器
  // Check if user already exists
  if (document.querySelector(`.${userName}-userlist`)) {
    return; // 如果用户已在列表中，直接返回
  }
  const userBox = `
    <div class="chat_id ${userName}-userlist">
      <h5>${userName}</h5>
    </div>
  `;
  userList.innerHTML += userBox; // 更新用户列表容器
};

// Initialize user connection
newUserConnected();

// Listen for new users
socket.on('new user', function (data) {
  data.forEach(function (user) {
    addUser(user);
  });

  showUserNotification(`${data[data.length - 1]} has joined the chat!`);
});

// Remove user from the list when they disconnect
socket.on('user disconnected', function (userName) {
  document.querySelector(`.${userName}-userlist`).remove();
  showUserNotification(`${userName} has left the chat.`);
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
// Listen for typing events
socket.on('typing', (userName) => {
  if (!typingUsers.includes(userName)) {
    typingUsers.push(userName);
  }
  updateTypingIndicator(); // Call to update the display
});

// Listen for stop typing events
socket.on('stop typing', (userName) => {
  typingUsers = typingUsers.filter((user) => user !== userName);
  updateTypingIndicator(); // Call to update the display
});

const updateTypingIndicator = () => {
  // Filter out the current user from the typingUsers list
  const otherTypingUsers = typingUsers.filter((user) => user !== userName);

  if (otherTypingUsers.length > 0) {
    typingIndicator.style.display = 'block';
    typingIndicator.innerText = `${otherTypingUsers.join(', ')} ${otherTypingUsers.length === 1 ? 'is' : 'are'} typing...`;
  } else {
    typingIndicator.style.display = 'none';
  }
};



// Display a new message
socket.on('chat message', function (data) {
  addNewMessage({ user: data.nick, message: data.message });
  hideTypingIndicator(); // 隐藏输入指示
});

changeUsernameButton.addEventListener('click', () => {
  const newUsername = prefixedUserName + usernameInput.value.trim();
  if (newUsername && newUsername !== userName) { // 确保新用户名与当前用户名不同
    const oldUsername = userName;
    userName = newUsername; // Update userName to new value
    socket.emit('change username', { oldUsername, newUsername });
    usernameInput.value = ''; // Clear the input field
  }
});


// Listen for username change
socket.on('username changed', (data) => {
  const { oldUsername, newUsername } = data;

  // Remove the old username from the list
  const oldUserElement = document.querySelector(`.${oldUsername}-userlist`);
  if (oldUserElement) {
    oldUserElement.querySelector('h5').innerText = newUsername; // Update display text
    oldUserElement.classList.remove(`${oldUsername}-userlist`);
    oldUserElement.classList.add(`${newUsername}-userlist`); // Update class to reflect new username
  }
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
const showUserNotification = (message) => {
  // Create a notification element
  const notification = document.createElement('div');
  notification.classList.add('notification');
  notification.textContent = message;

  // Append the notification to the container
  notificationContainer.appendChild(notification);

  // Show the notification with a transition
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);

  // Automatically remove the notification after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    // Remove the notification element after the transition
    setTimeout(() => {
      notificationContainer.removeChild(notification);
    }, 500);
  }, 3000);
};