/**
 * フォントサイズ管理ユーティリティ
 *
 * アプリケーション全体のフォントサイズを動的に制御する機能を提供。
 * ズームイン・ズームアウト・リセット機能を実装し、
 * 設定値の永続化と復元も対応。
 */

import ConsoleMsg from "./ConsoleMsg";
import { loadStore, saveStore } from "./StoreManager";

// ========================================================================================
// デフォルト定数（Store読み込み失敗時のフォールバック）
// ========================================================================================

/**
 * デフォルトのフォントサイズ設定値
 * Storeの読み込みに失敗した場合のフォールバック値
 */
const DEFAULT_FONT_SIZE_CONFIG = {
  DEFAULT: 16, // デフォルトフォントサイズ（px）
  MIN: 10, // 最小フォントサイズ（px）
  MAX: 48, // 最大フォントサイズ（px）
  STEP: 2, // 拡大・縮小のステップ（px）
};

/**
 * ローカルストレージのキー名
 */
const STORAGE_KEY = "app-font-size";

// ========================================================================================
// Store管理
// ========================================================================================

/**
 * Storeからフォントサイズ設定を取得する
 *
 * @returns {Promise<Object>} フォントサイズ設定オブジェクト
 */
const getFontSizeConfigFromStore = async () => {
  try {
    const store = await loadStore();

    // Store内のfontSizeConfig または windowConfig.fontSizeConfig を取得
    const fontConfig = store.fontSizeConfig || store.windowConfig?.fontSizeConfig;

    if (fontConfig) {
      // 必要な項目が全て揃っているかチェック
      const config = {
        DEFAULT: fontConfig.default || DEFAULT_FONT_SIZE_CONFIG.DEFAULT,
        MIN: fontConfig.min || DEFAULT_FONT_SIZE_CONFIG.MIN,
        MAX: fontConfig.max || DEFAULT_FONT_SIZE_CONFIG.MAX,
        STEP: fontConfig.step || DEFAULT_FONT_SIZE_CONFIG.STEP,
      };

      ConsoleMsg("info", "Storeからフォントサイズ設定を読み込み:", config);
      return config;
    }
  } catch (error) {
    ConsoleMsg("warn", "Storeからのフォントサイズ設定読み込みに失敗:", error);
  }

  // デフォルト値を返す
  ConsoleMsg("info", "デフォルトのフォントサイズ設定を使用:", DEFAULT_FONT_SIZE_CONFIG);
  return DEFAULT_FONT_SIZE_CONFIG;
};

/**
 * フォントサイズ設定をStoreに保存する
 *
 * @param {Object} fontConfig - 保存するフォントサイズ設定
 */
const saveFontSizeConfigToStore = async (fontConfig) => {
  try {
    const store = await loadStore();

    // windowConfig内にfontSizeConfigを保存
    const newStore = {
      ...store,
      windowConfig: {
        ...store.windowConfig,
        fontSizeConfig: {
          default: fontConfig.DEFAULT,
          min: fontConfig.MIN,
          max: fontConfig.MAX,
          step: fontConfig.STEP,
        },
      },
    };

    await saveStore(newStore);
    ConsoleMsg("info", "フォントサイズ設定をStoreに保存:", fontConfig);
  } catch (error) {
    ConsoleMsg("error", "フォントサイズ設定の保存に失敗:", error);
  }
};

// ========================================================================================
// キャッシュ管理
// ========================================================================================

/**
 * フォントサイズ設定のキャッシュ
 */
let cachedFontSizeConfig = null;

/**
 * フォントサイズ設定を取得する（キャッシュ付き）
 *
 * @returns {Promise<Object>} フォントサイズ設定オブジェクト
 */
const getFontSizeConfig = async () => {
  if (!cachedFontSizeConfig) {
    cachedFontSizeConfig = await getFontSizeConfigFromStore();
  }
  return cachedFontSizeConfig;
};

/**
 * フォントサイズ設定のキャッシュをリフレッシュする
 *
 * @returns {Promise<Object>} 新しいフォントサイズ設定オブジェクト
 */
const refreshFontSizeConfig = async () => {
  cachedFontSizeConfig = null;
  return await getFontSizeConfig();
};

