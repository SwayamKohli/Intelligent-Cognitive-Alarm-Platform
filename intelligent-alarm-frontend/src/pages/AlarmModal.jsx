import { useEffect, useRef, useState } from "react";
import "./AlarmModal.css";
import alarmSound from "../assets/alarm-sound.mp3";

function AlarmModal({ alarmId, alarmLabel, onDismiss, onSnooze }) {
  const audioRef = useRef(null);
  const [challenge, setChallenge] = useState(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Feedback states
  const [feedback, setFeedback] = useState({ text: "", type: "" }); // type: "success" | "error" | ""
  
  // Streak state
  const [streak, setStreak] = useState({ current: 0, target: 1 });
  
  // Memory engine states
  const [isMemoryRevealed, setIsMemoryRevealed] = useState(true);
  const [memoryTimeLeft, setMemoryTimeLeft] = useState(0);

  // Play alarm sound loop
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.play().catch((err) => {
        console.log("Autoplay blocked by browser:", err);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  // Fetch the next challenge
  const fetchChallenge = async (isRetry = false) => {
    setLoading(true);
    setError(null);
    if (!isRetry) {
      setAnswer("");
    }
    
    const token = localStorage.getItem("token");
    if (!token) {
      setError("User session expired. Please login again.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/challenges/next?alarm_id=${alarmId}&challenge_type=random`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setChallenge(data);
        setStreak({
          current: data.streak_state?.current ?? 0,
          target: data.streak_state?.target ?? 1,
        });

        // Initialize Memory Engine countdown if applicable
        if (data.challenge_type === "memory" && data.content?.sequence) {
          setIsMemoryRevealed(true);
          const displayTime = data.content.display_time_ms || 3000;
          setMemoryTimeLeft(displayTime / 1000);
        }
      } else {
        const errData = await response.json();
        setError(errData.detail || "Failed to load challenge.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to the backend server.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch challenge on mount
  useEffect(() => {
    if (alarmId) {
      fetchChallenge();
    }
  }, [alarmId]);

  // Handle Memory sequence countdown timer
  useEffect(() => {
    if (
      challenge?.challenge_type === "memory" &&
      isMemoryRevealed &&
      memoryTimeLeft > 0
    ) {
      const timer = setTimeout(() => {
        setMemoryTimeLeft((prev) => {
          if (prev <= 1) {
            setIsMemoryRevealed(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [challenge, isMemoryRevealed, memoryTimeLeft]);

  // Submit Answer
  const handleSubmit = async (e, forcedAnswer = null) => {
    if (e) e.preventDefault();
    
    const finalAnswer = forcedAnswer !== null ? forcedAnswer : answer;
    if (!finalAnswer || finalAnswer.toString().trim() === "") return;

    setSubmitting(true);
    setFeedback({ text: "", type: "" });
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://127.0.0.1:8000/challenges/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          alarm_id: alarmId,
          answer: finalAnswer.toString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          setStreak({
            current: data.current_streak,
            target: data.target_streak,
          });

          if (data.dismiss_alarm) {
            setFeedback({ text: "Success! Alarm dismissed.", type: "success" });
            if (audioRef.current) {
              audioRef.current.pause();
            }
            setTimeout(() => {
              onDismiss();
            }, 1000);
          } else {
            setFeedback({ text: "Correct! Keep going!", type: "success" });
            setTimeout(() => {
              setFeedback({ text: "", type: "" });
              fetchChallenge();
            }, 1200);
          }
        } else {
          setFeedback({
            text: "Incorrect answer. Streak reset to 0!",
            type: "error",
          });
          setStreak({
            current: 0,
            target: data.target_streak,
          });
          setTimeout(() => {
            setFeedback({ text: "", type: "" });
            fetchChallenge();
          }, 1500);
        }
      } else {
        setFeedback({ text: "Failed to verify. Please try again.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ text: "Network error during verification.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  // Snooze Alarm
  const handleSnooze = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://127.0.0.1:8000/alarms/snooze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          alarm_id: alarmId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Alarm snoozed! Snooze count: ${data.active_snooze_count}/${data.snooze_limit}`);
        if (audioRef.current) {
          audioRef.current.pause();
        }
        onSnooze();
      } else {
        const errData = await response.json();
        alert(errData.detail || "Snooze failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error while trying to snooze.");
    }
  };

  // Render Challenge Body dynamically based on challenge_type
  const renderChallengeBody = () => {
    if (loading) {
      return (
        <div className="loader-container">
          <div className="pulse-loader"></div>
          <p>Loading cognitive challenge...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-container">
          <p className="error-text">❌ {error}</p>
          <button className="retry-btn" onClick={() => fetchChallenge(true)}>
            Retry Loading
          </button>
        </div>
      );
    }

    if (!challenge) return null;

    const { challenge_type, content } = challenge;

    switch (challenge_type) {
      case "math":
      case "pattern":
      case "riddle":
        return (
          <form onSubmit={handleSubmit} className="challenge-form">
            <p className="challenge-description">
              {challenge_type === "math" && "Solve this math problem:"}
              {challenge_type === "pattern" && "Find the missing number in the sequence:"}
              {challenge_type === "riddle" && "Solve this riddle:"}
            </p>
            <div className="question-display">{content.prompt}</div>
            <input
              type="text"
              placeholder="Enter your answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="answer-input"
              disabled={submitting}
              autoFocus
              required
            />
            <button type="submit" className="submit-btn" disabled={submitting || !answer}>
              {submitting ? "Checking..." : "Submit Answer"}
            </button>
          </form>
        );

      case "word_scramble":
        return (
          <form onSubmit={handleSubmit} className="challenge-form">
            <p className="challenge-description">Unscramble the letters to form the correct word:</p>
            <div className="scrambled-letters-container">
              {content.scrambled_word.split("").map((letter, idx) => (
                <span key={idx} className="scrambled-letter-card">
                  {letter.toUpperCase()}
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Enter unscrambled word"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="answer-input text-ans-input"
              disabled={submitting}
              autoFocus
              required
            />
            <button type="submit" className="submit-btn" disabled={submitting || !answer}>
              {submitting ? "Checking..." : "Submit Answer"}
            </button>
          </form>
        );

      case "memory":
        return (
          <div className="memory-challenge-container">
            {isMemoryRevealed ? (
              <div className="memory-reveal-box">
                <p className="challenge-description">Memorize the sequence before time runs out:</p>
                <div className="sequence-display">
                  {content.sequence.map((char, idx) => (
                    <span key={idx} className="sequence-char-card">
                      {char}
                    </span>
                  ))}
                </div>
                <div className="timer-bar-container">
                  <div 
                    className="timer-bar-fill" 
                    style={{ 
                      width: `${(memoryTimeLeft / ((content.display_time_ms || 3000) / 1000)) * 100}%` 
                    }}
                  ></div>
                </div>
                <p className="timer-text">Time remaining: {memoryTimeLeft}s</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="challenge-form">
                <p className="challenge-description">Enter the sequence you just saw (case-insensitive):</p>
                <input
                  type="text"
                  placeholder="Enter memorized sequence"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="answer-input uppercase-input"
                  disabled={submitting}
                  autoFocus
                  required
                />
                <button type="submit" className="submit-btn" disabled={submitting || !answer}>
                  {submitting ? "Checking..." : "Submit Answer"}
                </button>
              </form>
            )}
          </div>
        );

      case "logic":
      case "quiz":
        return (
          <div className="options-challenge-container">
            <p className="challenge-description">
              {challenge_type === "logic" && "Read carefully and solve the logic puzzle:"}
              {challenge_type === "quiz" && "Select the correct answer to the question:"}
            </p>
            <div className="question-display logic-question">{content.prompt}</div>
            <div className="options-grid">
              {content.options?.map((option, idx) => (
                <button
                  key={idx}
                  onClick={(e) => handleSubmit(e, option)}
                  disabled={submitting}
                  className="option-button"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return <p>Unknown challenge type: {challenge_type}</p>;
    }
  };

  // Compute progress bar percentage
  const streakPercent = Math.min(100, (streak.current / streak.target) * 100);

  return (
    <div className="alarm-overlay">
      <audio ref={audioRef} src={alarmSound} preload="auto" />

      <div className="alarm-box glassmorphism">
        <div className="alarm-header">
          <span className="ringing-bell">🔔</span>
          <h2>Alarm Ringing!</h2>
          <span className="alarm-label">{alarmLabel || "Morning Wake Up"}</span>
        </div>

        {/* Multi-step streak progress bar */}
        <div className="streak-progress-section">
          <div className="streak-labels">
            <span>Verification Streak</span>
            <span className="streak-numbers">
              {streak.current} / {streak.target}
            </span>
          </div>
          <div className="progress-track">
            <div 
              className="progress-fill" 
              style={{ width: `${streakPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Feedback Message */}
        {feedback.text && (
          <div className={`feedback-alert ${feedback.type}`}>
            {feedback.type === "success" ? "✨" : "⚠️"} {feedback.text}
          </div>
        )}

        {/* Main challenge section */}
        <div className="challenge-section">{renderChallengeBody()}</div>

        {/* Global actions */}
        <div className="alarm-actions">
          <button 
            type="button" 
            className="snooze-btn" 
            onClick={handleSnooze}
            disabled={loading || submitting}
          >
            Snooze Alarm
          </button>
        </div>
      </div>
    </div>
  );
}

export default AlarmModal;