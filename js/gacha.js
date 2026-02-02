/**
 * Gacha.js
 * Logic for the Element Gacha system.
 */
import { ELEMENTS, RARITY_WEIGHTS } from './data/elements.js';
import { StorageService } from './services/storage-service.js';

export const Gacha = {
    executeGacha: () => {
        // Randomly select rarity
        const rarity = Gacha.selectRarity();
        // Filter elements
        const pool = ELEMENTS.filter(e => e.rarity === rarity);

        if (pool.length === 0) {
            // Fallback if no elements of that rarity exist (shouldn't happen with full DB)
            return { success: false, message: 'No elements found.' };
        }

        const element = pool[Math.floor(Math.random() * pool.length)];

        // Save to Storage
        const isNew = StorageService.collectElement(element.number);

        return {
            success: true,
            element: element,
            isNew: isNew,
            newTitles: [] // Placeholder for future expansion
        };
    },

    selectRarity: () => {
        const rand = Math.random() * 100;
        let cumulative = 0;

        if (rand < (cumulative += RARITY_WEIGHTS.common)) return 'common';
        if (rand < (cumulative += RARITY_WEIGHTS.rare)) return 'rare';
        if (rand < (cumulative += RARITY_WEIGHTS.epic)) return 'epic';
        return 'legendary';
    }
};
