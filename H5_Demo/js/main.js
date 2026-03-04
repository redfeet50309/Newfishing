const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const stateText = document.getElementById('state-text');

const game = new FishingSystem();

// --- Background Assets ---
const bgImages = {
    1: new Image(),
    2: new Image(),
    3: new Image(),
    4: new Image(),
    5: new Image()
};
bgImages[1].src = 'assets/images/bgs/bg_stream_cute_flat_1772375543999.png';
bgImages[2].src = 'assets/images/bgs/bg_breakwater_cute_flat_1772375600661.png';
bgImages[3].src = 'assets/images/bgs/bg_coral_cute_flat_1772375617723.png';
bgImages[4].src = 'assets/images/bgs/bg_deep_ocean_cute_flat_1772375633891.png';
bgImages[5].src = 'assets/images/bgs/bg_ruins_cute_flat_1772375650824.png';

// --- Fish Assets Preload ---
const fishImages = {};
// Preload all 30 fishes assuming FISH_TYPES is available from FishData.js
if (typeof FISH_TYPES !== 'undefined') {
    FISH_TYPES.forEach(fish => {
        const img = new Image();
        img.src = `assets/images/fish/${fish.id}.png`;
        fishImages[fish.id] = img;
    });
}

// --- Shop Data ---
const SHOP_ITEMS = [
    {
        id: 'bamboo',
        name: '新手木竹竿',
        desc: '初始發放的竿子。削韌極低，只能釣起小魚。',
        safeZoneMin: 30,
        safeZoneMax: 70,
        damage: 0.1,
        maxRarity: 3, // 可釣稀有 (Rare)
        price: 0
    },
    {
        id: 'carbon',
        name: '碳素纖維竿',
        desc: '適合對付中等體型的魚類。',
        safeZoneMin: 30,
        safeZoneMax: 70,
        damage: 0.8,
        maxRarity: 4, // 可釣史詩 (Epic)
        price: 200
    },
    {
        id: 'poseidon',
        name: '海神合金微導竿',
        desc: '極高的削韌力，能將海坊主拖出水面。',
        safeZoneMin: 30,
        safeZoneMax: 70,
        damage: 2.5,
        maxRarity: 5, // 可釣變異種 (Mutant)
        price: 1500
    }
];

const BOAT_ITEMS = [
    { id: 'boat_0', name: '步行 (岸邊)', desc: '抵達區域：恬靜小溪', region: 1, price: 0 },
    { id: 'boat_1', name: '橡皮艇', desc: '解鎖區域：近海防波堤', region: 2, price: 500 },
    { id: 'boat_2', name: '雙引擎快艇', desc: '解鎖區域：迷霧珊瑚礁', region: 3, price: 2000 },
    { id: 'boat_3', name: '遠洋探勘船', desc: '解鎖區域：深海斷層', region: 4, price: 5000 },
    { id: 'boat_4', name: '魔法潛艦', desc: '解鎖區域：魔幻遺跡', region: 5, price: 10000 }
];

// --- UI Elements ---
const goldDisplay = document.getElementById('gold-display');
const rodDisplay = document.getElementById('rod-display');
const shopBtn = document.getElementById('shop-btn');
const shopModal = document.getElementById('shop-modal');
const closeShopBtn = document.getElementById('close-shop-btn');
const shopItemsContainer = document.getElementById('shop-items');
const uiLayer = document.getElementById('ui-layer');

// Map Elements
const mapBtn = document.getElementById('map-btn');
const mapModal = document.getElementById('map-modal');
const closeMapBtn = document.getElementById('close-map-btn');
const mapItemsContainer = document.getElementById('map-items');

// Bestiary Elements
const bestiaryBtn = document.getElementById('bestiary-btn');
const bestiaryModal = document.getElementById('bestiary-modal');
const closeBestiaryBtn = document.getElementById('close-bestiary-btn');
const bestiaryGrid = document.getElementById('bestiary-grid');
const bestiaryStats = document.getElementById('bestiary-stats');

