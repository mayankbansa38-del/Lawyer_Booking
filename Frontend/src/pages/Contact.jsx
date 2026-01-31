import "./Contact.css";


export default function LawyerContact() {
return (
<div className="contact-wrapper">
<h1 className="contact-title">Contact Us</h1>
<p className="contact-subtitle">
Our legal professionals are committed to protecting your rights and
providing clear, strategic legal guidance you can trust.
</p>


<div className="contact-container">
{/* Left Card */}
<div className="contact-info-card">
<h3>Contact Information</h3>
<p>
If you need legal advice, representation, or have general inquiries,
please reach out to our law office. All consultations are handled
with complete confidentiality.
</p>


<ul className="info-list">
<li>
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '10px', verticalAlign: 'middle'}}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
  +91 9876543210
</li>
<li>
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '10px', verticalAlign: 'middle'}}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
  legal.support@Project.com
</li>
<li>
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '10px', verticalAlign: 'middle'}}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
  Ghumarwin, District Bilaspur, Himachal Pradesh, India
</li>
</ul>
</div>


{/* Right Card */}
<div className="contact-form-card">
<h3>Get Legal Assistance</h3>
<p>
Submit your details and a member of our legal support team will
contact you shortly to discuss your case.
</p>


<form className="contact-form">
  <div className="input-group">
    <input type="text" id="contact-name" placeholder=" " required />
    <label htmlFor="contact-name">Full Name</label>
    <div className="input-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    </div>
  </div>

  <div className="input-group">
    <input type="text" id="contact-phone" placeholder=" " required />
    <label htmlFor="contact-phone">Phone Number</label>
    <div className="input-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
    </div>
  </div>

  <div className="input-group">
    <input type="email" id="contact-email" placeholder=" " required />
    <label htmlFor="contact-email">Email Address</label>
    <div className="input-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    </div>
  </div>

  <div className="textarea-group">
    <textarea id="contact-message" placeholder=" " rows="4" required></textarea>
    <label htmlFor="contact-message">Briefly describe your legal issue</label>
  </div>

  <button type="submit">
    Request Consultation
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginLeft: '8px', verticalAlign: 'middle'}}>
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  </button>
</form>
</div>
</div>
</div>
);
}