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

// Handle the callback URL from the AuthApp
chrome.webNavigation.onCompleted.addListener(({ tabId, url }) => {
  if (url.startsWith("http://localhost:8080")) {
    const params = new URLSearchParams(new URL(url).search);
    const authorizationCode = params.get("code");
    console.log(authorizationCode);

    if (authorizationCode) {
      exchangeAuthorizationCodeForToken(authorizationCode)
        .then((accessToken) => {
          if (accessToken) {
            // Store the accessToken securely for later use (e.g., using chrome.storage)
            console.log("Access token obtained:", accessToken);
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
