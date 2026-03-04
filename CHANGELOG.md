# 《SP》專案 更新日誌 (Changelog)

## [Unreleased]
### Added
- 魚類 AI 新增「游向玩家/下潛」的多向拉力機制 (Directional Pull)。
- 張力引擎新增防呆與防爆震盪機制 (Anti-Frustration Oscillation)。
- 針對魚類的「強拉 (Hard Pull)」增加了微型冷卻時間。

### Changed
- 魚類 AI 發力區間機率更新為符合最新 GDD：20% 強拉、50% 輕拉、30% 休息/游向玩家。
- 確認並修正漁獲金幣、機率加成與圖鑑獎勵，與現行設計完全一致。
- 修正動態張力上限 (Dynamic Tension Cap)，確保 Common 等級限制為 1.0/幀。
