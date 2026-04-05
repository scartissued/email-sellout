// Content script executed in context of the page
import './content.css';

let currentSession: any = null;
let activePopup: HTMLElement | null = null;
let currentInput: HTMLInputElement | null = null;

// Fetch session periodically or on load
async function checkAuth() {
  const data = await chrome.storage.local.get('sb_session');
  currentSession = data.sb_session;
}

checkAuth();
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.sb_session) {
    currentSession = changes.sb_session.newValue;
  }
});

document.addEventListener('focusin', async (e) => {
  const target = e.target as HTMLInputElement;
  
  // Check if it's an email input
  if (target && target.tagName === 'INPUT' && (target.type === 'email' || target.name?.toLowerCase().includes('email') || target.id?.toLowerCase().includes('email'))) {
    
    // Check if we already have an active popup for this input
    if (activePopup && currentInput === target) return;
    
    // Remove any existing one
    removePopup();
    
    // Ensure we are logged in
    if (!currentSession || !currentSession.user || !currentSession.user.email) return;
    
    const baseEmail = currentSession.user.email;
    if (!baseEmail.includes('@gmail.com')) return; // Only works for gmail
    
    const [username, domainPart] = baseEmail.split('@');
    const hostname = window.location.hostname.replace('www.', '');
    
    // Make sure we don't already have the alias filled in
    const suggestedAlias = `${username}+${hostname}@${domainPart}`;
    if (target.value === suggestedAlias) return;

    currentInput = target;
    showSuggestionPopup(target, suggestedAlias, baseEmail, hostname);
  }
}, true);

document.addEventListener('focusout', (_e) => {
  // If we click outside the input and outside the popup, remove it
  // We add a tiny delay to allow the popup click event to fire first
  setTimeout(() => {
    if (activePopup && document.activeElement !== currentInput && document.activeElement !== activePopup) {
      removePopup();
    }
  }, 200);
});

function removePopup() {
  if (activePopup) {
    activePopup.remove();
    activePopup = null;
    currentInput = null;
  }
}

function showSuggestionPopup(input: HTMLInputElement, suggestedAlias: string, baseEmail: string, domain: string) {
  const rect = input.getBoundingClientRect();
  
  const popup = document.createElement('div');
  popup.className = 'email-sellout-popup glass-panel';
  popup.style.top = `${window.scrollY + rect.top - 45}px`;
  popup.style.left = `${window.scrollX + rect.left}px`;
  
  const text = document.createElement('span');
  text.innerText = `Use alias: ${suggestedAlias}`;
  
  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'btn btn-primary';
  acceptBtn.innerText = 'Accept';
  
  acceptBtn.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    input.value = suggestedAlias;
    // Trigger React/Vue change events
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    
    acceptBtn.innerText = 'Saving...';
    
    // Ask background to save
    chrome.runtime.sendMessage({
      type: 'SAVE_ALIAS',
      payload: {
        base_email: baseEmail,
        domain: domain,
        alias_email: suggestedAlias
      }
    }, (response) => {
      if (response && response.success) {
        acceptBtn.innerText = 'Saved!';
        acceptBtn.style.backgroundColor = 'var(--success-color)';
        setTimeout(() => removePopup(), 1500);
      } else {
        acceptBtn.innerText = 'Error';
        acceptBtn.style.backgroundColor = 'var(--error-color)';
        console.error('Email sellout error:', response?.error);
        setTimeout(() => removePopup(), 2000);
      }
    });
  };
  
  popup.appendChild(text);
  popup.appendChild(acceptBtn);
  
  document.body.appendChild(popup);
  activePopup = popup;
}
