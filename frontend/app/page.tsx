"use client";

import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import "./globals.css";

const Typewriter = dynamic(() => import("typewriter-effect"), { ssr: false });

const Home = () => {
  const router = useRouter();

  const handleStartClick = () => {
    router.push("/upload");
  };

  return (
    <div className="landing-container">
      <div className="text-content">
        <div className="typewriter-text">
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

                // Final "Revision" → stays forever
                .typeString(
                  "<span style='font-size:50px'>Re</span><span style='color: #800000; font-size:50px'>Vision</span>"
                )
                .start();
            }}
          />
        </div>

        <p className="description-text">
          An AI-powered tutor that turns scanned questions into interactive
          practice with <b>real-time feedback</b>.
        </p>

        <button className="start-button" onClick={handleStartClick}>
          Start Now
        </button>
      </div>
    </div>
  );
};

export default Home;
