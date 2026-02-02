/**
 * UIManager.js
 * Handles all DOM manipulations and screen transitions.
 */
import { Visuals } from '../visuals.js';
import { CATEGORY_COLORS } from '../data/elements.js';

export const UIManager = {
    elements: {
        screens: {
            title: document.getElementById('title-screen'),
            quiz: document.getElementById('quiz-screen'),
            result: document.getElementById('result-screen'),
            collection: document.getElementById('collection-screen'),
            questionList: document.getElementById('question-list-screen'),
            gacha: document.getElementById('gacha-screen'),
            periodicTable: document.getElementById('periodic-table-screen')
        },
        quiz: {
            progressText: document.getElementById('progress-text'),
            progressBar: document.getElementById('progress-bar'),
            retryBadge: document.getElementById('retry-badge'),
            questionText: document.getElementById('question-text'),
            visualArea: document.getElementById('visual-area'),
            optionsContainer: document.getElementById('options-container'),
            feedbackOverlay: document.getElementById('feedback-overlay'),
            feedbackIcon: document.getElementById('feedback-icon'),
            feedbackText: document.getElementById('feedback-text'),
            explanationText: document.getElementById('explanation-text')
        },
        mascot: document.getElementById('denshi-kun')
    },

    switchScreen(screenName) {
        Object.values(this.elements.screens).forEach(el => {
            el.classList.remove('active');
            setTimeout(() => {
                // Check if it's still not active (avoid race conditions if switched back fast)
                if (!el.classList.contains('active')) el.classList.add('hidden');
            }, 300);
        });

        const target = this.elements.screens[screenName];
        if (target) {
            target.classList.remove('hidden');
            // Force reflow
            void target.offsetWidth;
            setTimeout(() => {
                target.classList.add('active');
            }, 50);
        }
    },

    updateMascot(state) {
        const m = this.elements.mascot;
        m.classList.remove('normal', 'happy', 'evolved');
        m.classList.add(state);
    },

    renderQuestion(question, currentIndex, total, isRetryMode) {
        const { quiz } = this.elements;

        quiz.feedbackOverlay.classList.add('hidden');
        quiz.visualArea.innerHTML = '';
        quiz.retryBadge.classList.toggle('hidden', !isRetryMode);

        const current = currentIndex + 1;
        quiz.progressText.textContent = isRetryMode
            ? `解き直し: 残り ${total - currentIndex}問`
            : `Q. ${current}/${total}`;

        const pct = (current / total) * 100;
        quiz.progressBar.style.width = isRetryMode ? '100%' : `${pct}%`;
        quiz.progressBar.style.backgroundColor = isRetryMode ? 'var(--secondary)' : 'var(--primary)';

        quiz.questionText.innerHTML = question.text;

        if (question.type === 'visual' && question.diagramType === 'atom_shell') {
            Visuals.renderAtomShell(quiz.visualArea, question.diagramData);
        }

        quiz.optionsContainer.innerHTML = '';
        // Need indices to be handled by controller or passed in? 
        // Logic should decide order.
        // For now, let's assume we shuffle here or receive pre-shuffled options?
        // Original code shuffled INDICES [0,1,2,3] here.
        const indices = [0, 1, 2, 3].sort(() => 0.5 - Math.random());

        indices.forEach(i => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerHTML = question.options[i];
            // We set a data attribute for the controller to read
            btn.dataset.index = i;
            quiz.optionsContainer.appendChild(btn);
        });
    },

    showFeedback(isCorrect, explanation) {
        const { quiz } = this.elements;
        quiz.feedbackIcon.textContent = isCorrect ? '⭕' : '❌';
        quiz.feedbackIcon.className = 'feedback-icon ' + (isCorrect ? 'feedback-correct' : 'feedback-wrong');
        quiz.feedbackText.textContent = isCorrect ? '正解！' : '残念...';
        quiz.explanationText.innerHTML = explanation;
        quiz.feedbackOverlay.classList.remove('hidden');
    },

    // ... Add Gacha, Result, Collection renderers here
    // For brevity, I will implement them as I migrate logic in App.js
};
