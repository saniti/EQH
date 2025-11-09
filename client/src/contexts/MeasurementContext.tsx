import { createContext, useContext, useState, ReactNode } from "react";

interface MeasurementContextType {
  isMetric: boolean;
  setIsMetric: (isMetric: boolean) => void;
}

const MeasurementContext = createContext<MeasurementContextType | undefined>(undefined);

export function MeasurementProvider({ children }: { children: ReactNode }) {
  const [isMetric, setIsMetric] = useState(true);

  return (
    <MeasurementContext.Provider
      value={{
        isMetric,
        setIsMetric,
      }}
    >
      {children}
    </MeasurementContext.Provider>
  );
}

export function useMeasurement() {
  const context = useContext(MeasurementContext);
  if (context === undefined) {
    throw new Error("useMeasurement must be used within a MeasurementProvider");
  }
  return context;
}

