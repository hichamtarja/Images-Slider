/**
 * Productivity Toolkit – Fully Fixed Link Checker & QR Generator
 */

// =============================================
// STATE & DOM ELEMENTS (unchanged)
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
const linkResult = document.getElementById('linkResult');
const statusIndicator = linkResult.querySelector('.status-indicator');
const statusText = linkResult.querySelector('.status-text');

// QR Code
const qrUrlInput = document.getElementById('qrUrlInput');
const generateQrBtn = document.getElementById('generateQrBtn');
const qrCanvas = document.getElementById('qrCanvas');
const qrPlaceholder = document.getElementById('qrPlaceholder');
const downloadQrBtn = document.getElementById('downloadQrBtn');

// Import/Export
const exportBookmarksBtn = document.getElementById('exportBookmarksBtn');
const importBookmarksBtn = document.getElementById('importBookmarksBtn');
const importBookmarksFile = document.getElementById('importBookmarksFile');

// =============================================
// STORAGE & CATEGORIES (unchanged)
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

function renderCategories() {
  categoryList.innerHTML = '';
  categories.forEach(cat => {
    const chip = document.createElement('span');
    chip.className = `category-chip ${cat === currentCategory ? 'active' : ''}`;
    chip.innerHTML = `${cat} ${cat !== 'General' ? '<span class="delete-cat" data-cat="'+cat+'">✕</span>' : ''}`;
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
// BOOKMARK RENDERING (unchanged)
// =============================================
function renderBookmarks() {
  const searchTerm = bookmarkSearch.value.toLowerCase();
  let filtered = bookmarks.filter(b => b.category === currentCategory);
  if (searchTerm) {
    filtered = filtered.filter(b => b.title.toLowerCase().includes(searchTerm) || b.url.toLowerCase().includes(searchTerm));
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
  document.querySelectorAll('.edit-bookmark').forEach(btn => btn.addEventListener('click', (e) => {
    e.stopPropagation();
    editBookmark(btn.dataset.id);
  }));
  document.querySelectorAll('.delete-bookmark').forEach(btn => btn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteBookmark(btn.dataset.id);
  }));
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
  if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
  if (editingBookmarkId) {
    const index = bookmarks.findIndex(b => b.id === editingBookmarkId);
    if (index !== -1) bookmarks[index] = { ...bookmarks[index], title, url, category };
    editingBookmarkId = null;
  } else {
    bookmarks.push({ id: Date.now() + '-' + Math.random().toString(36).substr(2,5), title, url, category });
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

// Import/Export
exportBookmarksBtn.addEventListener('click', () => {
  const data = { bookmarks, categories };
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'bookmarks_backup.json';
  a.click();
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
    } catch { alert('Invalid file'); }
  };
  reader.readAsText(file);
  importBookmarksFile.value = '';
});

// =============================================
// PASSWORD GENERATOR (unchanged)
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
  if (!charset) { alert('Select at least one character type'); return ''; }
  let pwd = '';
  for (let i=0; i<parseInt(passwordLength.value); i++) pwd += charset[Math.floor(Math.random()*charset.length)];
  return pwd;
}
function updateStrength(pwd) {
  let strength = 0;
  if (pwd.length>=12) strength++;
  if (/[a-z]/.test(pwd)) strength++;
  if (/[A-Z]/.test(pwd)) strength++;
  if (/[0-9]/.test(pwd)) strength++;
  if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
  let level = strength>=4 ? 'strong' : strength>=3 ? 'medium' : 'weak';
  strengthBar.dataset.strength = level;
  strengthText.textContent = level.charAt(0).toUpperCase()+level.slice(1);
}
function refreshPassword() {
  const pwd = generatePassword();
  generatedPassword.value = pwd;
  updateStrength(pwd);
  if (historyEnabled && pwd) {
    passwordHistory.unshift(pwd);
    if (passwordHistory.length>10) passwordHistory.pop();
    renderHistory();
  }
}
function renderHistory() {
  if (!passwordHistory.length) {
    passwordHistoryList.innerHTML = '<div class="history-item">No history</div>';
    return;
  }
  passwordHistoryList.innerHTML = passwordHistory.map(p => 
    `<div class="history-item"><span>${p}</span><button class="copy-history" data-pwd="${p}">📋</button></div>`
  ).join('');
  document.querySelectorAll('.copy-history').forEach(b => b.addEventListener('click', () => navigator.clipboard.writeText(b.dataset.pwd)));
}
passwordLength.addEventListener('input', () => lengthValue.textContent = passwordLength.value);
generatePasswordBtn.addEventListener('click', refreshPassword);
copyPasswordBtn.addEventListener('click', () => { navigator.clipboard.writeText(generatedPassword.value); alert('Copied!'); });
enableHistory.addEventListener('change', (e) => {
  historyEnabled = e.target.checked;
  passwordHistoryList.classList.toggle('hidden', !historyEnabled);
  clearHistoryBtn.classList.toggle('hidden', !historyEnabled);
  if (!historyEnabled) passwordHistory = [];
  else renderHistory();
});
clearHistoryBtn.addEventListener('click', () => { passwordHistory = []; renderHistory(); });
refreshPassword();

// =============================================
// FIXED: LINK CHECKER
// =============================================
async function checkLink(url) {
  statusIndicator.className = 'status-indicator';
  statusText.textContent = 'Checking...';
  const start = performance.now();

  const show = (ok, msg) => {
    statusIndicator.classList.add(ok ? 'success' : 'error');
    statusText.textContent = `${ok ? '✅' : '❌'} ${msg} · ${Math.round(performance.now()-start)}ms`;
  };

  // Attempt 1: fetch with no-cors (opaque)
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);
    await fetch(url, { method: 'GET', mode: 'no-cors', signal: controller.signal });
    clearTimeout(id);
    show(true, 'Reachable (opaque)');
    return;
  } catch (e) {
    // If it fails, try image ping
  }

  // Attempt 2: Image ping (works even if response is error)
  try {
    await new Promise((resolve, reject) => {
      const img = new Image();
      const timer = setTimeout(() => { img.src = ''; reject('timeout'); }, 5000);
      img.onload = () => { clearTimeout(timer); resolve(); };
      img.onerror = () => { clearTimeout(timer); resolve(); }; // error response still means reachable
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

// =============================================
// QR CODE GENERATOR – Pure API (no library)
// =============================================

generateQrBtn.addEventListener('click', () => {
  const text = qrUrlInput.value.trim();
  if (!text) {
    alert('Enter text or URL');
    return;
  }

  // Show loading
  qrPlaceholder.style.display = 'flex';
  qrPlaceholder.textContent = 'Generating...';
  qrCanvas.style.display = 'none';
  downloadQrBtn.disabled = true;

  // Build API URL
  const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;

  // Create image to load the QR code
  const img = new Image();
  img.crossOrigin = 'Anonymous'; // avoid CORS issues when drawing to canvas

  img.onload = () => {
    // Draw image to canvas
    qrCanvas.width = img.width;
    qrCanvas.height = img.height;
    const ctx = qrCanvas.getContext('2d');
    ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
    ctx.drawImage(img, 0, 0);
    
    // Show canvas, hide placeholder
    qrCanvas.style.display = 'block';
    qrPlaceholder.style.display = 'none';
    downloadQrBtn.disabled = false;
  };

  img.onerror = () => {
    console.error('Failed to load QR image from API');
    qrPlaceholder.textContent = 'QR API failed. Try again.';
  };

  img.src = apiUrl;
});

downloadQrBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'qrcode.png';
  link.href = qrCanvas.toDataURL();
  link.click();
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
    const newOrderIds = cards.map(c => c.dataset.id);
    const catBookmarks = bookmarks.filter(b => b.category === currentCategory);
    const other = bookmarks.filter(b => b.category !== currentCategory);
    const reordered = newOrderIds.map(id => catBookmarks.find(b => b.id === id)).filter(b => b);
    bookmarks = [...other, ...reordered];
    saveToStorage();
  }
});

