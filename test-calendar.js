// Quick test script for Google Calendar integration
// Run this to verify your calendar connection

import GoogleCalendarService from './src/lib/services/GoogleCalendarService.js';

async function testCalendarIntegration() {
  console.log('🗓️  Testing Google Calendar Integration...\n');
  
  const accessToken = process.env.GOOGLE_CALENDAR_ACCESS_TOKEN;
  const ownerEmail = process.env.OWNER_EMAIL;
  
  if (!accessToken) {
    console.error('❌ GOOGLE_CALENDAR_ACCESS_TOKEN not found in environment');
    return;
  }
  
  if (!ownerEmail) {
    console.error('❌ OWNER_EMAIL not found in environment');
    return;
  }
  
  console.log('✅ Environment variables found');
  console.log(`📧 Owner email: ${ownerEmail}`);
  console.log(`🔑 Access token: ${accessToken.substring(0, 20)}...`);
  
  try {
    const calendarService = new GoogleCalendarService(accessToken, 'primary', ownerEmail);
    
    console.log('\n📅 Checking calendar availability...');
    const availability = await calendarService.getFormattedAvailability('America/Los_Angeles');
    
    console.log(`✅ Found ${availability.length} available time slots:`);
    availability.slice(0, 5).forEach((slot, index) => {
      console.log(`   ${index + 1}. ${slot}`);
    });
    
    console.log('\n🎉 Calendar integration is working!');
    
  } catch (error) {
    console.error('❌ Calendar integration failed:');
    console.error(error.message);
    
    if (error.message.includes('401')) {
      console.log('\n💡 Tip: Your access token may have expired. Generate a new one from OAuth Playground.');
    }
  }
}

testCalendarIntegration();
