document.addEventListener('DOMContentLoaded', () => {
    // --- Game Elements ---
    const getCoinBtn = document.getElementById('get-coin-btn');
    const coinArea = document.getElementById('coin-area');
    const coinSlot = document.getElementById('coin-slot');
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

    // --- Prize Data ---
    let prizes = [];
    const defaultPrizes = ["爸爸親親", "爸爸抱抱", "爸爸牽手手"];
    
    // --- Shared Functions ---
    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    // --- Main Logic ---
    function initialize() {
        loadPrizes();
        addEventListeners();
        startNewTurn();
    }

    function startNewTurn() {
        coinsInSlot = 0;
        const possibleValues = [3, 4, 5];
        requiredCoins = possibleValues[Math.floor(Math.random() * possibleValues.length)];
        
        requiredCoinsDisplay.textContent = requiredCoins;
        requiredCoinsDisplay.classList.remove('ready');
        handleContainer.classList.add('disabled');
        
        // Reset from previous turn
        currentAngle = 0;
        accumulatedAngle = 0;
        handleContainer.style.transform = 'translateX(-50%) rotate(0deg)';
    }

    function loadPrizes() {
        const savedPrizes = localStorage.getItem('gachaPrizes');
        if (savedPrizes) {
            prizes = JSON.parse(savedPrizes);
        } else {
            prizes = [...defaultPrizes];
        }
        while (prizes.length < 10) {
            prizes.push(null);
        }
        for (let i = 3; i < 10; i++) {
            prizes[i] = null;
        }
    }

    async function handleSettingsSave() {
        // ... (This function remains the same as the last correct version)
        const prizeRows = settingsForm.querySelectorAll('.prize-setting');
        const newPrizes = [];
        for (let i = 0; i < prizeRows.length; i++) {
            const row = prizeRows[i];
            if (row.querySelector('.add-btn')) { newPrizes.push(null); continue; }
            const nameInput = row.querySelector('input[type="text"]');
            const fileInput = row.querySelector('input[type="file"]');
            const file = fileInput.files[0];
            if (file) { newPrizes.push(await toBase64(file)); }
            else if (nameInput.value && !nameInput.disabled) { newPrizes.push(nameInput.value); }
            else if (prizes[i] && prizes[i].startsWith('data:image')) { newPrizes.push(prizes[i]); }
            else { newPrizes.push(null); }
        }
        prizes = newPrizes;
        localStorage.setItem('gachaPrizes', JSON.stringify(prizes));
        alert('設定已儲存！');
        settingsPanel.classList.add('hidden');
    }

    function populateSettingsForm() {
        // ... (This function remains the same as the last correct version)
        settingsForm.innerHTML = '';
        for (let i = 0; i < 10; i++) {
            const prize = prizes[i];
            const prizeRow = document.createElement('div');
            prizeRow.className = 'prize-setting';
            prizeRow.dataset.index = i;
            if (prize) {
                const isImage = prize.startsWith('data:image');
                prizeRow.innerHTML = `<span class="prize-label">${i + 1}.</span><input type="text" value="${isImage ? '已上傳圖片' : prize}" ${isImage ? 'disabled' : ''}><input type="file" accept="image/*"><button type="button" class="prize-action-btn remove-btn">-</button>`;
            } else {
                prizeRow.innerHTML = `<span class="prize-label">${i + 1}.</span><button type="button" class="prize-action-btn add-btn">+</button>`;
            }
            settingsForm.appendChild(prizeRow);
        }
    }

    function createCoin() {
        const coin = document.createElement('div');
        coin.classList.add('coin');
        const coinAreaRect = coinArea.getBoundingClientRect();
        // Adjust for new 90px coin size
        const randomTop = coinAreaRect.top + Math.random() * (coinAreaRect.height - 90);
        const randomLeft = coinAreaRect.left + Math.random() * (coinAreaRect.width - 90);
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
        function drag(e) { /* same as before */ if (!activeCoin) return; e.preventDefault(); const touch = e.type === 'touchmove' ? e.touches[0] : e; activeCoin.style.left = `${touch.clientX - offsetX}px`; activeCoin.style.top = `${touch.clientY - offsetY}px`; }
        function endDrag() {
            if (!activeCoin) return;
            activeCoin.style.cursor = 'grab';
            const coinRect = activeCoin.getBoundingClientRect();
            const slotRect = coinSlot.getBoundingClientRect();
            if (coinRect.left < slotRect.right && coinRect.right > slotRect.left && coinRect.top < slotRect.bottom && coinRect.bottom > slotRect.top) {
                activeCoin.remove();
                coinsInSlot++;
                checkCoins();
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

    function checkCoins() {
        if (coinsInSlot === requiredCoins) {
            handleContainer.classList.remove('disabled');
            requiredCoinsDisplay.classList.add('ready');
        }
    }
    
    function getAngle(cx, cy, ex, ey) { const dy = ey - cy; const dx = ex - cx; return Math.atan2(dy, dx) * 180 / Math.PI; }

    function dropCapsule() { /* same as before */ const capsule = document.createElement('div'); capsule.classList.add('capsule'); const colors = ['#a29bfe', '#74b9ff', '#55efc4', '#ff7675', '#fd79a8', '#ffeaa7', '#fab1a0', '#00cec9', '#6c5ce7']; capsule.style.background = colors[Math.floor(Math.random() * colors.length)]; const exitRect = capsuleExit.getBoundingClientRect(); const trayRect = capsuleTray.getBoundingClientRect(); capsule.style.left = `${exitRect.left + (exitRect.width / 2) - 30}px`; capsule.style.top = `${exitRect.top}px`; document.body.appendChild(capsule); capsule.classList.add('capsule-drop'); capsule.style.transform = `translateY(${trayRect.top - exitRect.top + 5}px)`; capsule.addEventListener('animationend', () => addOpenListeners(capsule)); }
    
    function addOpenListeners(targetCapsule) { /* same as before */ targetCapsule.addEventListener('dblclick', (e) => openCapsule(e, targetCapsule)); let lastTap = 0; targetCapsule.addEventListener('touchend', function(event) { const currentTime = new Date().getTime(); if (currentTime - lastTap < 300) { openCapsule(event, targetCapsule); } lastTap = currentTime; }); }

    function openCapsule(e, cap) { /* same as before, calls resetGame */ e.preventDefault(); const availablePrizes = prizes.filter(p => p !== null && p !== ""); if (availablePrizes.length === 0) { prizeDisplay.textContent = '沒有獎品了！'; } else { const prizeData = availablePrizes[Math.floor(Math.random() * availablePrizes.length)]; prizeDisplay.innerHTML = ''; if (prizeData.startsWith('data:image')) { const img = document.createElement('img'); img.src = prizeData; prizeDisplay.appendChild(img); } else { prizeDisplay.textContent = prizeData; } } prizeDisplay.style.display = 'flex'; cap.remove(); setTimeout(() => { prizeDisplay.style.display = 'none'; resetGame(); }, 4000); }

    function resetGame() {
        startNewTurn();
    }

    function addEventListeners() {
        getCoinBtn.addEventListener('click', () => {
             const existingCoins = document.querySelectorAll('.coin').length;
            if (existingCoins + coinsInSlot >= requiredCoins) {
                 alert("場上的硬幣夠多了，先把硬幣投進去吧！");
                return;
            }
            createCoin();
        });

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
            if (delta > 180) delta -= 360; else if (delta < -180) delta += 360;
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

        settingsBtn.addEventListener('click', () => passwordModal.classList.remove('hidden'));
        passwordSubmit.addEventListener('click', () => {
            if (passwordInput.value === 'pitt') {
                passwordModal.classList.add('hidden');
                passwordInput.value = '';
                populateSettingsForm();
                settingsPanel.classList.remove('hidden');
            } else {
                alert('密碼錯誤！');
                passwordInput.value = '';
            }
        });
        saveSettingsBtn.addEventListener('click', handleSettingsSave);
        closeBtns.forEach(btn => btn.addEventListener('click', () => {
            passwordModal.classList.add('hidden');
            settingsPanel.classList.add('hidden');
        }));
        settingsForm.addEventListener('click', (e) => {
            const index = e.target.closest('.prize-setting').dataset.index;
            if (!index) return;
            if (e.target.classList.contains('add-btn')) {
                prizes[index] = `新獎品 ${parseInt(index, 10) + 1}`;
                populateSettingsForm();
            } else if (e.target.classList.contains('remove-btn')) {
                prizes[index] = null;
                populateSettingsForm();
            }
        });
    }
    
    initialize();
});
