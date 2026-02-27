# App Flow Document

## Onboarding and Sign-In/Sign-Up

When a new user arrives at the Coliseum Analytics Engine, they first see a landing page that briefly explains the platform’s capabilities and invites them to log in or sign up. The landing page features a prominent call-to-action button labeled “Get Started,” which takes them to the authentication screen. On this screen, users can choose to sign up with their email address or sign in with an existing social account such as Google, if they prefer a faster option. To create an account with email, the user enters their name, email address, and a password that meets the security guidelines shown on screen. After submitting, they receive a verification email with a link to confirm their address. Once verified, the user is directed to the sign-in page to enter their credentials. If they already have an account, they simply enter their email and password and click “Sign In.”

If the user forgets their password, they click the “Forgot Password” link on the sign-in screen. They are prompted to enter their registered email address, and the system sends a secure reset link to that email. Clicking the link takes them to a page where they can set a new password. Once the new password is confirmed, they return to the sign-in screen and access the app with the updated credentials. A “Sign Out” button is available in the top navigation at all times to end the session securely, clearing any authentication tokens and returning the user to the landing page.

## Main Dashboard or Home Page

After a successful login, the user lands on the Main Dashboard. At the top of the screen sits the Coliseum logo on the left, a navigation bar with links to the Event Analytics tab, Global Leaderboards, and, for authorized administrators, the DIA Admin panel. On the right side of the header, the user’s name and avatar appear next to a settings icon and the Sign Out link. Below the header, a banner may appear reminding users of features that are gated by their current Stripe plan, with a button to upgrade if desired.

The default view of the Main Dashboard is the Event Analytics tab, which displays a row of KPI tiles showing total plays, votes, attendance, and revenue over a selected time range. Above these tiles, a date picker and time-range switcher let the user choose between hourly, daily, or custom intervals. Clicking on any KPI tile drills down into more detailed charts within the same tab. To move to the Global Leaderboards section, the user clicks its tab in the header, and to access admin features, they click the DIA Admin link if they have the necessary role.

## Detailed Feature Flows and Page Transitions

### Event Analytics Tab Flow

When the user selects the Event Analytics tab, the system fetches real-time aggregates from the backend and displays the KPI tiles in a gladiator-inspired style. The user can click the time-range switcher to change from a daily overview to an hourly or custom window. As soon as the user picks a new range, a loading spinner briefly appears before the updated figures animate into view. Each tile pulses to indicate fresh data arriving through the live Realtime channel.

If the user wants more context, they click the “View Details” link on a KPI tile. The page smoothly scrolls down to reveal interactive charts showing the metric’s trend over the selected period. Hovering over any point on the chart shows a tooltip with precise values. A back-to-top button appears at the bottom right corner so the user can quickly return to the KPI overview.

### Global Leaderboards Flow

From the header, clicking on the Global Leaderboards tab transitions the user to a page listing the top artists or events ranked by plays, votes, or revenue. A filter toolbar at the top lets the user choose a time window, city, or genre. Basic-plan users see a notice reminding them that refresh intervals are every five minutes, while Pro and Enterprise users see shorter refresh intervals based on their plan. Adjusting any filter triggers a brief shimmer animation on the leaderboard table and then shows updated ranks. Scrolling to the bottom of the list automatically loads more entries in a smooth pagination style.

### Generating and Sharing Reports Flow

To create a report, the user clicks the “Generate Report” button within either the Event Analytics or Leaderboards tab. A modal appears, letting them choose a PDF or JSON format. The user selects the format and clicks “Start Report.” An animated Coliseum gate appears over the screen, indicating that the back end is compiling the file. Once generation is complete, the modal displays a shareable link and QR code. If the user’s plan is Basic, the PDF shows a watermark and the link includes a note about upgrade options for watermark-free documents. The user can copy the link or download the file directly from this modal. Closing the modal returns them to the page where they started.

### DIA Admin Panel Flow

Administrators click the DIA Admin link in the header to access health and processing controls. The panel opens a dashboard of widgets that show queue depth, processing failures, and latency as live-updating charts. Each widget includes a small pause/resume toggle that lets the admin control the ingestion pipeline. Clicking the pause icon brings up a confirmation dialog explaining that new events will be held in the queue until resumed. Confirming the action updates the control state immediately. Below the widgets, an audit log table streams recent administrative actions in real time, with a search bar to filter by user or action type.

### Entitlement Banners and Upgrade Flow

Throughout the app, when a user tries to access a feature beyond their plan—such as real-time leaderboards for Basic users or unlimited reports for Pro—an entitlement banner appears at the top of the page. This banner explains the extra features available in higher tiers and includes an “Upgrade Now” button. Clicking this button opens a secure Stripe Checkout window where the user selects their desired plan. After successful payment, the app automatically refreshes entitlements without requiring a full page reload, and the newly unlocked features become accessible immediately.

### Monitoring and Notifications Flow

In the background, Sentry watches for errors and Supabase Realtime monitors pipeline metrics. If queue depth exceeds configured thresholds or error rates spike, the system sends alerts to email and a designated Slack channel. For critical issues like a down ingestion pipeline, PagerDuty is also notified. Users do not see these alerts directly in the UI, but admins can view notification history in the DIA Admin panel under a separate “Alerts” section.

## Settings and Account Management

Clicking the settings icon in the header opens the Account Settings page. Here, the user can update their name, email address, and password. Changing the email requires email verification to confirm the new address. A separate Notifications tab lets the user opt in or out of email alerts for pipeline issues or subscription events. Under the Billing section, the user sees their current Stripe plan, next billing date, and payment method. They can update payment details or cancel their subscription from this page. Any changes to plan or payment immediately reflect in the user’s entitlements and unlock or lock features accordingly. A “Back to Dashboard” link at the top left of the settings page returns the user to the Main Dashboard.

## Error States and Alternate Paths

If a user enters incorrect login credentials, the sign-in form displays a clear error message in red above the input fields, prompting them to try again or use the “Forgot Password” link. When a user navigates to a page they are not entitled to, the app shows an inline message explaining the restriction and offers the “Upgrade Now” button. If network connectivity is lost during any interaction, a persistent banner appears at the top of the screen saying “Connection Lost,” and the user can retry the action once connectivity is restored. During report generation, if an unexpected server error occurs, the modal shows an error icon and message, and a “Try Again” button lets the user restart the process. For any unhandled exceptions, the app captures details via Sentry and shows a generic “Something went wrong” page with a link back to the Main Dashboard.

## Conclusion and Overall App Journey

From the moment a user signs up with email or social login, they are guided through a secure authentication flow into a powerful analytics interface designed like a grand arena. The Main Dashboard provides immediate insights via live KPI tiles and quick access to leaderboards and report generation. Administrators have a dedicated panel for pipeline health, while entitlement banners and Stripe integration ensure that feature access aligns with each user’s subscription level. Account Settings offer control over personal details, notifications, and billing. Clear error messages and fallback pages keep users on track, even when something goes wrong. Overall, the Coliseum Analytics Engine delivers a seamless journey from sign-up to daily usage, allowing users to monitor event impact, generate shareable reports, and make data-driven decisions within a secure, high-performance environment.   