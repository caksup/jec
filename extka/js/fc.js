/* #07 | /root/js/fc.js | v 2.0 | u 06/09/2026 • 22:00:00 | xu : ke-2 | note : 
- Firebase Config classic (pakai Compat SDK yang di-include di ap.html)
- Inisialisasi Firebase Firestore untuk project jec-extka
- Export db ke window agar bisa dipakai global di semua file js/ */

var firebaseConfig = {
  apiKey: "AIzaSyCbvRHwaqylM5SHIEpAJ64p06dNyL8ELFA",
  authDomain: "jec-extka.firebaseapp.com",
  projectId: "jec-extka",
  storageBucket: "jec-extka.firebasestorage.app",
  messagingSenderId: "690768918335",
  appId: "1:690768918335:web:00790eaf004816b94a458a"
};

firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();

// Expose ke window untuk dipakai di semua file lain
window.db = db;
window.fdb = firebase.firestore; // FieldValue dll

console.log('✅ Firebase initialized - project: ' + firebaseConfig.projectId);