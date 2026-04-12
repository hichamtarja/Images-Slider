/**
 * Productivity Toolkit – Full Featured
 * - Bookmark Manager (custom categories, import/export, drag & drop)
 * - Password Generator (strength meter, optional history)
 * - Link Checker (CORS-friendly, reset)
 * - QR Generator (API-based, reset)
 * - QR Scanner (camera + upload, reset)
 * - Encryption (AES-GCM, encrypt/decrypt text)
 */

// =============================================
// STATE & DOM ELEMENTS
// =============================================
let bookmarks = [];
let categories = ['General', 'Work', 'Personal'];
let currentCategory = 'General';
let editingBookmarkId = null;
let passwordHistory = [];
let historyEnabled = false;

// Bookmark elements
const categoryList = document.getElementById('categoryList');
const bookmarksContainer = document.getElementById('bookmarksContainer');
const noBookmarksMsg = document.getElementById('noBookmarksMsg');
const bookmarkForm = document.getElementById('bookmarkForm');
const formContainer = document.getElementById('bookmarkFormContainer');
const formTitle = document.getElementById('formTitle');
const bookmarkIdInput = document.getElementById('bookmarkId');
const bookmarkTitleInput = document.getElementById('bookmarkTitle');
const bookmarkUrlInput = document.getElementById('bookmarkUrl');
const bookmarkCategorySelect = document.getElementById('bookmarkCategory');
const cancelBookmarkBtn = document.getElementById('cancelBookmarkBtn');
const showAddBookmarkBtn = document.getElementById('showAddBookmarkBtn');
const bookmarkSearch = document.getElementById('bookmarkSearch');
const newCategoryInput = document.getElementById('newCategoryInput');
const addCategoryBtn = document.getElementById('addCategoryBtn');

