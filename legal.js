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

<h2>1. Acceptance and Scope</h2>
<p>These Terms and Conditions (the "Terms") are a binding agreement between you and Zenvyro ("Zenvyro", "we", "us", "our"). They apply to the Zenvyro website and app, including mining, membership packs, referrals, Exchange, Wallet, Transfer and Account features (together, the "App"). If you do not agree with any part of these Terms, do not register and do not use the App.</p>
<p>Registration is not possible unless you tick the box confirming that you agree to these Terms and the Privacy Policy. This is a deliberate safeguard so that every member has accepted the rules before taking part.</p>

<h2>2. About Zenvyro and ZENY</h2>
<p>Zenvyro is a digital rewards and community platform. Members run time-based mining sessions inside the App and receive ZENY, a digital reward unit issued and recorded by Zenvyro.</p>
<ul>
<li><b>What "mining" means here.</b> In Zenvyro, mining is an in-App, session-based reward process. A session lasts one hour. It does not use your phone's processing power to secure a public blockchain, and the figures shown on screen, such as Mining Power or Hash Rate, are informational values of the App and do not represent computing power contributed by your device.</li>
<li><b>What ZENY is.</b> ZENY is a digital reward unit inside the App. It is not legal tender, not a bank deposit, not a share or security, and not a guaranteed claim on any asset. ZENY does not currently trade on a public exchange, and nothing in the App promises that it ever will.</li>
<li><b>Reference rate.</b> The App shows a platform-set reference rate (currently 1 ZENY = 3 USDT) that is used for Exchange requests and for displaying approximate values. It is set by Zenvyro, it can be changed, and it is not a market price and not a promise that ZENY can be sold for that amount anywhere.</li>
</ul>

<h2>3. Our Mission and Goals</h2>
<p>Our aim is to build an easy, welcoming digital rewards community where anyone can take part for free and where members who choose to do more can access additional features. Our goals include:</p>
<ul>
<li>keeping a free way to earn ZENY open to every eligible member;</li>
<li>rewarding genuine community growth through a clear, published referral program;</li>
<li>providing simple, transparent Wallet, Exchange and Transfer tools, with fees shown before you confirm anything;</li>
<li>keeping members informed through the Update News and Community sections of the App; and</li>
<li>over the long term, working toward getting ZENY listed on recognised crypto exchanges, with Binance named as one of our target platforms.</li>
</ul>
<p><b>About exchange listings.</b> A listing is a goal, not a promise. Whether any exchange, including Binance, lists a token is decided only by that exchange under its own criteria and at its own discretion. No exchange has agreed to list ZENY unless we announce it officially in the App, and we cannot give any date or guarantee that a listing will happen. Binance and other exchanges are independent third parties; they are not affiliated with Zenvyro and do not sponsor or endorse it. Please do not buy a pack or deposit funds because you expect a listing or a rise in value.</p>

<h2>4. Eligibility</h2>
<p>To use the App you must:</p>
<ul>
<li>be at least 18 years old and have the legal capacity to enter into a binding agreement;</li>
<li>live in a place where using a service like this is lawful. You are responsible for checking and following the laws that apply to you, including rules about digital assets, taxes and online earnings;</li>
<li>not have been previously suspended or removed from Zenvyro; and</li>
<li>provide true, current and complete information when you register.</li>
</ul>

