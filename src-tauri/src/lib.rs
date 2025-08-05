// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

// ========================================================================================
// 依存関係のインポート
// ========================================================================================
use chrono::Local; // 日時処理用（ログフォーマットで使用）
use dirs_2; // ディレクトリパス取得用（設定ファイル保存場所の特定）
use log::{error, info, LevelFilter}; // ロギング機能（デバッグ・エラー情報出力）
use tauri::Manager; // Tauriアプリケーション管理機能
use tauri_plugin_log::{Target, TargetKind}; // Tauriログプラグイン

// ========================================================================================
// モジュール宣言
// ========================================================================================
/// アプリケーション設定管理モジュール
/// 設定ファイルの読み書き、ウィンドウ状態の保存・復元を担当
mod store_manager;

/// システム監視モジュール
/// CPU・メモリ使用率の監視とバックグラウンド更新を担当
mod system_monitor;

/// コマンドハンドラー モジュール
/// フロントエンドから呼び出し可能なTauriコマンドを定義
mod commands;

// ========================================================================================
// アプリケーションメインエントリーポイント
// ========================================================================================
/// アプリケーションのメインエントリーポイント
/// モバイル対応のための属性を設定
///
/// この関数では以下の処理を行う：
/// 1. 各種プラグインの初期化
/// 2. ログ機能の設定
/// 3. ウィンドウの初期設定
/// 4. アプリケーションの実行開始
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  // Tauriアプリケーションの構築開始
  tauri::Builder::default()
    // ========================================================================================
    // プラグイン初期化
    // ========================================================================================
    // ストアプラグイン: キー・バリューストア機能（設定の永続化）
    .plugin(tauri_plugin_store::Builder::new().build())
    // ダイアログプラグイン: ファイル選択ダイアログなどのネイティブUI
    .plugin(tauri_plugin_dialog::init())
    // ログプラグイン: 複数出力先への統合ログ機能
    .plugin(
      tauri_plugin_log::Builder::new()
        // ログの出力先を設定（複数同時出力可能）
        .targets([
          Target::new(TargetKind::Stdout),  // 標準出力（コンソール）
          Target::new(TargetKind::Webview), // Webview（ブラウザコンソール）
          Target::new(TargetKind::Folder {
            // ファイル出力
            // ログファイル保存先: ユーザー設定ディレクトリ/BaseProject/
            path: std::path::PathBuf::from(
              dirs_2::config_dir()
                .expect("Failed to get config dir") // 設定ディレクトリ取得失敗時はパニック
                .join("BaseProject"), // アプリ専用サブディレクトリ
            ),
            file_name: Some("BaseProject".to_string()), // ログファイル名
          }),
        ])
        .max_file_size(4_000_000) // ログファイル最大サイズ: 4MB
        .level(LevelFilter::Debug) // ログレベル: Debug以上を記録
        .timezone_strategy(tauri_plugin_log::TimezoneStrategy::UseLocal) // ローカルタイムゾーン使用
        .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll) // 全世代のログファイル保持
        // ログフォーマット: [日時]:[レベル]: メッセージ
        .format(|out, message, record| {
          out.finish(format_args!(
            "[{}]:[{}]: {}",
            Local::now().format("%Y-%m-%d %H:%M:%S"), // 日時フォーマット
            record.level(),                           // ログレベル
            message                                   // ログメッセージ
          ))
        })
        .build(),
    )
    // ファイルオープンプラグイン: デスクトップファイル操作・外部アプリ起動
    .plugin(tauri_plugin_opener::init())
    // ファイルシステムプラグイン: ファイル・フォルダの読み書き操作
    .plugin(tauri_plugin_fs::init())
    // ========================================================================================
    // コマンドハンドラー登録
    // ========================================================================================
    // JavaScript側から呼び出し可能なRust関数を登録
    .invoke_handler(tauri::generate_handler![
        commands::greet, 
        system_monitor::get_system_info
    ])
    // ========================================================================================
    // アプリケーション初期化処理
    // ========================================================================================
    .setup(|app| {
      info!("BaseProject プログラムスタート");

      // システム監視を開始
      let _app_handle = app.handle().clone();
      tauri::async_runtime::spawn(async move {
          system_monitor::start_system_monitoring().await;
      });

      // ----------------------------------------------------------------------------------------
      // 設定ディレクトリの取得・準備
      // ----------------------------------------------------------------------------------------
      let config_dir = match dirs_2::config_dir() {
        Some(dir) => dir.join("BaseProject"), // %APPDATA%/BaseProject (Windows)
        None => {
          error!("設定ディレクトリの取得に失敗しました");
          return Ok(()); // エラーでも続行（機能制限モード）
        },
      };

      // ----------------------------------------------------------------------------------------
      // ストア（設定ファイル）の初期化
      // ----------------------------------------------------------------------------------------
      // 設定ファイルが存在しない場合はデフォルト値で作成
      if let Err(e) = store_manager::initialize_store(&app.handle(), &config_dir) {
        error!("ストアの初期化に失敗しました: {}", e);
        return Ok(()); // エラーでも続行
      }

      // ----------------------------------------------------------------------------------------
      // ウィンドウ設定の読み込み
      // ----------------------------------------------------------------------------------------
      // ウィンドウの基本設定（タイトル、サイズ制限など）
      let window_config = match store_manager::load_window_config(&app.handle(), &config_dir) {
        Ok(config) => config,
        Err(e) => {
          error!("ウィンドウ設定の読み込みに失敗しました: {}", e);
          return Ok(());
        },
      };

      // ウィンドウの状態（位置、サイズ、テーマなど）
      let window_state = match store_manager::load_window_state(&app.handle(), &config_dir) {
        Ok(state) => state,
        Err(e) => {
          error!("ウィンドウ状態の読み込みに失敗しました: {}", e);
          return Ok(());
        },
      };

      // ----------------------------------------------------------------------------------------
      // メインウィンドウの設定適用
      // ----------------------------------------------------------------------------------------
      if let Some(main_window) = app.get_webview_window("main") {
        // ウィンドウタイトル設定
        if let Err(e) = main_window.set_title(&window_config.title) {
          error!("タイトルの設定に失敗しました: {}", e);
        }

        // ウィンドウサイズ制限設定
        if let Err(e) = main_window.set_min_size(Some(tauri::Size::Physical(tauri::PhysicalSize {
          width: window_config.min_width,
          height: window_config.min_height,
        }))) {
          error!("最小サイズの設定に失敗しました: {}", e);
        }

        if let Err(e) = main_window.set_max_size(Some(tauri::Size::Physical(tauri::PhysicalSize {
          width: window_config.max_width,
          height: window_config.max_height,
        }))) {
          error!("最大サイズの設定に失敗しました: {}", e);
        }

        // ウィンドウサイズ設定（前回終了時のサイズを復元）
        if let Err(e) = main_window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
          width: window_state.width,
          height: window_state.height,
        })) {
          error!("ウィンドウサイズの設定に失敗しました: {}", e);
        }

        // ウィンドウ位置設定（前回終了時の位置を復元）
        if let Err(e) = main_window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: window_state.x, y: window_state.y })) {
          error!("ウィンドウ位置の設定に失敗しました: {}", e);
        }

        // フルスクリーン設定（前回終了時の状態を復元）
        if window_state.fullscreen {
          if let Err(e) = main_window.maximize() {
            error!("フルスクリーン設定の適用に失敗しました: {}", e);
          }
        } else {
          if let Err(e) = main_window.unmaximize() {
            error!("フルスクリーン解除の適用に失敗しました: {}", e);
          }
        }

        // テーマ設定（Light/Dark/自動検出）
        let theme = match window_state.theme.as_str() {
          "Light" => Some(tauri::Theme::Light), // ライトテーマ固定
          "Dark" => Some(tauri::Theme::Dark),   // ダークテーマ固定
          "auto" => {
            // システムのテーマ設定を自動検出
            match dark_light::detect() {
              Ok(dark_light::Mode::Dark) => Some(tauri::Theme::Dark),
              Ok(dark_light::Mode::Light) => Some(tauri::Theme::Light),
              _ => None, // 検出失敗時はシステムデフォルト
            }
          },
          _ => None, // その他の場合はシステムデフォルト
        };

        if let Err(e) = main_window.set_theme(theme) {
          error!("テーマ設定の適用に失敗しました: {}", e);
        }
      }
      info!("ウィンドウ設定を適用しました");
      Ok(()) // セットアップ成功
    })
    // ========================================================================================
    // アプリケーション実行開始
    // ========================================================================================
    .run(tauri::generate_context!()) // Tauriアプリケーション実行
    .expect("error while running tauri application"); // 実行エラー時のメッセージ
}
