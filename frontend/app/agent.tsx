import { RemoteRunnable } from "@langchain/core/runnables/remote";
import { exposeEndpoints, streamRunnableUI } from "@/utils/server";
import "server-only";
import { StreamEvent } from "@langchain/core/tracers/log_stream";
import { EventHandlerFields } from "@/utils/server";
import { ProductDetail, ProductDetailLoading } from "@/components/prebuilt/product-detail";
import { Comparison, ComparisonLoading } from "@/components/prebuilt/product-comparison";
import { ProductTiles, ProductTilesLoading } from "@/components/prebuilt/product-tiles";
import { ProductCarousel } from "@/components/prebuilt/product-carousel";
import { createStreamableUI, createStreamableValue } from "ai/rsc";
import { AIMessage } from "@/ai/message";

const API_URL = "http://localhost:8000/chat";

type ToolComponent = {
  loading: (props?: any) => JSX.Element;
  final: (props?: any) => JSX.Element;
};

type ToolComponentMap = {
  [tool: string]: ToolComponent;
};

const TOOL_COMPONENT_MAP: ToolComponentMap = {
  "product-details": {
    loading: (props?: any) => <ProductDetailLoading {...props} />,
    final: (props?: any) => <ProductDetail {...props} />,
  },
  "product-comparison": {
    loading: (props?: any) => <ComparisonLoading {...props} />,
    final: (props?: any) => <Comparison {...props} />,
  },
  "product-tiles": {
    loading: (props?: any) => <ProductTilesLoading {...props} />,
    final: (props?: any) => <ProductTiles {...props} />,
  },
  "product-carousel": {
    loading: (props?: any) => <ProductCarousel isLoading={true} {...props} />,
    final: (props?: any) => <ProductCarousel {...props} />,
  },
};

async function agent(inputs: {
  input: string;
  chat_history: [role: string, content: string][];
  file?: {
    base64: string;
    extension: string;
  };
}) {
  "use server";
  const remoteRunnable = new RemoteRunnable({
    url: API_URL,
  });

  let selectedToolComponent: ToolComponent | null = null;
  let selectedToolUI: ReturnType<typeof createStreamableUI> | null = null;

  /**
   * Handles the 'invoke_model' event by checking for tool calls in the output.
   * If a tool call is found and no tool component is selected yet, it sets the
   * selected tool component based on the tool type and updates the display component stream.
   *
   * @param output - The output object from the 'invoke_model' event
   */
  const handleInvokeModelEvent = (
    event: StreamEvent,
    fields: EventHandlerFields,
  ) => {
    const [type] = event.event.split("_").slice(2);
    if (
      type !== "end" ||
      !event.data.output ||
      typeof event.data.output !== "object" ||
      event.name !== "invoke_model"
    ) {
      return;
    }

    if (
      "tool_calls" in event.data.output &&
      event.data.output.tool_calls.length > 0
    ) {
      const toolCall = event.data.output.tool_calls[0];
      if (!selectedToolComponent && !selectedToolUI) {
        selectedToolComponent = TOOL_COMPONENT_MAP[toolCall.type];
        
        // Create streamable UI for internal tracking if needed, but don't append to chat
        selectedToolUI = createStreamableUI();
        
        // Update the dedicated display component stream with the loading state
        fields.displayComponent.update(selectedToolComponent.loading());
      }
    }
  };

  /**
   * Handles the 'invoke_tools' event by updating the tool's display stream
   * with the final state and tool result data.
   *
   * @param output - The output object from the 'invoke_tools' event
   */
  const handleInvokeToolsEvent = (
    event: StreamEvent,
    fields: EventHandlerFields,
  ) => {
    const [type] = event.event.split("_").slice(2);
    if (
      type !== "end" ||
      !event.data.output ||
      typeof event.data.output !== "object" ||
      event.name !== "invoke_tools"
    ) {
      return;
    }

    if (selectedToolComponent) {
      const toolData = event.data.output.tool_result;
      
      // Update the display area stream with the final component
      fields.displayComponent.update(selectedToolComponent.final(toolData));
      
      // If we had a streamable UI for internal tracking, mark it done
      if (selectedToolUI) {
        selectedToolUI.done();
      }
    }
  };

  /**
   * Handles the 'on_chat_model_stream' event by creating a new text stream
   * for the AI message if one doesn't exist for the current run ID.
   * It then appends the chunk content to the corresponding text stream.
   *
   * @param streamEvent - The stream event object
   * @param chunk - The chunk object containing the content
   */
  const handleChatModelStreamEvent = (
    event: StreamEvent,
    fields: EventHandlerFields,
  ) => {
    if (
      event.event !== "on_chat_model_stream" ||
      !event.data.chunk ||
      typeof event.data.chunk !== "object"
    )
      return;
    if (!fields.callbacks[event.run_id]) {
      const textStream = createStreamableValue();
      fields.ui.append(<AIMessage value={textStream.value} />);
      fields.callbacks[event.run_id] = textStream;
    }

    if (fields.callbacks[event.run_id]) {
      fields.callbacks[event.run_id].append(event.data.chunk.content);
    }
  };

  return streamRunnableUI(
    remoteRunnable,
    {
      input: [
        ...inputs.chat_history.map(([role, content]) => ({
          type: role,
          content,
        })),
        {
          type: "human",
          content: inputs.input,
        },
      ],
    },
    {
      eventHandlers: [
        handleInvokeModelEvent,
        handleInvokeToolsEvent,
        handleChatModelStreamEvent,
      ],
    },
  );
}

export const EndpointsContext = exposeEndpoints({ agent });
