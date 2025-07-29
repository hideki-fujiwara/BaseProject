import React, { useState, useEffect, useRef } from "react";
import { register, unregister } from "@tauri-apps/plugin-global-shortcut";
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
      <MenuItem key={item.id}>
        <Separator className="my-2 border-t border-base-content/20" />
      </MenuItem>
    );
  }

  if (item.children) {
    return (
      <SubmenuTrigger key={item.id}>
        <MenuItem className="flex w-full justify-between items-center rounded px-4 py-2 text-sm text-base-content hover:bg-base-300">
          <span>{item.name}</span>
          <span className="text-base-content/60">{">"}</span>
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
      {item.shortcut && <span className="ml-4 text-xs text-base-content/60 font-mono">{item.shortcut}</span>}
    </MenuItem>
  );
}

function AppMenu() {
  // ========================================================================================
  // 状態管理
  // ========================================================================================

  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);

  /**
   * 現在開いているメニューを追跡
   * null: メニューが閉じている
   * string: 開いているメニューのキー（'file', 'edit', 'view', 'help'）
   */
  const [openMenu, setOpenMenu] = useState(null);

  /**
   * メニューがアクティブ状態かどうか
   * いずれかのメニューがクリックで開かれた後の状態
   */
  const [isMenuActive, setIsMenuActive] = useState(false);

  // メニューボタンの参照を保持
  const menuRefs = useRef({
    file: null,
    edit: null,
    view: null,
    help: null,
  });

  // ========================================================================================
  // メニュー制御関数
  // ========================================================================================

  /**
   * メニューを開く
   *
   * @param {string} menuKey - 開くメニューのキー
   */
  const openMenuHandler = (menuKey) => {
    setOpenMenu(menuKey);
    setIsMenuActive(true);
    ConsoleMsg("debug", `メニューを開きました: ${menuKey}`);
  };

  /**
   * メニューを閉じる
   */
  const closeMenuHandler = () => {
    setOpenMenu(null);
    setIsMenuActive(false);
    ConsoleMsg("debug", "全てのメニューを閉じました");
  };

  /**
   * メニューボタンのクリック処理
   *
   * @param {string} menuKey - クリックされたメニューのキー
   */
  const handleMenuClick = (menuKey) => {
    if (openMenu === menuKey) {
      // 同じメニューがクリックされた場合は閉じる
      closeMenuHandler();
    } else {
      // 別のメニューまたは初回クリック
      openMenuHandler(menuKey);
    }
  };

  /**
   * メニューボタンのホバー処理
   *
   * @param {string} menuKey - ホバーされたメニューのキー
   */
  const handleMenuHover = (menuKey) => {
    // メニューがアクティブな状態でのみホバーで切り替え
    if (isMenuActive && openMenu !== menuKey) {
      openMenuHandler(menuKey);
    }
  };

  /**
   * メニュー外クリック時の処理
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      // メニュー領域外をクリックした場合にメニューを閉じる
      const menuContainer = event.target.closest('[role="menubar"]');
      const popover = event.target.closest('[role="dialog"]');

      if (!menuContainer && !popover && isMenuActive) {
        closeMenuHandler();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuActive]);

  // ========================================================================================
  // メニュー項目選択処理
  // ========================================================================================

  const handleMenuSelect = (itemId) => {
    ConsoleMsg("debug", `メニュー選択: ${itemId}`);

    // メニュー項目が選択されたらメニューを閉じる
    closeMenuHandler();

    switch (itemId) {
      case "new":
        ConsoleMsg("info", "プロジェクト新規作成メニューが選択されました");
        setIsNewProjectDialogOpen(true);
        break;
      case "zoomIn":
        ConsoleMsg("info", "拡大表示メニューが選択されました");
        // フォントサイズ拡大の処理をここに追加
        break;
      case "zoomOut":
        ConsoleMsg("info", "縮小表示メニューが選択されました");
        // フォントサイズ縮小の処理をここに追加
        break;
      case "resetZoom":
        ConsoleMsg("info", "リセット表示メニューが選択されました");
        // フォントサイズリセットの処理をここに追加
        break;
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

  // ========================================================================================
  // ショートカットキー登録
  // ========================================================================================

  useEffect(() => {
    const registerShortcuts = async () => {
      try {
        try {
          await unregister("CommandOrControl+Shift+F");
        } catch (e) {
          ConsoleMsg("debug", "ショートカットキーが未登録でした");
        }

        await register("CommandOrControl+Shift+F", () => {
          ConsoleMsg("info", "Control+Shift+F が押されました");
        });

        ConsoleMsg("info", "ショートカットキーを登録しました");
      } catch (error) {
        ConsoleMsg("error", `ショートカットキー登録エラー: ${error}`);
      }
    };

    registerShortcuts();

    return () => {
      const cleanup = async () => {
        try {
          await unregister("CommandOrControl+Shift+F");
        } catch (error) {
          ConsoleMsg("debug", `ショートカットキー解除エラー: ${error}`);
        }
      };
      cleanup();
    };
  }, []);

  // ========================================================================================
  // メニューコンポーネント生成
  // ========================================================================================

  /**
   * メニューボタンコンポーネントを生成
   *
   * @param {string} menuKey - メニューのキー
   * @param {string} label - メニューのラベル
   * @param {Array} items - メニューアイテムの配列
   */
  const createMenuButton = (menuKey, label, items) => (
    <MenuTrigger key={menuKey} isOpen={openMenu === menuKey}>
      <Button
        ref={(el) => (menuRefs.current[menuKey] = el)}
        className={`h-10 w-20 text-base-content hover:bg-base-300 transition-colors duration-150 ${
          openMenu === menuKey ? 'bg-base-300' : ''
        }`}
        onClick={() => handleMenuClick(menuKey)}
        onMouseEnter={() => handleMenuHover(menuKey)}
      >
        {label}
      </Button>
      <Popover>
        <Menu
          className="w-60 rounded-box bg-base-200 p-2 shadow-lg"
          onAction={() => closeMenuHandler()} // メニュー項目選択時に閉じる
        >
          {items.map((item) => renderMenuItem(item, handleMenuSelect))}
        </Menu>
      </Popover>
    </MenuTrigger>
  );

  // ========================================================================================
  // レンダリング
  // ========================================================================================

  return (
    <>
      <div className="ml-2 flex place-items-center gap-2 pl-2" role="menubar" aria-label="メインメニュー">
        {/* アプリアイコンとタイトル */}
        <div className="flex items-center gap-2">
          <span className="i-mdi-database-cog h-10 w-10 text-base-content" aria-hidden="true" />
          <span className="ml-2 text-lg font-bold text-base-content">BaseProject</span>
        </div>

        {/* メニューバー */}
        <div className="ml-4 flex">
          {createMenuButton("file", "ファイル(F)", menuItems.file)}
          {createMenuButton("edit", "編集(E)", menuItems.edit)}
          {createMenuButton("view", "表示(V)", menuItems.view)}
          {createMenuButton("help", "ヘルプ(H)", menuItems.help)}
        </div>
      </div>
    </>
  );
}

export default AppMenu;
