# 《SP》專案強制防呆程序 (Mandatory Safeguard Protocols)

為避免文件看板 (如 Project_Tracker.md) 與實體檔案庫狀態不一致導致的 AI 誤判，所有 AI 代理在執行任務時，**必須嚴格遵守**以下三道防呆程序：

1. **確立真實資料來源 (Source of Truth Shift)**：
   在盤點「美術素材」、「程式碼模組」或「測試案例」的完成度時，一律將實體代碼庫與資料夾 (File System) 視為 **100% 準確的第一參考源 (Primary Source of Truth)**。文件看板僅作為第二參考。
2. **強制盤點機制 (Mandatory Pre-Flight Validation)**：
   在向使用者回報「尚缺ＸＸ進度」或「下一步該做ＸＸ」之前，必須先使用系統指令 (`list_dir`, `find_by_name` 等) 進行自動化掃描與實體盤點。嚴禁未經實體驗證就直接採信文字看板的數量。
3. **主動除錯與同步 (Auto-Correction Protocol)**：
   若發現「看板紀錄」與「實體檔案庫」有出入（例如檔案已存在但看板未打勾），必須主動修正文件看板，讓文件與實體狀態保持完全同步。
4. **GDD 優先指導原則 (GDD Primary Guidance)**：
   一切設計以GDD為主，若有代碼層或其他地方與GDD違背，則視為要被修正的錯誤。
5. **強制 GDD 同步原則 (Mandatory GDD Sync)**：
   只要有改動到遊戲內的設定與設計 (例如遊戲數值、經濟系統等)，必須主動將改動同步更新至 GDD 之中，避免實際遊戲內容與設計文檔間出現落差。
6. **狀態持久化與陣列存檔原則 (State Persistence & Array Serialization)**：
   所有具備「一次性解鎖/購買」性質的系統（如裝備、船隻、圖鑑），在實作 `localStorage` 存讀檔時，**絕對禁止**只儲存「當前裝備 (Current State)」。必須建立對應的 `unlockedXXX` 陣列（Array）來永久紀錄玩家已獲得的項目，並確保在 `save()` 與 `load()` 階段確實執行寫入與防呆兜底 (Fallback)，嚴防玩家進度被覆蓋遺失。
