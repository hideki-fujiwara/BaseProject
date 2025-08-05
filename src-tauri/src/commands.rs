/// 基本的な挨拶機能を提供するコマンド（開発テスト用）
/// フロントエンド（JavaScript）から呼び出し可能なRust関数
///
/// # 引数
/// * `name` - 挨拶する相手の名前
///
/// # 戻り値
/// * 挨拶メッセージ文字列
#[tauri::command]
pub fn greet(name: &str) -> String {
  format!("Hello, {}! You've been greeted from Rust!", name)
}
