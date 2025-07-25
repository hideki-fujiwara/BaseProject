// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
// 必要なクレートをインポート
use chrono::Local; // 日時処理用
use dark_light; // 追加: OSテーマ判定クレート
use dirs_2::{self as dirs}; // ディレクトリパス取得用
use log::{debug, error, info, warn, LevelFilter}; // ロギング機能
use tauri::Manager;
use tauri_plugin_log::{Target, TargetKind}; // Tauriログプラグイン // Tauriウィンドウ管理

/// アプリケーション設定モジュール
mod app_config;

/// 基本的な挨拶機能を提供するコマンド（開発テスト用）
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// アプリケーションのメインエントリーポイント
/// モバイル対応のための属性を設定
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Tauriアプリケーションの構築開始
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        // ダイアログ機能の初期化
        .plugin(tauri_plugin_dialog::init())
        // ログ機能の設定
        .plugin(
            tauri_plugin_log::Builder::new()
                // ログの出力先を設定
                .targets([
                    Target::new(TargetKind::Stdout),  // 標準出力
                    Target::new(TargetKind::Webview), // Webview
                    Target::new(TargetKind::Folder {
                        // ファイル出力(config_dir/baseproject)
                        path: std::path::PathBuf::from(
                            dirs::config_dir()
                                .expect("Failed to get config dir")
                                .join("baseproject"),
                        ),
                        file_name: Some("baseproject".to_string()),
                    }),
                ])
                .max_file_size(4_000_000) // ログファイルの最大サイズ（MB）
                .level(LevelFilter::Debug) // ログレベルの設定
                .timezone_strategy(tauri_plugin_log::TimezoneStrategy::UseLocal) // タイムゾーン設定
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll) // ログローテーション設定
                // ログフォーマットの設定
                .format(|out, message, record| {
                    out.finish(format_args!(
                        "[{}]:[{}]: {}", // [日時]:[ログレベル]: メッセージ
                        Local::now().format("%Y-%m-%d %H:%M:%S"),
                        record.level(),
                        message
                    ))
                })
                .build(),
        )
        // 追加プラグインの設定
        .plugin(tauri_plugin_opener::init()) // ファイルオープン機能
        .plugin(tauri_plugin_fs::init()) // ファイルシステム操作
        // コマンドハンドラーの登録
        .invoke_handler(tauri::generate_handler![greet])
        // アプリケーションの初期設定
        .setup(|app| {
            info!("baseproject プログラムスタート");

            // 設定ディレクトリの取得
            let config_dir = match dirs::config_dir() {
                Some(dir) => dir.join("baseproject"),
                None => {
                    error!("設定ディレクトリの取得に失敗しました");
                    return Ok(());
                }
            };

            // アプリケーション設定の読み込み
            let config = app_config::get_app_config(config_dir.to_str().unwrap());

            // メインウィンドウの設定
            if let Some(main_window) = app.get_webview_window("main") {
                // ウィンドウの基本設定を適用

                if let Err(e) = main_window.set_title(&config.window_config.title) {
                    error!("タイトルの設定に失敗しました: {}", e);
                }

                // サイズ制限の設定
                if let Err(e) =
                    main_window.set_min_size(Some(tauri::Size::Physical(tauri::PhysicalSize {
                        width: config.window_config.min_width,
                        height: config.window_config.min_height,
                    })))
                {
                    error!("最小サイズの設定に失敗しました: {}", e);
                }

                if let Err(e) =
                    main_window.set_max_size(Some(tauri::Size::Physical(tauri::PhysicalSize {
                        width: config.window_config.max_width,
                        height: config.window_config.max_height,
                    })))
                {
                    error!("最大サイズの設定に失敗しました: {}", e);
                }

                // ウィンドウサイズと位置を設定
                if let Err(e) = main_window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
                    width: config.window_state.width as u32,
                    height: config.window_state.height as u32,
                })) {
                    error!("ウィンドウサイズの設定に失敗しました: {}", e);
                }

                if let Err(e) =
                    main_window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
                        x: config.window_state.x,
                        y: config.window_state.y,
                    }))
                {
                    error!("ウィンドウ位置の設定に失敗しました: {}", e);
                }

                // フルスクリーン設定を適用
                if let Err(e) = main_window.set_fullscreen(config.window_state.fullscreen) {
                    error!("フルスクリーン設定の適用に失敗しました: {}", e);
                }

                // テーマを適用（カスタムイベントとして送信）
                let theme = match config.window_state.theme.as_str() {
                    "Light" => Some(tauri::Theme::Light),
                    "Dark" => Some(tauri::Theme::Dark),
                    "auto" => match dark_light::detect() {
                        Ok(dark_light::Mode::Dark) => Some(tauri::Theme::Dark),
                        Ok(dark_light::Mode::Light) => Some(tauri::Theme::Light),
                        _ => None, // 2.0ではUnknownは存在しないが、網羅性のため
                    },
                    _ => None,
                };

                if let Err(e) = main_window.set_theme(theme) {
                    error!("テーマ設定の適用に失敗しました: {}", e);
                }
            }

            Ok(())
        })
        // アプリケーションの実行
        .run(tauri::generate_context!())
        .expect("error while running tauri application"); // 実行中にエラーが発生した場合のメッセージ
}
