"use client";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const Typewriter = dynamic(() => import("typewriter-effect"), { ssr: false });

const Landing = () => {
  const router = useRouter();

  const handleStartClick = () => {
    router.push("/upload");
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-white px-10 text-black text-center">
      <div className="flex flex-col items-center justify-center gap-5 max-w-xl">
        <div className="text-3xl font-bold leading-tight text-black typewriter-text">
          <Typewriter
            options={{ delay: 45 }}
            onInit={(typewriter) => {
              typewriter
                // First "Revision"
                .typeString(
                  "<span style='font-size:50px'>Re</span><span style='color: #800000; font-size:50px'>Vision</span>"
                )
                .pauseFor(3000)
                .deleteAll()

                // Tagline
                .typeString("The smart ")
                .typeString("<span style='color: #800000;'>whiteboard</span>")
                .typeString(" that you always ")
                .typeString("<span style='color: #800000;'>needed</span>")
                .typeString(".")
                .pauseFor(2000)
                .deleteAll()

                // Final "Revision"
                .typeString(
                  "<span style='font-size:50px'>Re</span><span style='color: #800000; font-size:50px'>Vision</span>"
                )
                .start();
            }}
          />
        </div>

        <p className="text-lg text-gray-700 leading-relaxed">
          An AI-powered tutor that turns scanned questions into interactive
          practice with <b>real-time feedback</b>.
        </p>

        <button
          onClick={handleStartClick}
          className="px-6 py-3 text-lg bg-[#800000] text-white rounded-lg transition ease-in-out duration-300 transform hover:bg-[#600000] hover:scale-105"
        >
          Start Now
        </button>
      </div>
    </div>
  );
};

export default Landing;
