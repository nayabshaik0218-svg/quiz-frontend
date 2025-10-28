(async () => {
    document.addEventListener("DOMContentLoaded", () => {
        const refs = {
            startBtn: document.getElementById("startBtn"),
            durationInput: document.getElementById("duration"),
            perQuestionInput: document.getElementById("perQuestion"),
            randomizeCheckbox: document.getElementById("randomize"),
            questionText: document.getElementById("questionText"),
            choicesContainer: document.getElementById("choices"),
            progressBar: document.getElementById("progress"),
            progressText: document.getElementById("progressText"),
            timerEl: document.getElementById("timer"),
            qTimerEl: document.getElementById("qTimer"),
            resultSummary: document.getElementById("resultSummary"),
            scoreBreakdown: document.getElementById("scoreBreakdown"),
            reviewList: document.getElementById("reviewList"),
            nextBtn: document.getElementById("nextBtn"),
            prevBtn: document.getElementById("prevBtn"),
            submitBtn: document.getElementById("submitBtn"),
            retryBtn: document.getElementById("retryBtn"),
            homeBtn: document.getElementById("homeBtn"),
            qCountEl: document.getElementById("q-count"),
            sections: {
                home: document.getElementById("home"),
                quiz: document.getElementById("quiz"),
                result: document.getElementById("result")
            }
        };

        let questions = [];
        let order = [];
        let currentIndex = 0;
        let userAnswers = [];
        let quizStarted = false;
        let submitted = false;
        let globalTimer = null;
        let perQTimer = null;
        let globalTimeLeft = 0;
        let perQuestionTimeLeft = 0;

        async function fetchQuestions() {
            try {
                // Ensure the URL matches your backend Vercel deployment
                // --- CORRECTED line in script.js ---
const response = await fetch("https://quiz-backend-git-main-nayabshaik0218-svgs-projects.vercel.app/api/questions", {
    // ⚠️ THIS IS THE CRITICAL ADDITION ⚠️
    credentials: 'include' 
});
                if (!response.ok) throw new Error("Failed to fetch questions");
                
                // Note: If your backend sends an array directly, you don't need .data, 
                // but based on your curl response, it was an array inside a data property, 
                // so ensure you adjust this line based on what the server actually sends.
                questions = await response.json(); 
                
                refs.qCountEl.textContent = questions.length;
            } catch (error) {
                console.error(error);
                alert("Error loading questions from server. Using fallback.");
                questions = [
                    {
                        topic: "Math",
                        question: "What is 2 + 2?",
                        choices: ["3", "4", "5", "6"],
                        answer: "4",
                    },
                    {
                        topic: "Science",
                        question: "Water's chemical formula?",
                        choices: ["H2O", "CO2", "O2", "H2"],
                        answer: "H2O",
                    },
                ];
                refs.qCountEl.textContent = questions.length;
            }
        }

        const shuffleArray = (arr) => {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        };

        const formatTime = (seconds) => {
            const m = Math.floor(seconds / 60)
                .toString()
                .padStart(2, "0");
            const s = (seconds % 60).toString().padStart(2, "0");
            return `${m}:${s}`;
        };

        function startGlobalTimer() {
            globalTimeLeft = parseInt(refs.durationInput.value, 10) * 60;
            updateGlobalTimer();
            clearInterval(globalTimer);
            globalTimer = setInterval(() => {
                if (globalTimeLeft <= 0) {
                    clearInterval(globalTimer);
                    finishQuiz();
                    return;
                }
                globalTimeLeft--;
                updateGlobalTimer();
            }, 1000);
        }

        function updateGlobalTimer() {
            refs.timerEl.textContent = formatTime(globalTimeLeft);
        }

        function startPerQTimer() {
            perQuestionTimeLeft = parseInt(refs.perQuestionInput.value, 10);
            updatePerQTimer();
            clearInterval(perQTimer);
            perQTimer = setInterval(() => {
                if (perQuestionTimeLeft <= 0) {
                    clearInterval(perQTimer);
                    nextQuestion();
                    return;
                }
                perQuestionTimeLeft--;
                updatePerQTimer();
            }, 1000);
        }

        function updatePerQTimer() {
            refs.qTimerEl.textContent = formatTime(perQuestionTimeLeft);
            if (perQuestionTimeLeft <= 10) {
                refs.qTimerEl.classList.add("timer-warning");
            } else {
                refs.qTimerEl.classList.remove("timer-warning");
            }
        }

        function stopTimers() {
            clearInterval(globalTimer);
            clearInterval(perQTimer);
        }

        function showSection(name) {
            for (const secName in refs.sections) {
                refs.sections[secName].classList.toggle("hidden", secName !== name);
            }
        }

        function updateProgress() {
            refs.progressBar.max = order.length;
            refs.progressBar.value = currentIndex + 1;
            refs.progressText.textContent = `${currentIndex + 1} / ${order.length}`;
        }

        function renderQuestion() {
            stopPerQTimer();
            startPerQTimer();

            const qIdx = order[currentIndex];
            const q = questions[qIdx];
            const curAnswer = userAnswers[qIdx] ?? null;

            // Fade out current question and choices for smooth transition
            refs.questionText.classList.add("fade-out");
            refs.choicesContainer.classList.add("fade-out");

            // This setTimeout MUST use a function, which it already does, but 
            // rewriting it ensures maximum compatibility.
            setTimeout(() => {
                refs.questionText.textContent = `${currentIndex + 1}. (${q.topic}) ${q.question}`;
                refs.choicesContainer.innerHTML = "";

                q.choices.forEach((choice, i) => {
                    const div = document.createElement("div");
                    div.className = `choice topic-${q.topic}`;
                    if (choice === curAnswer) div.classList.add("selected");
                    div.setAttribute("role", "radio");
                    div.setAttribute("tabindex", "0");
                    div.setAttribute("aria-checked", choice === curAnswer ? "true" : "false");
                    div.innerHTML = `<strong>${i + 1}.</strong> ${choice}`;

                    div.onclick = () => {
                        userAnswers[qIdx] = choice;
                        renderQuestion();
                    };
                    div.onkeydown = (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            userAnswers[qIdx] = choice;
                            renderQuestion();
                        } else if (e.key === "ArrowDown") {
                            e.preventDefault();
                            const next = div.nextElementSibling || refs.choicesContainer.firstChild;
                            if (next) next.focus();
                        } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            const prev = div.previousElementSibling || refs.choicesContainer.lastChild;
                            if (prev) prev.focus();
                        }
                    };

                    refs.choicesContainer.appendChild(div);
                });

                // Fade in new question and choices
                refs.questionText.classList.remove("fade-out");
                refs.questionText.classList.add("fade-in");
                refs.choicesContainer.classList.remove("fade-out");
                refs.choicesContainer.classList.add("fade-in");

                updateProgress();
            }, 300);
        }

        function stopPerQTimer() {
            clearInterval(perQTimer);
        }

        async function finishQuiz() {
            const answeredCount = userAnswers.filter((a) => a !== null && a !== undefined).length;
            if (answeredCount < order.length) {
                const confirmSubmit = confirm(`You've answered ${answeredCount}/${order.length} questions. Submit anyway?`);
                if (!confirmSubmit) return;
            }
            stopTimers();
            submitted = true;
            showResults();
        }

        function showResults() {
            let score = 0;
            const breakdown = {};

            order.forEach((qIdx) => {
                const q = questions[qIdx];
                const correct = userAnswers[qIdx] === q.answer;
                if (correct) score++;
                const topic = q.topic || "General";

                if (!breakdown[topic]) breakdown[topic] = { correct: 0, total: 0 };
                breakdown[topic].total++;
                if (correct) breakdown[topic].correct++;
            });

            const percent = Math.round((score / order.length) * 100);
            const badgeClass = percent >= 80 ? "good" : percent >= 50 ? "ok" : "bad";

            refs.resultSummary.innerHTML = `
                Quiz Completed!<br>
                Your Score: <span class="score-badge ${badgeClass}">${score} / ${order.length} (${percent}%)</span>
            `;

            refs.scoreBreakdown.innerHTML = Object.entries(breakdown)
                .map(([topic, data]) => {
                    const p = Math.round((data.correct / data.total) * 100);
                    const cls = p >= 80 ? "good" : p >= 50 ? "ok" : "bad";
                    return `<div style="flex:1"><strong>${topic}:</strong> <span class="score-badge ${cls}">${data.correct}/${data.total}</span></div>`;
                })
                .join("");

            refs.reviewList.innerHTML = order
                .map((qIdx, idx) => {
                    const q = questions[qIdx];
                    const correct = userAnswers[qIdx] === q.answer;
                    return `
                    <div class="review-item">
                        <p><strong>Question ${idx + 1}:</strong> ${q.question}</p>
                        <p>Your Answer: <span class="${correct ? "correct" : "incorrect"}">${userAnswers[qIdx] ?? "Not Answered"}</span>
                        ${correct ? "" : `<span class="correct"> (Correct: ${q.answer})</span>`}</p>
                    </div>
                `;
                })
                .join("");

            showSection("result");
        }

        function resetQuiz() {
            const totalQ = Math.min(parseInt(refs.durationInput.value, 10), questions.length);
            userAnswers = new Array(questions.length).fill(null);
            currentIndex = 0;
            submitted = false;
            quizStarted = false;

            refs.qCountEl.textContent = questions.length;

            order = Array.from({ length: questions.length }, (_, i) => i);
            if (refs.randomizeCheckbox.checked) shuffleArray(order);
            order = order.slice(0, totalQ);

            refs.timerEl.textContent = formatTime(totalQ * parseInt(refs.perQuestionInput.value, 10));
            refs.progressText.textContent = `0 / ${totalQ}`;
            refs.progressBar.value = 0;
            refs.progressBar.max = totalQ;
        }

        function nextQuestion() {
            if (currentIndex < order.length - 1) {
                currentIndex++;
                renderQuestion();
            }
        }
        function prevQuestion() {
            if (currentIndex > 0) {
                currentIndex--;
                renderQuestion();
            }
        }

        refs.startBtn.onclick = async () => {
            await fetchQuestions();
            resetQuiz();
            quizStarted = true;
            showSection("quiz");
            startGlobalTimer();
            renderQuestion();
        };

        refs.nextBtn.onclick = nextQuestion;
        refs.prevBtn.onclick = prevQuestion;
        refs.submitBtn.onclick = finishQuiz;
        refs.retryBtn.onclick = () => {
            resetQuiz();
            showSection("home");
        };
        refs.homeBtn.onclick = () => {
            resetQuiz();
            showSection("home");
        };

        showSection("home");
    });
})();
