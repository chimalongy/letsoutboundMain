import { fetch } from 'node-fetch';
import cheerio from 'cheerio';

const baseUrl = 'https://www.naborspools.com/'; // Replace with the URL of the website you want to scrape
const visitedPages = new Set();
const scrapedEmails = new Set(); // Create a set to store scraped emails

const totalPagesToScrape = 100; // Set the total number of pages you intend to scrape

let scrapedPageCount = 0; // Initialize the count of scraped pages

async function fetchPage(url) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      const html = await response.text();
      return html;
    } else {
      console.error(`Failed to fetch ${url}: ${response.status} - ${response.statusText}`);
      return null;
    }
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
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const text = $('body').text(); // You can adjust the selector as needed

  const emails = text.match(emailRegex);

  if (emails) {
    emails.forEach((email) => {
      scrapedEmails.add(email); // Add found email to the set
    });
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
      scrapedPageCount++;

      // Check if all pages have been scraped
      if (scrapedPageCount === totalPagesToScrape) {
        scrapedEmails.forEach((email) => {
          console.log(email);
        });
        console.log('Scraping completed');
      }
    }
  }
}

crawlPage(baseUrl);
