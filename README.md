# FAIRHIRE-AI
FairHire AI is an intelligent, unbiased Applicant Tracking System (ATS) powered by Gemini 1.5. It performs blind resume parsing, automated skill extraction, and uses the 4/5ths Disparate Impact rule to visually flag systemic hiring biases.
# ⚖️ FairHire AI - Unbiased Hiring & Bias Detection

FairHire AI is a completely blind, AI-driven Applicant Tracking System (ATS) designed to eliminate unconscious bias in recruitment. Built for the GDG Hackathon, this platform strips away identifying factors from resumes and judges candidates purely on merit, skill, and fit.

## 🚀 Key Features

* **Blind Resume Parsing:** Extracts and analyzes PDF resumes strictly on technical competencies, automatically ignoring names, genders, and ages to prevent initial human bias.
* **Powered by Gemini 1.5 Pro:** Enforces strict JSON schemas through advanced prompt engineering to perfectly extract skills, projects, and certifications without hallucination.
* **Global Bias Analytics Dashboard:** Applies the HR industry standard **4/5ths Disparate Impact Rule** to historical hiring data, visually flagging if a company's past hiring trends are systemically biased.
* **Neon Bias Trajectory:** Tracks and visualizes real-time deviations between unbiased AI recommendations and manual human overrides.
* **Client-Side Privacy:** Resumes are parsed locally using `pdf.js` before reaching the AI, ensuring applicant data remains secure.
* **Automated Feedback:** Generates personalized, constructive rejection emails for candidates.

## 🛠️ Technology Stack
* **AI Engine:** Google Gemini 1.5 Pro API
* **Frontend:** HTML5, Vanilla JavaScript, CSS3 (Glassmorphism & Custom Particle Animations)
* **Backend / Database:** Firebase Firestore & Firebase Authentication
* **Data Processing:** PDF.js (Client-side extraction), Chart.js (Data Visualization)

## 💡 Try the Live Demo
1. Navigate to the Configuration Tab and click **"Fill Demo Config"**.
2. Go to the Upload Tab and click **"Load Sample Resumes"**. 
3. Review the unbiased candidate rankings and interact with the Bias Detection Dashboard to see the 4/5ths rule in action.