let isModalOpen = false;

// --- Modal Helper ---
function openModal(modalEl) {
    isModalOpen = true;
    modalEl.classList.remove('hidden');
    uiLayer.style.pointerEvents = 'none';
    modalEl.style.pointerEvents = 'auto';
}

function closeModal(modalEl) {
    isModalOpen = false;
    modalEl.classList.add('hidden');
    uiLayer.style.pointerEvents = 'none';
    document.getElementById('top-bar').style.pointerEvents = 'auto';
}

// --- Shop Logic ---
function initShop() {
    shopItemsContainer.innerHTML = '';

    SHOP_ITEMS.forEach(item => {
        const isEquipped = game.currentRod.id === item.id;
        const isOwned = game.unlockedRods.includes(item.id); // 已購買但可能未裝備

        const itemDiv = document.createElement('div');
        itemDiv.className = `shop-item ${isEquipped ? 'equipped' : ''}`;

        let buttonHTML = '';
        if (isEquipped) {
            // 目前裝備中
            buttonHTML = `<button class="buy-btn equipped-btn" disabled>已裝備</button>`;
        } else if (isOwned) {
            // 已購買，免費切換
            buttonHTML = `<button class="buy-btn" onclick="equipRod('${item.id}')" style="background-color:#4a9eff;">切換裝備</button>`;
        } else {
            // 尚未購買
            const canBuy = game.gold >= item.price;
            buttonHTML = `<button class="buy-btn" onclick="buyRod('${item.id}')" ${!canBuy && item.price > 0 ? 'disabled' : ''}>
                ${item.price > 0 ? '💰 ' + item.price : '免費裝備'}
            </button>`;
        }

        itemDiv.innerHTML = `
            <div class="item-info">
                <h3>${item.name}</h3>
                <p>${item.desc}</p>
                <div class="stats">削韌: ${item.damage} | 可釣最高稀有度: ${item.maxRarity === 3 ? '稀有 (Rare)' : item.maxRarity === 4 ? '史詩 (Epic)' : '變異 (Mutant)'}</div>
            </div>
            ${buttonHTML}
        `;
        shopItemsContainer.appendChild(itemDiv);
    });

    // Add Boats Section to Shop
    const boatsHeader = document.createElement('h3');
    boatsHeader.innerText = '🛥️ 船隻專區';
    boatsHeader.style.marginTop = '20px';
    shopItemsContainer.appendChild(boatsHeader);

    BOAT_ITEMS.forEach(boat => {
        if (boat.id === 'boat_0') return; // Skip Default boat

        const isUnlocked = game.unlockedBoats.includes(boat.id);
        const canBuy = game.gold >= boat.price;

        const itemDiv = document.createElement('div');
        itemDiv.className = `shop-item ${isUnlocked ? 'equipped' : ''}`;

        let buttonHTML = '';
        if (isUnlocked) {
            buttonHTML = `<button class="buy-btn equipped-btn" disabled>已擁有</button>`;
        } else {
            buttonHTML = `<button class="buy-btn" onclick="buyBoat('${boat.id}')" ${!canBuy ? 'disabled' : ''}>
                💰 ${boat.price}解鎖
            </button>`;
        }

        let boatImage = `<img src="assets/images/boats/${boat.id}.png" style="width: 64px; height: 64px; object-fit: contain; margin-right: 15px;">`;

        itemDiv.innerHTML = `
            <div style="display: flex; align-items: center;">
                ${boatImage}
                <div class="item-info">
                    <h3>${boat.name}</h3>
                    <p>${boat.desc}</p>
                </div>
            </div>
            ${buttonHTML}
        `;
        shopItemsContainer.appendChild(itemDiv);
    });
}

