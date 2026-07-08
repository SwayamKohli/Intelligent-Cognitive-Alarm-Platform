import { useEffect, useRef } from "react";
import "./AlarmModal.css";
import alarmSound from "../assets/alarm-sound.mp3";

function AlarmModal() {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = true;

      audioRef.current.play().catch((error) => {
        console.log("Autoplay blocked by browser:", error);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  return (
    <div className="alarm-overlay">
      <audio ref={audioRef} src={alarmSound} preload="auto" />

      <div className="alarm-box">
        <h1>🚨 Alarm Ringing!</h1>

        <p>Solve this math problem to dismiss the alarm.</p>

        <div className="question-box">
          <h2>12 + 8 = ?</h2>
        </div>

        <input
          type="number"
          placeholder="Enter your answer"
          className="answer-input"
        />

        <div className="button-group">
          <button className="submit-btn">
            Submit
          </button>

          <button className="snooze-btn">
            Snooze (5 mins)
          </button>
        </div>
      </div>
    </div>
  );
}

export default AlarmModal;
