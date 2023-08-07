import React from "react";

const loginWithGitHub = () => {
  chrome.tabs.create({
    url:
      "https://github.com/login/oauth/authorize?client_id=" +
      process.env.REACT_APP_GITHUB_CLIENT_ID,
  });
};

const App = () => {
  return (
    <div>
      <button onClick={loginWithGitHub}>Login With GitHub</button>
    </div>
  );
};

export default App;
