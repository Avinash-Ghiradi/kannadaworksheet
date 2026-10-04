/**
 * A4 Page Layout & Rendering Engine for Kannada Worksheet Generator
 * Generates semantic HTML for A4 paper display, print view, handwriting lines, and answer key.
 */

const RenderEngine = {
    renderWorksheet(builder, containerEl) {
        if (!containerEl) return;

        const { settings, sections } = builder;
        containerEl.innerHTML = '';

        // Create main page wrapper
        const pageEl = document.createElement('div');
        pageEl.className = `a4-page ${settings.orientation} font-size-${settings.fontSize} color-mode-${settings.colorMode}`;

        // 1. Render School Header
        const headerHtml = `
            <div class="worksheet-header">
                <div class="header-main">
                    <h1 class="school-name">${this.escapeHtml(settings.schoolName)}</h1>
                    ${settings.schoolSubtitle ? `<p class="school-subtitle">${this.escapeHtml(settings.schoolSubtitle)}</p>` : ''}
                    <h2 class="worksheet-title">${this.escapeHtml(settings.worksheetTitle)}</h2>
                </div>
                <div class="header-meta">
                    <div class="meta-row">
                        <span class="meta-item"><strong>ಹೆಸರು / Name:</strong> <span class="fill-line">${this.escapeHtml(settings.studentName)}</span></span>
                        <span class="meta-item"><strong>ತರಗತಿ / Class:</strong> <span class="fill-line">${this.escapeHtml(settings.classGrade)} ${this.escapeHtml(settings.section)}</span></span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-item"><strong>ವಿಷಯ / Subject:</strong> <span class="fill-line">${this.escapeHtml(settings.subject)}</span></span>
                        <span class="meta-item"><strong>ದಿನಾಂಕ / Date:</strong> <span class="fill-line">${this.escapeHtml(settings.date)}</span></span>
                    </div>
                </div>
            </div>
        `;

        let sectionsHtml = '';

        if (sections.length === 0) {
            sectionsHtml = `
                <div class="empty-worksheet-notice">
                    <p>ಯಾವುದೇ ಸಕ್ಷನ್ ಆಯ್ಕೆಯಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ಬಲಬದಿಯ UI ಯಲ್ಲಿ Section ಸೇರಿಸಿ.</p>
                </div>
            `;
        } else {
            sections.forEach((sec, idx) => {
                const items = builder.getSectionItems(sec);
                sectionsHtml += this.renderSection(sec, items, idx + 1);
            });
        }

        // 2. Optional Answer Key
        let answerKeyHtml = '';
        if (settings.showAnswerKey) {
            answerKeyHtml = this.renderAnswerKey(builder);
        }

        // 3. Footer with Page Numbering
        const footerHtml = `
            <div class="worksheet-footer">
                <span class="footer-note">Kannada Worksheet Generator - Primary School Edition</span>
                ${settings.showPageNumbers ? `<span class="page-number">ಪುಟ / Page 1</span>` : ''}
            </div>
        `;

        pageEl.innerHTML = headerHtml + `<div class="worksheet-body">${sectionsHtml}</div>` + answerKeyHtml + footerHtml;
        containerEl.appendChild(pageEl);
    },

    renderSection(section, items, sectionNum) {
        let contentHtml = '';

        switch (section.type) {
            case 'swaragalu':
            case 'vyanjanagalu':
            case 'kagunita':
                contentHtml = this.renderGridTracing(section, items);
                break;

            case 'words2Letter':
            case 'words3Letter':
            case 'words4Letter':
            case 'wordsSajati':
            case 'wordsVijati':
            case 'wordsBahu':
                contentHtml = this.renderWordTracing(section, items);
                break;

            case 'missingLetters':
                contentHtml = this.renderMissingLetters(section, items);
                break;

            case 'wordFormation':
                contentHtml = this.renderWordFormation(section, items);
                break;

            case 'dottedTracing':
                contentHtml = this.renderDottedTracingSection(section, items);
                break;

            case 'twoLineWriting':
                contentHtml = this.renderTwoLineSection(section, items);
                break;

            case 'storyComprehension':
                contentHtml = this.renderStorySection(section, items[0]);
                break;

            default:
                contentHtml = '<p>Unknown Section Type</p>';
                break;
        }

        return `
            <div class="section-block" data-section-type="${section.type}">
                <div class="section-header">
                    <span class="section-badge">${sectionNum}</span>
                    <h3 class="section-title">${this.escapeHtml(section.title)}</h3>
                </div>
                <div class="section-content">
                    ${contentHtml}
                </div>
            </div>
        `;
    },

    // 1. Grid Tracing for Alphabet / Vowels / Consonants / Kagunita
    renderGridTracing(section, items) {
        const styleClass = this.getTracingClass(section.tracingStyle);
        const rows = items.map(item => {
            return `
                <div class="tracing-cell-row">
                    <div class="tracing-cell primary-sample">${item}</div>
                    <div class="tracing-cell ${styleClass}">${item}</div>
                    <div class="tracing-cell ${styleClass}">${item}</div>
                    <div class="tracing-cell ${styleClass}">${item}</div>
                    <div class="tracing-cell blank-cell"></div>
                </div>
            `;
        }).join('');

        return `<div class="tracing-grid-container">${rows}</div>`;
    },

    // 2. Word Tracing Rows (Sample + Tracing + Blank Boxes)
    renderWordTracing(section, items) {
        const styleClass = this.getTracingClass(section.tracingStyle);

        const rows = items.map(word => {
            return `
                <div class="word-practice-row">
                    <div class="word-label">${word}</div>
                    <div class="word-tracing-box ${styleClass}">${word}</div>
                    <div class="word-tracing-box ${styleClass}">${word}</div>
                    <div class="word-writing-box"></div>
                    <div class="word-writing-box"></div>
                </div>
            `;
        }).join('');

        return `<div class="word-tracing-container">${rows}</div>`;
    },

    // 3. Missing Letters Grid
    renderMissingLetters(section, items) {
        const list = items.map((item, idx) => {
            const formattedText = item.text.replace(/_/g, `<span class="missing-slot"></span>`);
            return `
                <div class="missing-letter-card">
                    <span class="q-num">${idx + 1}.</span>
                    <span class="q-text">${formattedText}</span>
                    <span class="answer-space">________</span>
                </div>
            `;
        }).join('');

        return `<div class="missing-letters-grid">${list}</div>`;
    },

    // 4. Word Formation Equations
    renderWordFormation(section, items) {
        const list = items.map((item, idx) => {
            const equation = item.parts.join(' + ');
            return `
                <div class="word-formation-row">
                    <span class="q-num">${idx + 1}.</span>
                    <span class="equation-part">${equation}</span>
                    <span class="equals-sign">=</span>
                    <span class="formation-blank-line">____________________</span>
                </div>
            `;
        }).join('');

        return `<div class="word-formation-container">${list}</div>`;
    },

    // 5. Dotted Stroke Tracing
    renderDottedTracingSection(section, items) {
        const list = items.map(item => {
            const text = typeof item === 'string' ? item : item.text;
            return `
                <div class="dotted-tracing-line">
                    <div class="dotted-text-sample tracing-dotted">${text}</div>
                    <div class="dotted-text-practice tracing-dotted">${text}</div>
                    <div class="dotted-blank-practice"></div>
                </div>
            `;
        }).join('');

        return `<div class="dotted-tracing-container">${list}</div>`;
    },

    // 6. 2-Line Kannada Handwriting Rows
    renderTwoLineSection(section, items) {
        const list = items.map(rowText => {
            return `
                <div class="two-line-row-wrapper">
                    <div class="two-line-box">
                        <span class="two-line-guide-top"></span>
                        <span class="two-line-content">${rowText}</span>
                        <span class="two-line-guide-bottom"></span>
                    </div>
                </div>
            `;
        }).join('');

        return `<div class="two-line-container">${list}</div>`;
    },

    // 7. Story Comprehension Section
    renderStorySection(section, story) {
        if (!story) {
            return `<p>ಯಾವುದೇ ಕಥೆ ಆಯ್ಕೆಯಾಗಿಲ್ಲ.</p>`;
        }

        const paragraphs = story.content.split('\n\n').map(p => `<p class="story-p">${this.escapeHtml(p)}</p>`).join('');
        const questionsList = story.questions.map((q, idx) => {
            return `
                <div class="story-q-block">
                    <p class="story-q-text"><strong>${idx + 1}. ${this.escapeHtml(q)}</strong></p>
                    <div class="ruled-writing-space">
                        <div class="ruled-line"></div>
                        <div class="ruled-line"></div>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="story-worksheet-block">
                <h4 class="story-title">📖 ಶೀರ್ಷಿಕೆ: ${this.escapeHtml(story.title)}</h4>
                <div class="story-body-box">
                    ${paragraphs}
                </div>
                <h4 class="story-q-heading">ಕೆಳಗಿನ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ:</h4>
                <div class="story-questions-wrapper">
                    ${questionsList}
                </div>
            </div>
        `;
    },

    // Answer Key Page Generator
    renderAnswerKey(builder) {
        let answerBlocks = '';

        builder.sections.forEach((sec, idx) => {
            const items = builder.getSectionItems(sec);
            let secAnswers = '';

            if (sec.type === 'missingLetters') {
                secAnswers = items.map((item, i) => `${i + 1}) <strong>${item.answer}</strong> (${item.fullWord || item.text})`).join(' &nbsp;|&nbsp; ');
            } else if (sec.type === 'wordFormation') {
                secAnswers = items.map((item, i) => `${i + 1}) <strong>${item.word}</strong>`).join(' &nbsp;|&nbsp; ');
            } else if (sec.type === 'storyComprehension' && items[0]) {
                secAnswers = `<p class="ans-note">ಕಥೆಯ ಹೆಸರು: ${items[0].title}. (ಉತ್ತರಗಳನ್ನು ಕಥೆಯ ಪ್ಯಾರಾಗ್ರಾಫ್‌ನಲ್ಲಿ ಪರಿಶೀಲಿಸಿ)</p>`;
            } else {
                secAnswers = `<p class="ans-note">ಬರವಣಿಗೆ ಮತ್ತು Tracing ಅಭ್ಯಾಸ ಪ್ರಶ್ನೆಗಳು.</p>`;
            }

            answerBlocks += `
                <div class="answer-key-sec">
                    <h5>Section ${idx + 1}: ${sec.title}</h5>
                    <div class="answer-content">${secAnswers}</div>
                </div>
            `;
        });

        return `
            <div class="answer-key-page">
                <hr class="answer-key-divider">
                <h3 class="answer-key-heading">🔑 ಉತ್ತರ ಸೂಚಿ / Answer Key</h3>
                ${answerBlocks}
            </div>
        `;
    },

    getTracingClass(style) {
        switch (style) {
            case 'dotted':
                return 'tracing-dotted';
            case 'guide':
                return 'tracing-guide';
            case 'outline':
                return 'tracing-outline';
            case 'normal_blank':
                return 'tracing-solid';
            case 'pure_blank':
                return 'tracing-blank';
            default:
                return 'tracing-dotted';
        }
    },

    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
};

if (typeof window !== 'undefined') {
    window.RenderEngine = RenderEngine;
}
if (typeof globalThis !== 'undefined') {
    globalThis.RenderEngine = RenderEngine;
}

