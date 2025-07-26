import { getCurrentWindow } from "@tauri-apps/api/window";
import { loadStore, saveStore } from "./StoreManager";
import ConsoleMsg from "./ConsoleMsg";

/**
 * 現在のウィンドウ状態を設定ストアに保存してアプリケーションを終了する
 * @export
 * @async
 */
export async function saveWindowStateAndExit() {
  try {
    ConsoleMsg("info", "ウィンドウ状態を保存して終了します...");
    const win = getCurrentWindow();

    // ウィンドウが最大化されているかチェック
    const isMaximized = await win.isMaximized();
    ConsoleMsg("info", "ウィンドウが最大化されているか:", isMaximized);

    // 最大化中ならアンマックス化して位置更新を待つ
    if (isMaximized) {
      win.toggleMaximize();
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    // 位置とサイズを取得
    const position = await win.outerPosition();
    const size = await win.outerSize();

    // 既存設定を読み込み、windowState を更新
    const currentConfig = await loadStore();
    const updatedConfig = {
      ...currentConfig,
      windowState: {
        ...currentConfig.windowState,
        width: size.width,
        height: size.height,
        x: position.x,
        y: position.y,
        fullscreen: isMaximized,
      },
    };

    // ストアに保存
    await saveStore(updatedConfig);
    ConsoleMsg("info", "ウィンドウ状態を保存しました", updatedConfig.windowState);

    // ウィンドウを閉じて終了
    await win.close();
  } catch (error) {
    ConsoleMsg("error", "ウィンドウ状態の保存または終了処理に失敗しました:", error);
    // それでもウィンドウを閉じる
    const win = await getCurrentWindow();
    await win.close();
  }
}
