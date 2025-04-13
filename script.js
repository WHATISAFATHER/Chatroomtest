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
  imageInput: document.getElementById("imageInput")
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
  const imageFile = DOM.imageInput.files[0];

  if (!text && !imageFile) return;

  if ((text.startsWith("/kick ") || text.startsWith("/ban ") || text.startsWith("/timeout ")) && !isMod) {
    alert("Only moderators can use this command.");
    return;
  }

  if (imageFile) {
    const reader = new FileReader();
    reader.onload = () => {
      drone.publish({
        room: "observable-room",
        message: { type: "image", content: reader.result }
      });
    };
    reader.readAsDataURL(imageFile);
    DOM.imageInput.value = "";
  }

  if (text) {
    drone.publish({
      room: "observable-room",
      message: { type: "text", content: text }
    });
    DOM.input.value = "";
  }
});

let members = [];

drone.on("open", error => {
  if (error) return console.error(error);
  const room = drone.subscribe("observable-room");

  room.on("members", m => {
    members = m;
    updateMemberCount();
  });

  room.on("member_join", member => {
    members.push(member);
    updateMemberCount();
  });

  room.on("member_leave", ({ id }) => {
    members = members.filter(m => m.id !== id);
    updateMemberCount();
  });

  room.on("data", (message, member) => {
    if (!member || kicked) return;

    const sender = member.clientData.name;
    const isSenderMod = member.clientData.mod;
    const msg = message.content;

    if (message.type === "text") {
      if (msg.startsWith("/kick ") && isSenderMod) {
        const target = msg.split(" ")[1];
        if (target === myName) {
          kicked = true;
          document.getElementById("chat-container").style.display = "none";
          document.getElementById("kicked-screen").style.display = "block";
        }
        return;
      }

      if (msg.startsWith("/ban ") && isSenderMod) {
        const target = msg.split(" ")[1];
        if (target === myName && userIP) {
          bannedIPs.push(userIP);
          localStorage.setItem("bannedIPs", JSON.stringify(bannedIPs));
          document.getElementById("chat-container").style.display = "none";
          document.getElementById("banned-screen").style.display = "block";
        }
        return;
      }

      if (msg.startsWith("/timeout ") && isSenderMod) {
        const parts = msg.split(" ");
        const target = parts[1];
        const minutes
::contentReference[oaicite:3]{index=3}
 
