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
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
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
  globalTextButton: document.querySelector("#globalTextButton"),
  activeChannelIcon: document.querySelector("#activeChannelIcon"),
  activeChannelName: document.querySelector("#activeChannelName"),
  memberHeading: document.querySelector("#memberHeading"),
  voiceStage: document.querySelector("#voiceStage"),
  voiceRoomType: document.querySelector("#voiceRoomType"),
  voiceRoomName: document.querySelector("#voiceRoomName"),
  voiceRoomMeta: document.querySelector("#voiceRoomMeta"),
  voiceRoomCode: document.querySelector("#voiceRoomCode"),
  voiceRoomCodeBox: document.querySelector("#voiceRoomCodeBox"),
  hostTools: document.querySelector("#hostTools"),
  hostRoomNameInput: document.querySelector("#hostRoomNameInput"),
  renameRoomButton: document.querySelector("#renameRoomButton"),
  createVoiceRoomButton: document.querySelector("#createVoiceRoomButton"),
  joinVoiceRoomButton: document.querySelector("#joinVoiceRoomButton"),
  createRoomDialog: document.querySelector("#createRoomDialog"),
  joinRoomDialog: document.querySelector("#joinRoomDialog"),
  createRoomForm: document.querySelector("#createRoomForm"),
  newRoomName: document.querySelector("#newRoomName"),
  newRoomPrivate: document.querySelector("#newRoomPrivate"),
  joinCodeForm: document.querySelector("#joinCodeForm"),
  joinCodeInput: document.querySelector("#joinCodeInput"),
  publicRoomList: document.querySelector("#publicRoomList"),
  prevRoomsButton: document.querySelector("#prevRoomsButton"),
  nextRoomsButton: document.querySelector("#nextRoomsButton"),
  roomPageLabel: document.querySelector("#roomPageLabel"),
  micButton: document.querySelector("#micButton"),
  cameraButton: document.querySelector("#cameraButton"),
  screenShareButton: document.querySelector("#screenShareButton"),
  leaveVoiceButton: document.querySelector("#leaveVoiceButton"),
  cameraPreview: document.querySelector("#cameraPreview"),
  screenPreview: document.querySelector("#screenPreview"),
  cameraPlaceholder: document.querySelector("#cameraPlaceholder"),
  screenPlaceholder: document.querySelector("#screenPlaceholder"),
  localMediaLabel: document.querySelector("#localMediaLabel"),
  accountName: document.querySelector("#accountName"),
  accountId: document.querySelector("#accountId"),
  clearLocalButton: document.querySelector("#clearLocalButton"),
  signOutButton: document.querySelector("#signOutButton"),
  audioSettings: document.querySelector("#audioSettings"),
  audioInputSelect: document.querySelector("#audioInputSelect"),
  audioOutputSelect: document.querySelector("#audioOutputSelect"),
  cameraSelect: document.querySelector("#cameraSelect"),
  micVolume: document.querySelector("#micVolume"),
  speakerVolume: document.querySelector("#speakerVolume"),
  cameraSaturation: document.querySelector("#cameraSaturation"),
  cameraBrightness: document.querySelector("#cameraBrightness"),
  cameraContrast: document.querySelector("#cameraContrast"),
  cameraSharpness: document.querySelector("#cameraSharpness"),
  micVolumeValue: document.querySelector("#micVolumeValue"),
  speakerVolumeValue: document.querySelector("#speakerVolumeValue"),
  cameraSaturationValue: document.querySelector("#cameraSaturationValue"),
  cameraBrightnessValue: document.querySelector("#cameraBrightnessValue"),
  cameraContrastValue: document.querySelector("#cameraContrastValue"),
  cameraSharpnessValue: document.querySelector("#cameraSharpnessValue"),
  refreshDevicesButton: document.querySelector("#refreshDevicesButton"),
};

let auth = null;
let db = null;
let currentUser = null;
let unsubscribeMessages = null;
let unsubscribeUsers = null;
let unsubscribeVoiceRooms = null;
let messagesLoaded = false;
let latestMessageId = null;
let currentAvatarData = defaultAvatar;
let localAudioStream = null;
let localVideoStream = null;
let screenStream = null;

