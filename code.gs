// Configuration
const SPREADSHEET_ID = '1HyU6awdElJlLUitZ_tBM6iMAR3KvbY1-O2sEqgamBoI';
const PAYMENT_LINK = 'https://www.kulturecity.org/kc-fundraiser/running-nyc-for-inclusion-every-mile-matters/';
const MARATHON_DATE = new Date('2025-11-02'); // NYC Marathon 2025 date
const WEBSITE_URL = 'https://nymarathon25.netlify.app/';
const CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds

// Strava API Configuration
const STRAVA_CONFIG = {
  client_id: '131903',
  client_secret: '669dc0dc168272b41c600ab4faa58b1a0b741b99',
  refresh_token: '9625bc9a6e522d791803b14a40ec72308e900e24'
};

const STRAVA_FALLBACK_ACCESS_TOKEN = '2e9a0b95c0846e7746a81dee7bf516fd79bac932';

// Helper function to calculate days until marathon
function getDaysUntilMarathon() {
  const today = new Date();
  const diffTime = MARATHON_DATE - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Helper function to calculate total dollars raised
function getTotalDollarsRaised() {
  const sponsorships = getSponsorship();
  let total = 0;
  Object.values(sponsorships).forEach(sponsor => {
    total += parseInt(sponsor.amount) || 100;
  });
  return total;
}

// Helper function to get sponsorship progress
function getSponsorshipProgress() {
  const sponsorships = getSponsorship();
  const totalMiles = 26;
  const sponsoredMiles = Object.keys(sponsorships).length;
  const percentage = (sponsoredMiles / totalMiles) * 100;
  const totalRaised = getTotalDollarsRaised();
  
  // Group sponsors by half
  const firstHalf = {};
  const secondHalf = {};
  
  Object.entries(sponsorships).forEach(([mile, data]) => {
    const mileNum = parseInt(mile);
    if (mileNum <= 13) {
      firstHalf[mile] = data;
    } else {
      secondHalf[mile] = data;
    }
  });
  
  return {
    totalMiles,
    sponsoredMiles,
    percentage,
    totalRaised,
    firstHalf,
    secondHalf
  };
}

// Helper function to generate progress bar HTML
function generateProgressBarHtml(percentage) {
  return `
    <div style="background-color: #eee; border-radius: 10px; height: 20px; width: 100%; margin: 10px 0;">
      <div style="background-color: #3498db; width: ${Math.min(percentage, 100)}%; height: 100%; border-radius: 10px;"></div>
    </div>
    <p style="text-align: center; color: #2c3e50; margin: 5px 0;">${Math.round(percentage)}% of miles sponsored</p>
  `;
}

// Helper function to generate social sharing buttons
function generateSocialShareHtml(params) {
  const shareText = encodeURIComponent(`I just sponsored Mile ${params.mile} of the NYC Marathon to support KultureCity! Join me:`);
  const shareUrl = encodeURIComponent(WEBSITE_URL);
  
  return `
    <div style="text-align: center; margin: 20px 0;">
      <p style="margin-bottom: 10px;">Share your support:</p>
      <a href="https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}" style="text-decoration: none; display: inline-block; margin: 0 10px; color: #1DA1F2;">
        <img src="https://raw.githubusercontent.com/gauravghongde/social-icons/master/PNG/Color/Twitter.png" alt="Twitter" style="width: 32px; height: 32px;">
      </a>
      <a href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${decodeURIComponent(shareText)}" style="text-decoration: none; display: inline-block; margin: 0 10px; color: #4267B2;">
        <img src="https://raw.githubusercontent.com/gauravghongde/social-icons/master/PNG/Color/Facebook.png" alt="Facebook" style="width: 32px; height: 32px;">
      </a>
      <a href="https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}&summary=${shareText}" style="text-decoration: none; display: inline-block; margin: 0 10px; color: #0077B5;">
        <img src="https://raw.githubusercontent.com/gauravghongde/social-icons/master/PNG/Color/LinkedIN.png" alt="LinkedIn" style="width: 32px; height: 32px;">
      </a>
    </div>
  `;
}

// Helper function to generate sponsors list HTML
function generateSponsorsListHtml(firstHalf, secondHalf) {
  const generateHalfHtml = (sponsors, title) => {
    if (Object.keys(sponsors).length === 0) return '';
    
    let html = `<h3 style="color: #34495e; margin: 15px 0;">${title}:</h3><ul style="list-style: none; padding: 0;">`;
    Object.entries(sponsors).forEach(([mile, data]) => {
      html += `
        <li style="margin: 5px 0;">
          <strong>Mile ${mile}:</strong> ${data.sponsor} - "${data.message}"
        </li>
      `;
    });
    html += '</ul>';
    return html;
  };
  
  return `
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h2 style="color: #34495e; margin-bottom: 15px;">Our Sponsor Community</h2>
      ${generateHalfHtml(firstHalf, 'First Half Sponsors (Miles 1-13)')}
      ${generateHalfHtml(secondHalf, 'Second Half Sponsors (Miles 14-26)')}
    </div>
  `;
}

// Main function to handle GET requests (JSONP for fetching sponsorships)
function doGet(e) {
  try {
    // Check if this is a Strava OAuth callback
    if (e.parameter.code) {
      Logger.log('Received Strava authorization code');
      
      // Exchange the code for tokens
      const tokenUrl = 'https://www.strava.com/oauth/token';
      const payload = {
        client_id: STRAVA_CONFIG.client_id,
        client_secret: STRAVA_CONFIG.client_secret,
        code: e.parameter.code,
        grant_type: 'authorization_code'
      };
      
      const options = {
        method: 'post',
        payload: payload,
        muteHttpExceptions: true
      };
      
      const response = UrlFetchApp.fetch(tokenUrl, options);
      const responseData = JSON.parse(response.getContentText());
      
      if (responseData.access_token && responseData.refresh_token) {
        // Return the new tokens to be saved
        return ContentService.createTextOutput(
          `New Strava tokens received! Please update your STRAVA_CONFIG with:\n\n` +
          `refresh_token: "${responseData.refresh_token}"\n\n` +
          `You can now close this window and retry your request.`
        );
      }
    }

    // Handle manual testing (when e is undefined)
    if (!e) {
      Logger.log('Manual test run - getting sponsorships data');
      const sponsorships = getSponsorship();
      Logger.log('Sponsorships data:');
      Logger.log(JSON.stringify(sponsorships));
      return ContentService.createTextOutput(JSON.stringify(sponsorships))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const callback = e.parameter.callback;
    if (!callback) {
      throw new Error('Callback parameter is required for JSONP requests');
    }
    
    // If requesting training stats
    if (e.parameter.type === 'training') {
      try {
        Logger.log('Getting training stats...');
        const stats = get2025RunningStats();
        Logger.log('Raw training stats: ' + JSON.stringify(stats));
        
        // Format response to match frontend expectations
        const responseData = {
          success: true,
          miles: Number((stats.totalMiles || 0).toFixed(1)),
          activities: stats.activityCount || 0,
          lastUpdated: stats.lastUpdated || new Date().toISOString()
        };
        
        Logger.log('Formatted response: ' + JSON.stringify(responseData));
        const response = `${callback}(${JSON.stringify(responseData)})`;
        Logger.log('Final JSONP response: ' + response);
        
        return ContentService.createTextOutput(response)
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      } catch (error) {
        Logger.log('Error getting training stats: ' + error.toString());
        Logger.log('Error stack: ' + error.stack);
        const response = `${callback}(${JSON.stringify({
          success: true,
          miles: 0.0,
          activities: 0,
          lastUpdated: new Date().toISOString()
        })})`;
        return ContentService.createTextOutput(response)
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
    }
    
    // If there are form parameters, treat it as a POST request
    if (Object.keys(e.parameter).length > 1) {
      return handleFormSubmission(e.parameter, callback);
    }
    
    // Get sponsorships & overall progress
    const sponsorships = getSponsorship();
    const overallProgress = getOverallProgress();
 
    // Return JSONP response (include overall progress)
    const jsonResponse = JSON.stringify({
      success: true,
      data: sponsorships,
      overall: overallProgress
    });
    const response = `${callback}(${jsonResponse})`;
    
    return ContentService.createTextOutput(response)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
      
  } catch (error) {
    Logger.log('Error in doGet:', error);
    Logger.log('Error stack:', error.stack);
    
    if (!e || !e.parameter.callback) throw error;
    
    return ContentService.createTextOutput(`${e.parameter.callback}(${JSON.stringify({
      success: false,
      error: error.toString()
    })})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
}

// Handle form submissions
function handleFormSubmission(params, callback) {
  try {
    Logger.log('Processing form submission:', JSON.stringify(params));
    
    // Validate required fields
    const requiredFields = ['mile', 'firstName', 'lastName', 'email', 'phone', 'message', 'amount'];
    for (const field of requiredFields) {
      if (!params[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Append to spreadsheet
    const sheet = getOrCreateSheet();
    const timestamp = new Date().toISOString();
    const rowData = [
      params.mile,           // Mile Number
      params.firstName,      // First Name
      params.lastName,       // Last Name
      params.email,         // Email
      params.phone,         // Phone
      params.message,       // Message
      params.amount,        // Amount
      timestamp            // Time submitted
    ];
    
    sheet.appendRow(rowData);
    Logger.log('Added row to spreadsheet');
    
    // Send confirmation email
    const emailSent = sendConfirmationEmail(params);
    Logger.log('Email status:', emailSent);

    // Send notification email to admin
    const notificationSent = sendNotificationEmail(params);
    Logger.log('Notification email status:', notificationSent);
    
    // Return success response
    const response = {
      success: true,
      message: 'Sponsorship recorded successfully',
      emailSent: emailSent
    };
    
    return ContentService.createTextOutput(`${callback}(${JSON.stringify(response)})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
      
  } catch (error) {
    Logger.log('Error processing submission:', error);
    
    return ContentService.createTextOutput(`${callback}(${JSON.stringify({
      success: false,
      error: error.toString()
    })})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
}

// Get or create the spreadsheet
function getOrCreateSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Sponsorships');
  
  if (!sheet) {
    sheet = ss.insertSheet('Sponsorships');
    const headers = [
      'Mile Number',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Message',
      'Amount',
      'Time submitted'
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  
  return sheet;
}

// Get current sponsorships
function getSponsorship() {
  try {
    Logger.log('Opening spreadsheet...');
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    Logger.log('Spreadsheet opened successfully');
    
    Logger.log('Getting Sponsorships sheet...');
    const sheet = ss.getSheetByName('Sponsorships');
    if (!sheet) {
      Logger.log('Sheet not found!');
      return {};
    }
    
    Logger.log('Getting data range...');
    const data = sheet.getDataRange().getValues();
    Logger.log(`Found ${data.length} rows of data`);
    
    const sponsorships = {};
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Correct the column mapping based on your data
      const mile = String(row[0]); // Mile Number is in column 1
      const firstName = row[1]; // First Name is in column 2
      const lastName = row[2]; // Last Name is in column 3
      const message = row[5]; // Message is in column 6
      const amount = row[6]; // Amount is in column 7
      
      // Validate that we have a proper mile number (1-26)
      if (mile && !isNaN(mile) && parseInt(mile) >= 1 && parseInt(mile) <= 26) {
        sponsorships[mile] = {
          sponsor: `${firstName} ${lastName}`.trim(),
          message: String(message || ''),
          amount: String(amount || '100')
        };
      }
    }
    
    return sponsorships;
    
  } catch (error) {
    Logger.log('Error in getSponsorship:', error);
    throw error;
  }
}

// Get overall fundraising progress from the "Total" sheet (column A, first numeric value)
function getOverallProgress() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Total');
    if (!sheet) {
      Logger.log('Total sheet not found; returning 0');
      return 0;
    }
    const range = sheet.getRange(2, 1); // Assuming header in row 1, value in row 2 col A
    const value = range.getValue();
    const number = Number(value);
    return isNaN(number) ? 0 : number;
  } catch (err) {
    Logger.log('Error reading overall progress:', err);
    return 0;
  }
}

// Function to get the script URL
function getScriptUrl() {
  return ScriptApp.getService().getUrl();
}

// Function to get Strava access token
function getStravaAccessToken() {
  const props = PropertiesService.getScriptProperties();
  const cachedToken = props.getProperty('strava_access_token');
  const expiresAt = Number(props.getProperty('strava_expires_at')) || 0;
  const now = Math.floor(Date.now() / 1000);

  // 1. Use cached token if still valid (5-minute safety buffer)
  if (cachedToken && expiresAt && (expiresAt - 300) > now) {
    Logger.log(`Using cached Strava access token (expires in ${expiresAt - now}s)`);
    return cachedToken;
  }

  // 2. Refresh token via OAuth refresh flow
  const tokenUrl = 'https://www.strava.com/oauth/token';
  const payload = {
    client_id: STRAVA_CONFIG.client_id,
    client_secret: STRAVA_CONFIG.client_secret,
    refresh_token: STRAVA_CONFIG.refresh_token,
    grant_type: 'refresh_token'
  };

  const options = {
    method: 'post',
    payload: JSON.stringify(payload),
    contentType: 'application/json',
    muteHttpExceptions: true
  };

  try {
    Logger.log('Attempting to refresh Strava access token…');
    const response = UrlFetchApp.fetch(tokenUrl, options);
    const code = response.getResponseCode();
    const text = response.getContentText();
    Logger.log(`Token refresh response code: ${code}`);

    if (code === 200 && text) {
      const json = JSON.parse(text);
      if (json.access_token && json.expires_at) {
        props.setProperty('strava_access_token', json.access_token);
        props.setProperty('strava_expires_at', json.expires_at);
        Logger.log('Access token refreshed & cached until ' + json.expires_at);
        return json.access_token;
      }
    }
    Logger.log('Unexpected refresh response – falling back token if available');
  } catch (err) {
    Logger.log('Error refreshing Strava token: ' + err);
  }

  // 3. Fallback: static token provided by user (may expire in 6h)
  if (STRAVA_FALLBACK_ACCESS_TOKEN) {
    Logger.log('⚠️  Using fallback static Strava access token.');
    return STRAVA_FALLBACK_ACCESS_TOKEN;
  }

  throw new Error('Unable to obtain Strava access token');
}

// Helper to build a Strava OAuth URL requesting the proper scopes
function buildStravaAuthUrl() {
  const redirectUri = encodeURIComponent(ScriptApp.getService().getUrl());
  return 'https://www.strava.com/oauth/authorize?client_id=' + STRAVA_CONFIG.client_id +
    '&response_type=code' +
    '&redirect_uri=' + redirectUri +
    '&approval_prompt=force' +
    '&scope=activity:read_all,read_all,profile:read_all';
}

// Function to get 2025 running stats from Strava
function get2025RunningStats() {
  try {
    Logger.log('Getting Strava access token...');
    const accessToken = getStravaAccessToken();
    Logger.log('Successfully got access token: %s', accessToken ? 'Token received' : 'No token received');

    if (!accessToken) {
      throw new Error('No access token received from Strava');
    }

    // --- New pagination-aware implementation ---
    const after = new Date('2025-01-01T00:00:00Z').getTime() / 1000;
    const before = new Date('2026-01-01T00:00:00Z').getTime() / 1000;
    const PER_PAGE = 200;               // Strava maximum per_page value

    const allActivities = [];
    let page = 1;
    let fetched; // will hold per-page results

    do {
      const url = `https://www.strava.com/api/v3/athlete/activities?after=${after}&before=${before}&per_page=${PER_PAGE}&page=${page}`;
      const options = {
        headers: { 'Authorization': 'Bearer ' + accessToken },
        muteHttpExceptions: true
      };

      Logger.log(`Fetching Strava activities (page ${page}) → ${url}`);
      const resp = UrlFetchApp.fetch(url, options);
      const respCode = resp.getResponseCode();
      const respText = resp.getContentText();
      Logger.log(`Page ${page} response (${respCode}): ${respText.substring(0, 500)}`);

      if (respCode !== 200) {
        throw new Error(`Strava API returned status ${respCode} on page ${page}`);
      }

      fetched = JSON.parse(respText);
      if (!Array.isArray(fetched)) {
        throw new Error('Unexpected response format from Strava API');
      }

      allActivities.push(...fetched);
      page++;
    } while (fetched.length === PER_PAGE); // keep paging while we get full pages

    Logger.log(`Total activities retrieved for 2025: ${allActivities.length}`);

    // Filter run-type activities (Run, TrailRun, VirtualRun)
    const runTypes = ['Run', 'TrailRun', 'VirtualRun'];
    const runActivities = allActivities.filter(act => runTypes.includes(act.type));
    Logger.log(`Filtered run activities count: ${runActivities.length}`);

    // Calculate totals
    let totalMiles = 0;
    let lastActivityDate = null;

    runActivities.forEach(act => {
      const miles = act.distance * 0.000621371; // meters → miles
      totalMiles += miles;
      const actDate = new Date(act.start_date);
      if (!lastActivityDate || actDate > lastActivityDate) {
        lastActivityDate = actDate;
      }
    });

    const result = {
      totalMiles: Number((Math.round(totalMiles * 10) / 10).toFixed(1)),
      activityCount: runActivities.length,
      lastUpdated: lastActivityDate ? lastActivityDate.toISOString() : new Date().toISOString()
    };

    Logger.log('Final running stats (pagination aware): ' + JSON.stringify(result));
    return result;

  } catch (error) {
    Logger.log('Error fetching Strava activities:', error);
    Logger.log('Error stack:', error.stack);
    return {
      totalMiles: 0.0,
      activityCount: 0,
      lastUpdated: new Date().toISOString()
    };
  }
}

// Helper function to generate training stats HTML
function generateTrainingStatsHtml() {
  const stats = get2025RunningStats();
  const lastUpdated = new Date(stats.lastUpdated).toLocaleString();
  
  return `
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h2 style="color: #34495e; margin-bottom: 15px;">Training Progress</h2>
      <p style="text-align: center; font-size: 24px; color: #2c3e50;">
        <strong>${stats.totalMiles}</strong> miles run in 2025
      </p>
      <p style="text-align: center; color: #7f8c8d;">
        Across ${stats.activityCount} training runs
      </p>
      <p style="text-align: center; font-size: 12px; color: #95a5a6; margin-top: 10px;">
        Last updated: ${lastUpdated}
      </p>
    </div>
  `;
}

// Send confirmation email
function sendConfirmationEmail(params) {
  try {
    const daysLeft = getDaysUntilMarathon();
    const progress = getSponsorshipProgress();
    const fundraisingLink = 'https://www.kulturecity.org/kc-fundraiser/running-nyc-for-inclusion-every-mile-matters/';
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2c3e50; text-align: center;">Thank You for Your NYC Marathon Sponsorship!</h1>
        
        <div style="text-align: center; margin: 20px 0;">
          <h2 style="color: #e74c3c;">${daysLeft} Days Until Marathon Day!</h2>
        </div>
        
        ${generateTrainingStatsHtml()}
        
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h2 style="color: #34495e; margin-bottom: 15px;">Sponsorship Progress</h2>
          ${generateProgressBarHtml(progress.percentage)}
          <p style="text-align: center;">${progress.sponsoredMiles} of ${progress.totalMiles} miles sponsored</p>
          <p style="text-align: center; font-weight: bold; color: #27ae60;">$${progress.totalRaised.toLocaleString()} raised so far!</p>
        </div>
        
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h2 style="color: #34495e; margin-bottom: 15px;">Your Sponsorship Details:</h2>
          <p><strong>Mile:</strong> ${params.mile}</p>
          <p><strong>Amount:</strong> $${params.amount}</p>
          <p><strong>Your Message:</strong> "${params.message}"</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="margin-bottom: 20px;">To complete your sponsorship, please click the button below or scan the QR code to make your donation:</p>
          <a href="${fundraisingLink}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-bottom: 20px;">
            Complete Your Donation
          </a>
          <p style="margin-bottom: 20px;">Donation QR Code</p>
          <img src="https://raw.githubusercontent.com/cbcampos/nycmarathon/main/donation-qr.png" alt="Donation QR Code" style="width: 200px; height: 200px; margin: 20px auto; display: block;">
        </div>
        
        ${generateSocialShareHtml(params)}
        
        ${generateSponsorsListHtml(progress.firstHalf, progress.secondHalf)}
        
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h2 style="color: #34495e; margin-bottom: 15px;">Next Steps:</h2>
          <ol style="margin: 0; padding-left: 20px;">
            <li>Click the button above or scan the QR code to visit KultureCity's donation page</li>
            <li>Enter your donation amount: $${params.amount}</li>
            <li>Complete the donation form</li>
          </ol>
        </div>
      </div>
    `;
    
    // Send email
    GmailApp.sendEmail(
      params.email,
      'Thank You for Supporting KultureCity!',
      'Thank you for sponsoring Mile ' + params.mile + ' of the NYC Marathon!',
      {
        name: 'Chris Campos - NYC Marathon',
        htmlBody: htmlBody
      }
    );
    
    return true;
  } catch (error) {
    Logger.log('Error sending confirmation email:', error);
    return false;
  }
}

// Send notification email to admin
function sendNotificationEmail(params) {
  try {
    const adminEmail = 'chris.campos@gmail.com';
    const timestamp = new Date().toLocaleString();
    const daysUntil = getDaysUntilMarathon();
    const progress = getSponsorshipProgress();
    
    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2c3e50; text-align: center;">New Mile Sponsorship Received!</h1>
        
        <div style="text-align: center; margin: 20px 0;">
          <h2 style="color: #e74c3c;">${daysUntil} Days Until Marathon Day!</h2>
        </div>
        
        ${generateTrainingStatsHtml()}
        
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h2 style="color: #34495e; margin-bottom: 15px;">Sponsorship Progress</h2>
          ${generateProgressBarHtml(progress.percentage)}
          <p style="text-align: center;">${progress.sponsoredMiles} of ${progress.totalMiles} miles sponsored</p>
          <p style="text-align: center; font-weight: bold; color: #27ae60;">$${progress.totalRaised.toLocaleString()} raised so far!</p>
        </div>
        
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h2 style="color: #34495e; margin-bottom: 15px;">New Sponsorship Details:</h2>
          <p><strong>Mile:</strong> ${params.mile}</p>
          <p><strong>Amount:</strong> $${params.amount}</p>
          <p><strong>Sponsor:</strong> ${params.firstName} ${params.lastName}</p>
          <p><strong>Email:</strong> ${params.email}</p>
          <p><strong>Phone:</strong> ${params.phone}</p>
          <p><strong>Message:</strong> "${params.message}"</p>
          <p><strong>Time:</strong> ${timestamp}</p>
        </div>
        
        ${generateSponsorsListHtml(progress.firstHalf, progress.secondHalf)}
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="margin-bottom: 20px;">The sponsor has been sent payment instructions via email.</p>
          <a href="${PAYMENT_LINK}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Donation Page
          </a>
        </div>
      </div>
    `;
    
    MailApp.sendEmail({
      to: adminEmail,
      subject: `New Mile ${params.mile} Sponsorship - ${params.firstName} ${params.lastName}`,
      htmlBody: htmlTemplate
    });
    
    return true;
  } catch (error) {
    Logger.log('Error sending notification email:', error);
    return false;
  }
}

// Create menu when spreadsheet opens
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Sponsorship Actions')
    .addItem('Resend Confirmation Email', 'resendConfirmationEmailFromSelection')
    .addToUi();
}

// Function to resend confirmation email from selected row
function resendConfirmationEmailFromSelection() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const selection = sheet.getSelection();
  const selectedRange = selection.getActiveRange();
  
  // Ensure only one row is selected
  if (selectedRange.getNumRows() !== 1) {
    SpreadsheetApp.getUi().alert('Please select a single row to resend the confirmation email.');
    return;
  }
  
  const row = selectedRange.getRow();
  const data = sheet.getRange(row, 1, 1, 8).getValues()[0];
  
  // Create params object from row data
  const params = {
    mile: String(data[0]),
    firstName: data[1],
    lastName: data[2],
    email: data[3],
    phone: data[4],
    message: data[5],
    amount: String(data[6])
  };
  
  try {
    // Send the confirmation email
    const emailSent = sendConfirmationEmail(params);
    
    // Show success/failure message
    const ui = SpreadsheetApp.getUi();
    if (emailSent) {
      ui.alert(
        'Success',
        `Confirmation email resent to ${params.firstName} ${params.lastName} (${params.email}) for Mile ${params.mile}.`,
        ui.ButtonSet.OK
      );
    } else {
      ui.alert(
        'Error',
        'Failed to send confirmation email. Please try again.',
        ui.ButtonSet.OK
      );
    }
  } catch (error) {
    SpreadsheetApp.getUi().alert('Error: ' + error.toString());
  }
} 