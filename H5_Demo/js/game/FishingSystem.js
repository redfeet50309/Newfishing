const GAME_STATE = {
  IDLE: "IDLE",
  CASTING: "CASTING",
  WAITING: "WAITING",
  REELING: "REELING",
  RESULT: "RESULT",
};

class FishingSystem {
  constructor() {
    this.load();
  }

  load() {
    const dataStr = localStorage.getItem("sp_fishing_save");
    if (dataStr) {
      try {
        const data = JSON.parse(dataStr);
        this.gold = data.gold || 0;
        this.currentRegionId = data.currentRegionId || 1;
        this.unlockedBoats = data.unlockedBoats || ["boat_0"];
        this.unlockedRods = data.unlockedRods || ["bamboo"];
        this.currentRod = data.currentRod || {
          id: "bamboo",
          name: "新手木竹竿",
          safeZoneMin: 30,
          safeZoneMax: 70,
          damage: 0.1,
          maxRarity: 3,
        };
        this.bestiary = data.bestiary || {};

        // --- Save Data Migration ---
        // Ensure currentRod is always in unlockedRods (fixes saves from before this logic existed)
        if (this.currentRod && this.currentRod.id && !this.unlockedRods.includes(this.currentRod.id)) {
          this.unlockedRods.push(this.currentRod.id);
        }
        // Ensure bamboo is always unlocked
        if (!this.unlockedRods.includes('bamboo')) {
          this.unlockedRods.push('bamboo');
        }
      } catch (e) {
        this.resetNewGame();
      }
    } else {
      this.resetNewGame();
    }

    // Reset volatile gameplay state
    this.resetGameplay();
  }

  save() {
    const data = {
      gold: this.gold,
      currentRegionId: this.currentRegionId,
      unlockedBoats: this.unlockedBoats,
      unlockedRods: this.unlockedRods,
      currentRod: this.currentRod,
      bestiary: this.bestiary,
    };
    localStorage.setItem("sp_fishing_save", JSON.stringify(data));
  }

  resetNewGame() {
    this.gold = 0;
    this.currentRegionId = 1; // Default to Tranquil Stream
    this.unlockedBoats = ["boat_0"]; // Default free boat
    this.unlockedRods = ["bamboo"]; // Default free rod
    this.currentRod = {
      id: "bamboo",
      name: "新手木竹竿",
      safeZoneMin: 30,
      safeZoneMax: 70,
      damage: 0.1,
      maxRarity: 3,
    };
    this.bestiary = {};
  }

  resetGameplay() {
    this.state = GAME_STATE.IDLE;

    // Reeling mechanic
    this.tension = 50; // 0 to 100
    this.isReeling = false;

    // Fish data
    this.currentFish = null;
    this.frameCounter = 0;

    // Result messages
    this.resultMessage = "";
    this.isNewRecord = false;
    this.isNewFish = false;
    this.resultTimer = 0;
  }

  getRegionBuffCount(regionId) {
    return Object.keys(this.bestiary).filter((id) =>
      id.startsWith(`f_${regionId}_`),
    ).length;
  }

  setReeling(active) {
    if (this.state === GAME_STATE.REELING) {
      this.isReeling = active;
    } else if (
      (this.state === GAME_STATE.IDLE || this.state === GAME_STATE.RESULT) &&
      active
    ) {
      // Immediately start reeling (skip casting and waiting)
      this.state = GAME_STATE.REELING;

      // Generate a fish that respects the player's current region and rod's max rarity
      // Pass the R4 buff (Rare Spawn Rate)
      const r4BuffCount = this.getRegionBuffCount(4);
      const rareSpawnBonus = r4BuffCount * 0.03; // +3% per fish

      this.currentFish = getRandomFish(
        this.currentRegionId,
        this.currentRod.maxRarity,
        rareSpawnBonus,
      );

      this.tension = 50;
      this.frameCounter = 0;
      this.isReeling = false; // Always start with slack to prevent auto-reeling bug!
    }
  }

