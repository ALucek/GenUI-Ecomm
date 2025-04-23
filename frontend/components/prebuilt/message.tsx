import Markdown from "react-markdown";

export interface MessageTextProps {
  content: string;
}

export function AIMessageText(props: MessageTextProps) {
  return (
    <div className="flex mr-auto w-fit max-w-[700px] bg-zinc-100 rounded-lg px-1.5 py-0.5 mt-3">
      <p className="text-sm text-zinc-900 text-left break-words">
        <Markdown>{props.content}</Markdown>
      </p>
    </div>
  );
}

export function HumanMessageText(props: MessageTextProps) {
  return (
    <div className="flex ml-auto w-fit max-w-[700px] bg-blue-500 rounded-lg px-1.5 py-0.5">
      <p className="text-sm text-white text-left break-words">
        {props.content}
      </p>
    </div>
  );
}