// Password elements
const generatedPassword = document.getElementById('generatedPassword');
const copyPasswordBtn = document.getElementById('copyPasswordBtn');
const passwordLength = document.getElementById('passwordLength');
const lengthValue = document.getElementById('lengthValue');
const includeUppercase = document.getElementById('includeUppercase');
const includeLowercase = document.getElementById('includeLowercase');
const includeNumbers = document.getElementById('includeNumbers');
const includeSymbols = document.getElementById('includeSymbols');
const generatePasswordBtn = document.getElementById('generatePasswordBtn');
const strengthBar = document.getElementById('strengthBar');
const strengthText = document.getElementById('strengthText');
const enableHistory = document.getElementById('enableHistory');
const passwordHistoryList = document.getElementById('passwordHistoryList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// Link Checker
const linkUrlInput = document.getElementById('linkUrlInput');
const checkLinkBtn = document.getElementById('checkLinkBtn');
const clearLinkBtn = document.getElementById('clearLinkBtn');
const linkResult = document.getElementById('linkResult');
const statusIndicator = linkResult.querySelector('.status-indicator');
const statusText = linkResult.querySelector('.status-text');

// QR Generator
const qrUrlInput = document.getElementById('qrUrlInput');
const generateQrBtn = document.getElementById('generateQrBtn');
const clearQrBtn = document.getElementById('clearQrBtn');
const qrCanvas = document.getElementById('qrCanvas');
const qrPlaceholder = document.getElementById('qrPlaceholder');
const downloadQrBtn = document.getElementById('downloadQrBtn');

// QR Scanner
const cameraScanBtn = document.getElementById('cameraScanBtn');
const uploadScanBtn = document.getElementById('uploadScanBtn');
const clearScannerBtn = document.getElementById('clearScannerBtn');
const qrImageUpload = document.getElementById('qrImageUpload');
const cameraView = document.getElementById('cameraView');
const qrVideo = document.getElementById('qrVideo');
const qrCanvasScanner = document.getElementById('qrCanvasScanner');
const stopCameraBtn = document.getElementById('stopCameraBtn');
const scanResult = document.getElementById('scanResult');
const decodedTextSpan = document.getElementById('decodedText');
const copyDecodedBtn = document.getElementById('copyDecodedBtn');
const openDecodedBtn = document.getElementById('openDecodedBtn');

// Encryption
const encryptTabBtn = document.getElementById('encryptTabBtn');
const decryptTabBtn = document.getElementById('decryptTabBtn');
const encryptPanel = document.getElementById('encryptPanel');
const decryptPanel = document.getElementById('decryptPanel');
const plaintextInput = document.getElementById('plaintextInput');
const encryptPassword = document.getElementById('encryptPassword');
const encryptBtn = document.getElementById('encryptBtn');
const ciphertextOutput = document.getElementById('ciphertextOutput');
const copyCiphertextBtn = document.getElementById('copyCiphertextBtn');
const ciphertextInput = document.getElementById('ciphertextInput');
const decryptPassword = document.getElementById('decryptPassword');
const decryptBtn = document.getElementById('decryptBtn');
const decryptedOutput = document.getElementById('decryptedOutput');
const copyDecryptedBtn = document.getElementById('copyDecryptedBtn');

// Encryption elements (add to existing list)
const clearEncryptionBtn = document.getElementById('clearEncryptionBtn');
const fileInput = document.getElementById('fileInput');
const filePassword = document.getElementById('filePassword');
const encryptFileBtn = document.getElementById('encryptFileBtn');
const decryptFileBtn = document.getElementById('decryptFileBtn');

// Import/Export
const exportBookmarksBtn = document.getElementById('exportBookmarksBtn');
const importBookmarksBtn = document.getElementById('importBookmarksBtn');
const importBookmarksFile = document.getElementById('importBookmarksFile');

// Scanner state
let videoStream = null;
let scanInterval = null;

// =============================================
// INITIALIZATION & STORAGE
// =============================================
function loadFromStorage() {
  const storedBookmarks = localStorage.getItem('toolkit_bookmarks');
  if (storedBookmarks) bookmarks = JSON.parse(storedBookmarks);
  const storedCategories = localStorage.getItem('toolkit_categories');
  if (storedCategories) categories = JSON.parse(storedCategories);
  else categories = ['General', 'Work', 'Personal'];
  if (!categories.includes('General')) categories.unshift('General');
}

function saveToStorage() {
  localStorage.setItem('toolkit_bookmarks', JSON.stringify(bookmarks));
  localStorage.setItem('toolkit_categories', JSON.stringify(categories));
}

loadFromStorage();

// =============================================
// CATEGORY MANAGEMENT
// =============================================
function renderCategories() {
  categoryList.innerHTML = '';
  categories.forEach(cat => {
    const chip = document.createElement('span');
    chip.className = `category-chip ${cat === currentCategory ? 'active' : ''}`;
    chip.innerHTML = `
      ${cat}
      ${cat !== 'General' ? '<span class="delete-cat" data-cat="'+cat+'">✕</span>' : ''}
    `;
    chip.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-cat')) {
        e.stopPropagation();
        deleteCategory(cat);
      } else {
        currentCategory = cat;
        renderCategories();
        renderBookmarks();
      }
    });
    categoryList.appendChild(chip);
  });
  bookmarkCategorySelect.innerHTML = '';
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    bookmarkCategorySelect.appendChild(option);
  });
}

function deleteCategory(cat) {
  if (cat === 'General') return;
  bookmarks.forEach(b => { if (b.category === cat) b.category = 'General'; });
  categories = categories.filter(c => c !== cat);
  if (currentCategory === cat) currentCategory = 'General';
  saveToStorage();
  renderCategories();
  renderBookmarks();
}

addCategoryBtn.addEventListener('click', () => {
  const newCat = newCategoryInput.value.trim();
  if (newCat && !categories.includes(newCat)) {
    categories.push(newCat);
    saveToStorage();
    renderCategories();
    newCategoryInput.value = '';
  }
});

