// ============================================================
//  Encryption/Decryption API - Compact Version
//  30-40% shorter links
// ============================================================

// ===== PREVIEW MAP - Only short names =====
const PREVIEW_MAP = {
    'akirabox': 'Akia',
    'vikingfile': 'Viki',
    'filekeeper': 'FileK',
    'datavault': 'Vault',
    'datanodes': 'Data'
};

function getPreviewName(domain) {
    domain = domain.toLowerCase();
    for (const [key, value] of Object.entries(PREVIEW_MAP)) {
        if (domain.includes(key)) {
            return value;
        }
    }
    return '';
}

function extractDomainFromUrl(url) {
    try {
        const urlObj = new URL(url);
        let domain = urlObj.hostname;
        domain = domain.replace(/^www\./, '');
        return domain;
    } catch {
        return null;
    }
}

// ===== COMPRESS PAYLOAD =====
function compressPayload(payload) {
    const compressed = {
        v: payload.v || '0.0.1'
    };
    
    if (payload.e) compressed.e = payload.e;
    if (payload.s && payload.s !== 'AAAAAAAAAAAAAAAAAAAAAA') {
        compressed.s = payload.s;
    }
    if (payload.i && payload.i !== 'AAAAAAAAAAAAAAAAAAAA') {
        compressed.i = payload.i;
    }
    if (payload.ri === true) compressed.r = 1;
    if (payload.rs === true) compressed.rs = 1;
    if (payload.n) compressed.n = payload.n;
    
    return compressed;
}

// ===== DECOMPRESS PAYLOAD =====
function decompressPayload(compressed) {
    const payload = {
        v: compressed.v || '0.0.1'
    };
    
    if (compressed.e) payload.e = compressed.e;
    payload.s = compressed.s || 'AAAAAAAAAAAAAAAAAAAAAA';
    payload.i = compressed.i || 'AAAAAAAAAAAAAAAAAAAA';
    payload.ri = compressed.r === 1;
    payload.rs = compressed.rs === 1 || false;
    if (compressed.n) payload.n = compressed.n;
    
    return payload;
}

async function encryptData(data, password, options = {}) {
    const { randomIv = true, randomSalt = false } = options;
    
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    let salt;
    let saltBase64;
    if (randomSalt) {
        salt = crypto.getRandomValues(new Uint8Array(16));
        saltBase64 = btoa(String.fromCharCode(...salt));
    } else {
        saltBase64 = 'AAAAAAAAAAAAAAAAAAAAAA';
    }
    
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: randomSalt ? salt : new Uint8Array(16),
            iterations: 600000,
            hash: 'SHA-256'
        },
        keyMaterial,
        {
            name: 'AES-GCM',
            length: 256
        },
        false,
        ['encrypt']
    );
    
    let iv;
    let ivBase64;
    if (randomIv) {
        iv = crypto.getRandomValues(new Uint8Array(12));
        ivBase64 = btoa(String.fromCharCode(...iv));
    } else {
        ivBase64 = 'AAAAAAAAAAAAAAAAAAAA';
    }
    
    const encrypted = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: randomIv ? iv : new Uint8Array(12)
        },
        key,
        dataBuffer
    );
    
    const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    
    // ===== Extract preview name from domain =====
    let previewName = '';
    try {
        const parsed = JSON.parse(data);
        if (parsed.u) {
            const domain = extractDomainFromUrl(parsed.u);
            if (domain) {
                previewName = getPreviewName(domain);
            }
        }
    } catch {
        // Not JSON
    }
    
    const payload = {
        v: '0.0.1',
        e: encryptedBase64
    };
    
    if (randomSalt) {
        payload.s = saltBase64;
    }
    if (randomIv) {
        payload.i = ivBase64;
    }
    if (randomIv) payload.r = 1;
    if (randomSalt) payload.rs = 1;
    if (previewName) payload.n = previewName;
    
    const compressed = compressPayload(payload);
    
    return btoa(JSON.stringify(compressed));
}

async function decryptData(data, password) {
    const decoder = new TextDecoder();
    
    const compressed = data;
    const payload = decompressPayload(compressed);
    
    const encrypted = Uint8Array.from(atob(payload.e), c => c.charCodeAt(0));
    
    let salt;
    if (payload.s && payload.s !== 'AAAAAAAAAAAAAAAAAAAAAA') {
        salt = Uint8Array.from(atob(payload.s), c => c.charCodeAt(0));
    } else {
        salt = new Uint8Array(16);
    }
    
    let iv;
    if (payload.i && payload.i !== 'AAAAAAAAAAAAAAAAAAAA') {
        iv = Uint8Array.from(atob(payload.i), c => c.charCodeAt(0));
    } else {
        iv = new Uint8Array(12);
    }
    
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 600000,
            hash: 'SHA-256'
        },
        keyMaterial,
        {
            name: 'AES-GCM',
            length: 256
        },
        false,
        ['decrypt']
    );
    
    const decrypted = await crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        key,
        encrypted
    );
    
    return decoder.decode(decrypted);
}