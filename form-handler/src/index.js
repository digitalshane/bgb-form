export default {
	async fetch(request, env, ctx) {
		// Handle CORS
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'POST, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type',
				},
			});
		}

		if (request.method !== 'POST') {
			return new Response('Method not allowed', { status: 405 });
		}

		try {
			const formData = await request.json();

			// Send to Airtable webhook
			const airtableResponse = await fetch(env.AIRTABLE_WEBHOOK_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(formData),
			});

			if (!airtableResponse.ok) {
				throw new Error('Airtable webhook error');
			}

			// Process with ChatGPT
			const chatGPTResponse = await fetch('https://api.openai.com/v1/chat/completions', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${env.OPENAI_API_KEY}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					model: 'gpt-4',
					messages: [
						{
							role: 'system',
							content: 'You are a helpful assistant processing form submissions.',
						},
						{
							role: 'user',
							content: `Please analyze this form submission: ${JSON.stringify(formData)}`,
						},
					],
					temperature: 0.7,
				}),
			});

			if (!chatGPTResponse.ok) {
				throw new Error('ChatGPT API error');
			}

			const chatGPTData = await chatGPTResponse.json();

			return new Response(
				JSON.stringify({
					success: true,
					message: 'Form processed successfully',
					analysis: chatGPTData.choices[0].message.content,
				}),
				{
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': '*',
					},
				}
			);
		} catch (error) {
			return new Response(
				JSON.stringify({
					success: false,
					error: error.message,
				}),
				{
					status: 500,
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': '*',
					},
				}
			);
		}
	},
};