// ========================================================================================
// 内部ヘルパー関数
// ========================================================================================

/**
 * 現在のフォントサイズを取得する
 *
 * @returns {number} 現在のフォントサイズ（px）
 */
const getCurrentFontSize = () => {
  const computedStyle = getComputedStyle(document.documentElement);
  const currentSize = parseFloat(computedStyle.fontSize);

  // NaNの場合はデフォルト値を返す
  return isNaN(currentSize) ? DEFAULT_FONT_SIZE_CONFIG.DEFAULT : currentSize;
};

/**
 * フォントサイズを適用する
 *
 * @param {number} size - 設定するフォントサイズ（px）
 * @param {Object} config - フォントサイズ設定オブジェクト
 * @returns {number} 実際に設定されたフォントサイズ（制限値適用後）
 */
const applyFontSize = (size, config) => {
  // 制限値内に収める
  const clampedSize = Math.max(config.MIN, Math.min(config.MAX, size));

  // DOMに適用
  document.documentElement.style.fontSize = `${clampedSize}px`;

  // ローカルストレージに保存
  try {
    localStorage.setItem(STORAGE_KEY, clampedSize.toString());
  } catch (error) {
    ConsoleMsg("warn", "フォントサイズの保存に失敗しました:", error);
  }

  return clampedSize;
};

// ========================================================================================
// 公開API
// ========================================================================================

/**
 * フォントサイズを拡大する
 *
 * 現在のフォントサイズに STEP 分を加算し、最大値を超えない範囲で拡大。
 *
 * @returns {Promise<Object>} 操作結果
 * @returns {number} result.oldSize - 変更前のフォントサイズ
 * @returns {number} result.newSize - 変更後のフォントサイズ
 * @returns {boolean} result.changed - サイズが変更されたかどうか
 */
export const increaseFontSize = async () => {
  const config = await getFontSizeConfig();
  const oldSize = getCurrentFontSize();
  const newSize = applyFontSize(oldSize + config.STEP, config);
  const changed = oldSize !== newSize;

  if (changed) {
    ConsoleMsg("info", `フォントサイズを拡大: ${oldSize}px → ${newSize}px`);
  } else {
    ConsoleMsg("info", `フォントサイズは既に最大値です: ${newSize}px`);
  }

  return { oldSize, newSize, changed };
};

/**
 * フォントサイズを縮小する
 *
 * 現在のフォントサイズから STEP 分を減算し、最小値を下回らない範囲で縮小。
 *
 * @returns {Promise<Object>} 操作結果
 * @returns {number} result.oldSize - 変更前のフォントサイズ
 * @returns {number} result.newSize - 変更後のフォントサイズ
 * @returns {boolean} result.changed - サイズが変更されたかどうか
 */
export const decreaseFontSize = async () => {
  const config = await getFontSizeConfig();
  const oldSize = getCurrentFontSize();
  const newSize = applyFontSize(oldSize - config.STEP, config);
  const changed = oldSize !== newSize;

  if (changed) {
    ConsoleMsg("info", `フォントサイズを縮小: ${oldSize}px → ${newSize}px`);
  } else {
    ConsoleMsg("info", `フォントサイズは既に最小値です: ${newSize}px`);
  }

  return { oldSize, newSize, changed };
};

/**
 * フォントサイズをデフォルト値にリセットする
 *
 * @returns {Promise<Object>} 操作結果
 * @returns {number} result.oldSize - 変更前のフォントサイズ
 * @returns {number} result.newSize - 変更後のフォントサイズ
 * @returns {boolean} result.changed - サイズが変更されたかどうか
 */
export const resetFontSize = async () => {
  const config = await getFontSizeConfig();
  const oldSize = getCurrentFontSize();
  const newSize = applyFontSize(config.DEFAULT, config);
  const changed = oldSize !== newSize;

  if (changed) {
    ConsoleMsg("info", `フォントサイズをリセット: ${oldSize}px → ${newSize}px`);
  } else {
    ConsoleMsg("info", `フォントサイズは既にデフォルト値です: ${newSize}px`);
  }

  return { oldSize, newSize, changed };
};

