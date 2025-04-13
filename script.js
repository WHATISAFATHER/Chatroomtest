let isMod = false;
let userName = "";
let kicked = false;

// Load ban list from browser storage
const bannedNames = JSON.parse(localStorage.getItem("bannedUsers") || "[]");

function banUser(name) {
  if (!bannedNames.includes(name)) {
    bannedNames.push(name);
    localStorage.setItem("bannedUsers", JSON.stringify(bannedNames));
  }
}

// Mod login button
document.getElementById("mod-login").addEventListener("click", () => {
  const inputUser = prompt("Enter mod username:");
  const inputPass = prompt("Enter mod password:");
  if (inputUser === "admin" && inputPass === "letmein") {
    isMod = true;
    sessionStorage.setItem("isMod", "true");
    alert("You are now logged in as a moderator.");
    location.reload();
  } else {
    alert("Incorrect username or password.");
  }
});

// Restore mod status after reload
if (sessionStorage.getItem("isMod") === "true") {
  isMod = true;
}

// Get random name and check ban status
userName = getRandomName();

if (bannedNames.includes(userName)) {
  document.body.innerHTML = `<div style="text-align:center; margin-top:50px;"><h1>You are banned from this chat.</h1></div>`;
  throw new Error("Banned user.");
}

// Connect to Scaledrone
const CLIENT_ID = 'YwlHBeKbieWWPeOS';
const drone = new ScaleDrone(CLIENT_ID, {
  data: {
    name: userName,
    color: getRandomColor(),
    mod: isMod
  },
});

let members = [];

// Create member element in member list
function createMemberElement(member) {
  const { name, color, mod } = member.clientData;
  const el = document.createElement('div');
  el.className = 'member';
  el.style.color = color;
  el.textContent = name;

  // Add MOD badge
  if (mod) {
    el.innerHTML += ' <span style="color:red; font-weight:bold;">[MOD]</span>';
  }

  // Add Kick and Ban buttons if you're a mod
  if (isMod && name !== drone.clientData.name) {
    const kickBtn = document.createElement('button');
    kickBtn.textContent = "Kick";
    kickBtn.style.marginLeft = "10px";
    kickBtn.onclick = () => {
      sendTextMessage(`/kick ${name}`);
    };

    const banBtn = document.createElement('button');
    banBtn.textContent = "Ban";
    banBtn.style.marginLeft = "5px";
    banBtn.onclick = () => {
      sendTextMessage(`/ban ${name}`);
    };

    el.appendChild(kickBtn);
    el.appendChild(banBtn);
  }

  return el;
}

// Update member list on screen
function updateMembersDOM() {
  DOM.membersCount.innerText = `${members.length} users in room:`;
  DOM.membersList.innerHTML = '';
  members.forEach(member => {
    DOM.membersList.appendChild(createMemberElement(member));
  });
}

// Setup Scaledrone room events
drone.on('open', error => {
  if (error) return console.error(error);

  const room = drone.subscribe('observable-room');
  room.on('open', error => {
    if (error) return console.error(error);
    console.log("Joined room");
  });

  room.on('members', m => {
    members = m;
    updateMembersDOM();
  });

  room.on('member_join', member => {
    members.push(member);
    updateMembersDOM();
  });

  room.on('member_leave', ({ id }) => {
    const index = members.findIndex(member => member.id === id);
    members.splice(index, 1);
    updateMembersDOM();
  });

  room.on('data', (text, member) => {
    if (!member || kicked) return;

    const msg = text.content;
    const senderIsMod = member.clientData.mod;

    if (text.type === 'text') {
      if (msg.startsWith("/kick ")) {
        const target = msg.split(" ")[1];
        if (senderIsMod && target === drone.clientData.name) {
          kicked = true;
          document.querySelector(".container").style.display = "none";
          document.getElementById("mod-login").style.display = "none";
          document.getElementById("kicked-screen").style.display = "block";
        }
        return;
      }

      if (msg.startsWith("/ban ")) {
        const target = msg.split(" ")[1];
        if (senderIsMod && target === drone.clientData.name) {
          banUser(target);
          document.body.innerHTML = `<div style="text-align:center; margin-top:50px;"><h1>You are banned from this chat.</h1></div>`;
          return;
        }
      }
    }

    addMessageToListDOM(text, member);
  });
});

const DOM = {
  membersCount: document.querySelector('.members-count'),
  membersList: document.querySelector('.members-list'),
  messages: document.querySelector('.messages'),
  input: document.querySelector('.message-form__input'),
  form: document.querySelector('.message-form'),
};

DOM.form.addEventListener('submit', sendMessage);

// Send a chat message
function sendMessage(event) {
  event.preventDefault();
  const text = DOM.input.value.trim();
  if (text) sendTextMessage(text);
  DOM.input.value = '';
}

// Publish to Scaledrone
function sendTextMessage(text) {
  drone.publish({
    room: 'observable-room',
    message: { type: 'text', content: text },
  });
}

// Random name and color generators
function getRandomName() {
  const adjs = ["cool", "brave", "quiet", "wild", "happy"];
  const nouns = ["tiger", "rainbow", "star", "cloud", "river"];
  return adjs[Math.floor(Math.random() * adjs.length)] + "_" +
         nouns[Math.floor(Math.random() * nouns.length)];
}

function getRandomColor() {
  return '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16);
}

// Create chat message element
function createMessageElement(text, member) {
  const el = document.createElement('div');
  const { name, color } = member.clientData;
  el.className = 'message';

  const nameEl = document.createElement('span');
  nameEl.className = 'member';
  nameEl.style.color = color;
  nameEl.textContent = name + ": ";

  el.appendChild(nameEl);
  el.appendChild(document.createTextNode(text.content));
  return el;
}

// Display message in chat window
function addMessageToListDOM(text, member) {
  const el = DOM.messages;
  const wasAtBottom = el.scrollTop === el.scrollHeight - el.clientHeight;
  el.appendChild(createMessageElement(text, member));
  if (wasAtBottom) el.scrollTop = el.scrollHeight - el.clientHeight;
}
