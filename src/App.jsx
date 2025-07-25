import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import ConsoleMsg from "./utils/ConsoleMsg";
import { getCurrentWindow } from "@tauri-apps/api/window";
// 設定管理機能をインポート
import { loadConfig, saveConfig } from "./utils/ConfigManager";
// UIコンポーネントのインポート
import WindowTitlebar from "./components/WindowTitlebar/windowTitlebar";
import Statusbar from "./components/Statusbar/statusbar";

/**
 * アプリケーションのメインコンポーネント
 * 全体のレイアウトとテーマ管理を担当
 *
 * @component
 * @returns {JSX.Element} アプリケーションのルートコンポーネント
 */
function App() {
  /**
   * アプリケーションの状態管理
   * @type {[boolean, function]} isDarkMode - ダークモードの状態
   * @type {[string, function]} theme - 現在のテーマ
   * @type {[object, function]} appConfig - アプリケーション設定
   */
  const [isDarkMode, setIsDarkMode] = useState(
    window.matchMedia("(prefers-color-scheme:dark)").matches
  );
  const [appConfig, setAppConfig] = useState(null);

  /**
   * 設定ファイルを読み込む非同期関数
   * @async
   * @returns {Promise<Object>} 読み込んだ設定オブジェクト
   */
  async function loadAppConfig() {
    try {
      ConsoleMsg("info", "設定ファイルの読み込みを開始");
      const config = await loadConfig();
      ConsoleMsg("info", "設定ファイル:", config, config.window_state.theme);
      // 設定を状態に反映
      if (config.window_state.theme) {
        // setTheme(config.theme);
        ConsoleMsg("debug", `テーマを設定: ${config.window_state.theme}`);
      }
      return config;
    } catch (error) {
      ConsoleMsg("error", `設定ファイル読み込みエラー: ${error}`);
    }
  }

  /**
   * コンポーネントの初期化処理
   * マウント時に設定を読み込む
   */
  useEffect(() => {
    ConsoleMsg("info", "アプリケーション初期化開始");
    loadAppConfig().then((config) => {
      setAppConfig(config); // 結果を状態に保存
      ConsoleMsg("info", "ウィンドウ初期化");
      ConsoleMsg("debug", `現在のテーマ設定: ${config?.window_state?.theme}`);
    });
  }, []);

  return (
    <div className="text-foreground bg-background min-h-screen">
      <div className="color-text flex h-screen w-screen flex-col">
        <WindowTitlebar />
        <div className="color-primary flex-1 overflow-hidden">
          data
          {/* <MainContent /> */}
        </div>
        <Statusbar />
      </div>
    </div>
  );
}
export default App;
