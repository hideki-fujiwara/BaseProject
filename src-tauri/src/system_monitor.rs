use std::{
  sync::{Arc, Mutex},
  time::{Duration, Instant},
};

use sysinfo::{Pid, System};

// システム情報の構造体定義
#[derive(serde::Serialize)]
pub struct SystemInfo {
  pub cpu_usage: f32,            // システム全体のCPU使用率（%）
  pub memory_usage: f64,         // システム全体のメモリ使用率（%）
  pub memory_used: u64,          // システム全体の使用中メモリ（バイト）
  pub memory_total: u64,         // システム全体の総メモリ（バイト）
  pub process_cpu_usage: f32,    // 自プロセスのCPU使用率（%）
  pub process_memory_usage: u64, // 自プロセスのメモリ使用量（バイト）
}

// システム情報を定期的に更新するためのグローバル状態
static SYSTEM_INFO: once_cell::sync::Lazy<Arc<Mutex<Option<SystemInfo>>>> = once_cell::sync::Lazy::new(|| Arc::new(Mutex::new(None)));

/// システム情報（CPU・メモリ使用率）を取得するコマンド
/// フロントエンドから定期的に呼び出してステータス表示に使用
///
/// # 戻り値
/// * `SystemInfo` - CPU使用率、メモリ使用率、メモリ使用量の情報
#[tauri::command]
pub async fn get_system_info() -> Result<SystemInfo, String> {
  let system_info = SYSTEM_INFO.lock().map_err(|e| format!("システム情報の取得に失敗しました: {}", e))?;

  match &*system_info {
    Some(info) => Ok(SystemInfo {
      cpu_usage: info.cpu_usage,
      memory_usage: info.memory_usage,
      memory_used: info.memory_used,
      memory_total: info.memory_total,
      process_cpu_usage: info.process_cpu_usage,
      process_memory_usage: info.process_memory_usage,
    }),
    None => Err("システム情報がまだ初期化されていません".to_string()),
  }
}

/// システム情報の監視を開始する関数
/// バックグラウンドでCPU・メモリ使用率を定期的に更新
pub async fn start_system_monitoring() {
  let mut sys = System::new_all();
  let mut last_update = Instant::now();

  // 現在のプロセスIDを取得
  let current_pid = Pid::from(std::process::id() as usize);

  // 初回更新
  sys.refresh_all();
  tokio::time::sleep(Duration::from_millis(200)).await;

  loop {
    // 2秒間隔に変更してCPU負荷を軽減
    if last_update.elapsed() >= Duration::from_secs(2) {
      sys.refresh_cpu();
      sys.refresh_memory();
      sys.refresh_processes();

      // システム全体のCPU使用率の平均を計算
      let cpu_usage = sys.cpus().iter().map(|cpu| cpu.cpu_usage()).sum::<f32>() / sys.cpus().len() as f32;

      // システム全体のメモリ使用率を計算
      let memory_used = sys.used_memory();
      let memory_total = sys.total_memory();
      let memory_usage = if memory_total > 0 { (memory_used as f64 / memory_total as f64) * 100.0 } else { 0.0 };

      // 自プロセスの情報を取得
      let (process_cpu_usage, process_memory_usage) = if let Some(process) = sys.process(current_pid) {
        (process.cpu_usage(), process.memory())
      } else {
        (0.0, 0)
      };

      // グローバル状態を更新
      if let Ok(mut system_info) = SYSTEM_INFO.lock() {
        *system_info = Some(SystemInfo {
          cpu_usage,
          memory_usage,
          memory_used,
          memory_total,
          process_cpu_usage,
          process_memory_usage,
        });
      }

      last_update = Instant::now();
    }

    // 200msに変更してCPU負荷を軽減
    tokio::time::sleep(Duration::from_millis(200)).await;
  }
}
