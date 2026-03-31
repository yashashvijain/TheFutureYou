document.addEventListener('DOMContentLoaded', () => {

    let state = {
        theme: 'light',
        goal: '',
        consecutiveDays: 0,
        lastLogDate: null,
        level: 1,
        reports: [],
        consistencyScore: 0,
        apiKey: '',
    };

    function saveState() { localStorage.setItem('fv_state', JSON.stringify(state)); }
    function loadState() {
        try { const s = JSON.parse(localStorage.getItem('fv_state')); if (s) state = { ...state, ...s }; } catch(e){}
    }
    loadState();

    // --- Reset ---
    document.addEventListener('click', (e) => {
        if(e.target.closest('#resetProfileBtn')) {
            if(confirm("Are you sure you want to completely erase your profile and history? This cannot be undone.")) {
                localStorage.removeItem('fv_state');
                location.reload();
            }
        }
    });

    // --- Theme ---
    if(state.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    document.getElementById('themeToggle').addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        state.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        saveState();
    });

    // --- Landing Page ---
    const landingPage = document.getElementById('landingPage');
    const appContainer = document.getElementById('appContainer');

    if(state.goal && state.reports.length > 0) {
        // User already played before, skip to app
        landingPage.classList.add('hidden');
        appContainer.classList.remove('hidden');
        setTimeout(runChatFlow, 300);
    } else {
        // New user
        document.getElementById('getStartedBtn').addEventListener('click', () => {
            const keyInput = document.getElementById('apiKeyInput');
            if ((!state.apiKey || state.apiKey === '') && keyInput && keyInput.value.trim() === '') {
                document.getElementById('apiKeyError').classList.remove('hidden');
                document.getElementById('apiKeyError').textContent = 'Please enter a valid Gemini API Key.';
                return;
            }
            if (keyInput && keyInput.value.trim() !== '') {
                state.apiKey = keyInput.value.trim();
                saveState();
            }
            launchApp();
        });

        document.getElementById('defaultModeBtn').addEventListener('click', () => {
            state.apiKey = ''; // Ensure fallback mode
            saveState();
            launchApp();
        });

        function launchApp() {
            landingPage.style.opacity = '0';
            setTimeout(() => {
                landingPage.classList.add('hidden');
                appContainer.classList.remove('hidden');
                runChatFlow();
            }, 400);
        }
    }

    // --- Navigation ---
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabs = document.querySelectorAll('.tab-content');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            tabs.forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
            if(btn.dataset.tab === 'profile') updateProfileUI();
        });
    });

    // --- Chat Engine ---
    const chatHistory = document.getElementById('chatHistory');
    const chatInputArea = document.getElementById('chatInputArea');
    let chatStage = 0;
    let tempAnswers = {};

    function addMessage(sender, text) {
        const div = document.createElement('div');
        const name = sender === 'ai' ? 'SYSTEM' : 'YOU';
        div.className = `py-6 border-b border-gray-200 dark:border-slate-800/60 transition-all duration-300 ease-in-out`;
        div.innerHTML = `
            <div class="text-xs text-gray-400 dark:text-slate-500 font-semibold mb-2 uppercase tracking-widest">${name}</div>
            <div class="text-black dark:text-white font-sans text-base leading-relaxed break-words">${text}</div>
        `;
        chatHistory.appendChild(div);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    function setInputMode(mode, data) {
        chatInputArea.innerHTML = '';
        if (mode === 'text') {
            chatInputArea.innerHTML = `
                <div class="flex items-center gap-3 mt-4">
                    <input type="text" id="chatTxt" class="flex-1 bg-transparent border-b border-gray-300 dark:border-slate-700 text-black dark:text-white font-sans text-base outline-none py-2 transition-all duration-300 ease-in-out focus:border-black dark:focus:border-white rounded-none placeholder-gray-400 dark:placeholder-slate-600" placeholder="${data.placeholder || 'Type here...'}">
                    <button class="bg-black dark:bg-white text-white dark:text-black px-5 py-2 text-sm font-semibold capitalize tracking-wide rounded-sm transition-all duration-300 ease-in-out hover:opacity-80" id="chatSend"><i class="fa-solid fa-arrow-right"></i></button>
                </div>
            `;
            const sendBtn = document.getElementById('chatSend');
            const txt = document.getElementById('chatTxt');
            txt.focus();
            const submit = () => { if(txt.value.trim()) handleAnswer(txt.value.trim()); };
            sendBtn.addEventListener('click', submit);
            txt.addEventListener('keypress', (e) => { if(e.key === 'Enter') submit(); });
        } else if (mode === 'choice') {
            const wrap = document.createElement('div');
            wrap.className = 'flex flex-wrap gap-3 mt-4';
            const opts = Array.isArray(data) ? data : data.options;
            opts.forEach(opt => {
                const b = document.createElement('button');
                b.className = 'border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 bg-transparent px-5 py-2 text-sm font-medium rounded-sm transition-all duration-300 ease-in-out hover:border-black hover:text-black dark:hover:border-white dark:hover:text-white';
                b.textContent = opt.label;
                b.addEventListener('click', () => handleAnswer(opt.value, opt.label));
                wrap.appendChild(b);
            });
            chatInputArea.appendChild(wrap);
        } else if (mode === 'slider') {
            chatInputArea.innerHTML = `
                <div class="w-full mt-6">
                    <div class="flex justify-between text-xs text-gray-500 mb-4 font-mono uppercase tracking-widest"><span id="sldVal">${data.def}</span><span>${data.unit}</span></div>
                    <input type="range" id="chatSld" class="w-full h-1 bg-gray-200 dark:bg-slate-800 rounded-none appearance-none outline-none cursor-pointer transition-all duration-300" min="${data.min}" max="${data.max}" value="${data.def}">
                    <button class="w-full mt-6 bg-black dark:bg-white text-white dark:text-black py-3 text-sm font-bold uppercase tracking-widest rounded-sm transition-all duration-300 ease-in-out hover:opacity-80" id="chatSldBtn">Confirm Action</button>
                </div>
            `;
            const sld = document.getElementById('chatSld');
            const lbl = document.getElementById('sldVal');
            sld.addEventListener('input', () => lbl.textContent = sld.value);
            document.getElementById('chatSldBtn').addEventListener('click', () => {
                handleAnswer(sld.value, `${sld.value} ${data.unit}`);
            });
        }
    }

    function runChatFlow() {
        if (chatStage === 0) {
            chatHistory.innerHTML = '';
            addMessage('ai', "Hey! I'm you from the future. I'm here to make sure we achieve our dreams.");
            setTimeout(() => {
                if(!state.goal) {
                    addMessage('ai', "First things first. What is our ultimate career or life goal right now?");
                    setInputMode('text', { placeholder: "e.g. Software Engineer, Author, Fit Businessman" });
                } else {
                    addMessage('ai', `Welcome back! Are we still grinding to become a **${state.goal}**?`);
                    setInputMode('choice', [
                        {label: "Yes, focused!", value: state.goal},
                        {label: "No, change goal", value: "change"}
                    ]);
                }
            }, 800);
        } else if (chatStage === 1) {
            let q = `What specific actions did you take today towards becoming a ${state.goal || 'master'}?`;
            const gl = (state.goal || '').toLowerCase();
            if (gl.includes("dev") || gl.includes("soft") || gl.includes("code") || gl.includes("web") || gl.includes("app")) {
                q = `What technical progress did you make today? Did you focus on any specific coding languages, frameworks, or algorithms?`;
            } else if (gl.includes("business") || gl.includes("founder") || gl.includes("startup") || gl.includes("entre")) {
                q = `What business actions did you take today? Did you handle customer outreach, product building, or marketing?`;
            } else if (gl.includes("design") || gl.includes("art")) {
                q = `What creative actions did you take today? Did you work on UI layouts, sketches, or study design patterns?`;
            } else if (gl.includes("fit") || gl.includes("health") || gl.includes("athlet")) {
                q = `What specific physical actions did you take today? Did you have a heavy lift session, cardio, or active recovery?`;
            }

            addMessage('ai', q);
            setInputMode('text', { placeholder: "I worked on..." });
        } else if (chatStage === 2) {
            addMessage('ai', `Awesome. To achieve greatness, we need to put in the hours. Let's quantify that action. How many hours did you spend deep working on it tonight?`);
            setInputMode('slider', { min: 0, max: 16, def: 2, unit: "Hours" });
        } else if (chatStage === 3) {
            addMessage('ai', `Got it. Recovery is just as important as the grind. How many hours did we sleep last night?`);
            setInputMode('slider', { min: 0, max: 12, def: 7, unit: "Hours" });
        } else if (chatStage === 4) {
            addMessage('ai', `How about our physical and mental health today? Did we eat well and stay active?`);
            setInputMode('choice', [
                {label: "Great (Workout + Clean Food)", value: 100},
                {label: "Okay (Average day)", value: 50},
                {label: "Terrible (Junk food, lazy)", value: 0}
            ]);
        } else if (chatStage === 5) {
            addMessage('ai', `Be honest with me... did we waste time doomscrolling, gaming, or indulging in bad habits today?`);
            setInputMode('choice', [
                {label: "Yes, wasted a lot of time 😔", value: "yes"},
                {label: "No, stayed focused! 🛡️", value: "no"}
            ]);
        } else if (chatStage === 6) {
            chatInputArea.innerHTML = '';
            addMessage('ai', `<i class="fa-solid fa-spinner fa-spin"></i> Analyzing trajectory...`);
            setTimeout(calculateDailyOutcome, 2000);
        }
    }

    function handleAnswer(val, displayVal = val) {
        addMessage('user', displayVal);
        chatInputArea.innerHTML = ''; // disable input
        
        if (chatStage === 0) {
            if (val === 'change') {
                state.goal = '';
                setTimeout(runChatFlow, 500);
                return;
            } else {
                state.goal = val;
                saveState();
            }
        } else if (chatStage === 1) tempAnswers.actionText = val;
        else if (chatStage === 2) tempAnswers.work = parseFloat(val);
        else if (chatStage === 3) tempAnswers.sleep = parseFloat(val);
        else if (chatStage === 4) tempAnswers.health = parseInt(val);
        else if (chatStage === 5) tempAnswers.badHabits = val === 'yes';

        chatStage++;
        setTimeout(runChatFlow, 800);
    }

    async function calculateDailyOutcome() {
        const { work, sleep, health, badHabits } = tempAnswers;
        let pScore = 50;
        let msg = "";

        try {
            const prompt = `You are the user's future self from 2030, an extremely successful ${state.goal || 'Elite Professional'}. 
The user is reporting their daily habits:
- Deep Work today: ${work} hours
- Sleep last night: ${sleep} hours
- Health metrics (0=Terrible, 50=Average, 100=Great): ${health}
- Waste time on bad habits today?: ${badHabits ? 'Yes' : 'No'}

Carefully evaluate these inputs contextually. Generate a JSON object with strictly these two fields:
{
  "score": <a number from 0 to 100 representing how well they executed today>,
  "msg": "<a concise, impactful, boutique-tech styled message to the user analyzing their day. Be completely honest, harsh if they failed, encouraging if they succeeded. Max 3 sentences. use markdown formatting like **bold** if needed>"
}
Ensure output is pure JSON.`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.7 }
                })
            });
            const data = await response.json();
            
            if(data.error) throw new Error(data.error.message);

            const txt = data.candidates[0].content.parts[0].text;
            const cleanTxt = txt.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
            const parsed = JSON.parse(cleanTxt);
            pScore = parsed.score || 50;
            msg = parsed.msg || "System parsed data successfully.";

        } catch (err) {
            console.error("Gemini API Error:", err);
            // Logic Fallback
            pScore += (work - 3) * 5; 
            if(sleep >= 7 && sleep <= 9) pScore += 15; else pScore -= 20;
            if(health === 100) pScore += 20; else if(health === 0) pScore -= 20;
            if(badHabits) pScore -= 30; else pScore += 20;
            pScore = Math.max(0, Math.min(100, Math.round(pScore)));
            
            if(pScore >= 80) msg = `🔥 **${pScore}% alignment!** I am so proud of us. If you keep this up, we are 100% going to achieve our goal.`;
            else if(pScore >= 50) msg = `👍 **${pScore}% alignment.** We did okay today, but we need to push harder. Average effort yields average results.`;
            else msg = `⚠️ **${pScore}% alignment.** Please wake up! We are failing. Fix this tomorrow!`;
            
            msg += " [API DOWN: FALLBACK INITIATED]";
        }

        addMessage('ai', msg);
        addMessage('ai', "I've logged this report in your Data Core. You can also take the **Alignment Diagnostic** to check our current protocols.");
        
        // Update state
        const today = new Date().toDateString();
        if (state.lastLogDate !== today) {
            if (state.lastLogDate === new Date(Date.now() - 86400000).toDateString()) state.consecutiveDays++;
            else state.consecutiveDays = 1;
            state.lastLogDate = today;
        }

        const report = { date: today, score: pScore, type: "Daily Chat" };
        state.reports.unshift(report);
        if(state.reports.length > 10) state.reports.pop();

        state.consistencyScore = Math.round((state.consistencyScore * 0.8) + (pScore * 0.2));
        
        // Level logic
        state.level = Math.floor(state.consistencyScore / 10) + 1;
        if(state.level < 1) state.level = 1;
        if(state.level > 10) state.level = 10;

        saveState();
        
        chatInputArea.innerHTML = `<button class="border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 w-full bg-transparent px-5 py-3 mt-4 text-sm font-bold uppercase tracking-widest rounded-sm transition-all duration-300 ease-in-out hover:border-black hover:text-black dark:hover:border-white dark:hover:text-white" onclick="location.reload()">Reset Chat</button>`;
    }

    // runChatFlow is now either called automatically (if returning user) or after clicking Get Started.
    
    // --- Profile System ---
    function updateProfileUI() {
        document.getElementById('idName').textContent = "Future You";
        document.getElementById('idGoal').textContent = state.goal ? `Path: ${state.goal}` : "Path: Undefined";
        
        const levelNames = ["Dreamer", "Initiate", "Grinder", "Focused", "Disciplined", "Consistent", "Relentless", "Elite", "Master", "Legend"];
        const currLv = Math.min(state.level, 10);
        document.getElementById('currentLevel').textContent = `Level ${currLv}: ${levelNames[currLv - 1]}`;
        document.getElementById('levelsLeft').textContent = `${10 - currLv} levels to peak`;
        
        const prog = (state.consistencyScore % 10) * 10;
        document.getElementById('levelProgress').style.width = `${prog}%`;

        document.getElementById('streakDays').textContent = state.consecutiveDays;
        document.getElementById('consistencyScore').textContent = `${state.consistencyScore}%`;

        // History
        const hist = document.getElementById('historyList');
        hist.innerHTML = '';
        if(state.reports.length === 0) {
            hist.innerHTML = '<p class="empty-state">No past records found.</p>';
        } else {
            state.reports.forEach(r => {
                let color = r.score >= 80 ? 'var(--accent-success)' : (r.score >= 50 ? 'var(--accent-warning)' : 'var(--accent-danger)');
                hist.innerHTML += `
                    <div class="history-item">
                        <div>
                            <div class="hi-date">${r.date}</div>
                            <div style="font-size:0.8rem; color:var(--text-muted)">${r.type}</div>
                        </div>
                        <div class="hi-score" style="color:${color}">${r.score}%</div>
                    </div>
                `;
            });
        }

        // Badges
        const badgesData = [
            { id: 1, icon: '🔥', name: '3-Day Streak', req: state.consecutiveDays >= 3 },
            { id: 2, icon: '🎯', name: 'High Focus', req: state.consistencyScore >= 70 },
            { id: 3, icon: '🚀', name: 'Level 5+', req: state.level >= 5 },
            { id: 4, icon: '👑', name: 'Perfection', req: state.reports.some(r => r.score >= 95) }
        ];
        const grid = document.getElementById('badgesGrid');
        grid.innerHTML = '';
        badgesData.forEach(b => {
            grid.innerHTML += `
                <div class="badge-item ${b.req ? 'active' : ''}">
                    <div class="badge-icon">${b.icon}</div>
                    <div class="badge-name">${b.name}</div>
                </div>
            `;
        });
    }

    // --- Deep Test Engine ---
    const testIntro = document.getElementById('testIntro');
    const testArea = document.getElementById('testArea');
    const testResult = document.getElementById('testResult');
    const baseQuestions = [
        { q: "When motivation drops, you...", opts: ["Stop working", "Wait for inspiration", "Do a little bit", "Rely on discipline and execute anyway"], correct: 3 },
        { q: "Your digital diet consists mostly of...", opts: ["Educational/Goal content", "A mix", "Entertainment", "Mindless scrolling"], correct: 0 },
        { q: "When encountering a hard problem...", opts: ["Give up quickly", "Ask someone immediately", "Take a break", "Break it down and hunt the solution"], correct: 3 },
        { q: "How do you primarily handle failure?", opts: ["Blame external circumstances", "Give up on the goal", "Rationalize it and move on", "Systematically analyze and learn from it"], correct: 3 },
        { q: "When planning your life, your timeframe is usually:", opts: ["Days", "Weeks", "Months", "Years/Decades"], correct: 3 },
        { q: "How often do you intentionally measure your objective progress?", opts: ["Never", "Rarely", "Occasionally", "Daily/Weekly rituals"], correct: 3 },
        { q: "Your approach to sleep and recovery is:", opts: ["Ignore it, grind 24/7", "Sleep randomly", "Inconsistent", "Strict schedule for maximum cognitive output"], correct: 3 },
        { q: "When dealing with immediate distractions (notifications)...", opts: ["Respond instantly", "Check them often", "Ignore them mostly", "Phone is on DND during deep work blocks"], correct: 3 },
        { q: "How do you view discomfort or friction?", opts: ["Avoid it at all costs", "Tolerate it if necessary", "Only do it if forced", "Actively seek it as a signal for growth"], correct: 3 },
        { q: "If you achieve a small milestone, you...", opts: ["Celebrate by stopping work", "Feel satisfied and relax", "Post about it and rest", "Acknowledge it and push the standard higher"], correct: 3 }
    ];
    let qIdx = 0;
    let tScore = 0;
    let activeQuestions = [];

    document.getElementById('startTestBtn').addEventListener('click', () => {
        testIntro.classList.add('hidden');
        testArea.classList.remove('hidden');
        
        let dynamicQ = null;
        const gl = (state.goal || '').toLowerCase();
        if (gl.includes("dev") || gl.includes("soft") || gl.includes("web") || gl.includes("code")) {
            dynamicQ = { q: `As an aspiring Developer, how do you handle your core tech skills (like full-stack/front-end)?`, opts: ["I just watch tutorials without coding", "I code very rarely", "I code occasionally when I feel like it", "I build projects/push code daily"], correct: 3 };
        } else if (gl.includes("business") || gl.includes("founder") || gl.includes("startup")) {
            dynamicQ = { q: `As a future Founder, how much action are you taking on your business?`, opts: ["Mostly daydreaming about ideas", "Planning but zero execution", "Building things but never launching", "Launching fast and talking to users daily"], correct: 3 };
        } else if (state.goal) {
            dynamicQ = { q: `Regarding your goal to become a ${state.goal}, how much action are you taking?`, opts: ["Doing nothing", "Thinking about it sometimes", "Taking occasional action", "Fiercely executing the core skills daily"], correct: 3 };
        }
        
        activeQuestions = [...baseQuestions];
        if(dynamicQ) activeQuestions.unshift(dynamicQ); // add dynamic question to the front
        
        renderTest();
    });

    function renderTest() {
        if(qIdx >= activeQuestions.length) return finishTest();
        const qData = activeQuestions[qIdx];
        
        let optsHtml = '';
        qData.opts.forEach((opt, i) => {
            optsHtml += `
                <label class="q-option">
                    <input type="radio" name="qt" value="${i}">
                    <span>${opt}</span>
                </label>
            `;
        });

        testArea.innerHTML = `
            <div class="q-box">
                <div style="font-size:0.85rem; color:var(--brand-primary); margin-bottom:10px; font-weight:700;">Question ${qIdx+1}/${activeQuestions.length}</div>
                <div class="q-title">${qData.q}</div>
                <div class="q-options">${optsHtml}</div>
            </div>
            <button class="primary-btn" id="nextTestBtn">Next</button>
        `;

        const radios = testArea.querySelectorAll('input[type="radio"]');
        radios.forEach(r => r.addEventListener('change', (e) => {
            testArea.querySelectorAll('.q-option').forEach(l => l.classList.remove('selected'));
            e.target.parentElement.classList.add('selected');
        }));

        document.getElementById('nextTestBtn').addEventListener('click', () => {
            const sel = testArea.querySelector('input[type="radio"]:checked');
            if(!sel) return alert("Select an option");
            if(parseInt(sel.value) === qData.correct) tScore += 100 / activeQuestions.length;
            qIdx++;
            renderTest();
        });
    }

    function finishTest() {
        testArea.classList.add('hidden');
        testResult.classList.remove('hidden');
        
        let fScore = Math.round(tScore);
        state.consistencyScore = Math.round((state.consistencyScore + fScore) / 2); // merge score
        
        const report = { date: new Date().toDateString(), score: fScore, type: "Deep Alignment Test" };
        state.reports.unshift(report);
        saveState();

        let msg = fScore >= 80 ? "Excellent alignment. You have the mindset of a winner." : "Your mindset needs recalibration. You rely too much on comfort.";

        testResult.innerHTML = `
            <div style="text-align:center; padding: 40px 0;">
                <div style="font-size: 4rem; font-family:var(--font-heading); color: var(--brand-primary); font-weight:800;">${fScore}%</div>
                <h3 style="margin-bottom: 20px;">Alignment Score</h3>
                <p style="color:var(--text-muted); line-height:1.6; margin-bottom: 30px;">${msg}</p>
                <div style="background:var(--bg-main); padding: 20px; border-radius:10px; font-size:0.9rem;">
                    <strong>AI Suggestion:</strong> Eliminate cheap dopamine sources immediately. Build a system where work is the default state.
                </div>
                <button class="primary-btn" style="margin-top:30px;" onclick="location.reload()">Done</button>
            </div>
        `;
    }
});
