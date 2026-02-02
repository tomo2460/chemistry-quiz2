/**
 * GameState.js
 * Manages the global state of the application.
 */
export const GameState = {
    // Quiz Config
    targetQuestionCount: 20,
    questions: [],
    currentQuestionIndex: 0,

    // Retry Logic
    retryQueue: [],
    isRetryMode: false,

    // Session Stats
    correctCount: 0,
    startTime: null,
    endTime: null,
    currentRunStreak: 0,
    maxStreak: 0,
    retriesPerQuestion: {},

    // Selection Mode
    selectedQuestionIds: [],
    isSelectionMode: false,

    // User Persistent Progress (Loaded from Storage)
    userProgress: {
        unlockedTitles: [],
        completedQuestionIds: [],
        playHistory: {
            totalPlays: 0
        }
    },

    resetSessionState() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.retryQueue = [];
        this.isRetryMode = false;
        this.correctCount = 0;
        this.startTime = null;
        this.endTime = null;
        this.currentRunStreak = 0;
        this.maxStreak = 0;
        this.retriesPerQuestion = {};

        // Don't reset selectedQuestionIds here if we want to support retry, 
        // but typically a "Session Reset" might imply clearing everything.
        // For now, let's keep selection mode separate.
    }
};
