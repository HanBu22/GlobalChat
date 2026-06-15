import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  getAuth,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const defaultAvatar =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'%3E%3Crect width='128' height='128' fill='%235865f2'/%3E%3Ccircle cx='64' cy='48' r='26' fill='%23f2f3f5'/%3E%3Cpath d='M22 118c6-28 25-43 42-43s36 15 42 43' fill='%23f2f3f5'/%3E%3C/svg%3E";

const localSettingsKey = "globalchat.settings";
const usernameDomain = "globalchat.app";

const elements = {
  authView: document.querySelector("#authView"),
  chatView: document.querySelector("#chatView"),
  setupWarning: document.querySelector("#setupWarning"),
  showSignIn: document.querySelector("#showSignIn"),
  showCreate: document.querySelector("#showCreate"),
  signInForm: document.querySelector("#signInForm"),
  createForm: document.querySelector("#createForm"),
  signInSubmit: document.querySelector("#signInSubmit"),
  createSubmit: document.querySelector("#createSubmit"),
  authMessage: document.querySelector("#authMessage"),
  googleButton: document.querySelector("#googleButton"),
  messages: document.querySelector("#messages"),
  messageForm: document.querySelector("#messageForm"),
  messageInput: document.querySelector("#messageInput"),
  currentAvatar: document.querySelector("#currentAvatar"),
  currentName: document.querySelector("#currentName"),
  connectionStatus: document.querySelector("#connectionStatus"),
  roomStatus: document.querySelector("#roomStatus"),
  memberList: document.querySelector("#memberList"),
  settingsDialog: document.querySelector("#settingsDialog"),
  settingsButton: document.querySelector("#settingsButton"),
  settingsRailButton: document.querySelector("#settingsRailButton"),
  closeSettingsButton: document.querySelector("#closeSettingsButton"),
  settingsTabs: document.querySelectorAll("[data-settings-tab]"),
  settingsTitle: document.querySelector("#settingsTitle"),
  profileSettings: document.querySelector("#profileSettings"),
  notificationSettings: document.querySelector("#notificationSettings"),
  accountSettings: document.querySelector("#accountSettings"),
  settingsForm: document.querySelector("#settingsForm"),
  profileName: document.querySelector("#profileName"),
  profileAvatar: document.querySelector("#profileAvatar"),
  avatarFile: document.querySelector("#avatarFile"),
  avatarPreview: document.querySelector("#avatarPreview"),
  removeAvatarButton: document.querySelector("#removeAvatarButton"),
  desktopNotifications: document.querySelector("#desktopNotifications"),
  soundNotifications: document.querySelector("#soundNotifications"),
  soundVolume: document.querySelector("#soundVolume"),
  testSoundButton: document.querySelector("#testSoundButton"),
  soundQuickButton: document.querySelector("#soundQuickButton"),
  accountName: document.querySelector("#accountName"),
  accountId: document.querySelector("#accountId"),
  clearLocalButton: document.querySelector("#clearLocalButton"),
  signOutButton: document.querySelector("#signOutButton"),
};

let auth = null;
let db = null;
let currentUser = null;
let unsubscribeMessages = null;
let unsubscribeUsers = null;
let messagesLoaded = false;
let latestMessageId = null;
let currentAvatarData = defaultAvatar;

const state = {
  messages: [],
  users: new Map(),
  settings: readSettings(),
};

function hasFirebaseConfig() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);
}

function readSettings() {
  try {
    return {
      desktopNotifications: false,
      soundNotifications: true,
      soundVolume: 55,
      ...JSON.parse(localStorage.getItem(localSettingsKey)),
    };
  } catch {
    return {
      desktopNotifications: false,
      soundNotifications: true,
      soundVolume: 55,
    };
  }
}

function saveSettings() {
  localStorage.setItem(localSettingsKey, JSON.stringify(state.settings));
}

function usernameToEmail(username) {
  return `${normalizeUsername(username)}@${usernameDomain}`;
}

function normalizeUsername(username) {
  return username.trim().replace(/\s+/g, "").toLowerCase();
}

function setAuthMode(mode) {
  const creating = mode === "create";
  elements.createForm.classList.toggle("hidden", !creating);
  elements.signInForm.classList.toggle("hidden", creating);
  elements.showCreate.classList.toggle("active", creating);
  elements.showSignIn.classList.toggle("active", !creating);
  elements.authMessage.textContent = creating
    ? "Create a username and password. Chrome can save it after submit."
    : "Sign in with your username and password, or use Google.";
}

function showAuthMessage(message) {
  elements.authMessage.textContent = message;
}