// Make buyRod accessible globally for the onclick handler
window.buyRod = function (rodId) {
    const rod = SHOP_ITEMS.find(r => r.id === rodId);
    if (!rod) return;

    if (rod.price > 0 && game.gold >= rod.price && !game.unlockedRods.includes(rod.id)) {
        // 購買全新釣竿：扣錄
        game.gold -= rod.price;
        game.unlockedRods.push(rod.id); // ✅ 鍵入已解鎖清單
        game.currentRod = rod;
        game.save();
        initShop();
    } else if (rod.price === 0) {
        // 免費釣竿 (bamboo)—確保一定在已解鎖清單中
        if (!game.unlockedRods.includes(rod.id)) {
            game.unlockedRods.push(rod.id);
        }
        game.currentRod = rod;
        game.save();
        initShop();
    }
}

// 切換裝備已解鎖的釣竿（免費）
window.equipRod = function (rodId) {
    const rod = SHOP_ITEMS.find(r => r.id === rodId);
    if (!rod || !game.unlockedRods.includes(rod.id)) return;
    game.currentRod = rod;
    game.save();
    initShop();
}

window.buyBoat = function (boatId) {
    const boat = BOAT_ITEMS.find(b => b.id === boatId);
    if (!boat) return;

    if (!game.unlockedBoats.includes(boat.id) && game.gold >= boat.price) {
        game.gold -= boat.price;
        game.unlockedBoats.push(boat.id);
        game.save();
        initShop();
    }
}

// --- Map Logic ---
function initMap() {
    mapItemsContainer.innerHTML = '';

    const REGIONS = [
        { id: 1, name: "恬靜小溪", reqBoat: 'boat_0' },
        { id: 2, name: "近海防波堤", reqBoat: 'boat_1' },
        { id: 3, name: "迷霧珊瑚礁", reqBoat: 'boat_2' },
        { id: 4, name: "深海斷層", reqBoat: 'boat_3' },
        { id: 5, name: "魔幻遺跡", reqBoat: 'boat_4' }
    ];

    REGIONS.forEach(region => {
        const isEquipped = game.currentRegionId === region.id;
        const isUnlocked = game.unlockedBoats.includes(region.reqBoat);

        const itemDiv = document.createElement('div');
        itemDiv.className = `shop-item ${isEquipped ? 'equipped' : ''}`;

        let buttonHTML = '';
        if (isEquipped) {
            buttonHTML = `<button class="buy-btn equipped-btn" disabled>📍 所在區域</button>`;
        } else if (isUnlocked) {
            buttonHTML = `<button class="buy-btn" onclick="switchRegion(${region.id})">前往區域</button>`;
        } else {
            buttonHTML = `<button class="buy-btn" disabled><img src="assets/images/ui/padlock.png" style="width:16px; height:16px; margin-right:5px; vertical-align:middle;">需購買對應船隻</button>`;
        }

        itemDiv.innerHTML = `
            <div class="item-info">
                <h3 style="font-size: 20px;">[區域 ${region.id}] ${region.name}</h3>
            </div>
            ${buttonHTML}
        `;
        mapItemsContainer.appendChild(itemDiv);
    });
}

window.switchRegion = function (regionId) {
    game.currentRegionId = parseInt(regionId);
    game.save();
    initMap();
}

