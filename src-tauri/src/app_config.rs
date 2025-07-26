//! アプリケーション設定管理モジュール
//!
//! このモジュールは以下の機能を提供します：
//! - 設定ファイルの読み書き
//! - プロジェクト情報の管理
//! - ウィンドウ状態の保持
//! - デフォルト設定の提供

// 必要なクレートをインポート
use std::fs::{self, File}; // ファイル操作用
use std::io::{Read, Write}; // 入出力操作用
use std::path::Path;

use log::{debug, error, info}; // ロギング用
use serde::{Deserialize, Serialize}; // JSONシリアライズ/デシリアライズ用
use serde_json; // JSON処理用

/// アプリケーション全体の設定を管理する構造体
///
/// # フィールド
/// * `projects` - プロジェクト情報のリスト
/// * `window_state` - ウィンドウの現在の状態
/// * `window_config` - ウィンドウの基本設定
#[derive(Serialize, Deserialize, Debug)]
pub struct AppConfig {
  pub projects:Project,      // プロジェクト情報のベクター
  pub window_state: WindowState,   // ウィンドウ状態を追加
  pub window_config: WindowConfig, // 追加
}

/// 個別のプロジェクト情報を格納する構造体
///
/// # フィールド
/// * `name` - プロジェクトの名称
/// * `filepath` - プロジェクトファイルの保存パス
/// * `remarks` - プロジェクトに関する備考情報
#[derive(Serialize, Deserialize, Debug)]
pub struct Project {
  pub name: String,     // プロジェクト名
  pub filepath: String, // プロジェクトファイルのパス
  pub remarks: String,  // 備考欄
}

/// ウィンドウの現在の状態を管理する構造体
///
/// # フィールド
/// * `width` - ウィンドウの幅（ピクセル）
/// * `height` - ウィンドウの高さ（ピクセル）
/// * `x` - ウィンドウのX座標
/// * `y` - ウィンドウのY座標
/// * `theme` - 現在のテーマ設定（"Light"または"Dark"）
/// * `fullscreen` - フルスクリーンモードの有無
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct WindowState {
  pub width: f64,
  pub height: f64,
  pub x: i32,
  pub y: i32,
  pub theme: String,    // テーマ設定を追加
  pub fullscreen: bool, // フルスクリーン設定を追加
}

impl Default for WindowState {
  fn default() -> Self {
    WindowState {
      width: 1920.0,
      height: 1080.0,
      x: 200,
      y: 400,
      theme: String::from("Dark"), // デフォルトのテーマ
      fullscreen: false,           // デフォルトのフルスクリーン設定
    }
  }
}

/// ウィンドウの基本設定を管理する構造体
///
/// # フィールド
/// * `title` - ウィンドウのタイトル
/// * `min_width` - 最小ウィンドウ幅
/// * `min_height` - 最小ウィンドウ高さ
/// * `max_width` - 最大ウィンドウ幅
/// * `max_height` - 最大ウィンドウ高さ
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct WindowConfig {
  pub title: String,
  pub min_width: u32,
  pub min_height: u32,
  pub max_width: u32,
  pub max_height: u32,
}

impl AppConfig {
  fn default() -> Self {
    AppConfig {
      projects: Project {
        name: String::from(""),
        filepath: String::from(""),
        remarks: String::from(""),
      },
      window_state: WindowState::default(),
      window_config: WindowConfig {
        title: String::from("baseproject 2025"),
        min_width: 1024,
        min_height: 768,
        max_width: 7680,
        max_height: 4320,
      },
    }
  }
}

/// 設定ファイルの読み込みと解析を行う関数
///
/// # 引数
/// * `config_dir` - 設定ファイルを格納するディレクトリのパス
///
/// # 戻り値
/// * `AppConfig` - 読み込まれた設定またはデフォルト設定
///
/// # エラー処理
/// - 設定ディレクトリが存在しない場合は作成
/// - ファイル読み込みエラー時はデフォルト設定を使用
/// - JSON解析エラー時はデフォルト設定を使用
pub fn get_app_config(config_dir: &str) -> AppConfig {
  let config_file = Path::new(config_dir).join("baseproject.config");
  debug!("config_file: {:?}", config_file); // ここでデバッグ
                                            // 設定ファイルが存在しない場合はデフォルト設定を返す
  if !config_file.exists() {
    let default_config = AppConfig::default(); // デフォルト設定を取得
                                               // 設定ディレクトリがない場合は作成
    if let Some(parent) = config_file.parent() {
      if !parent.exists() {
        fs::create_dir_all(parent).expect("設定ディレクトリの作成に失敗しました");
      }
    }
    // デフォルト設定をファイルに保存
    let json = serde_json::to_string_pretty(&default_config).expect("JSONのシリアライズに失敗しました");
    fs::write(&config_file, json).expect("設定ファイルの保存に失敗しました");
    return default_config;
  }

  // 既存の設定ファイルを読み込む
  match fs::read_to_string(&config_file) {
    Ok(contents) => match serde_json::from_str(&contents) {
      Ok(config) => {
        debug!("Loaded config: {:?}", config); // ここでデバッグ
        config
      },
      Err(_) => {
        info!("設定ファイルの解析に失敗しました。デフォルト設定を使用します。");
        AppConfig::default()
      },
    },
    Err(_) => {
      info!("設定ファイルの読み込みに失敗しました。デフォルト設定を使用します。");
      AppConfig::default()
    },
  }
}

/// エラーメッセージを生成する関数
///
/// # 引数
/// * `e` - エラーオブジェクト
///
/// # 戻り値
/// * `String` - フォーマットされたエラーメッセージ
fn generate_error_message(e: &dyn std::error::Error) -> String {
  format!("Error: {}", e)
}
