import MarketingShell from '../components/MarketingShell';

export function Privacy(){
  return <MarketingShell><article className="legal-page"><span className="eyebrow">Privacy</span><h1>Privacy & family data</h1>
    <p>Kiddo is designed around parent-managed accounts and child profiles. Conversation, profile and generated-media data is associated with the parent account and stored by the service so the experience can continue across sessions.</p>
    <h2>What we store</h2><p>Parent account details, child profile settings, conversation history, parent controls, credit records and generated media needed to provide the service.</p>
    <h2>Child safety and memory</h2><p>Conversation memory is parent-controlled. Kiddo is instructed not to request addresses, passwords, exact location, school details, phone numbers or other sensitive information from children.</p>
    <h2>Parent controls</h2><p>Parents can export family data, delete child profiles and delete the family account from Parent Controls.</p>
    <h2>Generated media</h2><p>Pictures and music are stored privately and require an authenticated family session to access.</p>
    <p className="legal-note">This product still requires jurisdiction-specific legal review before broad public child registration. The current deployment is intended for controlled testing and client handover.</p>
  </article></MarketingShell>;
}

export function Terms(){
  return <MarketingShell><article className="legal-page"><span className="eyebrow">Terms</span><h1>Terms of use</h1>
    <p>Kiddo is a parent-controlled creative AI companion intended for supervised family use. A parent or legal guardian must create and manage the account.</p>
    <h2>Parent responsibility</h2><p>Parents control child profiles, voice, media creation, memory and daily limits, and remain responsible for supervising use appropriate to their family.</p>
    <h2>AI-generated content</h2><p>AI responses and generated media can be imperfect. Safety controls reduce risk but do not replace parental supervision, professional advice or emergency services.</p>
    <h2>Acceptable use</h2><p>Do not use the service for unlawful, abusive, exploitative or harmful activity, or to bypass the child-safety controls.</p>
    <h2>Availability</h2><p>AI features depend on configured external providers and may occasionally be unavailable. Failed paid-generation actions are designed to refund the corresponding in-app credits.</p>
  </article></MarketingShell>;
}

export function Contact(){
  return <MarketingShell><article className="legal-page contact-page"><span className="eyebrow">Contact</span><h1>Talk to Amarktai Kiddo</h1>
    <p>For product, account, client-handover or safety questions, contact the Amarktai Network team.</p>
    <a className="contact-card" href="mailto:amarktainetwork@gmail.com"><b>amarktainetwork@gmail.com</b><span>Email support</span></a>
  </article></MarketingShell>;
}
