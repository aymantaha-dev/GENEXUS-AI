/**
 * GENEXUS UI - Core logic
 * Handles image generation, theme switching, history, and the mobile settings drawer.
 */

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    // DOM references
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
        dragHandle: document.getElementById('drag-handle'),
        selectStyle: document.getElementById('select-style'),
        inputSeed: document.getElementById('input-seed'),
        ratioBtns: document.querySelectorAll('.ratio-btn'),
        countBtns: document.querySelectorAll('.count-btn'),
        qualityBtns: document.querySelectorAll('.quality-btn'),
        historyList: document.getElementById('history-list'),
        clearHistoryBtn: document.getElementById('clear-history')
    };

    // Application state
    const state = {
        width: 512,
        height: 512,
        count: 1,
        quality: 'medium',
        history: JSON.parse(localStorage.getItem('genexus_history')) || []
    };

    // A small collection of interesting prompts to get started
    const premiumPrompts = [
    // CINEMATIC & REALISM
    "Cyberpunk street photography, neon signage, rain-slicked pavement, cinematic lighting, 8k, hyper-realistic",
    "Portrait of a rugged Viking warrior, battle-worn face, intense eyes, snow falling, cinematic lighting, ultra-detailed",
    "A futuristic metropolis at sunset, flying vehicles, massive skyscrapers, volumetric fog, cinematic wide shot, 8k",
    "Deep sea exploration, bioluminescent creatures, glowing jellyfish, dark abyss, hyper-realistic, macro photography",
    "Abandoned gothic cathedral, sunbeams breaking through dust, cinematic atmosphere, epic scale, highly detailed",
    "Classic Hollywood noir, 1940s detective, shadows and light, smoke, high contrast, cinematic film grain",
    "Hyper-realistic close-up of a human eye, reflecting a galaxy, extreme macro, intricate iris details, 8k",
    "A majestic lion in the savanna, golden hour, dust particles in sunlight, National Geographic style, 8k",
    "Vintage luxury car driving through the Amalfi Coast, sun flare, cinematic motion blur, high fidelity",
    "A futuristic soldier in sleek carbon fiber armor, standing in a desert, cinematic lighting, unreal engine 5",

    // FANTASY & MYTHOLOGY
    "Majestic floating islands with cascading waterfalls, ethereal atmosphere, fantasy landscape, volumetric lighting",
    "Ancient mystical forest, glowing bioluminescent flora, mythical creatures, fantasy art, epic composition",
    "A majestic dragon made of crystalline ice, breathing frost, mountain peak, hyper-realistic, 8k",
    "Ethereal goddess of the moon, flowing silver hair, starlight, celestial atmosphere, digital art masterpiece",
    "An enchanted library with flying books, magical glowing particles, dark academia aesthetic, highly detailed",
    "A phoenix rising from golden ashes, intense fire effects, cinematic composition, mythical creature, 8k",
    "Underground elven city, glowing crystals, intricate architecture, fantasy concept art, masterpiece",
    "A knight in glowing holy armor, standing before a massive dragon, epic fantasy battle, cinematic scale",
    "Floating steampunk city in the clouds, brass machinery, airships, Victorian fantasy, highly detailed",
    "A dark sorcerer summoning a storm, lightning bolts, swirling magic energy, epic fantasy, 8k",

    // SCI-FI & FUTURISM
    "Portrait of a futuristic cyborg queen, intricate gold filigree, glowing eyes, unreal engine 5 render, masterpiece",
    "Astronaut floating in a sea of liquid gold, surrealism, cosmic nebula background, dreamlike, highly detailed",
    "Macro photography of a futuristic microchip, glowing circuits, depth of field, highly detailed, tech aesthetic",
    "Inside a massive spaceship engine room, glowing plasma, industrial sci-fi, cinematic lighting, 8k",
    "A humanoid robot painting on a canvas, human-like emotions, futuristic studio, soft lighting, masterpiece",
    "Cybernetic jungle, mechanical plants, neon vines, futuristic biology, highly detailed, 8k",
    "Interstellar wormhole, swirling stars and galaxies, cosmic scale, psychedelic colors, hyper-realistic",
    "A futuristic laboratory, holographic displays, clean white aesthetic, sci-fi minimalism, high fidelity",
    "Space station orbiting a black hole, event horizon, intense gravitational lensing, cinematic sci-fi",
    "A sleek futuristic supercar, glowing LED lines, dark rainy city, cyberpunk aesthetic, 8k",

    // SURREALISM & ARTISTIC
    "Minimalist architecture, brutalist concrete, desert landscape, soft sunlight, architectural photography, high fidelity",
    "A clock melting over a giant desert flower, Salvador Dali style, surrealism, dreamlike atmosphere",
    "A whale flying through a sky of clouds, dreamlike, ethereal, surrealism, soft pastel colors",
    "Human silhouette made of shattering glass, light refraction, surrealism, highly detailed, 8k",
    "A tree where leaves are glowing butterflies, magical realism, soft bokeh, dreamlike, masterpiece",
    "Abstract explosion of liquid colors, silk textures, flowing movement, macro, high resolution",
    "A city built inside a giant glass sphere, floating in space, surrealism, intricate details, 8k",
    "Dreamscape of a staircase leading to the moon, surrealism, ethereal lighting, masterpiece",
    "A mountain made of giant books, surreal landscape, magical atmosphere, highly detailed",
    "Ocean waves made of liquid diamonds, sparkling sunlight, surrealism, hyper-realistic, 8k",

    // ANIME & DIGITAL ART
    "Anime style landscape, Studio Ghibli aesthetic, lush green meadows, soft sunlight, peaceful atmosphere",
    "Cyberpunk anime girl, neon hair, futuristic street, vibrant colors, high quality digital art",
    "Epic anime battle, energy beams, dynamic motion, intense colors, high fidelity digital art",
    "Makoto Shinkai style sky, beautiful clouds, sunset, emotional atmosphere, high quality anime art",
    "Cute chibi character in a magical forest, vibrant colors, 3D render style, masterpiece"
];

    // ----- Theme handling -----
    function initTheme() {
        const saved = localStorage.getItem('genexus_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', saved);
        updateThemeIcon(saved);
    }

    function updateThemeIcon(theme) {
        els.btnTheme.innerHTML = theme === 'dark' ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
        lucide.createIcons();
    }

    initTheme();

    els.btnTheme.onclick = () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('genexus_theme', next);
        updateThemeIcon(next);
    };

    // ----- Mobile drawer (bottom sheet) with drag handle -----
    let isDragging = false;
    let dragStartY = 0;
    let drawerOffset = 0;

    function openDrawer() {
        els.settingsDrawer.classList.add('active');
        els.drawerOverlay.classList.add('active');
        els.settingsDrawer.style.transform = 'translateY(0)';
        drawerOffset = 0;
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
        els.settingsDrawer.classList.remove('active');
        els.drawerOverlay.classList.remove('active');
        els.settingsDrawer.style.transform = '';
        drawerOffset = 0;
        document.body.style.overflow = '';
    }

    els.btnSettingsMobile.onclick = openDrawer;
    els.closeSettings.onclick = closeDrawer;
    els.drawerOverlay.onclick = closeDrawer;

    const handle = els.dragHandle;
    const drawer = els.settingsDrawer;

    function onDragStart(e) {
        if (!drawer.classList.contains('active')) return;
        isDragging = true;
        dragStartY = e.touches ? e.touches[0].clientY : e.clientY;
        document.body.style.userSelect = 'none';
    }

    function onDragMove(e) {
        if (!isDragging) return;
        e.preventDefault();
        const currentY = e.touches ? e.touches[0].clientY : e.clientY;
        const delta = currentY - dragStartY;
        const maxOffset = window.innerHeight * 0.4;
        let newOffset = Math.min(Math.max(0, delta), maxOffset);
        drawerOffset = newOffset;
        drawer.style.transform = `translateY(${newOffset}px)`;
    }

    function onDragEnd(e) {
        if (!isDragging) return;
        isDragging = false;
        document.body.style.userSelect = '';
        const threshold = window.innerHeight * 0.1;
        if (drawerOffset > threshold) {
            closeDrawer();
        } else {
            drawer.style.transform = 'translateY(0)';
            drawerOffset = 0;
        }
    }

    handle.addEventListener('mousedown', onDragStart);
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);

    handle.addEventListener('touchstart', onDragStart, { passive: false });
    window.addEventListener('touchmove', onDragMove, { passive: false });
    window.addEventListener('touchend', onDragEnd, { passive: false });

    handle.addEventListener('touchmove', (e) => {
        if (isDragging) e.preventDefault();
    }, { passive: false });

    // ----- Image generation -----
    els.btnGenerate.onclick = generateImages;

    async function generateImages() {
        const prompt = els.promptInput.value.trim();
        if (!prompt) return showToast('Please enter a prompt!', 'error');

        setLoading(true);

        const qualityMap = {
            low: 'simple, basic',
            medium: 'highly detailed, 4k',
            high: 'masterpiece, ultra-detailed, cinematic lighting, 8k, hyper-realistic, intricate textures'
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

            if (validUrls.length === 0) throw new Error('API returned no images');

            els.emptyState.classList.add('hidden');
            validUrls.forEach(url => {
                const card = createResultCard(url, prompt);
                els.resultsGrid.prepend(card);
            });

            if (validUrls[0]) addToHistory(prompt, validUrls[0]);
            showToast(`Generated ${validUrls.length} images!`);
            closeDrawer();

        } catch (err) {
            console.error(err);
            showToast('Generation failed. Try again.', 'error');
        } finally {
            setLoading(false);
        }
    }

    // Calls the backend API using the Flux model
    async function fetchImage(prompt, seed) {
        const baseUrl = 'https://genexus-ai.onrender.com/api/images/generate';
        const params = new URLSearchParams({
            prompt,
            model: 'flux',
            seed,
            width: state.width,
            height: state.height
        });

        try {
            const res = await fetch(`${baseUrl}?${params.toString()}`);
            if (!res.ok) return null;
            const type = res.headers.get('content-type');

            if (type?.includes('application/json')) {
                const data = await res.json();
                return data.url || data.image || data.imageUrl || null;
            }
            if (type?.includes('image')) {
                const blob = await res.blob();
                return URL.createObjectURL(blob);
            }
            const text = await res.text();
            return text.startsWith('data:image') ? text : null;
        } catch (e) {
            return null;
        }
    }

    // ----- UI components -----
    function createResultCard(url, prompt) {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <img src="${url}" alt="AI generated artwork" loading="lazy" />
            <div class="result-overlay">
                <button class="action-icon-btn dl-btn" title="Download"><i data-lucide="download"></i></button>
                <button class="action-icon-btn cp-btn" title="Copy Prompt"><i data-lucide="copy"></i></button>
            </div>
        `;
        setTimeout(() => lucide.createIcons(), 0);

        card.querySelector('.dl-btn').onclick = () => download(url);
        card.querySelector('.cp-btn').onclick = () => {
            navigator.clipboard.writeText(prompt);
            showToast('Prompt copied!');
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
            showToast('Download started!');
        } catch (e) {
            showToast('Download failed.', 'error');
        }
    }

    // ----- Settings controls -----
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

    // ----- History (stored in localStorage) -----
    function addToHistory(prompt, img) {
        state.history.unshift({ prompt, img });
        if (state.history.length > 20) state.history.pop();
        localStorage.setItem('genexus_history', JSON.stringify(state.history));
        renderHistory();
    }

    function renderHistory() {
        els.historyList.innerHTML = state.history.length
            ? ''
            : '<p style="text-align:center; font-size:0.8rem; color:var(--text-muted);">No history</p>';
        state.history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `<img src="${item.img}" loading="lazy" />`;
            div.onclick = () => { els.promptInput.value = item.prompt; };
            els.historyList.appendChild(div);
        });
    }
    renderHistory();

    // ----- Toast notifications -----
    function showToast(msg, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerText = msg;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // ----- Extra controls -----
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