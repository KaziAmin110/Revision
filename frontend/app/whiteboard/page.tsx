import Whiteboard from "@/components/WhiteBoard";

export default function WhiteboardPage() {
  return (
    <div className="bg-white min-h-screen text-black flex flex-col items-center justify-center">
      <main className="w-full flex-1 flex flex-col ">
        <Whiteboard />
      </main>
    </div>
  );
}
