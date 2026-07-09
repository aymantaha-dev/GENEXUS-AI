/**
 * GENEXUS UI - Core logic with IndexedDB persistence
 * Manages image generation, history, settings, and theme with permanent storage.
 */

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

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
        width: 512,
        height: 512,
        count: 1,
        quality: 'medium',
        theme: 'dark',
        images: []          // will hold { id, prompt, url, timestamp }
    };

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
            width: state.width,
            height: state.height,
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
            state.width = saved.width || 512;
            state.height = saved.height || 512;
            state.count = saved.count || 1;
            state.quality = saved.quality || 'medium';
            state.theme = saved.theme || 'dark';
            // apply to UI
            applySettingsToUI();
            applyTheme(state.theme);
        }
    }

    function applySettingsToUI() {
        // Ratio buttons
        els.ratioBtns.forEach(btn => {
            const w = parseInt(btn.dataset.w);
            const h = parseInt(btn.dataset.h);
            if (w === state.width && h === state.height) {
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
            url: dataUrl,          // base64 encoded image
            timestamp: Date.now()
        };
        const id = await dbPut('images', entry);
        return id;
    }

    async function loadAllImages() {
        if (!db) return [];
        const all = await dbGetAll('images');
        // sort by timestamp descending (newest first)
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
        // re-create lucide icons for new cards
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
        // Download
        card.querySelector('.dl-btn').onclick = (e) => {
            e.stopPropagation();
            download(url);
        };
        // Copy prompt
        card.querySelector('.cp-btn').onclick = (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(prompt);
            showToast('Prompt copied!');
        };
        // Delete with confirmation
        const delBtn = card.querySelector('.del-btn');
        delBtn.onclick = (e) => {
            e.stopPropagation();
            showDeleteConfirmation(id, card);
        };
        return card;
    }

    // ---- Delete confirmation modal ----
    function showDeleteConfirmation(id, cardElement) {
        // Create modal overlay
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
        // Click outside to close
        overlay.onclick = (e) => {
            if (e.target === overlay) closeModal();
        };

        confirmBtn.onclick = async () => {
            try {
                await deleteImageFromDB(id);
                // Remove card from DOM
                if (cardElement && cardElement.parentNode) {
                    cardElement.remove();
                }
                // Check if gallery is empty
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

            // Save each image to IndexedDB as base64
            for (let url of validUrls) {
                // Convert blob URL or data URL to base64 if needed
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
                    // fallback: fetch as blob then to dataURL
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

            // Re-render gallery
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
            state.width = parseInt(btn.dataset.w);
            state.height = parseInt(btn.dataset.h);
            await saveSettings();
        };
    });

    els.qualityBtns.forEach(btn => {
        btn.onclick = async () => {
            els.qualityBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.quality = btn.dataset.quality;
            await saveSettings();
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
        // Confirm
        if (!confirm('Delete all images from history?')) return;
        for (let img of images) {
            await dbDelete('images', img.id);
        }
        await renderGallery();
        showToast('History cleared.');
    };

    // ---- Init ----
    async function init() {
        await openDB();
        await loadSettings();
        await renderGallery();
        // update theme icon
        updateThemeIcon(state.theme);
        // apply current theme
        document.documentElement.setAttribute('data-theme', state.theme);
    }

    init().catch(console.error);
});