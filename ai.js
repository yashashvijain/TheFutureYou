document.addEventListener('DOMContentLoaded', () => {

    let currentQuestions = [];
    let userAnswers = [];
    let currentCareer = '';

    const aiSetup = document.getElementById('ai-test-setup');
    const targetCareerInput = document.getElementById('targetCareer');
    const generateTestBtn = document.getElementById('generateTestBtn');
    
    const loadingSection = document.getElementById('ai-loading');
    const quizInterface = document.getElementById('quiz-interface');
    const quizResults = document.getElementById('quiz-results');

    generateTestBtn.addEventListener('click', () => {
        currentCareer = targetCareerInput.value.trim().toUpperCase();
        if (!currentCareer) return;

        aiSetup.classList.add('hidden');
        loadingSection.classList.remove('hidden');
        quizInterface.classList.add('hidden');
        quizResults.classList.add('hidden');

        setTimeout(() => {
            generateSimulatedQuestions(currentCareer);
        }, 1200);
    });

    function generateSimulatedQuestions(career) {
        const questionBank = [
            {
                q: `QUANTIFY WEEKLY HOURLY OUTPUT DIRECTED AT MASTERING ${career} FRAMEWORKS.`,
                options: [
                    "00-02 HRS: OBSERVATIONAL PHASE (PASSIVE)",
                    "03-05 HRS: LOW PRIORITY (IRREGULAR)",
                    "10-20 HRS: STANDARD ADOPTION (ACTIVE)",
                    "30+ HRS: PRIMARY OBLIGATION (CRITICAL)"
                ],
                correctIndex: 3
            },
            {
                q: `CLASSIFY RESPONSE PROTOCOL WHEN ENCOUNTERING SEVERE TECHNICAL IMPEDANCE:`,
                options: [
                    "ABORT PROCESS. INITIATE DISTRACTION LOOP.",
                    "DELEGATE: SECURE SOLUTION FROM EXTERNAL ENTITY.",
                    "PIVOT: REDIRECT FOCUS TO LOW-FRICTION TASKS.",
                    "DEBUG: FRACTURE PROBLEM INTO MICRO-LOGIC. HUNT ROOT CAUSE."
                ],
                correctIndex: 3
            },
            {
                q: `EVALUATE METHODOLOGY FOR ANALYZING TOP 1% ${career} PERFORMERS:`,
                options: [
                    "SYSTEMATIC REVERSE-ENGINEERING OF DAILY HABITS & FAILURES.",
                    "NULL DATA. ASSUME INTRINSIC CAPABILITY SURPASSES REQUIRED LOGIC.",
                    "CONSUME LIFESTYLE MEDIA. FIXATE ON CAPITAL ACCUMULATION.",
                    "RATIONALIZE THEIR SUCCESS AS A STATISTICAL ANOMALY (LUCK)."
                ],
                correctIndex: 0
            },
            {
                q: `DEFINE CONSISTENCY PROTOCOL WHEN MOTIVATION DROPS BELOW OPERATIONAL THRESHOLD:`,
                options: [
                    "STANDBY SYSTEM. WAIT FOR EXTERNAL EMOTIONAL STIMULATION.",
                    "SELECTIVE EXECUTION: PERFORM ONLY HIGH-DOPAMINE TASKS.",
                    "DISCIPLINED EXECUTION: IGNORE EMOTIONAL STATE. FORGE AHEAD.",
                    "INITIATE RECALIBRATION: CONSIDER DOWNGRADING GOAL PARAMETERS."
                ],
                correctIndex: 2
            },
            {
                q: `AUDIT DIGITAL CONSUMPTION. % ALIGNED WITH ${career} OPTIMIZATION?`,
                options: [
                    "100% ALIGNMENT. ALGORITHM CURATED FOR ELITE EDUCATION.",
                    "50% ALIGNMENT. COGNITIVE COMPROMISE ACHIEVED.",
                    "05% ALIGNMENT. DIGITAL SPACE USED FOR ESCAPISM.",
                    "00% ALIGNMENT. FEED SATURATED WITH NEURAL JUNK."
                ],
                correctIndex: 0
            }
        ];

        currentQuestions = questionBank;
        userAnswers = new Array(currentQuestions.length).fill(null);
        loadingSection.classList.add('hidden');
        renderQuiz();
    }

    function evaluateTest() {
        let correctCount = 0;
        userAnswers.forEach((ans, index) => {
            if (ans?.type === 'choice' && ans?.index === currentQuestions[index].correctIndex) correctCount++;
            else if (ans?.type === 'custom' && ans?.text.trim() !== '') correctCount += 0.5;
        });

        const percentage = Math.round((correctCount / currentQuestions.length) * 100);

        quizInterface.classList.add('hidden');
        loadingSection.classList.remove('hidden');

        setTimeout(() => {
            let suggestion = "";
            let status = 'NOMINAL';
            
            if (percentage === 100) {
                status = 'ALPHA_PROTOCOL';
                suggestion = `TRAJECTORY VERIFIED. MINDSET ALIGNED FOR TOP 1% OF ${currentCareer}. MAINTAIN VELOCITY AND INITIATE PUBLIC PROOF OF WORK. DATA SHOWS SUCCESS IMMINENT.`;
            } else if (percentage >= 80) {
                status = 'BETA_STABLE';
                suggestion = `STRUCTURAL SOUNDNESS DETECTED. HOWEVER, MICRO-INEFFICIENCIES REMAIN IN DAILY LOOP. PURGE REMAINING DISTRACTION VECTORS TO UPGRADE TO ALPHA PARAMETERS.`;
            } else if (percentage >= 50) {
                status = 'WARNING_MEDIAN';
                suggestion = `DATA INDICATES HIGH PROBABILITY OF MEDIOCRITY. THE SYSTEM LACKS OBSESSIVE INTENSITY REQUIRED FOR ${currentCareer}. DRASTIC INCREASE IN DAILY ACTIVE HOURS REQUIRED.`;
            } else {
                status = 'CRASH_IMMINENT';
                suggestion = `FATAL ERROR: CURRENT PROTOCOLS INCAPABLE OF PRODUCING A ${currentCareer}. SHORT-TERM COMFORT IS OVERRIDING LONG-TERM ARCHITECTURE. INITIATE HARD RESET IMMEDIATELY.`;
            }

            renderEvaluation(percentage, suggestion, status);
        }, 1200);
    }

    let currentQuestionIndex = 0;

    function renderQuiz() {
        quizInterface.classList.remove('hidden');
        currentQuestionIndex = 0;
        showQuestion(currentQuestionIndex);
    }

    function showQuestion(index) {
        const q = currentQuestions[index];
        
        let optionsHtml = '';
        q.options.forEach((opt, idx) => {
            const isSelected = userAnswers[index]?.type === 'choice' && userAnswers[index]?.index === idx ? 'checked' : '';
            const selectedClass = isSelected ? 'selected' : '';
            optionsHtml += `
                <label class="term-radio ${selectedClass}">
                    <input type="radio" name="q${index}" value="${idx}" ${isSelected}>
                    <span>[${idx}] ${opt}</span>
                </label>`;
        });

        const customValue = userAnswers[index]?.type === 'custom' ? userAnswers[index]?.text : '';
        const isCustomSelected = userAnswers[index]?.type === 'custom' ? 'checked' : '';
        const customSelectedClass = isCustomSelected ? 'selected' : '';

        optionsHtml += `
            <label class="term-radio ${customSelectedClass}">
                <input type="radio" name="q${index}" value="custom" ${isCustomSelected}>
                <span>[X] OVERRIDE: </span>
                <input type="text" class="custom-answer-input" placeholder="_MANUAL_ENTRY" value="${customValue}" onclick="document.querySelector('input[name=\\'q${index}\\'][value=\\'custom\\']').checked = true; this.parentElement.classList.add('selected');">
            </label>
        `;

        quizInterface.innerHTML = `
            <div class="mono-text" style="color:var(--accent-green); margin-bottom:15px; font-size: 0.75rem;">
                // INQUIRY ${index + 1}/${currentQuestions.length} SECURED
            </div>
            <div class="question-box">
                <div class="q-target">TARGET: ${currentCareer}</div>
                <div class="q-text mono-text">> ${q.q}</div>
                <div class="term-radio-grid">
                    ${optionsHtml}
                </div>
            </div>
            <div class="nav-controls">
                <button id="prevBtn" class="btn-sm" ${index === 0 ? 'disabled' : ''}>< PREV_DATA</button>
                ${index === currentQuestions.length - 1 
                    ? `<button id="submitTestBtn" class="btn-sm" style="color:var(--accent-green)">EXECUTE_COMPILE ></button>`
                    : `<button id="nextBtn" class="btn-sm" style="color:var(--text-primary)">NEXT_DATA ></button>`
                }
            </div>
        `;

        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                document.querySelectorAll('.term-radio').forEach(b => b.classList.remove('selected'));
                e.target.closest('.term-radio').classList.add('selected');
                
                if (e.target.value === 'custom') {
                    const txt = e.target.parentElement.querySelector('.custom-answer-input').value;
                    userAnswers[index] = { type: 'custom', text: txt };
                } else {
                    userAnswers[index] = { type: 'choice', index: parseInt(e.target.value) };
                }
            });
        });

        const customInputBox = document.querySelector('.custom-answer-input');
        if (customInputBox) {
            customInputBox.addEventListener('input', (e) => {
                document.querySelector(`input[name="q${index}"][value="custom"]`).checked = true;
                document.querySelectorAll('.term-radio').forEach(b => b.classList.remove('selected'));
                e.target.closest('.term-radio').classList.add('selected');
                userAnswers[index] = { type: 'custom', text: e.target.value };
            });
        }

        if (document.getElementById('prevBtn')) {
            document.getElementById('prevBtn').addEventListener('click', () => { if (currentQuestionIndex > 0) showQuestion(--currentQuestionIndex); });
        }
        if (document.getElementById('nextBtn')) {
            document.getElementById('nextBtn').addEventListener('click', () => { if (userAnswers[index] !== null) showQuestion(++currentQuestionIndex); else alert('REQUIRE INPUT PARAMETER.'); });
        }
        if (document.getElementById('submitTestBtn')) {
            document.getElementById('submitTestBtn').addEventListener('click', () => { if (userAnswers[index] !== null) evaluateTest(); else alert('REQUIRE INPUT PARAMETER.'); });
        }
    }

    function renderEvaluation(percentage, suggestion, status) {
        loadingSection.classList.add('hidden');
        quizResults.classList.remove('hidden');

        let color = 'var(--text-primary)';
        if (percentage < 50) color = 'var(--accent-amber)';
        else if (percentage >= 80) color = 'var(--accent-green)';

        quizResults.innerHTML = `
            <div class="question-box" style="margin-top:20px; text-align:center;">
                <div class="q-target">ASSESSMENT_COMPILED</div>
                <div class="mono-text" style="font-size: 4rem; color:${color}; margin: 20px 0;">${percentage}%</div>
                <div class="mono-text">SYSTEM_CLASSIFICATION: <span style="color:${color}">${status}</span></div>
            </div>

            <div class="log-container" style="margin-bottom:20px;">
                <div class="log-item" style="border-left-color:${color};"><i class="fa-solid fa-terminal" style="color:${color};"></i> <span>[REPORT]: ${suggestion}</span></div>
            </div>
            
            <div class="nav-controls" style="justify-content: flex-end; gap:10px;">
                <button class="btn-sm" onclick="window.print()" style="color:var(--text-primary)">[CMD: EXPORT_LOG]</button>
                <button class="btn-sm" onclick="location.reload()" style="color:var(--accent-green)">[CMD: HARD_REBOOT]</button>
            </div>
        `;
    }

});
