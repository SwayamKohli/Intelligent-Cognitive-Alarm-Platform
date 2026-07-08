import { useEffect, useRef, useState } from "react";
import "./AlarmModal.css";
import alarmSound from "../assets/alarm-sound.mp3";

function AlarmModal({
  challenge,
  alarmId,
  onClose,
}) {
  const audioRef = useRef(null);

  const [answer, setAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [showSequence, setShowSequence] = useState(true);
  const progress =
  challenge?.streak_state
    ? (challenge.streak_state.current / challenge.streak_state.target) * 100
    : 0;

  useEffect(() => {
  if (audioRef.current) {
    audioRef.current.loop = true;

    audioRef.current.play().catch((err) => {
      console.log("Autoplay blocked:", err);
    });
  }

  return () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };
}, []);

useEffect(() => {
  if (timeLeft <= 0) return;

  const timer = setInterval(() => {
    setTimeLeft((prev) => prev - 1);
  }, 1000);

  return () => clearInterval(timer);
}, [timeLeft]);
useEffect(() => {
  if (challenge?.challenge_type !== "memory") return;

  const timer = setTimeout(() => {
    setShowSequence(false);
  }, challenge?.content?.display_time_ms || 3000);

  return () => clearTimeout(timer);
}, [challenge]);
  const handleSubmit = async () => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/challenges/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            alarm_id: alarmId,
            answer: answer,
          }),
        }
      );

      if (!response.ok) {
        alert("Wrong answer!");
        return;
      }

      alert("Challenge Completed!");

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      onClose();
    } catch (error) {
      console.log(error);
      alert("Backend Error");
    }
  };
  const handleSnooze = async () => {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(
      "http://127.0.0.1:8000/alarms/snooze",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          alarm_id: alarmId,
        }),
      }
    );

    if (!response.ok) {
      alert("Snooze failed.");
      return;
    }

    alert("Alarm Snoozed!");

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    onClose();

  } catch (error) {
    console.log(error);
    alert("Backend Error");
  }
};
const renderChallenge = () => {
  switch (challenge?.challenge_type) {

    case "math":
      return (
        <h2>{challenge?.content?.prompt}</h2>
      );

    case "memory":
      return (
        <div>
          <h2>{challenge?.content?.prompt}</h2>

          {showSequence ? (
            <h1>{challenge?.content?.sequence?.join(" ")}</h1>
          ) : (
            <h1>Enter the sequence</h1>
          )}
        </div>
      );

    case "quiz":
      return (
        <div>
          <h2>{challenge?.content?.prompt}</h2>

          {challenge?.content?.options?.map((option, index) => (
            <p key={index}>
              {index + 1}. {option}
            </p>
          ))}
        </div>
      );

    case "pattern":
      return (
        <h2>{challenge?.content?.prompt}</h2>
      );

    case "logic":
      return (
        <div>
          <h2>{challenge?.content?.prompt}</h2>

          {challenge?.content?.options?.map((option, index) => (
            <p key={index}>
              {index + 1}. {option}
            </p>
          ))}
        </div>
      );

    default:
      return (
        <h2>{challenge?.content?.prompt}</h2>
      );
  }
};

  return (
    <div className="alarm-overlay">
      <audio
        ref={audioRef}
        src={alarmSound}
        preload="auto"
      />

      <div className="alarm-box">
        <h1>🚨 Alarm Ringing!</h1>
        <h2>⏳ {timeLeft}s</h2>

        <p>Solve the challenge to stop the alarm.</p>
        <div className="progress-container">
  <div
    className="progress-fill"
    style={{ width: `${progress}%` }}
  ></div>
</div>

<p>
  {challenge?.streak_state?.current} /{" "}
  {challenge?.streak_state?.target} Challenges Completed
</p>

        <div className="question-box">
           {renderChallenge()}
        </div>

        <input
          type="text"
          placeholder="Enter your answer"
          className="answer-input"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />

        <div className="button-group">
          <button
            className="submit-btn"
            onClick={handleSubmit}
          >
            Submit
          </button>

          <button
            className="snooze-btn"
            onClick={handleSnooze}
          >
            Snooze
          </button>
        </div>
      </div>
    </div>
  );
}

export default AlarmModal;