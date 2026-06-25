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
   {
     id: "sign-up-email",
     triggers: [
       { event: "app/user.created" }, // ✅ v4 syntax
     ],
   },
   async ({ event, step }) => {
     const { email, name } = event.data;

     await step.run("send-welcome-email", async () => {
       await sendWelcomeEmail({
         email,
         name,
         intro: "Thanks for joining Signalist. Welcome aboard!",
       });
     });

     return { success: true };
   },
 );

 /**
  * -----------------------------
  * 2. DAILY NEWS EMAIL (CRON)
  * -----------------------------
  */

 export const sendDailyNewsSummaryCron = inngest.createFunction(
   {
     id: "daily-news-summary-cron",
     triggers: [
       { cron: "0 12 * * *" }, // ✅ v4 syntax
     ],
   },
   async ({ step }) => {
     await step.run("run-daily-news-email", async () => {
       await runDailyNewsEmail();
     });

     return { success: true };
   },
 );

 /**
  * -----------------------------
  * SHARED LOGIC
  * -----------------------------
  */

 async function runDailyNewsEmail() {
   const users = await getAllUsersForNewsEmail();

   if (!users?.length) {
     console.log("No users found for daily news email");
     return;
   }

   for (const user of users) {
     try {
       const symbols = await getWatchlistSymbolsByEmail(user.email);

       let articles = await getNews(symbols);

       if (!articles?.length) {
         articles = await getNews();
       }

       await sendNewsSummaryEmail({
         email: user.email,
         date: getFormattedTodayDate(),
         newsContent: JSON.stringify((articles || []).slice(0, 5), null, 2),
       });
     } catch (err) {
       console.error("Error sending email to:", user.email, err);
     }
   }
 }
