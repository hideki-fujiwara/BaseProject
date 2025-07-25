import {
  readTextFile,
  writeTextFile,
  exists,
  mkdir,
  BaseDirectory,
} from "@tauri-apps/plugin-fs";
import ConsoleMsg from "./ConsoleMsg";
import {
  appCacheDir,
  configDir,
  appDataDir,
  appLocalDataDir,
  appLogDir,
  desktopDir,
  documentDir,
  homeDir,
} from "@tauri-apps/api/path";
// import { LucideTable2 } from "lucide-react";

// デフォルト設定
const DEFAULT_CONFIG = {
  projects: [],
  window_state: {
    width: 1920.0,
    height: 1080.0,
    x: 200,
    y: 400,
    theme: "Dark",
    fullscreen: false,
  },
  window_config: {
    title: "baseproject 2025",
    min_width: 1024,
    min_height: 768,
    max_width: 7680,
    max_height: 4320,
  },
};

// 設定ファイルのパス
let CONFIG_DIR = "";
const CONFIG_FILE = "baseproject.config";

/**
 * 設定ファイルを読み込む
 * @returns {Promise<Object>} 設定オブジェクト
 */
export async function loadConfig() {
  ConsoleMsg("debug", "Start window_loadConfig");

  const appLogDirPath = await appLogDir();
  ConsoleMsg("info", `Logフォルダ::LogDirPath=${appLogDirPath}`);
  const configDirPath = await configDir();
  ConsoleMsg("info", `コンフィグフォルダ::configDirPath=${configDirPath}`);
  //
  const desktopPath = await desktopDir();
  ConsoleMsg("info", `ディスクトップフォルダ::desktopPath=${desktopPath}`);
  //
  const documentDirPath = await documentDir();
  ConsoleMsg(
    "info",
    `ドキュメントフォルダ::documentDirPath=${documentDirPath}`
  );
  //
  const homeDirPath = await homeDir();
  ConsoleMsg("info", `HOMEフォルダ::homeDirPath=${homeDirPath}`);

  try {
    CONFIG_DIR = `${configDirPath}\\baseproject`;
    // 設定ディレクトリが存在するか確認し、なければ作成
    ConsoleMsg("debug", `Config設定ディレクトリ: ${CONFIG_DIR}`);
    const dirExists = await exists(CONFIG_DIR, { dir: BaseDirectory.Config });
    ConsoleMsg("debug", `debug ${dirExists}`);
    if (!dirExists) {
      ConsoleMsg("info", `設定ディレクトリを作成します: ${CONFIG_DIR}`);
      await mkdir(CONFIG_DIR, { dir: BaseDirectory.Config, recursive: true });
    }

    // 設定ファイルのパス
    const configPath = `${CONFIG_DIR}\\${CONFIG_FILE}`;
    ConsoleMsg("debug", `設定ファイル: ${configPath}`);
    // 設定ファイルが存在するか確認
    const fileExists = await exists(configPath, { dir: BaseDirectory.Config });
    ConsoleMsg("debug", `debug ${dirExists}`);
    if (fileExists) {
      // 設定ファイルが存在する場合は読み込む
      ConsoleMsg("info", `設定ファイルを読み込みます: ${configPath}`);
      const configData = await readTextFile(configPath, {
        dir: BaseDirectory.Config,
      });
      return { ...DEFAULT_CONFIG, ...JSON.parse(configData) };
    } else {
      // 設定ファイルが存在しない場合はデフォルト設定を保存して返す
      ConsoleMsg(
        "info",
        `設定ファイルが見つかりません。デフォルト設定を作成します: ${configPath}`
      );
      await saveConfig(DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }
  } catch (error) {
    // エラーが発生した場合はログを出力してデフォルト設定を返す
    ConsoleMsg(
      "error",
      `設定ファイルの読み込み中にエラーが発生しました: ${error}`
    );
    return DEFAULT_CONFIG;
  }
}

/**
 * 設定を保存する
 * @param {Object} config 保存する設定オブジェクト
 * @returns {Promise<void>}
 */
export async function saveConfig(config) {
  try {
    // 設定ディレクトリが存在するか確認し、なければ作成
    const dirExists = await exists(CONFIG_DIR, { dir: BaseDirectory.App });
    if (!dirExists) {
      ConsoleMsg("info", `設定ディレクトリを作成します: ${CONFIG_DIR}`);
      await mkdir(CONFIG_DIR, { dir: BaseDirectory.App, recursive: true });
    }

    // 設定ファイルのパス
    const configPath = `${CONFIG_DIR}/${CONFIG_FILE}`;

    // 設定を保存
    ConsoleMsg("info", `設定ファイルを保存します: ${configPath}`);
    await writeTextFile(configPath, JSON.stringify(config, null, 2), {
      dir: BaseDirectory.App,
    });
    ConsoleMsg("info", "設定ファイルの保存が完了しました");
  } catch (error) {
    // エラーが発生した場合はログを出力
    ConsoleMsg("error", `設定ファイルの保存中にエラーが発生しました: ${error}`);
    throw error;
  }
}
