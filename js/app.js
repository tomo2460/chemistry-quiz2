/**
 * App.js
 * Main Controller. Wires up modules and handles event orchestration.
 */
import { GameState } from './core/game-state.js';
import { StorageService } from './services/storage-service.js';
import { UIManager } from './ui/ui-manager.js';
import { QuizManager } from './core/quiz-manager.js';
import { QUESTION_DATA, TITLES } from './data/quiz-data.js';
import { ELEMENTS, CATEGORY_COLORS } from './data/elements.js';
import { Gacha } from './gacha.js';

// Make App global for inline HTML handlers if any (though we try to avoid them)
// For debug, exposing App to window is useful.
const App = {
    init: () => {
        console.log("App.init started");
        UIManager.init();

        const saved = StorageService.loadProgress();
        if (saved) {
            GameState.userProgress = saved;
        }
        App.setupEventListeners();
        UIManager.updateMascot('normal');
        console.log("App initialized successfully");
    },

    setupEventListeners: () => {
        const { buttons } = UIManager.elements; // Need to expose buttons in UIManager or select here

        // Re-selecting for clarity in controller
        document.getElementById('start-10-btn').addEventListener('click', () => App.startQuiz(10));
        document.getElementById('start-20-btn').addEventListener('click', () => App.startQuiz(20));

        document.getElementById('q-list-btn').addEventListener('click', () => App.showQuestionList());
        document.getElementById('q-list-back-btn').addEventListener('click', () => UIManager.switchScreen('title'));
        document.getElementById('start-selected-btn').addEventListener('click', () => App.startSelectedQuiz());

        document.getElementById('select-uncompleted-btn').addEventListener('click', () => App.selectUncompletedQuestions());

        document.getElementById('collection-btn').addEventListener('click', () => App.showCollection());
        document.getElementById('home-btn').addEventListener('click', () => UIManager.switchScreen('title'));
        document.getElementById('retry-btn').addEventListener('click', () => App.retryQuiz()); // New handler logic

        // Quiz Controls
        document.getElementById('next-btn').addEventListener('click', () => App.nextQuestion());
        document.getElementById('back-btn').addEventListener('click', () => UIManager.switchScreen('title'));

        // Gacha & Periodic Table
        document.getElementById('gacha-btn').addEventListener('click', () => App.executeGacha());
        document.getElementById('periodic-table-btn').addEventListener('click', () => App.showPeriodicTable());
        document.getElementById('gacha-close-btn').addEventListener('click', () => App.closeGacha());
        document.getElementById('periodic-back-btn').addEventListener('click', () => UIManager.switchScreen('title'));

        // Options container delegation
        document.getElementById('options-container').addEventListener('click', (e) => {
            if (e.target.classList.contains('option-btn')) {
                const index = parseInt(e.target.dataset.index);
                App.handleAnswer(index);
            }
        });
    },

    startQuiz: (countOrIds) => {
        // Reset Session
        GameState.resetSessionState();
        GameState.startTime = Date.now();

        if (Array.isArray(countOrIds)) {
            // Selection Mode
            GameState.targetQuestionCount = countOrIds.length;
            const pool = QUESTION_DATA.filter(q => countOrIds.includes(q.id));
            GameState.questions = pool.sort(() => 0.5 - Math.random());
            GameState.isSelectionMode = true;
            GameState.selectedQuestionIds = [...countOrIds]; // Preserve
        } else {
            // Normal Mode
            GameState.targetQuestionCount = countOrIds;
            const pool = [...QUESTION_DATA].sort(() => 0.5 - Math.random());
            GameState.questions = pool.slice(0, countOrIds);
            GameState.isSelectionMode = false;
        }

        UIManager.updateMascot('normal');
        UIManager.switchScreen('quiz');
        App.renderCurrentQuestion();
    },

    startSelectedQuiz: () => {
        if (GameState.selectedQuestionIds.length === 0) {
            alert('問題を選択してください');
            return;
        }
        App.startQuiz(GameState.selectedQuestionIds);
    },

    retryQuiz: () => {
        if (GameState.isSelectionMode) {
            App.startQuiz(GameState.selectedQuestionIds);
        } else {
            App.startQuiz(GameState.targetQuestionCount);
        }
    },

    renderCurrentQuestion: () => {
        const q = GameState.questions[GameState.currentQuestionIndex];
        UIManager.renderQuestion(q, GameState.currentQuestionIndex, GameState.questions.length, GameState.isRetryMode);
    },

    handleAnswer: (selectedIndex) => {
        const q = GameState.questions[GameState.currentQuestionIndex];
        const isCorrect = QuizManager.handleAnswer(selectedIndex, q.correctIndex, q);

        // Mascot Logic
        if (!GameState.isRetryMode) {
            if (isCorrect) {
                if (GameState.currentRunStreak >= 3) UIManager.updateMascot('happy');
                else UIManager.updateMascot('normal');
            } else {
                UIManager.updateMascot('normal');
            }
        }

        UIManager.showFeedback(isCorrect, q.explanation);
    },

    nextQuestion: () => {
        GameState.currentQuestionIndex++;
        if (GameState.currentQuestionIndex < GameState.questions.length) {
            App.renderCurrentQuestion();
        } else {
            App.checkRoundEnd();
        }
    },

    checkRoundEnd: () => {
        if (GameState.retryQueue.length > 0) {
            GameState.isRetryMode = true;
            GameState.questions = [...GameState.retryQueue];
            GameState.retryQueue = [];
            GameState.currentQuestionIndex = 0;
            App.renderCurrentQuestion();
        } else {
            App.endQuiz();
        }
    },

    endQuiz: () => {
        GameState.endTime = Date.now();
        const timeSeconds = Math.floor((GameState.endTime - GameState.startTime) / 1000);
        GameState.userProgress.playHistory.totalPlays++;

        UIManager.updateMascot('evolved');

        // Calculate Stats for Title Check
        let totalRetries = 0;
        let maxRetriesPerQuestion = 0;
        Object.values(GameState.retriesPerQuestion).forEach(count => {
            totalRetries += count;
            if (count > maxRetriesPerQuestion) maxRetriesPerQuestion = count;
        });

        const simulationState = {
            playHistory: GameState.userProgress.playHistory,
            currentRun: {
                totalQuestions: GameState.targetQuestionCount,
                firstTryCorrect: GameState.correctCount,
                timeSeconds: timeSeconds,
                retryCount: totalRetries,
                maxStreak: GameState.maxStreak,
                maxRetriesPerQuestion: maxRetriesPerQuestion
            }
        };

        const gainedTitles = [];
        TITLES.forEach(t => {
            if (t.condition && t.condition(simulationState)) {
                if (!GameState.userProgress.unlockedTitles.includes(t.id)) {
                    GameState.userProgress.unlockedTitles.push(t.id);
                    gainedTitles.push(t);
                }
            }
        });

        StorageService.saveProgress(GameState.userProgress);

        // Render Result Screen (Need to move this logic to UIManager ideally, but for now inline)
        const resultScreen = document.getElementById('result-screen');
        document.getElementById('score-val').textContent = `${GameState.correctCount} / ${GameState.targetQuestionCount}`;
        const mins = Math.floor(timeSeconds / 60).toString().padStart(2, '0');
        const secs = (timeSeconds % 60).toString().padStart(2, '0');
        document.getElementById('time-val').textContent = `${mins}:${secs}`;

        const titleContainer = document.getElementById('new-title-container');
        if (gainedTitles.length > 0) {
            titleContainer.classList.remove('hidden');
            document.getElementById('new-title-display').innerHTML = gainedTitles.map(t =>
                `<div><strong style="color:var(--primary-dark)">${t.name}</strong><br><small>${t.desc}</small></div>`
            ).join('<hr style="border:none; border-top:1px dashed #ccc; margin:10px 0;">');
        } else {
            titleContainer.classList.add('hidden');
        }

        // Perfect Bonus
        const gachaBtn = document.getElementById('gacha-btn');
        if (GameState.correctCount === GameState.targetQuestionCount) {
            gachaBtn.classList.remove('hidden');
        } else {
            gachaBtn.classList.add('hidden');
        }

        UIManager.switchScreen('result');
    },

    // --- Question List Logic ---
    showQuestionList: () => {
        const grid = document.getElementById('q-list-grid');
        grid.innerHTML = '';
        GameState.selectedQuestionIds = [];
        App.updateSelectionCount();

        QUESTION_DATA.forEach(q => {
            const isCompleted = GameState.userProgress.completedQuestionIds && GameState.userProgress.completedQuestionIds.includes(q.id);
            const btn = document.createElement('button');
            btn.className = `q-list-item ${isCompleted ? 'completed' : 'uncompleted'}`;
            btn.textContent = q.id;

            btn.onclick = () => {
                btn.classList.toggle('selected');
                if (GameState.selectedQuestionIds.includes(q.id)) {
                    GameState.selectedQuestionIds = GameState.selectedQuestionIds.filter(id => id !== q.id);
                } else {
                    GameState.selectedQuestionIds.push(q.id);
                }
                App.updateSelectionCount();
            };
            grid.appendChild(btn);
        });

        UIManager.switchScreen('questionList');
    },

    updateSelectionCount: () => {
        const countSpan = document.getElementById('q-list-count');
        if (countSpan) countSpan.textContent = `${GameState.selectedQuestionIds.length}問 選択中`;
    },

    selectUncompletedQuestions: () => {
        const items = document.querySelectorAll('.q-list-item');
        GameState.selectedQuestionIds = [];
        items.forEach(btn => {
            if (btn.classList.contains('uncompleted')) {
                btn.classList.add('selected');
                GameState.selectedQuestionIds.push(parseInt(btn.textContent));
            } else {
                btn.classList.remove('selected');
            }
        });
        App.updateSelectionCount();
    },

    // --- Gacha Logic ---
    executeGacha: () => {
        const result = Gacha.executeGacha();
        if (!result.success) {
            alert(result.message);
            return;
        }
        App.showGachaAnimation(result.element, result.newTitles);
    },

    showGachaAnimation: (element, newTitles) => {
        UIManager.switchScreen('gacha');

        // This UI logic should arguably be in UIManager, but keeping here for speed
        const card = document.getElementById('gacha-card');
        card.className = 'gacha-card rarity-' + element.rarity;

        // Set Text
        document.getElementById('gacha-symbol').textContent = element.symbol;
        document.getElementById('gacha-number').textContent = element.number;
        document.getElementById('gacha-name').textContent = element.name;
        document.getElementById('gacha-item').textContent = element.item;
        document.getElementById('gacha-item-name').textContent = element.itemName;
        document.getElementById('gacha-trivia').textContent = element.trivia;

        const cardBack = card.querySelector('.card-back');
        const colorScheme = CATEGORY_COLORS[element.category];
        if (colorScheme) {
            cardBack.style.background = colorScheme.bg;
            cardBack.style.color = colorScheme.text;
        }

        const gachaImage = document.getElementById('gacha-image');
        const textContent = document.getElementById('gacha-text-content');

        if (element.image) {
            gachaImage.src = element.image;
            gachaImage.classList.remove('hidden');
            textContent.classList.add('hidden');
            cardBack.style.background = '#000';
        } else {
            gachaImage.src = '';
            gachaImage.classList.add('hidden');
            textContent.classList.remove('hidden');
        }

        setTimeout(() => card.classList.add('flipped'), 500);
        UIManager.updateMascot('happy');
    },

    closeGacha: () => {
        StorageService.markElementsAsViewed(); // Ensure this method exists or update logic
        UIManager.switchScreen('result');
        UIManager.updateMascot('normal');
        document.getElementById('gacha-btn').classList.add('hidden');
    },

    // --- Collection / Periodic Table ---
    showCollection: () => {
        const grid = document.getElementById('collection-grid');
        grid.innerHTML = '';
        TITLES.forEach(t => {
            const isUnlocked = GameState.userProgress.unlockedTitles.includes(t.id);
            const card = document.createElement('div');
            card.className = `title-card-item ${isUnlocked ? 'unlocked' : 'locked'}`;

            // ... Card DOM Building ...
            card.innerHTML = `
                <div class="card-frame">
                    <img src="${isUnlocked && t.image ? t.image : 'assets/cards/card_locked.png'}" class="card-img">
                </div>
                <div class="card-info">
                    <div class="card-name">${isUnlocked ? t.name : '？？？'}</div>
                    <div class="card-desc">${isUnlocked ? t.desc : '条件未達成'}</div>
                </div>
             `;
            grid.appendChild(card);
        });
        UIManager.switchScreen('collection');
    },

    showPeriodicTable: () => {
        const table = document.getElementById('periodic-table');
        table.innerHTML = '';
        const collected = StorageService.getCollectedElements();
        const collectedSet = new Set(collected);

        const progressSpan = document.getElementById('collection-progress');
        const p = StorageService.getCollectionProgress();
        progressSpan.textContent = `${p.collected}/${p.total} (${p.percentage}%)`;

        const periodicLayout = [
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
            [3, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 6, 7, 8, 9, 10],
            [11, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 14, 15, 16, 17, 18],
            [19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
            [37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54],
            [55, 56, 0, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86],
            [87, 88, 0, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 0],
            [0, 0, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 0]
        ];

        periodicLayout.forEach(row => {
            row.forEach(atomicNumber => {
                const cell = document.createElement('div');
                if (atomicNumber === 0) {
                    cell.className = 'element-cell empty';
                } else {
                    const elData = ELEMENTS.find(e => e.number === atomicNumber);
                    const isUnlocked = collectedSet.has(atomicNumber);

                    cell.className = `element-cell ${isUnlocked ? 'unlocked' : 'locked'}`;
                    if (isUnlocked && elData) cell.classList.add('category-' + elData.category);

                    cell.innerHTML = `
                        <div class="number">${atomicNumber}</div>
                        <div class="symbol">${isUnlocked && elData ? elData.symbol : '?'}</div>
                        <div class="name">${isUnlocked && elData ? elData.name : '???'}</div>
                    `;

                    if (isUnlocked && elData) {
                        cell.onclick = () => App.showElementDetail(elData);
                    }
                }
                table.appendChild(cell);
            });
        });

        UIManager.switchScreen('periodicTable');
    },

    showElementDetail: (element) => {
        // Reuse UIManager logic if moved, or inline
        const modal = document.getElementById('element-detail-modal');
        // ... (Populate modal)
        document.getElementById('detail-name').textContent = `${element.number}. ${element.name} (${element.symbol})`;
        document.getElementById('detail-item-name').textContent = `関連アイテム: ${element.itemName}`;
        document.getElementById('detail-trivia').textContent = element.trivia;

        const img = document.getElementById('detail-image');
        if (element.image) {
            img.src = element.image;
            img.classList.remove('hidden');
        } else {
            img.src = '';
            img.classList.add('hidden');
        }

        modal.classList.remove('hidden');
        const close = () => modal.classList.add('hidden');
        document.getElementById('modal-close-btn').onclick = close;
        modal.onclick = (e) => { if (e.target === modal) close(); };
    }
};

window.addEventListener('DOMContentLoaded', App.init);
// Expose for debug/buttons if needed (though we attached listeners)
window.App = App;
