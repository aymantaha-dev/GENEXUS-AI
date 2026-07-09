/**
 * GENEXUS UI - Core Engine
 * Professional Grade Implementation
 */

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    const els = {
        promptInput: document.getElementById('prompt-input'),
        btnGenerate: document.getElementById('btn-generate'),
        btnClear: document.getElementById('btn-clear'),
        btnRandom: document.getElementById('btn-random'),
        resultsGrid: document.getElementById('results-grid'),
        emptyState: document.getElementById('empty-state'),
        genText: document.getElementById('gen-text'),
        genLoader: document.getElementById('gen-loader'),
        btnTheme: document.getElementById('btn-theme'),
        btnGallery: document.getElementById('btn-gallery'),
        gallerySection: document.getElementById('gallery-section'),
        btnSettingsMobile: document.getElementById('btn-settings-mobile'),
        settingsDrawer: document.getElementById('settings-drawer'),
        closeSettings: document.getElementById('close-settings'),
        drawerOverlay: document.getElementById('drawer-overlay'),
        selectStyle: document.getElementById('select-style'),
        inputSeed: document.getElementById('input-seed'),
        ratioBtns: document.querySelectorAll('.ratio-btn'),
        countBtns: document.querySelectorAll('.count-btn'),
        qualityBtns: document.querySelectorAll('.quality-btn'),
        historyList: document.getElementById('history-list'),
        clearHistoryBtn: document.getElementById('clear-history')
    };

    let state = {
        width: 512,
        height: 512,
        count: 1,
        quality: 'medium',
        history: JSON.parse(localStorage.getItem('genexus_history')) || []
    };

    const premiumPrompts = [
        "Cyberpunk street photography, neon signage, rain-slicked pavement, cinematic lighting, 8k, hyper-realistic",
        "Majestic floating islands with cascading waterfalls, ethereal atmosphere, fantasy landscape, volumetric lighting",
        "Portrait of a futuristic cyborg queen, intricate gold filigree, glowing eyes, unreal engine 5 render, masterpiece",
        "Minimalist architecture, brutalist concrete, desert landscape, soft sunlight, architectural photography, high fidelity",
        "Astronaut floating in a sea of liquid gold, surrealism, cosmic nebula background, dreamlike, highly detailed",
        "Ancient mystical forest, glowing bioluminescent flora, mythical creatures, fantasy art, epic composition",
        "Steampunk flying machine navigating through clouds, Victorian aesthetics, intricate mechanical details, cinematic",
        "A majestic dragon made of crystalline ice, breathing frost, mountain peak, hyper-realistic, 8k",
        "Macro photography of a futuristic microchip, glowing circuits, depth of field, highly detailed, tech aesthetic",
        "Ethereal goddess of the moon, flowing silver hair, starlight, celestial atmosphere, digital art masterpiece"
    ];

    initTheme();
    renderHistory();

    // --- Theme Logic ---
    function initTheme() {
        const saved = localStorage.getItem('genexus_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', saved);
        updateThemeIcon(saved);
    }

    els.btnTheme.onclick = () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('genexus_theme', next);
        updateThemeIcon(next);
    };

    function updateThemeIcon(theme) {
        els.btnTheme.innerHTML = theme === 'dark' ? `<i data-lucide="sun"></i>` : `<i data-lucide="moon"></i>`;
        lucide.createIcons();
    }

    // --- Mobile Drawer (Bottom Sheet) Logic ---
    const toggleDrawer = (show) => {
        els.settingsDrawer.classList.toggle('active', show);
        els.drawerOverlay.classList.toggle('active', show);
    };

    els.btnSettingsMobile.onclick = () => toggleDrawer(true);
    els.closeSettings.onclick = () => toggleDrawer(false);
    els.drawerOverlay.onclick = () => toggleDrawer(false);

    // --- Generation Logic ---
    els.btnGenerate.onclick = generateImages;

    async function generateImages() {
        const prompt = els.promptInput.value.trim();
        if (!prompt) return showToast("Please enter a prompt!", "error");

        setLoading(true);

        const qualityMap = {
            low: "simple, basic",
            medium: "highly detailed, 4k",
            high: "masterpiece, ultra-detailed, cinematic lighting, 8k, hyper-realistic, intricate textures"
        };

        const style = els.selectStyle.value;
        const finalPrompt = `${prompt}, ${qualityMap[state.quality]} ${style}`.trim();
        const seed = els.inputSeed.value || Math.floor(Math.random() * 1000000);

        try {
            const tasks = [];
            for (let i = 0; i < state.count; i++) {
                tasks.push(fetchImage(finalPrompt, seed + i));
            }

            const urls = await Promise.all(tasks);
            const validUrls = urls.filter(u => u !== null);

            if (validUrls.length === 0) throw new Error("API Failed");

            els.emptyState.classList.add('hidden');
            validUrls.forEach(url => {
                const card = createResultCard(url, prompt);
                els.resultsGrid.prepend(card);
            });

            if (validUrls[0]) addToHistory(prompt, validUrls[0]);
            showToast(`Generated ${validUrls.length} images!`);
            toggleDrawer(false);

        } catch (err) {
            console.error(err);
            showToast("Generation failed. Try again.", "error");
        } finally {
            setLoading(false);
        }
    }

    async function fetchImage(prompt, seed) {
        const baseUrl = "https://genexus-ai.onrender.com/api/images/generate";
        const params = new URLSearchParams({
            prompt, model: "flux", seed,
            width: state.width,
            height: state.height
        });

        try {
            const res = await fetch(`${baseUrl}?${params.toString()}`);
            if (!res.ok) return null;
            const type = res.headers.get("content-type");

            if (type?.includes("application/json")) {
                const data = await res.json();
                return data.url || data.image || data.imageUrl || null;
            } 
            if (type?.includes("image")) {
                const blob = await res.blob();
                return URL.createObjectURL(blob);
            }
            const text = await res.text();
            return text.startsWith('data:image') ? text : null;
        } catch (e) { return null; }
    }

    // --- UI Components ---
    function createResultCard(url, prompt) {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <img src="${url}" alt="AI Art" loading="lazy">
            <div class="result-overlay">
                <button class="action-icon-btn dl-btn" title="Download"><i data-lucide="download"></i></button>
                <button class="action-icon-btn cp-btn" title="Copy Prompt"><i data-lucide="copy"></i></button>
            </div>
        `;
        setTimeout(() => lucide.createIcons(), 0);
        card.querySelector('.dl-btn').onclick = () => download(url);
        card.querySelector('.cp-btn').onclick = () => {
            navigator.clipboard.writeText(prompt);
            showToast("Prompt copied!");
        };
        return card;
    }

    function setLoading(isLoading) {
        els.btnGenerate.disabled = isLoading;
        els.genText.classList.toggle('hidden', isLoading);
        els.genLoader.classList.toggle('hidden', !isLoading);
    }

    async function download(url) {
        try {
            const res = await fetch(url);
            const blob = await res.blob();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `genexus-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            showToast("Download started!");
        } catch (e) {
            showToast("Download failed.", "error");
        }
    }

    // --- Settings Listeners ---
    els.ratioBtns.forEach(btn => {
        btn.onclick = () => {
            els.ratioBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.width = parseInt(btn.dataset.w);
            state.height = parseInt(btn.dataset.h);
        };
    });

    els.qualityBtns.forEach(btn => {
        btn.onclick = () => {
            els.qualityBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.quality = btn.dataset.quality;
        };
    });

    els.countBtns.forEach(btn => {
        btn.onclick = () => {
            els.countBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.count = parseInt(btn.dataset.count);
        };
    });

    // --- History & Utils ---
    function addToHistory(prompt, img) {
        state.history.unshift({ prompt, img });
        if (state.history.length > 20) state.history.pop();
        localStorage.setItem('genexus_history', JSON.stringify(state.history));
        renderHistory();
    }

    function renderHistory() {
        els.historyList.innerHTML = state.history.length ? '' : '<p style="text-align:center; font-size:0.8rem; color:var(--text-muted);">No history</p>';
        state.history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `<img src="${item.img}" loading="lazy">`;
            div.onclick = () => { els.promptInput.value = item.prompt; };
            els.historyList.appendChild(div);
        });
    }

    function showToast(msg, type = "success") {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerText = msg;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    els.btnGallery.onclick = () => els.gallerySection.scrollIntoView({ behavior: 'smooth' });
    els.btnClear.onclick = () => els.promptInput.value = '';
    els.btnRandom.onclick = () => {
        const s = premiumPrompts[Math.floor(Math.random() * premiumPrompts.length)];
        els.promptInput.value = s;
    };
    els.clearHistoryBtn.onclick = () => {
        state.history = [];
        localStorage.removeItem('genexus_history');
        renderHistory();
    };
});