// --- Bestiary Logic ---
function initBestiary() {
    bestiaryGrid.innerHTML = '';

    // Calculate total buff states based on bestiary progress to place into headers
    const bStats = [
        '', // 0-based filler
        `💰 全域金幣收益: +${game.getRegionBuffCount(1) * 2}%`,
        `💪 釣竿基礎削韌力: +${game.getRegionBuffCount(2) * 2}%`,
        `🧵 張力衰退減緩: -${game.getRegionBuffCount(3) * 5}%`,
        `🍀 高階魚咬鉤率: +${game.getRegionBuffCount(4) * 3}%`,
        `🛡️ 魚隻終極拉力上限降低: -${game.getRegionBuffCount(5) * 2}%`
    ];

    // Update Progress Bar
    const totalCollected = Object.keys(game.bestiary).length;
    const totalFish = 30; // 5 regions * 6 fish
    const percentage = Math.floor((totalCollected / totalFish) * 100);
    const progressBarFill = document.getElementById('bestiary-progress-fill');
    const progressText = document.getElementById('bestiary-progress-text');
    if (progressBarFill && progressText) {
        progressBarFill.style.width = `${percentage}%`;
        progressText.innerText = `收集進度: ${totalCollected}/${totalFish} (${percentage}%)`;
    }

    // Group fishes by Region
    for (let r = 1; r <= 5; r++) {
        const regionFishes = FISH_TYPES.filter(f => f.region === r);
        if (regionFishes.length === 0) continue;

        const regionCount = game.getRegionBuffCount(r);
        const isMastered = regionCount === 6;

        const regionBlock = document.createElement('div');
        regionBlock.className = `bestiary-region ${isMastered ? 'mastered' : ''}`;
        regionBlock.innerHTML = `
            <h3>
                <span>區域 ${r} (收集度: ${regionCount}/6) ${isMastered ? '👑 制霸!' : ''}</span>
                <span class="region-buff">${bStats[r]}</span>
            </h3>
            <div class="fish-grid"></div>`;

        const gridContainer = regionBlock.querySelector('.fish-grid');

        regionFishes.forEach(fish => {
            const data = game.bestiary[fish.id];
            const isUnlocked = !!data;
            const card = document.createElement('div');

            if (isUnlocked) {
                card.className = "fish-card unlocked";
                // Rarity border colors mapping based on weight (1: Common, 2: Uncommon, 3: Rare, 4: Epic, 5: Mutant)
                // Colors match GDD spec: Common=gray, Uncommon=green, Rare=blue, Epic=purple, Mutant=red
                const borderColors = ['', '#aaaaaa', '#00e676', '#4488ff', '#ce93d8', '#ff5252'];
                const bColor = borderColors[fish.rarityWeight];

                card.style.borderColor = bColor;
                card.style.cursor = "pointer";
                const displayName = fish.name.split(' (')[0].split('(')[0].trim();
                card.innerHTML = `
                    <div class="fish-color-box" style="background-color: ${fish.color}; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                        <img src="assets/images/fish/${fish.id}.png" style="width: 100%; height: 100%; object-fit: contain;" onerror="this.style.display='none'">
                    </div>
                    <div class="fish-info">
                        <div class="fish-name">${displayName}</div>
                        <div class="fish-record">最大體重: ${data.maxWeight} kg</div>
                    </div>
                `;

                // Add click listener
                card.onclick = (e) => {
                    e.stopPropagation();
                    const rarityLabels = ['', '普通 (Common)', '進階 (Uncommon)', '稀有 (Rare)', '史詩 (Epic)', '變異 (Mutant)'];
                    document.getElementById('fish-detail-img').src = `assets/images/fish/${fish.id}.png`;
                    document.getElementById('fish-detail-name').innerText = fish.name;
                    document.getElementById('fish-detail-desc').innerText = fish.description;
                    document.getElementById('fish-detail-rarity').innerText = rarityLabels[fish.rarityWeight];
                    document.getElementById('fish-detail-price').innerText = fish.sellPrice;
                    document.getElementById('fish-detail-count').innerText = data.count;
                    document.getElementById('fish-detail-weight').innerText = data.maxWeight;
                    document.getElementById('fish-detail-img-box').style.backgroundColor = fish.color;
                    openModal(document.getElementById('fish-detail-modal'));
                };
            } else {
                card.className = "fish-card locked";
                card.style.borderColor = '#333';
                card.innerHTML = `
                    <div class="fish-color-box" style="background-color: #111;">
                        <img src="assets/images/fish/${fish.id}.png" class="silhouette" style="width: 100%; height: 100%; object-fit: contain;" onerror="this.style.display='none'">
                        <div style="position: absolute; color: white; font-size: 28px; font-weight: bold; text-shadow: 2px 2px 4px #000;">?</div>
                    </div>
                    <div class="fish-info">
                        <div class="fish-name">未知物種</div>
                    </div>
                `;
            }
            gridContainer.appendChild(card);
        });

        bestiaryGrid.appendChild(regionBlock);
    }
}

