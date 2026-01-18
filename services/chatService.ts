
import { config } from '../config';
import { getServiceAccountAccessToken } from './serviceAccountAuth';

export const sendTaskNotification = async (
  memberName: string, 
  taskDescription: string, 
  encouragement: string
): Promise<void> => {
  const webhookUrl = config.googleChatWebhookUrl;
  const serviceAccountJson = config.serviceAccountJson;
  const spaceName = config.googleChatSpaceName;

  // Construct the Card Payload (Works for both Webhook and API)
  const cardPayload = {
    cardsV2: [
      {
        cardId: `task-${Date.now()}`,
        card: {
          header: {
            title: "New Family Win! 🎉",
            subtitle: `${memberName} just completed a task`,
            imageUrl: "https://fonts.gstatic.com/s/i/short_term/release/googlesymbols/celebration/default/48px.svg",
            imageType: "CIRCLE"
          },
          sections: [
            {
              header: "Task Details",
              widgets: [
                {
                  textParagraph: {
                    text: `<b>Action:</b> ${taskDescription}`
                  }
                },
                {
                  textParagraph: {
                    text: `<i>"${encouragement}"</i>`
                  }
                }
              ]
            },
            {
              widgets: [
                {
                  buttonList: {
                    buttons: [
                      {
                        text: "Open Family Kudos",
                        onClick: {
                          openLink: {
                            url: window.location.href
                          }
                        }
                      }
                    ]
                  }
                }
              ]
            }
          ]
        }
      }
    ]
  };

  // 1. Try Webhook first (Easiest)
  if (webhookUrl && !webhookUrl.includes("YOUR_WEBHOOK")) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify(cardPayload),
      });
      console.log("Sent notification via Webhook");
      return;
    } catch (error) {
      console.error("Webhook failed:", error);
    }
  }

  // 2. Try Service Account (For Personal/App usage)
  if (serviceAccountJson && spaceName) {
      try {
          console.log("Attempting Service Account auth...");
          const token = await getServiceAccountAccessToken(serviceAccountJson);
          
          // Ensure spaceName is in format 'spaces/XXXX'
          const formattedSpaceName = spaceName.startsWith('spaces/') ? spaceName : `spaces/${spaceName}`;
          
          const response = await fetch(`https://chat.googleapis.com/v1/${formattedSpaceName}/messages`, {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(cardPayload)
          });
          
          if (!response.ok) {
              const err = await response.json();
              throw new Error(`API Error: ${JSON.stringify(err)}`);
          }
          
          console.log("Sent notification via Chat API (Service Account)");
      } catch (error) {
          console.error("Service Account notification failed:", error);
      }
      return;
  }

  console.log("Google Chat not configured (Missing Webhook OR Service Account + Space Name).");
};
