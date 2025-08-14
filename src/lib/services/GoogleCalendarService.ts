/**
 * Google Calendar Service for scheduling discovery calls
 * Handles availability checking and event creation
 */

export interface CalendarEvent {
  summary: string;
  description: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees: Array<{
    email: string;
    displayName?: string;
  }>;
  conferenceData?: {
    createRequest: {
      requestId: string;
      conferenceSolutionKey: {
        type: string;
      };
    };
  };
}

export interface AvailabilitySlot {
  start: string;
  end: string;
  available: boolean;
}

export interface SchedulingResult {
  success: boolean;
  eventId?: string;
  meetingLink?: string;
  calendarLink?: string;
  error?: string;
}

export class GoogleCalendarService {
  private accessToken: string;
  private calendarId: string;
  private ownerEmail: string;
  
  // Business hours configuration - customize these for your schedule
  private businessHours = {
    startHour: 9,      // 9 AM
    endHour: 18,       // 6 PM  
    workDays: [1, 2, 3, 4, 5], // Monday-Friday (Sunday=0, Saturday=6)
    timeZone: 'America/New_York',
    slotDuration: 60   // 60 minutes per slot
  };

  constructor(accessToken: string, calendarId: string = 'primary', ownerEmail: string) {
    this.accessToken = accessToken;
    this.calendarId = calendarId;
    this.ownerEmail = ownerEmail;
  }

  /**
   * Update business hours configuration
   */
  setBusinessHours(config: Partial<typeof this.businessHours>) {
    this.businessHours = { ...this.businessHours, ...config };
  }

