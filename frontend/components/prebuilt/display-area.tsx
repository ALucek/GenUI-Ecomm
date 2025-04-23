"use client";

import { ReactNode } from "react";
import { useDisplay } from "@/utils/display-context";
import { useStreamableValue } from "ai/rsc";
import { Button } from "../ui/button";

export default function DisplayArea() {
  const { displayComponentStreams, clearDisplayComponentStreams } = useDisplay();
  
  // Create individual values for each stream index
  // This ensures a consistent number of hooks in each render
  const componentValues: (ReactNode | null)[] = [];
  
  // Each of these will be created conditionally but in the same order every time
  // We use a fixed maximum number of streams we support to ensure hook count stability
  const MAX_COMPONENTS = 20;
  
  // Handle up to MAX_COMPONENTS streams (increase if needed)
  const [component0] = useStreamableValue(displayComponentStreams[0] ?? undefined);
  const [component1] = useStreamableValue(displayComponentStreams[1] ?? undefined);
  const [component2] = useStreamableValue(displayComponentStreams[2] ?? undefined);
  const [component3] = useStreamableValue(displayComponentStreams[3] ?? undefined);
  const [component4] = useStreamableValue(displayComponentStreams[4] ?? undefined);
  const [component5] = useStreamableValue(displayComponentStreams[5] ?? undefined);
  const [component6] = useStreamableValue(displayComponentStreams[6] ?? undefined);
  const [component7] = useStreamableValue(displayComponentStreams[7] ?? undefined);
  const [component8] = useStreamableValue(displayComponentStreams[8] ?? undefined);
  const [component9] = useStreamableValue(displayComponentStreams[9] ?? undefined);
  // Add more if necessary

  // Get the most recent component
  const latestComponent = 
    component9 || component8 || component7 || component6 || component5 || 
    component4 || component3 || component2 || component1 || component0;

  return (
    <div className="w-full h-full flex flex-col items-center justify-start rounded-lg border border-gray-200 bg-gray-50/25 p-4">
      <div className="w-full flex-1 overflow-y-auto">
        {latestComponent ? (
          <div className="w-full">
            {latestComponent}
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <p className="text-xl font-semibold">Interactive Product Space</p>
            <p className="text-sm">Generated components will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
} 