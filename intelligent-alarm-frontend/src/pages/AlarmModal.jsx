import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import api from "../lib/api";
import "./AlarmModal.css";
import alarmSound from "../assets/alarm-sound.mp3";

function AlarmModal({ challenge: initialChallenge, alarmId, onClose }) {
  const audioRef = useRef(null);

  const [challenge, setChallenge] = useState(initialChallenge);
  const [answer, setAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [showSequence, setShowSequence] = useState(true);
  const [shake, setShake] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [snoozing, setSnoozing] = useState(false);
  const [snoozeBlocked, setSnoozeBlocked] = useState(false);
  const [loadingNext, setLoadingNext] = useState(false);

  const progress = challenge?.streak_state
    ? (challenge.streak_state.current / challenge.streak_state.target) * 100
    : 0;

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.play().catch((err) => console.log("Autoplay blocked:", err));
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
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    if (challenge?.challenge_type !== "memory") {
      setShowSequence(false);
      return;
    }
    setShowSequence(true);
    const timer = setTimeout(() => {
      setShowSequence(false);
    }, challenge?.content?.display_time_ms || 3000);
    return () => clearTimeout(timer);
  }, [challenge]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const fetchNextChallenge = async () => {
    setLoadingNext(true);
    try {
      const { data } = await api.get(
        `/challenges/next?alarm_id=${alarmId}&challenge_type=random`
      );
      setChallenge(data);
      setAnswer("");
    } catch (error) {
      console.log(error);
      setFeedback({ type: "error", message: "Couldn't load the next challenge." });
    } finally {
      setLoadingNext(false);
    }
  };

  const handleSubmit = async () => {
    if (!answer.trim() || submitting) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      const { data } = await api.post("/challenges/verify", {
        alarm_id: alarmId,
        answer,
      });

      if (!data.success) {
        triggerShake();
        setFeedback({ type: "error", message: "Not quite — try again." });
        setAnswer("");
        setSubmitting(false);
        return;
      }

      if (data.dismiss_alarm) {
        setFeedback({ type: "success", message: "Alarm dismissed. Great job!" });
        stopAudio();
        setTimeout(() => onClose(), 900);
        return;
      }

      setFeedback({
        type: "success",
        message: `Correct! Streak ${data.current_streak}/${data.target_streak}`,
      });
      setSubmitting(false);
      await fetchNextChallenge();
    } catch (error) {
      console.log(error);
      setFeedback({ type: "error", message: "Server error — please try again." });
      setSubmitting(false);
    }
  };

  const handleSnooze = async () => {
    if (snoozing) return;
    setSnoozing(true);
    setFeedback(null);

    try {
      await api.post("/alarms/snooze", { alarm_id: alarmId });
      stopAudio();
      onClose();
    } catch (error) {
      console.log(error);
      setSnoozeBlocked(true);
      setFeedback({ type: "error", message: "Snooze limit reached — solve the challenge instead." });
      setSnoozing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  const renderChallenge = () => {
    switch (challenge?.challenge_type) {
      case "math":
        return <h2 className="challenge-prompt">{challenge?.content?.prompt}</h2>;

      case "memory":
        return (
          <div>
            <h2 className="challenge-prompt">{challenge?.content?.prompt}</h2>
            {showSequence ? (
              <h1 className="challenge-sequence">
                {challenge?.content?.sequence?.join(" ")}
              </h1>
            ) : (
              <h1 className="challenge-sequence dim">Enter the sequence</h1>
            )}
          </div>
        );

      case "quiz":
      case "logic":
        return (
          <div>
            <h2 className="challenge-prompt">{challenge?.content?.prompt}</h2>
            <div className="option-list">
              {challenge?.content?.options?.map((option, index) => (
                <p key={index} className="option-item">
                  <span className="option-index">{index + 1}</span> {option}
                </p>
              ))}
            </div>
          </div>
        );

      case "pattern":
        return <h2 className="challenge-prompt">{challenge?.content?.prompt}</h2>;

      case "word_scramble":
        return (
          <div>
            <h2 className="challenge-prompt">{challenge?.content?.prompt}</h2>
            <h1 className="scrambled-word">{challenge?.content?.scrambled_word}</h1>
          </div>
        );

      default:
        return <h2 className="challenge-prompt">{challenge?.content?.prompt}</h2>;
    }
  };

  return (
    <motion.div
      className="alarm-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="alarm-wave-bg" aria-hidden="true">
        <div className="pulse-ring ring-1" />
        <div className="pulse-ring ring-2" />
        <div className="pulse-ring ring-3" />
      </div>

      <audio ref={audioRef} src={alarmSound} preload="auto" />

      <motion.div
        className={`glass-card alarm-box ${shake ? "shake" : ""}`}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="alarm-header">
          <motion.span
            className="alarm-icon"
            animate={{ rotate: [0, -12, 12, -8, 8, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1 }}
          >
            ⏰
          </motion.span>
          <h1>Alarm Ringing</h1>
        </div>

        <div className={`timer-pill ${timeLeft <= 10 ? "urgent" : ""}`}>
          {timeLeft}s
        </div>

        <p className="alarm-instruction">Solve the challenge to stop the alarm.</p>

        <div className="progress-container">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <p className="streak-label">
          {challenge?.streak_state?.current ?? 0} / {challenge?.streak_state?.target ?? "-"} challenges completed
        </p>

        <motion.div
          className="question-box"
          key={challenge?.content?.prompt || challenge?.content?.scrambled_word}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: loadingNext ? 0.4 : 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderChallenge()}
        </motion.div>

        <input
          type="text"
          placeholder="Enter your answer"
          className="answer-input"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loadingNext}
          autoFocus
        />

        {feedback && (
          <motion.p
            className={`alarm-feedback ${feedback.type}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {feedback.message}
          </motion.p>
        )}

        <div className="button-group">
          <motion.button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={submitting || loadingNext}
            whileTap={{ scale: 0.96 }}
          >
            {submitting ? "Checking…" : loadingNext ? "Loading…" : "Submit"}
          </motion.button>

          <motion.button
            className="snooze-btn"
            onClick={handleSnooze}
            disabled={snoozing || snoozeBlocked}
            whileTap={{ scale: 0.96 }}
          >
            {snoozing ? "…" : "Snooze"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default AlarmModal;