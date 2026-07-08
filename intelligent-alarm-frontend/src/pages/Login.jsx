import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (email === "" || password === "") {
      alert("Please enter email and password");
      return;
    }

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const response = await fetch(
        "http://127.0.0.1:8000/users/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();

        console.log("Login Response:", data);

        localStorage.setItem("token", data.access_token);

        console.log("Saved Token:", localStorage.getItem("token"));

        alert("Login Successful!");

        navigate("/dashboard");
      } else {
        const error = await response.text();
        console.log("Login Error:", error);
        alert("Invalid Email or Password");
      }
    } catch (error) {
      console.log("Network Error:", error);
      alert("Backend not running. Team lead will test the integration.");
    }
  };

  return (
    <div className="login-container">
      <h1>Intelligent Cognitive Alarm Platform</h1>

      <div className="login-form">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleLogin}>Login</button>

        <p className="register-text">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;