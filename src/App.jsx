import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import ConsoleMsg from "./utils/ConsoleMsg";
import { loadStore, saveStore } from "./utils/StoreManager";
import WindowTitlebar from "./components/WindowTitlebar/windowTitlebar";
import MainContent from "./components/MainContent/mainContent";
import Statusbar from "./components/Statusbar/statusbar";
import ProjectInfoDialog from "./components/ProjectInfoDialog/ProjectInfoDialog";

/**
 * アプリケーションのメインコンポーネント
 * 全体のレイアウトとテーマ管理を担当
 *
 * @component
 * @returns {JSX.Element} アプリケーションのルートコンポーネント
 */
function App() {
  // 初期ステートを明示的に設定
  const [config, setConfig] = useState({
    projectConfig: {},
    windowConfig: {},
    windowState: {},
  });
  const [showProjectDialog, setShowProjectDialog] = useState(false);

  // アプリ起動時に STORE から設定を読み込む
  useEffect(() => {
    const init = async () => {
      ConsoleMsg("info", "App.jsx アプリケーション Started");
      try {
        const cfg = await loadStore();
        setConfig(cfg);
        if (!cfg.projectConfig?.name?.trim()) {
          ConsoleMsg("info", "プロジェクト情報が空白のため、入力ダイアログを表示します");
          setShowProjectDialog(true);
        }
      } catch (error) {
        ConsoleMsg("error", "アプリケーション初期化に失敗しました", error);
      }
    };
    init();
  }, []); // 空の依存配列で初回マウント時のみ実行

  // プロジェクト情報保存ハンドラ
  const handleSaveProject = useCallback(
    async (projectInfo) => {
      const newConfig = { ...config, projectConfig: projectInfo };
      try {
        await saveStore(newConfig);
        setConfig(newConfig);
        ConsoleMsg("info", "プロジェクト情報をストアへ保存", newConfig);
      } catch (error) {
        ConsoleMsg("error", `ストア保存エラー: ${error}`);
      } finally {
        setShowProjectDialog(false);
      }
    },
    [config]
  );

  return (
    <div className="text-foreground bg-background min-h-screen">
      {/* メインレイアウト：縦方向のフレックスボックス */}
      <div className="color-text flex h-screen w-screen flex-col">
        {/* ウィンドウタイトルバー */}
        <WindowTitlebar />
        <div className="bg-base-100 flex-1 overflow-hidden">
          {/* メインコンテンツエリア */}
          <MainContent />
        </div>
        {/* ステータスバー */}
        <Statusbar />
      </div>

      {/* プロジェクト情報入力ダイアログ - アプリ全体にオーバーレイ */}
      {/* 条件レンダリング：showProjectDialogがtrueの場合のみ表示 */}
      {showProjectDialog && (
        <ProjectInfoDialog
          onClose={() => setShowProjectDialog(false)} // ダイアログを閉じる処理
          onSave={handleSaveProject} // プロジェクト情報保存処理
        />
      )}
    </div>
  );
}

export default App;
