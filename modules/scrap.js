const axios = require('axios');
const cheerio = require('cheerio');
const urlModule = require('url');


let domainList=[]

function emailExtractor(domainList){
    const visitedUrls = new Set(); // To avoid visiting the same URL multiple times
let emailFound = false;

async function extractEmails(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Extract email addresses (this is a simple regex, you might need a more sophisticated one)
    const emails = response.data.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);

    if (emails) {
      console.log(`Emails found at ${url}:`, emails);
      emailFound = true;
    }

    // Stop searching if email is found
    if (!emailFound) {
      // Extract links from the page and visit them
      $('a').each((index, element) => {
        const href = $(element).attr('href');
        if (href && !visitedUrls.has(href)) {
          visitedUrls.add(href);
          const absoluteUrl = urlModule.resolve(url, href);
          extractEmails(absoluteUrl);
        }
      });
    }
  } catch (error) {
    console.error(`Error processing ${url}:`, error.message);
  }
}

}



for(let i=0; i<domainList.length;i++){
    extractEmails("http://"+domainList[i]);
}




module.exports  = {emailExtractor}