import { google } from "googleapis";
import { Readable } from "stream";

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
];

function getOAuth2Client(redirectUri?: string) {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/youtube/callback`
  );
}

export function getAuthUrl() {
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/youtube/callback`;
  const oauth2Client = getOAuth2Client(redirectUri);
  
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    redirect_uri: redirectUri,
  });
}

export async function getTokensFromCode(code: string) {
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/youtube/callback`;
  const oauth2Client = getOAuth2Client(redirectUri);
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
}

export async function getChannelInfo(accessToken: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });

  const response = await youtube.channels.list({
    part: ["snippet"],
    mine: true,
  });

  const channel = response.data.items?.[0];
  return channel
    ? {
        id: channel.id,
        title: channel.snippet?.title,
        thumbnail: channel.snippet?.thumbnails?.default?.url,
      }
    : null;
}

export async function uploadToYouTube(
  accessToken: string,
  refreshToken: string,
  videoUrl: string,
  title: string,
  description: string
): Promise<{ videoId: string; url: string }> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const youtube = google.youtube({ version: "v3", auth: oauth2Client });

  // Download video from URL
  console.log("Downloading video for YouTube upload:", videoUrl.substring(0, 80));
  const videoResponse = await fetch(videoUrl);
  if (!videoResponse.ok) {
    throw new Error(`Failed to download video: ${videoResponse.status}`);
  }
  const videoBuffer = await videoResponse.arrayBuffer();
  console.log(`Downloaded ${videoBuffer.byteLength} bytes for YouTube`);
  
  // Convert to readable stream (required by YouTube API)
  const videoStream = Readable.from(Buffer.from(videoBuffer));

  // Upload to YouTube
  console.log("Starting YouTube upload...");
  const response = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: title.substring(0, 100),
        description: `${description}\n\n#Shorts`,
        tags: ["shorts", "viral", "clipblaze"],
        categoryId: "22", // People & Blogs
      },
      status: {
        privacyStatus: "public",
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: videoStream,
    },
  });

  const videoId = response.data.id;
  if (!videoId) {
    console.error("YouTube upload response:", JSON.stringify(response.data));
    throw new Error("YouTube upload failed - no video ID returned");
  }
  
  console.log("YouTube upload successful:", videoId);
  return {
    videoId,
    url: `https://youtube.com/shorts/${videoId}`,
  };
}
