import React, { useMemo, useState, useEffect } from "react";
import { Clock, Loader2 } from "lucide-react";
import { getOrdersHistory } from "@/lib/api";

const PeakHoursHeatmap = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ day: number; hour: number }[]>([]);

  useEffect(() => {
    getOrdersHistory().then((orders) => {
      const processed = orders.map((o: any) => {
        const d = new Date(o.created_at);
        return {
          day: d.getDay(), // 0=Sun, 1=Mon...
          hour: d.getHours(),
        };
      });
      setData(processed);
      setLoading(false);
    });
  }, []);

  // Aggregate Data
  const heatmapData = useMemo(() => {
    const map = new Map<string, number>();
    let max = 1;

    data.forEach(({ day, hour }) => {
      // Adjustment: 0=Sun in JS, but UI uses Mon-Sun. Let's map 0->6, 1->0 for Mon=0 index
      const uiDay = day === 0 ? 6 : day - 1;
      const key = `${uiDay}-${hour}`;
      const count = (map.get(key) || 0) + 1;
      map.set(key, count);
      if (count > max) max = count;
    });

    return { map, max };
  }, [data]);

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hours = Array.from({ length: 12 }, (_, i) => i + 11); // 11 AM to 10 PM

  const getIntensity = (dayIdx: number, hour: number) => {
    const count = heatmapData.map.get(`${dayIdx}-${hour}`) || 0;
    return (count / heatmapData.max) * 100;
  };

  const getColor = (intensity: number) => {
    if (intensity === 0) return "bg-white/5";
    if (intensity > 75)
      return "bg-brand-primary shadow-[0_0_10px_rgba(250,204,21,0.5)]";
    if (intensity > 50) return "bg-brand-primary/80";
    if (intensity > 25) return "bg-brand-primary/40";
    return "bg-brand-primary/20";
  };

  return (
    <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6 shadow-xl col-span-2 relative min-h-[300px]">
      {loading && (
        <div className="absolute inset-0 z-10 bg-zinc-900/80 flex items-center justify-center">
          <Loader2 className="animate-spin text-brand-primary" />
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-brand-primary/20 rounded-lg">
            <Clock className="text-brand-primary w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Peak Hours</h3>
            <p className="text-sm text-zinc-500">Based on last 1000 orders</p>
          </div>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-zinc-500 font-medium">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-white/5"></div>0
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-brand-primary/20"></div>Low
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-brand-primary"></div>High
          </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[500px]">
          {/* Header Row (Hours) */}
          <div className="grid grid-cols-[50px_1fr] mb-2">
            <div /> {/* Spacer */}
            <div className="grid grid-cols-12 gap-1">
              {hours.map((h) => (
                <div
                  key={h}
                  className="text-center text-[10px] font-bold text-zinc-600 uppercase"
                >
                  {h > 12 ? h - 12 : h}
                  {h >= 12 && h !== 24 ? "p" : "a"}
                </div>
              ))}
            </div>
          </div>

          {/* Rows (Days) */}
          <div className="space-y-1.5">
            {days.map((day, dIdx) => (
              <div key={day} className="grid grid-cols-[50px_1fr] items-center">
                <span className="text-xs font-bold text-zinc-500 uppercase">
                  {day}
                </span>
                <div className="grid grid-cols-12 gap-1 h-8">
                  {hours.map((hour) => {
                    const intensity = getIntensity(dIdx, hour);
                    const count = heatmapData.map.get(`${dIdx}-${hour}`) || 0;
                    return (
                      <div
                        key={`${day}-${hour}`}
                        className={`h-full w-full rounded-md transition-all hover:scale-110 hover:brightness-125 cursor-help ${getColor(intensity)} relative group`}
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50">
                          {count} Orders
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeakHoursHeatmap;
