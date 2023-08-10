import { openDB } from "idb";

async function storeAccessToken(accessToken: string) {
  try {
    const db = await openDB("GitHubAccessToken", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("AccessTokenStore")) {
          db.createObjectStore("AccessTokenStore");
        }
      },
    });

    const tx = db.transaction("AccessTokenStore", "readwrite");
    const store = tx.objectStore("AccessTokenStore");
    await store.put(accessToken, "access_token");

    await tx.done;
    console.log("Access token stored in IndexDB.");
  } catch (error) {
    console.error("Error storing access token:", error);
  }
}

async function storeGitHubData(databaseName, storeName, data) {
  try {
    const db = await openDB(databaseName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: "id" });
        }
      },
    });

    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    for (const obj of data) {
      await store.put(obj);
    }

    await tx.done;
    console.log(`${storeName} stored in IndexedDB.`);
  } catch (error) {
    console.error(`Error storing ${storeName} in IndexedDB:`, error);
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
    return data;
  } catch (error) {
    console.error("Error exchanging authorization code:", error);
    return null;
  }
}

chrome.webNavigation.onCompleted.addListener(({ url }) => {
  if (url.startsWith("http://localhost:8080")) {
    const params = new URLSearchParams(new URL(url).search);
    const authorizationCode = params.get("code");

    if (authorizationCode) {
      exchangeAuthorizationCodeForToken(authorizationCode)
        .then((accessToken) => {
          if (accessToken) {
            storeAccessToken(accessToken);

            chrome.runtime.onMessage.addListener(
              (message, sender, sendResponse) => {
                console.log(message);

                // Send the response back to the popup
              }
            );
            // getGitHubReposFollowers("repos", accessToken).then((data) => {
            //   // storeGitHubData("GithHubFollowers", "FollowersStore", data);
            //   storeGitHubData("GithHubRepos", "ReposStore", data);
            // });
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