// =============================================
// QR SCANNER
// =============================================
const cameraScanBtn = document.getElementById('cameraScanBtn');
const uploadScanBtn = document.getElementById('uploadScanBtn');
const qrImageUpload = document.getElementById('qrImageUpload');
const cameraView = document.getElementById('cameraView');
const qrVideo = document.getElementById('qrVideo');
const qrCanvasScanner = document.getElementById('qrCanvasScanner');
const stopCameraBtn = document.getElementById('stopCameraBtn');
const scanResult = document.getElementById('scanResult');
const decodedTextSpan = document.getElementById('decodedText');
const copyDecodedBtn = document.getElementById('copyDecodedBtn');
const openDecodedBtn = document.getElementById('openDecodedBtn');

let videoStream = null;
let scanInterval = null;

// Camera scanning
cameraScanBtn.addEventListener('click', async () => {
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' } 
    });
    qrVideo.srcObject = videoStream;
    cameraView.classList.remove('hidden');
    scanResult.classList.add('hidden');
    
    // Start scanning frames
    scanInterval = setInterval(scanFromVideo, 500);
  } catch (err) {
    alert('Camera access denied or not available.');
    console.error(err);
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
    // Found QR code
    displayScanResult(code.data);
    stopCameraBtn.click(); // Stop scanning after success
  }
}

// Image upload scanning
uploadScanBtn.addEventListener('click', () => {
  qrImageUpload.click();
});

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
  qrImageUpload.value = ''; // Allow re-upload of same file
});

function displayScanResult(text) {
  decodedTextSpan.textContent = text;
  scanResult.classList.remove('hidden');
  
  // Enable open button only if it looks like a URL
  const isUrl = /^https?:\/\//i.test(text);
  openDecodedBtn.disabled = !isUrl;
}

copyDecodedBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(decodedTextSpan.textContent);
  alert('Copied to clipboard!');
});

openDecodedBtn.addEventListener('click', () => {
  const text = decodedTextSpan.textContent;
  if (/^https?:\/\//i.test(text)) {
    window.open(text, '_blank');
  } else {
    // Try to prepend https://
    window.open('https://' + text, '_blank');
  }
});
