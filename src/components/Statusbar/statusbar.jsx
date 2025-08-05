import ConsoleMsg from "../../utils/ConsoleMsg";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

function Statusbar() {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [systemInfo, setSystemInfo] = useState({
    cpu_usage: 0,
    memory_usage: 0,
    memory_used: 0,
    memory_total: 0,
    process_cpu_usage: 0,
    process_memory_usage: 0,
  });

  // 時刻更新のuseEffect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // システム情報更新のuseEffect
  useEffect(() => {
    const updateSystemInfo = async () => {
      try {
        const info = await invoke("get_system_info");
        setSystemInfo(info);
      } catch (error) {
        console.error("システム情報の取得に失敗:", error);
      }
    };

    updateSystemInfo();
    const interval = setInterval(updateSystemInfo, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (date) => {
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // メモリ使用量をフォーマット（MB単位）
  const formatMemory = (bytes) => {
    return (bytes / 1024 / 1024 / 1024).toFixed(1);
  };

  // メモリ使用量をフォーマット（GB単位）
  const formatMemoryGB = (bytes) => {
    return (bytes / 1024 / 1024 / 1024).toFixed(1);
  };

  return (
    <div className="w-full">
      <div className="flex h-16 max-h-16 w-full items-center rounded-b-lg bg-base-200 px-2 py-2">
        <div className="flex-1 text-base-content">
          <div className="mb-1">
            <span className="mr-4">システム - CPU: {systemInfo.cpu_usage.toFixed(1)}%</span>
            <span>
              Memory: {systemInfo.memory_usage.toFixed(1)}% ({formatMemoryGB(systemInfo.memory_used)}GB / {formatMemoryGB(systemInfo.memory_total)}GB)
            </span>
          </div>
          <div>
            <span className="mr-4">アプリ - CPU: {systemInfo.process_cpu_usage.toFixed(1)}%</span>
            <span>Memory: {formatMemory(systemInfo.process_memory_usage)}GB</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-sm font-medium text-base-content">{formatTime(currentDateTime)}</div>
          <div className="text-sm font-medium text-base-content">{formatDate(currentDateTime)}</div>
        </div>
      </div>
    </div>
  );
}
export default Statusbar;
