"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { EndpointsContext } from "@/app/agent";
import { useActions } from "@/utils/client";
import { LocalContext } from "@/app/shared";
import { HumanMessageText } from "./message";
import { useDisplay } from "@/utils/display-context";
import { StreamableValue } from "ai/rsc";
import { ReactNode } from "react";

export interface ChatProps {}

interface AgentResponse {
  ui: ReactNode;
  lastEvent: Promise<any>;
  displayComponent: StreamableValue<ReactNode | null>;
}

export default function Chat() {
  const actions = useActions<typeof EndpointsContext>();
  const { addDisplayComponentStream } = useDisplay();
  const messageContainerRef = useRef<HTMLDivElement>(null);

  const [elements, setElements] = useState<JSX.Element[]>([]);
  const [history, setHistory] = useState<[role: string, content: string][]>([]);
  const [input, setInput] = useState("");

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [elements]);

  async function onSubmit(input: string) {
    const newElements = [...elements];
    const element = (await actions.agent({
      input,
      chat_history: history,
    })) as AgentResponse;

    addDisplayComponentStream(element.displayComponent);

    newElements.push(
      <div className="flex flex-col w-full gap-1 mt-auto" key={history.length}>
        <HumanMessageText content={input} />
        <div className="flex flex-col gap-1 w-full max-w-fit mr-auto">
          {element.ui}
        </div>
      </div>,
    );

    (async () => {
      let lastEvent = await element.lastEvent;
      if (Array.isArray(lastEvent)) {
        if (lastEvent[0].invoke_model && lastEvent[0].invoke_model.result) {
          setHistory((prev) => [
            ...prev,
            ["human", input],
            ["ai", lastEvent[0].invoke_model.result],
          ]);
        } else if (lastEvent[1].invoke_tools) {
          setHistory((prev) => [
            ...prev,
            ["human", input],
            [
              "ai",
              `Tool result: ${JSON.stringify(lastEvent[1].invoke_tools.tool_result, null)}`,
            ],
          ]);
        } else {
          setHistory((prev) => [...prev, ["human", input]]);
        }
      } else if (lastEvent.invoke_model && lastEvent.invoke_model.result) {
        setHistory((prev) => [
          ...prev,
          ["human", input],
          ["ai", lastEvent.invoke_model.result],
        ]);
      }
    })();

    setElements(newElements);
    setInput("");
  }

  return (
    <div className="h-full flex flex-col">
      <div className="text-xl font-semibold p-3 border-b border-gray-200 mb-2">
        Chat Interface
      </div>
      <div ref={messageContainerRef} className="flex-1 overflow-y-auto px-2 pb-2">
        <div className="flex flex-col gap-4">
          <LocalContext.Provider value={onSubmit}>
            <div className="flex flex-col w-full gap-3">{elements}</div>
          </LocalContext.Provider>
        </div>
      </div>
      <form
        onSubmit={async (e) => {
          e.stopPropagation();
          e.preventDefault();
          await onSubmit(input);
        }}
        className="w-full flex flex-row gap-2 mt-2 p-2 border-t border-gray-200"
      >
        <Input
          placeholder="Ask about products..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
}
