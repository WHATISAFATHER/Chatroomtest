const CLIENT_ID = 'YwlHBeKbieWWPeOS'; // Scaledrone Room ID
const IMGUR_CLIENT_ID = 'f693fe726c25170'; // Your Imgur Client ID

const myName = "user_" + Math.floor(Math.random() * 10000);
const DOM = {
  input: document.getElementById("input"),
  form: document.getElementById("form"),
  fileInput: document.getElementById("file-input"),
  messages: document.getElementById("messages"),
  membersCount: document.getElementById("members-count")
};

const drone = new ScaleDrone(CLIENT_ID, {
  data: { name: myName }
});

DOM.form.addEventListener("submit", async e => {
  e.preventDefault();

  const text = DOM.input.value.trim();
  const file = DOM.fileInput.files[0];

  if (!text && !file) return;

  if (file && file.type.startsWith("image/")) {
    const url = await uploadToImgur(file);
    drone.publish({ room: "observable-room", message: { type: "image", content: url } });
  }

  if (text) {
    drone.publish({ room: "observable-room", message: { type: "text", content: text } });
  }

  DOM.input.value = "";
  DOM.fileInput.value = "";
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
    const sender = member.clientData.name;
    if (message.type === "text") {
      addMessage(`${sender}: ${message.content}`);
    } else if (message.type === "image") {
      const div = document.createElement("div");
      div.className = "message";
      div.innerHTML = `<strong>${sender}:</strong><br><img src="${message.content}" alt="image">`;
      DOM.messages.appendChild(div);
      DOM.messages.scrollTop = DOM.messages.scrollHeight;
    }
  });
});

function updateMemberCount() {
  DOM.membersCount.textContent = `${members.length} users in room`;
}

function addMessage(text) {
  const msg = document.createElement("div");
  msg.className = "message";
  msg.innerHTML = text;
  DOM.messages.appendChild(msg);
  DOM.messages.scrollTop = DOM.messages.scrollHeight;
}

async function uploadToImgur(file) {
  const formData = new FormData();
  formData.append("image", file);
  const response = await fetch("https://api.imgur.com/3/image", {
    method: "POST",
    headers: {
      Authorization: "Client-ID " + IMGUR_CLIENT_ID
    },
    body: formData
  });
  const data = await response.json();
  return data.data.link;
}
