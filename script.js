const CLIENT_ID = 'Ww9KIEXUL5KzVED0';
const drone = new ScaleDrone(CLIENT_ID, {
  data: { name: getRandomName() }
});

let members = [];

function getRandomName() {
  const adjs = ["funny", "shiny", "cool", "wild"];
  const nouns = ["panda", "tiger", "leaf", "cloud"];
  return adjs[Math.floor(Math.random() * adjs.length)] + "_" + nouns[Math.floor(Math.random() * nouns.length)];
}

const DOM = {
  input: document.getElementById("input"),
  form: document.getElementById("form"),
  messages: document.getElementById("messages"),
  membersCount: document.getElementById("members-count"),
  imageInput: document.getElementById("imageInput")
};

DOM.form.addEventListener("submit", e => {
  e.preventDefault();

  const message = DOM.input.value.trim();
  const file = DOM.imageInput.files[0];

  if (!message && !file) return;

  if (file && file.type.startsWith("image/")) {
    resizeImage(file, (resizedBase64) => {
      drone.publish({
        room: "observable-room",
        message: { type: "image", content: resizedBase64 }
      });
    });
  }

  if (message) {
    drone.publish({
      room: "observable-room",
      message: { type: "text", content: message }
    });
  }

  DOM.input.value = '';
  DOM.imageInput.value = '';
});

function resizeImage(file, callback) {
  const reader = new FileReader();
  reader.onloadend = function () {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const height = 300;
      const width = img.width / img.height * height;
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      const base64 = canvas.toDataURL(file.type || "image/png", 0.8);
      callback(base64);
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function addMessageToDOM(content, isImage = false) {
  const div = document.createElement("div");
  div.className = "message";
  if (isImage) {
    const img = document.createElement("img");
    img.src = content;
    img.alt = "Uploaded image";
    div.appendChild(img);
  } else {
    div.textContent = content;
  }
  DOM.messages.appendChild(div);
  DOM.messages.scrollTop = DOM.messages.scrollHeight;
}

drone.on("open", error => {
  if (error) return console.error(error);
  const room = drone.subscribe("observable-room");

  room.on("members", m => {
    members = m;
    DOM.membersCount.textContent = `${members.length} members online`;
  });

  room.on("member_join", member => {
    members.push(member);
    DOM.membersCount.textContent = `${members.length} members online`;
  });

  room.on("member_leave", ({ id }) => {
    members = members.filter(m => m.id !== id);
    DOM.membersCount.textContent = `${members.length} members online`;
  });

  room.on("data", (message, member) => {
    if (message.type === "text") {
      addMessageToDOM(`${member.clientData.name}: ${message.content}`);
    } else if (message.type === "image") {
      addMessageToDOM(message.content, true);
    }
  });
});
