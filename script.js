const CLIENT_ID = 'YwlHBeKbieWWPeOS';

const drone = new ScaleDrone(CLIENT_ID, {
  data: {
    name: getRandomName(),
  },
});

const DOM = {
  input: document.getElementById("input"),
  form: document.getElementById("form"),
  messages: document.getElementById("messages"),
  membersCount: document.getElementById("members-count"),
  imageInput: document.getElementById("imageInput"),
};

let members = [];

DOM.form.addEventListener("submit", e => {
  e.preventDefault();

  const text = DOM.input.value.trim();
  const file = DOM.imageInput.files[0];

  if (!text && !file) return;

  if (file && file.type.startsWith("image/")) {
    resizeImage(file, base64 => {
      drone.publish({
        room: "observable-room",
        message: { type: "image", content: base64 },
      });
    });
  }

  if (text) {
    drone.publish({
      room: "observable-room",
      message: { type: "text", content: text },
    });
  }

  DOM.input.value = "";
  DOM.imageInput.value = "";
});

function resizeImage(file, callback) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const height = 300;
      const width = img.width / img.height * height;
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      const mimeType = file.type || "image/png";
      const base64 = canvas.toDataURL(mimeType, 0.8);
      callback(base64);
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function addMessageToDOM(message, member) {
  const div = document.createElement("div");
  div.className = "message";

  const name = document.createElement("strong");
  name.textContent = member.clientData.name + ": ";
  div.appendChild(name);

  if (message.type === "text") {
    div.appendChild(document.createTextNode(message.content));
  } else if (message.type === "image") {
    const img = document.createElement("img");
    img.src = message.content;
    img.alt = "Uploaded image";
    div.appendChild(document.createElement("br"));
    div.appendChild(img);
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
    if (member) {
      addMessageToDOM(message, member);
    }
  });
});

function getRandomName() {
  const adjs = ["funny", "fast", "happy", "cool"];
  const nouns = ["panda", "cloud", "moon", "star"];
  return adjs[Math.floor(Math.random() * adjs.length)] + "_" +
         nouns[Math.floor(Math.random() * nouns.length)];
}
