const CLIENT_ID = 'YwlHBeKbieWWPeOS';
const myName = "user_" + Math.floor(Math.random() * 10000);
let isMod = sessionStorage.getItem("isMod") === "true";
let kicked = false;
let userIP = null;
let timeoutInterval = null;

const DOM = {
  input: document.getElementById("input"),
  form: document.getElementById("form"),
  messages: document.getElementById("messages"),
  membersCount: document.getElementById("members-count"),
  timeoutScreen: document.getElementById("timeout-screen"),
  timeoutTimer: document.getElementById("timeout-timer"),
  fileInput: document.getElementById("file-input")
};

const bannedIPs = JSON.parse(localStorage.getItem("bannedIPs") || "[]");
const storedTimeouts = JSON.parse(localStorage.getItem("timeouts") || "{}");

fetch("https://api.ipify.org?format=json")
  .then(res => res.json())
  .then(data => {
    userIP = data.ip;

    if (bannedIPs.includes(userIP)) {
      document.getElementById("chat-container").style.display = "none";
      document.getElementById("banned-screen").style.display = "block";
      throw new Error("Banned IP");
    }

    if (storedTimeouts[userIP] && Date.now() < storedTimeouts[userIP]) {
      startTimeoutFromStorage(storedTimeouts[userIP]);
    }
  });

if (isMod) {
  document.getElementById("mod-login").style.display = "none";
}

document.getElementById("mod-login").addEventListener("click", () => {
  const u = prompt("Enter mod username:");
  const p = prompt("Enter mod password:");
  if (u === "admin" && p === "letmein") {
    sessionStorage.setItem("isMod", "true");
    alert("You're now a moderator. Reloading...");
    location.reload();
  } else {
    alert("Wrong credentials.");
  }
});

const drone = new ScaleDrone(CLIENT_ID, {
  data: { name: myName, mod: isMod }
});

DOM.form.addEventListener("submit", e => {
  e.preventDefault();

  if (DOM.input.disabled) {
    alert("You are currently timed out.");
    return;
  }

  const text = DOM.input.value.trim();
  const file = DOM.fileInput.files[0];

  if (!text && !file) return;

  if ((text.startsWith("/kick ") || text.starts
::contentReference[oaicite:4]{index=4}
 
