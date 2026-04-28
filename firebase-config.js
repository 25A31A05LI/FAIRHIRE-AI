// firebase-config.js
// Firebase Integration setup for FAIRHIRE AI

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCNhR_2uSlSaYrTJndB0cESWNIsMiwFT_E",
    authDomain: "fairhire-ai-83c25.firebaseapp.com",
    projectId: "fairhire-ai-83c25",
    storageBucket: "fairhire-ai-83c25.firebasestorage.app",
    messagingSenderId: "918789084049",
    appId: "1:918789084049:web:54ad166d51072bbb614030"
};
// Initialize Firebase only if the API key has been replaced (to prevent console errors during testing)
let auth, db, storage;

if (firebaseConfig.apiKey !== "YOUR_API_KEY_HERE") {
    // Initialize Firebase app
    const app = firebase.initializeApp(firebaseConfig);

    // Initialize services
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();

    console.log("Firebase Initialized Successfully.");
} else {
    console.warn("⚠️ FIREBASE NOT CONFIGURED: Please update firebaseConfig in firebase-config.js. App is currently running in local fallback mode.");

    // Create dummy objects to prevent the app from crashing before config is set
    auth = {
        setPersistence: () => Promise.resolve(),
        signInWithEmailAndPassword: () => Promise.reject(new Error("Firebase not configured")),
        createUserWithEmailAndPassword: () => Promise.reject(new Error("Firebase not configured")),
        currentUser: null,
        signOut: () => Promise.resolve(),
        onAuthStateChanged: (cb) => { setTimeout(() => cb(null), 100); return () => { }; }
    };
    db = {
        collection: () => ({
            doc: () => ({
                set: () => Promise.resolve(),
                get: () => Promise.resolve({ exists: false, data: () => ({}) })
            })
        })
    };
    storage = {
        ref: () => ({
            put: () => Promise.resolve(),
            getDownloadURL: () => Promise.resolve("")
        })
    };
}

// Export to window for access in app.js
window.firebaseAuth = auth;
window.firebaseDb = db;
window.firebaseStorage = storage;
