import{ useState } from "react";
import "./All_lawyer.css";
import Lawyer_card from "./Lawyer_card";

const lawyerSpecialists = [
  "All",
  "Criminal Lawyer",
  "Family Lawyer",
  "Corporate Lawyer",
  "Property Lawyer",
  "Cyber Lawyer",
  "Civil Lawyer",
];
const All_lawyer=() => {
const [selected, setSelected] = useState("All");
  return (
    <div className="page">
      {/* LEFT SIDE */}
      <div className="left">
        <h3>Lawyer Speciality</h3>

        {lawyerSpecialists.map((item) => (
          <button
            key={item}
            onClick={() => setSelected(item)}
            className={selected === item ? "active" : ""}
          >
            {item}
          </button>
        ))}
      </div>

      {/* RIGHT SIDE */}
      <Lawyer_card selected={selected} />
    </div>
  );
};

export default All_lawyer;
