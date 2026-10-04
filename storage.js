/**
 * Storage Manager for Kannada Worksheet Generator
 * Handles local persistence of custom words, custom stories, and saved worksheets via localStorage.
 */

const STORAGE_KEYS = {
    CUSTOM_WORDS: 'kannada_ws_custom_words',
    CUSTOM_STORIES: 'kannada_ws_custom_stories',
    SAVED_WORKSHEETS: 'kannada_ws_saved_templates'
};

const StorageManager = {
    // --- CUSTOM WORDS PERSISTENCE ---
    getCustomWords() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_WORDS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Error reading custom words from localStorage", e);
            return [];
        }
    },

    addCustomWord(wordObj) {
        try {
            const words = this.getCustomWords();
            wordObj.id = 'word_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
            wordObj.createdAt = new Date().toISOString();
            words.unshift(wordObj);
            localStorage.setItem(STORAGE_KEYS.CUSTOM_WORDS, JSON.stringify(words));
            return wordObj;
        } catch (e) {
            console.error("Error adding custom word", e);
            return null;
        }
    },

    deleteCustomWord(id) {
        try {
            let words = this.getCustomWords();
            words = words.filter(w => w.id !== id);
            localStorage.setItem(STORAGE_KEYS.CUSTOM_WORDS, JSON.stringify(words));
        } catch (e) {
            console.error("Error deleting custom word", e);
        }
    },

    getCombinedWords(categoryKey) {
        const customWords = this.getCustomWords();
        let predefined = [];

        if (typeof KANNADA_DATASET === 'undefined') {
            console.warn("KANNADA_DATASET is undefined");
            return [];
        }

        switch (categoryKey) {
            case 'words2Letter':
                predefined = (KANNADA_DATASET.words2Letter || []).map(w => (typeof w === 'string' ? { word: w, category: 'words2Letter', difficulty: 'easy' } : w));
                break;
            case 'words3Letter':
                predefined = (KANNADA_DATASET.words3Letter || []).map(w => (typeof w === 'string' ? { word: w, category: 'words3Letter', difficulty: 'easy' } : w));
                break;
            case 'words4Letter':
                predefined = (KANNADA_DATASET.words4Letter || []).map(w => (typeof w === 'string' ? { word: w, category: 'words4Letter', difficulty: 'medium' } : w));
                break;
            case 'wordsSajati':
                predefined = (KANNADA_DATASET.wordsSajati || []).map(w => (typeof w === 'string' ? { word: w, category: 'wordsSajati', difficulty: 'medium' } : w));
                break;
            case 'wordsVijati':
                predefined = (KANNADA_DATASET.wordsVijati || []).map(w => (typeof w === 'string' ? { word: w, category: 'wordsVijati', difficulty: 'medium' } : w));
                break;
            case 'wordsBahu':
                predefined = (KANNADA_DATASET.wordsBahu || []).map(w => {
                    if (typeof w === 'string') {
                        return { word: w, category: 'wordsBahu', difficulty: 'hard' };
                    } else if (w && typeof w === 'object') {
                        return { word: w.word || '', category: 'wordsBahu', difficulty: w.difficulty || 'hard' };
                    }
                    return null;
                }).filter(Boolean);
                break;
            default:
                break;
        }

        const categoryCustom = customWords.filter(w => w && w.category === categoryKey);
        return [...categoryCustom, ...predefined];
    },

    // --- CUSTOM STORIES PERSISTENCE ---
    getCustomStories() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_STORIES);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Error reading custom stories from localStorage", e);
            return [];
        }
    },

    addCustomStory(storyObj) {
        try {
            const stories = this.getCustomStories();
            storyObj.id = 'story_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
            storyObj.createdAt = new Date().toISOString();
            stories.unshift(storyObj);
            localStorage.setItem(STORAGE_KEYS.CUSTOM_STORIES, JSON.stringify(stories));
            return storyObj;
        } catch (e) {
            console.error("Error adding custom story", e);
            return null;
        }
    },

    deleteCustomStory(id) {
        try {
            let stories = this.getCustomStories();
            stories = stories.filter(s => s.id !== id);
            localStorage.setItem(STORAGE_KEYS.CUSTOM_STORIES, JSON.stringify(stories));
        } catch (e) {
            console.error("Error deleting custom story", e);
        }
    },

    getCombinedStories() {
        const customStories = this.getCustomStories();
        const predefined = (typeof KANNADA_DATASET !== 'undefined' && KANNADA_DATASET.stories) ? KANNADA_DATASET.stories : [];
        return [...customStories, ...predefined];
    },

    // --- SAVED WORKSHEETS PERSISTENCE ---
    getSavedWorksheets() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.SAVED_WORKSHEETS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Error reading saved worksheets from localStorage", e);
            return [];
        }
    },

    saveWorksheet(templateObj) {
        try {
            const list = this.getSavedWorksheets();
            if (!templateObj.id) {
                templateObj.id = 'ws_' + Date.now();
            }
            templateObj.createdAt = new Date().toISOString();
            const existingIdx = list.findIndex(w => w.id === templateObj.id);
            if (existingIdx >= 0) {
                list[existingIdx] = templateObj;
            } else {
                list.unshift(templateObj);
            }
            localStorage.setItem(STORAGE_KEYS.SAVED_WORKSHEETS, JSON.stringify(list));
            return templateObj;
        } catch (e) {
            console.error("Error saving worksheet template", e);
            return null;
        }
    },

    deleteWorksheet(id) {
        try {
            let list = this.getSavedWorksheets();
            list = list.filter(w => w.id !== id);
            localStorage.setItem(STORAGE_KEYS.SAVED_WORKSHEETS, JSON.stringify(list));
        } catch (e) {
            console.error("Error deleting worksheet template", e);
        }
    },

    // --- IMPORT / EXPORT DATA ---
    exportBackup() {
        const backup = {
            customWords: this.getCustomWords(),
            customStories: this.getCustomStories(),
            savedWorksheets: this.getSavedWorksheets(),
            exportedAt: new Date().toISOString()
        };
        return JSON.stringify(backup, null, 2);
    },

    importBackup(jsonStr) {
        try {
            const data = JSON.parse(jsonStr);
            if (data.customWords && Array.isArray(data.customWords)) {
                localStorage.setItem(STORAGE_KEYS.CUSTOM_WORDS, JSON.stringify(data.customWords));
            }
            if (data.customStories && Array.isArray(data.customStories)) {
                localStorage.setItem(STORAGE_KEYS.CUSTOM_STORIES, JSON.stringify(data.customStories));
            }
            if (data.savedWorksheets && Array.isArray(data.savedWorksheets)) {
                localStorage.setItem(STORAGE_KEYS.SAVED_WORKSHEETS, JSON.stringify(data.savedWorksheets));
            }
            return true;
        } catch (e) {
            console.error("Failed to import backup JSON", e);
            return false;
        }
    }
};

if (typeof window !== 'undefined') {
    window.StorageManager = StorageManager;
}
if (typeof globalThis !== 'undefined') {
    globalThis.StorageManager = StorageManager;
}

