const toggleBtn = document.getElementById('chatbotToggle');
const panel = document.getElementById('chatbotPanel');
const closeBtn = document.getElementById('chatbotClose');
const messagesEl = document.getElementById('chatbotMessages');
const suggestionsEl = document.getElementById('chatbotSuggestions');
const form = document.getElementById('chatbotForm');
const input = document.getElementById('chatbotInput');
const sendBtn = document.getElementById('chatbotSend');

let history = [];
let isLoading = false;

function openPanel() {
  panel.hidden = false;
  toggleBtn.setAttribute('aria-expanded', 'true');
  input.focus();
}

function closePanel() {
  panel.hidden = true;
  toggleBtn.setAttribute('aria-expanded', 'false');
}

toggleBtn.addEventListener('click', () => {
  panel.hidden ? openPanel() : closePanel();
});

closeBtn.addEventListener('click', closePanel);

function addMessage(text, role) {
  const el = document.createElement('div');
  el.className = `chatbot-message chatbot-message-${role}`;
  el.textContent = text;
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return el;
}

function addLoadingIndicator() {
  const el = document.createElement('div');
  el.className = 'chatbot-message chatbot-message-loading';
  el.setAttribute('aria-label', 'Cevap hazırlanıyor');
  el.innerHTML = '<span class="chatbot-dot"></span><span class="chatbot-dot"></span><span class="chatbot-dot"></span>';
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return el;
}

function setLoading(loading) {
  isLoading = loading;
  sendBtn.disabled = loading;
  input.disabled = loading;
}

async function sendMessage(text) {
  if (!text.trim() || isLoading) return;

  if (suggestionsEl) {
    suggestionsEl.remove();
  }

  addMessage(text, 'user');
  history.push({ role: 'user', content: text });

  setLoading(true);
  const loadingEl = addLoadingIndicator();

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history }),
    });

    if (!response.ok) {
      throw new Error('İstek başarısız');
    }

    const data = await response.json();
    loadingEl.remove();
    addMessage(data.reply, 'bot');
    history.push({ role: 'assistant', content: data.reply });
  } catch (err) {
    loadingEl.remove();
    addMessage('Şu anda cevap oluşturulamıyor. Lütfen birkaç saniye sonra tekrar dene.', 'error');
  } finally {
    setLoading(false);
    input.focus();
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value;
  input.value = '';
  sendMessage(text);
});

if (suggestionsEl) {
  suggestionsEl.querySelectorAll('.chatbot-suggestion').forEach((btn) => {
    btn.addEventListener('click', () => {
      sendMessage(btn.dataset.question);
    });
  });
}
