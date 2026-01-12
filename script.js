document.addEventListener('DOMContentLoaded', () => {
    const processBtn = document.getElementById('processBtn');
    const copyBtn = document.getElementById('copyBtn');
    const emailSource = document.getElementById('emailSource');
    const emailOutput = document.getElementById('emailOutput');
    const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');
    const bulkResultsContainer = document.getElementById('bulkResultsContainer');
    const singleModeBtn = document.getElementById('singleModeBtn');
    const bulkModeBtn = document.getElementById('bulkModeBtn');
    const singleModeSection = document.getElementById('singleModeSection');
    const bulkModeSection = document.getElementById('bulkModeSection');
    const fileCountDiv = document.getElementById('fileCount');

    // Theme Logic
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'light') {
            toggleSwitch.checked = true;
        }
    }

    toggleSwitch.addEventListener('change', function (e) {
        if (e.target.checked) {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }
    });

    // Tab Navigation
    singleModeBtn.addEventListener('click', () => {
        singleModeBtn.classList.add('active');
        bulkModeBtn.classList.remove('active');
        singleModeSection.classList.remove('hidden');
        bulkModeSection.classList.add('hidden');
    });

    bulkModeBtn.addEventListener('click', () => {
        bulkModeBtn.classList.add('active');
        singleModeBtn.classList.remove('active');
        bulkModeSection.classList.remove('hidden');
        singleModeSection.classList.add('hidden');
    });

    // Manual Processing
    processBtn.addEventListener('click', () => {
        const sourceText = emailSource.value;
        if (!sourceText.trim()) return;
        const result = processEmailContent(sourceText);
        emailOutput.value = result;
    });

    copyBtn.addEventListener('click', () => {
        copyToClipboard(emailOutput.value, copyBtn);
    });

    // File Upload Processing
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and Drop Visuals
    fileInput.addEventListener('dragenter', () => dropZone.classList.add('drag-over'));
    fileInput.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    fileInput.addEventListener('drop', () => dropZone.classList.remove('drag-over'));

    function handleFileSelect(e) {
        const files = e.target.files;
        if (!files.length) {
            fileCountDiv.textContent = '0 files selected';
            return;
        }

        fileCountDiv.textContent = `${files.length} file(s) uploaded`;
        bulkResultsContainer.innerHTML = ''; // Clear previous results

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target.result;
                const processedContent = processEmailContent(content);
                createResultCard(file.name, processedContent);
            };
            reader.readAsText(file);
        });
    }

    function createResultCard(filename, content) {
        const card = document.createElement('div');
        card.className = 'result-card';

        const header = document.createElement('div');
        header.className = 'result-header';
        header.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12H15M12 9V15M3 15C3 17.8284 3 19.2426 3.87868 20.1213C4.75736 21 6.17157 21 9 21H15C17.8284 21 19.2426 21 20.1213 20.1213C21 19.2426 21 17.8284 21 15C21 12.1716 21 10.7574 20.1213 9.87868C19.2426 9 17.8284 9 15 9H9C6.17157 9 4.75736 9 3.87868 9.87868C3 10.7574 3 12.1716 3 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M13 5H6C4.89543 5 4 5.89543 4 7V9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M15 9V7C15 5.89543 15.8954 5 17 5H18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>${filename}</span>
        `;

        const wrapper = document.createElement('div');
        wrapper.className = 'textarea-wrapper';

        const textarea = document.createElement('textarea');
        textarea.readOnly = true;
        textarea.value = content;
        // Auto-adjust height loosely or set min-height
        textarea.style.minHeight = '200px';

        const cardCopyBtn = document.createElement('button');
        cardCopyBtn.className = 'icon-btn';
        cardCopyBtn.title = 'Copy to Clipboard';
        cardCopyBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5H6C4.89543 5 4 5.89543 4 7V19C4 20.1046 4.89543 21 6 21H16C17.1046 21 18 20.1046 18 19V17M19 15V7C19 5.89543 18.1046 5 17 5H15M8 5V7C8 7.55228 8.44772 8 9 8H13C13.5523 8 14 7.55228 14 7V5M8 5C8 4.44772 8.44772 4 9 4H13C13.5523 4 14 4.44772 14 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;

        cardCopyBtn.addEventListener('click', () => copyToClipboard(content, cardCopyBtn));

        wrapper.appendChild(textarea);
        wrapper.appendChild(cardCopyBtn);

        card.appendChild(header);
        card.appendChild(wrapper);
        bulkResultsContainer.appendChild(card);
    }

    function copyToClipboard(text, btnElement) {
        if (text) {
            navigator.clipboard.writeText(text);

            // Visual feedback
            const originalIcon = btnElement.innerHTML;
            btnElement.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17L4 12" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
            setTimeout(() => {
                btnElement.innerHTML = originalIcon;
            }, 2000);
        }
    }

    function processEmailContent(sourceText) {
        // 1. Separate Headers and Body
        const parts = splitHeadersAndBody(sourceText);
        const rawHeaders = parts.headers;
        const body = parts.body;

        // 2. Parse Headers
        const parsedHeaders = parseHeaders(rawHeaders);

        // 3. Filter and Modify Headers
        const newHeaders = processHeaders(parsedHeaders);

        // 4. Reconstruct
        return reconstructEmail(newHeaders, body);
    }

    function splitHeadersAndBody(text) {
        const regex = /\r?\n\r?\n/;
        const match = regex.exec(text);

        if (match) {
            return {
                headers: text.substring(0, match.index),
                body: text.substring(match.index + match[0].length)
            };
        } else {
            return { headers: text, body: '' };
        }
    }

    function parseHeaders(rawHeaders) {
        const lines = rawHeaders.split(/\r?\n/);
        const headers = [];
        let currentHeader = null;

        for (const line of lines) {
            if (line.match(/^\s+/) && currentHeader) {
                currentHeader.value += '\n' + line;
            } else {
                if (currentHeader) {
                    headers.push(currentHeader);
                }

                const colonIndex = line.indexOf(':');
                if (colonIndex !== -1) {
                    const name = line.substring(0, colonIndex).trim();
                    const value = line.substring(colonIndex + 1);
                    currentHeader = { name, value, originalLine: line };
                }
            }
        }
        if (currentHeader) {
            headers.push(currentHeader);
        }
        return headers;
    }

    function processHeaders(headers) {
        const keepList = [
            'Received',
            'Date',
            'MIME-Version',
            'Content-Type',
            'Content-Transfer-Encoding',
            'To',
            'Subject',
            'Cc'
        ];

        const processed = [];

        for (const header of headers) {
            const nameLower = header.name.toLowerCase();

            if (nameLower === 'from') {
                processed.push({
                    name: header.name,
                    value: transformFromHeader(header.value)
                });
                continue;
            }

            if (nameLower === 'message-id') {
                processed.push({
                    name: header.name,
                    value: transformMessageId(header.value)
                });
                continue;
            }

            if (keepList.some(k => k.toLowerCase() === nameLower)) {
                processed.push(header);
            }
        }

        return processed;
    }

    function transformFromHeader(value) {
        if (value.includes('<') && value.includes('>')) {
            return value.replace(/<([^@]+)@([^>]+)>/, (match, user, domain) => {
                return `<${user.trim()}[EID]@[RDNS]>`;
            });
        }

        if (value.includes('@')) {
            return value.replace(/([^@\s]+)@(\S+)/, (match, user, domain) => {
                return `${user}[EID]@[RDNS]`;
            });
        }
        return value;
    }

    function transformMessageId(value) {
        if (value.includes('<') && value.includes('>')) {
            return value.replace(/<([^@]+)@([^>]+)>/, (match, localPart, domain) => {
                return `<${localPart}[IDmailer]_id_[ID]-f_@${domain}>`;
            });
        }
        return value;
    }

    function reconstructEmail(headers, body) {
        let text = '';
        for (const h of headers) {
            text += `${h.name}:${h.value}\n`;
        }

        if (body) {
            text += '\n' + body;
        }
        return text;
    }
});

