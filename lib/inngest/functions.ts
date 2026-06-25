import { inngest } from "@/lib/inngest/client";
import { sendNewsSummaryEmail, sendWelcomeEmail } from "@/lib/nodemailer";
import { getAllUsersForNewsEmail } from "@/lib/actions/user.actions";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getNews } from "@/lib/actions/finnhub.actions";
import { getFormattedTodayDate } from "@/lib/utils";

/**
 * -----------------------------
 * 1. SIGNUP WELCOME EMAIL
 * -----------------------------
 */
export const sendSignUpEmail = inngest.createFunction(
  { id: "sign-up-email" },
  { event: "app/user.created" },
  async ({ event }) => {
    const { email, name } = event.data;

    await sendWelcomeEmail({
      email,
      name,
      intro: "Thanks for joining Signalist. Welcome aboard!",
    });

    return {
      success: true,
      message: "Welcome email sent",
    };
  },
);

/**
 * -----------------------------
 * 2. DAILY NEWS EMAIL
 * -----------------------------
 */
export const sendDailyNewsSummary = inngest.createFunction(
  { id: "daily-news-summary" },
  [
    { event: "app/send.daily.news" },
    { cron: "0 12 * * *" }, // runs daily at 12:00
  ],
  async () => {
    // Step 1: Get all users
    const users = await getAllUsersForNewsEmail();

    if (!users || users.length === 0) {
      return {
        success: false,
        message: "No users found",
      };
    }

    // Step 2: Loop users and send news
    for (const user of users) {
      try {
        const symbols = await getWatchlistSymbolsByEmail(user.email);

        let articles = await getNews(symbols);

        // fallback if no watchlist news
        if (!articles || articles.length === 0) {
          articles = await getNews();
        }

        const newsContent = JSON.stringify(
          (articles || []).slice(0, 5),
          null,
          2,
        );

        await sendNewsSummaryEmail({
          email: user.email,
          date: getFormattedTodayDate(),
          newsContent,
        });
      } catch (err) {
        console.error("Error sending daily news to:", user.email, err);
      }
    }

    return {
      success: true,
      message: "Daily news emails sent",
    };
  },
);
