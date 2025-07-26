// ========================================================================================
// インポート
// ========================================================================================
import React, { useState, useEffect, useRef } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import ConsoleMsg from "../../utils/ConsoleMsg";
import { loadMainPanelLayout, saveMainPanelLayout } from "../../utils/StoreManager";

/**
 * メインコンテンツコンポーネント
 *
 * アプリケーションのメイン作業領域を提供する。
 * 3列（左サイドバー、中央メイン、右サイドバー）のレイアウトで、
 * 中央は上下2段に分割されている。
 *
 * パネルサイズは react-resizable-panels を使用してリサイズ可能で、
 * レイアウト状態は自動的にストアに保存・復元される。
 *
 * レイアウト構成:
 * ┌─────┬─────────────┬─────┐
 * │ 左  │   中央上     │ 右  │
 * │サイド├─────────────┤サイド│
 * │バー │   中央下     │バー │
 * │     │  (ログ表示)   │     │
 * └─────┴─────────────┴─────┘
 */
function MainContent() {
  // ========================================================================================
  // 定数・デフォルト値
  // ========================================================================================

  /**
   * デフォルトのレイアウト比率
   * - horizontal: [左%, 中央%, 右%] = [10%, 80%, 10%]
   * - vertical: [上%, 下%] = [40%, 60%]
   */
  const defaultLayout = {
    horizontal: [10, 80, 10], // 水平方向の分割比率
    vertical: [40, 60], // 垂直方向の分割比率（中央パネル内）
  };

  // ========================================================================================
  // 状態管理
  // ========================================================================================

  /**
   * 水平方向のレイアウト状態
   * [左パネル%, 中央パネル%, 右パネル%] の配列
   */
  const [horizontalLayout, setHorizontalLayout] = useState(defaultLayout.horizontal);

  /**
   * 垂直方向のレイアウト状態
   * [中央上パネル%, 中央下パネル%] の配列
   */
  const [verticalLayout, setVerticalLayout] = useState(defaultLayout.vertical);

  // ========================================================================================
  // パネル参照
  // ========================================================================================

  /**
   * 各パネルへの参照
   * プログラムからパネルサイズを制御する際に使用
   */
  const leftPanelRef = useRef(null); // 左サイドバー
  const centerPanelRef = useRef(null); // 中央パネル全体
  const centerUpPanelRef = useRef(null); // 中央上パネル
  const centerDownPanelRef = useRef(null); // 中央下パネル（ログ表示）
  const rightPanelRef = useRef(null); // 右サイドバー

  // ========================================================================================
  // 初期化処理
  // ========================================================================================

  /**
   * コンポーネントマウント時の初期化処理
   * ストアから保存済みレイアウトを読み込んで状態を復元する
   */
  useEffect(() => {
    const initLayouts = async () => {
      try {
        // ストアからレイアウト設定を読み込み
        const layout = await loadMainPanelLayout();

        // 読み込んだ値で状態を更新
        setHorizontalLayout(layout.horizontal);
        setVerticalLayout(layout.vertical);

        ConsoleMsg("info", "メインパネルレイアウトをSTOREから読み込み:", layout);
      } catch (e) {
        // 読み込み失敗時はデフォルト値を使用
        ConsoleMsg("error", "レイアウト読み込み失敗:", e);
      }
    };

    initLayouts();
  }, []); // 空配列で初回マウント時のみ実行

  // ========================================================================================
  // レイアウト保存処理
  // ========================================================================================

  /**
   * レイアウト変更時の自動保存処理
   *
   * パネルサイズが変更される度に実行され、デバウンス処理（200ms）後に
   * 新しいレイアウト情報をストアに保存する。
   * 頻繁なリサイズ操作でも効率的に処理できるように設計。
   */
  useEffect(() => {
    // パネルに現在のレイアウトを適用
    layoutSetDefault();

    // デバウンス処理: 200ms後に保存実行
    const timer = setTimeout(async () => {
      try {
        // ストアにレイアウト情報を保存
        await saveMainPanelLayout(horizontalLayout, verticalLayout);

        ConsoleMsg("info", `メインパネルレイアウトをSTOREへ保存: H=[${horizontalLayout.join(", ")}] V=[${verticalLayout.join(", ")}]`);
      } catch (e) {
        ConsoleMsg("error", "レイアウト保存エラー:", e);
      }
    }, 200);

    // クリーンアップ: 次回のeffect実行前にタイマーをクリア
    // メモリリークとタイマー重複を防止
    return () => clearTimeout(timer);
  }, [horizontalLayout, verticalLayout]); // レイアウト変更時に実行

  // ========================================================================================
  // ヘルパー関数
  // ========================================================================================

  /**
   * パネルサイズを現在の状態値に基づいて適用する
   *
   * ImperativeHandle経由でレイアウトを直接制御する場合に使用。
   * 各パネルの参照を通じて、状態の値をパネルのサイズに反映する。
   */
  const layoutSetDefault = () => {
    // 左パネルのサイズを設定
    const leftPanel = leftPanelRef.current;
    if (leftPanel) {
      leftPanel.resize(horizontalLayout[0]);
    }

    // 中央パネルのサイズを設定
    const centerPanel = centerPanelRef.current;
    if (centerPanel) {
      centerPanel.resize(horizontalLayout[1]);
    }

    // 右パネルのサイズを設定
    const rightPanel = rightPanelRef.current;
    if (rightPanel) {
      rightPanel.resize(horizontalLayout[2]);
    }

    // 中央上パネルのサイズを設定
    const centerUpPanel = centerUpPanelRef.current;
    if (centerUpPanel) {
      centerUpPanel.resize(verticalLayout[0]);
    }

    // 中央下パネルのサイズを設定
    const centerDownPanel = centerDownPanelRef.current;
    if (centerDownPanel) {
      centerDownPanel.resize(verticalLayout[1]);
    }
  };

  // ========================================================================================
  // レンダリング
  // ========================================================================================

  return (
    <div className="h-full w-full flex-col bg-base-100">
      {/* ======================================================================================== */}
      {/* 水平方向のパネルグループ（左・中央・右の3列レイアウト） */}
      {/* ======================================================================================== */}

      <PanelGroup
        direction="horizontal"
        onLayout={(sizes) => setHorizontalLayout(sizes)} // サイズ変更時のコールバック
        className="h-full"
      >
        {/* ======================================================================================== */}
        {/* 左パネル（サイドバー） */}
        {/* ======================================================================================== */}

        <Panel
          ref={leftPanelRef}
          collapsible // 折りたたみ可能
          collapsedSize={3} // 折りたたみ時のサイズ（3%）
          minSize={10} // 最小サイズ（10%）
          className="overflow-auto"
        >
          <div className="h-full p-4 text-base-content">
            {/* 左サイドバーのコンテンツ */}
            左パネルサイドバー
            {/* デバッグ情報: 現在のサイズ表示 */}
            <p className="mt-4 text-accent">現在のサイズ: {horizontalLayout[0].toFixed(2)}%</p>
          </div>
        </Panel>

        {/* 左パネルと中央パネルの境界線 */}
        <PanelResizeHandle className="w-1 bg-base-200 hover:bg-accent-content active:w-1.5 active:bg-accent-content" />

        {/* ======================================================================================== */}
        {/* 中央パネル（上下に分割される親パネル） */}
        {/* ======================================================================================== */}

        <Panel ref={centerPanelRef} className="overflow-auto">
          {/* 垂直方向のパネルグループ（上下2段レイアウト） */}
          <PanelGroup
            direction="vertical"
            onLayout={(sizes) => setVerticalLayout(sizes)} // サイズ変更時のコールバック
            className="h-full"
          >
            {/* ======================================================================================== */}
            {/* 中央上パネル（メインワークエリア） */}
            {/* ======================================================================================== */}

            <Panel ref={centerUpPanelRef} className="overflow-auto">
              <div className="h-full p-4 text-base-content">
                {/* メインコンテンツエリア */}
                中央パネルコンテンツ
                {/* デバッグ情報: 現在のサイズ表示 */}
                <p className="mt-4 text-accent">現在のサイズ: {verticalLayout[0].toFixed(2)}%</p>
              </div>
            </Panel>

            {/* 中央上パネルと中央下パネルの境界線 */}
            <PanelResizeHandle className="h-1 bg-base-200 hover:bg-accent-content active:h-1.5 active:bg-accent-content" />

            {/* ======================================================================================== */}
            {/* 中央下パネル（ログ表示エリア） */}
            {/* ======================================================================================== */}

            <Panel
              ref={centerDownPanelRef}
              minSize={10} // 最小サイズ（10%）
              className="overflow-auto"
            >
              <div className="h-full p-4">
                {/* ログエリアのヘッダー */}
                <h2 className="mb-2 text-lg font-semibold text-base-content">ログ</h2>

                {/* 
                  ログ表示領域
                  - h-[calc(100%-2.5rem)]: ヘッダー分を除いた高さを計算
                  - overflow-y-auto: 縦スクロール有効
                */}
                <div className="h-[calc(100%-2.5rem)] overflow-y-auto">
                  <div className="space-y-1 text-sm">
                    {/* サンプルログエントリ（実際の実装では動的に生成） */}
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

        {/* 中央パネルと右パネルの境界線 */}
        <PanelResizeHandle className="w-1 bg-base-200 hover:bg-accent-content active:w-1.5 active:bg-accent-content" />

        {/* ======================================================================================== */}
        {/* 右パネル（サイドバー） */}
        {/* ======================================================================================== */}

        <Panel
          ref={rightPanelRef}
          collapsible // 折りたたみ可能
          collapsedSize={0} // 折りたたみ時のサイズ（完全非表示）
          minSize={10} // 最小サイズ（10%）
          className="overflow-auto"
        >
          <div className="h-full p-4 text-base-content">
            {/* 右サイドバーのコンテンツ */}
            右パネルサイドバー
            {/* デバッグ情報: 現在のサイズ表示 */}
            <p className="mt-4 text-accent">現在のサイズ: {horizontalLayout[2].toFixed(2)}%</p>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}

// ========================================================================================
// エクスポート
// ========================================================================================

export default MainContent;