<h2>5. Registration, Account Security and the One-Account Rule</h2>
<ul>
<li><b>Registration details.</b> You must give your full name, a valid email address, a mobile number, a password and a referral code. The referral code is mandatory.</li>
<li><b>One person, one account.</b> Each person may hold only one account. Each device may be used for one account. We use technical checks, such as a device identifier, to apply this rule. Trying to avoid the rule (for example, by clearing data, using several browsers, emulators or other people's devices to create extra accounts) is a breach of these Terms.</li>
<li><b>Your password.</b> Keep it secret and do not reuse it elsewhere. You are responsible for everything that happens through your account. Tell us at once through Contact Support if you think someone else has access.</li>
<li><b>Verification.</b> Identity verification (KYC) is optional at the moment. We may make it required for certain actions, such as withdrawals, to protect members and meet legal duties.</li>
<li><b>Our staff will never ask for your password</b> or any one-time code. Never share them with anyone.</li>
</ul>

<h2>6. Free Mining</h2>
<p>Every member can mine for free on the Free Pack. No payment is required, now or later, to start mining or to keep your account.</p>
<ul>
<li><b>How a session works.</b> Tap the ZENY coin on the Home screen to start a one-hour session. You can tap the coin to pause; the time already completed is kept, and tapping again continues from the same point. When the full hour is complete, the coin shows Claim, and tapping it adds the reward to your Mining Available Balance.</li>
<li><b>Rewards are credited only on Claim</b> after a completed session. A session that you have not completed and claimed earns nothing.</li>
<li><b>Daily Reward figure.</b> The "Daily Reward" number shown in the App is an illustration of what 24 completed hourly sessions would produce at your pack's rate. It is not a guarantee and not a payment promise.</li>
<li><b>Changes.</b> We may change rates, session rules or limits to keep the system fair and sustainable. Changes apply from the time we announce them in the App and do not reduce rewards you have already claimed.</li>
</ul>
<table class="tb"><tr><th>Pack</th><th>ZENY per hour</th></tr>
<tr><td>Free</td><td>0.001984</td></tr><tr><td>Standard</td><td>0.002778</td></tr><tr><td>Silver</td><td>0.008681</td></tr><tr><td>Gold</td><td>0.021701</td></tr><tr><td>Platinum</td><td>0.063131</td></tr></table>

<h2>7. Membership Packs (Optional)</h2>
<p>Members who want more can choose a paid pack. A pack raises the hourly mining rate and the referral commission rate and adds extra features such as reports and support levels. Packs are optional and are never needed to use the App.</p>
<table class="tb"><tr><th>Pack</th><th>Price</th><th>Referral commission</th></tr>
<tr><td>Free</td><td>$0</td><td>2%</td></tr><tr><td>Standard</td><td>$10</td><td>4%</td></tr><tr><td>Silver</td><td>$25</td><td>6%</td></tr><tr><td>Gold</td><td>$50</td><td>8%</td></tr><tr><td>Platinum</td><td>$100</td><td>10%</td></tr></table>
<ul>
<li>You pay using the payment methods shown in the App at the time of purchase. We may verify a payment before activating a pack.</li>
<li>Prices, features and rates may change. A change does not affect a pack you have already bought for the period it was sold for.</li>
<li>Pack benefits and rewards are features of the App, not guaranteed earnings.</li>
<li>Pack purchases are final once the pack is activated, except where the law gives you a right to a refund or where we fail to deliver the pack you paid for.</li>
</ul>

<div class="lg-mid"><b>In short:</b> buying a pack is entirely your own choice. We are not responsible for any money you decide to invest, and you can always mine for free.</div>

<h2>8. Participation, Investment and Risk</h2>
<p>Please read this section with extra care, because it matters for your own money.</p>
<ul>
<li><b>Everything paid is voluntary.</b> Nobody is required to buy a pack, deposit funds or spend any money. You can take part and earn ZENY entirely for free, for as long as you like.</li>
<li><b>The decision is yours alone.</b> If you choose to buy a pack, deposit, exchange, transfer or hold digital assets, you do so of your own free will and at your own risk. Zenvyro does not pressure you, and no member, team leader or referrer speaks for Zenvyro when they encourage you to spend money.</li>
<li><b>No guaranteed returns.</b> We do not promise any profit, income, price, interest, listing or future value. Rates, balances and examples in the App describe how the App works; they are not forecasts or promises.</li>
<li><b>Digital assets are risky.</b> Prices of crypto assets such as BTC, TON, BNB, SOL and USDT can change sharply and can fall to zero. ZENY may never have a market value. Blockchain transactions cannot be reversed. You can lose some or all of any money you put in.</li>
<li><b>Only use money you can afford to lose.</b> Do not borrow, do not use savings you need for living costs, and do not sell property to join.</li>
<li><b>Do your own research.</b> Nothing in the App is financial, investment, legal or tax advice. Talk to a qualified professional if you are unsure.</li>
<li><b>Our responsibility.</b> To the fullest extent the law allows, Zenvyro is not responsible or liable for any loss, cost or damage that results from your decision to invest or spend money, from market movements, from mistakes you make (such as a wrong address or network), or from the actions of other members or third parties.</li>
<li><b>Be careful of scams.</b> Anyone who guarantees profit, asks for your password or one-time codes, or asks you to send funds outside the App is not acting for Zenvyro. Report them through Contact Support.</li>
</ul>

<h2>9. Referral Program</h2>
<p>Each member has a personal referral code and link on the Refer &amp; Earn page. New members must enter a valid referral code when they register. Referral rewards work as follows:</p>
<ul>
<li><b>Income Commission.</b> When one of your direct referrals claims mining rewards, you receive a percentage of the ZENY they claim. The percentage depends on the pack you hold when that person joins, and it is locked at that moment: Free 2%, Standard 4%, Silver 6%, Gold 8%, Platinum 10%.</li>
<li><b>Purchase Bonus.</b> When a direct referral buys their first pack, you receive 5% of that pack's price, once per referral. The Purchase Bonus is credited straight to your Wallet.</li>
<li><b>Direct referrals only.</b> Commission is paid on the people you personally refer. There are no multi-level payouts.</li>
<li><b>Daily claim at 10:00 PM.</b> Income Commission builds up as a pending amount. You can claim it once a day after 10:00 PM Bangladesh time (Asia/Dhaka, UTC+6), and only when something is pending.</li>
<li><b>Not guaranteed.</b> Commission exists only when real people join and take part. We do not promise any amount of referral income.</li>
</ul>
<p><b>Rules for referring.</b> You may share your code honestly. You may not refer yourself, create fake or duplicate accounts, trade referral codes in bulk, run referral loops, spam, or describe Zenvyro as a guaranteed way to make money. If we find abuse we may cancel commissions and bonuses, reverse rewards, suspend or close the accounts involved, and keep or remove related balances to the extent the law allows. We may change referral rates or rules by announcing the change in the App.</p>

<h2>10. Exchange</h2>
<p>Exchange lets you request to convert ZENY from your Mining Available Balance into USDT, BTC, TON, BNB or SOL.</p>
<ul>
<li><b>It is a request, not an instant trade.</b> When you send a request, the ZENY is put on hold. It is shown as On hold until an admin decides.</li>
<li><b>Acceptance.</b> If an admin accepts, the converted amount is credited to your Wallet at the rate at the time of acceptance. If an admin rejects, the held ZENY is returned to you in full.</li>
<li><b>Rates.</b> ZENY is valued at the platform reference rate. For BTC, TON, BNB and SOL, the market price at acceptance is taken from third-party price data, which can differ from other sources and can move between your request and acceptance.</li>
<li><b>Total fee of 10%.</b> A fee is deducted before the amount is credited. It is made up of an Exchange fee of 3%, a Network fee of 2% and a Platform fee of 5%. The App shows the full breakdown before you send the request.</li>
<li>We may limit, delay or pause Exchange for security, compliance, liquidity or maintenance reasons. Once a request has been accepted it cannot be cancelled.</li>
</ul>

<h2>11. Wallet, Deposits, Withdrawals and Transfers</h2>
<p>Your Wallet holds the assets credited to you (USDT, BTC, TON, BNB and SOL) and shows their approximate value in US dollars.</p>
<ul>
<li><b>Deposits.</b> Send only the asset, on the network, to the address shown in the App (for example USDT on TRC20 or BNB on BEP20), then submit the deposit request with the transaction ID. An admin verifies the payment and credits your Wallet. Nothing is credited before it is verified. Funds sent on the wrong network, to the wrong address or in the wrong asset may be lost permanently.</li>
<li><b>Withdrawals.</b> The minimum withdrawal is $10 (or the equivalent in the asset you choose) per request. Enter your own wallet address and choose the correct network. When you send a request, that amount is locked. An admin reviews it; if accepted, the funds are sent, and if rejected, the lock is released. We may ask for extra verification before approving a withdrawal. Blockchain transfers cannot be undone, so check the address carefully. If any additional network or processing charge applies, it will be shown in the App before you confirm.</li>
<li><b>Processing time.</b> We aim to review requests promptly, but we do not promise a fixed time. Reviews can take longer during security checks, heavy demand, maintenance or holidays.</li>
<li><b>Transfers.</b> You can send assets to another member using their ID. Transfers are instant, do not go through an admin and cannot be reversed by you or by us. Always check the recipient's ID. Transfers may not be used for fraud, harassment or to hide the source of funds.</li>
<li><b>Holds and reviews.</b> We may hold or review any transaction we reasonably believe is mistaken, suspicious, unlawful or in breach of these Terms.</li>
</ul>

<h2>12. Fees at a Glance</h2>
<table class="tb"><tr><th>Item</th><th>Fee</th></tr>
<tr><td>Free mining</td><td>No charge</td></tr>
<tr><td>Membership pack</td><td>The price shown for the pack</td></tr>
<tr><td>Exchange</td><td>10% in total (3% Exchange + 2% Network + 5% Platform)</td></tr>
<tr><td>Referral commission</td><td>No fee to the member who earns it</td></tr>
<tr><td>Deposits, withdrawals, transfers</td><td>Any Zenvyro fee is shown before you confirm. Charges made by blockchains or your own wallet or exchange are separate and outside our control.</td></tr></table>

<h2>13. Prohibited Conduct</h2>
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

<h2>14. Suspension, Termination and Forfeiture</h2>
<p>If we reasonably believe you have broken these Terms or the law, or that your account puts others at risk, we may warn you, limit features, freeze balances, cancel or reverse rewards and commissions, refuse withdrawals, and suspend or close your account. Where permitted by law, balances obtained through abuse, error or fraud may be forfeited. We will tell you the reason where we reasonably can, unless the law or security stops us from doing so. You may stop using the App at any time and may ask us to close your account through Contact Support; balances that are lawfully yours remain subject to review and to the withdrawal rules above.</p>

<h2>15. Service Availability and Changes</h2>
<p>We work to keep the App running, but we do not promise that it will always be available, error-free or secure from attack. We may update, change, suspend or discontinue any feature, with notice where practical. Phones, networks, wallets and blockchains are outside our control, and delays or failures there are not our responsibility.</p>

<h2>16. Third-Party Services and No Affiliation</h2>
<p>The App relies on third parties, such as hosting providers, price data providers, blockchain networks and, when enabled, sign-in providers such as Google and Telegram. We are not responsible for their services, outages or terms. Names of other companies and assets (including Binance, Bitcoin, Tether, TON, BNB and Solana) are used only to identify them. Their owners are not affiliated with Zenvyro and do not endorse it.</p>

<h2>17. Intellectual Property</h2>
<p>The Zenvyro name, logo, coin design, text, layout and code belong to Zenvyro or its licensors. You may use the App for your own personal use. You may not copy, sell, reverse-engineer or use our brand in a way that suggests you are Zenvyro without our written permission.</p>

<h2>18. Taxes</h2>
<p>You are solely responsible for working out and paying any taxes that apply to your rewards, commissions, purchases, exchanges, withdrawals or other gains. We do not give tax advice and we do not collect or pay taxes for you unless the law requires it.</p>

<h2>19. Disclaimers</h2>
<p>The App is provided "as is" and "as available". To the fullest extent the law allows, we disclaim all warranties, whether express or implied, including fitness for a particular purpose, uninterrupted service, accuracy of displayed figures and the value of ZENY or any other asset.</p>

<h2>20. Limitation of Liability</h2>
<p>To the fullest extent the law allows, Zenvyro, its owners, team and partners are not liable for indirect, incidental, special or consequential loss, loss of profit, loss of opportunity, loss of data or loss of digital assets, however caused. Where liability cannot be excluded, our total liability to you for any claim is limited to the amount you paid to Zenvyro for packs in the three months before the event that caused the claim. Nothing in these Terms removes rights that the law says cannot be removed.</p>

<h2>21. Indemnity</h2>
<p>You agree to compensate Zenvyro for loss or claims that result from your breach of these Terms, your unlawful use of the App, or your false promises made to others about Zenvyro, to the extent permitted by law.</p>

<h2>22. Privacy</h2>
<p>How we collect and use your information is explained in our Privacy Policy, which forms part of these Terms.</p>

<h2>23. Changes to These Terms</h2>
<p>We may update these Terms from time to time. We will show the new version in the App with a new "last updated" date, and where a change is important we will announce it in Update News. If you keep using the App after the change takes effect, you accept the new Terms. If you do not agree, stop using the App and ask us to close your account.</p>

<h2>24. Governing Law and Disputes</h2>
<p>These Terms are governed by the laws that apply in the place where Zenvyro operates, without regard to conflict-of-law rules. If you have a complaint, please contact us first so that we can try to resolve it fairly and quickly. If it cannot be resolved, it will be handled by the competent courts of that place, unless mandatory law gives you the right to go elsewhere.</p>

<h2>25. General</h2>
<p>If any part of these Terms is found unenforceable, the rest stays in force. Our failure to enforce a right is not a waiver of it. You may not transfer your account or rights to anyone else; we may transfer ours as part of a business change. These Terms are the complete agreement about the App and replace earlier understandings. The English version is the official one. We are not liable for delays or failures caused by events beyond our reasonable control.</p>

<h2>26. Contact</h2>
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