// =============================================
// BOOKMARK RENDERING & CRUD
// =============================================
function renderBookmarks() {
  const searchTerm = bookmarkSearch.value.toLowerCase();
  let filtered = bookmarks.filter(b => b.category === currentCategory);
  if (searchTerm) {
    filtered = filtered.filter(b => 
      b.title.toLowerCase().includes(searchTerm) || 
      b.url.toLowerCase().includes(searchTerm)
    );
  }

  if (filtered.length === 0) {
    bookmarksContainer.innerHTML = '';
    noBookmarksMsg.classList.remove('hidden');
    return;
  }
  noBookmarksMsg.classList.add('hidden');
  bookmarksContainer.innerHTML = filtered.map(bookmark => {
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(bookmark.url)}&sz=32`;
    return `
      <div class="bookmark-card" data-id="${bookmark.id}" data-url="${bookmark.url}">
        <img src="${faviconUrl}" class="bookmark-favicon" alt="" onerror="this.style.display='none'">
        <div class="bookmark-title">${escapeHtml(bookmark.title)}</div>
        <div class="bookmark-url">${escapeHtml(new URL(bookmark.url).hostname)}</div>
        <div class="bookmark-actions">
          <button class="edit-bookmark" data-id="${bookmark.id}">✏️</button>
          <button class="delete-bookmark" data-id="${bookmark.id}">🗑️</button>
        </div>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.bookmark-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      window.open(card.dataset.url, '_blank');
    });
  });
  document.querySelectorAll('.edit-bookmark').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      editBookmark(btn.dataset.id);
    });
  });
  document.querySelectorAll('.delete-bookmark').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteBookmark(btn.dataset.id);
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function editBookmark(id) {
  const bookmark = bookmarks.find(b => b.id === id);
  if (!bookmark) return;
  editingBookmarkId = id;
  bookmarkIdInput.value = id;
  bookmarkTitleInput.value = bookmark.title;
  bookmarkUrlInput.value = bookmark.url;
  bookmarkCategorySelect.value = bookmark.category;
  formTitle.textContent = 'Edit Bookmark';
  formContainer.classList.remove('hidden');
}

function deleteBookmark(id) {
  bookmarks = bookmarks.filter(b => b.id !== id);
  saveToStorage();
  renderBookmarks();
}

bookmarkForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = bookmarkTitleInput.value.trim();
  let url = bookmarkUrlInput.value.trim();
  const category = bookmarkCategorySelect.value;

  if (!title || !url) return;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  if (editingBookmarkId) {
    const index = bookmarks.findIndex(b => b.id === editingBookmarkId);
    if (index !== -1) bookmarks[index] = { ...bookmarks[index], title, url, category };
    editingBookmarkId = null;
  } else {
    bookmarks.push({
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      title, url, category
    });
  }

  saveToStorage();
  formContainer.classList.add('hidden');
  bookmarkForm.reset();
  renderCategories();
  renderBookmarks();
});

cancelBookmarkBtn.addEventListener('click', () => {
  formContainer.classList.add('hidden');
  bookmarkForm.reset();
  editingBookmarkId = null;
});

showAddBookmarkBtn.addEventListener('click', () => {
  editingBookmarkId = null;
  formTitle.textContent = 'Add Bookmark';
  bookmarkIdInput.value = '';
  bookmarkForm.reset();
  formContainer.classList.remove('hidden');
});

bookmarkSearch.addEventListener('input', renderBookmarks);

// =============================================
// IMPORT/EXPORT
// =============================================
exportBookmarksBtn.addEventListener('click', () => {
  const data = { bookmarks, categories };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bookmarks_backup.json';
  a.click();
  URL.revokeObjectURL(url);
});

importBookmarksBtn.addEventListener('click', () => importBookmarksFile.click());
importBookmarksFile.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (data.bookmarks) bookmarks = data.bookmarks;
      if (data.categories) categories = data.categories;
      saveToStorage();
      renderCategories();
      renderBookmarks();
    } catch { alert('Invalid file.'); }
  };
  reader.readAsText(file);
  importBookmarksFile.value = '';
});

// =============================================
// PASSWORD GENERATOR
// =============================================
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

