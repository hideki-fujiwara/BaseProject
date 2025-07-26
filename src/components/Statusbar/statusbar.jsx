import ConsoleMsg from "../../utils/ConsoleMsg";
import { useState, useEffect } from "react";

function Statusbar() {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
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

  return (
    <div className="w-full">
      <div className="flex h-12 max-h-12 w-full items-center rounded-b-lg bg-base-200 px-2 py-2">
        <div className="flex-1 text-base-content">Status Bar</div>
        <div className="flex flex-col items-end">
          <div className="text-sm font-medium text-base-content">{formatTime(currentDateTime)}</div>
          <div className="text-sm font-medium text-base-content">{formatDate(currentDateTime)}</div>
        </div>
      </div>
    </div>
  );
}
export default Statusbar;