function setAuthDisabled(disabled) {
  elements.signInSubmit.disabled = disabled;
  elements.createSubmit.disabled = disabled;
  elements.googleButton.disabled = disabled;
}

function formatError(error) {
  const code = error?.code ?? "";
  if (code.includes("auth/email-already-in-use")) return "That username is already taken.";
  if (code.includes("auth/invalid-credential") || code.includes("auth/wrong-password")) return "Username or password is incorrect.";
  if (code.includes("auth/popup-closed-by-user")) return "Google sign-in was closed before finishing.";
  if (code.includes("permission-denied")) return "Firebase security rules blocked this action.";
  return error?.message ?? "Something went wrong.";
}

async function createAccount(event) {
  event.preventDefault();
  if (!auth) return showAuthMessage("Add Firebase config first to create real global accounts.");

  const username = normalizeUsername(document.querySelector("#createUsername").value);
  const password = document.querySelector("#createPassword").value;
  setAuthDisabled(true);

  try {
    const credential = await createUserWithEmailAndPassword(auth, usernameToEmail(username), password);
    await updateProfile(credential.user, { displayName: username });
    await upsertUserProfile(credential.user, { displayName: username, username, avatar: defaultAvatar });
    elements.createForm.reset();
  } catch (error) {
    showAuthMessage(formatError(error));
  } finally {
    setAuthDisabled(false);
  }
}

async function signIn(event) {
  event.preventDefault();
  if (!auth) return showAuthMessage("Add Firebase config first to sign in globally.");

  const username = normalizeUsername(document.querySelector("#signInUsername").value);
  const password = document.querySelector("#signInPassword").value;
  setAuthDisabled(true);

  try {
    await signInWithEmailAndPassword(auth, usernameToEmail(username), password);
    elements.signInForm.reset();
  } catch (error) {
    showAuthMessage(formatError(error));
  } finally {
    setAuthDisabled(false);
  }
}

async function signInGoogle() {
  if (!auth) return showAuthMessage("Add Firebase config first to use Google sign-in.");
  try {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);
    await upsertUserProfile(credential.user);
  } catch (error) {
    showAuthMessage(formatError(error));
  }
}

async function upsertUserProfile(user, overrides = {}) {
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);
  const fallbackName = user.displayName || user.email?.split("@")[0] || "Global user";
  const previous = snapshot.exists() ? snapshot.data() : {};
  const profile = {
    uid: user.uid,
    username: overrides.username || previous.username || normalizeUsername(fallbackName),
    displayName: overrides.displayName || previous.displayName || fallbackName,
    avatar: overrides.avatar || previous.avatar || user.photoURL || defaultAvatar,
    updatedAt: serverTimestamp(),
  };
  await setDoc(userRef, profile, { merge: true });
}

async function saveProfile(event) {
  event.preventDefault();
  if (!currentUser) return;

  const displayName = elements.profileName.value.trim() || currentUser.displayName || "Global user";
  const avatar = currentAvatarData || elements.profileAvatar.value.trim() || defaultAvatar;

  try {
    const authProfile = { displayName };
    if (!avatar.startsWith("data:")) {
      authProfile.photoURL = avatar;
    }
    await updateProfile(currentUser, authProfile);
    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        uid: currentUser.uid,
        displayName,
        avatar,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    elements.settingsDialog.close();
  } catch (error) {
    alert(formatError(error));
  }
}

async function sendMessage(event) {
  event.preventDefault();
  const text = elements.messageInput.value.trim();
  if (!text || !currentUser || !db) return;

  const profile = getUserProfile(currentUser.uid);
  elements.messageInput.value = "";

  try {
    await addDoc(collection(db, "messages"), {
      uid: currentUser.uid,
      text,
      displayName: profile.displayName,
      avatar: profile.avatar,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    elements.messageInput.value = text;
    alert(formatError(error));
  }
}

function subscribeToMessages() {
  unsubscribeMessages?.();
  const messagesQuery = query(collection(db, "messages"), orderBy("createdAt", "asc"), limit(200));
  unsubscribeMessages = onSnapshot(
    messagesQuery,
    (snapshot) => {
      state.messages = snapshot.docs.map((messageDoc) => ({
        id: messageDoc.id,
        ...messageDoc.data(),
      }));
      renderMessages();
      handleIncomingNotification();
      messagesLoaded = true;
    },
    (error) => {
      elements.roomStatus.textContent = formatError(error);
    },
  );
}

function subscribeToUsers() {
  unsubscribeUsers?.();
  unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
    state.users = new Map(snapshot.docs.map((userDoc) => [userDoc.id, { id: userDoc.id, ...userDoc.data() }]));
    renderCurrentUser();
    renderMembers();
    renderMessages();
  });
}

