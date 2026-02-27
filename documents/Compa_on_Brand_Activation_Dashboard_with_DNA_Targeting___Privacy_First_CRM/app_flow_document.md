# App Flow Document for Compañon

## Onboarding and Sign-In/Sign-Up

When a brand administrator first visits the Compañon landing page, they are greeted with a clear description of the platform and an invitation to create an account. They click on the “Sign Up” button and enter their email address and a secure password. An email verification link is sent to confirm their address. After verification, the user is taken back to the app where they see a privacy-opt-in screen. They must explicitly check the box stating “I agree to share my data with Compañon for campaign participation and personalized experiences” before proceeding. This consent action is logged by Passport for compliance. Once consent is recorded, the administrator is guided through a short setup wizard that asks them to choose between staging or production on Vercel, connect their custom domain, and invite their team by email, assigning roles such as Campaign Manager or Creator.

Existing brand users can click “Sign In” on the landing page and enter their credentials to access the dashboard. If they forget their password, they select “Forgot Password,” enter their email, and receive a reset link. They follow that link to set a new password and then return to sign in. A “Sign Out” option is always available in the user menu at the top right of the screen.

Fans and creators do not need full brand accounts. When fans encounter a QR activation, they scan a code and are prompted to provide minimal information and consent. Creators invited to a campaign receive an email with a special link that guides them through the sign-up or sign-in process before accessing their creator dashboard.

## Main Dashboard or Home Page

After signing in, brand administrators land on the Dashboard Home page. Across the top is a header showing the brand logo, a language selector defaulting to English or Spanish, and the user’s profile menu with account and sign-out options. On the left is a collapsible sidebar listing key areas: Dashboard Home, DNA Query Builder, Campaign Builder, Campaigns, Analytics, CRM, and Settings. The center of the page displays overview cards for active campaigns, QR scans, total spend, and recent activity. Quick action buttons let administrators jump directly to building a new audience or launching a campaign.

Campaign Managers see a similar layout but without the brand settings link. Creators who log in see a simplified home page listing campaigns they are involved in and their personal performance stats. Fans who sign in to manage their engagement see a Locker view with unlocked content, a history of scans and surveys, and a link to adjust their consent preferences.

From the Dashboard Home, users click on sidebar items or top navigation links to move to other parts of the app. Clicking “DNA Query Builder” opens the audience segmentation tool, and “Campaign Builder” launches the campaign creation wizard.

## Detailed Feature Flows and Page Transitions

### DNA Query Builder Flow

When a user selects “DNA Query Builder,” the page loads a visual interface on a dark blue background. The user sees filter panels for culture, behavior, economics, and location. As they adjust sliders or select checkboxes, the right side of the screen updates with a real-time aggregated audience preview. RLS rules ensure only opted-in data appears, and every change is logged by Passport. Once the segment matches their needs, the user clicks “Save Audience,” enters a name, and it is added to their CRM list.

### Campaign Builder Flow

Clicking “Campaign Builder” opens a step-by-step wizard. The first step asks the user to choose a campaign type—Locker Drop, Event Partnership, or QR Activation—and to select a saved audience if available. The second step prompts for creative uploads or sponsorship details, scheduling parameters, geofence coordinates, scan limits, and device fingerprinting options for QR campaigns. In the third step, the user reviews tiered consent checkboxes for additional data capture. All checkboxes are unchecked by default. The final step displays a payment summary powered by Stripe, where the user enters their payment details or applies a coupon. After confirming, the wizard shows a success screen and redirects to the Campaigns list.

### Campaign Management Flow

In the “Campaigns” section, users see a list of all active and past campaigns as cards or table rows. Each entry shows status, budget spent, and key metrics. Clicking on a campaign opens its detail view. Here administrators and campaign managers can pause, resume, duplicate, or edit campaign settings. Fraud alerts flagged by Coliseum appear as warnings, and a manual review button lets the user inspect suspicious activity. All modifications update in real time and are recorded in Passport for audit.

### Analytics Dashboard Flow

Selecting “Analytics” brings up a page with tabs for overall performance, QR insights, and DNA segment comparisons. The user can apply date filters or select multiple campaigns for side-by-side comparison. Charts show reach, engagement, conversion rates, ROI, and scan counts by location. Below the charts, AI-driven trend predictions and sentiment summaries from Claude 3.5 Sonnet appear. Each data fetch respects privacy defaults and is subject to RLS enforcement. Hovering over a data point shows tooltips with more detail.

### CRM Tools Flow

In “CRM,” the user finds saved audiences, contact lists, and individual profiles. Clicking a list shows all contacts with their consent statuses. Selecting a contact opens a profile page that displays engagement history, unlocked content, and survey responses with sentiment analysis themes. If the contact updates their consent preferences, the user toggles new settings, and Passport immediately logs the change. A back button returns the user to the CRM overview.

### Mobile QR Activation Flow

When a fan scans a campaign QR code on their mobile device, they land on a mobile-responsive survey page styled in dark mode. A clear consent checkbox must be checked before proceeding. Behind the scenes, geolocation and device fingerprinting run to prevent fraud. After consenting, the fan completes a brief survey, submits responses, and receives a confirmation screen indicating content is added to their Locker. All interactions sync instantly to the brand’s dashboard.

### Creator Flow

Creators invited to collaborate see a special dashboard listing their assigned campaigns. They can upload assets, view personal performance metrics, and access campaign-specific instructions. They cannot modify brand settings or view CRM data. A “My Profile” link allows them to update their information and language preferences.

## Settings and Account Management

The “Settings” page is accessible from the sidebar for administrators and campaign managers. The first section is “Account,” where users update their name, email, password, and preferred language. The next section is “Brand Settings” for administrators, which includes domain settings, Vercel environment toggles (staging or production), and team management. Inviting a new team member opens a modal for entering their email and assigning a role, after which Passport logs the invitation. The “Billing” section shows the current subscription or pay-per-campaign plan, upcoming invoices, and a link to manage payment methods via Stripe. The “Notifications” section lets users toggle email alerts and in-app notifications. After any settings change, a “Save” button returns them to their previous page or the main dashboard.

Fans can access their “Profile Settings” through the menu to adjust consent preferences, view unlocked content, or request data deletion. Changes here are also recorded by Passport and respect GDPR and CCPA rules.

## Error States and Alternate Paths

If a user enters invalid credentials, the login form displays an inline error message explaining the issue. During signup, if the email is already in use or the password is too weak, clear messages prompt correction. If the password reset link expires, the user is asked to request a new link. Network interruptions show a banner at the top indicating connectivity issues and a retry button.

When a user without proper permission tries to access a restricted page, they see an “Unauthorized” message with a link back to their dashboard. During campaign creation, if payment fails, the wizard highlights the payment step with an error message from Stripe and allows the user to re-enter card details. In the DNA Query Builder, if a third-party API call to MediaID DNA or Coliseum times out, the interface shows a friendly notice and an option to retry the query.

## Conclusion and Overall App Journey

From first arriving on the landing page and creating an account to launching and managing campaigns, Compañon guides brand administrators through every step with a clear, privacy-safe experience. They start by verifying their email and granting consent, then configure their brand and billing. Next, they discover audiences in the DNA Query Builder and build campaigns with robust anti-fraud measures. After campaigns go live, they monitor performance through real-time analytics and AI-powered insights. They engage with fans via mobile QR activations and collect survey data that feeds into a privacy-first CRM. Throughout this journey, all actions and data accesses are securely logged in Passport, ensuring trust, compliance, and seamless collaboration among brand admins, campaign managers, creators, and fans.