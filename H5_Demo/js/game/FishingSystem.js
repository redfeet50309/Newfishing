const GAME_STATE = {
    IDLE: 'IDLE',
    CASTING: 'CASTING',
    WAITING: 'WAITING',
    REELING: 'REELING',
    RESULT: 'RESULT'
};

class FishingSystem {
    constructor() {
        this.load();
    }

    load() {
        const dataStr = localStorage.getItem('sp_fishing_save');
        if (dataStr) {
            try {
                const data = JSON.parse(dataStr);
                this.gold = data.gold || 0;
                this.currentRegionId = data.currentRegionId || 1;
                this.unlockedBoats = data.unlockedBoats || ['boat_0'];
                this.currentRod = data.currentRod || { id: 'bamboo', name: '新手木竹竿', safeZoneMin: 30, safeZoneMax: 70, damage: 0.1, maxRarity: 1 };
                this.bestiary = data.bestiary || {};
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
            currentRod: this.currentRod,
            bestiary: this.bestiary
        };
        localStorage.setItem('sp_fishing_save', JSON.stringify(data));
    }

    resetNewGame() {
        this.gold = 0;
        this.currentRegionId = 1; // Default to Tranquil Stream
        this.unlockedBoats = ['boat_0']; // Default free boat
        this.currentRod = {
            id: 'bamboo',
            name: '新手木竹竿',
            safeZoneMin: 30,
            safeZoneMax: 70,
            damage: 0.1,
            maxRarity: 1
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
    }

    getRegionBuffCount(regionId) {
        return Object.keys(this.bestiary).filter(id => id.startsWith(`f_${regionId}_`)).length;
    }

    setReeling(active) {
        if (this.state === GAME_STATE.REELING) {
            this.isReeling = active;
        } else if ((this.state === GAME_STATE.IDLE || this.state === GAME_STATE.RESULT) && active) {
            // Immediately start reeling (skip casting and waiting)
            this.state = GAME_STATE.REELING;

            // Generate a fish that respects the player's current region and rod's max rarity
            // Pass the R4 buff (Rare Spawn Rate)
            const r4BuffCount = this.getRegionBuffCount(4);
            const rareSpawnBonus = r4BuffCount * 0.03; // +3% per fish

            this.currentFish = getRandomFish(this.currentRegionId, this.currentRod.maxRarity, rareSpawnBonus);

            this.tension = 50;
            this.frameCounter = 0;
            this.isReeling = true;
        }
    }

    update() {
        switch (this.state) {
            case GAME_STATE.REELING:
                this.updateReeling();
                break;
        }
    }

    // removed updateWaiting()

    updateReeling() {
        this.frameCounter++;

        // 1. Calculate Base Tension Changes
        let tensionDelta = 0;

        // Player Reeling (+ Tension)
        if (this.isReeling) {
            tensionDelta += 1.2;
        } else {
            // Natural line slack / water resistance (- Tension)
            // Region 3 Buff: Slack Penalty Reduction (5% per fish, up to 30%)
            const r3Buff = this.getRegionBuffCount(3) * 0.05;
            const slackValue = 1.2 * (1 - r3Buff);
            tensionDelta -= slackValue;
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

        // Apply decay to the pull so it's a burst that fades, preventing runaway tension
        // This simulates the fish jerking the line
        if (this.currentFish.currentPull > 0) {
            this.currentFish.currentPull *= 0.85; // Faster decay (15% per frame)
        } else if (this.currentFish.currentPull < 0) {
            this.currentFish.currentPull *= 0.90; // Decay resting pull back to 0
        }

        // --- THE FIX FOR RUNAWAY TENSION ---
        // Region 5 Buff: Hard Cap Limit Reduction (2% per fish, up to 12%)
        const r5Buff = this.getRegionBuffCount(5) * 0.02;
        const maxHardCap = 2.5 * (1 - r5Buff);

        let clampedPull = this.currentFish.currentPull;
        if (clampedPull > maxHardCap) clampedPull = maxHardCap;

        // Apply clamped fish pull to the tension delta
        tensionDelta += clampedPull;

        // 3. Apply Delta and Cap Tension [0, 100]
        this.tension += tensionDelta;

        if (this.tension >= 100) {
            this.tension = 100;
        } else if (this.tension <= 0) {
            this.tension = 0;
        }

        // 4. Resolve Damage & Win/Loss Conditions
        if (this.tension >= this.currentRod.safeZoneMin && this.tension <= this.currentRod.safeZoneMax) {
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
            const caughtWeight = (this.currentFish.staminaMax * 0.1 * (0.8 + Math.random() * 0.4)).toFixed(2);
            if (parseFloat(caughtWeight) > this.bestiary[this.currentFish.id].maxWeight) {
                this.bestiary[this.currentFish.id].maxWeight = parseFloat(caughtWeight);
            }

            // Calculate Gold with incremental buffs (Region 1: +2% per unlocked fish in Region 1)
            let goldBonus = 1.0;
            const r1FishCount = Object.keys(this.bestiary).filter(id => id.startsWith('f_1_')).length;
            goldBonus += (r1FishCount * 0.02); // +2% per unique fish
            const finalGold = Math.floor(this.currentFish.sellPrice * goldBonus);

            this.gold += finalGold;
            this.save(); // Save progress!

            let extraMsg = isNew ? '\n⭐ 圖鑑已解鎖 (NEW) ⭐' : '';
            this.resultMessage = `✨ 成功釣到：${this.currentFish.name}！\n(${this.currentFish.description})${extraMsg}\n\n體重: ${caughtWeight} kg\n💰 獲得 ${finalGold} 金幣`;
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
