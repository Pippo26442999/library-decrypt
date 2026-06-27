const MASTER_PASSWORD = "pippo";
const DECRYPT_PASSWORD = "pippo";

if (!sessionStorage.getItem('linklock_unlocked')) {
    const overlay = document.createElement('div');
    overlay.id = 'unlock-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.97);
        backdrop-filter: blur(20px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999;
        font-family: 'Segoe UI', sans-serif;
    `;
    
    overlay.innerHTML = `
        <div style="background: rgba(26,26,46,0.9); padding: 40px; border-radius: 28px; max-width: 400px; width: 90%; border: 1px solid rgba(255,255,255,0.06); text-align: center; box-shadow: 0 30px 60px rgba(0,0,0,0.8);">
            <h1 style="font-size: 4em; margin-bottom: 10px;">🔒</h1>
            <h2 style="color: #fff; margin-bottom: 8px; font-weight: 600;">Admin Access</h2>
            <p style="color: rgba(255,255,255,0.35); font-size: 14px; margin-bottom: 25px;">Enter the password to access</p>
            <input type="password" id="unlock-password" placeholder="Enter password..." style="
                width: 100%;
                padding: 14px 18px;
                background: rgba(255,255,255,0.04);
                border: 1px solid rgba(255,255,255,0.06);
                border-radius: 14px;
                color: #fff;
                font-size: 16px;
                outline: none;
                transition: all 0.3s;
                box-sizing: border-box;
            ">
            <div id="unlock-error" style="color: #e94560; font-size: 13px; margin-top: 8px; min-height: 24px;"></div>
            <button id="unlock-btn" style="
                width: 100%;
                padding: 14px;
                margin-top: 15px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.06);
                border-radius: 14px;
                color: #fff;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            ">🔓 Unlock</button>
            <p style="color: rgba(255,255,255,0.08); font-size: 11px; margin-top: 15px;">Only the admin can create new links</p>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    const passwordInput = document.getElementById('unlock-password');
    const errorDiv = document.getElementById('unlock-error');
    const unlockBtn = document.getElementById('unlock-btn');
    
    function attemptUnlock() {
        const pass = passwordInput.value.trim();
        if (pass === MASTER_PASSWORD) {
            sessionStorage.setItem('linklock_unlocked', 'true');
            overlay.remove();
            showToast('✅ Access granted!', 'success');
            initApp();
            return true;
        } else {
            errorDiv.textContent = '❌ Wrong password. Try again.';
            passwordInput.value = '';
            passwordInput.focus();
            return false;
        }
    }
    
    unlockBtn.addEventListener('click', attemptUnlock);
    passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') attemptUnlock();
    });
} else {
    document.addEventListener('DOMContentLoaded', initApp);
}

function showToast(message, type = 'success') {
    const oldToasts = document.querySelectorAll('.toast');
    oldToasts.forEach(t => {
        t.classList.add('toast-hide');
        setTimeout(() => t.remove(), 500);
    });
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('toast-hide');
        setTimeout(() => toast.remove(), 500);
    }, 3500);
}

