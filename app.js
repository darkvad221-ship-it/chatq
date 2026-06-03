const STORAGE_KEY = "chatq-history";

const messagesEl = document.querySelector("#messages");
const form = document.querySelector("#chatForm");
const input = document.querySelector("#messageInput");
const sendButton = document.querySelector("#sendButton");
const clearButton = document.querySelector("#clearChat");
const exportButton = document.querySelector("#exportChat");
const quickPrompts = document.querySelectorAll(".quick-prompt");

const starterMessages = [
  {
    role: "bot",
    text:
      "Hi, I am ChatQ. I can answer common questions, help draft short text, brainstorm plans, and keep this conversation in your browser.",
    time: Date.now(),
  },
];

let history = loadHistory();
renderMessages();

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = input.value.trim();

  if (!text) {
    return;
  }

  addMessage("user", text);
  input.value = "";
  autoResizeInput();
  setSending(true);
  showTyping();

  const reply = await getBotReply(text);
  hideTyping();
  addMessage("bot", reply);
  setSending(false);
  input.focus();
});

input.addEventListener("input", autoResizeInput);

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

quickPrompts.forEach((button) => {
  button.addEventListener("click", () => {
    input.value = button.textContent.trim();
    autoResizeInput();
    input.focus();
  });
});

clearButton.addEventListener("click", () => {
  history = [...starterMessages];
  saveHistory();
  renderMessages();
  input.focus();
});

exportButton.addEventListener("click", () => {
  const lines = history.map((message) => {
    const speaker = message.role === "user" ? "You" : "ChatQ";
    return `[${formatTime(message.time)}] ${speaker}: ${message.text}`;
  });

  const blob = new Blob([lines.join("\n\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `chatq-${new Date().toISOString().slice(0, 10)}.txt`;
  link.click();
  URL.revokeObjectURL(url);
});

function loadHistory() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(stored) && stored.length ? stored : [...starterMessages];
  } catch {
    return [...starterMessages];
  }
}

function saveHistory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function addMessage(role, text) {
  history.push({ role, text, time: Date.now() });
  saveHistory();
  renderMessages();
}

function renderMessages() {
  messagesEl.innerHTML = "";

  history.forEach((message) => {
    messagesEl.appendChild(createMessageNode(message));
  });

  scrollToBottom();
}

function createMessageNode(message) {
  const row = document.createElement("article");
  row.className = `message-row ${message.role}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = message.role === "user" ? "You" : "CQ";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = message.text;

  const meta = document.createElement("span");
  meta.className = "meta";
  meta.textContent = formatTime(message.time);
  bubble.appendChild(meta);

  row.append(avatar, bubble);
  return row;
}

function showTyping() {
  const row = document.createElement("article");
  row.className = "message-row typing";
  row.id = "typingIndicator";
  row.innerHTML = `
    <div class="avatar">CQ</div>
    <div class="bubble" aria-label="ChatQ is typing">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
  `;
  messagesEl.appendChild(row);
  scrollToBottom();
}

function hideTyping() {
  document.querySelector("#typingIndicator")?.remove();
}

function setSending(isSending) {
  sendButton.disabled = isSending;
  input.disabled = isSending;
}

function autoResizeInput() {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 150)}px`;
}

function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function formatTime(timestamp) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

async function getBotReply(text) {
  await wait(520);

  const normalized = text.toLowerCase();

  if (matches(normalized, ["hello", "hi", "hey"])) {
    return "Hello. Tell me what you want to work on, and I will help you shape the next step.";
  }

  if (matches(normalized, ["what can you do", "app can do", "features"])) {
    return [
      "This app includes:",
      "- A responsive chatbot interface",
      "- Local conversation history",
      "- Quick prompt buttons",
      "- Export and clear controls",
      "- A rule-based assistant that runs without a server",
    ].join("\n");
  }

  if (matches(normalized, ["plan", "schedule", "day"])) {
    return [
      "A practical plan:",
      "1. Pick the top three outcomes for today.",
      "2. Block focused time for the hardest one first.",
      "3. Keep a 20-minute buffer between major tasks.",
      "4. End with a short review and tomorrow's first task.",
    ].join("\n");
  }

  if (matches(normalized, ["email", "follow-up", "follow up"])) {
    return [
      "Subject: Following up",
      "",
      "Hi [Name],",
      "",
      "I wanted to follow up on my previous message and check whether you had a chance to review it. Please let me know if there is anything I can clarify.",
      "",
      "Best,",
      "[Your Name]",
    ].join("\n");
  }

  if (matches(normalized, ["study", "learn", "exam"])) {
    return "Use active recall: read a small section, close the material, write what you remember, then check gaps. Short repeated sessions beat one long review.";
  }

  if (matches(normalized, ["thanks", "thank you"])) {
    return "You are welcome. Send another question whenever you are ready.";
  }

  return buildFallbackReply(text);
}

function matches(text, terms) {
  return terms.some((term) => text.includes(term));
}

function buildFallbackReply(text) {
  const trimmed = text.replace(/\s+/g, " ").trim();

  if (trimmed.endsWith("?")) {
    return "Good question. I am a local demo bot, so I do not have live web or AI access here. I can still help structure the answer, draft text, or break the topic into steps.";
  }

  if (trimmed.length > 120) {
    return "I can help refine that. A useful next step is to turn it into a clear goal, list the constraints, then decide what should happen first.";
  }

  return `I understand: "${trimmed}". Tell me the outcome you want, and I can help draft, plan, summarize, or organize it.`;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
