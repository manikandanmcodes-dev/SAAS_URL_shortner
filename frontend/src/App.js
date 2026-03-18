import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [urls, setUrls] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customCode, setCustomCode] = useState("");
  const [totalClicks, setTotalClicks] = useState(0);
  const [totalLinks, setTotalLinks] = useState(0);

  // 🔐 LOGIN
  const handleLogin = async () => {
    const response = await fetch("http://127.0.0.1:8000/token/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (data.access) {
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      setIsLoggedIn(true);
      fetchUrls();
    } else {
      alert("Login failed ❌");
    }
  };

  // 📊 FETCH URLS
  const fetchUrls = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/my-urls/", {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("access"),
        },
      });

      const data = await response.json();

      if (data.urls) {
        setUrls(data.urls);
        setTotalClicks(data.total_clicks);
        setTotalLinks(data.total_links);
      } else {
        setUrls([]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setUrls([]);
    }
  };

  // 🔗 SHORTEN
  const handleShorten = async () => {
    const token = localStorage.getItem("access");

    if (!token) {
      alert("Please login first ❌");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/shorten/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          url,
          custom_code: customCode,
        }),
      });

      const data = await response.json();

      if (data.short_url) {
        setShortUrl(data.short_url);
        setUrl("");
        setCustomCode("");
        fetchUrls();
      } else {
        alert(JSON.stringify(data));
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // 🔄 AUTO LOGIN
  useEffect(() => {
    const token = localStorage.getItem("access");
    if (token) {
      setIsLoggedIn(true);
      fetchUrls();
    }
  }, []);

  return (
    <div className="container">
      <h1>🚀 URL Shortener SaaS</h1>

      {/* 🔐 LOGIN */}
      {!isLoggedIn && (
        <div className="card">
          <h3>Login</h3>

          <input
            className="input"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="button" onClick={handleLogin}>
            Login
          </button>
        </div>
      )}

      {/* 🔗 MAIN APP */}
      {isLoggedIn && (
        <>
          {/* 📊 ANALYTICS */}
          <div className="analytics">
            <div className="analytics-box">
              <p>Total Links</p>
              <h2>{totalLinks}</h2>
            </div>

            <div className="analytics-box">
              <p>Total Clicks</p>
              <h2>{totalClicks}</h2>
            </div>
          </div>

          {/* 🔗 INPUT */}
          <div className="card">
            <input
              className="input"
              placeholder="Enter URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />

            <input
              className="input"
              placeholder="Custom alias (optional)"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
            />

            <button className="button" onClick={handleShorten}>
              Shorten
            </button>

            {shortUrl && (
              <p style={{ marginTop: "10px" }}>
                🔗 <a href={shortUrl}>{shortUrl}</a>
              </p>
            )}
          </div>

          {/* 📊 LINKS */}
          {urls.map((item, index) => (
            <div key={index} className="card link-card">
              <div>
                <p>{item.original_url}</p>
                <p>http://127.0.0.1:8000/{item.short_code}</p>
                <p>Clicks: {item.clicks}</p>
              </div>

              <button
                className="copy-btn"
                onClick={() =>
                  navigator.clipboard.writeText(
                    `http://127.0.0.1:8000/${item.short_code}`
                  )
                }
              >
                Copy
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default App;