// --- Event Listeners ---
shopBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (game.state !== GAME_STATE.REELING) {
        initShop();
        openModal(shopModal);
    }
});
closeShopBtn.addEventListener('click', (e) => { e.stopPropagation(); closeModal(shopModal); });

const startFishingBtn = document.getElementById('start-fishing-btn');
const startFishingContainer = document.getElementById('start-fishing-container');

startFishingBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isModalOpen) return;

    if (game.state === GAME_STATE.IDLE) {
        startFishingContainer.classList.add('hidden');
        game.setReeling(true);
    } else if (game.state === GAME_STATE.RESULT && !game.resultMessage.includes('成功釣到')) {
        game.resetGameplay();
        startFishingContainer.classList.add('hidden');
        game.setReeling(true);
    }
});

mapBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (game.state !== GAME_STATE.REELING) {
        initMap();
        openModal(mapModal);
    }
});
closeMapBtn.addEventListener('click', (e) => { e.stopPropagation(); closeModal(mapModal); });

bestiaryBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (game.state !== GAME_STATE.REELING) {
        initBestiary();
        openModal(bestiaryModal);
    }
});
closeBestiaryBtn.addEventListener('click', (e) => { e.stopPropagation(); closeModal(bestiaryModal); });

const closeFishDetailBtn = document.getElementById('close-detail-btn');
if (closeFishDetailBtn) {
    closeFishDetailBtn.addEventListener('click', (e) => { e.stopPropagation(); closeModal(document.getElementById('fish-detail-modal')); });
}

// Input handling
const sfxReel = document.getElementById('sfx-reel');

function handleInputDown() {
    if (isModalOpen) return;

    if (game.state === GAME_STATE.RESULT) {
        if (!game.resultMessage.includes('成功釣到')) {
            game.resetGameplay();
            startFishingContainer.classList.add('hidden');
            game.setReeling(true); // Initialize reeling phase (isReeling defaults to false)
            game.setReeling(true); // Immediately register canvas touch as active reeling!
            if (sfxReel) sfxReel.play().catch(e=>console.log(e));
        } else {
            game.resetGameplay();
        }
    } else if (game.state === GAME_STATE.REELING) {
        game.setReeling(true); 
        if (sfxReel) sfxReel.play().catch(e=>console.log(e));
    }
}

function handleInputUp() {
    if (isModalOpen) return;
    if (game.state === GAME_STATE.REELING) {
        game.setReeling(false); 
        if (sfxReel) {
            sfxReel.pause();
            sfxReel.currentTime = 0;
        }
    }
}

// Mouse and Touch events
canvas.addEventListener('mousedown', handleInputDown);
canvas.addEventListener('mouseup', handleInputUp);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleInputDown(); }, { passive: false });
canvas.addEventListener('touchend', (e) => { e.preventDefault(); handleInputUp(); }, { passive: false });

// Also stop audio when game state changes away from REELING
function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    const safeDt = Math.min(dt, 50);

    // Stop audio if fish runs away or is caught
    if (game.state !== GAME_STATE.REELING && sfxReel && !sfxReel.paused) {
        sfxReel.pause();
        sfxReel.currentTime = 0;
    }

    update(safeDt);
    draw();
    requestAnimationFrame(gameLoop);
}

function update(dt) {
    game.update(dt);
    updateUIText();
}

