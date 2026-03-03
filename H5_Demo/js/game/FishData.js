// 30 種魚類行為模式定義 (分為 5 個區域)
const FISH_TYPES = [
    // --- Region 1: 小溪 (Tranquil Stream) ---
    { id: 'f_1_1', region: 1, rarityWeight: 1, name: '綠藻小蝌蚪 (Common)', description: '極度弱小，拉力平緩。', pullStrength: 5, behaviorInterval: 120, staminaMax: 50, color: '#98FB98', sellPrice: 10 },
    { id: 'f_1_2', region: 1, rarityWeight: 1, name: '平穩鯉魚 (Common)', description: '平庸的淡水魚。', pullStrength: 10, behaviorInterval: 100, staminaMax: 100, color: '#FFB347', sellPrice: 20 },
    { id: 'f_1_3', region: 1, rarityWeight: 2, name: '急躁鯽魚 (Uncommon)', description: '偶爾會短暫抽動。', pullStrength: 15, behaviorInterval: 60, staminaMax: 80, color: '#B0C4DE', sellPrice: 35 },
    { id: 'f_1_4', region: 1, rarityWeight: 3, name: '銀白鱒魚 (Rare)', description: '游速快，稍微考驗反應。', pullStrength: 20, behaviorInterval: 40, staminaMax: 150, color: '#E0FFFF', sellPrice: 50 },
    { id: 'f_1_5', region: 1, rarityWeight: 4, name: '霸王雷魚 (Epic)', description: '小溪的霸主，體力極高。', pullStrength: 25, behaviorInterval: 80, staminaMax: 250, color: '#556B2F', sellPrice: 150 },
    { id: 'f_1_6', region: 1, rarityWeight: 5, name: '黃金龍鯉 (Mutant)', description: '全身散發金光的變異種。', pullStrength: 35, behaviorInterval: 50, staminaMax: 400, color: '#FFD700', sellPrice: 400 },

    // --- Region 2: 近海 (Coastal Breakwater) ---
    { id: 'f_2_1', region: 2, rarityWeight: 1, name: '銀色吻仔魚 (Common)', description: '群聚性小魚。', pullStrength: 12, behaviorInterval: 100, staminaMax: 90, color: '#F0F8FF', sellPrice: 25 },
    { id: 'f_2_2', region: 2, rarityWeight: 1, name: '竹莢魚 (Common)', description: '常見的國民海鮮。', pullStrength: 15, behaviorInterval: 90, staminaMax: 120, color: '#778899', sellPrice: 30 },
    { id: 'f_2_3', region: 2, rarityWeight: 2, name: '兇猛石斑 (Uncommon)', description: '底棲魚類，拉力沉重。', pullStrength: 22, behaviorInterval: 120, staminaMax: 220, color: '#8B4513', sellPrice: 60 },
    { id: 'f_2_4', region: 2, rarityWeight: 3, name: '暴衝鱸魚 (Rare)', description: '爆發力強，會突然狂拉。', pullStrength: 28, behaviorInterval: 30, staminaMax: 180, color: '#FF6961', sellPrice: 90 },
    { id: 'f_2_5', region: 2, rarityWeight: 4, name: '鬼頭飛魚 (Epic)', description: '彷彿要飛出水面。', pullStrength: 32, behaviorInterval: 20, staminaMax: 200, color: '#4682B4', sellPrice: 220 },
    { id: 'f_2_6', region: 2, rarityWeight: 5, name: '裝甲寄居蟹 (Mutant)', description: '防禦力（體力）極雄厚。', pullStrength: 40, behaviorInterval: 150, staminaMax: 800, color: '#DC143C', sellPrice: 600 },

    // --- Region 3: 珊瑚礁 (Misty Coral Reef) ---
    { id: 'f_3_1', region: 3, rarityWeight: 1, name: '條紋小丑魚 (Common)', description: '靈活的小型魚。', pullStrength: 18, behaviorInterval: 80, staminaMax: 140, color: '#FF8C00', sellPrice: 45 },
    { id: 'f_3_2', region: 3, rarityWeight: 1, name: '刺蝟河豚 (Common)', description: '生氣時增加瞬間水阻。', pullStrength: 25, behaviorInterval: 60, staminaMax: 160, color: '#F4A460', sellPrice: 50 },
    { id: 'f_3_3', region: 3, rarityWeight: 2, name: '華麗獅子魚 (Uncommon)', description: '帶有毒刺，拉力詭譎。', pullStrength: 28, behaviorInterval: 50, staminaMax: 200, color: '#BA55D3', sellPrice: 90 },
    { id: 'f_3_4', region: 3, rarityWeight: 3, name: '巨型蝠魟 (Rare)', description: '體力深不見底。', pullStrength: 35, behaviorInterval: 100, staminaMax: 350, color: '#483D8B', sellPrice: 150 },
    { id: 'f_3_5', region: 3, rarityWeight: 4, name: '幻彩旗魚 (Epic)', description: '海中超跑，爆衝速度快。', pullStrength: 45, behaviorInterval: 25, staminaMax: 280, color: '#00FFFF', sellPrice: 300 },
    { id: 'f_3_6', region: 3, rarityWeight: 5, name: '深海毒觸手 (Mutant)', description: '行為難以預測。', pullStrength: 50, behaviorInterval: 10, staminaMax: 500, color: '#800080', sellPrice: 800 },

    // --- Region 4: 深海 (Deep Ocean Fault) ---
    { id: 'f_4_1', region: 4, rarityWeight: 1, name: '深海盲鰻 (Common)', description: '擅長連續小幅掙扎。', pullStrength: 28, behaviorInterval: 40, staminaMax: 220, color: '#A9A9A9', sellPrice: 70 },
    { id: 'f_4_2', region: 4, rarityWeight: 1, name: '發光燈籠魚 (Common)', description: '深海常見指標生物。', pullStrength: 30, behaviorInterval: 70, staminaMax: 260, color: '#00FA9A', sellPrice: 80 },
    { id: 'f_4_3', region: 4, rarityWeight: 2, name: '遠古腔棘魚 (Uncommon)', description: '拉力沉重遲緩。', pullStrength: 38, behaviorInterval: 110, staminaMax: 400, color: '#2F4F4F', sellPrice: 150 },
    { id: 'f_4_4', region: 4, rarityWeight: 3, name: '巨型黑鮪魚 (Rare)', description: '價值連城，力量驚人。', pullStrength: 50, behaviorInterval: 60, staminaMax: 600, color: '#00008B', sellPrice: 250 },
    { id: 'f_4_5', region: 4, rarityWeight: 4, name: '狂暴大白鯊 (Epic)', description: '張力極易爆衝至頂點。', pullStrength: 65, behaviorInterval: 30, staminaMax: 500, color: '#FFFFFF', sellPrice: 500 },
    { id: 'f_4_6', region: 4, rarityWeight: 5, name: '深淵水怪幼體 (Mutant)', description: '力量超越鯊魚。', pullStrength: 75, behaviorInterval: 45, staminaMax: 1000, color: '#000000', sellPrice: 1200 },

    // --- Region 5: 遺跡 (Mystic Ruins) ---
    { id: 'f_5_1', region: 5, rarityWeight: 1, name: '幽靈水母 (Common)', description: '突然消失又出現的拉力。', pullStrength: 40, behaviorInterval: 20, staminaMax: 300, color: '#E6E6FA', sellPrice: 150 },
    { id: 'f_5_2', region: 5, rarityWeight: 1, name: '寶箱怪魚 (Common)', description: '偽裝成寶箱，體力極高。', pullStrength: 35, behaviorInterval: 90, staminaMax: 600, color: '#DAA520', sellPrice: 200 },
    { id: 'f_5_3', region: 5, rarityWeight: 2, name: '裝甲鄧氏魚 (Uncommon)', description: '頭部覆蓋骨甲防禦力驚人。', pullStrength: 55, behaviorInterval: 120, staminaMax: 800, color: '#8B0000', sellPrice: 350 },
    { id: 'f_5_4', region: 5, rarityWeight: 3, name: '虛空星鯨 (Rare)', description: '拉力如黑洞般沉重。', pullStrength: 70, behaviorInterval: 200, staminaMax: 1500, color: '#191970', sellPrice: 600 },
    { id: 'f_5_5', region: 5, rarityWeight: 4, name: '遠古海龍 (Epic)', description: '掙扎模式包含所有綜合體。', pullStrength: 85, behaviorInterval: 15, staminaMax: 1200, color: '#3CB371', sellPrice: 1500 },
    { id: 'f_5_6', region: 5, rarityWeight: 5, name: '混沌克蘇魯之卵 (Mutant)', description: '極致考驗。', pullStrength: 100, behaviorInterval: 5, staminaMax: 3000, color: '#4B0082', sellPrice: 3000 }
];

