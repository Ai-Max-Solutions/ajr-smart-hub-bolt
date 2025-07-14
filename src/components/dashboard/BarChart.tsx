import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  title: string;
  data: DataPoint[];
  height?: number;
  showValues?: boolean;
  showGrid?: boolean;
  orientation?: "vertical" | "horizontal";
  className?: string;
}

export function BarChart({
  title,
  data,
  height = 200,
  showValues = true,
  showGrid = true,
  orientation = "vertical",
  className
}: BarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const isHorizontal = orientation === "horizontal";

  const getDefaultColor = (index: number) => {
    const colors = [
      "hsl(var(--accent))",
      "hsl(var(--success))",
      "hsl(var(--warning))",
      "hsl(var(--destructive))",
      "hsl(var(--muted-foreground))",
    ];
    return colors[index % colors.length];
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="font-poppins text-xl">{title}</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className={cn(
          "relative",
          isHorizontal ? "space-y-4" : "flex items-end justify-center gap-4"
        )} style={{ height: height }}>
          
          {/* Grid Lines */}
          {showGrid && !isHorizontal && (
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-px bg-border/30" />
              ))}
            </div>
          )}

          {/* Bars */}
          {data.map((item, index) => {
            const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            const barColor = item.color || getDefaultColor(index);
            
            if (isHorizontal) {
              return (
                <div key={item.label} className="flex items-center gap-4">
                  <div className="w-20 text-sm font-poppins text-muted-foreground text-right">
                    {item.label}
                  </div>
                  <div className="flex-1 relative">
                    <div 
                      className="h-8 rounded-md transition-all duration-500 hover:opacity-80 relative overflow-hidden"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: barColor,
                        minWidth: "4px"
                      }}
                    >
                      <div 
                        className="absolute inset-0 opacity-20"
                        style={{
                          background: `linear-gradient(90deg, transparent, ${barColor})`
                        }}
                      />
                    </div>
                    {showValues && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-poppins font-medium text-white">
                        {item.value}
                      </span>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div key={item.label} className="flex flex-col items-center group relative">
                {/* Bar */}
                <div 
                  className="w-12 rounded-t-md transition-all duration-500 hover:opacity-80 relative overflow-hidden"
                  style={{ 
                    height: `${percentage}%`,
                    backgroundColor: barColor,
                    minHeight: "4px"
                  }}
                >
                  <div 
                    className="absolute inset-0 opacity-20"
                    style={{
                      background: `linear-gradient(to top, transparent, ${barColor})`
                    }}
                  />
                </div>
                
                {/* Value */}
                {showValues && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-poppins font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity bg-card px-2 py-1 rounded shadow-sm border">
                    {item.value}
                  </div>
                )}
                
                {/* Label */}
                <div className="mt-2 text-xs font-poppins text-muted-foreground text-center max-w-16 leading-tight">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend for Horizontal */}
        {isHorizontal && (
          <div className="mt-6 flex flex-wrap gap-4 justify-center">
            {data.map((item, index) => (
              <div key={item.label} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: item.color || getDefaultColor(index) }}
                />
                <span className="text-xs font-poppins text-muted-foreground">
                  {item.label}: {item.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}