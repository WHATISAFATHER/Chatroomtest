const bannedNames = JSON.parse(localStorage.getItem("bannedUsers") || "[]");
const myName = "user_" + Math.floor(Math.random() * 10000);
let isMod = false;
let kicked = false;

const CLIENT_ID = 'YwlHBeKbieWWPeOS';

if (bannedNames.includes(myName)) {
  document.getElementById("chat").style.display = "none";
  document.getElementById("banned").style.display = "block";
  throw new Error("Banned");
}

function modLogin() {
  const u = prompt("Username:");
  const p = prompt("Password:");
  if (u === "admin" && p === "letmein") {
    isMod = true;
    alert("Mod access granted.");
  } else {
    alert("Wrong credentials.");
  }
}

const drone = new ScaleDrone(CLIENT_ID, {
  data: { name: myName, mod: isMod }
});

let members = [];
const roomName = "observable-room";

const DOM = {
  members: document.getElementById("members"),
  messages: document.getElementById("messages"),
  input: document.getElementById("input"),
  form: document.getElementById("form")
};

drone.on("open", error => {
  if (error) return console.error(error);
  const room = drone.subscribe(roomName);

  room.on("members", m => {
    members = m;
    updateMembers();
  });

  room.on("member_join", member => {
    members.push(member);
    updateMembers();
  });

  room.on("member_leave", ({ id }) => {
    members = members.filter(m => m.id !== id);
    updateMembers();
  });

  room.on("data", (message, member) => {
    if (!member || kicked) return;

    const sender = member.clientData.name;
    const isSenderMod = member.clientData.mod;

    if (message.type === "text") {
      const content = message.content;

      if (content.startsWith("/kick ") && isSenderMod) {
        const target = content.split(" ")[1];
        if (target === myName) {
          kicked = true;
          document.getElementById("chat").style.display = "none";
          document.getElementById("kicked").style.display = "block";
        }
        return;
      }

      if (content.startsWith("/ban ") && isSenderMod) {
        const target = content.split(" ")[1];
        if (target === myName) {
          bannedNames.push(myName);
          localStorage.setItem("bannedUsers", JSON.stringify(bannedNames));
          document.getElementById("chat").style.display = "none";
          document.getElementById("banned").style.display = "block";
        }
        return;
      }

      addMessage(`${sender}: ${content}`);
    }
  });
});

DOM.form.addEventListener("submit", e => {
  e.preventDefault();
  const text = DOM.input.value.trim();
  if (!text) return;

  if (text.startsWith("/kick ") || text.startsWith("/ban ")) {
    if (!isMod) {
      alert("Only mods can use commands.");
      return;
    }
  }

  drone.publish({
    room: roomName,
    message: { type: "text", content: text }
  });

  DOM.input.value = "";
});

function updateMembers() {
  DOM.members.innerHTML = `${members.length} users online`;
}

function addMessage(text) {
  const msg = document.createElement("div");
  msg.textContent = text;
  DOM.messages.appendChild(msg);
  DOM.messages.scrollTop = DOM.messages.scrollHeight;
}
