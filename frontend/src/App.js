import { useState, useEffect } from "react";
import "./App.css";

const BASE_URL = "https://saas-url-shortner-backend.onrender.com";

async function apiFetch(url, options = {}) {
  let access = localStorage.getItem("access");
  const refresh = localStorage.getItem("refresh");
  // attach token
  let headers = { "Content-Type": "application/json", ...options.headers };
  if (access) headers.Authorization = "Bearer " + access;
  let response = await fetch(`${BASE_URL}${url}`, { ...options, headers });
  if (response.status === 401 && refresh) {
    // try refresh
    const refreshResponse = await fetch(`${BASE_URL}/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    const refreshData = await refreshResponse.json();
    if (refreshData.access) {
      localStorage.setItem("access", refreshData.access);
      // retry original request
      headers.Authorization = "Bearer " + refreshData.access;
      response = await fetch(`${BASE_URL}${url}`, { ...options, headers });
    } else {
      localStorage.clear();
      throw new Error("Session expired. Please login again.");
    }
  }
  return response;
}

async function fetchWithRetry(url, options, retries = 3, delay = 3000) {
  try {
    const res = await apiFetch(url, options);
    if (!res.ok && retries > 0) {
      await new Promise(r => setTimeout(r, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    return res;
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(r => setTimeout(r, delay));
    return fetchWithRetry(url, options, retries - 1, delay * 2);
  }
}


function App() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [urls, setUrls] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [customCode, setCustomCode] = useState("");
  const [totalClicks, setTotalClicks] = useState(0);
  const [totalLinks, setTotalLinks] = useState(0);

  // 🔐 LOGIN
  const handleLogin = async () => {
    try {
      const response = await fetch(`${BASE_URL}/token/`, {
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
    } catch (error) {
      console.error(error);
      alert("Server error ❌");
    }
  };

  // 🆕 SIGNUP
  const handleSignup = async () => {
    try {
      const response = await fetch(`${BASE_URL}/signup/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (data.message) {
        alert("Signup successful ✅ Now login");
        setIsSignup(false);
      } else {
        alert(JSON.stringify(data));
      }
    } catch (error) {
      console.error(error);
      alert("Signup error ❌");
    }
  };

  // 📊 FETCH URLS
  const fetchUrls = async () => {
    try {
      const response = await apiFetch("/my-urls/");

      const data = await response.json();

      if (data.urls) {
        setUrls(data.urls);
        setTotalClicks(data.total_clicks);
        setTotalLinks(data.total_links);
        setIsLoggedIn(true); 
      } else {
        setUrls([]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  // 🔗 SHORTEN
  const handleShorten = async () => {
    const token = localStorage.getItem("access");

    if (!token) {
      alert("Please login first ❌");
      setIsLoggedIn(false);
      return;
    }

    try {
      const response = await apiFetch("/shorten/", {
        method: "POST",
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
    const init = async () => {
      try {
        // 🔥 wake up Render backend
        await fetchWithRetry("/health/");

        const token = localStorage.getItem("access");
        if (token) {
          await fetchUrls();
        }
      } catch (err) {
        console.error("Startup error:", err);
      }
    };

    init();
  }, []);

  return (
    <div className="container">
      <h1>🚀 URL Shortener SaaS</h1>

      {/* 🔐 LOGIN / SIGNUP */}
      {!isLoggedIn && (
        <div className="card">
          <h3>{isSignup ? "Signup" : "Login"}</h3>

          <input
            className="input"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          {isSignup && (
            <input
              className="input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}

          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            className="button"
            onClick={isSignup ? handleSignup : handleLogin}
          >
            {isSignup ? "Signup" : "Login"}
          </button>

          <p
            style={{ marginTop: "10px", cursor: "pointer" }}
            onClick={() => setIsSignup(!isSignup)}
          >
            {isSignup
              ? "Already have an account? Login"
              : "Don't have an account? Signup"}
          </p>
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
                <p>{BASE_URL}/{item.short_code}</p>
                <p>Clicks: {item.clicks}</p>
              </div>

              <button
                className="copy-btn"
                onClick={() =>
                  navigator.clipboard.writeText(
                    `${BASE_URL}/${item.short_code}`
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