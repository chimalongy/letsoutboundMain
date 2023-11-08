const axios = require('axios');
const cheerio = require('cheerio');

const baseUrl = 'https://www.lagunapools.com/'; // Replace with the URL of the website you want to scrape
const visitedPages = new Set();
const emails = [];

async function fetchPage(url) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch ${url}: ${error.message}`);
    return null;
  }
}

function parsePageForEmails(html) {
  // Use a regular expression to find email addresses in the HTML content
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const foundEmails = html.match(emailRegex);

  if (foundEmails) {
    foundEmails.forEach((email) => {
      if(!emails.includes(em=>em==email)){
        emails.push(email);
      }
    });
  }
}

async function crawlPage(url) {
  if (!visitedPages.has(url)) {
    visitedPages.add(url);
    const html = await fetchPage(url);
    if (html) {
      parsePageForEmails(html);
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

crawlPage(baseUrl)
  .then(() => {
    console.log('Scraped emails:', emails);
  })
  .catch((err) => {
    console.error('Crawling failed:', err);
  });
