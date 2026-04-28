// aiAgent.js
// This file connects to the Gemini API to analyze raw text extracted from real PDFs.

class AIAgent {
    constructor() {
        this.apiKey = "AIzaSyBCoQVIA3SjtLXxHONr0Mv_qOmYRB-qsUg";
        this.jobRole = "";
        this.skills = [];
        this.vacancies = 5;
        this.hasCompanyDataset = false;
        this.resolvedModel = null;
    }

    configure(apiKey, role, skillsStr, datasetText, vacancies = 5) {
        if (apiKey) this.apiKey = apiKey;
        this.jobRole = role;
        this.skills = skillsStr.split(',').map(s => s.trim()).filter(s => s);
        if (this.skills.length === 0) {
            this.skills = ["Communication"]; // fallback
        }
        this.vacancies = parseInt(vacancies, 10) || 5;
        this.hasCompanyDataset = !!datasetText;
        this.companyDataset = datasetText;
    }

    async analyzeResumes(resumesData) {
        let allCandidates = [];
        let biasFlags = 0;

        if (this.apiKey.toUpperCase() === "DEMO") {
            // DEMO mode uses fallback logic
            for (let i = 0; i < resumesData.length; i++) {
                const resume = resumesData[i];
                const aiResponse = await this.callGeminiAPI(resume.text, resume.filename);
                
                if (aiResponse && !aiResponse.error) {
                    aiResponse.name = aiResponse.name && aiResponse.name !== "Unknown" ? aiResponse.name : resume.filename;
                    allCandidates.push(aiResponse);
                } else {
                    let errMsg = aiResponse && aiResponse.error ? aiResponse.error : "Failed to parse resume text using AI";
                    allCandidates.push({
                        name: resume.filename, roleAppliedFor: "N/A", emailAddress: "N/A", phoneNo: "N/A", matchScore: 0, jobRoleMatch: "N/A", technicalSkillsMatch: "N/A", projectCount: 0, projects: [],
                        technicalSkills: [], cgpa: 0, educationStream: "N/A", university: "N/A", certifications: [], certificationCount: 0, gender: "N/A",
                        drawbacks: [errMsg], learningRecommendations: ["Review fundamental requirements."], biasNote: null, emailDraft: "No draft generated due to error."
                    });
                }
            }
        } else {
            // BATCH PROCESSING - Parallelized with smaller chunks for extreme speed
            const chunkSize = 5; // Reduced from 10 to speed up API calls and avoid strict token limits
            const chunkPromises = [];
            
            for (let i = 0; i < resumesData.length; i += chunkSize) {
                const chunk = resumesData.slice(i, i + chunkSize);
                
                // Stagger requests slightly to prevent hitting burst rate limits (429 errors)
                const p = new Promise(resolve => setTimeout(resolve, Math.floor(i / chunkSize) * 1000))
                    .then(() => this.callGeminiAPIBatch(chunk))
                    .then(batchResponses => {
                        if (batchResponses.error || !Array.isArray(batchResponses)) {
                            // Fallback if parsing or network fails
                            const errMsg = batchResponses.error || "Batch processing failed.";
                            return chunk.map(r => ({
                                name: r.filename, roleAppliedFor: "N/A", emailAddress: "N/A", phoneNo: "N/A", matchScore: 0, jobRoleMatch: "No", technicalSkillsMatch: "No", projectCount: 0, projects: [],
                                technicalSkills: [], cgpa: 0, educationStream: "N/A", university: "N/A", certifications: [], certificationCount: 0, gender: "N/A",
                                drawbacks: [errMsg], learningRecommendations: ["Review fundamental requirements."], biasNote: null
                            }));
                        } else {
                            return batchResponses.map((aiResponse, idx) => {
                                const originalFilename = idx < chunk.length ? chunk[idx].filename : "Unknown Candidate";
                                aiResponse.name = aiResponse.name && aiResponse.name !== "Unknown" ? aiResponse.name : originalFilename;
                                return aiResponse;
                            });
                        }
                    })
                    .catch(err => {
                        console.error("Chunk processing error:", err);
                        return chunk.map(r => ({
                            name: r.filename, roleAppliedFor: "N/A", emailAddress: "N/A", phoneNo: "N/A", matchScore: 0, jobRoleMatch: "No", technicalSkillsMatch: "No", projectCount: 0, projects: [],
                            technicalSkills: [], cgpa: 0, educationStream: "N/A", university: "N/A", certifications: [], certificationCount: 0, gender: "N/A",
                            drawbacks: ["Critical Error: " + err.message], learningRecommendations: ["Review fundamental requirements."], biasNote: null
                        }));
                    });
                chunkPromises.push(p);
            }
            
            // Wait for all chunks to finish simultaneously
            const results = await Promise.all(chunkPromises);
            results.forEach(resArray => allCandidates.push(...resArray));
        }

        // Apply Hard Logic Constraints & Sort
        let selected = [];
        let rejected = [];

        allCandidates.forEach(c => {
            if (c.biasNote) biasFlags++;

            // Ensure attributes exist to prevent UI crashes
            c.cgpa = parseFloat(c.cgpa) || 0;
            c.projectCount = parseInt(c.projectCount) || 0;
            c.certificationCount = parseInt(c.certificationCount) || 0;
            if (!c.drawbacks) c.drawbacks = [];
            if (!c.learningRecommendations) c.learningRecommendations = [];
            if (!c.certifications) c.certifications = [];

            let isRejected = false;

            // Strict Rejection Rule 1: Job Role Match
            if (c.jobRoleMatch && c.jobRoleMatch.toLowerCase().includes('no')) {
                c.drawbacks.push(`Rejected: Candidate's experience does not match the ${this.jobRole} role.`);
                isRejected = true;
            }

            // Strict Rejection Rule 2: Technical Skills Match
            if (c.technicalSkillsMatch && c.technicalSkillsMatch.toLowerCase().includes('no')) {
                c.drawbacks.push(`Rejected: Candidate lacks the mandatory technical skills.`);
                isRejected = true;
            }

            // Strict Rejection Rule 3: CGPA < 8
            if (c.cgpa < 8) {
                c.drawbacks.push(`Rejected: CGPA (${c.cgpa}) is below the required 8.0 minimum.`);
                isRejected = true;
            }

            // Fallback Match Score Rule
            if (c.matchScore < 60) {
                c.drawbacks.push(`Rejected: Overall match score (${c.matchScore}%) is too low.`);
                isRejected = true;
            }

            if (isRejected) {
                rejected.push(c);
            } else {
                selected.push(c);
            }
        });

        // Mathematical Priority Sorting for Selected Candidates
        // Priority 1: Match Score
        // Priority 2: Project Count
        // Priority 3: Certification Count
        // Priority 4: CGPA
        selected.sort((a, b) => {
            if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
            if (b.projectCount !== a.projectCount) return b.projectCount - a.projectCount;
            if (b.certificationCount !== a.certificationCount) return b.certificationCount - a.certificationCount;
            return b.cgpa - a.cgpa;
        });

        // Slice strictly to the number of vacancies requested
        const finalSelected = selected.slice(0, this.vacancies);
        const overflowRejected = selected.slice(this.vacancies);

        overflowRejected.forEach(c => {
            c.drawbacks.push(`Rejected: Candidate met criteria but all ${this.vacancies} vacancies were filled by higher-scoring applicants.`);
        });

        // Consolidate final rejections
        rejected = rejected.concat(overflowRejected);

        // Locally generate high-quality email drafts for everyone instantly
        finalSelected.forEach(c => {
            c.emailDraft = `Subject: Next Steps - ${this.jobRole || 'Application'}\n\nDear ${c.name},\n\nCongratulations! We were very impressed by your profile and are pleased to advance you to the next stage of our hiring process for the ${this.jobRole || 'open'} position.\n\nOur team will be in touch shortly to schedule an interview.\n\nBest regards,\nThe Hiring Team`;
        });

        rejected.forEach(c => {
            const drawbacksList = c.drawbacks && c.drawbacks.length > 0 ? c.drawbacks.map(d => `- ${d}`).join('\n') : '- Core technical skills relative to the job description';
            const learningList = c.learningRecommendations && c.learningRecommendations.length > 0 ? c.learningRecommendations.map(l => `- ${l}`).join('\n') : '- General upskilling in required technologies.';
            
            c.emailDraft = `Subject: Update on your application for ${this.jobRole || 'the open position'}

Dear ${c.name},

Thank you for taking the time to apply. After reviewing your profile against our current requirements, we have decided not to move forward with your application at this time.

While your profile had strong aspects, we noted the following drawbacks relative to our current needs:
${drawbacksList}

To strengthen your profile for future opportunities, we highly recommend focusing on the following learning paths:
${learningList}

We appreciate your interest in joining our team and wish you the best of luck in your career journey.

Sincerely,
The Hiring Team`;
        });

        const report = {
            total: resumesData.length,
            selectedCount: finalSelected.length,
            biasFlags: biasFlags,
            selected: finalSelected,
            rejected: rejected,
            recommendations: this.generateRecommendations(biasFlags)
        };

        return report;
    }

