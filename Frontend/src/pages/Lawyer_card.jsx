import "./Lawyer_card.css";

const lawyers = [
  { name: "Adv. Rahul Sharma", type: "Criminal Lawyer", image: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&h=400&fit=crop", available: true, rating: 4.7, cases: 145 },
  { name: "Adv. Neha Verma", type: "Family Lawyer", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop", available: true, rating: 4.8, cases: 132 },
  { name: "Adv. Aman Gupta", type: "Corporate Lawyer", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop", available: false, rating: 4.9, cases: 178 },
  { name: "Adv. Riya Malhotra", type: "Property Lawyer", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop", available: true, rating: 4.6, cases: 121 },
  { name: "Adv. Kunal Mehta", type: "Cyber Lawyer", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop", available: true, rating: 4.8, cases: 156 },
  { name: "Adv. Tanya Kashyap", type: "Civil Lawyer", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop", available: false, rating: 4.7, cases: 138 },
  { name: "Adv. Vikram Singh", type: "Criminal Lawyer", image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop", available: true, rating: 4.9, cases: 192 },
  { name: "Adv. Priya Desai", type: "Family Lawyer", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop", available: true, rating: 4.8, cases: 167 },
  { name: "Adv. Arjun Reddy", type: "Corporate Lawyer", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop", available: true, rating: 4.7, cases: 143 },
  { name: "Adv. Sneha Patel", type: "Property Lawyer", image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop", available: false, rating: 4.6, cases: 129 },
  { name: "Adv. Rohit Kumar", type: "Cyber Lawyer", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop", available: true, rating: 4.9, cases: 185 },
  { name: "Adv. Anjali Nair", type: "Civil Lawyer", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop", available: true, rating: 4.7, cases: 151 },
  { name: "Adv. Karan Joshi", type: "Criminal Lawyer", image: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop", available: true, rating: 4.6, cases: 125 },
  { name: "Adv. Divya Iyer", type: "Family Lawyer", image: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=400&fit=crop", available: true, rating: 4.9, cases: 155 },
  { name: "Adv. Nikhil Saxena", type: "Corporate Lawyer", image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop", available: false, rating: 4.7, cases: 190 },
  { name: "Adv. Pooja Bhatt", type: "Property Lawyer", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop", available: true, rating: 4.8, cases: 135 },
  { name: "Adv. Sanjay Rao", type: "Cyber Lawyer", image: "https://images.unsplash.com/photo-1541101767792-f9b2b1c4f127?w=400&h=400&fit=crop", available: false, rating: 4.9, cases: 200 },
  { name: "Adv. Meera Kapoor", type: "Civil Lawyer", image: "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=400&h=400&fit=crop", available: true, rating: 4.6, cases: 118 },
  { name: "Adv. Aditya Menon", type: "Criminal Lawyer", image: "https://images.unsplash.com/photo-1489980557514-251d61e3eeb6?w=400&h=400&fit=crop", available: true, rating: 4.8, cases: 172 },
  { name: "Adv. Kavya Shah", type: "Family Lawyer", image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop", available: true, rating: 4.9, cases: 163 },
];

const Lawyer_card = ({ selected }) => {
  const filteredLawyers = selected === "All" 
    ? lawyers 
    : lawyers.filter((lawyer) => lawyer.type === selected);

  return (
    <div className="right">
      {filteredLawyers.map((lawyer, index) => (
        <div className="card" key={index}>
          <div className="card-image-wrapper">
            <div className="img" style={{ 
              backgroundImage: `url(${lawyer.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}></div>
            <div className="card-overlay">
              <button className="btn-primary">Book Appointment</button>
              <button className="btn-secondary">View Profile</button>
            </div>
            <span className={`status-badge ${lawyer.available ? 'available' : 'unavailable'}`}>
              <span className="dot"></span>
              {lawyer.available ? 'Available' : 'Unavailable'}
            </span>
          </div>

          <div className="lawyer-info">
            <div className="info-header">
              <div>
                <h4>{lawyer.name}</h4>
                <p className="specialty">{lawyer.type}</p>
              </div>
              <div className="rating">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span>{lawyer.rating}</span>
              </div>
            </div>
            
            <div className="stats">
              <div className="stat-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3h18v18H3z"/>
                  <path d="M21 9H3M21 15H3M9 3v18"/>
                </svg>
                <span>{lawyer.cases}+ Cases</span>
              </div>
              <div className="stat-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <span>Verified</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Lawyer_card;