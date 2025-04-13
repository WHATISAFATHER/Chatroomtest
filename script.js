const bannedNames = JSON.parse(localStorage.getItem("bannedUsers") || "[]");
const myName = "user_" + Math.floor(Math.random() * 1000);
let isMod = false;
let kicked = false;

if (bannedNames.includes(myName)) {
  document.getElementById("chat").style.display = "none";
  document.getElementById("banned").style.display = "block";
  throw new Error("Banned");
}

document.getElementById("mod-login").onclick = () => {
  const u = prompt("Username:");
  const p = prompt("Password:");
  if (u === "admin" && p === "letmein") {
    isMod = true;
    alert("Mod access granted. Reloading...");
    location.reload();
  } else {
    alert("Incorrect.");
  }
};

const CLIENT_ID = 'YwlHBeKbieWWPeOS';
const drone = new ScaleDrone(CLIENT_ID, {
  data: { name: myName, mod: isMod }
});

let members = [];

const DOM = {
  membersCount: document.querySelector('.members-count'),
  membersList: document.querySelector('.members-list'),
  messages: document.getElementById("messages"),
  input: document.querySelector('.message-input'),
  form: document.querySelector('.message-form')
};

drone.on('open', error => {
  if (error) return console.error(error);
  const room = drone.subscribe('observable-room');

  room.on('members', m => {
    members = m;
    updateMembers();
  });

  room.on('member_join', member => {
    members.push(member);
    updateMembers();
  });

  room.on('member_leave', ({ id }) => {
    members = members.filter(m => m.id !== id);
    updateMembers();
  });

  room.on('data', (msg, member) => {
    if (!member || kicked) return;

    if (msg.type === 'text') {
      if (msg.content.startsWith("/kick ") && member.clientData.mod) {
        const target = msg.content.split(" ")[1];
        if (target === myName) {
          kicked = true;
          document.getElementById("chat").style.display = "none";
          document.getElementById("kicked").style.display = "block";
          return;
        }
      }

      if (msg.content.startsWith("/ban ") && member.clientData.mod) {
        const target = msg.content.split(" ")[1];
        if (target === myName) {
          bannedNames.push(myName);
          localStorage.setItem("bannedUsers", JSON.stringify(bannedNames));
          document.getElementById("chat").style.display = "none";
          document.getElementById("banned").style.display = "block";
          return;
        }
      }

      addMessage(msg.content, member.clientData.name);
    }
  });
});

DOM.form.onsubmit = e => {
  e.preventDefault();
  const msg = DOM.input.value.trim();
  if (!msg) return;
  drone.publish({ room: 'observable-room', message: { type: 'text', content: msg } });
  DOM.input.value = '';
};

function updateMembers() {
  DOM.membersCount.textContent = `${members.length} online`;
  DOM.membersList.innerHTML = '';
  members.forEach(member => {
    const el = document.createElement('div');
    el.className = 'member';
    el.textContent = member.clientData.name + (member.clientData.mod ? ' [MOD]' : '');

    if (isMod && member.clientData.name !== myName) {
      const kick = document.createElement('button');
      kick.textContent = "Kick";
      kick.onclick = () => drone.publish({ room: 'observable-room', message: { type: 'text', content: `/kick ${member.clientData.name}` } });

      const ban = document.createElement('button');
      ban.textContent = "Ban";
      ban.onclick = () => drone.publish({ room: 'observable-room', message: { type: 'text', content: `/ban ${member.clientData.name}` } });

      el.append(" ", kick, ban);
    }

    DOM.membersList.appendChild(el);
  });
}

function addMessage(text, sender) {
  const msg = document.createElement('div');
  msg.textContent = `${sender}: ${text}`;
  DOM.messages.appendChild(msg);
  DOM.messages.scrollTop = DOM.messages.scrollHeight;
}
