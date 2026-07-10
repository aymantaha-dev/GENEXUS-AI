/**
 * GENEXUS UI - Core logic with IndexedDB persistence
 * Manages image generation, history, settings, and theme with permanent storage.
 */

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    // ===== Connection Check & Loading Screen =====
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent = document.getElementById('main-content');
    
    function checkConnection() {
        return new Promise((resolve) => {
            // Check if navigator is online
            if (!navigator.onLine) {
                resolve(false);
                return;
            }
            
            // Try to fetch a small resource to verify actual connectivity
            fetch('https://www.google.com/favicon.ico', { 
                mode: 'no-cors',
                cache: 'no-store'
            })
            .then(() => resolve(true))
            .catch(() => {
                // If fetch fails, try a simple HEAD request to the same origin
                fetch('/', { method: 'HEAD', cache: 'no-store' })
                    .then(() => resolve(true))
                    .catch(() => resolve(false));
            });
            
            // Fallback: if fetch takes too long
            setTimeout(() => resolve(false), 3000);
        });
    }
    
    async function initApp() {
        // Show loading screen
        if (loadingScreen) {
            loadingScreen.classList.remove('hidden');
        }
        
        // Check connection
        const isOnline = await checkConnection();
        
        if (isOnline) {
            // Hide loading screen with animation
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
            }
            if (mainContent) {
                mainContent.style.display = 'block';
            }
            
            // Initialize the app
            await initializeApp();
        } else {
            // Redirect to offline page
            window.location.href = 'offscreen.html';
        }
    }

    // ---- DOM refs ----
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

    // ---- Application state (runtime) ----
    const state = {
        ratioType: 'ultrawide', // Current ratio type
        baseWidth: 3840,
        baseHeight: 1080,
        currentWidth: 3840,
        currentHeight: 1080,
        count: 1,
        quality: 'medium',
        theme: 'dark',
        images: []
    };

    // ---- Quality multipliers ----
    const qualityMultipliers = {
        low: 0.25,
        medium: 0.5,
        high: 1.0
    };

    // ---- Base dimensions for each ratio ----
    const ratioBaseDimensions = {
        'square': { w: 1024, h: 1024 },
        'portrait': { w: 1024, h: 1536 },
        'wide': { w: 2560, h: 1080 },
        'landscape': { w: 2048, h: 1152 },
        'long-portrait': { w: 1024, h: 2048 },
        'ultrawide': { w: 3840, h: 1080 }
    };

    // ---- Calculate dimensions based on ratio and quality ----
    function calculateDimensions(ratioType, quality) {
        const base = ratioBaseDimensions[ratioType];
        if (!base) return { w: 1024, h: 1024 };
        
        const multiplier = qualityMultipliers[quality] || 0.5;
        
        return {
            w: Math.round(base.w * multiplier),
            h: Math.round(base.h * multiplier)
        };
    }

    // ---- Update dimensions in state ----
    function updateDimensions() {
        const dims = calculateDimensions(state.ratioType, state.quality);
        state.currentWidth = dims.w;
        state.currentHeight = dims.h;
        console.log(`Dimensions updated: ${dims.w}x${dims.h} (${state.ratioType}, ${state.quality})`);
    }

    // ---- IndexedDB helpers ----
    const DB_NAME = 'GenexusDB';
    const DB_VERSION = 1;
    let db = null;

    function openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('images')) {
                    const store = db.createObjectStore('images', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('timestamp', 'timestamp');
                }
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };
            request.onsuccess = (e) => {
                db = e.target.result;
                resolve(db);
            };
            request.onerror = (e) => reject(e.target.error);
        });
    }

    function dbPut(storeName, data) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.put(data);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    function dbGetAll(storeName) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    function dbDelete(storeName, id) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.delete(id);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }

    function dbGet(storeName, key) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    // ---- Save / load settings ----
    async function saveSettings() {
        if (!db) return;
        const settings = {
            key: 'app-settings',
            ratioType: state.ratioType,
            baseWidth: state.baseWidth,
            baseHeight: state.baseHeight,
            count: state.count,
            quality: state.quality,
            theme: state.theme
        };
        await dbPut('settings', settings);
    }

    async function loadSettings() {
        if (!db) return;
        const saved = await dbGet('settings', 'app-settings');
        if (saved) {
            state.ratioType = saved.ratioType || 'ultrawide';
            state.baseWidth = saved.baseWidth || 3840;
            state.baseHeight = saved.baseHeight || 1080;
            state.count = saved.count || 1;
            state.quality = saved.quality || 'medium';
            state.theme = saved.theme || 'dark';
            
            // Update dimensions based on loaded settings
            updateDimensions();
            
            // apply to UI
            applySettingsToUI();
            applyTheme(state.theme);
        } else {
            // First time - set default dimensions
            updateDimensions();
        }
    }

    function applySettingsToUI() {
        // Ratio buttons
        els.ratioBtns.forEach(btn => {
            const type = btn.dataset.type;
            if (type === state.ratioType) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        // Quality buttons
        els.qualityBtns.forEach(btn => {
            if (btn.dataset.quality === state.quality) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        // Count buttons
        els.countBtns.forEach(btn => {
            if (parseInt(btn.dataset.count) === state.count) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        updateThemeIcon(theme);
    }

    // ---- Image storage ----
    async function saveImageToDB(prompt, dataUrl) {
        if (!db) return null;
        const entry = {
            prompt: prompt,
            url: dataUrl,
            timestamp: Date.now()
        };
        const id = await dbPut('images', entry);
        return id;
    }

    async function loadAllImages() {
        if (!db) return [];
        const all = await dbGetAll('images');
        all.sort((a, b) => b.timestamp - a.timestamp);
        return all;
    }

    async function deleteImageFromDB(id) {
        if (!db) return;
        await dbDelete('images', id);
    }

    // ---- Render gallery from DB ----
    async function renderGallery() {
        const images = await loadAllImages();
        state.images = images;
        els.resultsGrid.innerHTML = '';
        if (images.length === 0) {
            els.emptyState.classList.remove('hidden');
            return;
        }
        els.emptyState.classList.add('hidden');
        images.forEach(img => {
            const card = createResultCard(img.url, img.prompt, img.id);
            els.resultsGrid.appendChild(card);
        });
        lucide.createIcons();
    }

    // ---- Create result card with delete button ----
    function createResultCard(url, prompt, id) {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.dataset.id = id;
        card.innerHTML = `
            <img src="${url}" alt="AI generated artwork" loading="lazy" />
            <div class="result-overlay">
                <button class="action-icon-btn dl-btn" title="Download"><i data-lucide="download"></i></button>
                <button class="action-icon-btn cp-btn" title="Copy Prompt"><i data-lucide="copy"></i></button>
                <button class="action-icon-btn del-btn" title="Delete"><i data-lucide="trash-2"></i></button>
            </div>
        `;
        card.querySelector('.dl-btn').onclick = (e) => {
            e.stopPropagation();
            download(url);
        };
        card.querySelector('.cp-btn').onclick = (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(prompt);
            showToast('Prompt copied!');
        };
        const delBtn = card.querySelector('.del-btn');
        delBtn.onclick = (e) => {
            e.stopPropagation();
            showDeleteConfirmation(id, card);
        };
        return card;
    }

    // ---- Delete confirmation modal ----
    function showDeleteConfirmation(id, cardElement) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-box">
                <h3>Delete Image</h3>
                <p>Are you sure you want to delete this image permanently?</p>
                <div class="modal-actions">
                    <button class="modal-btn cancel-btn">Cancel</button>
                    <button class="modal-btn confirm-btn">Delete</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const cancelBtn = overlay.querySelector('.cancel-btn');
        const confirmBtn = overlay.querySelector('.confirm-btn');

        const closeModal = () => {
            overlay.remove();
        };

        cancelBtn.onclick = closeModal;
        overlay.onclick = (e) => {
            if (e.target === overlay) closeModal();
        };

        confirmBtn.onclick = async () => {
            try {
                await deleteImageFromDB(id);
                if (cardElement && cardElement.parentNode) {
                    cardElement.remove();
                }
                if (els.resultsGrid.children.length === 0) {
                    els.emptyState.classList.remove('hidden');
                }
                showToast('Image deleted.');
            } catch (err) {
                console.error('Delete error:', err);
                showToast('Failed to delete image.', 'error');
            }
            closeModal();
        };
    }

    // ---- Toast ----
    function showToast(msg, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerText = msg;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // ---- Download helper ----
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

    // ---- Generation ----
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

            for (let url of validUrls) {
                let dataUrl = url;
                if (url.startsWith('blob:')) {
                    const resp = await fetch(url);
                    const blob = await resp.blob();
                    dataUrl = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                    });
                } else if (!url.startsWith('data:image')) {
                    const resp = await fetch(url);
                    const blob = await resp.blob();
                    dataUrl = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                    });
                }
                await saveImageToDB(prompt, dataUrl);
            }

            await renderGallery();
            showToast(`Generated ${validUrls.length} images!`);
            closeDrawer();

        } catch (err) {
            console.error(err);
            showToast('Generation failed. Try again.', 'error');
        } finally {
            setLoading(false);
        }
    }

    // ---- API call with Flux model ----
    async function fetchImage(prompt, seed) {
        const baseUrl = 'https://genexus-ai.onrender.com/api/images/generate';
        const params = new URLSearchParams({
            prompt,
            model: 'flux',
            seed,
            width: state.currentWidth,
            height: state.currentHeight
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

    function setLoading(isLoading) {
        els.btnGenerate.disabled = isLoading;
        els.genText.classList.toggle('hidden', isLoading);
        els.genLoader.classList.toggle('hidden', !isLoading);
    }

    // ---- Theme toggle ----
    els.btnTheme.onclick = async () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        state.theme = next;
        applyTheme(next);
        await saveSettings();
    };

    function updateThemeIcon(theme) {
        els.btnTheme.innerHTML = theme === 'dark' ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
        lucide.createIcons();
    }

    // ---- Settings listeners (save to DB on change) ----
    els.ratioBtns.forEach(btn => {
        btn.onclick = async () => {
            els.ratioBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.ratioType = btn.dataset.type;
            // Update dimensions based on new ratio and current quality
            updateDimensions();
            await saveSettings();
            console.log(`Ratio changed to: ${state.ratioType}, dimensions: ${state.currentWidth}x${state.currentHeight}`);
        };
    });

    els.qualityBtns.forEach(btn => {
        btn.onclick = async () => {
            els.qualityBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.quality = btn.dataset.quality;
            // Update dimensions based on current ratio and new quality
            updateDimensions();
            await saveSettings();
            console.log(`Quality changed to: ${state.quality}, dimensions: ${state.currentWidth}x${state.currentHeight}`);
        };
    });

    els.countBtns.forEach(btn => {
        btn.onclick = async () => {
            els.countBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.count = parseInt(btn.dataset.count);
            await saveSettings();
        };
    });

    // ---- Mobile drawer ----
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

    // ---- Random prompt ----
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
        "Cute chibi character in a magical forest, vibrant colors, 3D render style, masterpiece",
        
        // EXTRA: PORTRAIT & CHARACTER
        "Regal portrait of an elven queen, silver crown, flowing hair, ethereal beauty, fantasy, 8k",
        "Gritty post-apocalyptic survivor, gas mask, wasteland, cinematic, hyper-realistic",
        "Ancient Greek warrior, bronze armor, sunset battlefield, heroic pose, epic cinematic",
        "Mysterious hooded figure, glowing eyes, dark fantasy, magic aura, highly detailed",
        "Vibrant Bollywood dancer, colorful saree, dynamic movement, dramatic lighting, 8k",

        // EXTRA: NATURE & LANDSCAPE
        "Aurora borealis over snowy mountains, starry sky, reflection on ice, magical, 8k",
        "Tropical waterfall in a hidden jungle, mist, rainbow, exotic plants, vibrant colors",
        "Desert dunes at sunrise, golden sand, endless horizon, peaceful, cinematic, 8k",
        "Cherry blossom garden in spring, pink petals, soft breeze, romantic atmosphere",
        "Volcano erupting at night, lava flowing, lightning storm, dramatic, epic scale, 8k",

        // EXTRA: ABSTRACT & CONCEPTUAL
        "Abstract representation of time, melting clocks, cosmic background, surreal, dreamy",
        "Futuristic city made of holographic data streams, glowing blue, cyberpunk, 8k",
        "Underwater fantasy kingdom, mermaids, coral castles, bioluminescent, magical",
        "Steampunk airship flying through clouds, brass gears, glowing lanterns, adventure",
        "Ethereal being made of pure light, cosmic particles, angelic, divine, 8k"
    ];

    els.btnRandom.onclick = () => {
        const s = premiumPrompts[Math.floor(Math.random() * premiumPrompts.length)];
        els.promptInput.value = s;
    };
    els.btnClear.onclick = () => els.promptInput.value = '';
    els.btnGallery.onclick = () => els.gallerySection.scrollIntoView({ behavior: 'smooth' });

    // ---- Clear history (clear all images) ----
    els.clearHistoryBtn.onclick = async () => {
        if (!db) return;
        const images = await loadAllImages();
        if (images.length === 0) return;
        if (!confirm('Delete all images from history?')) return;
        for (let img of images) {
            await dbDelete('images', img.id);
        }
        await renderGallery();
        showToast('History cleared.');
    };

    // ---- Initialize App ----
    async function initializeApp() {
        await openDB();
        await loadSettings();
        await renderGallery();
        updateThemeIcon(state.theme);
        document.documentElement.setAttribute('data-theme', state.theme);
        console.log('App initialized with dimensions:', state.currentWidth, 'x', state.currentHeight);
    }

    // ---- Start the app with connection check ----
    initApp();
    
    // =============================================
    // PWA - Progressive Web App Functionality
    // =============================================

    const pwaBanner = document.getElementById('pwa-banner');
    const pwaInstallBtn = document.getElementById('pwa-install-btn');
    const pwaCloseBtn = document.getElementById('pwa-close-btn');
    const pwaUpdate = document.getElementById('pwa-update');
    const pwaUpdateBtn = document.getElementById('pwa-update-btn');

    let deferredPrompt = null;

    function showPWAInstallBanner() {
        if (pwaBanner) {
            pwaBanner.style.display = 'flex';
        }
    }

    function hidePWAInstallBanner() {
        if (pwaBanner) {
            pwaBanner.style.display = 'none';
        }
    }

    function showPWAUpdateNotification() {
        if (pwaUpdate) {
            pwaUpdate.style.display = 'flex';
        }
    }

    function hidePWAUpdateNotification() {
        if (pwaUpdate) {
            pwaUpdate.style.display = 'none';
        }
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        setTimeout(showPWAInstallBanner, 1500);
    });

    if (pwaInstallBtn) {
        pwaInstallBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const result = await deferredPrompt.userChoice;
                if (result.outcome === 'accepted') {
                    console.log('[PWA] User accepted the install prompt');
                    hidePWAInstallBanner();
                    showToast('App installed successfully! 🎉');
                } else {
                    console.log('[PWA] User dismissed the install prompt');
                }
                deferredPrompt = null;
            }
        });
    }

    if (pwaCloseBtn) {
        pwaCloseBtn.addEventListener('click', hidePWAInstallBanner);
    }

    window.addEventListener('appinstalled', () => {
        console.log('[PWA] GENEXUS UI was installed');
        hidePWAInstallBanner();
        showToast('App installed successfully! 🎉');
    });

    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('[PWA] Running as installed PWA');
        hidePWAInstallBanner();
    }

    if ('serviceWorker' in navigator) {
        const isLocalhost = window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1';

        navigator.serviceWorker.register('./service-worker.js')
            .then((registration) => {
                console.log('[PWA] Service Worker registered successfully');

                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('[PWA] New update available');
                            showPWAUpdateNotification();
                        }
                    });
                });

                setInterval(() => {
                    registration.update();
                }, 60000);

            })
            .catch((error) => {
                if (!isLocalhost) {
                    console.log('[PWA] Service Worker registration failed:', error);
                } else {
                    console.log('[PWA] Service Worker not registered (localhost mode)');
                }
            });

        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                refreshing = true;
                console.log('[PWA] Update applied, reloading...');
                window.location.reload();
            }
        });
    }

    if (pwaUpdateBtn) {
        pwaUpdateBtn.addEventListener('click', () => {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistration().then((registration) => {
                    if (registration && registration.waiting) {
                        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    }
                });
            }
            hidePWAUpdateNotification();
            window.location.reload();
        });
    }

    window.addEventListener('online', () => {
        console.log('[PWA] Back online');
        showToast('Back online! 🌐');
    });

    window.addEventListener('offline', () => {
        console.log('[PWA] Offline');
        showToast('You are offline. Using cached content.', 'error');
    });
});