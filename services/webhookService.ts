import { config } from '../config';

export interface WebhookPayload {
  uuid: string;
  who: string;
  task: string;
  timestamp: string;
}

export interface ThankWebhookPayload {
  timestamp: string;
  uuid: string;
  taskId: string;
  memberName: string;
  type: string;
}

const sendToWebhook = async (payload: any) => {
  const webhookUrl = config.externalWebhookUrl;
  
  if (!webhookUrl) {
    console.warn('External webhook URL not configured.');
    return;
  }

  // Double check payload structure before stringifying
  console.log('[WebhookService] Final Payload Stringification:', JSON.stringify(payload));

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Failed to trigger external webhook:', error);
  }
};

export const logTaskToExternalWebhook = async (payload: WebhookPayload): Promise<void> => {
  console.log('External task trigger sent:', payload.uuid);
  return sendToWebhook(payload);
};

export const logThankToExternalWebhook = async (payload: ThankWebhookPayload): Promise<void> => {
  console.log('%c [WebhookService] Thank You Trigger Details: ', 'color: #ec4899; font-weight: bold;');
  console.table(payload);
  return sendToWebhook(payload);
};