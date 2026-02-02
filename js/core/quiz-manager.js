/**
 * QuizManager.js
 * Handles quiz logic: shuffling, answering, retry queue.
 */
import { GameState } from './game-state.js';
import { StorageService } from '../services/storage-service.js';

export const QuizManager = {
    // Logic specific to running the quiz

    handleAnswer(selectedIndex, correctIndex, question) {
        const isCorrect = selectedIndex === correctIndex;

        if (!GameState.isRetryMode) {
            // Main Run
            if (isCorrect) {
                GameState.correctCount++;
                GameState.currentRunStreak++;
                if (GameState.currentRunStreak > GameState.maxStreak) {
                    GameState.maxStreak = GameState.currentRunStreak;
                }
            } else {
                GameState.retryQueue.push(question);
                GameState.currentRunStreak = 0;

                if (!GameState.retriesPerQuestion[question.id]) {
                    GameState.retriesPerQuestion[question.id] = 0;
                }
                GameState.retriesPerQuestion[question.id]++;
            }
        } else {
            // Retry Mode
            if (!isCorrect) {
                GameState.retryQueue.push(question);
                if (!GameState.retriesPerQuestion[question.id]) {
                    GameState.retriesPerQuestion[question.id] = 0;
                }
                GameState.retriesPerQuestion[question.id]++;
            }
        }

        // Track Completion
        if (isCorrect) {
            if (!GameState.userProgress.completedQuestionIds) GameState.userProgress.completedQuestionIds = [];
            if (!GameState.userProgress.completedQuestionIds.includes(question.id)) {
                GameState.userProgress.completedQuestionIds.push(question.id);
                // Save progress immediately
                StorageService.saveProgress(GameState.userProgress);
            }
        }

        return isCorrect;
    }
};