function draw() {
    // Draw Background
    const bgImg = bgImages[game.currentRegionId];
    if (bgImg.complete && bgImg.naturalWidth !== 0) {
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    } else {
        // Fallback clear
        ctx.fillStyle = '#16213e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw water line overlay (semi-transparent for underwater feel)
    ctx.fillStyle = 'rgba(15, 52, 96, 0.4)';
    ctx.fillRect(0, 300, canvas.width, canvas.height - 300);

    // Update Top Bar UI
    // Handle Top Bar visibility
    const topBar = document.getElementById('top-bar');
    if (game.state === GAME_STATE.IDLE || game.state === GAME_STATE.RESULT) {
        topBar.style.display = 'flex';
        // Add current Region name to rod display
        const activeBoat = BOAT_ITEMS.find(b => b.region === game.currentRegionId);
        rodDisplay.innerText = `🛥️: ${activeBoat ? activeBoat.name : ''} | 🎣: ${game.currentRod.name}`;
    } else {
        topBar.style.display = 'none';
    }

    // Draw based on state
    switch (game.state) {
        case GAME_STATE.REELING:
            drawReelingUI();
            break;
        case GAME_STATE.RESULT:
            drawResult();
            break;
    }
}

function updateUIText() {
    switch (game.state) {
        case GAME_STATE.IDLE:
            stateText.innerText = "";
            startFishingBtn.innerText = "開始釣魚 🎣";
            startFishingContainer.classList.remove('hidden');
            stateText.classList.add('hidden');
            break;
        case GAME_STATE.REELING:
            stateText.innerText = "魚上鉤了！長按收線，放開鬆線！";
            stateText.style.color = "#e94560";
            startFishingContainer.classList.add('hidden');
            stateText.classList.remove('hidden');
            break;
        case GAME_STATE.RESULT:
            if (game.resultMessage.includes('成功釣到')) {
                stateText.innerText = "點擊畫面繼續";
                stateText.style.color = "#fff";
                startFishingContainer.classList.add('hidden');
                stateText.classList.remove('hidden');
            } else {
                stateText.innerText = "";
                startFishingBtn.innerText = "再次挑戰 🎣";
                startFishingContainer.classList.remove('hidden');
                stateText.classList.add('hidden');
            }
            break;
    }

    if (goldDisplay) {
        goldDisplay.innerText = `💰: ${game.gold}`;
    }
}

function drawReelingUI() {
    // 加上全域陰影以確保所有 UI 在淺色天空上都能看清楚
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;

    // Draw Tension Bar
    const barWidth = 40;
    const barHeight = 400;
    const x = canvas.width - 80;
    const y = 100;

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(x, y, barWidth, barHeight);

    // Safe Zone
    const safeZoneStartY = y + barHeight - (game.currentRod.safeZoneMax / 100) * barHeight;
    const safeZoneHeight = ((game.currentRod.safeZoneMax - game.currentRod.safeZoneMin) / 100) * barHeight;

    // 關閉陰影畫這個半透明色塊，避免髒亂
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0, 255, 204, 0.4)';
    ctx.fillRect(x, safeZoneStartY, barWidth, safeZoneHeight);
    ctx.shadowBlur = 4; // 恢復陰影

    // Tension Indicator - 寬度與張力條對齊，不錯位
    const indicatorY = y + barHeight - (game.tension / 100) * barHeight;
    ctx.fillStyle = (game.tension > game.currentRod.safeZoneMax || game.tension < game.currentRod.safeZoneMin) ? '#e94560' : '#00ffcc';
    // 讓指示條寬度與黑底對齊 (寬度 barWidth，起始 X 座標為 x)
    ctx.fillRect(x, indicatorY - 5, barWidth, 10);

    // Border: 原版的白色粗邊框（立體感來源）
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, barWidth, barHeight);

    // Labels
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('張力', x + 20, y - 10);

    // Draw Fish Stamina — Feature 1: 神秘感，隱藏魚名與顏色
    const fish = game.currentFish;
    const mysteryHints = [
        '',                             // 0 (unused)
        '水底有動靜...',                  // 1: Common
        '線在震動...好像不輕！',            // 2: Uncommon
        '一股穩定的拉力！！',               // 3: Rare
        '一股巨大的力量傳來！！',            // 4: Epic
        '⚠️ 未知的震顫！'               // 5: Mutant
    ];
    const hintText = mysteryHints[fish.rarityWeight] || '水底有動靜...';

    ctx.fillStyle = '#fff'; // 白字+陰影
    ctx.font = 'bold 20px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText(`🎣 ${hintText}`, 30, 120);

    // Fish Stamina Bar — 固定灰色，不洩漏魚種顏色
    const sBarW = 300;
    const sBarH = 20;
    const sFill = (fish.staminaReal / fish.staminaMax) * sBarW;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(30, 140, sBarW, sBarH);
    ctx.fillStyle = '#556677'; // 固定深灰色，不使用 fish.color
    ctx.fillRect(30, 140, sFill, sBarH);
    
    ctx.strokeStyle = '#fff'; // 白外框
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 140, sBarW, sBarH);
    ctx.lineWidth = 1;
    
    ctx.fillStyle = '#fff'; // 白字+陰影
    ctx.font = 'bold 16px Courier New';
    ctx.fillText('體力 (Stamina)', 30, 180);

    // Draw active reeling visual
    if (game.isReeling) {
        ctx.fillStyle = '#e94560'; // 紅底字
        ctx.font = 'bold 30px Courier New';
        ctx.textAlign = 'center';
        // 畫一個白底描邊增加動感與清晰度
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#fff';
        ctx.strokeText('🎣 用力捲線中!', canvas.width / 2, 250);
        ctx.fillText('🎣 用力捲線中!', canvas.width / 2, 250);
        ctx.lineWidth = 1;
    }

    // 重置陰影設定，避免影響其他系統繪圖
    ctx.shadowBlur = 0;

    // Feature 2: 張力危險紅框 Vignette 警示
    const inDanger = game.tension > game.currentRod.safeZoneMax || game.tension < game.currentRod.safeZoneMin;
    if (inDanger) {
        const vignetteAlpha = 0.3 + 0.2 * Math.sin(Date.now() / 120); // 閃爍效果
        const vignetteW = 20;
        ctx.strokeStyle = `rgba(233, 69, 96, ${vignetteAlpha})`;
        ctx.lineWidth = vignetteW * 2;
        ctx.strokeRect(-vignetteW, -vignetteW, canvas.width + vignetteW * 2, canvas.height + vignetteW * 2);
        ctx.lineWidth = 1; // 重置
    }
}