function initApp() {
    if (window._appInitialized) return;
    window._appInitialized = true;
    
    console.log('✅ App initialized');
    
    const urlInput = document.getElementById('url-input');
    const encryptBtn = document.getElementById('encrypt-btn');
    const resetBtn = document.getElementById('reset-btn');
    const resultBox = document.getElementById('result-box');
    const resultValue = document.getElementById('result-value');
    const copyBtn = document.getElementById('copy-btn');
    const openBtn = document.getElementById('open-btn');
    const qrBtn = document.getElementById('qr-btn');
    const advancedToggle = document.getElementById('advanced-toggle');
    const advancedOptions = document.getElementById('advanced-options');
    const advancedArrow = document.getElementById('advanced-arrow');
    const randomIv = document.getElementById('random-iv');
    const randomSalt = document.getElementById('random-salt');
    const addExpiry = document.getElementById('add-expiry');
    const expiryGroup = document.getElementById('expiry-group');
    const expiryDate = document.getElementById('expiry-date');
    
    let generatedLink = '';
    
    let advancedOpen = false;
    if (advancedToggle) {
        advancedToggle.addEventListener('click', () => {
            advancedOpen = !advancedOpen;
            advancedOptions.classList.toggle('show', advancedOpen);
            advancedArrow.textContent = advancedOpen ? '▼' : '▶';
        });
    }
    
    if (addExpiry) {
        addExpiry.addEventListener('change', () => {
            expiryGroup.style.display = addExpiry.checked ? 'block' : 'none';
            if (addExpiry.checked) {
                const now = new Date();
                now.setDate(now.getDate() + 7);
                expiryDate.value = now.toISOString().slice(0, 16);
            }
        });
    }
    
    if (encryptBtn) {
        encryptBtn.addEventListener('click', async function() {
            const url = urlInput.value.trim();
            
            if (!url) {
                showToast('❌ Enter a valid URL', 'error');
                return;
            }
            
            try {
                new URL(url);
            } catch {
                showToast('❌ Invalid URL', 'error');
                return;
            }
            
            encryptBtn.disabled = true;
            encryptBtn.textContent = '⏳ Encrypting...';
            
            try {
                const data = {
                    v: '0.0.1',
                    u: url
                };
                
                if (addExpiry && addExpiry.checked && expiryDate.value) {
                    data.e = new Date(expiryDate.value).toISOString();
                }
                
                const encrypted = await encryptData(JSON.stringify(data), DECRYPT_PASSWORD, {
                    randomIv: randomIv ? randomIv.checked : true,
                    randomSalt: randomSalt ? randomSalt.checked : false
                });
                
                const baseUrl = window.location.origin + window.location.pathname.replace('index.html', '');
                const link = baseUrl + 'decrypt-public.html#' + encrypted;
                
                generatedLink = link;
                resultValue.textContent = link;
                resultBox.classList.add('show');
                
                showToast('✅ Link created successfully!', 'success');
                
            } catch (error) {
                showToast('❌ Error: ' + error.message, 'error');
                console.error(error);
            } finally {
                encryptBtn.disabled = false;
                encryptBtn.textContent = '🔐 Create Protected Link';
            }
        });
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            urlInput.value = '';
            resultBox.classList.remove('show');
            generatedLink = '';
            if (addExpiry && addExpiry.checked) {
                addExpiry.checked = false;
                expiryGroup.style.display = 'none';
            }
            showToast('↻ Reset complete', 'info');
        });
    }
    
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            if (!generatedLink) {
                showToast('❌ No link to copy', 'error');
                return;
            }
            navigator.clipboard.writeText(generatedLink).then(() => {
                showToast('📋 Link copied!', 'success');
            }).catch(() => {
                const textarea = document.createElement('textarea');
                textarea.value = generatedLink;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                textarea.remove();
                showToast('📋 Link copied!', 'success');
            });
        });
    }
    
    if (openBtn) {
        openBtn.addEventListener('click', () => {
            if (generatedLink) {
                window.open(generatedLink, '_blank');
            }
        });
    }
    
    if (qrBtn) {
        qrBtn.addEventListener('click', () => {
            if (!generatedLink) {
                showToast('❌ No link for QR', 'error');
                return;
            }
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(generatedLink)}`;
            window.open(qrUrl, '_blank');
        });
    }
    
    // ===== URL DI DEFAULT VUOTO (rimosso esempio) =====
    // urlInput.value = 'https://example.com/secret-document';
}

const styleSheet = document.createElement("style");
styleSheet.textContent = `
    @keyframes slideInRight {
        from { opacity: 0; transform: translateX(40px); }
        to { opacity: 1; transform: translateX(0); }
    }
`;
document.head.appendChild(styleSheet);
