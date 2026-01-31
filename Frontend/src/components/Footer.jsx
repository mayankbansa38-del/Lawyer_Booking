import { useState } from "react";
import "./Footer.css";

const faqs = [
  "WHAT IS ONLINE LEGAL CONSULTATION?",
  "ARE YOUR ONLINE LAWYERS QUALIFIED?",
  "WHAT HAPPENS IF I DON'T GET A RESPONSE FROM A LAWYER?",
  "HOW DO I START ONLINE CONSULTATION WITH LAWYER?",
  "IS ONLINE LAWYER CONSULTATION SAFE AND SECURE?"
];

const Footer = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <footer className="footer">
      <div className="footer-container">

        {/* Left Section */}
        <div className="footer-left">
          <h2>Questions?</h2>
          <h3>We’re here to help</h3>
          <p>
            Check out our FAQs or talk to a live customer care specialist
            by phone, chat, or email.
          </p>

          <div className="footer-icons">
            <span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </span>
            <span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </span>
            <span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </span>
          </div>
        </div>

        {/* Right Section (FAQs) */}
        <div className="footer-right">
          {faqs.map((item, index) => (
            <div
              key={index}
              className="faq-item"
              onClick={() => toggleFaq(index)}
            >
              <div className="faq-question">
                {item}
                <span>{openIndex === index ? "−" : "+"}</span>
              </div>

              {openIndex === index && (
                <div className="faq-answer">
                  This is a sample answer. You can replace it with your own
                  legal consultation details.
                </div>
              )}
            </div>
          ))}
        </div>

      </div>

      {/* 🔹 Copyright Section */}
      <div className="footer-bottom">
        © 2026 All Rights Reserved.
      </div>
    </footer>
  );
};

export default Footer;

