import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import ConsoleMsg from "./utils/ConsoleMsg";
import { loadStore, saveStore } from "./utils/StoreManager";
import { increaseFontSize, decreaseFontSize, resetFontSize, restoreFontSize } from "./utils/fontSizeManager";
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

  // ========================================================================================
  // キーボードイベントハンドラー
  // ========================================================================================

  /**
   * キーボードショートカットの処理
   * フォントサイズ制御のショートカットキーを検知する
   *
   * @param {KeyboardEvent} event - キーボードイベント
   */
  const handleKeyDown = useCallback((event) => {
    // Ctrl（またはCmd on Mac）+ Plus キーの検知
    if ((event.ctrlKey || event.metaKey) && (event.key === "+" || event.key === "=" || event.code === "Equal")) {
      event.preventDefault(); // ブラウザのデフォルトズーム動作を防止

      ConsoleMsg("info", "Ctrl+Plus キーが押下されました");
      increaseFontSize(); // フォントサイズ拡大
    }

    // Ctrl + Minus キー
    if ((event.ctrlKey || event.metaKey) && event.key === "-") {
      event.preventDefault();
      ConsoleMsg("info", "Ctrl+Minus キーが押下されました");
      decreaseFontSize(); // フォントサイズ縮小
    }

    // Ctrl + 0 キー（リセット）
    if ((event.ctrlKey || event.metaKey) && event.key === "0") {
      event.preventDefault();
      ConsoleMsg("info", "Ctrl+0 キーが押下されました");
      resetFontSize(); // フォントサイズリセット
    }
  }, []);

  // ========================================================================================
  // 初期化処理
  // ========================================================================================

  // アプリ起動時に STORE から設定を読み込む
  useEffect(() => {
    const init = async () => {
      ConsoleMsg("info", "App.jsx アプリケーション Started");

      try {
        // 保存されたフォントサイズを復元
        restoreFontSize();

        // アプリケーション設定を読み込み
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

  // キーボードイベントリスナーの登録・削除
  useEffect(() => {
    // キーボードイベントリスナーを追加
    document.addEventListener("keydown", handleKeyDown);

    ConsoleMsg("info", "フォントサイズ制御のキーボードショートカットを登録しました");

    // クリーンアップ: コンポーネントのアンマウント時にリスナーを削除
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      ConsoleMsg("info", "キーボードショートカットを削除しました");
    };
  }, [handleKeyDown]);

  // ========================================================================================
  // イベントハンドラー
  // ========================================================================================

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

  // ========================================================================================
  // レンダリング
  // ========================================================================================

  return (
    <div className="text-base-content bg-base-100 min-h-screen">
      {/* メインレイアウト：縦方向のフレックスボックス */}
      <div className="flex h-screen w-screen flex-col">
        {/* ウィンドウタイトルバー */}
        <WindowTitlebar />
        <div className="flex-1 overflow-hidden">
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
