import ConsoleMsg from "../../utils/ConsoleMsg";

/**
 * 汎用的な確認ダイアログコンポーネント
 * @param {Object} props - コンポーネントのプロパティ
 * @param {boolean} props.isVisible - ダイアログの表示/非表示を制御
 * @param {string} props.title - ダイアログのタイトル
 * @param {string} props.message - 表示する確認メッセージ
 * @param {string} [props.confirmText="はい"] - 確認ボタンのテキスト
 * @param {string} [props.cancelText="いいえ"] - キャンセルボタンのテキスト
 * @param {Function} props.onConfirm - 確認ボタンがクリックされたときのコールバック関数
 * @param {Function} props.onCancel - キャンセルボタンがクリックされたときのコールバック関数
 * @returns {JSX.Element|null} isVisibleがtrueの場合にダイアログを描画
 */
function ConfirmDialog({ isVisible, title, message, confirmText = "はい", cancelText = "いいえ", onConfirm, onCancel }) {
  // isVisibleがfalseの場合は何もレンダリングしない
  if (!isVisible) {
    return null;
  }

  const handleConfirm = () => {
    ConsoleMsg("info", "確認ダイアログ: 確認ボタンが押されました");
    if (onConfirm) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    ConsoleMsg("info", "確認ダイアログ: キャンセルボタンが押されました");
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 bg-base-100/90 flex items-center justify-center z-60">
      <div className="bg-base-200 p-6 rounded-lg w-80 max-w-sm shadow-xl">
        <h3 className="text-lg font-bold text-primary-content mb-4">{title}</h3>
        <p className="text-primary-content mb-6">{message}</p>
        <div className="flex justify-end space-x-2">
          <button className="px-4 py-2 bg-base-300 text-base-content rounded-md hover:bg-base-400 transition-all duration-150 ease-in-out hover:scale-105 active:scale-95" onClick={handleCancel}>
            {cancelText}
          </button>
          <button className="px-4 py-2 bg-error text-error-content rounded-md hover:bg-error-hover transition-all duration-150 ease-in-out hover:scale-105 active:scale-95" onClick={handleConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
