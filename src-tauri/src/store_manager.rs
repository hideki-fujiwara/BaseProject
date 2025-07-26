//! ストア（設定ファイル）関連ロジックをまとめたモジュール
//! - プロジェクト一覧（`projects`）
//! - ウィンドウ基本設定（`window_config`）
//! - ウィンドウ状態（`window_state`）

use std::path::PathBuf;

use log::{info};
use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::{AppHandle};
use tauri_plugin_store::StoreExt;

/// プロジェクト情報（単一エントリ）
/// フロントエンドから受け取ったり、一覧に追加したりするデータ構造
#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct ProjectConfig {
  pub name: String,     // プロジェクト名
  pub filepath: String, // 保存パス
  pub remarks: String,  // 備考
}

/// ウィンドウ基本設定
/// タイトルや最小/最大サイズなど起動時に一度だけ適用する設定
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct WindowConfig {
  pub title: String,   // ウィンドウタイトル
  pub min_width: u32,  // 最小幅
  pub min_height: u32, // 最小高さ
  pub max_width: u32,  // 最大幅
  pub max_height: u32, // 最大高さ
}

/// ウィンドウ状態
/// 最後に閉じた時のサイズ・位置・テーマ情報などを保持
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct WindowState {
  pub width: u32,                         // 最終ウィンドウ幅
  pub height: u32,                        // 最終ウィンドウ高さ
  pub x: i32,                             // 最終ウィンドウ X 座標
  pub y: i32,                             // 最終ウィンドウ Y 座標
  pub fullscreen: bool,                   // フルスクリーンかどうか
  pub theme: String,                      // テーマ（"light"/"dark"/"auto"）
  pub main_panel_layout: MainPanelLayout, // メインパネルのレイアウト
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MainPanelLayout {
  pub horizontal: [u32; 3], // 水平レイアウトの比率
  pub vertical: [u32; 2],   // 垂直レイアウトの比率
}

/// 全体設定構造体
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Config {
  pub projects: ProjectConfig,
  pub window_state: WindowState,
  pub window_config: WindowConfig,
}

impl Default for Config {
  fn default() -> Self {
    Config {
      projects: ProjectConfig {
        name: String::from(""),
        filepath: String::from(""),
        remarks: String::from(""),
      },
      window_state: WindowState {
        width: 1200,
        height: 800,
        x: 100,
        y: 100,
        fullscreen: false,
        theme: String::from("auto"),
        main_panel_layout: MainPanelLayout {
          horizontal: [15, 70, 15],
          vertical: [85, 15],
        },
      },
      window_config: WindowConfig {
        title: String::from("BaseProject 2025"),
        min_width: 1024,
        min_height: 768,
        max_width: 7680,
        max_height: 4320,
      },
    }
  }
}
/// ストア管理ユーティリティ
/// 設定ディレクトリの作成、キーのデフォルト初期化、
/// 読み込み・書き込み操作をまとめて提供する
pub fn initialize_store(app: &AppHandle, config_dir: &PathBuf) -> Result<(), Box<dyn std::error::Error>> {
  // 設定ディレクトリを生成（既に存在していても OK）
  std::fs::create_dir_all(config_dir)?;
  
  // 設定ファイルのフルパスを構築
  let path = config_dir.join("BaseProject.config");
  info!("設定ファイルのパス: {}", path.display());
  
  // Tauri のストアハンドルを取得
  let store = app.store(path.to_string_lossy().as_ref())?;

  // デフォルト設定を取得
  let default_config = Config::default();

  // ── project_config の初期化 ─────────────────────────
  // キー "project_config" が存在しない場合、デフォルト値を設定
  if !store.has("project_config") {
    store.set(
      "project_config",
      json!(default_config.projects),
    );
    info!("project_config をデフォルト初期化");
  }

  // ── window_config の初期化 ──────────────────────────
  // キー "window_config" が存在しない場合、デフォルト値を設定
  if !store.has("window_config") {
    store.set(
      "window_config",
      json!(default_config.window_config),
    );
    info!("window_config をデフォルト初期化");
  }

  // ── window_state の初期化 ──────────────────────────
  // キー "window_state" が存在しない場合、デフォルト値を設定
  if !store.has("window_state") {
    store.set(
      "window_state",
      json!(default_config.window_state),
    );
    info!("window_state をデフォルト初期化");
  }

  // 設定をディスクに書き込み、リソースを解放
  store.save()?;
  store.close_resource();
  Ok(())
}

/// プロジェクト設定を読み込み
pub fn load_project_config(app: &AppHandle, config_dir: &PathBuf) -> Result<ProjectConfig, Box<dyn std::error::Error>> {
  let path = config_dir.join("BaseProject.config");
  let store = app.store(path.to_string_lossy().as_ref())?;
  let cfg: ProjectConfig = match store.get("project_config") {
    Some(v) => serde_json::from_value(v.clone())?,
    None => return Err("project_config が存在しません".into()),
  };
  info!("プロジェクト設定を読み込みました: {:?}", cfg);
  Ok(cfg)
}

/// ウィンドウ基本設定を読み込み
pub fn load_window_config(app: &AppHandle, config_dir: &PathBuf) -> Result<WindowConfig, Box<dyn std::error::Error>> {
  let path = config_dir.join("BaseProject.config");
  let store = app.store(path.to_string_lossy().as_ref())?;
  let cfg: WindowConfig = match store.get("window_config") {
    Some(v) => serde_json::from_value(v.clone())?,
    None => return Err("window_config が存在しません".into()),
  };
  info!("ウィンドウ設定を読み込みました: {:?}", cfg);
  Ok(cfg)
}

/// ウィンドウ状態を読み込み
pub fn load_window_state(app: &AppHandle, config_dir: &PathBuf) -> Result<WindowState, Box<dyn std::error::Error>> {
  let path = config_dir.join("BaseProject.config");
  let store = app.store(path.to_string_lossy().as_ref())?;
  let st = match store.get("window_state") {
    Some(v) => serde_json::from_value(v.clone())?,
    None => return Err("window_state が存在しません".into()),
  };
  info!("ウィンドウ状態を読み込みました: {:?}", st);
  Ok(st)
}