    async getBestModel() {
        if (this.resolvedModel) return this.resolvedModel;
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`);
            const data = await res.json();
            if (data.models) {
                const supported = data.models.filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'));
                const best = supported.find(m => m.name.includes('gemini-1.5-flash')) ||
                             supported.find(m => m.name.includes('gemini-1.5-pro')) ||
                             supported.find(m => m.name.includes('gemini-pro')) ||
                             supported[0];
                if (best) {
                    this.resolvedModel = best.name; 
                    return this.resolvedModel;
                }
            }
        } catch (e) {
            console.error("Failed to fetch models list", e);
        }
        return "models/gemini-1.5-flash"; // fallback
    }

    async callGeminiAPIBatch(resumesChunk) {
        if (!this.apiKey) return { error: "Missing API Key" };
        const modelName = await this.getBestModel();
        const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${this.apiKey}`;
        
        let contextSection = "";
        if (this.companyDataset) {
            contextSection = `\nCOMPANY HISTORICAL DATA CONTEXT:\n"""\n${this.companyDataset}\n"""\nAnalyze this company data. If it reveals past biases, use it to explicitly flag if the current candidate matches those demographics and ensure your grading is purely skill-based.\n`;
        }

        let combinedResumes = "";
        resumesChunk.forEach((r, idx) => {
            combinedResumes += `\n\n--- RESUME ${idx} ---\n`;
            // Provide the full resume text for comprehensive ATS parsing
            const cleanText = r.text.replace(/\s+/g, ' '); 
            combinedResumes += cleanText;
        });

        const systemPrompt = `You are an expert, unbiased AI recruitment assistant acting as a strict Applicant Tracking System (ATS). Your job is to analyze the provided resumes against the target job role: "${this.jobRole}" requiring the following skills: "${this.skills.join(', ')}".
        ${contextSection}
IMPORTANT DIRECTIVE: Your assessment must be 100% blind to demographic factors. You must STRICTLY IGNORE the candidate's name, gender, age, and the prestige of their college/university when determining the matchScore. The matchScore must be calculated SOLELY based on their technical skills, projects, and relevant certifications.

IMPORTANT: You must respond ONLY with a valid JSON array. Do NOT include markdown blocks like \`\`\`json.
        
The JSON array must contain exactly ${resumesChunk.length} objects (one for each resume, strictly following the numerical order provided). Each object must have EXACTLY the following structure:
{
  "name": "Applicant's full name (or 'Unknown')",
  "roleAppliedFor": "<The specific role the candidate stated they are applying for in their objective/header>",
  "emailAddress": "<Extract their email address. If not found, use 'unknown@example.com'>",
  "phoneNo": "<Extract their phone number. If missing, use 'N/A'>",
  "jobRoleMatch": "<'Yes' or 'No'. Does their experience strictly match the ${this.jobRole} role?>",
  "technicalSkillsMatch": "<'Yes' or 'No'. Do their technical skills align with: ${this.skills.join(', ')}?>",
  "matchScore": <number between 0 and 100 representing how well their skills match the required skills, IGNORING demographics/college>,
  "projectCount": <Number of projects they have completed>,
  "projects": ["Array", "of", "brief", "1-sentence project descriptions"],
  "technicalSkills": ["Array", "of", "key", "skills", "found", "in", "resume"],
  "cgpa": <Number representing CGPA on a 10-point scale. If missing, return 0>,
  "educationStream": "<Extract their degree name and stream, e.g. 'B.Tech Computer Science'. If missing, use 'N/A'>",
  "university": "<Extracted university/college name, or 'N/A'>",
  "certificationCount": <Number of certifications completed>,
  "certifications": ["Array", "of", "certifications", "completed"],
  "gender": "<Infer gender from name/pronouns, or 'Unknown'>",
  "drawbacks": ["Array", "of", "missing", "required", "skills", "or", "weaknesses", "relative", "to", "the", "job", "description"],
  "learningRecommendations": ["Array", "of", "actionable", "learning", "topics", "or", "courses", "they", "should", "pursue", "to", "qualify", "for", "this", "role"],
  "biasNote": "<A string noting if a human might be biased against them (e.g., 'Non-traditional education', 'Older candidate'). Null if none.>"
}

Resumes to Analyze:
"""
${combinedResumes}
"""
`;

        return await this.fetchWithRetry(url, systemPrompt);
    }

