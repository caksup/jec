// js/firebase-config.js
const firebaseConfig = {
    apiKey: "AIzaSyCL0UACFd3iJmEiWFJHCqNNQ_wrVBUuOJs",
    authDomain: "banksoal-tka.firebaseapp.com",
    projectId: "banksoal-tka",
    storageBucket: "banksoal-tka.firebasestorage.app",
    messagingSenderId: "577111346615",
    appId: "1:577111346615:web:6bc575f9e7a82c118dec32"
};

// Inisialisasi Firebase (Mencegah inisialisasi ganda)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// INISIALISASI CLOUD FIRESTORE
// Variabel 'db' ini yang akan dipakai di semua file JS lainnya
const db = firebase.firestore();