function generatePassword() {
  let charset = '';
  if (includeUppercase.checked) charset += UPPERCASE;
  if (includeLowercase.checked) charset += LOWERCASE;
  if (includeNumbers.checked) charset += NUMBERS;
  if (includeSymbols.checked) charset += SYMBOLS;
  if (charset === '') {
    alert('Select at least one character type');
    return '';
  }
  const length = parseInt(passwordLength.value);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

function updateStrength(password) {
  let strength = 0;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  let level = 'weak';
  if (strength >= 4) level = 'strong';
  else if (strength >= 3) level = 'medium';
  else if (strength >= 5) level = 'very-strong';
  strengthBar.dataset.strength = level;
  strengthText.textContent = level.charAt(0).toUpperCase() + level.slice(1);
  if (level === 'very-strong') strengthText.textContent = 'Very Strong';
}

function refreshPassword() {
  const pwd = generatePassword();
  generatedPassword.value = pwd;
  updateStrength(pwd);
  if (historyEnabled && pwd) {
    passwordHistory.unshift(pwd);
    if (passwordHistory.length > 10) passwordHistory.pop();
    renderHistory();
  }
}

function renderHistory() {
  if (passwordHistory.length === 0) {
    passwordHistoryList.innerHTML = '<div class="history-item">No history</div>';
    return;
  }
  passwordHistoryList.innerHTML = passwordHistory.map(p => 
    `<div class="history-item"><span>${p}</span><button class="copy-history" data-pwd="${p}">📋</button></div>`
  ).join('');
  document.querySelectorAll('.copy-history').forEach(btn => {
    btn.addEventListener('click', () => navigator.clipboard.writeText(btn.dataset.pwd));
  });
}

passwordLength.addEventListener('input', () => lengthValue.textContent = passwordLength.value);
generatePasswordBtn.addEventListener('click', refreshPassword);
copyPasswordBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(generatedPassword.value);
  alert('Password copied!');
});
enableHistory.addEventListener('change', (e) => {
  historyEnabled = e.target.checked;
  passwordHistoryList.classList.toggle('hidden', !historyEnabled);
  clearHistoryBtn.classList.toggle('hidden', !historyEnabled);
  if (!historyEnabled) passwordHistory = [];
  else renderHistory();
});
clearHistoryBtn.addEventListener('click', () => {
  passwordHistory = [];
  renderHistory();
});
refreshPassword();

// =============================================
// LINK CHECKER (with reset)
// =============================================
async function checkLink(url) {
  statusIndicator.className = 'status-indicator';
  statusText.textContent = 'Checking...';
  const start = performance.now();

  const show = (ok, msg) => {
    statusIndicator.classList.add(ok ? 'success' : 'error');
    statusText.textContent = `${ok ? '✅' : '❌'} ${msg} · ${Math.round(performance.now()-start)}ms`;
  };

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);
    await fetch(url, { method: 'GET', mode: 'no-cors', signal: controller.signal });
    clearTimeout(id);
    show(true, 'Reachable (opaque)');
    return;
  } catch (e) {}

  try {
    await new Promise((resolve, reject) => {
      const img = new Image();
      const timer = setTimeout(() => { img.src = ''; reject('timeout'); }, 5000);
      img.onload = () => { clearTimeout(timer); resolve(); };
      img.onerror = () => { clearTimeout(timer); resolve(); };
      img.src = url + (url.includes('?')?'&':'?') + '_=' + Date.now();
    });
    show(true, 'Reachable (image)');
    return;
  } catch (e) {
    show(false, 'Cannot reach server');
  }
}

checkLinkBtn.addEventListener('click', () => {
  let url = linkUrlInput.value.trim();
  if (!url) return;
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  checkLink(url);
});

clearLinkBtn.addEventListener('click', () => {
  linkUrlInput.value = 'https://';
  statusIndicator.className = 'status-indicator';
  statusText.textContent = 'Enter a URL above';
});

