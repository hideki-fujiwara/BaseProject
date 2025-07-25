import React, { useState, useEffect, useRef } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import ConsoleMsg from "../../utils/ConsoleMsg";
import { loadMainPanelLayout, saveMainPanelLayout } from "../../utils/StoreManager";

function MainContent() {
  // ── デフォルトのレイアウト比率 (左:10%, 中央:80%, 右:10%／上:40%, 下:60%)
  const defaultLayout = { horizontal: [10, 80, 10], vertical: [40, 60] };

  // ── レイアウト状態を useState で管理
  const [horizontalLayout, setHorizontalLayout] = useState(defaultLayout.horizontal);
  const [verticalLayout, setVerticalLayout]   = useState(defaultLayout.vertical);

  // ── マウント時にストアから保存済みレイアウトを読み込んで state に設定
  useEffect(() => {
    const initLayouts = async () => {
      try {
        const layout = await loadMainPanelLayout();
        setHorizontalLayout(layout.horizontal);
        setVerticalLayout(layout.vertical);
        ConsoleMsg("info", "メインパネルレイアウトをSTOREから読み込み:", layout);
      } catch (e) {
        ConsoleMsg("error", "レイアウト読み込み失敗:", e);
      }
    };
    initLayouts();
  }, []); // 空配列で初回マウント時のみ実行

  // ── レイアウトが変更されたら 200ms デバウンスしてストアに保存
  useEffect(() => {
    layoutSetDefault();
    const timer = setTimeout(async () => {
      try {
        await saveMainPanelLayout(horizontalLayout, verticalLayout);
        ConsoleMsg("info", `メインパネルレイアウトをSTOREへ保存: H=[${horizontalLayout.join(", ")}] V=[${verticalLayout.join(", ")}]`);
      } catch (e) {
        ConsoleMsg("error", "レイアウト保存エラー:", e);
      }
    }, 200);

    // クリーンアップ: 次回の effect 実行前にタイマーをクリア
    return () => clearTimeout(timer);
  }, [horizontalLayout, verticalLayout]);

  // ── パネル要素への参照を取得 (必要に応じた外部制御用)
  const leftPanelRef      = useRef(null);
  const centerPanelRef    = useRef(null);
  const centerUpPanelRef  = useRef(null);
  const centerDownPanelRef= useRef(null);
  const rightPanelRef     = useRef(null);

  // ── ImperativeHandle 経由でレイアウトを直接適用する場合のヘルパー
  const layoutSetDefault = () => {
    const leftPanel = leftPanelRef.current;
    if (leftPanel) {
      leftPanel.resize(horizontalLayout[0]);
    }
    const centerPanel = centerPanelRef.current;
    if (centerPanel) {
      centerPanel.resize(horizontalLayout[1]);
    }
    const rightPanel = rightPanelRef.current;
    if (rightPanel) {
      rightPanel.resize(horizontalLayout[2]);
    }
    const centerUpPanel = centerUpPanelRef.current;
    if (centerUpPanel) {
      centerUpPanel.resize(verticalLayout[0]);
    }
    const centerDownPanel = centerDownPanelRef.current;
    if (centerDownPanel) {
      centerDownPanel.resize(verticalLayout[1]);
    }
  };

  return (
    <div className="h-full w-full flex-col bg-base-100">
      <PanelGroup direction="horizontal" onLayout={(sizes) => setHorizontalLayout(sizes)} className="h-full">
        {/* 左パネル */}
        <Panel ref={leftPanelRef} collapsible collapsedSize={3} minSize={10} className="overflow-auto">
          <div className="h-full p-4 text-base-content">
            左パネルサイドバー
            <p className="mt-4 text-accent">現在のサイズ: {horizontalLayout[0].toFixed(2)}%</p>
          </div>
        </Panel>
        <PanelResizeHandle className="w-1 bg-base-200 hover:bg-accent-content active:w-1.5 active:bg-accent-content" />
        {/* 中央パネル (上下に分割) */}
        <Panel ref={centerPanelRef} className="overflow-auto">
          <PanelGroup direction="vertical" onLayout={(sizes) => setVerticalLayout(sizes)} className="h-full">
            {/* 中央上パネル */}
            <Panel ref={centerUpPanelRef} className="overflow-auto">
              <div className="h-full p-4 text-base-content">
                中央パネルコンテンツ
                <p className="mt-4 text-accent">現在のサイズ: {verticalLayout[0].toFixed(2)}%</p>
              </div>
            </Panel>
            <PanelResizeHandle className="h-1 bg-base-200 hover:bg-accent-content active:h-1.5 active:bg-accent-content" />
            {/* 中央下パネル (ログ表示) */}
            <Panel ref={centerDownPanelRef} minSize={10} className="overflow-auto">
              <div className="h-full p-4">
                <h2 className="mb-2 text-lg font-semibold text-base-content">
                  ログ
                </h2>
                <div className="h-[calc(100%-2.5rem)] overflow-y-auto">
                  <div className="space-y-1 text-sm">
                    <div className="text-info">[INFO] アプリケーションを起動しました</div>
                    <div className="text-success">[SUCCESS] 設定を読み込みました</div>
                    <div className="text-warning">[WARNING] 一部の設定が見つかりません</div>
                    <div className="text-error">[ERROR] ファイルの読み込みに失敗しました</div>
                  </div>
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </Panel>
        <PanelResizeHandle className="w-1 bg-base-200 hover:bg-accent-content active:w-1.5 active:bg-accent-content" />
        {/* 右パネル */}
        <Panel ref={rightPanelRef} collapsible collapsedSize={0} minSize={10} className="overflow-auto">
          <div className="h-full p-4 text-base-content">
            右パネルサイドバー
            <p className="mt-4 text-accent">現在のサイズ: {horizontalLayout[2].toFixed(2)}%</p>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
export default MainContent;
