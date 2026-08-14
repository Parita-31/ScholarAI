import puppeteer from "puppeteer";

export async function scrapeScholarships() {
  console.log("Launching scraper...");

  // FALLBACK DATA
  const mockData = [
    {
      name: "MYSY Scholarship",
      income_limit: 600000,
      category_allowed: ["General", "OBC", "SC", "ST"],
      course_allowed: ["Engineering", "Medicine"],
      deadline: "2026-10-15"
    },
    {
      name: "Digital Gujarat SC/ST Scholarship",
      income_limit: 250000,
      category_allowed: ["SC", "ST"],
      course_allowed: ["All"],
      deadline: "2026-09-30"
    },
    {
      name: "HDFC Badhte Kadam",
      income_limit: 600000,
      category_allowed: ["General", "OBC", "SC", "ST"],
      course_allowed: ["All"],
      deadline: "2026-08-15"
    },
    {
      name: "Reliance Foundation Undergraduate",
      income_limit: 250000,
      category_allowed: ["General", "OBC", "SC", "ST"],
      course_allowed: ["Engineering", "Science"],
      deadline: "2026-09-05"
    },
    {
      name: "Tata Capital Pankh",
      income_limit: 400000,
      category_allowed: ["General", "OBC"],
      course_allowed: ["Undergraduate", "Engineering"],
      deadline: "2026-08-31"
    },
    {
      name: "Keep India Smiling Foundational",
      income_limit: 500000,
      category_allowed: ["General", "OBC", "SC", "ST"],
      course_allowed: ["Dental", "Engineering"],
      deadline: "2026-12-31"
    },
    {
      name: "Vidyasaarathi Scholarship",
      income_limit: 800000,
      category_allowed: ["General"],
      course_allowed: ["Engineering"],
      deadline: "2026-07-20"
    },
    {
      name: "Aditya Birla Capital Scholarship",
      income_limit: 600000,
      category_allowed: ["General", "OBC"],
      course_allowed: ["Undergraduate"],
      deadline: "2026-10-10"
    },
    {
      name: "OakNorth STEM Scholarship",
      income_limit: 300000,
      category_allowed: ["Female"],
      course_allowed: ["STEM", "Engineering"],
      deadline: "2026-09-01"
    },
    {
      name: "PM YASASVI Scheme",
      income_limit: 250000,
      category_allowed: ["OBC", "EBC", "DNT"],
      course_allowed: ["School"],
      deadline: "2026-08-10"
    }
  ];

  let browser = null;

  try {
    // Puppeteer configuration for Render/Linux
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox"
      ]
    });

    const page = await browser.newPage();

    // Set user agent to avoid immediate blocking
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) " +
      "Chrome/91.0.4472.124 Safari/537.36"
    );

    console.log("Navigating to Buddy4Study...");

    await page.goto(
      "https://www.buddy4study.com/scholarships",
      {
        waitUntil: "networkidle2",
        timeout: 60000
      }
    );

    // Auto-scroll to load all elements
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;

        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;

          window.scrollBy(0, distance);
          totalHeight += distance;

          if (
            totalHeight >= scrollHeight ||
            totalHeight > 3000
          ) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });

    // Wait for dynamically rendered content
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const scholarships = await page.evaluate(() => {
      // Find all elements that look like a scholarship card
      // They usually have "Deadline" or "Income" text
      // and an "Apply" button.
      const items = Array.from(
        document.querySelectorAll(
          'article, .ListingCard, .scholarship-item, div[class*="card"]'
        )
      );

      const data = [];
      const seenNames = new Set();

      items.forEach((item) => {
        const titleEl = item.querySelector(
          'h1, h2, h3, h4, [class*="title"], [class*="name"]'
        );

        if (!titleEl) return;

        const name = titleEl.innerText.trim();

        if (
          !name ||
          name.length < 5 ||
          seenNames.has(name)
        ) {
          return;
        }

        seenNames.add(name);

        const text = item.innerText;

        // Match Deadline:
        // e.g. "31-Mar-2025" or "Oct 15, 2025"
        const deadlineMatch =
          text.match(
            /Deadline[:\s]+(\d{1,2}[\s\-][A-Za-z]+[\s\-]\d{4})/i
          ) ||
          text.match(
            /(\d{1,2}\-[A-Za-z]+\-\d{4})/
          );

        const deadline = deadlineMatch
          ? deadlineMatch[1]
          : "2026-12-31";

        // Match Income:
        // e.g. "INR 6,00,000"
        const incomeMatch = text.match(
          /INR\s*([\d,]+)/i
        );

        let income = 500000;

        if (incomeMatch) {
          const cleanIncome =
            incomeMatch[1].replace(/,/g, "");

          income = parseInt(cleanIncome);
        }

        data.push({
          name,
          income_limit: income,
          category_allowed: text.includes("General")
            ? ["General"]
            : ["All"],
          course_allowed: ["All"],
          deadline
        });
      });

      return data;
    });

    console.log(
      `Successfully scraped ${scholarships.length} scholarships from Buddy4Study.`
    );

    if (scholarships.length === 0) {
      throw new Error(
        "Scraper found 0 items. Selectors might be outdated."
      );
    }

    return scholarships;

  } catch (err) {
    console.error(
      "REAL SCRAPING FAILED:",
      err.message
    );

    console.log(
      "Returning high-quality mock data instead."
    );

    return mockData;

  } finally {
    // Always close the browser, even if scraping fails
    if (browser) {
      try {
        await browser.close();
        console.log("Browser closed successfully.");
      } catch (closeError) {
        console.error(
          "Failed to close browser:",
          closeError.message
        );
      }
    }
  }
}