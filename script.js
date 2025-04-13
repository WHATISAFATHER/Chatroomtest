const CLIENT_ID = 'YwlHBeKbieWWPeOS';
const myName = "user_" + Math.floor(Math.random() * 10000);
let isMod = sessionStorage.getItem("isMod") === "true";
let kicked = false;
let userIP = null;
let timeoutInterval = null;

const bannedIPs = JSON.parse(localStorage.getItem("bannedIPs") || "[]");
const storedTimeouts = JSON.parse(localStorage.getItem("timeouts") || "{}");

const DOM = {
  input: document.getElementById("input"),
  form: document.getElementById("form"),
  messages: document.getElementById("messages"),
  membersCount: document.getElementById("members-count"),
  timeoutScreen: document.getElementById("timeout-screen"),
  timeoutTimer: document.getElementById("timeout-timer"),
  imageInput: document.getElementById("imageInput")
};

// Get IP address and enforce bans/timeouts
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

if (isMod) document.getElementById("mod-login").style.display = "none";

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
    alert("You are timed out.");
    return;
  }

  const text = DOM.input.value.trim();
  const file = DOM.imageInput.files[0];

  if (!text && !file) return;

  if (text.startsWith("/") && !isMod) {
    alert("Only moderators can use commands.");
    return;
  }

  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = () => {
      drone.publish({
        room: "observable-room",
        message: { type: "image", content: reader.result }
      });
    };
    reader.readAsDataURL(file);
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

    if (message.type === "text") {
      const msg = message.content;

      // Handle mod commands
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
        const minutes = parseInt(parts[2]);
        if (target === myName && minutes > 0) {
          const end = Date.now() + minutes * 60000;
          storedTimeouts[userIP] = end;
          localStorage.setItem("timeouts", JSON.stringify(storedTimeouts));
          startTimeoutFromStorage(end);
        }
        return;
      }

      const modTag = isSenderMod ? ' <span class="mod-tag">[MOD]</span>' : '';
      addMessage(`${sender}${modTag}: ${msg}`);
    }

    if (message.type === "image") {
      const div = document.createElement("div");
      div.className = "message";
      const name = document.createElement("strong");
      name.innerHTML = `${sender}${isSenderMod ? ' <span class="mod-tag">[MOD]</span>' : ''}:<br>`;
      const img = document.createElement("img");
      img.src = message.content;
      div.appendChild(name);
      div.appendChild(img);
      DOM.messages.appendChild(div);
      DOM.messages.scrollTop = DOM.messages.scrollHeight;
    }
  });
});

function updateMemberCount() {
  DOM.membersCount.textContent = `${members.length} members online`;
}

function addMessage(html) {
  const msg = document.createElement("div");
  msg.className = "message";
  msg.innerHTML = html;
  DOM.messages.appendChild(msg);
  DOM.messages.scrollTop = DOM.messages.scrollHeight;
}

function startTimeoutFromStorage(end) {
  const seconds = Math.floor((end - Date.now()) / 1000);
  DOM.input.disabled = true;
  DOM.timeoutScreen.style.display = "block";
  updateTimer(seconds);

  clearInterval(timeoutInterval);
  timeoutInterval = setInterval(() => {
    const remaining = Math.floor((end - Date.now()) / 1000);
    updateTimer(remaining);
    if (remaining <= 0) {
      clearInterval(timeoutInterval);
      DOM.input.disabled = false;
      DOM.timeoutScreen.style.display = "none";
      delete storedTimeouts[userIP];
      localStorage.setItem("timeouts", JSON.stringify(storedTimeouts));
    }
  }, 1000);
}

function updateTimer(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  DOM.timeoutTimer.textContent = `${min}:${sec.toString().padStart(2, "0")}`;
}
