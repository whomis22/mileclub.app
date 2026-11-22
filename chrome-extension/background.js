// The page the Mile Club button opens.
// For now this is the website preview. When the website is online,
// change this one line to the real address, for example "https://mileclub.co".
const WEBSITE = "https://claude.ai/artifact/JdDckhobLzemqhv6HfDzyX";

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: WEBSITE });
});