// =============================================
// QR GENERATOR (API-based, with reset)
// =============================================
generateQrBtn.addEventListener('click', () => {
  const text = qrUrlInput.value.trim();
  if (!text) {
    alert('Enter text or URL');
    return;
  }

  qrPlaceholder.style.display = 'flex';
  qrPlaceholder.textContent = 'Generating...';
  qrCanvas.style.display = 'none';
  downloadQrBtn.disabled = true;

  const ctx = qrCanvas.getContext('2d');
  ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);

  const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = () => {
    qrCanvas.width = img.width;
    qrCanvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    qrCanvas.style.display = 'block';
    qrPlaceholder.style.display = 'none';
    downloadQrBtn.disabled = false;
  };
  img.onerror = () => {
    qrPlaceholder.textContent = 'QR API failed. Try again.';
  };
  img.src = apiUrl;
});

clearQrBtn.addEventListener('click', () => {
  qrUrlInput.value = 'https://';
  qrCanvas.style.display = 'none';
  qrPlaceholder.style.display = 'flex';
  qrPlaceholder.textContent = 'Your QR code will appear here';
  downloadQrBtn.disabled = true;
});

downloadQrBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'qrcode.png';
  link.href = qrCanvas.toDataURL();
  link.click();
});

// =============================================
// QR SCANNER (with reset)
// =============================================
cameraScanBtn.addEventListener('click', async () => {
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' } 
    });
    qrVideo.srcObject = videoStream;
    cameraView.classList.remove('hidden');
    scanResult.classList.add('hidden');
    scanInterval = setInterval(scanFromVideo, 500);
  } catch (err) {
    alert('Camera access denied or not available.');
  }
});

stopCameraBtn.addEventListener('click', () => {
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
  }
  if (scanInterval) {
    clearInterval(scanInterval);
    scanInterval = null;
  }
  cameraView.classList.add('hidden');
});

function scanFromVideo() {
  if (qrVideo.readyState !== qrVideo.HAVE_ENOUGH_DATA) return;
  const canvas = qrCanvasScanner;
  const ctx = canvas.getContext('2d');
  canvas.width = qrVideo.videoWidth;
  canvas.height = qrVideo.videoHeight;
  ctx.drawImage(qrVideo, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, canvas.width, canvas.height);
  if (code) {
    displayScanResult(code.data);
    stopCameraBtn.click();
  }
}

uploadScanBtn.addEventListener('click', () => qrImageUpload.click());

qrImageUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height);
      if (code) {
        displayScanResult(code.data);
      } else {
        alert('No QR code found in the image.');
      }
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
  qrImageUpload.value = '';
});

function displayScanResult(text) {
  decodedTextSpan.textContent = text;
  scanResult.classList.remove('hidden');
  const isUrl = /^https?:\/\//i.test(text);
  openDecodedBtn.disabled = !isUrl;
}

clearScannerBtn.addEventListener('click', () => {
  scanResult.classList.add('hidden');
  decodedTextSpan.textContent = '';
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
  }
  if (scanInterval) {
    clearInterval(scanInterval);
    scanInterval = null;
  }
  cameraView.classList.add('hidden');
  qrImageUpload.value = '';
});

copyDecodedBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(decodedTextSpan.textContent);
  alert('Copied!');
});

openDecodedBtn.addEventListener('click', () => {
  const text = decodedTextSpan.textContent;
  if (/^https?:\/\//i.test(text)) {
    window.open(text, '_blank');
  } else {
    window.open('https://' + text, '_blank');
  }
});

// =============================================
// ENCRYPTION TOOL (AES-GCM)
// =============================================
encryptTabBtn.addEventListener('click', () => {
  encryptTabBtn.classList.add('active');
  decryptTabBtn.classList.remove('active');
  encryptPanel.classList.remove('hidden');
  decryptPanel.classList.add('hidden');
});

decryptTabBtn.addEventListener('click', () => {
  decryptTabBtn.classList.add('active');
  encryptTabBtn.classList.remove('active');
  decryptPanel.classList.remove('hidden');
  encryptPanel.classList.add('hidden');
});

async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