// 取得目前的魚池 (受限於所選區域與釣竿稀有度)
function getRandomFish(currentRegionId, maxRodRarity, rareSpawnBonus = 0) {
    // 過濾出符合當前區域，且稀有度<=釣竿上限的魚類
    const availableFish = FISH_TYPES.filter(fish =>
        fish.region === currentRegionId && fish.rarityWeight <= maxRodRarity
    );

    if (availableFish.length === 0) {
        availableFish.push(FISH_TYPES[0]); // fallback
    }

    // 設定各稀有度的基礎權重 (Weighted Random)
    const rarityWeights = {
        1: 100, // Common: 100
        2: 90,  // Uncommon: 90
        3: 80,  // Rare: 80
        4: 50,  // Epic: 50
        5: 30   // Mutant: 30
    };

    let totalWeight = 0;
    const weightedPool = availableFish.map(fish => {
        let weight = rarityWeights[fish.rarityWeight] || 1;
        
        // 稀有度 >= 3 的額外加成 (Region 4 Buff: rareSpawnBonus)
        if (fish.rarityWeight >= 3) {
            // 將 bonus 轉為對基礎權重的百分比提升 (例如 +18% 產出率)
            weight *= (1 + rareSpawnBonus);
        }
        
        totalWeight += weight;
        return { fish, weight };
    });

    let randomVal = Math.random() * totalWeight;
    let selectedTemplate = availableFish[0];

    for (let item of weightedPool) {
        randomVal -= item.weight;
        if (randomVal <= 0) {
            selectedTemplate = item.fish;
            break;
        }
    }

    return {
        ...selectedTemplate,
        staminaReal: selectedTemplate.staminaMax,
        currentPull: 0
    };
}
