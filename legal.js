/* Zenvyro — Terms & Conditions and Privacy Policy (full-screen reader).
   Opens with ZENVYRO_LEGAL.open("terms") or ZENVYRO_LEGAL.open("privacy").
   NOTE: this is a draft written from how the app works today. Have a qualified lawyer review it
   before you accept real users or real money, and keep it in sync whenever the rules change. */
(() => {
  "use strict";
  const UPDATED = "31 October 2026";
  const SHORT = '<div class="lg-end"><b>Please note:</b> buying a pack is entirely your own choice. Zenvyro is not responsible for any money you choose to invest, and you can always mine for free.</div>';

  const TERMS = `
<p class="lg-lead">Please read these Terms and Conditions carefully before you create an account or use Zenvyro. By ticking the agreement box when you register, and by continuing to use the app, you confirm that you have read, understood and accepted them, together with our Privacy Policy.</p>

<h2>1. Acceptance and Scope of Terms</h2>
<p>These Terms and Conditions (the "Terms") constitute a legally binding agreement between you and Zenvyro ("Zenvyro", "we", "us", or "our"). They govern your access to and use of the Zenvyro website and mobile application, including all features related to mining sessions, membership packs, referral programs, Exchange, Wallet, internal Transfers, and Account services (collectively, the "App").</p>
<p>Express consent to these Terms and our Privacy Policy is a mandatory prerequisite for account registration. By ticking the agreement box during registration and continuing to access or use the App, you confirm that you have read, understood, and accepted all provisions set forth herein.</p>

<h2>2. Nature of the Zenvyro Platform and ZENY</h2>
<p>Zenvyro is a digital rewards and community-driven platform where eligible members participate in timed activity sessions to earn "ZENY," an internal digital reward unit issued and recorded by Zenvyro.</p>
<ul>
<li><b>Definition of the Mining Process:</b> Within the Zenvyro ecosystem, "mining" refers to an in-App, time-based reward distribution mechanism operating in two-hour sessions. This process does not utilize your device's hardware or computational processing power to validate a public blockchain. Metrics displayed on screen, such as "Mining Power" or "Hash Rate," serve solely as informational indicators of internal platform functionality.</li>
<li><b>Nature of ZENY:</b> ZENY is a digital reward unit confined to the Zenvyro ecosystem. It does not represent legal tender, a bank deposit, a corporate share, or a financial security. Currently, ZENY operates within the platform's internal framework, and its future utility or expansion depends on the platform's ongoing development roadmap and operational policies.</li>
<li><b>Internal Reference Rate:</b> The App displays a platform-determined reference rate (currently set at 1 ZENY = 3 USDT), which is utilized exclusively for processing internal Exchange requests and displaying approximate balance equivalents. Zenvyro reserves the right to calibrate or update this reference rate to maintain ecosystem balance, and such rate shall not be construed as an open-market valuation.</li>
</ul>

<h2>3. Mission, Strategic Objectives &amp; Exchange Listing Policy</h2>
<p>Our primary mission is to foster an accessible, inclusive digital rewards community where eligible individuals can participate at no cost, while offering optional enhanced features for members seeking expanded utility. Our core objectives include:</p>
<ul>
<li>Maintaining a free-to-earn pathway for ZENY accessible to all eligible members;</li>
<li>Recognizing genuine community expansion through a transparent and published referral structure;</li>
<li>Providing straightforward Wallet, Exchange, and Transfer utilities with clear fee disclosures prior to transaction confirmation;</li>
<li>Keeping members informed via the App's Update News and Community channels; and</li>
<li>Working steadily over the long term toward listing ZENY on internationally recognized cryptocurrency exchanges, with Binance identified as one of our strategic target platforms.</li>
</ul>
<p><b>Exchange Listing Policy:</b> Pursuing public exchange listings for ZENY is a long-term strategic objective. The decision to list any digital asset on Binance or any other third-party exchange rests solely with the respective exchange authorities in accordance with their independent evaluation criteria and discretion. Unless officially announced within the App by Zenvyro, no exchange has entered into a listing agreement, nor can a specific timeline be established. Binance and other exchanges are independent third parties with no corporate affiliation, sponsorship, or endorsement relationship with Zenvyro. Members should base any decision to utilize platform features on current utility rather than expectations of future external market valuations.</p>

<h2>4. Eligibility Criteria</h2>
<p>To register for an account and utilize the App, you must satisfy the following conditions:</p>
<ul>
<li>You must be at least eighteen (18) years of age and possess the legal capacity to enter into a binding agreement under applicable law;</li>
<li>You must reside in a jurisdiction where accessing and using digital reward platforms is lawful. You bear sole responsibility for verifying and complying with local laws governing digital assets, taxation, and online activities;</li>
<li>You must not have been previously suspended, restricted, or removed from the Zenvyro platform for policy violations; and</li>
<li>You must provide accurate, current, and complete information during the registration process.</li>
</ul>

<h2>5. Registration, Account Security &amp; Single-Account Policy</h2>
<ul>
<li><b>Registration Information:</b> Creating an account requires your full legal name, a valid email address, an active mobile number, a secure password, and a valid referral code. Entering a referral code is mandatory for registration.</li>
<li><b>One Person, One Account Rule:</b> To preserve platform integrity, each individual is permitted to maintain only one account, and each device may be associated with a single account. Zenvyro employs technical verification mechanisms, including device identifiers, to enforce this standard. Any attempt to circumvent this rule—such as clearing application data, utilizing multiple browsers, employing emulators, or accessing external devices to operate duplicate accounts—constitutes a material breach of these Terms.</li>
<li><b>Password &amp; Account Protection:</b> Your password must be at least eight (8) characters long and incorporate uppercase letters, lowercase letters, numbers, and special symbols. You are responsible for safeguarding your credentials and for all activities conducted through your account. If you suspect unauthorized access, notify us immediately via Contact Support.</li>
<li><b>Identity Verification (KYC):</b> Know Your Customer (KYC) verification is currently optional. However, Zenvyro reserves the right to require identity verification for specific actions, such as withdrawals, to enhance member security and fulfill regulatory obligations.</li>
<li><b>Confidentiality Notice:</b> Zenvyro personnel and representatives will never request your account password or one-time verification codes (OTPs). Never disclose sensitive security credentials to any party.</li>
</ul>

<h2>6. Membership Packs (Optional Enhancements)</h2>
<p>Members seeking enhanced platform capabilities may optionally select a paid membership pack. Activating a pack increases hourly mining rates and referral commission tiers while unlocking supplementary reporting and support features. Purchasing a membership pack is entirely voluntary and is never required to access or use the App.</p>
<table class="tb"><tr><th>Membership Pack</th><th>Designated Price</th><th>Direct Referral Commission Rate</th></tr>
<tr><td>Free</td><td>0 TRX</td><td>2%</td></tr><tr><td>Standard</td><td>32 TRX</td><td>4%</td></tr><tr><td>Silver</td><td>80 TRX</td><td>6%</td></tr><tr><td>Gold</td><td>155 TRX</td><td>8%</td></tr><tr><td>Platinum</td><td>315 TRX</td><td>10%</td></tr></table>
<ul>
<li><b>Payment Methods:</b> Payments must be completed exclusively through the authorized payment channels displayed within the App at the time of purchase. Zenvyro reserves the right to verify payment confirmation prior to pack activation.</li>
<li><b>Modification of Pricing &amp; Features:</b> Zenvyro may update pack pricing, features, or rates periodically. Any such modification shall not affect active packs already purchased for the remainder of their valid term.</li>
<li><b>Nature of Pack Benefits:</b> Pack enhancements and reward multipliers constitute internal application features and do not represent guaranteed financial earnings.</li>
<li><b>Refund Policy:</b> Once a membership pack is activated, the transaction is considered final and non-refundable, except where required by applicable statutory law or in the event of a verified technical failure by Zenvyro to deliver the activated pack.</li>
</ul>

<h2>7. Participation, Financial Discretion &amp; Limitation of Liability</h2>
<p>Members are advised to review the following principles carefully prior to engaging in any optional financial transactions on the platform:</p>
<ul>
<li><b>Voluntary Participation:</b> Purchasing membership packs, depositing funds, or incurring any expenditure on the platform is strictly voluntary. Members may participate and earn ZENY completely free of charge indefinitely.</li>
<li><b>Independent Decision-Making:</b> All decisions to purchase packs, deposit, exchange, transfer, or hold digital assets are made independently at the member's sole discretion. Statements or encouragement from individual members, team leaders, or referrers do not represent official commitments or endorsements by Zenvyro.</li>
<li><b>Illustrative Metrics:</b> Rates, balances, and numerical examples displayed within the App are provided to demonstrate platform mechanics and shall not be interpreted as projections, interest commitments, or guarantees of future financial return.</li>
<li><b>Characteristics of Digital Assets:</b> Digital assets such as TRX, BTC, TON, BNB, SOL, and USDT are subject to market volatility, and blockchain transactions are inherently irreversible. Members should maintain awareness of digital asset dynamics prior to participating.</li>
<li><b>Prudent Resource Management:</b> Members should utilize only discretionary, surplus funds when engaging with digital platforms and refrain from using borrowed capital or funds allocated for essential living expenses.</li>
<li><b>No Professional Advice:</b> Information provided within the App does not constitute financial, investment, legal, or tax advice. Members should consult qualified professionals where appropriate.</li>
<li><b>Limitation of Liability:</b> To the maximum extent permitted by applicable law, Zenvyro shall not be liable for any losses, costs, or damages resulting from personal financial decisions, market fluctuations, user errors (such as entering incorrect wallet addresses or networks), or the actions of third parties.</li>
<li><b>Anti-Fraud &amp; Security Compliance:</b> Any individual promising guaranteed financial returns, soliciting account passwords or OTPs, or requesting fund transfers outside official App channels is not an authorized representative of Zenvyro. Report such conduct immediately via Contact Support.</li>
</ul>

<h2>8. Referral Program Guidelines</h2>
<p>Each member is assigned a unique referral code and link on the Refer &amp; Earn page. New registrants must enter a valid referral code upon sign-up. Referral rewards operate under the following rules:</p>
<ul>
<li><b>Income Commission:</b> When a direct referral claims mining rewards, you earn a percentage of their claimed ZENY. The applicable commission rate is determined and permanently locked based on the membership pack you hold at the exact time that referral registers: Free (2%), Standard (4%), Silver (6%), Gold (8%), and Platinum (10%).</li>
<li><b>Purchase Bonus:</b> When a direct referral completes their first paid membership pack purchase, you receive a one-time bonus equal to 5% of that pack's price, credited directly to your Wallet.</li>
<li><b>Commission Structure and Level Progress:</b> Income Commission and Purchase Bonus are earned solely from members you personally refer. In addition, your Level progress recognizes qualifying NFT and pack purchases made by your direct referrals and by the members they introduce (two layers). The benefits attached to each Level are described within the App and do not constitute guaranteed income.</li>
<li><b>Daily Claim Schedule:</b> Earned Income Commissions accumulate as a pending balance and may be claimed once daily after 10:00 PM Bangladesh Time (Asia/Dhaka, UTC+6), provided a pending balance is available.</li>
<li><b>Performance Dependency:</b> Referral rewards arise strictly from genuine activity by real, active participants and are not guaranteed in fixed amounts.</li>
<li><b>Referral Code of Conduct:</b> Members may share referral codes transparently. Self-referrals, creation of duplicate or automated accounts, bulk trading of referral codes, referral loops, spamming, or misrepresenting Zenvyro as a guaranteed income scheme are strictly prohibited. Violations may result in commission forfeiture, reward reversal, account suspension or closure, and balance adjustments in accordance with applicable law. Zenvyro may update referral rates or rules via official in-App announcements.</li>
</ul>

<h2>9. Exchange Mechanism</h2>
<p>The Exchange utility enables members to submit requests to convert ZENY from their Mining Available Balance into TRX, USDT, BTC, TON, BNB, or SOL.</p>
<ul>
<li><b>Request-Based Processing:</b> Exchange operates as a reviewed request system rather than an instant automated trade. Upon submission, the designated ZENY amount is placed "On Hold" pending administrative review.</li>
<li><b>Approval &amp; Rejection:</b> Upon administrative approval, the converted digital asset is credited to your Wallet based on the applicable exchange rate at the moment of approval. If a request is rejected, the held ZENY balance is returned to you in full.</li>
<li><b>Exchange Rate Calculation:</b> ZENY is valued using the platform's internal reference rate. For TRX, BTC, TON, BNB, and SOL, market conversion prices at the time of approval are sourced from third-party market data providers, which may fluctuate between request submission and administrative approval.</li>
<li><b>Total 10% Service Fee:</b> A cumulative fee of 10% is deducted prior to crediting your Wallet, comprising a 3% Exchange Fee, a 2% Network Fee, and a 5% Platform Fee. A complete fee breakdown is displayed prior to request confirmation.</li>
<li><b>Operational Controls:</b> Zenvyro may limit, delay, or pause Exchange functionality for security, compliance, liquidity management, or maintenance purposes. Once an Exchange request is approved, it becomes final and cannot be cancelled.</li>
</ul>

<h2>10. Wallet, Deposits, Withdrawals &amp; Internal Transfers</h2>
<p>Your in-App Wallet stores credited digital assets (TRX, USDT, BTC, TON, BNB, and SOL) and displays their approximate value in US Dollars (USD).</p>
<ul>
<li><b>Deposits:</b> Transfer only the specified asset on the designated blockchain network to the exact wallet address displayed in the App (e.g., TRX or USDT via TRC20, or BNB via BEP20), then submit a deposit request accompanied by the valid Transaction ID. Funds are credited only after administrative verification. Deposits sent via unsupported networks, incorrect addresses, or wrong assets may result in permanent loss.</li>
<li><b>Withdrawals:</b> The minimum withdrawal threshold is $10 USD (or equivalent asset value) per request. Enter your personal wallet address and select the corresponding network. Upon submission, the requested amount is locked pending review. Approved withdrawals are dispatched to your external wallet, whereas rejected requests release the locked funds back to your Wallet. Additional verification may be requested prior to approval. Blockchain transfers are irreversible; verify destination details carefully. Any applicable processing or network charges are disclosed prior to confirmation.</li>
<li><b>Airdrop Hold Requirement on Withdrawals:</b> For every withdrawal request, an additional 30% of the requested withdrawal amount must be available in your Wallet. Upon completion of the withdrawal, this 30% portion is automatically allocated to your "Hold Token for Airdrop" balance, visible in your Account Summary, and is non-withdrawable. The timeline, structure, and distribution volume of future airdrops remain subject to ongoing ecosystem development. This requirement is explicitly displayed on the withdrawal screen prior to confirmation.</li>
<li><b>Processing Timelines:</b> Zenvyro endeavors to review all requests promptly; however, fixed processing times are not guaranteed. Reviews may require additional time during security audits, high transaction volumes, system maintenance, or public holidays.</li>
<li><b>Internal Transfers:</b> Members may transfer assets instantly to other registered members using their unique Member ID. Internal transfers are automated, bypass administrative review, and are irreversible once executed, except where Zenvyro cancels a transfer in cases of error, suspected fraud or breach of these Terms. Verify the recipient's ID thoroughly before confirming. Transfers must not be used for fraudulent purposes, harassment, or obscuring the origin of funds.</li>
<li><b>Transaction Holds &amp; Reviews:</b> Zenvyro reserves the right to hold, freeze, or audit any transaction reasonably suspected of error, unauthorized activity, unlawful conduct, or breach of these Terms.</li>
</ul>

<h2>11. Summary of Platform Fees</h2>
<table class="tb"><tr><th>Service / Action</th><th>Applicable Fee Structure</th></tr>
<tr><td>Free Mining Sessions</td><td>No charge (Free)</td></tr>
<tr><td>Membership Packs</td><td>Listed price corresponding to the selected pack</td></tr>
<tr><td>Exchange Requests</td><td>10% Total (3% Exchange + 2% Network + 5% Platform Fee)</td></tr>
<tr><td>Referral Commissions</td><td>No fee charged to the earning member</td></tr>
<tr><td>Deposits, Withdrawals &amp; Transfers</td><td>Any applicable Zenvyro fee is disclosed prior to confirmation. External blockchain gas fees or third-party wallet/exchange charges operate independently outside Zenvyro's control.</td></tr></table>

<h2>12. Prohibited Conduct</h2>
<p>You must not:</p>
<ul>
<li>create more than one account, or use another person's account or device to get around the one-account rule;</li>
<li>use bots, scripts, emulators, VPN tricks, modified apps or any method that automates or manipulates mining, claims, referrals or balances;</li>
<li>exploit bugs or errors, or fail to report an error that credits you more than you should receive;</li>
<li>use the App for fraud, money laundering, terrorist financing, sanctions evasion or any other unlawful purpose;</li>
<li>give false information, impersonate others, or use stolen payment methods;</li>
<li>attack, probe, overload or reverse-engineer the App, or try to access other members' data;</li>
<li>promote Zenvyro with false claims, guaranteed-profit promises or misleading advertising, or pretend to speak for Zenvyro; or</li>
<li>harass, threaten or abuse members or our team.</li>
</ul>

<h2>13. Suspension, Termination and Forfeiture</h2>
<p>If we reasonably believe you have broken these Terms or the law, or that your account puts others at risk, we may warn you, limit features, freeze balances, cancel or reverse rewards and commissions, refuse withdrawals, and suspend or close your account. Where permitted by law, balances obtained through abuse, error or fraud may be forfeited. We will tell you the reason where we reasonably can, unless the law or security stops us from doing so. You may stop using the App at any time and may ask us to close your account through Contact Support; balances that are lawfully yours remain subject to review and to the withdrawal rules above.</p>

<h2>14. Service Availability and Changes</h2>
<p>We work to keep the App running, but we do not promise that it will always be available, error-free or secure from attack. We may update, change, suspend or discontinue any feature, with notice where practical. Phones, networks, wallets and blockchains are outside our control, and delays or failures there are not our responsibility.</p>

<h2>15. Third-Party Services and No Affiliation</h2>
<p>The App relies on third parties, such as hosting providers, price data providers, blockchain networks and, when enabled, sign-in providers such as Google and Telegram. We are not responsible for their services, outages or terms. Names of other companies and assets (including Binance, TRON, Bitcoin, Tether, TON, BNB and Solana) are used only to identify them. Their owners are not affiliated with Zenvyro and do not endorse it.</p>

<h2>16. Intellectual Property</h2>
<p>The Zenvyro name, logo, coin design, text, layout and code belong to Zenvyro or its licensors. You may use the App for your own personal use. You may not copy, sell, reverse-engineer or use our brand in a way that suggests you are Zenvyro without our written permission.</p>

<h2>17. Taxes</h2>
<p>You are solely responsible for working out and paying any taxes that apply to your rewards, commissions, purchases, exchanges, withdrawals or other gains. We do not give tax advice and we do not collect or pay taxes for you unless the law requires it.</p>

<h2>18. Disclaimers</h2>
<p>The App is provided "as is" and "as available". To the fullest extent the law allows, we disclaim all warranties, whether express or implied, including fitness for a particular purpose, uninterrupted service, accuracy of displayed figures and the value of ZENY or any other asset.</p>

<h2>19. Limitation of Liability</h2>
<p>To the fullest extent the law allows, Zenvyro, its owners, team and partners are not liable for indirect, incidental, special or consequential loss, loss of profit, loss of opportunity, loss of data or loss of digital assets, however caused. Where liability cannot be excluded, our total liability to you for any claim is limited to the amount you paid to Zenvyro for packs in the three months before the event that caused the claim. Nothing in these Terms removes rights that the law says cannot be removed.</p>

<h2>20. Indemnity</h2>
<p>You agree to compensate Zenvyro for loss or claims that result from your breach of these Terms, your unlawful use of the App, or your false promises made to others about Zenvyro, to the extent permitted by law.</p>

<h2>21. Privacy</h2>
<p>How we collect and use your information is explained in our Privacy Policy, which forms part of these Terms.</p>

<h2>22. Changes to These Terms</h2>
<p>We may update these Terms from time to time. We will show the new version in the App with a new "last updated" date, and where a change is important we will announce it in Update News. If you keep using the App after the change takes effect, you accept the new Terms. If you do not agree, stop using the App and ask us to close your account.</p>

<h2>23. Governing Law and Disputes</h2>
<p>These Terms are governed by the laws that apply in the place where Zenvyro operates, without regard to conflict-of-law rules. If you have a complaint, please contact us first so that we can try to resolve it fairly and quickly. If it cannot be resolved, it will be handled by the competent courts of that place, unless mandatory law gives you the right to go elsewhere.</p>

<h2>24. General</h2>
<p>If any part of these Terms is found unenforceable, the rest stays in force. Our failure to enforce a right is not a waiver of it. You may not transfer your account or rights to anyone else; we may transfer ours as part of a business change. These Terms are the complete agreement about the App and replace earlier understandings. The English version is the official one. We are not liable for delays or failures caused by events beyond our reasonable control.</p>

<h2>25. Contact</h2>
<p>For questions, complaints or requests, open Account, then Help &amp; Support, then Contact Support inside the App.</p>
${SHORT}`;

  const PRIVACY = `
<p class="lg-lead">Your privacy matters to us. This Privacy Policy explains what information Zenvyro collects, why we collect it, how we use and protect it, and the choices and rights you have. By using the App you agree to the practices described here.</p>

<h2>1. Who We Are</h2>
<p>Zenvyro ("we", "us") runs the Zenvyro website and app. For privacy questions, use Account, then Help &amp; Support, then Contact Support inside the App. This policy should be read together with our Terms and Conditions.</p>

<h2>2. Information We Collect</h2>
<p><b>Information you give us</b></p>
<ul>
<li>Registration details: full name, email address, mobile number, referral code and password. Your password is stored only as a one-way hash, never in plain text.</li>
<li>Profile details you choose to add or edit, such as a profile photo.</li>
<li>Optional verification (KYC) details, if you choose to provide them.</li>
<li>Wallet addresses, transaction IDs and amounts that you enter for deposits, withdrawals and transfers.</li>
<li>Messages and attachments you send to Support.</li>
</ul>
<p><b>Information created by using the App</b></p>
<ul>
<li>Mining sessions, claims, balances and pack information.</li>
<li>Referral activity: who joined with your code, and commissions and bonuses calculated for you.</li>
<li>Exchange, Wallet and Transfer requests, their status and history.</li>
<li>Notification and preference settings.</li>
</ul>
<p><b>Technical information</b></p>
<ul>
<li>A device identifier that we use to apply the one-account-per-device rule.</li>
<li>Browser or device type, language, time zone, IP address and the time of your actions.</li>
<li>Login activity, such as when and from where your account was accessed.</li>
</ul>
<p><b>Information from others</b></p>
<ul>
<li>If sign-in with Google or Telegram is enabled, we receive the basic profile details you allow that provider to share.</li>
<li>When you open Exchange, your browser may ask a third-party price service for current crypto prices. That service can see your IP address and the request.</li>
</ul>

<h2>3. Where Your Information Is Stored</h2>
<p>In the current version of the App, much of your information, including account details, session data and settings, is stored on your own device in your browser's local storage. If you clear your browser data or switch devices, that information may not be available. Where server features are switched on, information is also processed on servers run by us or by service providers who work for us. We will keep this section accurate as the App develops.</p>

<h2>4. How We Use Your Information</h2>
<ul>
<li>To create and manage your account and log you in.</li>
<li>To run mining sessions, claims, packs, referrals, Exchange, Wallet and Transfer features, and to work out rewards, commissions and fees.</li>
<li>To check and process deposit, withdrawal and exchange requests.</li>
<li>To prevent fraud, duplicate accounts, abuse and security incidents, including by applying the one-account rule.</li>
<li>To answer your questions and provide support.</li>
<li>To send service messages such as security alerts, request updates and changes to our terms.</li>
<li>To improve and fix the App and understand how it is used.</li>
<li>To meet legal duties and respond to lawful requests.</li>
</ul>

<h2>5. Legal Bases (Where Required)</h2>
<p>If you are in a place such as the European Economic Area or the United Kingdom, we use your information on these bases: to carry out our agreement with you; for our legitimate interests in running, securing and improving the App and preventing abuse; to comply with the law; and, where needed, with your consent, which you can withdraw at any time.</p>

<h2>6. How We Share Information</h2>
<p>We do not sell your personal information. We share it only in these situations:</p>
<ul>
<li><b>Service providers</b> who help us run the App, such as hosting, security, customer support and analytics, under duties to protect it.</li>
<li><b>Other members</b>, only as needed for features you use. For example, a member sending you a transfer sees your member ID, and your referrer can see that you joined with their code.</li>
<li><b>Blockchain networks.</b> Transactions you make on a blockchain are public and permanent, and we cannot erase them.</li>
<li><b>Authorities and advisers</b> when the law requires it, or when we need to protect our rights, our members or the public, or to investigate fraud.</li>
<li><b>A successor</b> if the business is merged, sold or reorganised, with the same protections for your information.</li>
<li><b>Anyone else</b> only with your consent.</li>
</ul>

<h2>7. Cookies and Local Storage</h2>
<p>The App uses your browser's local and session storage to keep you logged in (if you choose Remember Me), to remember settings, to apply the one-account rule and to store app data on your device. You can clear this at any time in your browser settings, but parts of the App may stop working and you may be logged out.</p>

<h2>8. Security</h2>
<p>We use reasonable technical and organisational measures to protect your information, including one-way password hashing, limits on login attempts and access controls. No system is completely secure. You help protect your account by using a strong, unique password, keeping it private, and logging out on shared devices. Contact Support immediately if you suspect misuse.</p>

<h2>9. How Long We Keep Information</h2>
<p>We keep information for as long as your account is active and as long as needed to provide the App, to resolve disputes, to prevent fraud and to meet legal and accounting duties. After that we delete it or make it anonymous, unless the law requires us to keep it longer.</p>

<h2>10. Your Rights and Choices</h2>
<p>Depending on where you live, you may have the right to:</p>
<ul>
<li>access the personal information we hold about you;</li>
<li>correct information that is wrong or incomplete;</li>
<li>delete your information or close your account;</li>
<li>restrict or object to certain uses;</li>
<li>receive a copy of your information in a portable format;</li>
<li>withdraw consent you have given; and</li>
<li>complain to your local data protection authority.</li>
</ul>
<p>If you live in California or a similar region, you may also have the right to know what we collect, to have it deleted or corrected, and to be free from discrimination for using these rights. We do not sell or share personal information for advertising. To use any right, contact Support through the App. We may need to confirm your identity first, and we may keep information we are required or permitted by law to keep, such as records needed to prevent fraud.</p>

<h2>11. International Transfers</h2>
<p>Our service providers and systems may be located in other countries, which can have different data protection laws from your own. When we transfer information across borders, we take steps to make sure it stays protected as this policy describes.</p>

<h2>12. Children</h2>
<p>The App is only for people aged 18 and over. We do not knowingly collect information from anyone under 18. If you believe a child has registered, contact us and we will take steps to delete the information.</p>

<h2>13. Automated Checks</h2>
<p>We use automated checks, such as device and duplicate-account detection and login-attempt limits, to protect the App. These checks can lead to a request being held or an account being restricted. If you believe a decision is wrong, contact Support and a person will review it.</p>

<h2>14. Third-Party Links and Services</h2>
<p>The App may link to or work with third-party sites and services, such as price providers, blockchain explorers, Telegram or Google. They have their own privacy practices, and we are not responsible for them. Please read their policies.</p>

<h2>15. Messages From Us</h2>
<p>We send service messages that are needed to run your account. If we send news or promotional messages, you will be able to choose not to receive them, except for essential service and security messages.</p>

<h2>16. Changes to This Policy</h2>
<p>We may update this policy as the App or the law changes. The new version will show a new "last updated" date in the App, and we will announce important changes in Update News. Using the App after the change means you accept the updated policy.</p>

<h2>17. Contact Us</h2>
<p>For any question about this policy or your information, open Account, then Help &amp; Support, then Contact Support inside the App.</p>
${SHORT}`;

  const DOCS = { terms: { title: "Terms & Conditions", html: TERMS }, privacy: { title: "Privacy Policy", html: PRIVACY } };

  const css = `
#zvLegal{position:fixed;inset:0;z-index:40;display:none;flex-direction:column;background:radial-gradient(ellipse at 50% -10%,#2b1580 0,#0b0726 45%,#04040e 100%);color:#fff}
#zvLegal.open{display:flex}
#zvLegal *{box-sizing:border-box}
#zvLegal .hd{padding:calc(12px + env(safe-area-inset-top,0px)) 14px 10px;border-bottom:1px solid #2b2466;background:#0a0628ee;backdrop-filter:blur(10px)}
#zvLegal .top{display:flex;align-items:center;gap:12px}
#zvLegal .bk{width:42px;height:42px;border-radius:50%;border:1px solid #6d3cff;background:#241673;color:#fff;display:grid;place-items:center;padding:0;flex-shrink:0}
#zvLegal .bk svg{width:22px;height:22px}
#zvLegal .tt{flex:1;min-width:0}
#zvLegal .tt b{display:block;font-size:19px;line-height:1.2}
#zvLegal .tt small{color:#b9aef0;font-size:12px}
#zvLegal .tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:11px}
#zvLegal .tabs button{height:38px;border-radius:19px;border:1px solid #4a2fb4;background:#150d4e;color:#cfc4ff;font:inherit;font-size:13px;font-weight:700;padding:0}
#zvLegal .tabs button.on{background:linear-gradient(95deg,#a13dff,#5b2dff);border-color:#b283ff;color:#fff}
#zvLegal .bd{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:16px 16px calc(34px + env(safe-area-inset-bottom,0px))}
#zvLegal .in{max-width:760px;margin:0 auto;font-size:15px;line-height:1.72;color:#e6e1ff}
#zvLegal h2{font-size:18px;line-height:1.3;margin:26px 0 8px;color:#fff;padding-top:4px;border-top:1px solid #2b2466}
#zvLegal p{margin:0 0 11px}
#zvLegal ul{margin:0 0 12px;padding-left:20px}
#zvLegal li{margin-bottom:8px}
#zvLegal b{color:#fff}
#zvLegal .lg-lead{font-size:15.5px;color:#fff;border:1px solid #4a3a82;background:#ffffff08;border-radius:14px;padding:13px 14px}
#zvLegal .toc{border:1px solid #3a3277;border-radius:14px;background:#0d0838;margin:12px 0 4px;padding:0 14px}
#zvLegal .toc summary{padding:13px 0;font-weight:700;color:#d9ccff;cursor:pointer}
#zvLegal .toc a{display:block;color:#b98aff;padding:7px 0;border-top:1px solid #231c58;font-size:14px;text-decoration:none}
#zvLegal .tb{width:100%;border-collapse:collapse;margin:4px 0 14px;font-size:14px;border:1px solid #3a3277;border-radius:12px;overflow:hidden}
#zvLegal .tb th,#zvLegal .tb td{padding:10px 12px;text-align:left;border-bottom:1px solid #2b2466;vertical-align:top}
#zvLegal .tb th{background:#1a1060;color:#e4d9ff}
#zvLegal .lg-mid{margin:18px 0;padding:14px;border-radius:14px;border:1.5px solid #c06cff;background:linear-gradient(100deg,#2a1180,#150a50);box-shadow:0 0 18px #8a3dff44;font-size:15px}
#zvLegal .lg-end{margin:28px 0 6px;padding:11px 13px;border-radius:12px;border:1px solid #3a3277;background:#ffffff08;font-size:13px;line-height:1.55;color:#cfc8f5}`;
  const BACK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11.5 5.5L5 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  let root = null, bd = null, cur = "terms", prevOverflow = "";
  const mins = html => Math.max(1, Math.round(html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length / 200));

  function build() {
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    root = document.createElement("div"); root.id = "zvLegal"; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true");
    root.innerHTML = `<div class="hd"><div class="top"><button class="bk" type="button" id="lgBack" aria-label="Close">${BACK}</button><div class="tt"><b id="lgTitle"></b><small id="lgMeta"></small></div></div>
      <div class="tabs"><button type="button" data-k="terms">Terms &amp; Conditions</button><button type="button" data-k="privacy">Privacy Policy</button></div></div>
      <div class="bd" id="lgBody"><div class="in" id="lgIn"></div></div>`;
    document.body.appendChild(root);
    bd = document.getElementById("lgBody");
    root.addEventListener("click", e => {
      const b = e.target.closest("button,a"); if (!b) return;
      if (b.id === "lgBack") { close(); return; }
      if (b.dataset && b.dataset.k) { show(b.dataset.k); return; }
      if (b.dataset && b.dataset.t) { e.preventDefault(); const h = document.getElementById("lgIn").querySelectorAll("h2")[+b.dataset.t]; if (h) h.scrollIntoView({ behavior: "smooth", block: "start" }); }
    });
  }
  function show(kind) {
    cur = DOCS[kind] ? kind : "terms";
    const d = DOCS[cur], inner = document.getElementById("lgIn");
    inner.innerHTML = d.html;
    const hs = inner.querySelectorAll("h2");
    const toc = document.createElement("details"); toc.className = "toc";
    toc.innerHTML = "<summary>Contents</summary>" + Array.from(hs).map((h, i) => `<a href="#" data-t="${i}">${h.textContent}</a>`).join("");
    const lead = inner.querySelector(".lg-lead"); if (lead) lead.after(toc);
    document.getElementById("lgTitle").textContent = d.title;
    document.getElementById("lgMeta").textContent = "Last updated " + UPDATED + " · about " + mins(d.html) + " min read";
    root.querySelectorAll(".tabs button").forEach(b => b.classList.toggle("on", b.dataset.k === cur));
    bd.scrollTop = 0;
  }
  function open(kind) {
    if (!root) build();
    show(kind);
    prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    root.classList.add("open");
  }
  function close() { if (!root) return; root.classList.remove("open"); document.documentElement.style.overflow = prevOverflow; }

  window.ZENVYRO_LEGAL = { open, close, version: UPDATED };
})();