encryptBtn.addEventListener('click', async () => {
  const plaintext = plaintextInput.value;
  const password = encryptPassword.value;
  if (!plaintext || !password) {
    alert('Enter text and password');
    return;
  }

  try {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encoder.encode(plaintext)
    );

    // Combine salt + iv + ciphertext
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    // Convert to Base64
    const base64 = btoa(String.fromCharCode(...combined));
    ciphertextOutput.value = base64;
  } catch (e) {
    alert('Encryption failed: ' + e.message);
  }
});

decryptBtn.addEventListener('click', async () => {
  const ciphertext = ciphertextInput.value;
  const password = decryptPassword.value;
  if (!ciphertext || !password) {
    alert('Enter encrypted text and password');
    return;
  }

  try {
    const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const data = combined.slice(28);

    const key = await deriveKey(password, salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      data
    );

    const decoder = new TextDecoder();
    decryptedOutput.value = decoder.decode(decrypted);
  } catch (e) {
    alert('Decryption failed. Wrong password or corrupted data.');
  }
});

copyCiphertextBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(ciphertextOutput.value);
  alert('Copied!');
});

copyDecryptedBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(decryptedOutput.value);
  alert('Copied!');
});

// =============================================
// ENCRYPTION RESET
// =============================================
clearEncryptionBtn.addEventListener('click', () => {
  // Clear text encrypt fields
  plaintextInput.value = '';
  encryptPassword.value = '';
  ciphertextOutput.value = '';
  // Clear text decrypt fields
  ciphertextInput.value = '';
  decryptPassword.value = '';
  decryptedOutput.value = '';
  // Clear file fields
  fileInput.value = '';
  filePassword.value = '';
});

// =============================================
// FILE ENCRYPTION / DECRYPTION
// =============================================

// Helper to read file as ArrayBuffer
function readFileAsBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// Encrypt file
encryptFileBtn.addEventListener('click', async () => {
  const file = fileInput.files[0];
  const password = filePassword.value;
  if (!file || !password) {
    alert('Select a file and enter a password.');
    return;
  }

  try {
    const fileData = await readFileAsBuffer(file);
    const encoder = new TextEncoder();
    
    // Derive key
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const keyMaterial = await crypto.subtle.importKey(
      'raw', encoder.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']
    );
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt']
    );

    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv }, key, fileData
    );

    // Combine: salt (16) + iv (12) + ciphertext
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    // Download
    const blob = new Blob([combined], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name + '.enc';
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    alert('Encryption failed: ' + e.message);
  }
});

// Decrypt file
decryptFileBtn.addEventListener('click', async () => {
  const file = fileInput.files[0];
  const password = filePassword.value;
  if (!file || !password) {
    alert('Select an encrypted (.enc) file and enter the password.');
    return;
  }

  try {
    const fileData = await readFileAsBuffer(file);
    const data = new Uint8Array(fileData);
    
    // Extract salt, iv, ciphertext
    if (data.length < 28) throw new Error('File too small');
    const salt = data.slice(0, 16);
    const iv = data.slice(16, 28);
    const ciphertext = data.slice(28);

    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw', encoder.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']
    );
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv }, key, ciphertext
    );

    // Guess original filename (remove .enc if present)
    let originalName = file.name;
    if (originalName.endsWith('.enc')) originalName = originalName.slice(0, -4);

    const blob = new Blob([decrypted]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = originalName;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    alert('Decryption failed. Wrong password or corrupted file.');
  }
});

// =============================================
// INITIAL RENDER & SORTABLE
// =============================================
renderCategories();
renderBookmarks();

new Sortable(bookmarksContainer, {
  animation: 150,
  ghostClass: 'sortable-ghost',
  onEnd: function() {
    const cards = [...bookmarksContainer.querySelectorAll('.bookmark-card')];
    const newOrderIds = cards.map(card => card.dataset.id);
    const categoryBookmarks = bookmarks.filter(b => b.category === currentCategory);
    const otherBookmarks = bookmarks.filter(b => b.category !== currentCategory);
    const reordered = newOrderIds.map(id => categoryBookmarks.find(b => b.id === id)).filter(b => b);
    bookmarks = [...otherBookmarks, ...reordered];
    saveToStorage();
  }
});
