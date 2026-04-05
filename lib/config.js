export const config = {
  tenantKey: process.env.TENANT_KEY || 'ahc-chatter',
  supabaseUrl: process.env.SUPABASE_URL || 'https://lzfgigiyqpuuxslsygjt.supabase.co',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  bridgeUrl: process.env.BRIDGE_URL || 'https://m5oqj21chd.execute-api.ap-southeast-2.amazonaws.com/lambda/invoke',
  bridgeApiKey: process.env.BRIDGE_API_KEY || '',
  bridgeDefaultFunction: process.env.BRIDGE_DEFAULT_FUNCTION || 'troy-email-send',
  driveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID || '',
  googleSaJson: process.env.GOOGLE_SA_JSON || '',        // full SA JSON string
  driveWebhookToken: process.env.GOOGLE_DRIVE_WEBHOOK_TOKEN || '',
  driveWebhookAddress: process.env.GOOGLE_DRIVE_WEBHOOK_ADDRESS || '',
  driveWatchChannelId: process.env.GOOGLE_DRIVE_WATCH_CHANNEL_ID || 'chatter-by-ahc-channel',
  drivePageToken: process.env.GOOGLE_DRIVE_PAGE_TOKEN || '',
  pollSecret: process.env.POLL_SECRET || '',             // guards /api/drive/poll
  logLevel: process.env.LOG_LEVEL || 'info',
};
