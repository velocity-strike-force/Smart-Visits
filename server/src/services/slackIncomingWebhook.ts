/** Slack Incoming Webhooks: https://api.slack.com/messaging/webhooks */

export async function postSlackIncomingWebhook(
    webhookUrl: string,
    text: string
): Promise<void> {
    const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ text }),
    });
    if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        throw new Error(
            `Slack webhook failed (${res.status})${errBody ? `: ${errBody.slice(0, 200)}` : ""}`
        );
    }
}
