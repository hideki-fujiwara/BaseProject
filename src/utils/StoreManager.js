import { load } from "@tauri-apps/plugin-store";
import { configDir } from "@tauri-apps/api/path";
import ConsoleMsg from "./ConsoleMsg";

const STORE_FILE = "BaseProject.config";

/**
 * STORE プラグイン経由で設定を読み込む
 * @returns {Promise<{projectConfig: object, windowConfig: object, windowState: object}>}
 */
export async function loadStore() {
  try {
    ConsoleMsg("info", "ストアから設定を読み込み開始");
    // 設定ディレクトリのパス
    const dir = `${await configDir()}\\BaseProject`;
    // ストアファイルをオープン（なければ自動生成）
    const store = await load(`${dir}\\${STORE_FILE}`);
    ConsoleMsg("debug", `ストアパス: ${dir}\\${STORE_FILE}`);

    // キー取得（未定義なら空オブジェクト）
    const projectConfig = (await store.get("project_config")) ?? {};
    const windowConfig = (await store.get("window_config")) ?? {};
    const windowState = (await store.get("window_state")) ?? {};

    const cfg = { projectConfig, windowConfig, windowState };
    ConsoleMsg("info", "読み込んだ設定:", cfg);
    return cfg;
  } catch (error) {
    ConsoleMsg("error", `ストア読み込みエラー: ${error}`);
    throw error;
  }
}

/**
 * STORE プラグイン経由で設定を保存する
 * @param {{projectConfig: object, windowConfig: object, windowState: object}} config
 */
export async function saveStore({ projectConfig, windowConfig, windowState }) {
  try {
    ConsoleMsg("info", "ストアへの設定保存開始");
    const dir = `${await configDir()}\\BaseProject`;
    const store = await load(`${dir}\\${STORE_FILE}`);
    ConsoleMsg("debug", `ストアパス: ${dir}\\${STORE_FILE}`);

    // キーを書き込み
    await store.set("project_config", projectConfig);
    await store.set("window_config", windowConfig);
    await store.set("window_state", windowState);
    // 永続化
    await store.save();
    ConsoleMsg("info", "ストアへの保存が完了しました");
  } catch (error) {
    ConsoleMsg("error", `ストア保存エラー: ${error}`);
    throw error;
  }
}

/**
 * メインパネルレイアウトをストアから読み込む
 * @returns {{ horizontal: number[], vertical: number[] }}
 */
export async function loadMainPanelLayout() {
  const cfg = await loadStore();
  // windowState.main_panel_layout があればそれを返し、なければデフォルト値を返す
  return (
    cfg.windowState?.main_panel_layout ?? {
      horizontal: [15, 70, 15],
      vertical: [85, 15],
    }
  );
}

/**
 * メインパネルレイアウトをストアへ保存する
 * @param {number[]} horizontal
 * @param {number[]} vertical
 */
export async function saveMainPanelLayout(horizontal, vertical) {
  // フロート値を整数に丸めてから保存
  const hInts = horizontal.map((n) => Math.round(n));
  const vInts = vertical.map((n) => Math.round(n));
  const cfg = await loadStore();
  const newCfg = {
    ...cfg,
    windowState: {
      ...cfg.windowState,
      main_panel_layout: { horizontal: hInts, vertical: vInts },
    },
  };
  await saveStore(newCfg);
}
