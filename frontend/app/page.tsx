import Chat from "@/components/prebuilt/chat";
import DisplayArea from "@/components/prebuilt/display-area";
import { DisplayProvider } from "@/utils/display-context";

export default function Home() {
  return (
    <DisplayProvider>
      <main className="flex h-screen w-full overflow-hidden">
        <div className="w-1/3 min-w-[300px] border-r border-gray-200 p-4 h-full overflow-hidden">
          <Chat />
        </div>
        <div className="w-2/3 p-4 h-full overflow-hidden">
          <DisplayArea />
        </div>
      </main>
    </DisplayProvider>
  );
}