/**
 * 現在のフォントサイズ情報を取得する
 *
 * @returns {Promise<Object>} フォントサイズ情報
 * @returns {number} info.current - 現在のフォントサイズ
 * @returns {number} info.default - デフォルトフォントサイズ
 * @returns {number} info.min - 最小フォントサイズ
 * @returns {number} info.max - 最大フォントサイズ
 * @returns {number} info.step - 変更ステップ
 * @returns {boolean} info.isMin - 最小値に達しているか
 * @returns {boolean} info.isMax - 最大値に達しているか
 * @returns {boolean} info.isDefault - デフォルト値かどうか
 */
export const getFontSizeInfo = async () => {
  const config = await getFontSizeConfig();
  const current = getCurrentFontSize();

  return {
    current,
    default: config.DEFAULT,
    min: config.MIN,
    max: config.MAX,
    step: config.STEP,
    isMin: current <= config.MIN,
    isMax: current >= config.MAX,
    isDefault: current === config.DEFAULT,
  };
};

/**
 * 保存されたフォントサイズを復元する
 *
 * アプリケーション起動時に呼び出して、
 * 前回終了時のフォントサイズを復元する。
 *
 * @returns {Promise<number>} 復元されたフォントサイズ
 */
export const restoreFontSize = async () => {
  const config = await getFontSizeConfig();

  try {
    const savedSize = localStorage.getItem(STORAGE_KEY);

    if (savedSize) {
      const size = parseFloat(savedSize);

      if (!isNaN(size)) {
        const restoredSize = applyFontSize(size, config);
        ConsoleMsg("info", `保存されたフォントサイズを復元: ${restoredSize}px`);
        return restoredSize;
      }
    }
  } catch (error) {
    ConsoleMsg("warn", "フォントサイズの復元に失敗しました:", error);
  }

  // 復元に失敗した場合はデフォルト値を設定
  const defaultSize = applyFontSize(config.DEFAULT, config);
  ConsoleMsg("info", `デフォルトフォントサイズを設定: ${defaultSize}px`);
  return defaultSize;
};

/**
 * 特定のフォントサイズを設定する
 *
 * @param {number} size - 設定するフォントサイズ（px）
 * @returns {Promise<Object>} 操作結果
 * @returns {number} result.oldSize - 変更前のフォントサイズ
 * @returns {number} result.newSize - 変更後のフォントサイズ
 * @returns {boolean} result.changed - サイズが変更されたかどうか
 */
export const setFontSize = async (size) => {
  const config = await getFontSizeConfig();
  const oldSize = getCurrentFontSize();
  const newSize = applyFontSize(size, config);
  const changed = oldSize !== newSize;

  if (changed) {
    ConsoleMsg("info", `フォントサイズを設定: ${oldSize}px → ${newSize}px`);
  }

  return { oldSize, newSize, changed };
};

/**
 * フォントサイズ設定を更新する
 *
 * @param {Object} newConfig - 新しいフォントサイズ設定
 * @param {number} newConfig.default - デフォルトフォントサイズ
 * @param {number} newConfig.min - 最小フォントサイズ
 * @param {number} newConfig.max - 最大フォントサイズ
 * @param {number} newConfig.step - 変更ステップ
 * @returns {Promise<void>}
 */
export const updateFontSizeConfig = async (newConfig) => {
  const config = {
    DEFAULT: newConfig.default || DEFAULT_FONT_SIZE_CONFIG.DEFAULT,
    MIN: newConfig.min || DEFAULT_FONT_SIZE_CONFIG.MIN,
    MAX: newConfig.max || DEFAULT_FONT_SIZE_CONFIG.MAX,
    STEP: newConfig.step || DEFAULT_FONT_SIZE_CONFIG.STEP,
  };

  // Storeに保存
  await saveFontSizeConfigToStore(config);

  // キャッシュを更新
  cachedFontSizeConfig = config;

  ConsoleMsg("info", "フォントサイズ設定を更新:", config);
};

/**
 * フォントサイズ設定をリフレッシュする
 *
 * @returns {Promise<Object>} 新しいフォントサイズ設定
 */
export const refreshConfig = refreshFontSizeConfig;
