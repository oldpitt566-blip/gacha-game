document.addEventListener('DOMContentLoaded', () => {
    // --- Game Elements ---
    const getCoinBtn = document.getElementById('get-coin-btn');
    const coinArea = document.getElementById('coin-area');
    const coinSlot = document.getElementById('coin-slot');
    const gachaMachine = document.getElementById('gacha-machine');
    const handleContainer = document.getElementById('handle-container');
    const handle = document.getElementById('handle');
    const capsuleExit = document.getElementById('capsule-exit');
    const prizeDisplay = document.getElementById('prize-display');
    const capsuleTray = document.getElementById('capsule-tray');
    const requiredCoinsDisplay = document.getElementById('required-coins-display');

    // --- Settings Elements ---
    const settingsBtn = document.getElementById('settings-btn');
    const passwordModal = document.getElementById('password-modal');
    const passwordInput = document.getElementById('password-input');
    const passwordSubmit = document.getElementById('password-submit');
    const settingsPanel = document.getElementById('settings-panel');
    const settingsForm = document.getElementById('settings-form');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const closeBtns = document.querySelectorAll('.close-btn');

    // --- Game State ---
    let coinsInSlot = 0;
    let requiredCoins = 0;
    let isTurning = false;
    let startAngle = 0;
    let currentAngle = 0;
    let accumulatedAngle = 0;

    // --- Stats Data ---
    let stats = {
        timesPlayed: 0,
        coinsSpent: 0,
        prizeCounts: {} // Stores counts for each prize name/image
    };

    // --- Prize Data ---
    let prizes = []; // Unified array to store prize objects { text, image, rarity }

    const NUM_DEFAULT_PRIZES = 20;
    const NUM_USER_PRIZE_SLOTS = 10; // Allowing for 10 user-configurable slots
    const TOTAL_PRIZE_SLOTS = NUM_DEFAULT_PRIZES + NUM_USER_PRIZE_SLOTS;


    // --- Prize Data ---
    const defaultPrizeData = [
        { text: "公仔", image: "01.jpg", rarity: "common" },
        { text: "饅頭", image: "02.jpg", rarity: "common" },
        { text: "猴子", image: "03.jpg", rarity: "common" },
        { text: "眼藥水", image: "04.jpg", rarity: "common" },
        { text: "警車", image: "05.jpg", rarity: "common" },
        { text: "外星人", image: "06.jpg", rarity: "common" },
        { text: "卡比", image: "07.jpg", rarity: "common" },
        { text: "塑膠飛機", image: "08.jpg", rarity: "common" },
        { text: "小恐龍", image: "09.jpg", rarity: "common" },
        { text: "木箱", image: "10.jpg", rarity: "common" },
        { text: "小兔兔", image: "11.jpg", rarity: "common" },
        { text: "太空人", image: "12.jpg", rarity: "common" },
        { text: "拖鞋一隻", image: "13.jpg", rarity: "common" },
        { text: "休旅車", image: "14.jpg", rarity: "common" },
        { text: "空的扭蛋殼", image: "empty.jpg", rarity: "uncommon" },
        { text: "花花一支", image: "flower.jpg", rarity: "common" },
        { text: "和爸爸牽手", image: "handshake.jpg", rarity: "rare" },
        { text: "和爸爸親親", image: "kiss.jpg", rarity: "rare" },
        { text: "和哥哥玩", image: "play.jpg", rarity: "common" },
        { text: "和爸爸抱抱", image: "hug.jpg", rarity: "rare" }
    ];
    
    // --- Shared Functions ---
    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    // --- Event Handler Logic ---
    const createCoinFunction = () => {
        // Clear existing non-slot coins before spawning new ones
        document.querySelectorAll('.coin').forEach(c => {
            // Only remove coins that are not already in the slot
            if (c.parentNode === document.body) { // Coins in slot are removed when dropped
                c.remove();
            }
        });

        const existingCoinsInSlot = coinsInSlot; // Keep track of coins already in slot
        const coinsToSpawnCount = Math.floor(Math.random() * 6) + 10; // 10 to 15 coins

        let mainCoinsSpawned = 0;
        const mainCoinsNeeded = requiredCoins - existingCoinsInSlot; // How many more coin.png are needed

        // First, spawn the guaranteed 'coin.png'
        for (let i = 0; i < mainCoinsNeeded; i++) {
            createCoin('coin');
            mainCoinsSpawned++;
        }

        // Then, spawn the remaining coins randomly
        for (let i = 0; i < (coinsToSpawnCount - mainCoinsSpawned); i++) {
            const coinTypes = ['coin', '1yen', '50yen'];
            const randomType = coinTypes[Math.floor(Math.random() * coinTypes.length)];
            createCoin(randomType);
        }
    };

    const resetGameAndUI = () => {
        prizeDisplay.style.display = 'none';
        gachaMachine.classList.remove('faded');
        getCoinBtn.textContent = '跟爸爸拿錢';
        getCoinBtn.removeEventListener('click', resetGameAndUI);
        getCoinBtn.addEventListener('click', createCoinFunction);
        getCoinBtn.style.display = 'block';
        resetGame();
    };

    // --- Main Logic ---
    function initialize() {
        localStorage.removeItem('gachaPrizes'); // Clear old prize data if it exists
        localStorage.removeItem('gachaUserPrizes'); // Clear user prize data to ensure fresh start with defaults
        
        loadPrizes();
        loadStats(); // Load statistics
        updateGachaCounter(); // Display initial play count
        addEventListeners();
        startNewTurn();
    }

    // --- Stats Management ---
    function loadStats() {
        const savedStats = localStorage.getItem('gachaStats');
        if (savedStats) {
            stats = JSON.parse(savedStats);
        } else {
            stats = {
                timesPlayed: 0,
                coinsSpent: 0,
                prizeCounts: {}
            };
        }
    }

    function saveStats() {
        localStorage.setItem('gachaStats', JSON.stringify(stats));
    }

    function updateGachaCounter() {
        document.getElementById('times-played').textContent = stats.timesPlayed;
    }

    function startNewTurn() {
        coinsInSlot = 0;
        const possibleValues = [3, 4, 5]; // This means 300, 400, or 500 yen
        requiredCoins = possibleValues[Math.floor(Math.random() * possibleValues.length)];
        requiredCoinsDisplay.textContent = `${requiredCoins * 100}yen`; // Display in Yen
        requiredCoinsDisplay.classList.remove('ready');
        gachaMachine.classList.remove('faded');
        handleContainer.classList.add('disabled');
        currentAngle = 0;
        accumulatedAngle = 0;
        handleContainer.style.transform = 'translateX(-50%) rotate(0deg)';
    }

    function loadPrizes() {
        // Initialize prizes array with empty slots up to TOTAL_PRIZE_SLOTS
        // Assign default rarity "common" to all new empty slots
        prizes = Array.from({ length: TOTAL_PRIZE_SLOTS }, () => ({ text: null, image: null, rarity: "common" }));

        // Populate with default prizes from defaultPrizeData
        defaultPrizeData.forEach((defaultPrize, index) => {
            if (index < NUM_DEFAULT_PRIZES) { // Ensure we don't go beyond default prizes count
                prizes[index] = { ...defaultPrize };
            }
        });

        // Load user-saved prizes for configurable slots
        const savedUserPrizes = localStorage.getItem('gachaUserPrizes');
        if (savedUserPrizes) {
            const userPrizesArray = JSON.parse(savedUserPrizes);
            userPrizesArray.forEach((userPrize, index) => {
                const prizeIndex = NUM_DEFAULT_PRIZES + index;
                if (prizeIndex < TOTAL_PRIZE_SLOTS && userPrize) {
                    // Ensure user prizes also have a rarity, defaulting to "common"
                    prizes[prizeIndex] = { ...userPrize, rarity: userPrize.rarity || "common" };
                }
            });
        }
    }

    async function handleSettingsSave() {
        const prizeRows = settingsForm.querySelectorAll('.prize-setting');
        const userPrizesToSave = [];
        for (let i = NUM_DEFAULT_PRIZES; i < TOTAL_PRIZE_SLOTS; i++) {
            const row = prizeRows[i]; // Get the row corresponding to the user-configurable slot
            // If the row doesn't exist (e.g., fewer user slots displayed than configured),
            // use the existing prize data from the 'prizes' array
            if (!row) {
                userPrizesToSave.push(prizes[i] || { text: null, image: null, rarity: "common" });
                continue;
            }

            const nameInput = row.querySelector('input[type="text"]');
            const fileInput = row.querySelector('input[type="file"]');
            
            let prizeText = (nameInput && nameInput.value) ? nameInput.value : null;
            let prizeImage = prizes[i] ? prizes[i].image : null; // Keep existing image if not changed
            let prizeRarity = prizes[i] ? prizes[i].rarity : "common"; // Keep existing rarity

            const file = fileInput ? fileInput.files[0] : null;

            if (file) {
                prizeImage = await toBase64(file);
            } else if (row.dataset.imageRemoved === 'true') {
                prizeImage = null;
            }

            userPrizesToSave.push({ text: prizeText, image: prizeImage, rarity: prizeRarity });
        }
        
        // Update the main 'prizes' array with the newly saved user prizes
        // This ensures the current session's 'prizes' array is up-to-date
        userPrizesToSave.forEach((userPrize, index) => {
            prizes[NUM_DEFAULT_PRIZES + index] = userPrize;
        });

        localStorage.setItem('gachaUserPrizes', JSON.stringify(userPrizesToSave));
        alert('設定已儲存！');
        // settingsPanel.classList.add('hidden'); // Removed: user wants it to stay open after save
        loadPrizes(); // Reload to ensure prize data is consistent after save
    }

    function populateSettingsForm() {
        settingsForm.innerHTML = '';
        // Iterate through all prize slots, default and user-configurable
        for (let i = 0; i < TOTAL_PRIZE_SLOTS; i++) {
            const prize = prizes[i]; // Get the prize from the global 'prizes' array
            const prizeRow = document.createElement('div');
            prizeRow.className = 'prize-setting';
            prizeRow.dataset.index = i;
            prizeRow.dataset.imageRemoved = 'false'; // Reset this flag for each render

            const isFixed = i < NUM_DEFAULT_PRIZES; // Determine if it's a fixed default prize
            const hasContent = prize && (prize.text || prize.image);

            prizeRow.innerHTML = `
                <span class="prize-label">${i + 1}.</span>
                <input type="text" value="${(prize && prize.text) || ''}" ${isFixed ? 'readonly' : ''}>
                ${!isFixed ? `
                    <input type="file" accept="image/*" class="${(prize && prize.image) ? 'file-selected' : ''}">
                    ${(prize && prize.image) ? `<span class="image-selected-text">✅</span>` : ''}
                    ${(prize && prize.image) ? '<button type="button" class="prize-action-btn remove-image-btn">X</button>' : ''}
                    ${(prize && (prize.text || prize.image)) ? '<button type="button" class="prize-action-btn remove-btn">-</button>' : ''}
                ` : `
                    ${(prize && prize.text) || (prize && prize.image) ? '' : '<button type="button" class="prize-action-btn add-btn">+</button>'}
                `}
            `;
            settingsForm.appendChild(prizeRow);
        }
    }

    const getWeightedRandomPrize = (prizesArray) => {
        const rarityWeights = {
            "common": 1,
            "uncommon": 10, // empty.jpg (目標降低機率)
            "rare": 5     // handshake, kiss, hug (目標降低機率)
        };

        let totalWeight = 0;
        const weightedPrizes = [];

        prizesArray.forEach(prize => {
            const weight = rarityWeights[prize.rarity] || rarityWeights["common"]; // Default to common if rarity not defined
            totalWeight += weight;
            weightedPrizes.push({ prize: prize, weight: weight });
        });

        let randomNumber = Math.random() * totalWeight;

        for (let i = 0; i < weightedPrizes.length; i++) {
            randomNumber -= weightedPrizes[i].weight;
            if (randomNumber <= 0) {
                return weightedPrizes[i].prize;
            }
        }

        // Fallback in case of rounding errors or empty array, return a random one
        return prizesArray[Math.floor(Math.random() * prizesArray.length)];
    };

    function openCapsule(e, cap) {
        e.preventDefault();
        gachaMachine.classList.add('faded');
        cap.classList.add('opening');
        getCoinBtn.style.display = 'none';

        setTimeout(() => {
            const availablePrizes = prizes.filter(p => p.text || p.image);
            prizeDisplay.innerHTML = '';
            const title = document.createElement('h3');
            title.textContent = '恭喜獲得';
            prizeDisplay.appendChild(title);
            if (availablePrizes.length === 0) {
                const prizeText = document.createElement('div');
                prizeText.textContent = '沒有獎品了！';
                prizeDisplay.appendChild(prizeText);
            } else {
                const prizeData = getWeightedRandomPrize(availablePrizes);

                // Update prize counts
                let prizeKey = prizeData.text || prizeData.image; // Use text or image as key
                if (prizeKey) {
                    if (!stats.prizeCounts[prizeKey]) {
                        stats.prizeCounts[prizeKey] = 0;
                    }
                    stats.prizeCounts[prizeKey]++;
                    saveStats(); // Save stats after updating prize count
                }

                if (prizeData.image) {
                    const img = document.createElement('img');
                    img.src = prizeData.image;
                    prizeDisplay.appendChild(img);
                }
                if (prizeData.text) {
                    const prizeText = document.createElement('div');
                    prizeText.className = 'prize-text';
                    prizeText.textContent = prizeData.text;
                    prizeDisplay.appendChild(prizeText);
                }
            }
            
            const playAgainBtn = document.createElement('button');
            playAgainBtn.id = 'play-again-btn';
            playAgainBtn.textContent = '再來一次';
            prizeDisplay.appendChild(playAgainBtn);
            
            playAgainBtn.addEventListener('click', resetGameAndUI);

            prizeDisplay.style.display = 'flex';
            cap.remove();
        }, 800);
    }
    
    // --- Core Game Mechanics ---
    function createCoin(coinType = 'coin') { // Default to 'coin'
        const coin = document.createElement('div');
        coin.classList.add('coin');
        // Set background based on coinType
        if (coinType === '1yen') {
            coin.style.backgroundImage = 'url("1yen.png")';
            coin.classList.add('yen1'); // Add class for 1yen
        } else if (coinType === '50yen') {
            coin.style.backgroundImage = 'url("50yen.png")';
            coin.classList.add('yen50'); // Add class for 50yen
        } else { // 'coin'
            coin.style.backgroundImage = 'url("coin.png")';
        }
        coin.dataset.coinType = coinType; // Store type in dataset

        const coinAreaRect = coinArea.getBoundingClientRect();
        // Adjust bounds for smaller coins if they are 45px
        const coinHeight = (coinType === '1yen' || coinType === '50yen') ? 63 : 90;
        const coinWidth = (coinType === '1yen' || coinType === '50yen') ? 63 : 90;

        const randomTop = coinAreaRect.top + Math.random() * (coinAreaRect.height - coinHeight);
        const randomLeft = coinAreaRect.left + Math.random() * (coinAreaRect.width - coinWidth);
        coin.style.top = `${randomTop}px`;
        coin.style.left = `${randomLeft}px`;
        document.body.appendChild(coin);
        addCoinDragListeners(coin);
    }
    function addCoinDragListeners(coin) {
        let offsetX = 0, offsetY = 0, activeCoin = null;

        function startDrag(e) {
            activeCoin = coin;
            activeCoin.style.cursor = 'grabbing';
            activeCoin.style.zIndex = '1000';
            const touch = e.type === 'touchstart' ? e.touches[0] : e;
            const rect = activeCoin.getBoundingClientRect();
            offsetX = touch.clientX - rect.left;
            offsetY = touch.clientY - rect.top;
        }

        function drag(e) {
            if (!activeCoin) return;
            e.preventDefault();
            const touch = e.type === 'touchmove' ? e.touches[0] : e;
            activeCoin.style.left = `${touch.clientX - offsetX}px`;
            activeCoin.style.top = `${touch.clientY - offsetY}px`;
        }

        function endDrag() {
            if (!activeCoin) return;
            activeCoin.style.cursor = 'grab';
            const coinRect = activeCoin.getBoundingClientRect();
            const slotRect = coinSlot.getBoundingClientRect();

            if (coinRect.left < slotRect.right && coinRect.right > slotRect.left &&
                coinRect.top < slotRect.bottom && coinRect.bottom > slotRect.top) {
                
                if (activeCoin.dataset.coinType === 'coin') { // Only count 'coin' type
                    activeCoin.remove();
                    coinsInSlot++;
                    checkCoins();
                } else {
                    // Other coin types just disappear or bounce off, not counted for now
                    activeCoin.remove(); // Remove other coin types for simplicity
                }
            }
            activeCoin = null;
        }

        coin.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', drag, { passive: false });
        document.addEventListener('mouseup', endDrag);
        coin.addEventListener('touchstart', startDrag, { passive: false });
        document.addEventListener('touchmove', drag, { passive: false });
        document.addEventListener('touchend', endDrag);
    }
    function checkCoins() { if (coinsInSlot === requiredCoins) { handleContainer.classList.remove('disabled'); requiredCoinsDisplay.classList.add('ready'); } }
    function getAngle(cx, cy, ex, ey) { const dy = ey - cy; const dx = ex - cx; return Math.atan2(dy, dx) * 180 / Math.PI; }
    function resetGame() { startNewTurn(); }
    function dropCapsule() { const capsule = document.createElement('div'); capsule.classList.add('capsule'); const colors = ['#a29bfe', '#74b9ff', '#55efc4', '#ff7675', '#fd79a8', '#ffeaa7', '#fab1a0', '#00cec9', '#6c5ce7']; capsule.style.background = colors[Math.floor(Math.random() * colors.length)]; const exitRect = capsuleExit.getBoundingClientRect(); const trayRect = capsuleTray.getBoundingClientRect(); capsule.style.left = `${exitRect.left + (exitRect.width / 2) - 30}px`; capsule.style.top = `${exitRect.top}px`; document.body.appendChild(capsule); capsule.classList.add('capsule-drop'); capsule.style.transform = `translateY(${trayRect.top - exitRect.top + 5}px)`; capsule.addEventListener('animationend', () => addOpenListeners(capsule)); }
    function addOpenListeners(targetCapsule) { const handleOpen = (e) => { targetCapsule.removeEventListener('dblclick', handleOpen); targetCapsule.removeEventListener('touchend', handleTouchOpen); openCapsule(e, targetCapsule); }; const handleTouchOpen = (e) => { const currentTime = new Date().getTime(); if (currentTime - (targetCapsule.lastTap || 0) < 300) { handleOpen(e); } targetCapsule.lastTap = currentTime; }; targetCapsule.addEventListener('dblclick', handleOpen); targetCapsule.addEventListener('touchend', handleTouchOpen); }

    // --- Event Listeners ---
        function addEventListeners() {
            // --- Game Controls ---
            getCoinBtn.addEventListener('click', createCoinFunction);
    
            // --- Handle Turn Mechanics ---
            function startTurn(e) {
                if (handleContainer.classList.contains('disabled')) return;
                e.preventDefault();
                isTurning = true;
                document.querySelectorAll('.deco-capsule').forEach(c => c.classList.add('shake-animation'));
                const handleRect = handle.getBoundingClientRect();
                const handleCenterX = handleRect.left + handleRect.width / 2;
                const handleCenterY = handleRect.top + handleRect.height / 2;
                const touch = e.type === 'touchstart' ? e.touches[0] : e;
                startAngle = getAngle(handleCenterX, handleCenterY, touch.clientX, touch.clientY);
            }
    
            function doTurn(e) {
                if (!isTurning) return;
                e.preventDefault();
                const handleRect = handle.getBoundingClientRect();
                const handleCenterX = handleRect.left + handleRect.width / 2;
                const handleCenterY = handleRect.top + handleRect.height / 2;
                const touch = e.type === 'touchmove' ? e.touches[0] : e;
                const angle = getAngle(handleCenterX, handleCenterY, touch.clientX, touch.clientY);
                let delta = angle - startAngle;
                if (delta > 180) delta -= 360;
                else if (delta < -180) delta += 360;
                accumulatedAngle += delta;
                currentAngle += delta;
                startAngle = angle;
                handleContainer.style.transform = `translateX(-50%) rotate(${currentAngle}deg)`;
                if (accumulatedAngle >= 1080) {
                    endTurn();
                }
            }
    
            function endTurn() {
                if (!isTurning) return;
                isTurning = false;
                document.querySelectorAll('.deco-capsule').forEach(c => c.classList.remove('shake-animation'));
                if (accumulatedAngle >= 1080) {
                    handleContainer.classList.add('disabled');
                    dropCapsule();
    
                    // Update stats after a successful gacha pull
                    stats.timesPlayed++;
                    stats.coinsSpent += requiredCoins * 100; // Assuming each coin.png is 100yen
                    saveStats();
                    updateGachaCounter(); // Update the counter on the main screen
                } else {
                    handleContainer.style.transition = 'transform 0.3s ease-out';
                    handleContainer.style.transform = 'translateX(-50%) rotate(0deg)';
                    setTimeout(() => handleContainer.style.transition = 'none', 300);
                    currentAngle = 0;
                    accumulatedAngle = 0;
                }
            }
            handle.addEventListener('mousedown', startTurn);
            document.addEventListener('mousemove', doTurn, { passive: false });
            document.addEventListener('mouseup', endTurn);
            handle.addEventListener('touchstart', startTurn, { passive: false });
            document.addEventListener('touchmove', doTurn, { passive: false });
            document.addEventListener('touchend', endTurn);
    
            // --- Settings Panel ---
            settingsBtn.addEventListener('click', () => passwordModal.classList.remove('hidden'));
            passwordSubmit.addEventListener('click', () => {
                if (passwordInput.value === 'pitt') {
                    passwordModal.classList.add('hidden');
                    passwordInput.value = '';
                    populateSettingsForm();
                    settingsPanel.classList.remove('hidden');
                } else {
                    alert('密碼錯誤！');
                }
            });
            saveSettingsBtn.addEventListener('click', handleSettingsSave);

            const closeSettingsBtn = document.getElementById('close-settings-btn'); // Get the new close button
            closeSettingsBtn.addEventListener('click', () => { // Add listener for the new button
                settingsPanel.classList.add('hidden'); // Close settings panel
            });

            // This closeBtns.forEach now only handles password and stats modal
            closeBtns.forEach(btn => btn.addEventListener('click', () => {
                passwordModal.classList.add('hidden');
                // settingsPanel.classList.add('hidden'); // Removed, handled by closeSettingsBtn
                statsModal.classList.add('hidden'); // Also close stats modal if open
            }));
            settingsForm.addEventListener('click', (e) => {
                const settingRow = e.target.closest('.prize-setting');
                if (!settingRow) return;
                const index = parseInt(settingRow.dataset.index, 10);
    
                const isFixed = index < NUM_DEFAULT_PRIZES;
    
                if (isFixed) {
                    // Prevent any modifications to fixed prizes
                    return;
                }
    
                if (e.target.classList.contains('add-btn')) {
                    // Ensure a default rarity for new user prizes
                    prizes[index] = { text: `新獎品 ${index + 1}`, image: null, rarity: "common" };
                    populateSettingsForm();
                } else if (e.target.classList.contains('remove-btn')) {
                    // Clear the user-configurable prize slot
                    prizes[index] = { text: null, image: null, rarity: "common" };
                    populateSettingsForm();
                } else if (e.target.classList.contains('remove-image-btn')) {
                    // Only remove the image, keep text and rarity
                    if (prizes[index]) {
                        prizes[index].image = null;
                        settingRow.dataset.imageRemoved = 'true'; // Keep for handleSettingsSave logic
                    }
                    populateSettingsForm();
                }
            });
            settingsForm.addEventListener('change', (e) => {
                if (e.target.matches('input[type="file"]')) {
                    if (e.target.files.length > 0) {
                        e.target.classList.add('file-selected');
                    } else {
                        e.target.classList.remove('file-selected');
                    }
                }
            });
    
            // --- Stats Modal Controls ---
            const showStatsBtn = document.getElementById('show-stats-btn');
            const statsModal = document.getElementById('stats-modal');
            const statsTimesPlayed = document.getElementById('stats-times-played');
            const statsCoinsSpent = document.getElementById('stats-coins-spent');
            const statsPrizeCounts = document.getElementById('stats-prize-counts');
            const resetStatsBtn = document.getElementById('reset-stats-btn');
    
            showStatsBtn.addEventListener('click', () => {
                updateStatsDisplay();
                statsModal.classList.remove('hidden');
            });
            resetStatsBtn.addEventListener('click', resetStats);
        }
    
        function updateStatsDisplay() {
            loadStats(); // Ensure latest stats are loaded
                    document.getElementById('stats-times-played').textContent = stats.timesPlayed;
                    document.getElementById('stats-coins-spent').textContent = `${stats.coinsSpent} yen`; // Display total amount in yen    
            const prizeCountsList = document.getElementById('stats-prize-counts');
            prizeCountsList.innerHTML = ''; // Clear previous list
    
            // Sort prize counts for better readability (optional)
            const sortedPrizeKeys = Object.keys(stats.prizeCounts).sort((a, b) => stats.prizeCounts[b] - stats.prizeCounts[a]);
    
            sortedPrizeKeys.forEach(key => {
                const listItem = document.createElement('li');
                listItem.textContent = `${key}: ${stats.prizeCounts[key]} 次`;
                prizeCountsList.appendChild(listItem);
            });
        }
    
        function resetStats() {
            if (confirm('確定要重置所有統計數據嗎？此操作無法撤銷。')) {
                stats = {
                    timesPlayed: 0,
                    coinsSpent: 0,
                    prizeCounts: {}
                };
                saveStats();
                updateGachaCounter();
                updateStatsDisplay();
                alert('統計數據已重置！');
            }
        }
    
    initialize();
});