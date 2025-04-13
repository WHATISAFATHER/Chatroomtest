const CLIENT_ID = 'YwlHBeKbieWWPeOS';
const myName = "user_" + Math.floor(Math.random() * 10000);
let isMod = sessionStorage.getItem("isMod") === "true";
let kicked = false;

const bannedNames = JSON.parse(localStorage.getItem("bannedUsers") || "[]");
if (bannedNames.includes(myName)) {
  document.getElementById("chat-container").style.display = "none";
  document.getElementById("banned-screen").style.display = "block";
  throw new Error("User is banned.");
}

const modButton = document.getElementById("mod-login");
if (isMod) modButton.style.display = "none";

modButton.addEventListener("click", () => {
  const u = prompt("Enter mod username:");
  const p = prompt("Enter mod password:");
  if (u === "admin" && p === "letmein") {
    sessionStorage.setItem("isMod", "true");
    location.reload();
  } else {
    alert("Wrong username or password.");
  }
});

const drone = new ScaleDrone(CLIENT_ID, {
  data: {
    name: myName,
    mod: isMod
  }
});

const DOM = {
  input: document.getElementById("input"),
  form: document.getElementById("form"),
  messages: document.getElementById("messages"),
  membersCount: document.getElementById("members-count")
};

DOM.form.addEventListener("submit", e => {
  e.preventDefault();
  const text = DOM.input.value.trim();
  if (!text) return;

  if ((text.startsWith("/kick ") || text.startsWith("/ban ")) && !isMod) {
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

drone.on('open', error => {
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
        if (target === myName) {
          bannedNames.push(myName);
          localStorage.setItem("bannedUsers", JSON.stringify(bannedNames));
          document.getElementById("chat-container").style.display = "none";
          document.getElementById("banned-screen").style.display = "block";
        }
        return;
      }

      addMessage(`${sender}: ${msg}`);
    }
  });
});

function updateMemberCount() {
  DOM.membersCount.textContent = `${members.length} members online`;
}

function addMessage(text) {
  const msg = document.createElement("div");
  msg.className = "message";
  msg.textContent = text;
  DOM.messages.appendChild(msg);
  DOM.messages.scrollTop = DOM.messages.scrollHeight;
}