  update(dt = 16.66) {
    switch (this.state) {
      case GAME_STATE.REELING:
        this.updateReeling(dt);
        break;
      case GAME_STATE.RESULT:
        this.resultTimer += dt;
        break;
    }
  }

  // removed updateWaiting()

  updateReeling(dt) {
    this.frameCounter++;
    const timeScale = dt / 16.66; // Normalize to 60FPS

    // 1. Calculate Base Tension Changes
    let tensionDelta = 0;

    // Player Reeling (+ Tension)
    if (this.isReeling) {
      tensionDelta += 0.4 * timeScale;
    } else {
      // Natural line slack / water resistance (- Tension)
      // Region 3 Buff: Slack Penalty Reduction (5% per fish, up to 30%)
      const r3Buff = this.getRegionBuffCount(3) * 0.05;
      const slackValue = 0.8 * (1 - r3Buff);
      tensionDelta -= slackValue * timeScale;
    }

    // 2. Fish AI Behavior
    // Every few frames, the fish decides what to do based on its specific behaviorInterval
    if (this.frameCounter % this.currentFish.behaviorInterval === 0) {
      const action = Math.random();
      // 40% chance to pull hard, 40% chance light pull, 20% chance to rest/swim towards player
      if (action > 0.6) {
        // Hard pull gives a sudden burst of force
        this.currentFish.currentPull = this.currentFish.pullStrength * 0.15;
      } else if (action > 0.2) {
        // Light pull
        this.currentFish.currentPull = this.currentFish.pullStrength * 0.05;
      } else {
        // Resting
        this.currentFish.currentPull = -1.0;
      }
    }

    // Ensure currentPull exists on first frame
    if (this.currentFish.currentPull === undefined) {
      this.currentFish.currentPull = 0;
    }

    // Apply frame-independent decay to the pull so it's a burst that fades
    if (this.currentFish.currentPull > 0) {
      this.currentFish.currentPull *= Math.pow(0.85, timeScale); // Decay (15% per 60FPS frame)
    } else if (this.currentFish.currentPull < 0) {
      this.currentFish.currentPull *= Math.pow(0.9, timeScale); // Decay resting pull back to 0
    }

    // --- DYNAMIC TENSION CAP ---
    // Instead of a global 1.0 limit, scale the cap based on fish rarity to maintain end-game difficulty!
    const rarityCaps = [1.0, 1.2, 1.5, 1.8, 2.2, 2.5]; // Index 1-5: Common(1.2) to Mutant(2.5)
    let baseCap = 1.0;
    if (this.currentFish && this.currentFish.rarityWeight !== undefined) {
      baseCap = rarityCaps[this.currentFish.rarityWeight] || 1.0;
    }

    // Region 5 Buff: Hard Cap Limit Reduction (2% per fish, up to 12%)
    const r5Buff = this.getRegionBuffCount(5) * 0.02;
    const maxHardCap = baseCap * (1 - r5Buff);

    let clampedPull = this.currentFish.currentPull;
    if (clampedPull > maxHardCap) clampedPull = maxHardCap;

    // Apply clamped fish pull to the tension delta, scaled by time
    tensionDelta += clampedPull * timeScale;

    // 3. Apply Delta and Cap Tension [0, 100]
    this.tension += tensionDelta;

    if (this.tension >= 100) {
      this.tension = 100;
    } else if (this.tension <= 0) {
      this.tension = 0;
    }

    // 4. Resolve Damage & Win/Loss Conditions
    if (
      this.tension >= this.currentRod.safeZoneMin &&
      this.tension <= this.currentRod.safeZoneMax
    ) {
      // Ideal tension! Damage the fish based on Rod power
      // Region 2 Buff: Damage Boost (2% per fish, up to 12%)
      const r2Buff = this.getRegionBuffCount(2) * 0.02;
      const finalDamage = this.currentRod.damage * (1 + r2Buff);
      this.currentFish.staminaReal -= finalDamage;
    } else if (this.tension < this.currentRod.safeZoneMin) {
      // Line too loose! Fish heals
      this.currentFish.staminaReal += 0.2;
      if (this.currentFish.staminaReal > this.currentFish.staminaMax) {
        this.currentFish.staminaReal = this.currentFish.staminaMax;
      }
    }

    // Win/Loss triggers
    if (this.currentFish.staminaReal <= 0) {
      this.state = GAME_STATE.RESULT;

      // Add to bestiary
      let isNew = false;
      if (!this.bestiary[this.currentFish.id]) {
        this.bestiary[this.currentFish.id] = { count: 0, maxWeight: 0 };
        isNew = true;
      }
      this.bestiary[this.currentFish.id].count += 1;

      // Generate random weight (simple formula based on staminaMax)
      const caughtWeight = (
        this.currentFish.staminaMax *
        0.1 *
        (0.8 + Math.random() * 0.4)
      ).toFixed(2);
      
      let isNewRecord = false;
      // 方案 B: 首次釣獲 (isNew) 或者是體重超越歷史紀錄，都算破紀錄
      if (isNew || parseFloat(caughtWeight) > this.bestiary[this.currentFish.id].maxWeight) {
          isNewRecord = true;
          this.bestiary[this.currentFish.id].maxWeight = parseFloat(caughtWeight);
      }

      // Calculate Base Gold with incremental buffs (Region 1: +2% per unlocked fish in Region 1)
      let goldBonus = 1.0;
      const r1FishCount = Object.keys(this.bestiary).filter((id) =>
        id.startsWith("f_1_"),
      ).length;
      goldBonus += r1FishCount * 0.02; // +2% per unique fish
      let finalGold = Math.floor(this.currentFish.sellPrice * goldBonus);

      let totalGoldGain = finalGold;
      let displayLines = [];

      // 取出第一個 "( " 前的字串，例如將 "平穩鯉魚 (Common)" 轉為 "平穩鯉魚"
      const pureFishName = this.currentFish.name.split(' (')[0];
      displayLines.push(`✨ 成功釣到：${pureFishName}！`);
      
      let weightLine = `體重: ${caughtWeight} kg`;
      if (isNewRecord && !isNew) { // 如果不是首次抓到但破紀錄，加個小 icon 在體重旁
          weightLine += ` 🌟 破紀錄! 🌟`;
      }
      displayLines.push(weightLine);
      displayLines.push(`💰 釣獲獎勵: ${finalGold} 金幣`);

      // Tier 1: Discover new fish bonus
      if (isNew) {
        const firstCatchBonus = Math.floor(this.currentFish.sellPrice * 5); // 5x bonus
        totalGoldGain += firstCatchBonus;
        displayLines.push(`⭐ 發現新魚種！額外獲得: ${firstCatchBonus} 金幣`);
      } 
      
      // Tier 2: New Weight Record bonus
      if (isNewRecord) {
        const recordBonus = 10;
        totalGoldGain += recordBonus;
        // 為了畫面不要太多「🌟 破紀錄!」，如果是首次開圖鑑又破紀錄，我們提示文案稍微變化
        const recordMsg = isNew ? `🌟 首隻體重創紀錄！額外獲得: ${recordBonus} 金幣` : `🌟 體重破紀錄！額外獲得: ${recordBonus} 金幣`;
        displayLines.push(recordMsg);
      }

      this.gold += totalGoldGain;

      this.save(); // Save progress!

      // Update state for main.js Rendering
      this.isNewFish = isNew;
      this.isNewRecord = isNewRecord;
      this.resultTimer = 0;

      this.resultMessage = displayLines.join('\n');
      this.isReeling = false;
    } else if (this.tension >= 100) {
      this.state = GAME_STATE.RESULT;
      this.resultMessage = `❌ 啪！釣魚線斷了...太用力了！`;
      this.isReeling = false;
    } else if (this.tension <= 0 && this.frameCounter > 60) {
      // Fish escaped due to slack line
      this.state = GAME_STATE.RESULT;
      this.resultMessage = `💨 魚跑掉了...線放太鬆了。`;
      this.isReeling = false;
    }
  }
}
