"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { EndpointsContext } from "@/app/agent";
import { useActions } from "@/utils/client";
import { LocalContext } from "@/app/shared";
import { HumanMessageText, AIMessageText } from "./message";
import { useDisplay } from "@/utils/display-context";
import { StreamableValue, readStreamableValue } from "ai/rsc";
import { ReactNode } from "react";

export interface ChatProps {}

interface AgentResponse {
  ui: ReactNode;
  lastEvent: Promise<any>;
  displayComponent: StreamableValue<ReactNode | null>;
}

// Define the expected history format from the backend
type HistoryEntry = [role: "human" | "ai", content: string];

export default function Chat() {
  const actions = useActions<typeof EndpointsContext>();
  const { addDisplayComponentStream, clearDisplayComponentStreams } = useDisplay();
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [shouldScroll, setShouldScroll] = useState(true); // Flag to force scroll on new message

  const [elements, setElements] = useState<JSX.Element[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [input, setInput] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(true); // Loading state for initial history

  // Fetch initial history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const response = await fetch("http://localhost:8000/history");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: { history: HistoryEntry[] } = await response.json();

        // Set the history state
        setHistory(data.history);

        // Create initial elements based on fetched history
        const initialElements = data.history.map(([role, content], index) => (
          <div key={`hist-${index}`} className="flex flex-col w-full gap-1">
            {role === "human" ? (
              <HumanMessageText content={content} />
            ) : (
              <AIMessageText content={content} />
            )}
          </div>
        ));
        setElements(initialElements);
        setShouldScroll(true); // Scroll to bottom after loading history

      } catch (error) {
        console.error("Failed to fetch chat history:", error);
        // Optionally set a default initial message or show an error element
         setElements([<AIMessageText key="error-initial" content="Welcome! How can I help you today?" />]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Handle scrolling logic
  useLayoutEffect(() => {
    const container = messageContainerRef.current;
    if (!container) return;

    // Function to scroll to bottom
    const scrollToBottom = () => {
      container.scrollTop = container.scrollHeight;
    };

    // Initial scroll check and force scroll on new element addition
    if (shouldScroll) {
      scrollToBottom();
      setShouldScroll(false); // Reset the flag after scrolling
      setIsAtBottom(true); // Assume we start at the bottom
    }

    // Track scroll position
    const handleScroll = () => {
      if (!container) return;
      const tolerance = 10; // Pixels tolerance to consider "at bottom"
      const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= tolerance;
      setIsAtBottom(atBottom);
    };

    container.addEventListener('scroll', handleScroll);

    // Observe content changes (for streaming)
    const observer = new MutationObserver(() => {
      if (isAtBottom) {
        scrollToBottom();
      }
    });

    observer.observe(container, {
      childList: true, // Observe direct children additions/removals
      subtree: true,   // Observe all descendants
      characterData: true, // Observe text changes
    });

    // Cleanup
    return () => {
      container.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
    // Rerun effect if isAtBottom state changes (to re-evaluate scroll on mutation)
    // or if elements length changes (to trigger initial scroll via shouldScroll)
  }, [elements, isAtBottom, shouldScroll]); 

  async function onSubmit(input: string) {
    const currentUserMessageElement = <HumanMessageText content={input} key={`hist-${history.length}`} />;
    const currentHistory = [...history, ["human", input] as HistoryEntry];

    // Add human message element immediately
    setElements(prev => [...prev, currentUserMessageElement]);
    setHistory(currentHistory); // Update history state
    setInput(""); // Clear input field
    setShouldScroll(true); // Trigger scroll

    // Call the agent
    const element = (await actions.agent({
      input,
      chat_history: currentHistory, // Pass the updated history
    })) as AgentResponse;

    addDisplayComponentStream(element.displayComponent);

    // Create a placeholder for the AI response element
    const aiResponsePlaceholderKey = `ai-${currentHistory.length}`;
    const aiResponseElement = (
      <div key={aiResponsePlaceholderKey} className="flex flex-col gap-1 w-full max-w-fit mr-auto">
        {element.ui}
      </div>
    );

    // Append the AI response placeholder
    setElements(prev => [...prev, aiResponseElement]);
    setShouldScroll(true); // Trigger scroll again for AI response start

    // Wait for the stream to finish and update history
    (async () => {
      // Use readStreamableValue to get the final string content from the AI stream
      let finalAiContent = "";
      // Check if element.ui has a value property (assuming it's a streamable text)
      if (element.ui && typeof element.ui === 'object' && 'props' in element.ui && 'value' in element.ui.props) {
         for await (const delta of readStreamableValue(element.ui.props.value)) {
           if (typeof delta === 'string') {
             finalAiContent += delta;
           }
         }
      } else {
          // Fallback or different handling if the structure isn't as expected
          console.warn("AI response UI structure might have changed. Attempting fallback history update.");
          // Try using lastEvent as before, but this might be less accurate for streamed text
          let lastEvent = await element.lastEvent;
           if (Array.isArray(lastEvent)) {
                if (lastEvent[0]?.invoke_model?.result) {
                    finalAiContent = lastEvent[0].invoke_model.result;
                } else if (lastEvent[1]?.invoke_tools?.tool_result) {
                    finalAiContent = `Tool result: ${JSON.stringify(lastEvent[1].invoke_tools.tool_result)}`;
                }
            } else if (lastEvent?.invoke_model?.result) {
                 finalAiContent = lastEvent.invoke_model.result;
             } else if (lastEvent?.final_response) { // Check for final_response after tool call
                finalAiContent = lastEvent.final_response;
             }
      }

      // Update history only if we got some content
      if (finalAiContent) {
           setHistory(prev => [...prev, ["ai", finalAiContent] as HistoryEntry]);
      } else {
          console.warn("Could not determine final AI content to update history.");
           // Decide if you want to add a placeholder history entry or none
           // setHistory(prev => [...prev, ["ai", "[AI Response Streamed]"] as HistoryEntry]);
      }
    })();
  }

  // Function to handle resetting the chat history
  async function handleReset() {
    setIsLoadingHistory(true); // Show loading state during reset
    try {
      await fetch("http://localhost:8000/reset", { method: "POST" });
      // Refetch history after reset to get the initial AI message
      const response = await fetch("http://localhost:8000/history");
      if (!response.ok) throw new Error("Failed to fetch history after reset");
      const data: { history: HistoryEntry[] } = await response.json();

      setHistory(data.history);
      const initialElements = data.history.map(([role, content], index) => (
        <div key={`hist-reset-${index}`} className="flex flex-col w-full gap-1">
           {role === "ai" ? <AIMessageText content={content} /> : <HumanMessageText content={content} /> }
        </div>
      ));
      setElements(initialElements);
      clearDisplayComponentStreams();
      setShouldScroll(true);
      console.log("Chat history and display area reset.");
    } catch (error) {
      console.error("Failed to reset chat:", error);
    } finally {
       setIsLoadingHistory(false);
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="text-xl font-semibold p-3 border-b border-gray-200 mb-2 flex justify-between items-center">
        <span>GenUI Product Assistant</span>
         {/* Add the Reset button to the header */}
         <Button size="sm" variant="outline" onClick={handleReset} disabled={isLoadingHistory}>
          {isLoadingHistory ? "Resetting..." : "Reset Chat"}
        </Button>
      </div>
      <div ref={messageContainerRef} className="flex-1 overflow-y-auto px-2 pb-2">
        {isLoadingHistory ? (
           <div className="text-center text-gray-500">Loading history...</div>
        ) : (
          <div className="flex flex-col gap-4">
            <LocalContext.Provider value={onSubmit}>
              <div className="flex flex-col w-full gap-3">{elements}</div>
            </LocalContext.Provider>
          </div>
        )}
      </div>
      <form
        onSubmit={async (e) => {
          e.stopPropagation();
          e.preventDefault();
          if (input.trim() && !isLoadingHistory) { // Prevent sending while loading/resetting
             await onSubmit(input);
          }
        }}
        className="w-full flex flex-row gap-2 mt-2 p-2 border-t border-gray-200"
      >
        <Input
          placeholder="Ask about products..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoadingHistory} // Disable input while loading/resetting
        />
        <Button type="submit" disabled={isLoadingHistory || !input.trim()}>Send</Button>
      </form>
    </div>
  );
}
