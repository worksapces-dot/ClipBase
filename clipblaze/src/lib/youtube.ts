import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/youtube/callback`
);

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
];

export function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

export async function getTokensFromCode(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function refreshAccessToken(refreshToken: string) {
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
}

export async function getChannelInfo(accessToken: string) {
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
  // Refresh token if needed
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const youtube = google.youtube({ version: "v3", auth: oauth2Client });

  // Download video from URL
  const videoResponse = await fetch(videoUrl);
  const videoBuffer = await videoResponse.arrayBuffer();
  const videoStream = Buffer.from(videoBuffer);

  // Upload to YouTube
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
      body: videoStream as any,
    },
  });

  const videoId = response.data.id!;
  return {
    videoId,
    url: `https://youtube.com/shorts/${videoId}`,
  };
}
