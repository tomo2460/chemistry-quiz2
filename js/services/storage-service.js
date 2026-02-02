/**
 * StorageService.js
 * Handles all interactions with localStorage.
 */
import { ELEMENTS } from '../data/elements.js';

const STORAGE_KEY = 'chemistryApp_v1';
const COLLECTION_KEY = 'chemistryApp_collection'; // Separate key for collection if needed? 
// No, previously it seemed mixed or separate. Let's check storage.js behavior.
// Original storage.js used 'chemistryApp_collection' for elements and 'chemistryApp_v1' for titles/progress.
// We will unify or keep compatible.

const ELEMENT_COLLECTION_KEY = 'chemistryApp_collection';

export const StorageService = {
    // --- User Progress (Titles, Completion, History) ---
    loadProgress() {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    },

    saveProgress(progressData) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progressData));
    },

    // --- Element Collection (Gacha) ---
    getCollectedElements() {
        const stored = localStorage.getItem(ELEMENT_COLLECTION_KEY);
        return stored ? JSON.parse(stored) : []; // Returns array of numbers
    },

    collectElement(atomicNumber) {
        const collected = this.getCollectedElements();
        // Ensure numbers
        const num = Number(atomicNumber);
        if (!collected.includes(num)) {
            collected.push(num);
            localStorage.setItem(ELEMENT_COLLECTION_KEY, JSON.stringify(collected));
            return true; // New collection
        }
        return false; // Already collected
    },

    markElementsAsViewed() {
        // Implementation for "New" badge clearing if we had it
        // Currently just a placeholder to match original logic
        const collected = this.getCollectedElements();
        localStorage.setItem(ELEMENT_COLLECTION_KEY, JSON.stringify(collected));
    },

    getCollectionProgress() {
        const collected = this.getCollectedElements();
        const total = 118; // Fixed for standard periodic table
        return {
            collected: collected.length,
            total: total,
            percentage: Math.floor((collected.length / total) * 100)
        };
    },

    // Debug/Dev tools
    resetAll() {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(ELEMENT_COLLECTION_KEY);
    }
};
