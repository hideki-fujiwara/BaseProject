// ========================================================================================
// インポート
// ========================================================================================
import { useState } from "react";
import ConsoleMsg from "../../utils/ConsoleMsg";
import { saveWindowStateAndExit } from "../../utils/windowManager";

/**
 * プロジェクト情報入力ダイアログコンポーネント
 *
 * アプリケーション初期化時に表示されるモーダルダイアログ。
 * ユーザーからプロジェクトの基本情報（名前、パス、備考）を収集し、
 * 必須項目のバリデーションを実行する。
 * キャンセル時は誤操作防止のため二段階確認を実装。
 *
 * @param {Object} props - コンポーネントのプロパティ
 * @param {Function} props.onClose - ダイアログを閉じる関数（現在は未使用）
 * @param {Function} props.onSave - プロジェクト情報を保存する関数（引数: projectInfo）
 */
function ProjectInfoDialog({ onClose, onSave }) {
  // ========================================================================================
  // 状態管理
  // ========================================================================================

  /**
   * プロジェクト情報の入力状態
   * - name: プロジェクト名（必須項目）
   * - filepath: プロジェクトファイルのパス（任意）
   * - remarks: プロジェクトに関する備考（任意、複数行対応）
   */
  const [projectInfo, setProjectInfo] = useState({
    name: "", // プロジェクト名（必須フィールド）
    filepath: "", // プロジェクトファイルのパス（任意）
    remarks: "", // プロジェクトに関する備考（任意、複数行可能）
  });

  /**
   * 確認ダイアログの表示状態
   * キャンセルボタンクリック時の二段階確認用
   */
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // ========================================================================================
  // イベントハンドラー
  // ========================================================================================

  /**
   * 入力フィールドの値を更新する汎用ハンドラー
   *
   * 任意のフィールドを動的に更新できるよう設計。
   * スプレッド演算子を使用して不変性を保持。
   *
   * @param {string} field - 更新するフィールド名（name, filepath, remarks）
   * @param {string} value - 新しい値
   */
  const handleInputChange = (field, value) => {
    setProjectInfo((prev) => ({
      ...prev, // 既存の値を維持（不変性の保持）
      [field]: value, // 指定されたフィールドのみ更新（computed property names）
    }));
  };

  /**
   * プロジェクト情報の保存処理
   *
   * 1. 必須項目（プロジェクト名）のバリデーション実行
   * 2. バリデーション成功時は親コンポーネントに情報を送信
   * 3. 失敗時は警告メッセージを表示して処理を中断
   */
  const handleSave = () => {
    // プロジェクト名の必須チェック
    // trim()で前後の空白を除去してから判定
    if (!projectInfo.name.trim()) {
      ConsoleMsg("warn", "プロジェクト名は必須です");
      return; // バリデーション失敗時は処理を中断
    }

    // バリデーション成功時のログ出力
    ConsoleMsg("info", "プロジェクト情報を保存:", projectInfo);

    // 親コンポーネントの保存関数を呼び出し
    // 入力されたプロジェクト情報を引数として渡す
    onSave(projectInfo);
  };

  /**
   * キャンセルボタンのクリック処理
   *
   * 直接キャンセルせず、確認ダイアログを表示。
   * 誤操作による作業の消失を防ぐための安全機能。
   */
  const handleCancel = () => {
    setShowConfirmDialog(true); // 確認ダイアログを表示
  };

  /**
   * アプリケーション終了の確定処理
   *
   * ユーザーが確認ダイアログで「終了」を選択した場合に実行。
   * ウィンドウ状態を保存してからアプリケーションを終了する。
   *
   * @async 非同期関数（ウィンドウ状態保存処理のため）
   */
  const handleConfirmExit = async () => {
    ConsoleMsg("info", "プロジェクト情報の入力をキャンセルしました。プログラムを終了します。");

    // ウィンドウの状態（位置・サイズ・テーマ等）を保存してから終了
    await saveWindowStateAndExit();
  };

  /**
   * キャンセルの取り消し処理
   *
   * ユーザーが確認ダイアログで「続行」を選択した場合に実行。
   * 確認ダイアログを非表示にして、プロジェクト情報入力画面に戻る。
   */
  const handleCancelExit = () => {
    setShowConfirmDialog(false); // 確認ダイアログを非表示
  };

  // ========================================================================================
  // レンダリング
  // ========================================================================================

  return (
    <>
      {/* ======================================================================================== */}
      {/* メインダイアログ */}
      {/* ======================================================================================== */}

      {/* 
        半透明の背景オーバーレイ
        - fixed inset-0: 画面全体を覆う
        - bg-base-100/90: 半透明の背景色（90%不透明度）
        - z-50: 他の要素より前面に表示
        - flex items-center justify-center: 中央配置
      */}
      <div className="fixed inset-0 bg-base-100/90 flex items-center justify-center z-50">
        {/* 
          ダイアログのメインコンテナ
          - w-96: 幅384px固定
          - max-w-md: 最大幅を中サイズに制限（レスポンシブ対応）
          - shadow-xl: 大きな影効果
          - rounded-lg: 角丸
        */}
        <div className="bg-base-200 p-6 rounded-lg w-96 max-w-md shadow-xl">
          {/* ダイアログタイトル */}
          <h2 className="text-xl font-bold text-primary-content mb-4">プロジェクト情報の入力</h2>

          {/* 
            入力フォーム領域
            space-y-4: 子要素間に16pxの縦方向マージンを設定
          */}
          <div className="space-y-4">
            {/* ======================================================================================== */}
            {/* プロジェクト名入力（必須項目） */}
            {/* ======================================================================================== */}
            <div>
              <label className="block text-sm font-medium text-primary-content mb-3">
                プロジェクト名
                {/* 必須マーク（アクセント色で目立たせる） */}
                <span className="text-accent font-medium">(*必須)</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-base-300 bg-base-100 text-base-content rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={projectInfo.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="プロジェクト名を入力してください"
              />
            </div>

            {/* ======================================================================================== */}
            {/* ファイルパス入力（任意項目） */}
            {/* ======================================================================================== */}
            <div>
              <label className="block text-sm font-medium text-primary-content mb-1">ファイルパス</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-base-300 bg-base-100 text-base-content rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={projectInfo.filepath}
                onChange={(e) => handleInputChange("filepath", e.target.value)}
                placeholder="プロジェクトファイルのパス"
              />
            </div>

            {/* ======================================================================================== */}
            {/* 備考入力（任意項目・複数行対応） */}
            {/* ======================================================================================== */}
            <div>
              <label className="block text-sm font-medium text-primary-content mb-2">備考</label>
              <textarea
                className="w-full px-3 py-2 border border-base-300 bg-base-100 text-base-content rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                rows="3" // 3行分の高さを確保
                value={projectInfo.remarks}
                onChange={(e) => handleInputChange("remarks", e.target.value)}
                placeholder="プロジェクトに関する備考"
              />
            </div>
          </div>

          {/* ======================================================================================== */}
          {/* ボタン領域 */}
          {/* ======================================================================================== */}

          {/* 
            ボタン配置領域
            - flex justify-end: 右寄せ配置
            - space-x-2: ボタン間に8pxの横方向マージン
            - mt-6: 上マージン24px
          */}
          <div className="flex justify-end space-x-2 mt-6">
            {/* 
              キャンセルボタン
              - bg-warning: 警告色（黄色系）
              - hover効果: スケール変換とカラー変更
              - active効果: 押下時のスケール縮小
              - transition: 滑らかなアニメーション
            */}
            <button
              className="px-4 py-2 bg-warning text-warning-content rounded-md hover:bg-warning-hover transition-all duration-150 ease-in-out hover:scale-105 active:scale-95 active:transform"
              onClick={handleCancel}
            >
              キャンセル
            </button>

            {/* 
              保存ボタン
              - bg-success: 成功色（緑色系）
              - 同様のホバー・アクティブ効果
            */}
            <button
              className="px-4 py-2 bg-success text-success-content rounded-md hover:bg-success-hover transition-all duration-150 ease-in-out hover:scale-105 active:scale-95 active:transform"
              onClick={handleSave}
            >
              保存
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================================================== */}
      {/* 確認ダイアログ（条件付きレンダリング） */}
      {/* ======================================================================================== */}

      {/* 
        showConfirmDialogがtrueの場合のみ表示
        キャンセル時の二段階確認を実装
      */}
      {showConfirmDialog && (
        <>
          {/* 
            確認ダイアログ用の背景オーバーレイ
            メインダイアログと同じz-indexだが、後に描画されるため上位に表示
          */}
          <div className="fixed inset-0 bg-base-100/90 flex items-center justify-center z-50">
            {/* 
              確認ダイアログのコンテナ
              メインダイアログより小さいサイズ（w-80 = 320px）
            */}
            <div className="bg-base-200 p-6 rounded-lg w-80 max-w-sm shadow-xl">
              {/* 確認ダイアログのタイトル */}
              <h3 className="text-lg font-bold text-primary-content mb-4">確認</h3>

              {/* 
                確認メッセージ
                ユーザーにアクションの結果を明確に伝える
              */}
              <p className="text-primary-content mb-6">プロジェクト情報の入力を中止してアプリケーションを終了しますか？</p>

              {/* 確認ダイアログのボタン領域 */}
              <div className="flex justify-end space-x-2">
                {/* 
                  続行ボタン（キャンセルの取り消し）
                  - bg-base-300: ニュートラルな色（グレー系）
                  - 入力画面に戻る安全なアクション
                */}
                <button
                  className="px-4 py-2 bg-base-300 text-base-content rounded-md hover:bg-base-400 transition-all duration-150 ease-in-out hover:scale-105 active:scale-95"
                  onClick={handleCancelExit}
                >
                  続行
                </button>

                {/* 
                  終了ボタン（アプリケーション終了）
                  - bg-error: エラー色（赤色系）
                  - 危険なアクションを色で明示
                  - 不可逆的な操作であることを強調
                */}
                <button
                  className="px-4 py-2 bg-error text-error-content rounded-md hover:bg-error-hover transition-all duration-150 ease-in-out hover:scale-105 active:scale-95"
                  onClick={handleConfirmExit}
                >
                  終了
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ========================================================================================
// エクスポート
// ========================================================================================

export default ProjectInfoDialog;