  /**
   * Check availability for the next 30 days during business hours
   */
  async checkAvailability(timeZone: string = 'America/Los_Angeles'): Promise<AvailabilitySlot[]> {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

    try {
      // Get busy times from Google Calendar
      const freeBusyResponse = await fetch(`https://www.googleapis.com/calendar/v3/freeBusy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timeMin: now.toISOString(),
          timeMax: thirtyDaysLater.toISOString(),
          timeZone: timeZone,
          items: [{ id: this.calendarId }]
        })
      });

      if (!freeBusyResponse.ok) {
        throw new Error(`Failed to fetch availability: ${freeBusyResponse.statusText}`);
      }

      const freeBusyData = await freeBusyResponse.json();
      const busyTimes = freeBusyData.calendars[this.calendarId]?.busy || [];

      // Generate available slots (business hours: 9 AM - 5 PM, Mon-Fri)
      return this.generateAvailableSlots(busyTimes, timeZone);
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  }

  /**
   * Create a calendar event for the discovery call
   */
  async createDiscoveryCall(
    clientName: string,
    clientEmail: string,
    preferredTime: string,
    timeZone: string,
    projectDetails?: string
  ): Promise<SchedulingResult> {
    try {
      // Parse preferred time or find next available slot
      const eventDateTime = await this.findBestAvailableTime(preferredTime, timeZone);
      
      if (!eventDateTime) {
        return {
          success: false,
          error: 'No available time slots found for the preferred time'
        };
      }

      // Create the calendar event
      const event: CalendarEvent = {
        summary: `Discovery Call - ${clientName}`,
        description: `Discovery call with ${clientName} (${clientEmail})\n\nProject Details:\n${projectDetails || 'Details to be discussed'}`,
        start: {
          dateTime: eventDateTime.start,
          timeZone: timeZone
        },
        end: {
          dateTime: eventDateTime.end,
          timeZone: timeZone
        },
        attendees: [
          {
            email: this.ownerEmail,
            displayName: 'Manny'
          },
          {
            email: clientEmail,
            displayName: clientName
          }
        ],
        conferenceData: {
          createRequest: {
            requestId: `discovery-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        }
      };

      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events?conferenceDataVersion=1`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create event: ${errorData.error?.message || response.statusText}`);
      }

      const createdEvent = await response.json();

      return {
        success: true,
        eventId: createdEvent.id,
        meetingLink: createdEvent.conferenceData?.entryPoints?.[0]?.uri,
        calendarLink: createdEvent.htmlLink
      };
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Find the best available time slot based on preferences
   */
  private async findBestAvailableTime(preferredTime: string, timeZone: string): Promise<{ start: string; end: string } | null> {
    const availableSlots = await this.checkAvailability(timeZone);
    const freeSlots = availableSlots.filter(slot => slot.available);

    if (freeSlots.length === 0) {
      return null;
    }

    // If preferred time is specified, try to find closest match
    if (preferredTime && preferredTime !== 'flexible') {
      const preferredDate = this.parsePreferredTime(preferredTime);
      if (preferredDate) {
        // Find slot closest to preferred time
        const closestSlot = this.findClosestSlot(freeSlots, preferredDate);
        if (closestSlot) {
          return {
            start: closestSlot.start,
            end: closestSlot.end
          };
        }
      }
    }

    // Default to first available slot
    const firstSlot = freeSlots[0];
    return {
      start: firstSlot.start,
      end: firstSlot.end
    };
  }

  /**
   * Generate available time slots during business hours
   */
  private generateAvailableSlots(busyTimes: Array<{ start: string; end: string }>, timeZone: string): AvailabilitySlot[] {
    const slots: AvailabilitySlot[] = [];
    const now = new Date();
    
    // Generate slots for next 14 days (business hours only)
    for (let d = 0; d < 14; d++) {
      const date = new Date(now.getTime() + (d * 24 * 60 * 60 * 1000));
      
      // Skip non-working days
      if (!this.businessHours.workDays.includes(date.getDay())) continue;
      
      // Generate slots based on configured business hours
      for (let hour = this.businessHours.startHour; hour < this.businessHours.endHour; hour++) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, 0, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setHours(hour + 1, 0, 0, 0);

        // Skip past times
        if (slotStart <= now) continue;

        const startISO = slotStart.toISOString();
        const endISO = slotEnd.toISOString();

        // Check if this slot conflicts with busy times
        const isAvailable = !busyTimes.some(busy => {
          const busyStart = new Date(busy.start);
          const busyEnd = new Date(busy.end);
          return (slotStart < busyEnd && slotEnd > busyStart);
        });

        slots.push({
          start: startISO,
          end: endISO,
          available: isAvailable
        });
      }
    }

    return slots;
  }

  /**
   * Parse preferred time string into Date object
   */
  private parsePreferredTime(preferredTime: string): Date | null {
    try {
      // Handle various formats: "tomorrow 2pm", "next week", "Friday morning", etc.
      const now = new Date();
      
      // Simple parsing for common phrases
      if (preferredTime.toLowerCase().includes('tomorrow')) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(14, 0, 0, 0); // Default to 2 PM
        return tomorrow;
      }
      
      if (preferredTime.toLowerCase().includes('next week')) {
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        nextWeek.setHours(10, 0, 0, 0); // Default to 10 AM
        return nextWeek;
      }

      // Try direct date parsing
      const parsed = new Date(preferredTime);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Find the closest available slot to preferred time
   */
  private findClosestSlot(slots: AvailabilitySlot[], preferredDate: Date): AvailabilitySlot | null {
    let closestSlot: AvailabilitySlot | null = null;
    let closestDistance = Infinity;

    for (const slot of slots) {
      const slotDate = new Date(slot.start);
      const distance = Math.abs(slotDate.getTime() - preferredDate.getTime());
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestSlot = slot;
      }
    }

    return closestSlot;
  }

  /**
   * Get formatted available times for display
   */
  async getFormattedAvailability(timeZone: string = 'America/Los_Angeles'): Promise<string[]> {
    const availability = await this.checkAvailability(timeZone);
    const freeSlots = availability.filter(slot => slot.available).slice(0, 5); // First 5 slots

    return freeSlots.map(slot => {
      const date = new Date(slot.start);
      return date.toLocaleString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: timeZone
      });
    });
  }
}

export default GoogleCalendarService;
