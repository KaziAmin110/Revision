import Whiteboard from "@/components/WhiteBoard";

export default function WhiteboardPage() {
  return (
    <div className="bg-gray-900 min-h-screen text-white flex flex-col items-center justify-center p-4">
      <header className="text-center mb-6 w-full max-w-7xl">
        <h1 className="text-4xl sm:text-5xl font-bold text-cyan-400">
          Interactive Whiteboard
        </h1>
        <p className="text-lg text-gray-400 mt-2">
          Work through your problems and get real-time feedback
        </p>
      </header>
      <main className="w-full h-[75vh] max-w-7xl">
        <Whiteboard />
      </main>
    </div>
  );
}
