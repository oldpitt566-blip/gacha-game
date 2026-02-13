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
    let activeCoin = null;
    let offsetX = 0;
    let offsetY = 0;
    let isTurning = false;
    let startAngle = 0;
    let currentAngle = 0;
    let accumulatedAngle = 0;

    // --- Prize Data ---
    let prizes = [];
    const defaultPrizes = Array.from({ length: 10 }, (_, i) => `獎品 ${i + 1}`);

    // --- Initialize ---
    function initialize() {
        loadPrizes();
        handleContainer.classList.add('disabled');
        addEventListeners();
    }

    // --- Prize Logic ---
    function loadPrizes() {
        const savedPrizes = localStorage.getItem('gachaPrizes');
        prizes = savedPrizes ? JSON.parse(savedPrizes) : [...defaultPrizes];
    }

    async function handleSettingsSave() {
        const nameInputs = settingsForm.querySelectorAll('input[type="text"]');
        const fileInputs = settingsForm.querySelectorAll('input[type="file"]');
        
        for (let i = 0; i < 10; i++) {
            const file = fileInputs[i].files[0];
            if (file) {
                prizes[i] = await toBase64(file);
            } else {
                prizes[i] = nameInputs[i].value;
            }
        }
        localStorage.setItem('gachaPrizes', JSON.stringify(prizes));
        alert('設定已儲存！');
        settingsPanel.classList.add('hidden');
    }

    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    // --- Coin Logic ---
    function createCoin() {
        const coin = document.createElement('div');
        coin.classList.add('coin');
        coin.textContent = '¥100';

        const coinAreaRect = coinArea.getBoundingClientRect();
        const randomTop = coinAreaRect.top + Math.random() * (coinAreaRect.height - 45); // 45 is coin height
        const randomLeft = coinAreaRect.left + Math.random() * (coinAreaRect.width - 45); // 45 is coin width

        coin.style.top = `${randomTop}px`;
        coin.style.left = `${randomLeft}px`;

        document.body.appendChild(coin);
        addCoinDragListeners(coin);
    }

    function addCoinDragListeners(coin) {
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
            activeCoin.style.zIndex = '1';
            const coinRect = activeCoin.getBoundingClientRect();
            const slotRect = coinSlot.getBoundingClientRect();
            if (
                coinRect.left < slotRect.right &&
                coinRect.right > slotRect.left &&
                coinRect.top < slotRect.bottom &&
                coinRect.bottom > slotRect.top
            ) {
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
        if (coinsInSlot === 4) {
            handleContainer.classList.remove('disabled');
        }
    }

    // --- Handle Turning Logic ---
    function getAngle(cx, cy, ex, ey) {
        const dy = ey - cy;
        const dx = ex - cx;
        return Math.atan2(dy, dx) * 180 / Math.PI;
    }
    
    // --- Capsule & Prize Logic ---
    function dropCapsule() {
        const capsule = document.createElement('div');
        capsule.classList.add('capsule');

        const exitRect = capsuleExit.getBoundingClientRect();
        const trayRect = capsuleTray.getBoundingClientRect();

        capsule.style.left = `${exitRect.left + (exitRect.width / 2) - 30}px`;
        capsule.style.top = `${exitRect.top}px`;

        document.body.appendChild(capsule);
        capsule.classList.add('capsule-drop');
        capsule.style.transform = `translateY(${trayRect.top - exitRect.top + 5}px)`;

        capsule.addEventListener('animationend', () => addOpenListeners(capsule));
    }

    function addOpenListeners(targetCapsule) {
        targetCapsule.addEventListener('dblclick', (e) => openCapsule(e, targetCapsule));
        let lastTap = 0;
        targetCapsule.addEventListener('touchend', function(event) {
            const currentTime = new Date().getTime();
            if (currentTime - lastTap < 300) {
                openCapsule(event, targetCapsule);
            }
            lastTap = currentTime;
        });
    }

    function openCapsule(e, cap) {
        e.preventDefault();
        const prizeIndex = Math.floor(Math.random() * 10); // 0-9
        const prizeData = prizes[prizeIndex];

        prizeDisplay.innerHTML = ''; // Clear previous prize

        if (prizeData.startsWith('data:image')) {
            const img = document.createElement('img');
            img.src = prizeData;
            prizeDisplay.appendChild(img);
        } else {
            prizeDisplay.textContent = prizeData;
        }

        prizeDisplay.style.display = 'flex';
        cap.remove();

        setTimeout(() => {
            prizeDisplay.style.display = 'none';
            resetGame();
        }, 4000);
    }

    function resetGame() {
        coinsInSlot = 0;
        handleContainer.classList.add('disabled');
        handleContainer.style.transform = 'translateX(-50%) rotate(0deg)';
        currentAngle = 0;
        accumulatedAngle = 0;
    }

    // --- Settings Logic ---
    function populateSettingsForm() {
        settingsForm.innerHTML = '';
        for (let i = 0; i < 10; i++) {
            const prize = prizes[i] || defaultPrizes[i];
            const isImage = prize.startsWith('data:image');

            const prizeRow = document.createElement('div');
            prizeRow.className = 'prize-setting';
            prizeRow.innerHTML = `
                <span class="prize-label">${i + 1}.</span>
                <input type="text" id="prize-name-${i}" value="${isImage ? '已上傳圖片' : prize}" ${isImage ? 'disabled' : ''}>
                <input type="file" id="prize-image-${i}" accept="image/*">
            `;
            settingsForm.appendChild(prizeRow);
        }
    }

    // --- Event Listeners ---
    function addEventListeners() {
        getCoinBtn.addEventListener('click', () => {
            const existingCoins = document.querySelectorAll('.coin').length;
            if (existingCoins + coinsInSlot >= 4) {
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
                handleContainer.classList.add('disabled');
                dropCapsule();
            }
        }

        function endTurn() {
            if (!isTurning) return;
            isTurning = false;
            document.querySelectorAll('.deco-capsule').forEach(c => c.classList.remove('shake-animation'));
            if (accumulatedAngle < 1080) {
                handleContainer.style.transition = 'transform 0.3s ease-out';
                handleContainer.style.transform = 'translateX(-50%) rotate(0deg)';
                setTimeout(() => handleContainer.style.transition = 'none', 300);
            }
            currentAngle = 0;
            accumulatedAngle = 0;
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
        
        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                passwordModal.classList.add('hidden');
                settingsPanel.classList.add('hidden');
            });
        });
    }

    // --- Start the game ---
    initialize();
});
