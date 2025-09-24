// src/lib/tools.ts

/**
 * Uses the DuckDuckGo Instant Answer API to perform a simple web search.
 * @param query The search query string.
 * @returns A promise that resolves to a string of concatenated search snippets.
 */
export async function searchWeb(query: string): Promise<string> {
    if (!query) {
        return "No search query provided.";
    }
    console.log(`Performing web search for: "${query}"` );
    try {
        // Try multiple DuckDuckGo API endpoints
        const endpoints = [
            `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`,
            `https://duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`,
            `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&skip_disambig=1`
        ];

        let lastError: any = null;

        for (const endpoint of endpoints) {
            try {
                console.log(`Trying endpoint: ${endpoint}`);
                const response = await fetch(endpoint, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; AI Assistant/1.0)',
                        'Accept': 'application/json, text/plain, */*'
                    }
                });

                if (!response.ok) {
                    throw new Error(`API returned status: ${response.status}`);
                }

                const data = await response.json();
                console.log(`API Response keys:`, Object.keys(data));

                // Check if this is actual search data or test data
                if (data.AbstractText || data.Answer || (data.RelatedTopics && data.RelatedTopics.length > 0)) {
                    // Extract the most valuable text fields from the response
                    const abstract = data.AbstractText || "";
                    const answer = data.Answer || "";
                    const definition = data.Definition || "";

                    const relatedTopics = data.RelatedTopics || [];
                    const snippets = relatedTopics
                        .filter((topic: any) => topic.Text)
                        .slice(0, 4) // Take the top 4 relevant snippets
                        .map((topic: any) => `- ${topic.Text}` );

                    // Combine them into a clean, readable context block
                    let context = [abstract, answer, definition, ...snippets].filter(Boolean).join('\n');

                    const result = context.trim() || "No relevant information found from web search.";
                    console.log(`Search successful, found: ${result.length} characters`);
                    return result;
                } else {
                    console.log("Received test/development response, trying next endpoint");
                    continue;
                }
            } catch (error) {
                console.warn(`Endpoint failed: ${endpoint}`, error);
                lastError = error;
                continue;
            }
        }

        // If all endpoints fail, return the last error
        console.error("All search endpoints failed:", lastError);
        return `Error: Web search failed. ${lastError?.message || 'Unknown error'}`;

    } catch (error) {
        console.error("Web search tool failed:", error);
        return "Error: Web search failed.";
    }
}
