const CLIENT_ID = 'YwlHBeKbieWWPeOS';
const myName = "user_" + Math.floor(Math.random() * 10000);
let isMod = sessionStorage.getItem("isMod") === "true";
let kicked = false;
let timeoutEnd = 0;
let timeoutInterval = null;
let userIP = null;

const bannedIPs = JSON.parse(localStorage.getItem("bannedIPs") || "[]");

fetch("https://api.ipify.org?format=json")
  .then(res => res.json())
  .then(data => {
    userIP = data.ip;
    if (bannedIPs.includes(userIP)) {
      document.getElementById("chat-container").style.display = "none";
      document.getElementById("banned-screen").style.display = "block";
      throw new Error("Banned IP");
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

  const now = Date.now();
  if (now < timeoutEnd) {
    alert("You are timed out!");
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
          startTimeoutCountdown(minutes);
        }
        return;
      }

      const modLabel = member.clientData.mod ? ' <span class="message mod">[MOD]</span>' : '';
      addMessage(`${sender}${modLabel}: ${msg}`);
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

function startTimeoutCountdown(minutes) {
  DOM.timeoutScreen.style.display = "block";
  DOM.input.disabled = true;
  let secondsLeft = minutes * 60;

  updateTimerDisplay(secondsLeft);

  if (timeoutInterval) clearInterval(timeoutInterval);
  timeoutInterval = setInterval(() => {
    secondsLeft--;
    updateTimerDisplay(secondsLeft);

    if (secondsLeft <= 0) {
      clearInterval(timeoutInterval);
      DOM.timeoutScreen.style.display = "none";
      DOM.input.disabled = false;
    }
  }, 1000);
}

function updateTimerDisplay(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  DOM.timeoutTimer.textContent = `${min}:${sec.toString().padStart(2, "0")}`;
}