function handleIncomingNotification() {
  const newest = state.messages.at(-1);
  if (!newest || newest.id === latestMessageId) return;
  const isOwnMessage = newest.uid === currentUser?.uid;
  latestMessageId = newest.id;
  if (!messagesLoaded || isOwnMessage) return;

  if (state.settings.soundNotifications) {
    playNotificationSound();
  }

  if (state.settings.desktopNotifications && Notification.permission === "granted" && document.hidden) {
    new Notification(`${newest.displayName || "GlobalChat"}`, {
      body: newest.text,
      icon: newest.avatar || defaultAvatar,
    });
  }
}

function getUserProfile(uid) {
  const stored = state.users.get(uid);
  if (stored) return stored;
  return {
    uid,
    displayName: currentUser?.displayName || "Global user",
    avatar: currentUser?.photoURL || defaultAvatar,
  };
}

function renderMessages() {
  if (!currentUser) return;
  elements.roomStatus.textContent = `${state.messages.length} global messages`;

  if (state.messages.length === 0) {
    elements.messages.innerHTML = `<p class="empty-state">No global messages yet. Start the first conversation in #global.</p>`;
    return;
  }

  elements.messages.innerHTML = state.messages
    .map((message) => {
      const liveProfile = getUserProfile(message.uid);
      const displayName = liveProfile.displayName || message.displayName || "Global user";
      const avatar = liveProfile.avatar || message.avatar || defaultAvatar;
      const createdAt = message.createdAt?.toDate ? message.createdAt.toDate() : new Date();

      return `
        <article class="message">
          <img class="message-avatar" src="${escapeHtml(avatar)}" alt="" />
          <div>
            <div class="message-meta">
              <span class="message-name">${escapeHtml(displayName)}</span>
              <time class="message-time" datetime="${createdAt.toISOString()}">${formatTime(createdAt)}</time>
            </div>
            <div class="message-text">${escapeHtml(message.text || "")}</div>
          </div>
        </article>
      `;
    })
    .join("");

  elements.messages.scrollTop = elements.messages.scrollHeight;
}

function renderCurrentUser() {
  if (!currentUser) return;
  const profile = getUserProfile(currentUser.uid);
  const displayName = profile.displayName || currentUser.displayName || "Global user";
  const avatar = profile.avatar || currentUser.photoURL || defaultAvatar;

  elements.currentName.textContent = displayName;
  elements.currentAvatar.src = avatar;
  elements.connectionStatus.textContent = "Online";
  elements.profileName.value = displayName;
  elements.profileAvatar.value = avatar.startsWith("data:") ? "" : avatar;
  elements.avatarPreview.src = avatar;
  currentAvatarData = avatar;
  elements.accountName.textContent = displayName;
  elements.accountId.textContent = currentUser.email || currentUser.uid;
}

function renderMembers() {
  const members = [...state.users.values()].sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""));
  elements.memberList.innerHTML = members
    .map(
      (user) => `
        <div class="member">
          <img src="${escapeHtml(user.avatar || defaultAvatar)}" alt="" />
          <strong>${escapeHtml(user.displayName || user.username || "Global user")}</strong>
        </div>
      `,
    )
    .join("");
}

function formatTime(date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function openSettings(tab = "profile") {
  setSettingsTab(tab);
  elements.settingsDialog.showModal();
}

function setSettingsTab(tab) {
  const titles = {
    profile: "Profile",
    notifications: "Notifications",
    account: "Account",
  };
  elements.settingsTitle.textContent = titles[tab];
  elements.settingsTabs.forEach((button) => button.classList.toggle("active", button.dataset.settingsTab === tab));
  elements.profileSettings.classList.toggle("hidden", tab !== "profile");
  elements.notificationSettings.classList.toggle("hidden", tab !== "notifications");
  elements.accountSettings.classList.toggle("hidden", tab !== "account");
}

async function resizeImage(file) {
  const bitmap = await createImageBitmap(file);
  const maxSize = 256;
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

async function handleAvatarUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) return alert("Choose an image file.");
  if (file.size > 4 * 1024 * 1024) return alert("Choose an image smaller than 4 MB.");

  currentAvatarData = await resizeImage(file);
  elements.avatarPreview.src = currentAvatarData;
  elements.profileAvatar.value = "";
}

