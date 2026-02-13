import { Link } from "react-router-dom";
import { Scale, Users, Building2, Home, Monitor, FileText, LayoutGrid } from 'lucide-react';

const specialties = [
  { name: "All", icon: LayoutGrid },
  { name: "Criminal Lawyer", icon: Scale },
  { name: "Family Lawyer", icon: Users },
  { name: "Corporate Lawyer", icon: Building2 },
  { name: "Property Lawyer", icon: Home },
  { name: "Cyber Lawyer", icon: Monitor },
  { name: "Civil Lawyer", icon: FileText },
];

const Speciality = () => {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Find by Speciality</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Simply browse through our extensive list of trusted lawyers,
            schedule your appointment hassle-free.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {specialties.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <Link
                to="/lawyers"
                state={{ specialty: item.name }}
                key={index}
                className="group flex flex-col items-center p-6 bg-gray-50 rounded-xl hover:bg-blue-50 hover:shadow-md transition-all duration-300 cursor-pointer"
              >
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-white shadow-sm group-hover:bg-blue-100 group-hover:text-blue-600 transition-all duration-300 mb-3">
                  <IconComponent className="w-8 h-8 text-gray-600 group-hover:text-blue-600" />
                </div>
                <h4 className="text-sm font-medium text-gray-700 text-center group-hover:text-blue-700">{item.name}</h4>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Speciality;
