// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
// 必要なクレートをインポート
use chrono::Local; // 日時処理用
use dirs_2::{self as dirs}; // ディレクトリパス取得用
use log::{error, info,  LevelFilter}; // ロギング機能
use tauri::{Manager};
use tauri_plugin_log::{Target, TargetKind};
use store_manager::{StoreManager, WindowConfig, WindowState};

// アプリケーション設定モジュール
// mod app_config;
mod store_manager;

/// 基本的な挨拶機能を提供するコマンド（開発テスト用）
#[tauri::command]
fn greet(name: &str) -> String {
  format!("Hello, {}! You've been greeted from Rust!", name)
}

/// アプリケーションのメインエントリーポイント
/// モバイル対応のための属性を設定
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  #[cfg(debug_assertions)]
  // Tauriアプリケーションの構築開始
  tauri::Builder::default()
    // ダイアログプラグイン: フロントエンドからダイアログ表示を呼び出せるようにする
    .plugin(tauri_plugin_dialog::init())
    // ログプラグイン: 標準出力／Webview／ファイルへのログ出力を設定
    .plugin(
      tauri_plugin_log::Builder::new()
        .targets([
          Target::new(TargetKind::Stdout),  // コンソール出力
          Target::new(TargetKind::Webview), // Webview の JS コンソール出力
          Target::new(TargetKind::Folder {  // 設定ディレクトリ以下にログファイル出力
            path: std::path::PathBuf::from(
              dirs::config_dir().expect("Failed to get config dir")
                .join("BaseProject"),
            ),
            file_name: Some("BaseProject".to_string()),
          }),
        ])
        .max_file_size(4_000_000)                     // 4MB 超えたらローテート
        .level(LevelFilter::Debug)                    // デバッグ以上のログを記録
        .timezone_strategy(tauri_plugin_log::TimezoneStrategy::UseLocal) // ローカルタイム
        .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll)  // 全世代保持
        .format(|out, message, record| {               // ログフォーマットを指定
          out.finish(format_args!(
            "[{}]:[{}]: {}",                           // [日時]:[レベル]: メッセージ
            Local::now().format("%Y-%m-%d %H:%M:%S"),
            record.level(),
            message
          ))
        })
        .build(),
    )
    // ファイルオープンプラグイン: デスクトップのファイル選択ダイアログや外部アプリ起動をサポート
    .plugin(tauri_plugin_opener::init())
    // ファイルシステムプラグイン: フォルダやファイルの読み書きを Rust 側で呼び出し可能に
    .plugin(tauri_plugin_fs::init())
    // ストアプラグイン: キー・バリューストアを簡単に永続化できるようにする
    .plugin(tauri_plugin_store::Builder::new().build())
    // コマンドハンドラー: Rust のコマンドを JavaScript から呼び出す設定
    .invoke_handler(tauri::generate_handler![greet])
    // アプリ起動時のセットアップ処理
    .setup(|app| {
      info!("BaseProject .setup Start");
      // 設定ディレクトリを取得または生成
      let config_dir = match dirs::config_dir() {
        Some(dir) => dir.join("BaseProject"),
        None => {
          error!("設定ディレクトリの取得に失敗しました");
          return Ok(());
        },
      };
      // ストアの初期化（キーのデフォルト設定など）
      if let Err(e) = StoreManager::initialize_store(&app.handle(), &config_dir) {
        error!("ストアの初期化に失敗しました: {}", e);
      }
      // ウィンドウ設定・状態をロード
      let window_cfg: WindowConfig =
        StoreManager::load_window_config(&app.handle(), &config_dir)?;
      let window_state: WindowState =
        StoreManager::load_window_state(&app.handle(), &config_dir)?;
      // ウィンドウに設定を適用
      let title   = &window_cfg.title;
      let min_w   = window_cfg.min_width;
      let min_h   = window_cfg.min_height;
      let max_w   = window_cfg.max_width;
      let max_h   = window_cfg.max_height;
      let width   = window_state.width;
      let height  = window_state.height;
      let x       = window_state.x;
      let y       = window_state.y;
      let fullscreen = window_state.fullscreen;
      // テーマ設定: dark/light は固定、それ以外は OS デフォルト
      let theme = match window_state.theme.as_str() {
        "dark"  => Some(tauri::Theme::Dark),
        "light" => Some(tauri::Theme::Light),
        _       => None,
      };
      if let Some(main_window) = app.get_webview_window("main") {
        // 各種ウィンドウプロパティを設定
        main_window.set_title(title)
          .unwrap_or_else(|e| error!("タイトル設定失敗: {}", e));
        main_window.set_min_size(Some(tauri::Size::Physical(
          tauri::PhysicalSize { width: min_w, height: min_h },
        ))).unwrap_or_else(|e| error!("最小サイズ設定失敗: {}", e));
        main_window.set_max_size(Some(tauri::Size::Physical(
          tauri::PhysicalSize { width: max_w, height: max_h },
        ))).unwrap_or_else(|e| error!("最大サイズ設定失敗: {}", e));
        main_window.set_size(tauri::Size::Physical(
          tauri::PhysicalSize { width, height },
        )).unwrap_or_else(|e| error!("サイズ設定失敗: {}", e));
        main_window.set_position(tauri::Position::Physical(
          tauri::PhysicalPosition { x, y },
        )).unwrap_or_else(|e| error!("位置設定失敗: {}", e));
        // フルスクリーンの場合は少し遅延して最大化
        if fullscreen {
          let w = main_window.clone();
          std::thread::spawn(move || {
            std::thread::sleep(std::time::Duration::from_millis(400));
            w.maximize().unwrap_or_else(|e| error!("最大化失敗: {}", e));
          });
        }
        // テーマ設定（None の場合は OS デフォルトを適用）
        main_window.set_theme(theme)
          .unwrap_or_else(|e| error!("テーマ設定失敗: {}", e));
      }
      Ok(())
    })
    // Tauri アプリケーションの実行開始
    .run(tauri::generate_context!())
    .expect("error while running tauri application"); // 実行中にエラーが発生した場合のメッセージ
}
