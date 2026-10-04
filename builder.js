/**
 * Worksheet Builder State Manager for Kannada Worksheet Generator
 * Controls section configuration, randomization, and overall metadata.
 */

const MODULE_DEFINITIONS = [
    { type: 'swaragalu', title: 'ಸ್ವರಗಳು (Tracing)', icon: '✏️' },
    { type: 'vyanjanagalu', title: 'ವ್ಯಂಜನಗಳು (Tracing)', icon: '🖊️' },
    { type: 'kagunita', title: 'ಗುಣಿತಾಕ್ಷರಗಳು / ಬಳ್ಳಿಗಳು (Kagunita)', icon: '🔤' },
    { type: 'words2Letter', title: '೨ ಅಕ್ಷರದ ಪದಗಳು (2-Letter Words)', icon: '📝' },
    { type: 'words3Letter', title: '೩ ಅಕ್ಷರದ ಪದಗಳು (3-Letter Words)', icon: '📚' },
    { type: 'words4Letter', title: '೪ ಅಕ್ಷರದ ಪದಗಳು (4-Letter Words)', icon: '📖' },
    { type: 'wordsSajati', title: 'ಸಜಾತಿ ಒತ್ತಕ್ಷರ ಪದಗಳು (Sajati Ottakshara)', icon: '🔗' },
    { type: 'wordsVijati', title: 'ವಿಜಾತಿ ಒತ್ತಕ್ಷರ ಪದಗಳು (Vijati Ottakshara)', icon: '⚡' },
    { type: 'wordsBahu', title: 'ಬಹು ಒತ್ತಕ್ಷರ ಪದಗಳು (Complex Ottakshara)', icon: '🧠' },
    { type: 'missingLetters', title: 'ಬಿಟ್ಟು ಹೋದ ಅಕ್ಷರಗಳನ್ನು ಬರೆಯಿರಿ (Missing Letters)', icon: '❓' },
    { type: 'wordFormation', title: 'ಅಕ್ಷರಗಳನ್ನು ಜೋಡಿಸಿ ಶಬ್ದ ರಚಿಸಿ (Word Formation)', icon: '🧩' },
    { type: 'dottedTracing', title: 'ಚುಕ್ಕಿ ಅಕ್ಷರಗಳು (Dotted Letters)', icon: '░' },
    { type: 'twoLineWriting', title: 'ಎರಡು ಗೆರೆಗಳ ಮಧ್ಯೆ ಬರೆಯಿರಿ (2-Line Writing)', icon: '📏' },
    { type: 'storyComprehension', title: 'ಕಥೆ ಓದಿ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ (Story Reading)', icon: '📖' }
];

class WorksheetBuilder {
    constructor() {
        this.settings = {
            schoolName: "SUCCESS SCHOOL, INDI",
            schoolSubtitle: "English Medium",
            worksheetTitle: "ಕನ್ನಡ ಅಭ್ಯಾಸ ಹಾಳೆ (Kannada Practice Worksheet)",
            subject: "ಕನ್ನಡ (Kannada)",
            classGrade: "ಪ್ರಥಮ ತರಗತಿ (Class 1)",
            section: "A",
            studentName: "",
            date: new Date().toISOString().split('T')[0],
            fontSize: "medium", // small, medium, large, extra-large
            tracingStyle: "dotted", // dotted, guide, outline, normal_blank, pure_blank
            lineSpacing: "normal", // compact, normal, spacious
            orientation: "portrait", // portrait, landscape
            showAnswerKey: false,
            showPageNumbers: true,
            colorMode: "bw" // bw, color
        };

        this.sections = [];
        this.initDefaultSections();
    }

    initDefaultSections() {
        // Default starting template: Vowels & 2-Letter Words
        this.addSection('swaragalu', { count: 15 });
        this.addSection('words2Letter', { count: 10 });
    }