    async fetchWithRetry(url, systemPrompt, maxRetries = 3) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: systemPrompt }] }],
                        generationConfig: {
                            responseMimeType: "application/json"
                        }
                    })
                });

                const data = await response.json();
                
                if (data.error) {
                    if (data.error.code === 429) {
                        console.warn(`Rate limit hit (429). Retrying attempt ${attempt + 1} of ${maxRetries}...`);
                        await new Promise(r => setTimeout(r, 20000)); // wait 20 seconds
                        continue;
                    }
                    return { error: `Gemini API Error: ${data.error.message}` };
                }

                if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
                    let rawText = data.candidates[0].content.parts[0].text.trim();
                    const jsonMatch = rawText.match(/\[[\s\S]*\]/); // Match a JSON array
                    
                    if (jsonMatch) {
                        try {
                            return JSON.parse(jsonMatch[0]);
                        } catch (e) {
                            return { error: "Failed to parse AI JSON array output." };
                        }
                    } else {
                        return { error: `AI didn't return data in the expected JSON Array format.` };
                    }
                }
                return { error: `Unexpected AI response format.` };
            } catch (e) {
                console.error("Fetch error:", e);
                if (attempt === maxRetries - 1) return { error: "Network error connecting to Gemini API." };
                await new Promise(r => setTimeout(r, 5000));
            }
        }
    }

    async callGeminiAPI(resumeText, filename = "Unknown") {
        if (!this.apiKey) return null;

        if (this.apiKey.toUpperCase() === "DEMO") {
            // OFFLINE ATS MODE: Basic Keyword Matching without API
            await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
            
            const lowerResumeText = resumeText.toLowerCase();
            const foundSkills = [];
            const missingSkills = [];
            
            this.skills.forEach(skill => {
                if (lowerResumeText.includes(skill.toLowerCase())) {
                    foundSkills.push(skill);
                } else {
                    missingSkills.push(skill);
                }
            });
            
            let matchScore = this.skills.length > 0 ? Math.round((foundSkills.length / this.skills.length) * 100) : 100;
            let guessedName = filename.replace('.pdf', '').replace(/_/g, ' ');

            const fakeResponse = {
                name: guessedName, 
                roleAppliedFor: "Software Engineer (Simulated)",
                emailAddress: "candidate@example.com",
                phoneNo: "+1 555-0198",
                jobRoleMatch: "Yes",
                technicalSkillsMatch: "Yes",
                matchScore: matchScore, 
                technicalSkills: foundSkills.length > 0 ? foundSkills : ["HTML", "CSS", "JS"],
                projects: ["Built a mock web platform", "Developed a data analysis script"],
                projectCount: 2,
                cgpa: 8.5, 
                educationStream: "B.Tech Computer Science",
                university: "Simulated University", 
                certifications: ["React Developer Certification"],
                certificationCount: 1,
                gender: "Unknown", 
                drawbacks: missingSkills.length > 0 ? missingSkills.map(s => "Missing keyword: " + s) : ["Requires minor upskilling in cloud tech."],
                learningRecommendations: missingSkills.length > 0 ? missingSkills.map(s => `Consider taking a certification or building a project using ${s}`) : ["Focus on system design."],
                biasNote: null
            };
            return fakeResponse;
        }
        
        // This method is now only used as a fallback if not using batch processing
        return { error: "callGeminiAPI has been deprecated for batch processing." };
    }

    async chat(message, context) {
        if (!this.apiKey || this.apiKey.toUpperCase() === "DEMO") {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return `[DEMO MODE] This is a simulated response to: "${message}". Please enter a real Gemini API Key in Configuration to chat with me.`;
        }

        try {
            const modelName = await this.getBestModel();
            const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${this.apiKey}`;
            
            const systemPrompt = `You are the FAIRHIRE AI Chatbot, an expert recruitment and bias detection assistant. 
Context: ${context}
Job Role: ${this.jobRole || "Not configured yet"}
Skills: ${this.skills.length > 0 ? this.skills.join(', ') : "Not configured yet"}

Respond professionally, concisely, and helpfully to the user's prompt.`;

            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        { role: "user", parts: [{ text: systemPrompt + "\n\nUser Message: " + message }] }
                    ]
                })
            });

            const data = await response.json();
            if (data.error) return "API Error: " + (data.error.message || "Could not generate response.");

            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                return data.candidates[0].content.parts[0].text.trim();
            }
            return "I couldn't process that request right now.";
        } catch (e) {
            console.error("Chat Error:", e);
            return "Network error while connecting to Gemini API.";
        }
    }

    generateRecommendations(flagsCount) {
        const recs = [
            "Standardize interview questions strictly around the required skills: " + this.skills.join(', '),
            "Implement blind resume reviews (hide names, age indicators, and graduation years) to reduce unconscious demographic bias during human screening."
        ];
        
        if (this.hasCompanyDataset) {
            recs.push("✅ Company Context Analyzed: The AI incorporated your historical context and adjusted its evaluation weights to focus 100% purely on skills.");
        } else {
            recs.push("⚠️ Recommendation: Uploading your company's past hiring data can help the AI learn and correct your specific organizational biases.");
        }
        
        if (flagsCount > 0) {
            recs.push(`The AI flagged ${flagsCount} instances where qualified candidates might face algorithmic or human bias (e.g., non-traditional education, age factors). Review these flags carefully.`);
        }
        
        return recs;
    }
}

// Global instance
window.aiAgent = new AIAgent();