const state = {
  messages: [],
  users: new Map(),
  voiceRooms: [],
  currentView: "text",
  activeVoiceRoom: null,
  roomPage: 0,
  settings: readSettings(),
};

const officialVoiceRooms = {
  lounge: { id: "official-lounge", name: "Lounge", code: "LOUNGE", type: "official" },
  gaming: { id: "official-gaming", name: "Gaming", code: "GAMING", type: "official" },
  study: { id: "official-study", name: "Study", code: "STUDY", type: "official" },
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
      micVolume: 100,
      speakerVolume: 100,
      cameraSaturation: 100,
      cameraBrightness: 100,
      cameraContrast: 100,
      cameraSharpness: 100,
      ...JSON.parse(localStorage.getItem(localSettingsKey)),
    };
  } catch {
    return {
      desktopNotifications: false,
      soundNotifications: true,
      soundVolume: 55,
      micVolume: 100,
      speakerVolume: 100,
      cameraSaturation: 100,
      cameraBrightness: 100,
      cameraContrast: 100,
      cameraSharpness: 100,
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
  if (code.includes("permission-denied")) {
    return "Firestore security rules blocked this action. Paste firestore.rules into Firebase Console > Firestore Database > Rules, then publish.";
  }
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

function showTextChat() {
  state.currentView = "text";
  state.activeVoiceRoom = null;
  elements.messages.classList.remove("hidden");
  elements.messageForm.classList.remove("hidden");
  elements.voiceStage.classList.add("hidden");
  elements.activeChannelIcon.textContent = "#";
  elements.activeChannelName.textContent = "global";
  elements.memberHeading.textContent = "Online";
  elements.roomStatus.textContent = `${state.messages.length} global messages`;
  document.querySelectorAll(".channel").forEach((button) => button.classList.remove("active"));
  elements.globalTextButton.classList.add("active");
  renderMembers();
  stopLocalMedia();
}

async function joinOfficialVoiceRoom(roomKey) {
  await leaveCurrentVoiceRoom(false);
  const room = officialVoiceRooms[roomKey];
  const roomRef = doc(db, "voiceRooms", room.id);
  await setDoc(
    roomRef,
    {
      ...room,
      isPrivate: true,
      hostUid: currentUser.uid,
      hostName: "GlobalChat",
      participants: arrayUnion(currentUser.uid),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  const snapshot = await getDoc(roomRef);
  state.activeVoiceRoom = {
    id: room.id,
    ...room,
    ...snapshot.data(),
    isPrivate: false,
  };
  renderVoiceRoom();
  await startAudio();
}

function generateRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

async function createVoiceRoom(event) {
  event.preventDefault();
  if (!currentUser) return;
  const profile = getUserProfile(currentUser.uid);
  const room = {
    name: elements.newRoomName.value.trim(),
    code: generateRoomCode(),
    isPrivate: elements.newRoomPrivate.checked,
    hostUid: currentUser.uid,
    hostName: profile.displayName,
    participants: [currentUser.uid],
    type: "unofficial",
    startedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const created = await addDoc(collection(db, "voiceRooms"), room);
  elements.createRoomForm.reset();
  elements.createRoomDialog.close();
  await joinUnofficialVoiceRoom(created.id);
}

async function joinUnofficialVoiceRoom(roomId) {
  await leaveCurrentVoiceRoom(false);
  const roomRef = doc(db, "voiceRooms", roomId);
  const snapshot = await getDoc(roomRef);
  if (!snapshot.exists()) {
    alert("That voice server no longer exists.");
    return;
  }
  await updateDoc(roomRef, {
    participants: arrayUnion(currentUser.uid),
    updatedAt: serverTimestamp(),
  });
  state.activeVoiceRoom = { id: snapshot.id, ...snapshot.data(), participants: [...(snapshot.data().participants || []), currentUser.uid] };
  renderVoiceRoom();
  await startAudio();
}

async function joinRoomByCode(event) {
  event.preventDefault();
  const code = elements.joinCodeInput.value.trim().toUpperCase();
  if (!code) return;
  const roomQuery = query(collection(db, "voiceRooms"), where("code", "==", code), limit(1));
  const snapshot = await getDocs(roomQuery);
  if (snapshot.empty) {
    alert("No server found with that code.");
    return;
  }
  elements.joinRoomDialog.close();
  await joinUnofficialVoiceRoom(snapshot.docs[0].id);
}

async function leaveCurrentVoiceRoom(showText = true) {
  const room = state.activeVoiceRoom;
  if (room?.type === "official" && currentUser) {
    await updateDoc(doc(db, "voiceRooms", room.id), {
      participants: arrayRemove(currentUser.uid),
      updatedAt: serverTimestamp(),
    }).catch(() => {});
  }
  if (room?.type === "unofficial" && currentUser) {
    const participants = (room.participants || []).filter((uid) => uid !== currentUser.uid);
    const roomRef = doc(db, "voiceRooms", room.id);
    if (participants.length === 0) {
      await deleteDoc(roomRef).catch(() => updateDoc(roomRef, { participants: arrayRemove(currentUser.uid) }));
    } else {
      await updateDoc(roomRef, {
        participants: arrayRemove(currentUser.uid),
        updatedAt: serverTimestamp(),
      });
    }
  }
  state.activeVoiceRoom = null;
  stopLocalMedia();
  if (showText) showTextChat();
}

async function renameActiveRoom() {
  const room = state.activeVoiceRoom;
  if (!room || room.type !== "unofficial" || room.hostUid !== currentUser?.uid) return;
  const name = elements.hostRoomNameInput.value.trim();
  if (!name) return;
  await updateDoc(doc(db, "voiceRooms", room.id), {
    name,
    updatedAt: serverTimestamp(),
  });
  state.activeVoiceRoom.name = name;
  renderVoiceRoom();
}

function subscribeToVoiceRooms() {
  unsubscribeVoiceRooms?.();
  const roomQuery = query(collection(db, "voiceRooms"), orderBy("startedAt", "desc"), limit(80));
  unsubscribeVoiceRooms = onSnapshot(roomQuery, (snapshot) => {
    state.voiceRooms = snapshot.docs.map((roomDoc) => ({ id: roomDoc.id, ...roomDoc.data() }));
    if (state.activeVoiceRoom?.type === "unofficial") {
      const freshRoom = state.voiceRooms.find((room) => room.id === state.activeVoiceRoom.id);
      if (freshRoom) {
        state.activeVoiceRoom = freshRoom;
      } else {
        leaveCurrentVoiceRoom(true);
      }
      renderVoiceRoom();
    }
    renderPublicRooms();
  });
}

function renderVoiceRoom() {
  const room = state.activeVoiceRoom;
  if (!room) return;
  state.currentView = "voice";
  elements.messages.classList.add("hidden");
  elements.messageForm.classList.add("hidden");
  elements.voiceStage.classList.remove("hidden");
  elements.activeChannelIcon.textContent = "🔊";
  elements.activeChannelName.textContent = room.name;
  elements.voiceRoomType.textContent = room.type === "official" ? "Official voice" : room.isPrivate ? "Private voice" : "Public voice";
  elements.voiceRoomName.textContent = room.name;
  elements.voiceRoomCode.textContent = room.code || "OFFICIAL";
  elements.voiceRoomCodeBox.classList.toggle("hidden", room.type === "official");
  elements.voiceRoomMeta.textContent =
    room.type === "official"
      ? "Official GlobalChat voice server."
      : `Hosted by ${room.hostName || "Unknown"} • Started ${formatStartedAt(room.startedAt)}`;
  elements.hostTools.classList.toggle("hidden", room.type !== "unofficial" || room.hostUid !== currentUser?.uid);
  elements.hostRoomNameInput.value = room.name;
  elements.roomStatus.textContent = room.type === "official" ? "Official voice server" : `Join code ${room.code}`;
  elements.memberHeading.textContent = "In voice";

  document.querySelectorAll(".channel").forEach((button) => button.classList.remove("active"));
  const officialKey = Object.keys(officialVoiceRooms).find((key) => officialVoiceRooms[key].id === room.id);
  if (officialKey) {
    document.querySelector(`[data-official-room="${officialKey}"]`)?.classList.add("active");
  }
  renderVoiceMembers();
}

function renderVoiceMembers() {
  const room = state.activeVoiceRoom;
  const participantIds = room?.participants || [currentUser?.uid].filter(Boolean);
  elements.memberList.innerHTML = participantIds
    .map((uid) => {
      const user = getUserProfile(uid);
      return `
        <div class="member">
          <img src="${escapeHtml(user.avatar || defaultAvatar)}" alt="" />
          <strong>${escapeHtml(user.displayName || "Global user")}</strong>
        </div>
      `;
    })
    .join("");
}

function renderPublicRooms() {
  const pageSize = 5;
  const publicRooms = state.voiceRooms.filter((room) => room.type === "unofficial" && !room.isPrivate);
  const pageCount = Math.max(1, Math.ceil(publicRooms.length / pageSize));
  state.roomPage = Math.min(state.roomPage, pageCount - 1);
  const pageRooms = publicRooms.slice(state.roomPage * pageSize, state.roomPage * pageSize + pageSize);
  elements.roomPageLabel.textContent = `Page ${state.roomPage + 1} of ${pageCount}`;
  elements.prevRoomsButton.disabled = state.roomPage === 0;
  elements.nextRoomsButton.disabled = state.roomPage >= pageCount - 1;
  elements.publicRoomList.innerHTML =
    pageRooms
      .map(
        (room) => `
          <div class="public-room">
            <div>
              <strong>${escapeHtml(room.name)}</strong>
              <span>Host: ${escapeHtml(room.hostName || "Unknown")} • Started ${formatStartedAt(room.startedAt)}</span>
            </div>
            <button class="secondary-button" type="button" data-join-room="${escapeHtml(room.id)}">Join</button>
          </div>
        `,
      )
      .join("") || `<p class="empty-state">No public unofficial voice servers right now.</p>`;
}

function formatStartedAt(value) {
  const date = value?.toDate ? value.toDate() : null;
  if (!date) return "just now";
  return formatTime(date);
}

async function loadDevices() {
  if (!navigator.mediaDevices?.enumerateDevices) return;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    fillDeviceSelect(elements.audioInputSelect, devices.filter((device) => device.kind === "audioinput"), "Default microphone");
    fillDeviceSelect(elements.audioOutputSelect, devices.filter((device) => device.kind === "audiooutput"), "Default speaker");
    fillDeviceSelect(elements.cameraSelect, devices.filter((device) => device.kind === "videoinput"), "Default camera");
  } catch (error) {
    console.warn(error);
  }
}

function fillDeviceSelect(select, devices, fallbackLabel) {
  const currentValue = select.value;
  select.innerHTML = `<option value="">${fallbackLabel}</option>${devices
    .map((device, index) => `<option value="${escapeHtml(device.deviceId)}">${escapeHtml(device.label || `${fallbackLabel} ${index + 1}`)}</option>`)
    .join("")}`;
  select.value = [...select.options].some((option) => option.value === currentValue) ? currentValue : "";
}

async function startAudio() {
  stopAudio();
  try {
    const constraints = {
      audio: {
        deviceId: elements.audioInputSelect.value ? { exact: elements.audioInputSelect.value } : undefined,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    };
    localAudioStream = await navigator.mediaDevices.getUserMedia(constraints);
    applyMicState(true);
    await loadDevices();
  } catch (error) {
    elements.micButton.textContent = "Mic blocked";
    elements.micButton.classList.remove("active");
  }
}

async function toggleMic() {
  if (!localAudioStream) {
    await startAudio();
    return;
  }
  const enabled = !localAudioStream.getAudioTracks().some((track) => track.enabled);
  applyMicState(enabled);
}

function applyMicState(enabled) {
  localAudioStream?.getAudioTracks().forEach((track) => {
    track.enabled = enabled;
  });
  elements.micButton.textContent = enabled ? "Mic on" : "Mic off";
  elements.micButton.classList.toggle("active", enabled);
}

function stopAudio() {
  localAudioStream?.getTracks().forEach((track) => track.stop());
  localAudioStream = null;
}

async function toggleCamera() {
  if (localVideoStream) {
    stopCamera();
    return;
  }
  try {
    const constraints = {
      video: {
        deviceId: elements.cameraSelect.value ? { exact: elements.cameraSelect.value } : undefined,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    };
    localVideoStream = await navigator.mediaDevices.getUserMedia(constraints);
    elements.cameraPreview.srcObject = localVideoStream;
    elements.cameraPlaceholder.classList.add("hidden");
    elements.cameraButton.textContent = "Camera on";
    elements.cameraButton.classList.add("active");
    await loadDevices();
  } catch (error) {
    alert("Camera could not start. Check browser permission and device settings.");
  }
}

function stopCamera() {
  localVideoStream?.getTracks().forEach((track) => track.stop());
  localVideoStream = null;
  elements.cameraPreview.srcObject = null;
  elements.cameraPlaceholder.classList.remove("hidden");
  elements.cameraButton.textContent = "Camera off";
  elements.cameraButton.classList.remove("active");
}

async function toggleScreenShare() {
  if (screenStream) {
    stopScreenShare();
    return;
  }
  try {
    screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    elements.screenPreview.srcObject = screenStream;
    elements.screenPlaceholder.classList.add("hidden");
    elements.screenShareButton.textContent = "Stop sharing";
    elements.screenShareButton.classList.add("active");
    screenStream.getVideoTracks()[0]?.addEventListener("ended", stopScreenShare);
  } catch (error) {
    alert("Screen sharing was cancelled or blocked.");
  }
}

function stopScreenShare() {
  screenStream?.getTracks().forEach((track) => track.stop());
  screenStream = null;
  elements.screenPreview.srcObject = null;
  elements.screenPlaceholder.classList.remove("hidden");
  elements.screenShareButton.textContent = "Share screen beta";
  elements.screenShareButton.classList.remove("active");
}

function stopLocalMedia() {
  stopAudio();
  stopCamera();
  stopScreenShare();
}

function applyMediaSettings() {
  const settings = state.settings;
  elements.micVolume.value = settings.micVolume;
  elements.speakerVolume.value = settings.speakerVolume;
  elements.cameraSaturation.value = settings.cameraSaturation;
  elements.cameraBrightness.value = settings.cameraBrightness;
  elements.cameraContrast.value = settings.cameraContrast;
  elements.cameraSharpness.value = settings.cameraSharpness;
  elements.micVolumeValue.textContent = `${settings.micVolume}%`;
  elements.speakerVolumeValue.textContent = `${settings.speakerVolume}%`;
  elements.cameraSaturationValue.textContent = `${settings.cameraSaturation}%`;
  elements.cameraBrightnessValue.textContent = `${settings.cameraBrightness}%`;
  elements.cameraContrastValue.textContent = `${settings.cameraContrast}%`;
  elements.cameraSharpnessValue.textContent = `${settings.cameraSharpness}%`;
  elements.cameraPreview.style.filter = `saturate(${settings.cameraSaturation}%) brightness(${settings.cameraBrightness}%) contrast(${settings.cameraContrast}%)`;
  elements.cameraPreview.style.imageRendering = settings.cameraSharpness > 120 ? "crisp-edges" : "auto";
}

function updateMediaSetting(key, value) {
  state.settings[key] = Number(value);
  saveSettings();
  applyMediaSettings();
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
  if (state.currentView === "voice") {
    renderVoiceMembers();
    return;
  }
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
    audio: "Audio & Video",
    account: "Account",
  };
  elements.settingsTitle.textContent = titles[tab];
  elements.settingsTabs.forEach((button) => button.classList.toggle("active", button.dataset.settingsTab === tab));
  elements.profileSettings.classList.toggle("hidden", tab !== "profile");
  elements.notificationSettings.classList.toggle("hidden", tab !== "notifications");
  elements.audioSettings.classList.toggle("hidden", tab !== "audio");
  elements.accountSettings.classList.toggle("hidden", tab !== "account");
  if (tab === "audio") loadDevices();
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
  applyMediaSettings();
}

async function logOut() {
  await leaveCurrentVoiceRoom(false);
  await firebaseSignOut(auth);
  elements.settingsDialog.close();
}

function showSignedOut() {
  currentUser = null;
  unsubscribeMessages?.();
  unsubscribeUsers?.();
  unsubscribeVoiceRooms?.();
  unsubscribeMessages = null;
  unsubscribeUsers = null;
  unsubscribeVoiceRooms = null;
  messagesLoaded = false;
  latestMessageId = null;
  state.messages = [];
  state.users = new Map();
  state.voiceRooms = [];
  stopLocalMedia();
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
  subscribeToVoiceRooms();
  loadDevices();
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
elements.globalTextButton.addEventListener("click", showTextChat);
document.querySelectorAll("[data-official-room]").forEach((button) => {
  button.addEventListener("click", () => joinOfficialVoiceRoom(button.dataset.officialRoom));
});
elements.createVoiceRoomButton.addEventListener("click", () => elements.createRoomDialog.showModal());
elements.joinVoiceRoomButton.addEventListener("click", () => {
  renderPublicRooms();
  elements.joinRoomDialog.showModal();
});
elements.createRoomForm.addEventListener("submit", createVoiceRoom);
elements.joinCodeForm.addEventListener("submit", joinRoomByCode);
elements.publicRoomList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-join-room]");
  if (!button) return;
  elements.joinRoomDialog.close();
  joinUnofficialVoiceRoom(button.dataset.joinRoom);
});
elements.prevRoomsButton.addEventListener("click", () => {
  state.roomPage = Math.max(0, state.roomPage - 1);
  renderPublicRooms();
});
elements.nextRoomsButton.addEventListener("click", () => {
  state.roomPage += 1;
  renderPublicRooms();
});
document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => document.querySelector(`#${button.dataset.closeDialog}`).close());
});
elements.renameRoomButton.addEventListener("click", renameActiveRoom);
elements.micButton.addEventListener("click", toggleMic);
elements.cameraButton.addEventListener("click", toggleCamera);
elements.screenShareButton.addEventListener("click", toggleScreenShare);
elements.leaveVoiceButton.addEventListener("click", () => leaveCurrentVoiceRoom(true));
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
elements.refreshDevicesButton.addEventListener("click", loadDevices);
elements.audioInputSelect.addEventListener("change", () => {
  if (localAudioStream) startAudio();
});
elements.cameraSelect.addEventListener("change", () => {
  if (localVideoStream) {
    stopCamera();
    toggleCamera();
  }
});
elements.audioOutputSelect.addEventListener("change", () => {
  if ("setSinkId" in HTMLMediaElement.prototype) {
    elements.screenPreview.setSinkId?.(elements.audioOutputSelect.value).catch(() => {});
  }
});
elements.micVolume.addEventListener("input", () => updateMediaSetting("micVolume", elements.micVolume.value));
elements.speakerVolume.addEventListener("input", () => updateMediaSetting("speakerVolume", elements.speakerVolume.value));
elements.cameraSaturation.addEventListener("input", () => updateMediaSetting("cameraSaturation", elements.cameraSaturation.value));
elements.cameraBrightness.addEventListener("input", () => updateMediaSetting("cameraBrightness", elements.cameraBrightness.value));
elements.cameraContrast.addEventListener("input", () => updateMediaSetting("cameraContrast", elements.cameraContrast.value));
elements.cameraSharpness.addEventListener("input", () => updateMediaSetting("cameraSharpness", elements.cameraSharpness.value));
elements.clearLocalButton.addEventListener("click", () => {
  localStorage.removeItem(localSettingsKey);
  state.settings = readSettings();
  renderSettings();
});
elements.signOutButton.addEventListener("click", logOut);
window.addEventListener("pagehide", () => {
  leaveCurrentVoiceRoom(false);
});

renderSettings();
initFirebase();
