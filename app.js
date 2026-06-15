const storageKeys = {
  users: "globalchat.users",
  messages: "globalchat.messages",
  session: "globalchat.session",
};

const defaultAvatar =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'%3E%3Crect width='128' height='128' fill='%237db8cc'/%3E%3Ccircle cx='64' cy='48' r='26' fill='%23fffaf0'/%3E%3Cpath d='M22 118c6-28 25-43 42-43s36 15 42 43' fill='%23fffaf0'/%3E%3C/svg%3E";

const authView = document.querySelector("#authView");
const chatView = document.querySelector("#chatView");
const showSignIn = document.querySelector("#showSignIn");
const showCreate = document.querySelector("#showCreate");
const signInForm = document.querySelector("#signInForm");
const createForm = document.querySelector("#createForm");
const authMessage = document.querySelector("#authMessage");
const googleButton = document.querySelector("#googleButton");
const signOutButton = document.querySelector("#signOutButton");
const clearMessagesButton = document.querySelector("#clearMessagesButton");
const messagesEl = document.querySelector("#messages");
const messageForm = document.querySelector("#messageForm");
const messageInput = document.querySelector("#messageInput");
const currentAvatar = document.querySelector("#currentAvatar");
const currentName = document.querySelector("#currentName");
const messageCount = document.querySelector("#messageCount");
const profileButton = document.querySelector("#profileButton");
const profileDialog = document.querySelector("#profileDialog");
const profileForm = document.querySelector("#profileForm");
const profileName = document.querySelector("#profileName");
const profileAvatar = document.querySelector("#profileAvatar");
const avatarPreview = document.querySelector("#avatarPreview");

let state = {
  users: readJson(storageKeys.users, []),
  messages: readJson(storageKeys.messages, []),
  session: localStorage.getItem(storageKeys.session),
};

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeUsername(username) {
  return username.trim().replace(/\s+/g, "").toLowerCase();
}

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getCurrentUser() {
  return state.users.find((user) => user.id === state.session) ?? null;
}

function setAuthMode(mode) {
  const creating = mode === "create";
  createForm.classList.toggle("hidden", !creating);
  signInForm.classList.toggle("hidden", creating);
  showCreate.classList.toggle("active", creating);
  showSignIn.classList.toggle("active", !creating);
  authMessage.textContent = creating
    ? "Use a real password manager prompt from Chrome after account creation."
    : "Chrome can offer to save passwords after you create or sign in to an account.";
}

function saveSession(userId) {
  state.session = userId;
  localStorage.setItem(storageKeys.session, userId);
  render();
}

async function createAccount(event) {
  event.preventDefault();
  const username = normalizeUsername(document.querySelector("#createUsername").value);
  const password = document.querySelector("#createPassword").value;

  if (state.users.some((user) => user.username === username)) {
    authMessage.textContent = "That username already exists in this browser.";
    return;
  }

  const user = {
    id: crypto.randomUUID(),
    username,
    displayName: username,
    avatar: defaultAvatar,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  state.users.push(user);
  writeJson(storageKeys.users, state.users);
  createForm.reset();
  saveSession(user.id);
}

async function signIn(event) {
  event.preventDefault();
  const username = normalizeUsername(document.querySelector("#signInUsername").value);
  const passwordHash = await hashPassword(document.querySelector("#signInPassword").value);
  const user = state.users.find((candidate) => candidate.username === username);

  if (!user || user.passwordHash !== passwordHash) {
    authMessage.textContent = "Username or password is incorrect.";
    return;
  }

  signInForm.reset();
  saveSession(user.id);
}

function signOut() {
  state.session = null;
  localStorage.removeItem(storageKeys.session);
  render();
}

function sendMessage(event) {
  event.preventDefault();
  const user = getCurrentUser();
  const text = messageInput.value.trim();
  if (!user || !text) return;

  state.messages.push({
    id: crypto.randomUUID(),
    userId: user.id,
    text,
    createdAt: new Date().toISOString(),
  });

  writeJson(storageKeys.messages, state.messages);
  messageForm.reset();
  renderMessages();
}

function formatTime(dateString) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderMessages() {
  const user = getCurrentUser();
  messageCount.textContent = `${state.messages.length} ${state.messages.length === 1 ? "message" : "messages"}`;

  if (state.messages.length === 0) {
    messagesEl.innerHTML = `<p class="empty-state">No messages yet. Start the first conversation in GlobalChat.</p>`;
    return;
  }

  messagesEl.innerHTML = state.messages
    .map((message) => {
      const author = state.users.find((candidate) => candidate.id === message.userId);
      const name = author?.displayName ?? "Unknown user";
      const avatar = author?.avatar || defaultAvatar;
      const ownClass = message.userId === user?.id ? " own" : "";

      return `
        <article class="message${ownClass}">
          <img class="message-avatar" src="${escapeHtml(avatar)}" alt="" />
          <div class="message-bubble">
            <div class="message-meta">
              <span class="message-name">${escapeHtml(name)}</span>
              <time class="message-time" datetime="${message.createdAt}">${formatTime(message.createdAt)}</time>
            </div>
            <div class="message-text">${escapeHtml(message.text)}</div>
          </div>
        </article>
      `;
    })
    .join("");

  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function renderProfile(user) {
  currentName.textContent = user.displayName;
  currentAvatar.src = user.avatar || defaultAvatar;
  profileName.value = user.displayName;
  profileAvatar.value = user.avatar === defaultAvatar ? "" : user.avatar;
  avatarPreview.src = user.avatar || defaultAvatar;
}

function render() {
  const user = getCurrentUser();
  const signedIn = Boolean(user);

  authView.classList.toggle("hidden", signedIn);
  chatView.classList.toggle("hidden", !signedIn);

  if (user) {
    renderProfile(user);
    renderMessages();
    messageInput.focus();
  }
}

function saveProfile(event) {
  event.preventDefault();
  const user = getCurrentUser();
  if (!user) return;

  user.displayName = profileName.value.trim() || user.username;
  user.avatar = profileAvatar.value.trim() || defaultAvatar;
  writeJson(storageKeys.users, state.users);
  profileDialog.close();
  render();
}

function clearMessages() {
  const confirmed = confirm("Clear all GlobalChat messages saved in this browser?");
  if (!confirmed) return;
  state.messages = [];
  writeJson(storageKeys.messages, state.messages);
  renderMessages();
}

showSignIn.addEventListener("click", () => setAuthMode("sign-in"));
showCreate.addEventListener("click", () => setAuthMode("create"));
createForm.addEventListener("submit", createAccount);
signInForm.addEventListener("submit", signIn);
messageForm.addEventListener("submit", sendMessage);
signOutButton.addEventListener("click", signOut);
clearMessagesButton.addEventListener("click", clearMessages);
profileButton.addEventListener("click", () => profileDialog.showModal());
profileForm.addEventListener("submit", saveProfile);
profileAvatar.addEventListener("input", () => {
  avatarPreview.src = profileAvatar.value.trim() || defaultAvatar;
});

googleButton.addEventListener("click", () => {
  authMessage.textContent =
    "Google sign-in needs a Firebase or Google OAuth client ID. This static demo is ready for that upgrade, but it cannot safely create one by itself.";
});

render();