function requestNotificationPermission(enabled) {
  if (!enabled) return;
  if (!("Notification" in window)) {
    alert("This browser does not support desktop notifications.");
    elements.desktopNotifications.checked = false;
    state.settings.desktopNotifications = false;
    saveSettings();
    return;
  }
  if (Notification.permission === "default") {
    Notification.requestPermission().then((permission) => {
      state.settings.desktopNotifications = permission === "granted";
      elements.desktopNotifications.checked = state.settings.desktopNotifications;
      saveSettings();
    });
  }
}

function playNotificationSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  const gain = context.createGain();
  const oscillator = context.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(740, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(520, context.currentTime + 0.12);
  gain.gain.setValueAtTime((state.settings.soundVolume / 100) * 0.18, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.18);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.18);
}

function renderSettings() {
  elements.desktopNotifications.checked = state.settings.desktopNotifications;
  elements.soundNotifications.checked = state.settings.soundNotifications;
  elements.soundVolume.value = state.settings.soundVolume;
  elements.soundQuickButton.textContent = state.settings.soundNotifications ? "Sound on" : "Sound off";
}

async function logOut() {
  await firebaseSignOut(auth);
  elements.settingsDialog.close();
}

function showSignedOut() {
  currentUser = null;
  unsubscribeMessages?.();
  unsubscribeUsers?.();
  unsubscribeMessages = null;
  unsubscribeUsers = null;
  messagesLoaded = false;
  latestMessageId = null;
  state.messages = [];
  state.users = new Map();
  elements.authView.classList.remove("hidden");
  elements.chatView.classList.add("hidden");
}

async function showSignedIn(user) {
  currentUser = user;
  await upsertUserProfile(user);
  elements.authView.classList.add("hidden");
  elements.chatView.classList.remove("hidden");
  elements.connectionStatus.textContent = "Online";
  subscribeToUsers();
  subscribeToMessages();
  elements.messageInput.focus();
}

function initFirebase() {
  if (!hasFirebaseConfig()) {
    elements.setupWarning.classList.remove("hidden");
    setAuthDisabled(true);
    showAuthMessage("Create a Firebase project, then paste the config into firebase-config.js.");
    return;
  }

  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  onAuthStateChanged(auth, (user) => {
    if (user) {
      showSignedIn(user).catch((error) => showAuthMessage(formatError(error)));
    } else {
      showSignedOut();
    }
  });
}

elements.showSignIn.addEventListener("click", () => setAuthMode("sign-in"));
elements.showCreate.addEventListener("click", () => setAuthMode("create"));
elements.createForm.addEventListener("submit", createAccount);
elements.signInForm.addEventListener("submit", signIn);
elements.googleButton.addEventListener("click", signInGoogle);
elements.messageForm.addEventListener("submit", sendMessage);
elements.settingsButton.addEventListener("click", () => openSettings("profile"));
elements.settingsRailButton.addEventListener("click", () => openSettings("profile"));
elements.closeSettingsButton.addEventListener("click", () => elements.settingsDialog.close());
elements.settingsTabs.forEach((button) => {
  button.addEventListener("click", () => setSettingsTab(button.dataset.settingsTab));
});
elements.settingsForm.addEventListener("submit", saveProfile);
elements.avatarFile.addEventListener("change", handleAvatarUpload);
elements.profileAvatar.addEventListener("input", () => {
  currentAvatarData = elements.profileAvatar.value.trim() || defaultAvatar;
  elements.avatarPreview.src = currentAvatarData;
});
elements.removeAvatarButton.addEventListener("click", () => {
  currentAvatarData = defaultAvatar;
  elements.profileAvatar.value = "";
  elements.avatarPreview.src = defaultAvatar;
});
elements.desktopNotifications.addEventListener("change", () => {
  state.settings.desktopNotifications = elements.desktopNotifications.checked;
  saveSettings();
  requestNotificationPermission(state.settings.desktopNotifications);
});
elements.soundNotifications.addEventListener("change", () => {
  state.settings.soundNotifications = elements.soundNotifications.checked;
  saveSettings();
  renderSettings();
});
elements.soundVolume.addEventListener("input", () => {
  state.settings.soundVolume = Number(elements.soundVolume.value);
  saveSettings();
});
elements.soundQuickButton.addEventListener("click", () => {
  state.settings.soundNotifications = !state.settings.soundNotifications;
  saveSettings();
  renderSettings();
});
elements.testSoundButton.addEventListener("click", playNotificationSound);
elements.clearLocalButton.addEventListener("click", () => {
  localStorage.removeItem(localSettingsKey);
  state.settings = readSettings();
  renderSettings();
});
elements.signOutButton.addEventListener("click", logOut);

renderSettings();
initFirebase();
