import { google } from "googleapis";
import { Readable, PassThrough } from "stream";

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
  console.log("Downloading video for YouTube upload:", videoUrl);
  const videoResponse = await fetch(videoUrl);
  if (!videoResponse.ok) {
    throw new Error(
      `Failed to download video: ${videoResponse.status} ${videoResponse.statusText}`
    );
  }

  const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
  console.log(`Downloaded ${videoBuffer.byteLength} bytes for YouTube`);

  if (videoBuffer.byteLength < 1000) {
    throw new Error(
      `Video file too small (${videoBuffer.byteLength} bytes) - download may have failed`
    );
  }

  // Create a PassThrough stream from buffer
  const bufferStream = new PassThrough();
  bufferStream.end(videoBuffer);

  // Upload to YouTube as a Short
  console.log("Starting YouTube Shorts upload...");
  try {
    const response = await youtube.videos.insert({
      part: ["snippet", "status"],
      notifySubscribers: false,
      requestBody: {
        snippet: {
          title: title.substring(0, 100),
          description: `${description}\n\n#Shorts #viral`,
          tags: ["Shorts", "viral", "clipblaze"],
          categoryId: "22", // People & Blogs
        },
        status: {
          privacyStatus: "public",
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        mimeType: "video/mp4",
        body: bufferStream,
      },
    });

    const videoId = response.data.id;
    if (!videoId) {
      console.error("YouTube API response:", JSON.stringify(response.data));
      throw new Error("YouTube upload failed - no video ID in response");
    }

    console.log("YouTube upload successful! Video ID:", videoId);
    return {
      videoId,
      url: `https://youtube.com/shorts/${videoId}`,
    };
  } catch (error: unknown) {
    // Extract detailed error from Google API
    const apiError = error as {
      response?: {
        data?: {
          error?: {
            message?: string;
            errors?: Array<{ reason?: string; message?: string }>;
          };
        };
      };
      message?: string;
    };
    if (apiError.response?.data?.error) {
      const errData = apiError.response.data.error;
      console.error("YouTube API Error:", errData.message);
      console.error("Error details:", JSON.stringify(errData.errors));
      throw new Error(`YouTube API: ${errData.message}`);
    }
    console.error("YouTube upload error:", apiError.message || error);
    throw error;
  }
}
