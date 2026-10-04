/**
 * Application Controller for Kannada Worksheet Generator
 * Handles UI events, tab switching, section updates, word/story modals, and print calls.
 */

(function () {
    let builder = null;
    let canvasContainer = null;
    let activeSectionsContainer = null;
    let tabBtns = [];
    let tabContents = [];
    let modalAddWord = null;
    let modalAddStory = null;

    function startApp() {
        try {
            // 1. Initialize Builder State
            builder = new WorksheetBuilder();

            // DOM Elements
            canvasContainer = document.getElementById('worksheet-render-canvas');
            activeSectionsContainer = document.getElementById('active-sections-container');
            
            // Tab Elements
            tabBtns = document.querySelectorAll('.tab-btn');
            tabContents = document.querySelectorAll('.tab-content');

            // Modals
            modalAddWord = document.getElementById('modal-add-word');
            modalAddStory = document.getElementById('modal-add-story');

            initApp();
        } catch (err) {
            console.error("Critical error starting Kannada Worksheet App:", err);
        }
    }

    function initApp() {
        bindHeaderActions();
        bindSettingsEvents();
        bindTabEvents();
        bindSectionEvents();
        bindWordBankEvents();
        bindStoryBankEvents();
        bindSavedTemplatesEvents();
        bindModalEvents();

        renderActiveSectionsUI();
        renderLivePreview();
        renderWordBankUI();
        renderStoryBankUI();
        renderSavedTemplatesUI();
    }

    // --- 1. RENDER LIVE PREVIEW ---
    function renderLivePreview() {
        try {
            if (canvasContainer && builder) {
                RenderEngine.renderWorksheet(builder, canvasContainer);
            }
        } catch (e) {
            console.error("Error rendering live preview:", e);
        }
    }

    // --- 2. HEADER ACTIONS ---
    function bindHeaderActions() {
        const printBtn = document.getElementById('btn-print-pdf');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }

        const previewPrintBtn = document.getElementById('btn-preview-print');
        if (previewPrintBtn) {
            previewPrintBtn.addEventListener('click', () => {
                window.print();
            });
        }

        const randBtn = document.getElementById('btn-randomize-all');
        if (randBtn) {
            randBtn.addEventListener('click', () => {
                if (builder && builder.sections) {
                    builder.sections.forEach(sec => sec.randomize = true);
                    renderLivePreview();
                }
            });
        }

        const saveBtn = document.getElementById('btn-save-template');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const title = prompt("ವರ್ಕ್‌ಶೀಟ್ ಟೆಂಪ್ಲೇಟ್‌ ಹೆಸರು (Template Name):", builder.settings.worksheetTitle);
                if (title) {
                    StorageManager.saveWorksheet({
                        title: title,
                        settings: { ...builder.settings },
                        sections: JSON.parse(JSON.stringify(builder.sections))
                    });
                    alert("ವರ್ಕ್‌ಶೀಟ್ ಯಶಸ್ವಿಯಾಗಿ ಸೇವ್‌ ಆಯಿತು!");
                    renderSavedTemplatesUI();
                }
            });
        }
    }

    // --- 3. SETTINGS BINDINGS ---
    function bindSettingsEvents() {
        const updateSetting = (id, prop, isCheckbox = false) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener(isCheckbox ? 'change' : 'input', (e) => {
                builder.settings[prop] = isCheckbox ? e.target.checked : e.target.value;
                renderLivePreview();
            });
        };

        updateSetting('setting-school-name', 'schoolName');
        updateSetting('setting-school-subtitle', 'schoolSubtitle');
        updateSetting('setting-worksheet-title', 'worksheetTitle');
        updateSetting('setting-class-grade', 'classGrade');
        updateSetting('setting-section', 'section');
        updateSetting('setting-orientation', 'orientation');
        updateSetting('setting-font-size', 'fontSize');
        updateSetting('setting-tracing-style', 'tracingStyle');
        updateSetting('setting-show-answers', 'showAnswerKey', true);
        updateSetting('setting-show-page-num', 'showPageNumbers', true);
    }

    // --- 4. TAB SWITCHING ---
    function bindTabEvents() {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                btn.classList.add('active');
                const targetEl = document.getElementById(targetTab);
                if (targetEl) targetEl.classList.add('active');
            });
        });
    }

    // --- 5. SECTION MANAGEMENT UI ---
    function bindSectionEvents() {
        const addSecBtn = document.getElementById('btn-add-section');
        if (addSecBtn) {
            addSecBtn.addEventListener('click', () => {
                const selectEl = document.getElementById('select-module-type');
                const type = selectEl ? selectEl.value : '';
                if (type) {
                    builder.addSection(type);
                    renderActiveSectionsUI();
                    renderLivePreview();
                    selectEl.value = '';
                } else {
                    alert("ದಯವಿಟ್ಟು ಒಂದು Module ಆಯ್ಕೆ ಮಾಡಿ.");
                }
            });
        }
    }

    function renderActiveSectionsUI() {
        if (!activeSectionsContainer) return;
        activeSectionsContainer.innerHTML = '';

        if (!builder.sections || builder.sections.length === 0) {
            activeSectionsContainer.innerHTML = `<p style="font-size: 0.85rem; color: #888; text-align: center; padding: 10px;">ಯಾವುದೇ section ಸೇರಿಸಲಾಗಿಲ್ಲ. ಮೇಲೆ <strong>Section ಸೇರಿಸಿ</strong> ಕ್ಲಿಕ್ ಮಾಡಿ.</p>`;
            return;
        }

        builder.sections.forEach((sec, idx) => {
            const card = document.createElement('div');
            card.className = 'section-item-card';

            // Special controls based on section type
            let extraControls = '';

            if (sec.type === 'kagunita') {
                const consonants = (KANNADA_DATASET && KANNADA_DATASET.kagunita) ? KANNADA_DATASET.kagunita.consonants : [];
                const options = consonants.map(c => `<option value="${c}" ${sec.baseLetter === c ? 'selected' : ''}>ಅಕ್ಷರ: ${c}</option>`).join('');
                extraControls = `
                    <div class="form-group" style="margin-top: 4px;">
                        <select class="form-control sec-base-letter" data-id="${sec.id}">
                            <option value="ALL" ${sec.baseLetter === 'ALL' ? 'selected' : ''}>ಎಲ್ಲಾ ಅಕ್ಷರಗಳು (All Consonants)</option>
                            ${options}
                        </select>
                    </div>
                `;
            } else if (sec.type === 'wordsBahu') {
                extraControls = `
                    <div class="form-group" style="margin-top: 4px;">
                        <select class="form-control sec-difficulty" data-id="${sec.id}">
                            <option value="all" ${sec.difficultyFilter === 'all' ? 'selected' : ''}>ಎಲ್ಲಾ ಕಠಿಣತೆಗಳು (All)</option>
                            <option value="easy" ${sec.difficultyFilter === 'easy' ? 'selected' : ''}>ಸುಲಭ (Easy)</option>
                            <option value="medium" ${sec.difficultyFilter === 'medium' ? 'selected' : ''}>ಮಧ್ಯಮ (Medium)</option>
                            <option value="hard" ${sec.difficultyFilter === 'hard' ? 'selected' : ''}>ಕಠಿಣ (Hard)</option>
                        </select>
                    </div>
                `;
            } else if (sec.type === 'storyComprehension') {
                const stories = StorageManager.getCombinedStories();
                const storyOptions = stories.map(s => `<option value="${s.id}" ${sec.storyId === s.id ? 'selected' : ''}>${s.title}</option>`).join('');
                extraControls = `
                    <div class="form-group" style="margin-top: 4px;">
                        <select class="form-control sec-story-id" data-id="${sec.id}">
                            ${storyOptions}
                        </select>
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="card-header">
                    <span class="sec-title">${idx + 1}. ${sec.title}</span>
                    <div class="card-actions">
                        <button class="btn btn-secondary btn-sm btn-move-up" data-id="${sec.id}">⬆️</button>
                        <button class="btn btn-secondary btn-sm btn-move-down" data-id="${sec.id}">⬇️</button>
                        <button class="btn btn-danger btn-sm btn-remove-sec" data-id="${sec.id}">🗑️</button>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group" style="margin-bottom:0;">
                        <label style="font-size: 0.75rem;">ಪ್ರಶ್ನೆಗಳ ಸಂಖ್ಯೆ / Count</label>
                        <select class="form-control sec-count" data-id="${sec.id}">
                            <option value="5" ${sec.count === 5 ? 'selected' : ''}>5 Items</option>
                            <option value="10" ${sec.count === 10 ? 'selected' : ''}>10 Items</option>
                            <option value="15" ${sec.count === 15 ? 'selected' : ''}>15 Items</option>
                            <option value="20" ${sec.count === 20 ? 'selected' : ''}>20 Items</option>
                            <option value="30" ${sec.count === 30 ? 'selected' : ''}>30 Items</option>
                            <option value="50" ${sec.count === 50 ? 'selected' : ''}>50 Items</option>
                        </select>
                    </div>
                </div>
                ${extraControls}
            `;

            activeSectionsContainer.appendChild(card);
        });

        // Event listeners for section card actions
        activeSectionsContainer.querySelectorAll('.btn-remove-sec').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                builder.removeSection(id);
                renderActiveSectionsUI();
                renderLivePreview();
            });
        });

        activeSectionsContainer.querySelectorAll('.btn-move-up').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                builder.moveSectionUp(id);
                renderActiveSectionsUI();
                renderLivePreview();
            });
        });

        activeSectionsContainer.querySelectorAll('.btn-move-down').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                builder.moveSectionDown(id);
                renderActiveSectionsUI();
                renderLivePreview();
            });
        });

        activeSectionsContainer.querySelectorAll('.sec-count').forEach(select => {
            select.addEventListener('change', (e) => {
                const id = e.target.getAttribute('data-id');
                builder.updateSection(id, { count: parseInt(e.target.value, 10) });
                renderLivePreview();
            });
        });

        activeSectionsContainer.querySelectorAll('.sec-base-letter').forEach(select => {
            select.addEventListener('change', (e) => {
                const id = e.target.getAttribute('data-id');
                builder.updateSection(id, { baseLetter: e.target.value });
                renderLivePreview();
            });
        });

        activeSectionsContainer.querySelectorAll('.sec-difficulty').forEach(select => {
            select.addEventListener('change', (e) => {
                const id = e.target.getAttribute('data-id');
                builder.updateSection(id, { difficultyFilter: e.target.value });
                renderLivePreview();
            });
        });

        activeSectionsContainer.querySelectorAll('.sec-story-id').forEach(select => {
            select.addEventListener('change', (e) => {
                const id = e.target.getAttribute('data-id');
                builder.updateSection(id, { storyId: e.target.value });
                renderLivePreview();
            });
        });
    }

    // --- 6. WORD BANK MANAGER ---
    function bindWordBankEvents() {
        const catSelect = document.getElementById('filter-word-category');
        const searchInput = document.getElementById('search-words');

        if (catSelect) catSelect.addEventListener('change', () => renderWordBankUI());
        if (searchInput) searchInput.addEventListener('input', () => renderWordBankUI());

        const openAddBtn = document.getElementById('btn-open-add-word');
        if (openAddBtn) {
            openAddBtn.addEventListener('click', () => {
                if (modalAddWord) modalAddWord.classList.add('active');
            });
        }
    }

    function renderWordBankUI() {
        const listContainer = document.getElementById('word-bank-list');
        const catEl = document.getElementById('filter-word-category');
        const searchEl = document.getElementById('search-words');
        if (!listContainer || !catEl) return;

        const categoryKey = catEl.value;
        const searchQuery = searchEl ? searchEl.value.trim().toLowerCase() : '';

        listContainer.innerHTML = '';
        let words = StorageManager.getCombinedWords(categoryKey);

        if (searchQuery) {
            words = words.filter(w => {
                const str = typeof w === 'string' ? w : (w ? w.word : '');
                return str.toLowerCase().includes(searchQuery);
            });
        }

        if (words.length === 0) {
            listContainer.innerHTML = `<p style="font-size: 0.85rem; color: #777;">ಯಾವುದೇ ಪದ ಕಂಡುಬಂದಿಲ್ಲ.</p>`;
            return;
        }

        words.forEach(w => {
            const isCustom = typeof w === 'object' && w && w.id;
            const wordText = typeof w === 'string' ? w : (w ? w.word : '');
            const diffText = typeof w === 'object' && w && w.difficulty ? `(${w.difficulty})` : '';

            const itemEl = document.createElement('div');
            itemEl.className = 'missing-letter-card';
            itemEl.style.justifyContent = 'space-between';
            itemEl.style.padding = '6px 10px';
            itemEl.style.fontSize = '1rem';

            itemEl.innerHTML = `
                <span><strong>${wordText}</strong> <small style="color: #777;">${diffText}</small></span>
                ${isCustom ? `<button class="btn btn-danger btn-sm btn-del-custom-word" data-id="${w.id}">🗑️</button>` : `<span style="font-size:0.7rem; color:#aaa;">Default</span>`}
            `;

            listContainer.appendChild(itemEl);
        });

        listContainer.querySelectorAll('.btn-del-custom-word').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                StorageManager.deleteCustomWord(id);
                renderWordBankUI();
                renderLivePreview();
            });
        });
    }

    // --- 7. STORY BANK MANAGER ---
    function bindStoryBankEvents() {
        const openAddStoryBtn = document.getElementById('btn-open-add-story');
        if (openAddStoryBtn) {
            openAddStoryBtn.addEventListener('click', () => {
                if (modalAddStory) modalAddStory.classList.add('active');
            });
        }
    }

    function renderStoryBankUI() {
        const container = document.getElementById('story-bank-list');
        if (!container) return;
        container.innerHTML = '';

        const stories = StorageManager.getCombinedStories();

        stories.forEach(s => {
            if (!s) return;
            const card = document.createElement('div');
            card.className = 'panel-card';
            card.style.marginBottom = '8px';

            const isCustom = s.id && s.id.startsWith('story_');

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h5 style="font-size:0.95rem; color:var(--primary-color);">📖 ${s.title || ''}</h5>
                    ${isCustom ? `<button class="btn btn-danger btn-sm btn-del-story" data-id="${s.id}">🗑️</button>` : `<span style="font-size:0.7rem; color:#aaa;">Default Story</span>`}
                </div>
                <p style="font-size:0.8rem; color:#555; margin-top:4px;">${(s.content || '').substring(0, 80)}...</p>
                <small style="color:#777;">${s.questions ? s.questions.length : 0} ಪ್ರಶ್ನೆಗಳು</small>
            `;

            container.appendChild(card);
        });

        container.querySelectorAll('.btn-del-story').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                StorageManager.deleteCustomStory(id);
                renderStoryBankUI();
                renderLivePreview();
            });
        });
    }

    // --- 8. SAVED TEMPLATES ---
    function bindSavedTemplatesEvents() {}

    function renderSavedTemplatesUI() {
        const container = document.getElementById('saved-templates-list');
        if (!container) return;
        container.innerHTML = '';

        const templates = StorageManager.getSavedWorksheets();

        if (templates.length === 0) {
            container.innerHTML = `<p style="font-size: 0.85rem; color: #777;">ಯಾವುದೇ ಸೌವ್ ಮಾಡಿದ ಟೆಂಪ್ಲೇಟ್‌ ಇಲ್ಲ.</p>`;
            return;
        }

        templates.forEach(tpl => {
            const card = document.createElement('div');
            card.className = 'panel-card';
            card.style.marginBottom = '8px';

            card.innerHTML = `
                <h5 style="font-size:0.95rem; color:var(--primary-color);">${tpl.title}</h5>
                <p style="font-size:0.75rem; color:#777; margin-bottom:8px;">ಸೇವ್ ಮಾಡಿದ ದಿನಾಂಕ: ${new Date(tpl.createdAt).toLocaleDateString()}</p>
                <div style="display:flex; gap:6px;">
                    <button class="btn btn-primary btn-sm btn-load-tpl" data-id="${tpl.id}">Load</button>
                    <button class="btn btn-danger btn-sm btn-del-tpl" data-id="${tpl.id}">🗑️</button>
                </div>
            `;

            container.appendChild(card);
        });

        container.querySelectorAll('.btn-load-tpl').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const tpl = templates.find(t => t.id === id);
                if (tpl) {
                    builder.settings = { ...tpl.settings };
                    builder.sections = JSON.parse(JSON.stringify(tpl.sections));
                    renderActiveSectionsUI();
                    renderLivePreview();
                    alert("ಟೆಂಪ್ಲೇಟ್‌ ಲೋಡ್ ಆಯಿತು!");
                }
            });
        });

        container.querySelectorAll('.btn-del-tpl').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                StorageManager.deleteWorksheet(id);
                renderSavedTemplatesUI();
            });
        });
    }

    // --- 9. MODAL HANDLERS ---
    function bindModalEvents() {
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                if (modalAddWord) modalAddWord.classList.remove('active');
                if (modalAddStory) modalAddStory.classList.remove('active');
            });
        });

        const saveWordBtn = document.getElementById('btn-save-new-word');
        if (saveWordBtn) {
            saveWordBtn.addEventListener('click', () => {
                const wordInput = document.getElementById('new-word-input').value.trim();
                const category = document.getElementById('new-word-category').value;
                const difficulty = document.getElementById('new-word-difficulty').value;

                if (!wordInput) {
                    alert("ದಯವಿಟ್ಟು ಕನ್ನಡ ಪದ ನಮೂದಿಸಿ.");
                    return;
                }

                StorageManager.addCustomWord({
                    word: wordInput,
                    category: category,
                    difficulty: difficulty
                });

                document.getElementById('new-word-input').value = '';
                if (modalAddWord) modalAddWord.classList.remove('active');
                renderWordBankUI();
                renderLivePreview();
                alert("ಹೊಸ ಶಬ್ದ ಸೇವ್ ಆಯಿತು!");
            });
        }

        const saveStoryBtn = document.getElementById('btn-save-new-story');
        if (saveStoryBtn) {
            saveStoryBtn.addEventListener('click', () => {
                const title = document.getElementById('new-story-title').value.trim();
                const content = document.getElementById('new-story-content').value.trim();
                const q1 = document.getElementById('new-story-q1').value.trim();
                const q2 = document.getElementById('new-story-q2').value.trim();
                const q3 = document.getElementById('new-story-q3').value.trim();
                const q4 = document.getElementById('new-story-q4').value.trim();
                const q5 = document.getElementById('new-story-q5').value.trim();

                if (!title || !content || !q1) {
                    alert("ದಯವಿಟ್ಟು ಶೀರ್ಷಿಕೆ, ಕಥೆ ಹಾಗೂ ಕನಿಷ್ಠ 1 ಪ್ರಶ್ನೆ ನಮೂದಿಸಿ.");
                    return;
                }

                const questions = [q1, q2, q3, q4, q5].filter(q => q.length > 0);

                StorageManager.addCustomStory({
                    title: title,
                    content: content,
                    questions: questions
                });

                document.getElementById('new-story-title').value = '';
                document.getElementById('new-story-content').value = '';
                if (modalAddStory) modalAddStory.classList.remove('active');
                renderStoryBankUI();
                renderLivePreview();
                alert("ಹೊಸ ಕಥೆ ಸೇವ್ ಆಯಿತು!");
            });
        }
    }

    // SAFELY RUN ON DOM READY OR IMMEDIATELY
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startApp);
    } else {
        startApp();
    }
})();
