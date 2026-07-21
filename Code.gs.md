/**
 * Gangdong Eoullim Welfare Center Post Counter V2 (Google Apps Script)
 * 
 * Target Google Sheet ID: 11T84ToYo5kIaTPgNj9i_Xv8q1Q8Ef7AAGQTypo14YjY
 * The spreadsheet should have a sheet named "Data" with headers in Row 1:
 * [Date, Website, NaverBlog, KakaoTalk, YouTube]
 * Format for Date column must be 'yyyy-MM-dd' (e.g. 2025-01-01)
 */

const TARGET_SHEET_ID = '11T84ToYo5kIaTPgNj9i_Xv8q1Q8Ef7AAGQTypo14YjY';
const SHEET_NAME = 'Data';
const YOUTUBE_CHANNEL_ID = 'UCgAO5d2OyVURs3e2F6tphVw';
const NAVER_BLOG_ID = 'gds0741';
const KAKAO_CHANNEL_ID = '_ZWFZn';

const WEBSITE_URLS = [
  'https://gde.or.kr/notice',
  'https://gde.or.kr/program',
  'https://gde.or.kr/information',
  'https://gde.or.kr/gallery',
  'https://gde.or.kr/video',
  'https://gde.or.kr/webzine',
  'https://gde.or.kr/media'
];

/**
 * Main function to fetch counts and save to the spreadsheet.
 * Set up a Time-driven trigger to run this daily (e.g., at 23:30).
 */
function fetchAndSaveDailyCounts() {
  const dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  
  const websiteCount = getWebsiteCounts();
  const naverCount = getNaverBlogCount();
  const kakaoCount = getKakaoTalkCount();
  const youtubeCount = getYouTubeCount();
  
  const ss = SpreadsheetApp.openById(TARGET_SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    Logger.log("Sheet named 'Data' not found.");
    return;
  }
  
  // Append new row: [Date, Website, NaverBlog, KakaoTalk, YouTube]
  sheet.appendRow([dateStr, websiteCount, naverCount, kakaoCount, youtubeCount]);
}

/**
 * API Endpoint for the frontend to retrieve all historical data.
 */
function doGet(e) {
  let sheet;
  try {
    const ss = SpreadsheetApp.openById(TARGET_SHEET_ID);
    sheet = ss.getSheetByName(SHEET_NAME);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({error: "Cannot open target sheet."}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({error: "Sheet not found"}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  const rows = values.slice(1); // Skip header row
  
  let dailyData = {}; 
  
  rows.forEach(row => {
    let dateVal = row[0];
    if (!dateVal) return;
    
    // Attempt to parse date securely
    if (!(dateVal instanceof Date)) {
      dateVal = new Date(dateVal);
    }
    if (isNaN(dateVal.getTime())) return;
    
    const website = Number(row[1]) || 0;
    const naver = Number(row[2]) || 0;
    const kakao = Number(row[3]) || 0;
    const youtube = Number(row[4]) || 0;
    
    const dateStr = Utilities.formatDate(dateVal, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    
    // We store all daily history so the frontend can query any date, 
    // compare to the day before, and build the 7-day trend chart.
    dailyData[dateStr] = { website, naver, kakao, youtube };
  });
  
  const payload = {
    history: dailyData,
    lastUpdated: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss')
  };
  
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*");
}

// ================= Scraping Helper Functions =================

function getWebsiteCounts() {
  let totalCount = 0;
  const todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  WEBSITE_URLS.forEach(url => {
    try {
      const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      const html = response.getContentText();
      const dateRegex = new RegExp(todayStr, 'g');
      const matches = html.match(dateRegex);
      if (matches) totalCount += matches.length;
    } catch (e) {
      Logger.log("Error fetching " + url + ": " + e.message);
    }
  });
  return totalCount;
}

function getNaverBlogCount() {
  try {
    const rssUrl = `https://rss.blog.naver.com/${NAVER_BLOG_ID}.xml`;
    const response = UrlFetchApp.fetch(rssUrl, { muteHttpExceptions: true });
    const xml = response.getContentText();
    const today = new Date();
    let todayCount = 0;
    const document = XmlService.parse(xml);
    const channel = document.getRootElement().getChild('channel');
    if (!channel) return 0;
    
    const items = channel.getChildren('item');
    items.forEach(item => {
      const pubDateText = item.getChildText('pubDate');
      if (pubDateText) {
        const pubDate = new Date(pubDateText);
        if (pubDate.getFullYear() === today.getFullYear() && 
            pubDate.getMonth() === today.getMonth() && 
            pubDate.getDate() === today.getDate()) {
          todayCount++;
        }
      }
    });
    return todayCount;
  } catch (e) { return 0; }
}

function getKakaoTalkCount() {
  try {
    const url = `https://pf.kakao.com/${KAKAO_CHANNEL_ID}/posts`;
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const html = response.getContentText();
    const todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy.MM.dd');
    const dateRegex = new RegExp(todayStr.replace(/\./g, '\\.'), 'g');
    const matches = html.match(dateRegex);
    return matches ? (matches.length > 0 ? 1 : 0) : 0;
  } catch (e) { return 0; }
}

function getYouTubeCount() {
  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`;
    const response = UrlFetchApp.fetch(rssUrl, { muteHttpExceptions: true });
    const xml = response.getContentText();
    let todayCount = 0;
    const today = new Date();
    const document = XmlService.parse(xml);
    const atomNamespace = XmlService.getNamespace('http://www.w3.org/2005/Atom');
    const entries = document.getRootElement().getChildren('entry', atomNamespace);
    entries.forEach(entry => {
      const publishedText = entry.getChildText('published', atomNamespace);
      if (publishedText) {
        const pubDate = new Date(publishedText);
        if (pubDate.getFullYear() === today.getFullYear() && 
            pubDate.getMonth() === today.getMonth() && 
            pubDate.getDate() === today.getDate()) {
          todayCount++;
        }
      }
    });
    return todayCount;
  } catch (e) { return 0; }
}