    addSection(type, options = {}) {
        const def = MODULE_DEFINITIONS.find(m => m.type === type);
        if (!def) return null;

        const section = {
            id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            type: type,
            title: options.title || def.title,
            count: options.count || 10, // 5, 10, 15, 20, 30, 50
            randomize: options.randomize !== undefined ? options.randomize : true,
            tracingStyle: options.tracingStyle || this.settings.tracingStyle,
            baseLetter: options.baseLetter || 'ಕ', // For Kagunita
            difficultyFilter: options.difficultyFilter || 'all', // For Bahu Ottakshara: all, easy, medium, hard
            storyId: options.storyId || 'story_1' // For Story Comprehension
        };

        this.sections.push(section);
        return section;
    }

    removeSection(id) {
        this.sections = this.sections.filter(s => s.id !== id);
    }

    moveSectionUp(id) {
        const idx = this.sections.findIndex(s => s.id === id);
        if (idx > 0) {
            const temp = this.sections[idx];
            this.sections[idx] = this.sections[idx - 1];
            this.sections[idx - 1] = temp;
        }
    }

    moveSectionDown(id) {
        const idx = this.sections.findIndex(s => s.id === id);
        if (idx >= 0 && idx < this.sections.length - 1) {
            const temp = this.sections[idx];
            this.sections[idx] = this.sections[idx + 1];
            this.sections[idx + 1] = temp;
        }
    }

    updateSection(id, changes) {
        const section = this.sections.find(s => s.id === id);
        if (section) {
            Object.assign(section, changes);
        }
    }

    updateSettings(newSettings) {
        Object.assign(this.settings, newSettings);
    }

    // Pick count items with option for randomization
    getSectionItems(section) {
        let items = [];

        switch (section.type) {
            case 'swaragalu':
                items = [...KANNADA_DATASET.swaragalu];
                break;

            case 'vyanjanagalu':
                items = [...KANNADA_DATASET.vyanjanagalu];
                break;

            case 'kagunita':
                if (section.baseLetter === 'ALL') {
                    // Combine kagunita across consonants
                    items = [];
                    KANNADA_DATASET.kagunita.consonants.forEach(c => {
                        items.push(...generateKagunitaList(c));
                    });
                } else {
                    items = generateKagunitaList(section.baseLetter || 'ಕ');
                }
                break;

            case 'words2Letter':
            case 'words3Letter':
            case 'words4Letter':
            case 'wordsSajati':
            case 'wordsVijati':
                const wordBank = StorageManager.getCombinedWords(section.type);
                items = wordBank.map(w => (typeof w === 'string' ? w : w.word));
                break;

            case 'wordsBahu':
                let bahuBank = StorageManager.getCombinedWords('wordsBahu');
                if (section.difficultyFilter && section.difficultyFilter !== 'all') {
                    bahuBank = bahuBank.filter(w => (w.difficulty || 'medium') === section.difficultyFilter);
                }
                items = bahuBank.map(w => (typeof w === 'string' ? w : w.word));
                break;

            case 'missingLetters':
                items = [...KANNADA_DATASET.missingLetters];
                break;

            case 'wordFormation':
                items = [...KANNADA_DATASET.wordFormation];
                break;

            case 'dottedTracing':
                items = [...KANNADA_DATASET.dottedTracing];
                break;

            case 'twoLineWriting':
                items = [...KANNADA_DATASET.twoLineWriting];
                break;

            case 'storyComprehension':
                const allStories = StorageManager.getCombinedStories();
                const targetStory = allStories.find(s => s.id === section.storyId) || allStories[0];
                return [targetStory];

            default:
                items = [];
                break;
        }

        if (section.randomize && items.length > 0) {
            items = this.shuffleArray([...items]);
        }

        // Limit to chosen count (if count is less than items length)
        if (section.count && section.count < items.length) {
            items = items.slice(0, section.count);
        }

        return items;
    }

    shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
}

if (typeof window !== 'undefined') {
    window.WorksheetBuilder = WorksheetBuilder;
    window.MODULE_DEFINITIONS = MODULE_DEFINITIONS;
}
if (typeof globalThis !== 'undefined') {
    globalThis.WorksheetBuilder = WorksheetBuilder;
    globalThis.MODULE_DEFINITIONS = MODULE_DEFINITIONS;
}

