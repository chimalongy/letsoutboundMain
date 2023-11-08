const axios = require('axios');
const cheerio = require('cheerio');

const baseUrl = 'https://www.texasconstructionplus.com'; // Replace with the URL of the website you want to scrape
const visitedPages = new Set();

async function fetchPage(url) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch ${url}: ${error.message}`);
    return null;
  }
}

function parsePage(html) {
  const $ = cheerio.load(html);
  // Example: $('a').each((index, element) => console.log($(element).attr('href')));
  // You can customize this function to extract data of interest.
  // Use regular expressions to find email addresses in the text
  const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g;
  const text = $('body').text(); // You can adjust the selector as needed

  const emails = text.match(emailRegex);

  if (emails) {
    emails.forEach((email) => {
      console.log(email);
    });
  } else {
    console.log('No email addresses found on the page.');
  }


}

async function crawlPage(url) {
  if (!visitedPages.has(url)) {
    visitedPages.add(url);
    const html = await fetchPage(url);
    if (html) {
      parsePage(html);
      const $ = cheerio.load(html);
      $('a').each((index, element) => {
        const link = $(element).attr('href');
        if (link && link.startsWith(baseUrl)) {
          crawlPage(link);
        }
      });
    }
  }
}

crawlPage(baseUrl);
