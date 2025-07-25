import { useRef, useState, useEffect } from "react";
import { Button } from "react-aria-components";
import { getCurrentWindow } from "@tauri-apps/api/window";
import ConsoleMsg from "../../utils/ConsoleMsg";
import Menu from "../Menu/Menu";
import { saveWindowStateAndExit } from "../../utils/windowManager";

// ウィンドウを最小化する関数
function window_minimize() {
  // ウィンドウ最小化前のデバッグメッセージを表示
  ConsoleMsg("debug", "window minimize");
  // Tauri API を使用してウィンドウを最小化
  getCurrentWindow().minimize();
}
// ウィンドウを最大化または元に戻す(トグル)する関数
function window_maximize() {
  // ウィンドウ最大化処理の開始前にデバッグメッセージを表示
  ConsoleMsg("debug", "window maximize");
  // Tauri API を使用してウィンドウの最大化/元に戻す処理をトグル
  getCurrentWindow().toggleMaximize();
}
// ウィンドウを閉じる関数
function window_close() {
  // ウィンドウを閉じる前にデバッグメッセージを表示
  ConsoleMsg("debug", "window close");
  // ウィンドウ状態を保存して終了する関数を呼び出す
  saveWindowStateAndExit();
}

function WindowsTitlebar() {
  return (
    <div className="flex h-12 min-h-8 w-full items-center rounded-t-lg bg-base-200 p-2 px-0 py-2">
      {/* ドラッグ可能な領域 */}
      <div data-tauri-drag-region className="flex h-full flex-1">
        <Menu />
      </div>
      {/* ウィンドウ操作ボタン群 */}
      <div className="flex-none">
        {/* 最小化ボタン */}
        <Button
          className="inline-flex h-10 w-10 shrink-0 cursor-pointer flex-nowrap items-center justify-center gap-2.5 rounded-md bg-base-200 text-center align-middle outline-0 hover:bg-base-300"
          onClick={() => window_minimize()}
        >
          <span className="i-mdi-window-minimize h-6 w-6 text-base-content"></span>
        </Button>
        {/* 最大化/元に戻すボタン */}
        <Button
          className="inline-flex h-10 w-10 shrink-0 cursor-pointer flex-nowrap items-center justify-center gap-2.5 rounded-md bg-base-200 text-center align-middle outline-0 hover:bg-base-300"
          onClick={() => window_maximize()}
        >
          <span className="i-mdi-window-maximize h-6 w-6 text-base-content"></span>
        </Button>
        {/* 閉じるボタン */}
        <Button
          className="inline-flex h-10 w-10 shrink-0 cursor-pointer flex-nowrap items-center justify-center gap-2.5 rounded-md bg-base-200 text-center align-middle outline-0 hover:bg-error"
          onClick={() => window_close()}
        >
          <span className="i-mdi-close h-6 w-6 text-base-content"></span>
        </Button>
      </div>
    </div>
  );
}
export default WindowsTitlebar;