function drawResult() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const isCaught = game.resultMessage.includes('成功釣到') && game.currentFish;
    const lines = game.resultMessage.split('\n');
    
    // 計算文字區塊起始 Y 座標（讓整體排版往下移，避免被 Top Bar 遮蓋）
    const startY = canvas.height / 2 + 30;

    // If successfully caught, draw the fish image above text
    if (isCaught) {
        const fishImg = fishImages[game.currentFish.id];
        if (fishImg && fishImg.complete && fishImg.naturalWidth !== 0) {
            const imgSize = 180; // 放大圖片
            const imgX = (canvas.width / 2) - (imgSize / 2);
            const imgY = startY - imgSize - 20; // 將圖片畫在第一行文字的上方
            ctx.drawImage(fishImg, imgX, imgY, imgSize, imgSize);
        }
    }

    // Draw result text lines
    ctx.textAlign = 'center';
    lines.forEach((line, index) => {
        // Feature 3: 破紀錄行使用金色大字
        const isRecordLine = line.includes('🌟') && line.includes('破紀錄');
        const isNewFishLine = line.includes('⭐') && line.includes('發現新魚種');

        if (isRecordLine) {
            ctx.fillStyle = '#ffd700'; // 金色
            ctx.font = 'bold 24px Courier New';
        } else if (isNewFishLine) {
            ctx.fillStyle = '#ffeb3b'; // 亮黃
            ctx.font = 'bold 24px Courier New';
        } else {
            ctx.fillStyle = '#00ffcc';
            ctx.font = '22px Courier New';
        }
        ctx.fillText(line, canvas.width / 2, startY + (index * 38));
    });
}

// Start Game Loop
gameLoop();
