const CLIENT_ID = 'YwlHBeKbieWWPeOS';
const myName = "user_" + Math.floor(Math.random() * 10000);
let isMod = sessionStorage.getItem("isMod") === "true";
let kicked = false;
let timeoutEnd = 0;
let timeoutInterval = null;
let userIP = null;

const bannedIPs = JSON.parse(localStorage.getItem("bannedIPs") || "[]");

// Timeout storage
const storedTimeouts = JSON.parse(localStorage.getItem("timeouts") || {});

fetch("https://api.ipify.org?format=json")
  .then(res => res.json())
  .then(data => {
    userIP = data.ip;

    // Check if IP is banned
    if (bannedIPs.includes(userIP)) {
      document.getElementById("chat-container").style.display = "none";
      document.getElementById("banned-screen").style.display = "block";
      throw new Error("Banned IP");
    }

    // Check if IP is in timeout
    const end = storedTimeouts[userIP];
    if (end && Date.now() < end) {
      timeoutEnd = end;
      const secondsLeft = Math.floor((end - Date.now()) / 1000);
      startTimeout(secondsLeft);
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

const DOM = {
  input: document.getElementById("input"),
  form: document.getElementById("form"),
  messages: document.getElementById("messages"),
  membersCount: document.getElementById("members-count"),
  timeoutScreen: document.getElementById("timeout-screen"),
  timeoutTimer: document.getElementById("timeout-timer")
};

DOM.form.addEventListener("submit", e => {
  e.preventDefault();

  if (Date.now() < timeoutEnd) {
    alert("You are timed out.");
    return;
  }

  const text = DOM.input.value.trim();
  if (!text) return;

  if ((text.startsWith("/kick ") || text.startsWith("/ban ") || text.startsWith("/timeout ")) && !isMod) {
    alert("Only moderators can use this command.");
    return;
  }

  drone.publish({
    room: "observable-room",
    message: { type: "text", content: text }
  });

  DOM.input.value = "";
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
        const minutes = parseInt(parts[2]);
        if (target === myName && minutes > 0) {
          timeoutEnd = Date.now() + minutes * 60000;
          storedTimeouts[userIP] = timeoutEnd;
          localStorage.setItem("timeouts", JSON.stringify(storedTimeouts));
          startTimeout(minutes * 60);
        }
        return;
      }

      const modTag = member.clientData.mod ? ' <span class="message mod">[MOD]</span>' : '';
      addMessage(`${sender}${modTag}: ${msg}`);
    }
  });
});

function updateMemberCount() {
  DOM.membersCount.textContent = `${members.length} members online`;
}

function addMessage(text) {
  const msg = document.createElement("div");
  msg.className = "message";
  msg.innerHTML = text;
  DOM.messages.appendChild(msg);
  DOM.messages.scrollTop = DOM.messages.scrollHeight;
}

function startTimeout(seconds) {
  clearInterval(timeoutInterval);
  DOM.input.disabled = true;
  DOM.timeoutScreen.style.display = "block";
  updateTimer(seconds);

  timeoutInterval = setInterval(() => {
    seconds--;
    updateTimer(seconds);
    if (seconds <= 0) {
      clearInterval(timeoutInterval);
      DOM.input.disabled = false;
      DOM.timeoutScreen.style.display = "none";

      // Remove stored timeout after completion
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
