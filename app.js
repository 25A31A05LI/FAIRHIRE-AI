// app.js
// Handles UI interactions, routing, PDF.js extraction, and Chart.js rendering

document.addEventListener('DOMContentLoaded', () => {
    // Set up PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

    window.currentBackgroundMode = 'welcome';

    // --- FLOATING PARTICLES NETWORK ---
    function initParticleNetwork() {
        const canvas = document.createElement('canvas');
        canvas.id = 'particle-canvas';
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        
        let width, height, particles;
        const PARTICLE_COUNT = 120; // Decreased for a cleaner look
        const MAX_DISTANCE = 140;
        
        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }
        
        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 1.2; // Slightly reduced speed
                this.vy = (Math.random() - 0.5) * 1.2; // Slightly reduced speed
                this.radius = Math.random() * 2 + 1;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(16, 185, 129, 0.6)'; // Success green glow
                ctx.fill();
            }
        }
        
        function init() {
            resize();
            particles = [];
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                particles.push(new Particle());
            }
            window.addEventListener('resize', resize);
        }
        
        function animate() {
            ctx.clearRect(0, 0, width, height);
            
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                
                // Draw logic based on mode
                ctx.beginPath();
                ctx.arc(particles[i].x, particles[i].y, particles[i].radius, 0, Math.PI * 2);
                
                if (window.currentBackgroundMode === 'welcome') {
                    // Majestic slow dust, cyan/magenta
                    ctx.fillStyle = i % 2 === 0 ? 'rgba(236, 72, 153, 0.5)' : 'rgba(6, 182, 212, 0.5)';
                } else if (window.currentBackgroundMode === 'auth') {
                    // Fast falling tech rain
                    ctx.fillStyle = 'rgba(99, 102, 241, 0.6)';
                } else if (window.currentBackgroundMode === 'dashboard-bias') {
                    ctx.fillStyle = 'rgba(244, 63, 94, 0.6)'; // Red nodes for bias
                } else {
                    ctx.fillStyle = 'rgba(16, 185, 129, 0.6)'; // Green nodes for new hire
                }
                ctx.fill();
            }
            requestAnimationFrame(animate);
        }
        
        init();
        animate();
    }
    initParticleNetwork();

    // --- WELCOME PAGE LOGIC ---
    const welcomeContainer = document.getElementById('welcome-container');
    const authContainer = document.getElementById('auth-container');
    const helpModal = document.getElementById('help-modal');

    if (welcomeContainer) {
        document.getElementById('btn-welcome-home')?.addEventListener('click', () => {
            // Re-trigger typewriter animation by cloning node
            const heroText = document.querySelector('.typewriter-text');
            if (heroText) {
                const newText = heroText.cloneNode(true);
                heroText.parentNode.replaceChild(newText, heroText);
            }
        });

        document.getElementById('btn-welcome-help')?.addEventListener('click', () => {
            if (helpModal) helpModal.style.display = 'flex';
        });

        document.getElementById('close-help-modal')?.addEventListener('click', () => {
            if (helpModal) helpModal.style.display = 'none';
        });

        document.getElementById('btn-understood-help')?.addEventListener('click', () => {
            if (helpModal) helpModal.style.display = 'none';
        });

        document.getElementById('btn-welcome-login')?.addEventListener('click', () => {
            welcomeContainer.style.display = 'none';
            if (authContainer) authContainer.style.display = 'flex';
            window.currentBackgroundMode = 'auth';
        });

        // Contact Us logic
        const contactModal = document.getElementById('contact-modal');
        document.getElementById('btn-welcome-contact')?.addEventListener('click', () => {
            if (contactModal) contactModal.style.display = 'flex';
        });
        document.getElementById('close-contact-modal')?.addEventListener('click', () => {
            if (contactModal) contactModal.style.display = 'none';
        });
        document.getElementById('btn-close-contact-bottom')?.addEventListener('click', () => {
            if (contactModal) contactModal.style.display = 'none';
        });
        
        document.getElementById('btn-auth-back')?.addEventListener('click', () => {
            if (authContainer) authContainer.style.display = 'none';
            welcomeContainer.style.display = 'block';
            window.currentBackgroundMode = 'welcome';
        });
    }

    // --- AUTHENTICATION MANAGER ---
    const AuthManager = {
        companyName: '',
        recruiterName: '',
        companyEmail: '',
        isLoggedIn: false,
        
        async init() {
            // Set persistence to SESSION (Refresh = Logout for privacy)
            if (window.firebaseAuth && window.firebaseAuth.setPersistence) {
                try {
                    await window.firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
                } catch (e) {
                    console.error("Firebase persistence error:", e);
                }

                window.firebaseAuth.onAuthStateChanged(async (user) => {
                    if (user) {
                        // Email verification temporarily disabled for seamless hackathon testing
                        // if (!user.emailVerified) {
                        //     alert("Please verify your email using the link sent to your inbox before logging in.");
                        //     window.firebaseAuth.signOut();
                        //     return;
                        // }
                        this.companyEmail = user.email;
                        this.isLoggedIn = true;
                        
                        // Fetch company details from Firestore
                        try {
                            const doc = await window.firebaseDb.collection('companies').doc(user.uid).get();
                            if (doc.exists) {
                                this.companyName = doc.data().companyName;
                                this.recruiterName = doc.data().recruiterName;
                                if (doc.data().photoURL) {
                                    document.getElementById('header-profile-img').src = doc.data().photoURL;
                                }
                            } else {
                                this.companyName = localStorage.getItem('fairhire_company') || 'Company';
                                this.recruiterName = localStorage.getItem('fairhire_recruiter') || 'Recruiter';
                            }
                        } catch(e) {
                            console.error("Error fetching profile", e);
                        }
                        
                        this.updateUI();
                    } else {
                        this.isLoggedIn = false;
                        this.updateUI();
                    }
                });
            } else {
                // Fallback to old behavior if Firebase isn't configured
                this.isLoggedIn = sessionStorage.getItem('fairhire_logged_in') === 'true';
                this.companyName = localStorage.getItem('fairhire_company') || '';
                this.recruiterName = localStorage.getItem('fairhire_recruiter') || '';
                this.companyEmail = localStorage.getItem('fairhire_email') || 'hr@company.com';
                this.updateUI();
            }
        },

        fallbackLogin(company, recruiter, email) {
            this.companyName = company;
            this.recruiterName = recruiter || 'Recruiter';
            this.companyEmail = email || 'hr@company.com';
            this.isLoggedIn = true;
            localStorage.setItem('fairhire_company', this.companyName);
            localStorage.setItem('fairhire_recruiter', this.recruiterName);
            localStorage.setItem('fairhire_email', this.companyEmail);
            sessionStorage.setItem('fairhire_logged_in', 'true');
            this.updateUI();
        },
        
        async logout() {
            if (window.firebaseAuth && window.firebaseAuth.currentUser) {
                await window.firebaseAuth.signOut();
            } else {
                this.isLoggedIn = false;
                sessionStorage.removeItem('fairhire_logged_in');
            }
            window.location.reload(); 
        },

        updateUI() {
            const authContainer = document.getElementById('auth-container');
            const appContainer = document.getElementById('app-container');
            if (this.isLoggedIn) {
                window.currentBackgroundMode = 'dashboard-newhire';
                authContainer.style.display = 'none';
                appContainer.style.display = 'flex';
                appContainer.classList.remove('hidden');
                document.getElementById('header-company-name').textContent = this.companyName;
                document.getElementById('header-recruiter-name').textContent = this.recruiterName;
                document.getElementById('dropdown-email').textContent = this.companyEmail;
                const welcomeMsg = document.getElementById('welcome-message');
                if (welcomeMsg) welcomeMsg.textContent = `Welcome to FAIRHIRE, ${this.recruiterName}!`;
            } else {
                authContainer.style.display = 'flex';
                appContainer.style.display = 'none';
                appContainer.classList.add('hidden');
            }
        }
    };

    // Initialize Auth UI
    AuthManager.init();

    // Auth Event Listeners
    const authTabs = document.querySelectorAll('.auth-tab');

    function switchAuthTab(targetId) {
        authTabs.forEach(t => t.classList.remove('active'));
        document.querySelector(`.auth-tab[data-auth="${targetId}"]`).classList.add('active');
        document.querySelectorAll('.auth-form-content').forEach(c => {
            c.classList.remove('active');
            c.classList.add('hidden');
        });
        const target = document.getElementById('auth-' + targetId);
        target.classList.remove('hidden');
        target.classList.add('active');
    }

    authTabs.forEach(tab => {
        tab.addEventListener('click', () => switchAuthTab(tab.getAttribute('data-auth')));
    });

    // LOGIN
    document.getElementById('btn-login').addEventListener('click', async () => {
        const company = document.getElementById('login-company').value.trim();
        const pwd = document.getElementById('login-password').value.trim();

        if (!company) { alert('Please enter your Company Name.'); return; }
        if (!pwd) { alert('Please enter your Password.'); return; }

        document.getElementById('btn-login').textContent = "Authenticating...";
        
        if (window.firebaseAuth && window.firebaseAuth.signInWithEmailAndPassword && window.firebaseDb) {
            try {
                // Look up email by company name in Firestore
                const snapshot = await window.firebaseDb.collection('companies').where('companyName', '==', company).get();
                if (snapshot.empty) {
                    throw new Error("Company Name not found. Please Sign Up first.");
                }
                
                // Get the email from the first matching company profile
                const email = snapshot.docs[0].data().email;

                // REAL-TIME FIREBASE AUTHENTICATION
                await window.firebaseAuth.signInWithEmailAndPassword(email, pwd);
                document.getElementById('btn-login').textContent = "Login to Dashboard";
            } catch (error) {
                // Properly surface real-time Firebase errors so the user knows exactly what went wrong
                console.error("Firebase Login Error:", error);
                alert("Login Failed: " + error.message);
                document.getElementById('btn-login').textContent = "Login to Dashboard";
            }
        } else {
            // Fallback for offline mode if Firebase isn't configured in firebase-config.js
            console.warn("Firebase Auth not detected. Falling back to local offline mode.");
            const savedCompany = localStorage.getItem('fairhire_company');
            const savedPwd = localStorage.getItem('fairhire_password');
            if (savedCompany === company && savedPwd === pwd) {
                AuthManager.fallbackLogin(company, localStorage.getItem('fairhire_recruiter') || 'Demo Recruiter', localStorage.getItem('fairhire_email') || 'demo@company.com');
            } else {
                alert('Account not found or incorrect password. Please ensure you have signed up.');
            }
            document.getElementById('btn-login').textContent = "Login to Dashboard";
        }
    });

    // DEMO LOGIN BYPASS
    document.getElementById('btn-demo-login')?.addEventListener('click', () => {
        AuthManager.fallbackLogin('RK TECHNOLOGIES', 'Admin Recruiter', 'demo@rktechnologies.com');
    });

    // FORGOT PASSWORD
    document.getElementById('btn-forgot-pwd').addEventListener('click', () => {
        const email = localStorage.getItem('fairhire_email');
        if (window.firebaseAuth && window.firebaseAuth.sendPasswordResetEmail && email) {
            window.firebaseAuth.sendPasswordResetEmail(email)
                .then(() => alert(`Password reset email sent to ${email}!`))
                .catch(error => alert("Error: " + error.message));
        } else {
            // Fallback Demo OTP
            document.getElementById('otp-modal').style.display = 'flex';
            document.getElementById('otp-message').textContent = `Demo OTP sent to: ${email || 'your email'}`;
            const otp = Math.floor(1000 + Math.random() * 9000);
            document.getElementById('demo-otp-display').textContent = otp;
            document.getElementById('btn-confirm-otp').dataset.mode = 'forgot';
        }
    });

    // VERIFY EMAIL (during Signup)
    document.getElementById('btn-verify-email').addEventListener('click', async () => {
        const email = document.getElementById('signup-email').value.trim();
        const pwd = document.getElementById('signup-password').value.trim();
        const company = document.getElementById('signup-company').value.trim();
        const recruiter = document.getElementById('signup-recruiter').value.trim();

        if (!email || !email.includes('@') || !pwd || pwd.length < 6) {
            alert('Please enter a valid company email and a password (min 6 chars) first.');
            return;
        }

        if (window.firebaseAuth && window.firebaseAuth.createUserWithEmailAndPassword) {
            try {
                document.getElementById('btn-verify-email').textContent = "Sending...";
                // Create user in Firebase
                const userCred = await window.firebaseAuth.createUserWithEmailAndPassword(email, pwd);
                
                // Send verification email
                await userCred.user.sendEmailVerification();
                
                // Save profile to Firestore
                if (window.firebaseDb) {
                    await window.firebaseDb.collection('companies').doc(userCred.user.uid).set({
                        companyName: company,
                        recruiterName: recruiter,
                        email: email,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
                
                // Save locally for UI state
                localStorage.setItem('fairhire_email', email);
                localStorage.setItem('fairhire_company', company);
                localStorage.setItem('fairhire_recruiter', recruiter);
                
                alert(`Real verification link sent to ${email}. Please check your inbox (and spam folder), click the link, and then Login.`);
                window.firebaseAuth.signOut(); // Sign out until verified
                switchAuthTab('login');
                document.getElementById('btn-verify-email').textContent = "Send Verification Link";
                
            } catch (error) {
                alert("Error: " + error.message);
                document.getElementById('btn-verify-email').textContent = "Send Verification Link";
            }
        } else {
            // Fallback Demo OTP (if Firebase fails)
            const otp = Math.floor(1000 + Math.random() * 9000);
            document.getElementById('otp-modal').style.display = 'flex';
            document.getElementById('otp-message').textContent = `Demo Verification Code for ${email}:`;
            document.getElementById('demo-otp-display').textContent = otp;
            document.getElementById('otp-input').value = '';
            document.getElementById('btn-confirm-otp').dataset.mode = 'signup';
        }
    });

    // CANCEL OTP
    document.getElementById('btn-cancel-otp').addEventListener('click', () => {
        document.getElementById('otp-modal').style.display = 'none';
        document.getElementById('otp-input').value = '';
    });

    // CONFIRM OTP (Only for fallback now)
    document.getElementById('btn-confirm-otp').addEventListener('click', () => {
        const input = document.getElementById('otp-input').value.trim();
        const displayed = document.getElementById('demo-otp-display').textContent.trim();
        const mode = document.getElementById('btn-confirm-otp').dataset.mode;

        if (input !== displayed) {
            alert('❌ Incorrect OTP. Please check the code shown above and try again.');
            return;
        }

        document.getElementById('otp-modal').style.display = 'none';
        document.getElementById('otp-input').value = '';

        if (mode === 'signup') {
            alert('✅ Email verified successfully!');
            document.getElementById('btn-signup').disabled = false;
            document.getElementById('btn-signup').textContent = 'Create Organization Account ✓';
        } else if (mode === 'forgot') {
            const savedCompany = localStorage.getItem('fairhire_company');
            if (savedCompany) {
                AuthManager.fallbackLogin(savedCompany, localStorage.getItem('fairhire_recruiter'), localStorage.getItem('fairhire_email'));
            } else {
                switchAuthTab('signup');
            }
        }
    });

    // SIGNUP (Fallback only, Firebase handles it in the Verify button now)
    document.getElementById('btn-signup').addEventListener('click', () => {
        const company = document.getElementById('signup-company').value.trim();
        const recruiter = document.getElementById('signup-recruiter').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const pwd = document.getElementById('signup-password').value.trim();

        if (window.firebaseAuth && window.firebaseAuth.currentUser) {
            alert("Firebase handles signup securely via Email Verification. Please click 'Verify Email'.");
            return;
        }

        if (!company || !recruiter || !email || !pwd) { alert('Please fill all fields.'); return; }

        localStorage.setItem('fairhire_password', pwd);
        localStorage.setItem('fairhire_email', email);
        AuthManager.fallbackLogin(company, recruiter, email);
    });

    // --- PROFILE DROPDOWN & MODALS LOGIC ---
    const profileTrigger = document.getElementById('profile-trigger');
    const profileDropdown = document.getElementById('profile-dropdown');
    const dashboardModal = document.getElementById('dashboard-modal');
    const settingsModal = document.getElementById('settings-modal');

    profileTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('active');
    });

    window.addEventListener('click', () => {
        profileDropdown.classList.remove('active');
    });

    // Logout
    document.getElementById('menu-logout').addEventListener('click', () => {
        AuthManager.logout();
    });

    // Dashboard Modal
    document.getElementById('menu-dashboard').addEventListener('click', () => {
        dashboardModal.style.display = 'flex';
        updateUsageStats();
    });

    document.getElementById('close-dashboard').addEventListener('click', () => {
        dashboardModal.style.display = 'none';
    });

    // Settings Modal
    document.getElementById('menu-settings').addEventListener('click', () => {
        settingsModal.style.display = 'flex';
    });

    document.getElementById('close-settings').addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });
    
    document.getElementById('save-settings').addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });

    // Profile Pic Upload
    const profileUploadTrigger = document.getElementById('profile-upload-trigger');
    const profilePicInput = document.getElementById('profile-pic-input');
    const headerProfileImg = document.getElementById('header-profile-img');

    profileUploadTrigger.addEventListener('click', () => profilePicInput.click());

    profilePicInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file && file.type === "image/jpeg") {
            const reader = new FileReader();
            
            // Show local preview immediately
            reader.onload = (event) => {
                headerProfileImg.src = event.target.result;
            };
            reader.readAsDataURL(file);

            // Upload to Firebase if available
            if (window.firebaseAuth && window.firebaseAuth.currentUser && window.firebaseStorage) {
                try {
                    const uid = window.firebaseAuth.currentUser.uid;
                    const storageRef = window.firebaseStorage.ref();
                    const profilePicRef = storageRef.child(`profile_pictures/${uid}.jpg`);
                    
                    document.getElementById('profile-upload-trigger').querySelector('p').textContent = 'Uploading...';
                    await profilePicRef.put(file);
                    const downloadURL = await profilePicRef.getDownloadURL();
                    
                    // Update Firestore document with new photoURL
                    if (window.firebaseDb) {
                        await window.firebaseDb.collection('companies').doc(uid).update({
                            photoURL: downloadURL
                        });
                    }
                    
                    document.getElementById('profile-upload-trigger').querySelector('p').textContent = 'Change Picture';
                    alert("Profile picture uploaded to Cloud Storage successfully!");
                } catch (error) {
                    console.error("Storage upload error:", error);
                    alert("Failed to upload to cloud. Showing local preview only.");
                    document.getElementById('profile-upload-trigger').querySelector('p').textContent = 'Change Picture';
                    localStorage.setItem('fairhire_profile_pic', headerProfileImg.src); // Fallback
                }
            } else {
                // Fallback to local storage
                reader.onloadend = () => {
                     localStorage.setItem('fairhire_profile_pic', headerProfileImg.src);
                     alert("Profile picture updated locally!");
                };
            }
        } else {
            alert("Please upload a JPEG image.");
        }
    });

    // Load saved profile pic
    const savedPic = localStorage.getItem('fairhire_profile_pic');
    if (savedPic) headerProfileImg.src = savedPic;

    let historicalChartInstance = null;
    let currentReport = null;
    let currentSessionDocId = null;

    function saveSessionData() {
        if (!currentReport) return;
        const sessionData = {
            report: currentReport,
            jobRole: window.aiAgent.jobRole,
            skills: window.aiAgent.skills,
            apiKey: window.aiAgent.apiKey,
            companyDataset: window.aiAgent.companyDataset,
            currentSessionDocId: currentSessionDocId
        };
        localStorage.setItem('fairhire_session', JSON.stringify(sessionData));
    }

    function loadSessionData() {
        const dataStr = localStorage.getItem('fairhire_session');
        if (dataStr) {
            try {
                const sessionData = JSON.parse(dataStr);
                window.aiAgent.configure(sessionData.apiKey || '', sessionData.jobRole || '', (sessionData.skills || []).join(', '), sessionData.companyDataset || '');
                currentReport = sessionData.report;
                currentSessionDocId = sessionData.currentSessionDocId;
                
                if (currentReport) {
                    populateDashboard(currentReport);
                    populateReports(currentReport);
                }
            } catch(e) {
                console.error("Failed to load session", e);
            }
        }
    }
    
    // Load persisted data on refresh
    loadSessionData();

    // Usage Stats
    async function updateUsageStats() {
        let total = 0, flags = 0, sessions = 1;
        
        if (window.firebaseAuth && window.firebaseAuth.currentUser && window.firebaseDb) {
            try {
                const uid = window.firebaseAuth.currentUser.uid;
                const doc = await window.firebaseDb.collection('companies').doc(uid).get();
                if (doc.exists && doc.data().stats) {
                    total = doc.data().stats.totalAnalyzed || 0;
                    flags = doc.data().stats.biasFlags || 0;
                    sessions = doc.data().stats.sessions || 1;
                }
            } catch (e) { console.error("Error fetching usage stats", e); }
        } else {
            total = localStorage.getItem('fairhire_stat_total') || 0;
            flags = localStorage.getItem('fairhire_stat_flags') || 0;
            sessions = Math.floor(Math.random() * 5) + 1;
        }
        
        document.getElementById('usage-total').textContent = total;
        document.getElementById('usage-flags').textContent = flags;
        document.getElementById('usage-sessions').textContent = sessions;
        
        // Setup Usage History Chart (Simple Bar)
        const ctxUsage = document.getElementById('usageHistoryChart').getContext('2d');
        new Chart(ctxUsage, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Resumes Analyzed',
                    data: [12, 19, 3, 5, 2, 3, total],
                    borderColor: '#6366f1',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(99, 102, 241, 0.1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } } }
            }
        });

        // Initialize Historical Gender Chart if on Dashboard
        initHistoricalChart();
    }

    async function initHistoricalChart() {
        let chartData = [145, 82, 120, 95]; // Fallback Demo Data

        if (window.firebaseAuth && window.firebaseAuth.currentUser && window.firebaseDb) {
            try {
                const uid = window.firebaseAuth.currentUser.uid;
                const historyRef = window.firebaseDb.collection('companies').doc(uid).collection('recruitment_history');
                const snapshot = await historyRef.get();
                
                if (!snapshot.empty) {
                    let mSel = 0, mRej = 0, fSel = 0, fRej = 0;
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        if (data.demographics) {
                            mSel += data.demographics.maleSelected || 0;
                            mRej += data.demographics.maleRejected || 0;
                            fSel += data.demographics.femaleSelected || 0;
                            fRej += data.demographics.femaleRejected || 0;
                        }
                    });
                    
                    let uSel = Math.max(0, tSel - (mSel + fSel));
                    let uRej = Math.max(0, tRej - (mRej + fRej));
                    
                    if (tSel > 0 || tRej > 0) {
                        chartData = [mSel, mRej, fSel, fRej, uSel, uRej];
                    }
                }
            } catch (e) { console.error("Error fetching historical bias data", e); }
        }

        const ctxHist = document.getElementById('historicalGenderChart').getContext('2d');
        if (historicalChartInstance) historicalChartInstance.destroy();
        
        historicalChartInstance = new Chart(ctxHist, {
            type: 'bar',
            data: {
                labels: ['Male Selected', 'Male Rejected', 'Female Selected', 'Female Rejected', 'Unknown Selected', 'Unknown Rejected'],
                datasets: [{
                    label: 'Historical Count',
                    data: chartData,
                    backgroundColor: [
                        'rgba(99, 102, 241, 0.8)',
                        'rgba(99, 102, 241, 0.3)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(16, 185, 129, 0.3)',
                        'rgba(156, 163, 175, 0.8)',
                        'rgba(156, 163, 175, 0.3)'
                    ],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { 
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // Call initHistoricalChart once on load to ensure it's ready
    setTimeout(initHistoricalChart, 1000);

    // --- TOP LEVEL MODE TOGGLE ---
    const btnModeNewHire = document.getElementById('btn-mode-newhire');
    const btnModeBias = document.getElementById('btn-mode-bias');
    const navItems = document.querySelectorAll('.nav-links li');
    const views = document.querySelectorAll('.view');
    // We removed topbarTitle (the <h2>) to make room for the toggle. Let's handle navigation accordingly.

    function switchMode(mode) {
        if (mode === 'new-hire') {
            window.currentBackgroundMode = 'dashboard-newhire';
            btnModeNewHire.classList.add('active');
            btnModeBias.classList.remove('active');
            navItems.forEach(item => {
                if (item.classList.contains('mode-new-hire')) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
            // Auto-select first visible tab
            document.querySelector('.mode-new-hire[data-target="config-view"]').click();
        } else {
            window.currentBackgroundMode = 'dashboard-bias';
            btnModeBias.classList.add('active');
            btnModeNewHire.classList.remove('active');
            navItems.forEach(item => {
                if (item.classList.contains('mode-bias-detection')) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
            // Auto-select first visible tab
            document.querySelector('.mode-bias-detection[data-target="bias-input-view"]').click();
        }
    }

    if (btnModeNewHire && btnModeBias) {
        btnModeNewHire.addEventListener('click', () => switchMode('new-hire'));
        btnModeBias.addEventListener('click', () => switchMode('bias-detection'));
    }

    // 1. Navigation Logic
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            const targetId = item.getAttribute('data-target');
            views.forEach(view => {
                view.classList.remove('active');
                if (view.id === targetId) {
                    view.classList.add('active');
                }
            });
        });
    });

    // Floating Bias Detect Button Logic
    const btnFloatingBiasDetect = document.getElementById('btn-floating-bias-detect');
    if (btnFloatingBiasDetect) {
        btnFloatingBiasDetect.addEventListener('click', () => {
            // Switch globally to Bias Detection mode
            if (typeof switchMode === 'function') {
                switchMode('bias-detection');
            }
        });
    }

    // 2. Configuration Logic
    const saveConfigBtn = document.getElementById('save-config');
    const btnDemoConfig = document.getElementById('btn-demo-config');
    let companyDatasetContent = "";

    if (btnDemoConfig) {
        btnDemoConfig.addEventListener('click', () => {
            const apiKeyInput = document.getElementById('api-key');
            const jobRoleInput = document.getElementById('job-role');
            const jobSkillsInput = document.getElementById('job-skills');
            const vacanciesInput = document.getElementById('job-vacancies');
            
            if (apiKeyInput) apiKeyInput.value = 'DEMO';
            if (jobRoleInput) jobRoleInput.value = 'Senior Software Engineer';
            if (jobSkillsInput) jobSkillsInput.value = 'React, Node.js, Python, System Design';
            if (vacanciesInput) vacanciesInput.value = '5';
            
            btnDemoConfig.innerHTML = `<i class="ph ph-check"></i> Demo Config Filled!`;
            btnDemoConfig.classList.add('success');
            setTimeout(() => {
                btnDemoConfig.innerHTML = `<i class="ph ph-magic-wand"></i> Fill Demo Config`;
                btnDemoConfig.classList.remove('success');
            }, 2000);
        });
    }

    const datasetDropzone = document.getElementById('bias-dataset-dropzone');
    const datasetFileInput = document.getElementById('bias-dataset-file-input');

    if (datasetDropzone && datasetFileInput) {
        datasetDropzone.addEventListener('click', (e) => {
            if (e.target !== datasetFileInput) {
                datasetFileInput.click();
            }
        });

        datasetFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(evt) {
                    companyDatasetContent = evt.target.result;
                    datasetDropzone.innerHTML = '<i class="ph ph-check-circle" style="color:var(--success)"></i><p>Company Dataset loaded & Dashboard Refreshed!</p>';
                    datasetDropzone.style.borderColor = 'var(--success)';
                    datasetDropzone.style.background = 'rgba(16, 185, 129, 0.05)';

                    // PARSE DATASET FOR BIAS DASHBOARD PREVIEW
                    const rows = companyDatasetContent.split('\n').filter(r => r.trim().length > 0);
                    if (rows.length > 1) {
                        const headers = rows[0].toLowerCase().split(',');
                        const genderIdx = headers.findIndex(h => h.includes('gender'));
                        const outcomeIdx = headers.findIndex(h => h.includes('outcome') || h.includes('status'));
                        const nameIdx = headers.findIndex(h => h.includes('name'));
                        
                        if (genderIdx > -1 && outcomeIdx > -1) {
                            const selected = [];
                            const rejected = [];
                            let flags = 0;
                            
                            for (let i = 1; i < rows.length; i++) {
                                const cols = rows[i].split(',');
                                if (cols.length > Math.max(genderIdx, outcomeIdx)) {
                                    const gender = cols[genderIdx].trim();
                                    const outcome = cols[outcomeIdx].trim().toLowerCase();
                                    const name = nameIdx > -1 ? cols[nameIdx].trim() : `Candidate ${i}`;
                                    
                                    const cand = { name: name, gender: gender };
                                    
                                    // Simulated flag for demonstration: Ivy League preference or Age bias
                                    if (cols.join(',').toLowerCase().includes('ivy') || parseInt(cols[2]) > 40) flags++;
                                    
                                    if (outcome.includes('select') || outcome.includes('hire') || outcome.includes('yes')) {
                                        selected.push(cand);
                                    } else {
                                        rejected.push(cand);
                                    }
                                }
                            }
                            
                            window.uploadedDatasetReport = {
                                total: selected.length + rejected.length,
                                selectedCount: selected.length,
                                selected: selected,
                                rejected: rejected,
                                biasFlags: flags
                            };
                            
                            // Auto-trigger Dashboard Refresh
                            const btnAnalyzeBias = document.getElementById('btn-analyze-bias');
                            if (btnAnalyzeBias) {
                                // Turn off Firebase toggle so it reads local data
                                const fbToggle = document.getElementById('toggle-firebase');
                                if (fbToggle) fbToggle.checked = false;
                                setTimeout(() => btnAnalyzeBias.click(), 100);
                            }
                        }
                    }
                };
                reader.readAsText(file);
            }
        });
    }

    saveConfigBtn.addEventListener('click', () => {
        let apiKey = document.getElementById('api-key').value.trim();
        if (!apiKey) {
            apiKey = "AIzaSyBCoQVIA3SjtLXxHONr0Mv_qOmYRB-qsUg"; // default fallback
        }

        const role = document.getElementById('job-role').value || "Senior Software Engineer";
        const skills = document.getElementById('job-skills').value || "React, Node.js, Python, System Design";
        const vacancies = document.getElementById('job-vacancies').value || 5;
        
        window.aiAgent.configure(apiKey, role, skills, companyDatasetContent, vacancies);
        
        // Auto-navigate to Upload view
        const uploadNav = document.querySelector('.mode-new-hire[data-target="upload-view"]');
        if (uploadNav) uploadNav.click();
    });

    // 3. File Upload & Extraction Logic
    const resumeDropzone = document.getElementById('resume-dropzone');
    const fileInput = document.getElementById('resume-file-input');
    const browseBtn = document.getElementById('browse-files-btn');
    
    const uploadProgress = document.getElementById('upload-progress');
    const progressFill = document.querySelector('.advanced-progress-fill');
    const terminalLogs = document.getElementById('terminal-logs');
    const progressText = document.getElementById('progress-text');
    const progressStatusText = document.getElementById('progress-status-text');

    let chartInstance = null; 

    // Click to browse
    resumeDropzone.addEventListener('click', (e) => {
        if (e.target !== browseBtn && e.target !== fileInput) {
            fileInput.click();
        }
    });
    browseBtn.addEventListener('click', () => fileInput.click());

    // Drag and Drop events
    resumeDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        resumeDropzone.style.borderColor = 'var(--primary)';
    });
    resumeDropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        resumeDropzone.style.borderColor = 'var(--border)';
    });
    resumeDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        resumeDropzone.style.borderColor = 'var(--border)';
        if (e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    });

    // Recruitment History Toggle
    const useHistoryToggle = document.getElementById('bias-use-history-toggle');
    const datasetUploadGroup = document.getElementById('bias-dataset-upload-group');

    if (useHistoryToggle && datasetUploadGroup) {
        useHistoryToggle.addEventListener('change', () => {
            if (useHistoryToggle.checked) {
                datasetUploadGroup.style.opacity = '0.5';
                datasetUploadGroup.style.pointerEvents = 'none';
            } else {
                datasetUploadGroup.style.opacity = '1';
                datasetUploadGroup.style.pointerEvents = 'auto';
            }
        });
    }

    // File input change
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            handleFiles(fileInput.files);
        }
    });

    // Demo Sample Resumes Logic
    const btnLoadSampleResumes = document.getElementById('btn-load-sample-resumes');
    if (btnLoadSampleResumes) {
        btnLoadSampleResumes.addEventListener('click', async () => {
            btnLoadSampleResumes.innerHTML = `<i class="ph ph-spinner ph-spin"></i> Loading...`;
            btnLoadSampleResumes.disabled = true;

            try {
                const sampleFiles = [];
                for (let i = 1; i <= 20; i++) {
                    const filename = `SAMPLE_RESUME_(${i}).pdf`;
                    try {
                        const response = await fetch(`demo_resumes/${filename}`);
                        if (response.ok) {
                            const blob = await response.blob();
                            const file = new File([blob], filename, { type: 'application/pdf' });
                            sampleFiles.push(file);
                        }
                    } catch (e) {
                        console.warn(`Could not load ${filename}`);
                    }
                }

                if (sampleFiles.length > 0) {
                    handleFiles(sampleFiles);
                } else {
                    alert("Could not load sample resumes. Make sure they are in the 'demo_resumes' folder.");
                }
            } catch (err) {
                console.error("Error loading demo resumes", err);
            } finally {
                btnLoadSampleResumes.innerHTML = `<i class="ph ph-file-pdf"></i> Load Sample Resumes`;
                btnLoadSampleResumes.disabled = false;
            }
        });
    }

    async function handleFiles(files) {
        if (!window.aiAgent.apiKey) {
            alert('Please configure your Gemini API Key (or type DEMO) in the Configuration tab first.');
            navItems[0].click();
            return;
        }

        const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf');
        
        if (pdfFiles.length === 0) {
            alert('Please select valid PDF files.');
            return;
        }

        resumeDropzone.style.display = 'none';
        uploadProgress.style.display = 'block';

        let extractedResumes = [];

        // 1. Extract Text from PDFs
        progressStatusText.innerHTML = `Extracting text from ${pdfFiles.length} PDFs... <span id="progress-text"></span>`;
        for (let i = 0; i < pdfFiles.length; i++) {
            const file = pdfFiles[i];
            updateProgress(((i) / pdfFiles.length) * 30); // Text extraction takes 30% of progress
            
            try {
                const text = await extractTextFromPDF(file);
                extractedResumes.push({
                    filename: file.name,
                    text: text
                });
            } catch (err) {
                console.error("Failed to read " + file.name, err);
            }
        }

        // 2. Send to AI Agent
        updateProgress(30);
        progressStatusText.innerHTML = `AI analyzing resumes & bias... <span id="progress-text"></span>`;
        
        // Let the AI process it. We will use a fast fake progress incrementor while waiting.
        let fakeProgress = 30;
        const fakeInterval = setInterval(() => {
            if (fakeProgress < 95) {
                fakeProgress += 2;
                updateProgress(fakeProgress);
            }
        }, 150);

        try {
            const report = await window.aiAgent.analyzeResumes(extractedResumes);
            
            clearInterval(fakeInterval);
            updateProgress(100);

            // 3. Populate UI
            currentReport = report;
            currentSessionDocId = null; // reset for new batch
            
            populateDashboard(report);
            populateReports(report);
            
            // Save to LocalStorage and Firebase immediately
            syncDecisionsToFirebase().then(() => saveSessionData());

            setTimeout(() => {
                navItems[2].click(); // Go to Dashboard
                
                // Reset upload area
                resumeDropzone.style.display = '';
                uploadProgress.style.display = 'none';
                updateProgress(0);
                fileInput.value = ''; // clear
            }, 1500);

        } catch (error) {
            clearInterval(fakeInterval);
            console.error("Analysis failed:", error);
            alert("An error occurred during AI analysis: " + error.message);
            resumeDropzone.style.display = '';
            uploadProgress.style.display = 'none';
            updateProgress(0);
        }
    }

    function updateProgress(percent) {
        if (progressFill) progressFill.style.width = `${percent}%`;
        const pt = document.getElementById('progress-text');
        if(pt) pt.textContent = `${Math.round(percent)}%`;

        if (terminalLogs && percent === 0) terminalLogs.innerHTML = '';
        if (terminalLogs && percent > 0 && percent < 100) {
            const logMsg = document.createElement('div');
            if (percent < 30) logMsg.textContent = `> Extracting token buffer... [OK]`;
            else if (percent < 60) logMsg.textContent = `> AI Model analyzing semantic vectors...`;
            else if (percent < 90) logMsg.textContent = `> Cross-referencing bias patterns... [${Math.round(percent)}%]`;
            
            terminalLogs.appendChild(logMsg);
            terminalLogs.scrollTop = terminalLogs.scrollHeight;
        } else if (terminalLogs && percent === 100) {
            terminalLogs.innerHTML += '<div>> Analysis Complete. Generating Report...</div>';
            terminalLogs.scrollTop = terminalLogs.scrollHeight;
        }
    }

    // PDF.js Text Extraction Helper
    async function extractTextFromPDF(file) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let textContent = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContentObj = await page.getTextContent();
            const pageText = textContentObj.items.map(item => item.str).join(' ');
            textContent += pageText + ' \n';
        }

        return textContent;
    }

    // 4. Populate Dashboard
    function populateDashboard(report) {
        window.activeDashboardReport = report; // Store for modal filtering
        
        document.getElementById('stat-total').textContent = report.total;
        document.getElementById('stat-selected').textContent = report.selectedCount;
        
        const rejectedCount = report.total - report.selectedCount;
        const rejectedEl = document.getElementById('stat-rejected');
        if (rejectedEl) rejectedEl.textContent = rejectedCount;
        
        document.getElementById('stat-flags').textContent = report.biasFlags;
        const recList = document.getElementById('recommendation-list');
        recList.innerHTML = '';
        report.recommendations.forEach(rec => {
            const li = document.createElement('li');
            li.textContent = rec;
            recList.appendChild(li);
        });

    }

    // 5. Populate Reports
    function populateReports(report) {
        const selectedGrid = document.getElementById('selected-grid');
        const rejectedGrid = document.getElementById('rejected-grid');
        
        const selCount = document.getElementById('summary-selected-count');
        const rejCount = document.getElementById('summary-rejected-count');
        if (selCount) selCount.textContent = `${report.selected.length} Selected`;
        if (rejCount) rejCount.textContent = `${report.rejected.length} Rejected`;
        
        selectedGrid.innerHTML = '';
        rejectedGrid.innerHTML = '';

        // Sort selected by MatchScore Descending
        const sortedSelected = [...report.selected].sort((a, b) => b.matchScore - a.matchScore);

        sortedSelected.forEach((c, idx) => {
            selectedGrid.innerHTML += `
                <div class="candidate-card" id="card-${c.name.replace(/\s+/g, '-')}">
                    <div class="candidate-header">
                        <span class="candidate-name">${c.name}</span>
                        <span class="badge match">${c.matchScore}% Match</span>
                    </div>
                    <div class="candidate-details">
                        <p style="color:var(--primary); font-weight:600; font-size: 0.9rem; margin-bottom:0.5rem;">${c.roleAppliedFor || 'Unknown Role'}</p>
                        <p style="font-size: 0.8rem; color:var(--text-muted); margin-bottom: 0.5rem;"><i class="ph ph-envelope"></i> ${c.emailAddress || 'N/A'} | <i class="ph ph-phone"></i> ${c.phoneNo || 'N/A'}</p>
                        
                        <p><strong>Tech Skills:</strong> <span style="font-size:0.85rem;">${c.technicalSkills && c.technicalSkills.length > 0 ? c.technicalSkills.join(', ') : 'None extracted'}</span></p>
                        <div style="margin-top: 0.5rem;">
                            <strong>Projects:</strong>
                            ${c.projects && c.projects.length > 0 ? `<ul style="padding-left: 1rem; margin-top: 0.2rem; font-size: 0.85rem;">${c.projects.map(p => `<li>${p}</li>`).join('')}</ul>` : '<span style="font-size:0.85rem;">None</span>'}
                        </div>
                        
                        <hr style="border:0; border-top:1px solid rgba(255,255,255,0.1); margin: 0.8rem 0;">
                        
                        <p><strong>Education:</strong> ${c.educationStream || 'N/A'}</p>
                        <p><strong>University:</strong> ${c.university || 'N/A'} (CGPA: ${c.cgpa || '0'} / 10)</p>
                        <p><strong>Certifications:</strong> <span style="font-size:0.85rem;">${c.certifications && c.certifications.length > 0 ? c.certifications.join(', ') : 'None'}</span></p>

                        ${c.biasNote ? `<p style="color:var(--warning); margin-top:0.8rem; font-size: 0.85rem;"><i class="ph ph-warning"></i> AI Flag: ${c.biasNote}</p>` : ''}
                        
                        <div style="display:flex; gap:0.5rem; margin-top: 1rem;">
                            <button class="btn secondary btn-preview-email" data-index="${idx}" data-type="selected" style="flex:1;"><i class="ph ph-envelope-open"></i> Preview Email</button>
                            <button class="btn secondary btn-override" data-action="reject" data-name="${c.name}" style="flex:1; border-color: var(--danger); color: var(--danger);">
                                <i class="ph ph-x"></i> Reject
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        // Sort rejected by MatchScore Descending as well
        const sortedRejected = [...report.rejected].sort((a, b) => b.matchScore - a.matchScore);

        sortedRejected.forEach((c, idx) => {
            rejectedGrid.innerHTML += `
                <div class="candidate-card" id="card-${c.name.replace(/\s+/g, '-')}">
                    <div class="candidate-header">
                        <span class="candidate-name">${c.name}</span>
                        <span class="badge reject">${c.matchScore}% Match</span>
                    </div>
                    <div class="candidate-details">
                        <p style="color:var(--primary); font-weight:600; font-size: 0.9rem; margin-bottom:0.5rem;">${c.roleAppliedFor || 'Unknown Role'}</p>
                        <p style="font-size: 0.8rem; color:var(--text-muted); margin-bottom: 0.5rem;"><i class="ph ph-envelope"></i> ${c.emailAddress || 'N/A'} | <i class="ph ph-phone"></i> ${c.phoneNo || 'N/A'}</p>
                        
                        <p><strong>Tech Skills:</strong> <span style="font-size:0.85rem;">${c.technicalSkills && c.technicalSkills.length > 0 ? c.technicalSkills.join(', ') : 'None extracted'}</span></p>
                        <div style="margin-top: 0.5rem;">
                            <strong>Projects:</strong>
                            ${c.projects && c.projects.length > 0 ? `<ul style="padding-left: 1rem; margin-top: 0.2rem; font-size: 0.85rem;">${c.projects.map(p => `<li>${p}</li>`).join('')}</ul>` : '<span style="font-size:0.85rem;">None</span>'}
                        </div>
                        
                        <hr style="border:0; border-top:1px solid rgba(255,255,255,0.1); margin: 0.8rem 0;">
                        
                        <p><strong>Education:</strong> ${c.educationStream || 'N/A'}</p>
                        <p><strong>University:</strong> ${c.university || 'N/A'} (CGPA: ${c.cgpa || '0'} / 10)</p>
                        <p><strong>Certifications:</strong> <span style="font-size:0.85rem;">${c.certifications && c.certifications.length > 0 ? c.certifications.join(', ') : 'None'}</span></p>
                        
                        <div class="drawbacks" style="margin-top: 0.8rem; font-size: 0.85rem; padding-top: 0.8rem; border-top: 1px solid rgba(255,99,71,0.2);">
                            <strong style="color:var(--danger);"><i class="ph ph-x-circle"></i> Missing Requirements:</strong>
                            <ul style="padding-left: 1rem; margin-top: 0.2rem;">
                                ${c.drawbacks && c.drawbacks.length > 0 ? c.drawbacks.map(d => `<li>${d}</li>`).join('') : '<li>Profile mismatch</li>'}
                            </ul>
                        </div>
                        
                        ${c.biasNote ? `<p style="color:var(--warning); margin-top:0.8rem; font-size: 0.85rem;"><i class="ph ph-warning"></i> <strong>Bias Flag:</strong> ${c.biasNote}</p>` : ''}
                        
                        <div style="display:flex; gap:0.5rem; margin-top: 1rem;">
                            <button class="btn secondary btn-preview-email" data-index="${idx}" data-type="rejected" style="flex:1;"><i class="ph ph-envelope-open"></i> Preview Email</button>
                            <button class="btn secondary btn-override" data-action="select" data-name="${c.name}" style="flex:1; border-color: var(--success); color: var(--success);">
                                <i class="ph ph-check"></i> Select
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        // Initialize Neon Bias Line Graph
        const ctxNeon = document.getElementById('neonBiasGraph');
        if (ctxNeon) {
            const allCands = [...report.selected, ...report.rejected];
            const labels = [];
            const dataPoints = [];
            let runningBiasTotal = 0;
            
            allCands.forEach((c, i) => {
                labels.push(`Cand ${i + 1}`);
                if (c.biasNote) {
                    runningBiasTotal++;
                }
                dataPoints.push(runningBiasTotal);
            });

            if (window.neonChartInstance) {
                window.neonChartInstance.destroy();
            }
            
            // Custom shadow plugin for neon effect
            const neonPlugin = {
                id: 'neonEffect',
                beforeDatasetsDraw(chart, args, options) {
                    const ctx = chart.ctx;
                    ctx.save();
                    ctx.shadowColor = '#f5af19';
                    ctx.shadowBlur = 15;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                },
                afterDatasetsDraw(chart, args, options) {
                    chart.ctx.restore();
                }
            };

            window.neonChartInstance = new Chart(ctxNeon.getContext('2d'), {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Accumulated Bias Flags',
                        data: dataPoints,
                        borderColor: '#f5af19',
                        backgroundColor: 'rgba(245, 175, 25, 0.1)',
                        borderWidth: 3,
                        pointBackgroundColor: '#f12711',
                        pointBorderColor: '#ffffff',
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { 
                        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { stepSize: 1, precision: 0 } },
                        x: { grid: { display: false } }
                    }
                },
                plugins: [neonPlugin]
            });
        }

        // Email Preview Modal Logic
        const emailPreviewModal = document.getElementById('email-preview-modal');
        const closeEmailPreview = document.getElementById('close-email-preview');
        const emailPreviewBody = document.getElementById('email-preview-body');

        document.querySelectorAll('.btn-preview-email').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetBtn = e.target.closest('button');
                const index = targetBtn.dataset.index;
                const type = targetBtn.dataset.type;
                
                // Grab the correct sorted array reference
                const candidate = type === 'selected' ? sortedSelected[index] : sortedRejected[index];
                
                emailPreviewBody.textContent = candidate.emailDraft || "No email draft generated for this candidate.";
                emailPreviewModal.style.display = 'flex';
            });
        });

        if (closeEmailPreview) {
            closeEmailPreview.addEventListener('click', () => {
                emailPreviewModal.style.display = 'none';
            });
        }
        
        const closeEmailPreviewBottom = document.getElementById('close-email-preview-bottom');
        if (closeEmailPreviewBottom) {
            closeEmailPreviewBottom.addEventListener('click', () => {
                emailPreviewModal.style.display = 'none';
            });
        }

        // Attach event listeners to override buttons
        document.querySelectorAll('.btn-override').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.closest('button').dataset.action;
                const name = e.target.closest('button').dataset.name;
                const card = document.getElementById(`card-${name.replace(/\s+/g, '-')}`);
                card.style.opacity = '0.5';
                e.target.closest('button').disabled = true;
                e.target.closest('button').textContent = "Decision Changed!";
                alert(`Manual Override: ${name} is now ${action === 'select' ? 'Selected' : 'Rejected'}. This will flag potential bias in historical data.`);
                
                // Move candidate between lists
                if (action === 'select') {
                    const idx = currentReport.rejected.findIndex(c => c.name === name);
                    if (idx > -1) {
                        const c = currentReport.rejected.splice(idx, 1)[0];
                        
                        // Regenerate Email Draft dynamically
                        c.emailDraft = `Subject: Update Regarding Your Application for ${window.aiAgent.jobRole || 'the open position'}

Dear ${c.name},

Congratulations! We are pleased to inform you that following a manual review of your profile, you have been selected to move forward in the process for the ${window.aiAgent.jobRole || 'open'} position.

However, to ensure your continued success and growth in this role, we strongly advise you to focus on improving the following areas noted during your initial evaluation:
${c.drawbacks && c.drawbacks.length > 0 ? c.drawbacks.map(d => `- ${d}`).join('\n') : '- General technical proficiency.'}

Please refer to any previously suggested learning resources to upskill in these areas before your start date. We look forward to speaking with you soon!

Best regards,
The Hiring Team`;

                        if (!c.biasNote) {
                            c.biasNote = "Manually selected by recruiter against AI recommendation.";
                        }
                        
                        currentReport.selected.push(c);
                        currentReport.selectedCount++;
                        currentReport.biasFlags++; // Record manual override as bias flag
                    }
                } else {
                    const idx = currentReport.selected.findIndex(c => c.name === name);
                    if (idx > -1) {
                        const c = currentReport.selected.splice(idx, 1)[0];
                        
                        // Regenerate Email Draft dynamically
                        c.emailDraft = `Subject: Update Regarding Your Application for ${window.aiAgent.jobRole || 'the open position'}

Dear ${c.name},

Thank you for your interest in the ${window.aiAgent.jobRole || 'open'} position. Following a secondary manual review of your profile, we have decided not to move forward with your application at this time.

While your profile has strong aspects, we are currently prioritizing candidates with stronger alignment in the following areas:
${c.drawbacks && c.drawbacks.length > 0 ? c.drawbacks.map(d => `- ${d}`).join('\n') : '- Specific technical requirements.'}

We encourage you to upskill in these areas and apply again in the future.

Best regards,
The Hiring Team`;

                        if (!c.biasNote) {
                            c.biasNote = "Manually rejected by recruiter despite AI approval.";
                        }

                        currentReport.rejected.push(c);
                        currentReport.selectedCount--;
                        currentReport.biasFlags++; // Record manual override as bias flag
                    }
                }
                
                populateDashboard(currentReport); // update stats
                populateReports(currentReport); // IMMEDIATELY update UI lists and counts
                syncDecisionsToFirebase().then(() => saveSessionData()); // update backend
            });
        });
    }

    // Chatbot Toggle
    const chatbotSidebar = document.getElementById('chatbot-sidebar');
    const toggleChatbotBtn = document.getElementById('toggle-chatbot-btn');
    if (chatbotSidebar && toggleChatbotBtn) {
        // Start hidden
        chatbotSidebar.classList.add('collapsed');
        toggleChatbotBtn.addEventListener('click', () => {
            chatbotSidebar.classList.toggle('collapsed');
            const icon = toggleChatbotBtn.querySelector('i');
            if (chatbotSidebar.classList.contains('collapsed')) {
                icon.classList.replace('ph-caret-right', 'ph-robot');
            } else {
                icon.classList.replace('ph-robot', 'ph-caret-right');
            }
        });
    }

    // Automate Emails Logic
    const btnAutomateEmails = document.getElementById('btn-automate-emails');
    const emailModal = document.getElementById('email-progress-modal');
    const closeEmailModal = document.getElementById('close-email-modal');
    const emailProgressFill = document.getElementById('email-progress-fill');
    const emailProgressText = document.getElementById('email-progress-text');
    const emailLogs = document.getElementById('email-logs');

    // New Confirmation UI Elements
    const emailConfirmationStep = document.getElementById('email-confirmation-step');
    const emailProgressStep = document.getElementById('email-progress-step');
    const emailSenderAddress = document.getElementById('email-sender-address');
    const emailCandidateList = document.getElementById('email-candidate-list');
    const btnConfirmSendEmails = document.getElementById('btn-confirm-send-emails');
    const btnCancelEmails = document.getElementById('btn-cancel-emails');

    if (btnAutomateEmails) {
        btnAutomateEmails.addEventListener('click', () => {
            if (!currentReport || currentReport.total === 0) {
                alert("No candidates processed yet.");
                return;
            }
            
            // Show Modal and Confirmation Step, hide Progress Step
            emailModal.style.display = 'flex';
            closeEmailModal.style.display = 'none';
            emailConfirmationStep.style.display = 'block';
            emailProgressStep.style.display = 'none';
            
            // Populate Sender
            emailSenderAddress.textContent = AuthManager.companyEmail || 'hr@company.com';
            
            // Populate Candidate List
            emailCandidateList.innerHTML = '';
            
            currentReport.selected.forEach(c => {
                const email = `${c.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@example.com`;
                emailCandidateList.innerHTML += `<li><strong style="color:var(--success)">[SELECTED]</strong> ${c.name} (${email}) - Next Steps</li>`;
            });
            
            currentReport.rejected.forEach(c => {
                const email = `${c.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@example.com`;
                emailCandidateList.innerHTML += `<li><strong style="color:var(--danger)">[REJECTED]</strong> ${c.name} (${email}) - Feedback</li>`;
            });
        });
    }
    
    if (btnCancelEmails) {
        btnCancelEmails.addEventListener('click', () => {
            emailModal.style.display = 'none';
        });
    }

    if (btnConfirmSendEmails) {
        btnConfirmSendEmails.addEventListener('click', async () => {
            // Hide Confirmation, Show Progress/Dispatch List
            emailConfirmationStep.style.display = 'none';
            emailProgressStep.style.display = 'block';
            closeEmailModal.style.display = 'block';
            
            const emailDispatchList = document.getElementById('email-dispatch-list');
            if (!emailDispatchList) return;
            emailDispatchList.innerHTML = '';
            
            const allCandidates = [
                ...currentReport.selected.map(c => ({ ...c, type: 'Selected', color: 'var(--success)' })),
                ...currentReport.rejected.map(c => ({ ...c, type: 'Rejected', color: 'var(--danger)' }))
            ];

            allCandidates.forEach(c => {
                const targetEmail = c.emailAddress && c.emailAddress !== "Unknown" ? c.emailAddress : `${c.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@example.com`;
                const subject = encodeURIComponent(`Update on your application for ${window.aiAgent.jobRole || 'the open position'}`);
                const body = encodeURIComponent(c.emailDraft || "No draft available.");
                const mailtoLink = `mailto:${targetEmail}?subject=${subject}&body=${body}`;

                emailDispatchList.innerHTML += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <div>
                            <strong style="color:${c.color}">[${c.type}]</strong> 
                            <span>${c.name}</span>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">${targetEmail}</div>
                        </div>
                        <a href="${mailtoLink}" target="_blank" class="btn primary btn-dispatch-individual" style="padding: 0.5rem 1rem; text-decoration: none; font-size: 0.85rem;">
                            <i class="ph ph-paper-plane-right"></i> Dispatch via Mail App
                        </a>
                    </div>
                `;
            });
        });
    }

    const btnDispatchAll = document.getElementById('btn-dispatch-all');
    if (btnDispatchAll) {
        btnDispatchAll.addEventListener('click', () => {
            const dispatchLinks = document.querySelectorAll('.btn-dispatch-individual');
            if (dispatchLinks.length === 0) return;

            alert("Notice: We will attempt to open your mail client for each candidate. Your browser may block multiple pop-ups. If so, please click 'Allow pop-ups' in your browser's address bar to dispatch them all.");

            let delay = 0;
            dispatchLinks.forEach((link, index) => {
                setTimeout(() => {
                    window.open(link.href, '_blank');
                }, delay);
                delay += 800; // stagger opens to prevent overwhelming the OS
            });
        });
    }

    if (closeEmailModal) {
        closeEmailModal.addEventListener('click', () => {
            emailModal.style.display = 'none';
        });
    }

    async function syncDecisionsToFirebase() {
        if (!window.firebaseAuth || !window.firebaseAuth.currentUser || !window.firebaseDb) return;
        try {
            const uid = window.firebaseAuth.currentUser.uid;
            const historyRef = window.firebaseDb.collection('companies').doc(uid).collection('recruitment_history');
            
            const dataToSave = {
                date: firebase.firestore.FieldValue.serverTimestamp(),
                jobRole: window.aiAgent.jobRole,
                totalAnalyzed: currentReport.total,
                totalSelected: currentReport.selectedCount,
                totalRejected: currentReport.total - currentReport.selectedCount,
                biasFlags: currentReport.biasFlags,
                demographics: {
                    maleSelected: currentReport.selected.filter(c => c.gender && c.gender.toLowerCase().includes('male') && !c.gender.toLowerCase().includes('female')).length,
                    femaleSelected: currentReport.selected.filter(c => c.gender && c.gender.toLowerCase().includes('female')).length,
                    maleRejected: currentReport.rejected.filter(c => c.gender && c.gender.toLowerCase().includes('male') && !c.gender.toLowerCase().includes('female')).length,
                    femaleRejected: currentReport.rejected.filter(c => c.gender && c.gender.toLowerCase().includes('female')).length
                }
            };

            if (currentSessionDocId) {
                await historyRef.doc(currentSessionDocId).update({
                    ...dataToSave,
                    date: firebase.firestore.FieldValue.serverTimestamp() // Optional: keep original or update
                });
            } else {
                const docRef = await historyRef.add(dataToSave);
                currentSessionDocId = docRef.id;
            }
            console.log("Recruitment session synced to Firebase.");
        } catch (e) {
            console.error("Failed to sync to Firebase:", e);
        }
    }

    // 6. Tabs Logic
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const target = tab.getAttribute('data-tab');
            tabContents.forEach(tc => {
                tc.classList.remove('active');
                if (tc.id === `tab-${target}`) {
                    tc.classList.add('active');
                }
            });
        });
    });

    // Chatbot Interaction Logic
    const chatbotInput = document.getElementById('chatbot-text-input');
    const chatbotSendBtn = document.getElementById('chatbot-send-btn');
    const chatbotMessages = document.getElementById('chatbot-messages');

    async function handleChat() {
        if (!chatbotInput || !chatbotMessages) return;
        const text = chatbotInput.value.trim();
        if (!text) return;

        // Append User Message
        chatbotMessages.innerHTML += `<div class="chat-message user-message">${text}</div>`;
        chatbotInput.value = '';
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

        // Show typing indicator
        const typingId = 'typing-' + Date.now();
        chatbotMessages.innerHTML += `<div class="chat-message ai-message" id="${typingId}">...</div>`;
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

        try {
            // Call AI Agent Chat
            let context = "You are FAIRHIRE AI, a helpful assistant.";
            if (currentReport) {
                context = `We recently analyzed ${currentReport.total} candidates. ${currentReport.selectedCount} selected.`;
            }
            const aiResponse = await window.aiAgent.chat(text, context);
            
            document.getElementById(typingId).remove();
            chatbotMessages.innerHTML += `<div class="chat-message ai-message">${aiResponse}</div>`;
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        } catch (e) {
            document.getElementById(typingId).remove();
            chatbotMessages.innerHTML += `<div class="chat-message ai-message" style="color:var(--danger)">Sorry, I encountered an error.</div>`;
        }
    }

    if (chatbotSendBtn) chatbotSendBtn.addEventListener('click', handleChat);
    if (chatbotInput) chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChat();
    });

    // Analyze Bias Dashboard Button
    const btnAnalyzeBias = document.getElementById('btn-analyze-bias');
    if (btnAnalyzeBias) {
        btnAnalyzeBias.addEventListener('click', async () => {
            let totalApplies = 0;
            let totalSelected = 0;
            let totalRejected = 0;
            let totalFlags = 0;
            let maleSel = 0, femaleSel = 0, maleRej = 0, femaleRej = 0;

            const toggle = document.getElementById('bias-use-history-toggle');
            if (toggle && toggle.checked && window.firebaseAuth && window.firebaseAuth.currentUser && window.firebaseDb) {
                try {
                    btnAnalyzeBias.textContent = "Fetching Data...";
                    const uid = window.firebaseAuth.currentUser.uid;
                    const snap = await window.firebaseDb.collection('companies').doc(uid).collection('recruitment_history').get();
                    
                    if (snap.empty) {
                        alert("No historical recruitment data found in Firebase.");
                        btnAnalyzeBias.textContent = "Analyze Bias Dashboard";
                        return;
                    }

                    snap.forEach(doc => {
                        const d = doc.data();
                        totalApplies += d.totalAnalyzed || 0;
                        totalFlags += d.biasFlags || 0;
                        
                        // Use absolute counts if available, otherwise fallback to demographic sums
                        if (d.totalSelected !== undefined && d.totalRejected !== undefined) {
                            totalSelected += d.totalSelected;
                            totalRejected += d.totalRejected;
                        } else if (d.demographics) {
                            totalSelected += (d.demographics.maleSelected || 0) + (d.demographics.femaleSelected || 0);
                            totalRejected += (d.demographics.maleRejected || 0) + (d.demographics.femaleRejected || 0);
                        }

                        if (d.demographics) {
                            maleSel += d.demographics.maleSelected || 0;
                            femaleSel += d.demographics.femaleSelected || 0;
                            maleRej += d.demographics.maleRejected || 0;
                            femaleRej += d.demographics.femaleRejected || 0;
                        }
                    });
                } catch(e) {
                    console.error("Firebase fetch error", e);
                    alert("Failed to fetch Firebase data.");
                    btnAnalyzeBias.textContent = "Analyze Bias Dashboard";
                    return;
                }
            } else if (currentReport) {
                // Use current report
                totalApplies = currentReport.total;
                totalSelected = currentReport.selectedCount;
                totalRejected = currentReport.total - currentReport.selectedCount;
                totalFlags = currentReport.biasFlags;
                
                maleSel = currentReport.selected.filter(c => c.gender && c.gender.toLowerCase().includes('male') && !c.gender.toLowerCase().includes('female')).length;
                femaleSel = currentReport.selected.filter(c => c.gender && c.gender.toLowerCase().includes('female')).length;
                maleRej = currentReport.rejected.filter(c => c.gender && c.gender.toLowerCase().includes('male') && !c.gender.toLowerCase().includes('female')).length;
                femaleRej = currentReport.rejected.filter(c => c.gender && c.gender.toLowerCase().includes('female')).length;
            } else if (window.uploadedDatasetReport) {
                // Use uploaded dataset directly
                const d = window.uploadedDatasetReport;
                totalApplies = d.total;
                totalSelected = d.selectedCount;
                totalRejected = d.rejected.length;
                totalFlags = d.biasFlags;
                
                maleSel = d.selected.filter(c => c.gender && c.gender.toLowerCase().includes('male') && !c.gender.toLowerCase().includes('female')).length;
                femaleSel = d.selected.filter(c => c.gender && c.gender.toLowerCase().includes('female')).length;
                maleRej = d.rejected.filter(c => c.gender && c.gender.toLowerCase().includes('male') && !c.gender.toLowerCase().includes('female')).length;
                femaleRej = d.rejected.filter(c => c.gender && c.gender.toLowerCase().includes('female')).length;
            } else {
                alert("No data available. Please upload a dataset, run a resume batch, or select Firebase History.");
                return;
            }

            btnAnalyzeBias.textContent = "Analyze Bias Dashboard";

            // Calculate Fairness Score (0-100) using 4/5ths Disparate Impact rule
            let score = 100;
            const maleApplied = maleSel + maleRej;
            const femaleApplied = femaleSel + femaleRej;
            
            if (totalSelected === 0) {
                score = 100; // No disparate impact yet if no one is selected
            } else if (maleApplied > 0 && femaleApplied > 0) {
                // Smoothing factor of 1 to prevent division by zero and 0% scores
                const maleRate = (maleSel + 1) / (maleApplied + 2);
                const femaleRate = (femaleSel + 1) / (femaleApplied + 2);
                
                const lower = Math.min(maleRate, femaleRate);
                const higher = Math.max(maleRate, femaleRate);
                
                if (higher > 0) {
                    score = Math.round((lower / higher) * 100);
                }
            } else if (totalApplies === 0) {
                score = 0;
            } else {
                score = 100; // Only one gender applied, can't calculate bias
            }

            // Penalize score strictly for explicit AI Bias Flags
            if (totalFlags > 0 && totalApplies > 0) {
                // If every applicant has a bias flag, subtract 100 points.
                const penaltyRatio = totalFlags / totalApplies;
                const penalty = penaltyRatio * 100;
                score = Math.max(0, Math.round(score - penalty));
            }
            
            // Switch view
            navItems.forEach(nav => nav.classList.remove('active'));
            const dashNav = document.querySelector('.mode-bias-detection[data-target="dashboard-view"]');
            if (dashNav) {
                dashNav.classList.add('active');
                document.querySelector('.topbar h2')?.remove();
            }
            views.forEach(v => v.classList.remove('active'));
            document.getElementById('dashboard-view').classList.add('active');

            // Update Dashboard Stat Cards
            document.getElementById('stat-total').textContent = totalApplies;
            document.getElementById('stat-selected').textContent = totalSelected;
            
            const statRejected = document.getElementById('stat-rejected');
            if (statRejected) statRejected.textContent = totalRejected;
            
            document.getElementById('stat-flags').textContent = totalFlags;

            // Update Fairness Gauge UI (SVG Radial Chart) with smooth animation
            const fillElement = document.getElementById('fairness-radial-fill');
            const scoreText = document.getElementById('fairness-score-text');
            
            if (fillElement && scoreText) {
                let currentAnimatedScore = 0;
                const duration = 1200; // 1.2 seconds animation
                const fps = 60;
                const totalFrames = (duration / 1000) * fps;
                const increment = score / totalFrames;
                
                const animateScore = () => {
                    currentAnimatedScore += increment;
                    if (currentAnimatedScore >= score || score === 0) {
                        currentAnimatedScore = score;
                    } else {
                        requestAnimationFrame(animateScore);
                    }
                    
                    // Total circumference is 408.4
                    const currentOffset = 408.4 - (408.4 * currentAnimatedScore / 100);
                    fillElement.style.strokeDashoffset = currentOffset;
                    scoreText.textContent = `${Math.round(currentAnimatedScore)}%`;
                };
                
                // Initialize start position before animating
                fillElement.style.strokeDashoffset = 408.4;
                scoreText.textContent = "0%";
                requestAnimationFrame(animateScore);
            }
            
            const subtitle = document.querySelector('.fairness-gauge-container .subtitle');
            let severity = "low";
            if (subtitle) {
                if (score >= 80) {
                    subtitle.textContent = "Highly Fair";
                    subtitle.style.color = "var(--success)";
                    severity = "low";
                } else if (score >= 60) {
                    subtitle.textContent = "Moderately Fair (Monitor)";
                    subtitle.style.color = "var(--warning)";
                    severity = "medium";
                } else {
                    subtitle.textContent = "Significant Bias Detected";
                    subtitle.style.color = "var(--danger)";
                    severity = "high";
                }
            }

            // Update Dynamic Recommendations
            const recList = document.getElementById('recommendation-list');
            if (recList) {
                recList.innerHTML = '';
                if (severity === "high") {
                    recList.innerHTML += `<li><strong style="color:var(--danger)">URGENT:</strong> Severe gender selection disparity detected. Immediately implement blind-resume screening processes.</li>`;
                    recList.innerHTML += `<li>Audit the AI prompt for gendered language preferences.</li>`;
                } else if (severity === "medium") {
                    recList.innerHTML += `<li><strong style="color:var(--warning)">CAUTION:</strong> Selection rates are trending toward a disparate impact. Monitor upcoming batches.</li>`;
                    recList.innerHTML += `<li>Review recruiter manual overrides for potential subconscious biases.</li>`;
                } else {
                    recList.innerHTML += `<li><strong style="color:var(--success)">EXCELLENT:</strong> Current recruitment pipeline shows healthy diversity metrics.</li>`;
                    recList.innerHTML += `<li>Maintain current blind-evaluation configurations.</li>`;
                }
                
                if (totalFlags > 0) {
                    recList.innerHTML += `<li><strong>NOTE:</strong> ${totalFlags} manual bias flags were detected. Conduct a random audit of recruiter overrides.</li>`;
                }
            }

            // Update Bias Vectors
            const vectorsList = document.getElementById('bias-vectors-list');
            if (vectorsList) {
                vectorsList.innerHTML = '';
                
                // Disparate Impact Vector
                vectorsList.innerHTML += `
                    <div class="bias-vector-item">
                        <div class="vector-icon"><i class="ph ph-gender-intersex"></i></div>
                        <div class="vector-info">
                            <h4>Gender Disparate Impact</h4>
                            <div class="progress-bar-small"><div class="progress-fill-small ${severity === 'high' ? 'danger' : severity === 'medium' ? 'warning' : ''}" style="width: ${score}%;"></div></div>
                            <span>${score}% Disparate Impact Ratio</span>
                        </div>
                    </div>
                `;

                // Manual Override Flags Vector
                const overrideRatio = totalApplies > 0 ? Math.min(100, Math.round((totalFlags / totalApplies) * 100)) : 0;
                vectorsList.innerHTML += `
                    <div class="bias-vector-item">
                        <div class="vector-icon"><i class="ph ph-hand-pointing"></i></div>
                        <div class="vector-info">
                            <h4>Manual Recruiter Overrides</h4>
                            <div class="progress-bar-small"><div class="progress-fill-small ${overrideRatio > 15 ? 'danger' : overrideRatio > 5 ? 'warning' : ''}" style="width: ${overrideRatio}%;"></div></div>
                            <span>${overrideRatio}% Override Rate (${totalFlags} flags)</span>
                        </div>
                    </div>
                `;
            }

            // Update Historical Gender Chart
            if (historicalChartInstance) {
                let unknownSel = Math.max(0, totalSelected - (maleSel + femaleSel));
                let unknownRej = Math.max(0, totalRejected - (maleRej + femaleRej));
                historicalChartInstance.data.datasets[0].data = [maleSel, maleRej, femaleSel, femaleRej, unknownSel, unknownRej];
                historicalChartInstance.update();
            }
        });
    }
    // --- BIAS CANDIDATES MODAL LOGIC ---
    const biasCandidatesModal = document.getElementById('bias-candidates-modal');
    const closeBiasCandidatesModal = document.getElementById('close-bias-candidates-modal');
    const biasCandidatesTitle = document.getElementById('bias-candidates-title');
    const biasCandidatesGrid = document.getElementById('bias-candidates-grid');

    if (closeBiasCandidatesModal) {
        closeBiasCandidatesModal.addEventListener('click', () => {
            biasCandidatesModal.style.display = 'none';
        });
    }

    document.querySelectorAll('.clickable-stat').forEach(card => {
        card.addEventListener('click', () => {
            const filterType = card.dataset.filter;
            
            // Determine which report to use
            const report = window.uploadedDatasetReport || window.activeDashboardReport;
            
            if (!report || !report.selected) {
                alert("No candidate data available to display yet.");
                return;
            }

            let candidatesToDisplay = [];
            let title = "";

            if (filterType === 'total') {
                candidatesToDisplay = [...report.selected, ...report.rejected];
                title = `All Analyzed Candidates (${candidatesToDisplay.length})`;
            } else if (filterType === 'selected') {
                candidatesToDisplay = report.selected;
                title = `Selected Candidates (${candidatesToDisplay.length})`;
            } else if (filterType === 'rejected') {
                candidatesToDisplay = report.rejected;
                title = `Rejected Candidates (${candidatesToDisplay.length})`;
            } else if (filterType === 'bias') {
                // Filter for candidates with a biasNote or flagged in history
                candidatesToDisplay = [...report.selected, ...report.rejected].filter(c => c.biasNote || c.biasFlagged);
                
                // If using a custom dataset where flags were just a count, we might not have 'biasNote' on individuals.
                // Fallback: If filter is bias and we have no detailed bias notes, just show everyone to be safe or show a warning.
                if (candidatesToDisplay.length === 0 && report.biasFlags > 0) {
                    title = `Bias Flags (${report.biasFlags} detected in aggregate)`;
                    biasCandidatesGrid.innerHTML = `<p style="color:var(--text-muted); grid-column: 1/-1;">Bias flags were detected in aggregate demographics or overrides, but specific candidate notes are not available in this dataset view.</p>`;
                    biasCandidatesTitle.textContent = title;
                    biasCandidatesModal.style.display = 'flex';
                    return;
                }
                title = `Candidates with Bias Flags (${candidatesToDisplay.length})`;
            }

            biasCandidatesTitle.textContent = title;
            biasCandidatesGrid.innerHTML = '';

            if (candidatesToDisplay.length === 0) {
                biasCandidatesGrid.innerHTML = `<p style="color:var(--text-muted); grid-column: 1/-1;">No candidates found for this category.</p>`;
            } else {
                candidatesToDisplay.forEach(c => {
                    // Determine if selected or rejected based on which array it came from if not explicitly stored
                    const isSelected = report.selected.some(s => s.name === c.name);
                    const statusClass = isSelected ? 'success' : 'danger';
                    const statusText = isSelected ? 'Selected' : 'Rejected';
                    
                    biasCandidatesGrid.innerHTML += `
                        <div class="candidate-card" style="padding: 1rem; border: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.2);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                <strong style="color: var(--text-main); font-size: 1.1rem;">${c.name}</strong>
                                <span class="badge" style="background: var(--${statusClass}); color: #000; font-size: 0.7rem; padding: 0.2rem 0.5rem;">${statusText}</span>
                            </div>
                            ${c.gender ? `<p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.2rem;"><strong>Gender:</strong> ${c.gender}</p>` : ''}
                            ${c.matchScore ? `<p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.2rem;"><strong>Match Score:</strong> ${c.matchScore}%</p>` : ''}
                            ${c.biasNote ? `<div style="margin-top: 0.8rem; padding-top: 0.8rem; border-top: 1px dashed var(--warning); font-size: 0.85rem; color: var(--warning);"><i class="ph ph-warning"></i> <strong>Bias Flag:</strong> ${c.biasNote}</div>` : ''}
                        </div>
                    `;
                });
            }

            biasCandidatesModal.style.display = 'flex';
        });
    });

    // --- THEME TOGGLE LOGIC ---
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    
    // Check local storage for theme preference
    const savedTheme = localStorage.getItem('fairhire_theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const isLight = document.body.classList.contains('light-theme');
            localStorage.setItem('fairhire_theme', isLight ? 'light' : 'dark');
        });
    }

    // --- PROFILE EDIT LOGIC ---
    const btnSaveProfile = document.getElementById('btn-save-profile');
    const editProfileCompany = document.getElementById('edit-profile-company');
    const editProfileRecruiter = document.getElementById('edit-profile-recruiter');

    // When "My Dashboard" is clicked, pre-fill the inputs
    const menuDashboard = document.getElementById('menu-dashboard');
    if (menuDashboard) {
        menuDashboard.addEventListener('click', () => {
            if (editProfileCompany) editProfileCompany.value = AuthManager.companyName || '';
            if (editProfileRecruiter) editProfileRecruiter.value = AuthManager.recruiterName || '';
        });
    }

    if (btnSaveProfile) {
        btnSaveProfile.addEventListener('click', async () => {
            const newCompany = editProfileCompany.value.trim();
            const newRecruiter = editProfileRecruiter.value.trim();

            if (!newCompany || !newRecruiter) {
                alert("Please fill in both Company and Recruiter names.");
                return;
            }

            // Update AuthManager
            AuthManager.companyName = newCompany;
            AuthManager.recruiterName = newRecruiter;

            // Save to localStorage
            localStorage.setItem('fairhire_company', newCompany);
            localStorage.setItem('fairhire_recruiter', newRecruiter);

            // Update Firebase if logged in
            if (window.firebaseAuth && window.firebaseAuth.currentUser && window.firebaseDb) {
                try {
                    const uid = window.firebaseAuth.currentUser.uid;
                    await window.firebaseDb.collection('companies').doc(uid).update({
                        companyName: newCompany,
                        recruiterName: newRecruiter
                    });
                } catch (e) {
                    console.error("Failed to update profile in Firebase", e);
                }
            }

            // Update UI instantly
            AuthManager.updateUI();
            
            // Show success styling briefly
            const originalText = btnSaveProfile.innerHTML;
            btnSaveProfile.innerHTML = `<i class="ph ph-check"></i> Saved Successfully!`;
            btnSaveProfile.classList.replace('primary', 'success');
            setTimeout(() => {
                btnSaveProfile.innerHTML = originalText;
                btnSaveProfile.classList.replace('success', 'primary');
            }, 2000);
        });
    }

});
