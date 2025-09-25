// src/pages/api/search.ts
import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query is required.' });
  }

  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  try {
    // Fetch the raw HTML from DuckDuckGo
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
      },
    });

    // Load the HTML into cheerio to parse it
    const $ = cheerio.load(data);
    const results = [];

    // Find each result snippet on the page and extract the data
    $('div.result').each((i, element) => {
      const title = $(element).find('h2.result__title a').text();
      const link = $(element).find('a.result__url').attr('href');
      const snippet = $(element).find('a.result__snippet').text();

      if (title && snippet) {
        results.push({ title, link, snippet });
      }
    });

    // Return the top 5 results as clean JSON
    res.status(200).json(results.slice(0, 5));

  } catch (error) {
    console.error("DuckDuckGo scraping error:", error);
    res.status(500).json({ error: 'Failed to fetch search results from DuckDuckGo.' });
  }
}
