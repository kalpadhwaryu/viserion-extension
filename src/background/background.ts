import { openDB } from "idb";

async function storeAccessToken(accessToken: string) {
  try {
    const db = await openDB("GitHub", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("GitHubStore")) {
          db.createObjectStore("GitHubStore");
        }
      },
    });

    const tx = db.transaction("GitHubStore", "readwrite");
    const store = tx.objectStore("GitHubStore");
    await store.put(accessToken, "access_token");

    await tx.done;
    console.log("Access token stored in IndexDB.");
  } catch (error) {
    console.error("Error storing access token:", error);
  }
}

async function storeRepos(repos) {
  try {
    const db = await openDB("GitHub", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("GitHubStore")) {
          db.createObjectStore("GitHubStore", { keyPath: "id" });
        }
      },
    });

    const tx = db.transaction("GitHubStore", "readwrite");
    const store = tx.objectStore("GitHubStore");

    for (const obj of repos) {
      await store.put(obj, obj.id);
    }

    await tx.done;
    console.log("Repos stored in IndexedDB.");
  } catch (error) {
    console.error("Error storing repos in IndexedDB:", error);
  }
}

async function exchangeAuthorizationCodeForToken(
  authorizationCode: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `http://localhost:8080/github/getAccessToken?code=${authorizationCode}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );

    const data = await response.json();
    console.log(data);
    return data.access_token;
  } catch (error) {
    console.error("Error exchanging authorization code:", error);
    return null;
  }
}

async function getGitHubReposFollowers(
  entity: string,
  accessToken: string
): Promise<any> {
  try {
    const response = await fetch(`http://localhost:8080/github/${entity}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + accessToken,
      },
    });

    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error("Error exchanging authorization code:", error);
    return null;
  }
}

// Handle the callback URL from the AuthApp
chrome.webNavigation.onCompleted.addListener(({ url }) => {
  if (url.startsWith("http://localhost:8080")) {
    const params = new URLSearchParams(new URL(url).search);
    const authorizationCode = params.get("code");
    console.log(authorizationCode);

    if (authorizationCode) {
      exchangeAuthorizationCodeForToken(authorizationCode)
        .then((accessToken) => {
          if (accessToken) {
            storeAccessToken(accessToken);
            getGitHubReposFollowers("repos", accessToken).then((data) => {
              storeRepos(data);
            });
          }
        })
        .catch((error) => {
          console.error("Error getting access token:", error);
        });
    }
  }
});

// Main function to handle the extension's background activities
// async function main() {
//   // Your background logic here

//   // Example: Make API calls using the stored access token
//   const accessToken = await retrieveStoredAccessToken();
//   if (accessToken) {
//     const apiData = await makeApiCall(accessToken);
//     console.log("API data:", apiData);
//   }
// }

// // Listen for the extension installation or update event
// chrome.runtime.onInstalled.addListener(() => {
//   main();
// });

// // Listen for messages from the popup or content script
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.type === "some_message_type") {
//     // Handle the message from the popup or content script
//   }
// });
