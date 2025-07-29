import React, { useState } from "react";
import { Menu, MenuItem, MenuTrigger, Button, Popover, SubmenuTrigger, Separator } from "react-aria-components";
import ConsoleMsg from "../../utils/ConsoleMsg";
// メニュー項目の定義
const menuItems = {
  file: [
    { id: "new", name: "プロジェクト新規作成", shortcut: "Ctrl+N" },
    { id: "open", name: "プロジェクトを開く", shortcut: "Ctrl+O" },
    { id: "separator-1", type: "separator" },
    { id: "save", name: "プロジェクトの保存", shortcut: "Ctrl+S" },
    { id: "saveAs", name: "名前を付けて保存...", shortcut: "Ctrl+Shift+S" },
    {
      id: "loadFile",
      name: "ファイルを開く...",
      children: [
        { id: "loadFileSQL", name: "SQLファイル..." },
        { id: "loadFileOther", name: "その他ファイル..." },
        { id: "loadFileVGS", name: "VGSファイル..." },
        { id: "separator-2", type: "separator" },
        { id: "loadFileCSV", name: "CSVファイル..." },
      ],
    },
    { id: "separator-3", type: "separator" },
    { id: "exit", name: "終了" },
  ],
  edit: [
    { id: "undo", name: "元に戻す", shortcut: "Ctrl+Z" },
    { id: "redo", name: "やり直し", shortcut: "Ctrl+Y" },
    { id: "separator-4", type: "separator" },
    { id: "cut", name: "切り取り", shortcut: "Ctrl+X" },
    { id: "copy", name: "コピー", shortcut: "Ctrl+C" },
    { id: "paste", name: "貼り付け", shortcut: "Ctrl+V" },
  ],
  view: [
    { id: "fullscreen", name: "全画面表示", shortcut: "F11" },
    { id: "separator-5", type: "separator" },
    { id: "zoomIn", name: "拡大表示", shortcut: "Ctrl+Plus" },
    { id: "zoomOut", name: "縮小表示", shortcut: "Ctrl+Minus" },
    { id: "resetZoom", name: "リセット表示", shortcut: "Ctrl+0" },
    { id: "separator-6", type: "separator" },
    { id: "toggleSidebar", name: "サイドバー表示切替" },
    { id: "toggleStatusbar", name: "ステータスバー表示切替" },
  ],
  help: [
    { id: "docs", name: "ドキュメント", shortcut: "F1" },
    { id: "separator-7", type: "separator" },
    { id: "about", name: "バージョン情報" },
  ],
};

// メニューアイテムのスタイルを定義
function renderMenuItem(item, onSelect) {
  if (item.type === "separator") {
    return (
      <MenuItem key={`separator-${item.id}`}>
        <Separator className="my-2 border-t border-base-content/20" />
      </MenuItem>
    );
  }

  if (item.children) {
    // サブメニューの処理
    return (
      <SubmenuTrigger key={item.id}>
        <MenuItem className="flex w-full cursor-pointer items-center justify-between rounded px-4 py-2 text-sm text-base-content hover:bg-base-300">
          <span>{item.name}</span>
          <span className="text-xs text-base-content/60">＞</span>
        </MenuItem>
        <Popover>
          <Menu className="w-60 rounded-box bg-base-200 p-2 shadow-lg">{item.children.map((child) => renderMenuItem(child, onSelect))}</Menu>
        </Popover>
      </SubmenuTrigger>
    );
  }

  return (
    <MenuItem key={item.id} onPress={() => onSelect(item.id)} className="flex w-full cursor-pointer items-center justify-between rounded px-4 py-2 text-sm text-base-content hover:bg-base-300">
      <span>{item.name}</span>
      {item.shortcut && <span className="ml-4 text-xs text-base-content/60">{item.shortcut}</span>}
    </MenuItem>
  );
}

function AppMenu() {
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);

  // メニュー選択時の処理を修正
  const handleMenuSelect = (itemId) => {
    ConsoleMsg("debug", `メニュー選択: ${itemId}`);

    switch (itemId) {
      case "new":
        ConsoleMsg("info", "プロジェクト新規作成メニューが選択されました");
        setIsNewProjectDialogOpen(true);
        break;
      // 他のメニュー項目のハンドリング
      default:
        ConsoleMsg("debug", `未処理のメニュー項目: ${itemId}`);
        break;
    }
  };

  const handleCreateProject = async (projectData) => {
    try {
      ConsoleMsg("info", "プロジェクト作成開始");
      // TODO: プロジェクト作成の実装
      ConsoleMsg("info", `プロジェクト "${projectData.name}" を作成しました`);
    } catch (error) {
      ConsoleMsg("error", `プロジェクト作成エラー: ${error}`);
    }
  };

  return (
    <>
      <div className="ml-2 flex place-items-center gap-2 pl-2" role="menubar" aria-label="メインメニュー">
        {/* アプリアイコンとタイトル */}
        <div className="flex items-center gap-2">
          <span className="i-mdi-database-cog h-10 w-10 text-base-content" aria-hidden="true" />
          <span className="ml-2 text-lg font-bold text-base-content">BaseProject</span>
        </div>

        {/* ファイルメニュー */}
        <div className="ml-4">
          <MenuTrigger>
            <Button className="h-10 w-20 text-base-content hover:bg-base-300">ファイル(F)</Button>
            <Popover>
              <Menu className="w-60 rounded-box bg-base-200 p-2 shadow-lg">{menuItems.file.map((item) => renderMenuItem(item, handleMenuSelect))}</Menu>
            </Popover>
          </MenuTrigger>

          {/* 編集メニュー */}
          <MenuTrigger>
            <Button className="h-10 w-20 text-base-content hover:bg-base-300">編集(E)</Button>
            <Popover>
              <Menu className="w-60 rounded-box bg-base-200 p-2 shadow">{menuItems.edit.map((item) => renderMenuItem(item, handleMenuSelect))}</Menu>
            </Popover>
          </MenuTrigger>
          {/* 表示メニュー */}
          <MenuTrigger>
            <Button className="h-10 w-20 text-base-content hover:bg-base-300">表示(V)</Button>
            <Popover>
              <Menu className="w-60 rounded-box bg-base-200 p-2 shadow">{menuItems.view.map((item) => renderMenuItem(item, handleMenuSelect))}</Menu>
            </Popover>
          </MenuTrigger>
          {/* ヘルプメニュー */}
          <MenuTrigger>
            <Button className="h-10 w-20 text-base-content hover:bg-base-300">ヘルプ(H)</Button>
            <Popover>
              <Menu className="w-60 rounded-box bg-base-200 p-2 shadow">{menuItems.help.map((item) => renderMenuItem(item, handleMenuSelect))}</Menu>
            </Popover>
          </MenuTrigger>
        </div>
      </div>
    </>
  );
}

export default AppMenu;
