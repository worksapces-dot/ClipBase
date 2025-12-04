// Instagram Graph API integration
// Note: Instagram API requires a Facebook Business account and Instagram Business/Creator account

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID!;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET!;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`;

// Scopes for Instagram
// Note: instagram_content_publish requires Facebook App Review for production
// In development mode, only works for app admins/testers
const SCOPES = "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement";

export function getAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: INSTAGRAM_APP_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    response_type: "code",
  });

  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
}

export async function getTokensFromCode(code: string) {
  // Exchange code for short-lived token
  const tokenResponse = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?` +
      new URLSearchParams({
        client_id: INSTAGRAM_APP_ID,
        client_secret: INSTAGRAM_APP_SECRET,
        redirect_uri: REDIRECT_URI,
        code,
      })
  );

  const tokenData = await tokenResponse.json();
  if (tokenData.error) {
    throw new Error(tokenData.error.message);
  }

  // Exchange for long-lived token (60 days)
  const longLivedResponse = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?` +
      new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: INSTAGRAM_APP_ID,
        client_secret: INSTAGRAM_APP_SECRET,
        fb_exchange_token: tokenData.access_token,
      })
  );

  const longLivedData = await longLivedResponse.json();
  if (longLivedData.error) {
    throw new Error(longLivedData.error.message);
  }

  return {
    accessToken: longLivedData.access_token,
    expiresIn: longLivedData.expires_in, // seconds until expiry
  };
}


export async function refreshAccessToken(accessToken: string) {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?` +
      new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: INSTAGRAM_APP_ID,
        client_secret: INSTAGRAM_APP_SECRET,
        fb_exchange_token: accessToken,
      })
  );

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message);
  }

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

export async function getInstagramAccount(accessToken: string) {
  // Get Facebook pages the user manages
  const pagesResponse = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
  );
  const pagesData = await pagesResponse.json();

  if (!pagesData.data?.length) {
    return null;
  }

  // Get Instagram Business Account connected to the first page
  const pageId = pagesData.data[0].id;
  const pageAccessToken = pagesData.data[0].access_token;

  const igResponse = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
  );
  const igData = await igResponse.json();

  if (!igData.instagram_business_account?.id) {
    return null;
  }

  const igAccountId = igData.instagram_business_account.id;

  // Get Instagram account details
  const accountResponse = await fetch(
    `https://graph.facebook.com/v18.0/${igAccountId}?fields=id,username,profile_picture_url&access_token=${accessToken}`
  );
  const accountData = await accountResponse.json();

  return {
    id: igAccountId,
    username: accountData.username,
    profilePicture: accountData.profile_picture_url,
    pageAccessToken,
  };
}

export async function uploadToInstagram(
  igAccountId: string,
  accessToken: string,
  videoUrl: string,
  caption: string
): Promise<{ mediaId: string; permalink: string }> {
  // Step 1: Create media container for Reels
  const containerResponse = await fetch(
    `https://graph.facebook.com/v18.0/${igAccountId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: "REELS",
        video_url: videoUrl,
        caption: `${caption}\n\n#Reels #viral #clipblaze`,
        share_to_feed: true,
        access_token: accessToken,
      }),
    }
  );

  const containerData = await containerResponse.json();
  if (containerData.error) {
    throw new Error(containerData.error.message);
  }

  const containerId = containerData.id;

  // Step 2: Wait for video to be processed (poll status)
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 5000));

    const statusResponse = await fetch(
      `https://graph.facebook.com/v18.0/${containerId}?fields=status_code&access_token=${accessToken}`
    );
    const statusData = await statusResponse.json();

    if (statusData.status_code === "FINISHED") {
      break;
    } else if (statusData.status_code === "ERROR") {
      throw new Error("Instagram video processing failed");
    }
  }

  // Step 3: Publish the media
  const publishResponse = await fetch(
    `https://graph.facebook.com/v18.0/${igAccountId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
    }
  );

  const publishData = await publishResponse.json();
  if (publishData.error) {
    throw new Error(publishData.error.message);
  }

  // Get permalink
  const mediaResponse = await fetch(
    `https://graph.facebook.com/v18.0/${publishData.id}?fields=permalink&access_token=${accessToken}`
  );
  const mediaData = await mediaResponse.json();

  return {
    mediaId: publishData.id,
    permalink: mediaData.permalink || `https://instagram.com/reel/${publishData.id}`,
  };
}
