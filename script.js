const CLIENT_ID = 'Ww9KIEXUL5KzVED0';

const drone = new ScaleDrone(CLIENT_ID, {
  data: {
    name: getRandomName(),
    color: getRandomColor(),
  },
});

let members = [];

const DOM = {
  membersCount: document.querySelector('.members-count'),
  membersList: document.querySelector('.members-list'),
  messages: document.querySelector('.messages'),
  input: document.querySelector('.message-form__input'),
  form: document.querySelector('.message-form'),
};

DOM.form.addEventListener('submit', sendMessage);

let canSend = true;

function sendMessage(event) {
  event.preventDefault();

  if (!canSend) return;

  const message = DOM.input.value.trim();
  const fileInput = DOM.form.querySelector('.message-form__file');
  const file = fileInput.files[0];

  if (!message && !file) return;

  canSend = false;

  if (file && file.type.startsWith('image/')) {
    sendImageMessage(file);
  }

  if (message) {
    sendTextMessage(message);
  }

  DOM.input.value = '';
  fileInput.value = '';

  setTimeout(() => {
    canSend = true;
  }, 1000);
}

function sendTextMessage(text) {
  drone.publish({
    room: 'observable-room',
    message: { type: 'text', content: text },
  });
}

function resizeImage(file, callback) {
  const reader = new FileReader();

  reader.onloadend = function () {
    const img = new Image();

    img.onload = function () {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const wantHeight = 300;
      const ratio = img.width / img.height;
      const widthCalc = ratio * wantHeight;
      canvas.width = widthCalc;
      canvas.height = wantHeight;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const mime = file.type || 'image/jpeg';
      const resizedBase64 = canvas.toDataURL(mime, 0.8);
      callback(resizedBase64);
    };

    img.src = reader.result;
  };

  reader.readAsDataURL(file);
}

function sendImageMessage(file) {
  resizeImage(file, function (resizedBase64) {
    drone.publish({
      room: 'observable-room',
      message: { type: 'image', content: resizedBase64 },
    });
  });
}

function createMemberElement(member) {
  const { name, color } = member.clientData;
  const el = document.createElement('div');
  el.appendChild(document.createTextNode(name));
  el.className = 'member';
  el.style.color = color;
  return el;
}

function updateMembersDOM() {
  DOM.membersCount.innerText = `${members.length} users in room:`;
  DOM.membersList.innerHTML = '';
  members.forEach(member =>
    DOM.membersList.appendChild(createMemberElement(member))
  );
}

function createMessageElement(text, member) {
  const el = document.createElement('div');
  const { name, color } = member.clientData;

  if (text.type === 'text') {
    el.className = 'message';
    el.appendChild(createMemberElement(member));
    el.appendChild(document.createTextNode(text.content));
  } else if (text.type === 'image') {
    const img = document.createElement('img');
    img.src = text.content;
    el.className = 'message image-message';
    el.appendChild(createMemberElement(member));
    el.appendChild(img);
  }

  return el;
}

function addMessageToListDOM(text, member) {
  const el = DOM.messages;
  const wasTop = el.scrollTop === el.scrollHeight - el.clientHeight;
  el.appendChild(createMessageElement(text, member));
  if (wasTop) {
    el.scrollTop = el.scrollHeight - el.clientHeight;
  }
}

drone.on('open', error => {
  if (error) return console.error(error);

  const room = drone.subscribe('observable-room');

  room.on('open', error => {
    if (error) return console.error(error);
    console.log('Successfully joined room');
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
    if (member) {
      addMessageToListDOM(text, member);
    }
  });
});

drone.on('close', event => {
  console.log('Connection was closed', event);
});

drone.on('error', error => {
  console.error(error);
});

function getRandomName() {
  const adjs = ["funny", "fast", "happy", "cool"];
  const nouns = ["panda", "cloud", "moon", "star"];
  return adjs[Math.floor(Math.random() * adjs.length)] + "_" + nouns[Math.floor(Math.random() * nouns.length)];
}

function getRandomColor() {
  return '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16);
}
