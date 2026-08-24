// js/hash.js

const SecurityUtil = {
    /**
     * Hash string (PIN) menggunakan algoritma SHA-256 bawaan Web Crypto API
     */
    hashPin: async function(pin) {
        const encoder = new TextEncoder();
        const data = encoder.encode(pin);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        // Return string Hexadecimal
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
};
