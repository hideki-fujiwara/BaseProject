import { useState } from "react";
import ConsoleMsg from "../../utils/ConsoleMsg";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";
import { saveWindowStateAndExit } from "../../utils/windowManager";

/**
 * プロジェクト情報入力ダイアログコンポーネント
 * @param {Object} props - コンポーネントのプロパティ
 * @param {Function} props.onClose - ダイアログを閉じる関数
 * @param {Function} props.onSave - プロジェクト情報を保存する関数
 */
function ProjectInfoDialog({ onClose, onSave }) {
  const [projectInfo, setProjectInfo] = useState({
    name: "",
    filepath: "",
    remarks: "",
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleInputChange = (field, value) => {
    setProjectInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    if (!projectInfo.name.trim()) {
      ConsoleMsg("warn", "プロジェクト名は必須です");
      return;
    }
    ConsoleMsg("info", "プロジェクト情報を保存:", projectInfo);
    onSave(projectInfo);
  };

  const handleCancel = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmExit = async () => {
    ConsoleMsg("info", "プロジェクト情報の入力をキャンセルしました。プログラムを終了します。");
    // ウィンドウ状態を保存して終了する関数を呼び出す
    await saveWindowStateAndExit();
  };

  const handleCancelExit = () => {
    setShowConfirmDialog(false);
  };

  return (
    <>
      {/* 半透明の背景オーバーレイ */}
      <div className="fixed inset-0 bg-base-100/90 flex items-center justify-center z-50">
        <div className="bg-base-200 p-6 rounded-lg w-96 max-w-md shadow-xl">
          <h2 className="text-xl font-bold text-primary-content mb-4">プロジェクト情報の入力</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary-content mb-3">
                プロジェクト名 <span className="text-accent font-medium">(*必須)</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-base-300 bg-base-100 text-base-content rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={projectInfo.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="プロジェクト名を入力してください"
              />
            </div>

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

            <div>
              <label className="block text-sm font-medium text-primary-content mb-2">備考</label>
              <textarea
                className="w-full px-3 py-2 border border-base-300 bg-base-100 text-base-content rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                rows="3"
                value={projectInfo.remarks}
                onChange={(e) => handleInputChange("remarks", e.target.value)}
                placeholder="プロジェクトに関する備考"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <button
              className="px-4 py-2 bg-warning text-warning-content rounded-md hover:bg-warning-hover transition-all duration-150 ease-in-out hover:scale-105 active:scale-95 active:transform"
              onClick={handleCancel}
            >
              キャンセル
            </button>
            <button
              className="px-4 py-2 bg-success text-success-content rounded-md hover:bg-success-hover transition-all duration-150 ease-in-out hover:scale-105 active:scale-95 active:transform"
              onClick={handleSave}
            >
              保存
            </button>
          </div>
        </div>
      </div>

      {/* 確認ダイアログ */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-base-100/90 flex items-center justify-center z-50">
          <div className="bg-base-200 p-6 rounded-lg w-80 max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-primary-content mb-4">確認</h3>
            <p className="text-primary-content mb-6">プロジェクト情報の入力を中止してアプリケーションを終了しますか？</p>
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-base-300 text-base-content rounded-md hover:bg-base-400 transition-all duration-150 ease-in-out hover:scale-105 active:scale-95"
                onClick={handleCancelExit}
              >
                続行
              </button>
              <button
                className="px-4 py-2 bg-error text-error-content rounded-md hover:bg-error-hover transition-all duration-150 ease-in-out hover:scale-105 active:scale-95"
                onClick={handleConfirmExit}
              >
                終了
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ProjectInfoDialog;
