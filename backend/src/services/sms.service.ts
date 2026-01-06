/**
 * SMS Provider Interface
 */
export interface SMSProvider {
  sendSMS(phoneNumber: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

/**
 * Mock SMS Provider (for development/testing)
 */
export class MockSMSProvider implements SMSProvider {
  async sendSMS(phoneNumber: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Mock success (90% success rate for testing)
    const success = Math.random() > 0.1;

    if (success) {
      console.log(`[MOCK SMS] To: ${phoneNumber}`);
      console.log(`[MOCK SMS] Message: ${message.substring(0, 50)}...`);
      return { success: true, messageId: `mock_${Date.now()}` };
    } else {
      console.log(`[MOCK SMS] Failed to send to: ${phoneNumber}`);
      return { success: false, error: 'Mock SMS provider failure' };
    }
  }
}

/**
 * Kavenegar SMS Provider (Iranian SMS service)
 */
export class KavenegarSMSProvider implements SMSProvider {
  constructor(_apiKey: string) {
    // Store if needed for actual API implementation
  }

  async sendSMS(phoneNumber: string, _message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // TODO: Implement actual Kavenegar API integration
      // const response = await fetch(`https://api.kavenegar.com/v1/${this.apiKey}/sms/send.json`, {
      //   method: 'POST',
      //   body: JSON.stringify({ receptor: phoneNumber, message }),
      // });
      // return { success: true, messageId: response.messageId };

      // Placeholder
      console.log(`[KAVENEGAR] Would send SMS to ${phoneNumber}`);
      return { success: true, messageId: `kavenegar_${Date.now()}` };
    } catch (error: any) {
      return { success: false, error: error.message || 'Kavenegar API error' };
    }
  }
}

/**
 * Twilio SMS Provider
 */
export class TwilioSMSProvider implements SMSProvider {
  constructor(_accountSid: string, _authToken: string, _fromNumber: string) {
    // Store if needed for actual API implementation
  }

  async sendSMS(phoneNumber: string, _message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // TODO: Implement actual Twilio API integration
      // const response = await twilioClient.messages.create({
      //   body: message,
      //   from: this.fromNumber,
      //   to: phoneNumber,
      // });
      // return { success: true, messageId: response.sid };

      // Placeholder
      console.log(`[TWILIO] Would send SMS to ${phoneNumber}`);
      return { success: true, messageId: `twilio_${Date.now()}` };
    } catch (error: any) {
      return { success: false, error: error.message || 'Twilio API error' };
    }
  }
}

/**
 * Get SMS provider based on configuration
 */
export const getSMSProvider = (): SMSProvider => {
  const provider = process.env.SMS_PROVIDER || 'mock';
  const apiKey = process.env.SMS_API_KEY || '';
  const apiSecret = process.env.SMS_API_SECRET || '';

  switch (provider.toLowerCase()) {
    case 'kavenegar':
      return new KavenegarSMSProvider(apiKey);
    case 'twilio':
      return new TwilioSMSProvider(apiKey, apiSecret, process.env.SMS_FROM_NUMBER || '');
    default:
      return new MockSMSProvider();
  }
};
