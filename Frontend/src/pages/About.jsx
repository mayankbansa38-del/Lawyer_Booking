import { Link } from "react-router-dom";
import { Scale, Users, Award, Target, Heart, Shield, ArrowRight, CheckCircle2, Quote } from 'lucide-react';

import ashrufImage from "../assets/photo/ashruf.jpeg";
import amarpaulImage from "../assets/photo/amar_paul.jpg";

const About = () => {
  const team = [
    { name: "Prof. Amar Paul Singh", role: "Project Guide", image: amarpaulImage, bio: "Mentoring the team to build scalable and efficient solutions." },
    { name: "Mayank Bansal", role: "Team Member", image: "/lawyer5.png", bio: "Full Stack Developer passionate about legal tech innovation." },
    { name: "Piyush Sharma", role: "Team Member", image: "/lawyer3.png", bio: "Frontend specialist focused on creating intuitive user experiences." },
    { name: "Ashruf Khan", role: "Team Member", image: ashrufImage, bio: "Backend developer ensuring secure and robust system architecture." },
  ];

  const values = [
    { icon: Shield, title: "Trust & Security", description: "Your data and communications are protected with bank-level encryption." },
    { icon: Heart, title: "Client First", description: "Every decision we make is guided by what's best for our users." },
    { icon: Target, title: "Excellence", description: "We partner only with the most qualified and vetted legal professionals." },
    { icon: Award, title: "Transparency", description: "Clear pricing, honest reviews, and no hidden surprises." },
  ];

  const milestones = [
    { year: "2025", title: "Project Inception", description: "Started as a final year college project idea" },
    { year: "2025", title: "Research Phase", description: "Analyzed the legal tech market and user needs" },
    { year: "2026", title: "Development", description: "Building the core platform with modern tech stack" },
    { year: "2026", title: "Launch", description: "Releasing the beta version for user testing" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 py-16 sm:py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1)_0%,transparent_50%)]" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm text-blue-200 mb-6 border border-white/10">
              <Scale className="w-4 h-4" />
              <span>College Project Presentation</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Making Legal Services <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Accessible to Everyone</span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed">
              Nyay Booker is a comprehensive legal services platform developed as a college project.
              Our goal is to demonstrate how technology can bridge the gap between clients and legal professionals.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                At Nyay Booker, we're on a mission to simplify legal access. This project was born out of the realization
                that finding the right lawyer is often a complex and intimidating process for many people.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                Under the guidance of our mentor, we've built a demonstration platform that features lawyer discovery,
                appointment booking, and secure communication channels.
              </p>
              <div className="space-y-3">
                {["Student-led initiative", "Modern technology stack", "User-centric design", "Scalable architecture"].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-8 text-white">
                <Quote className="w-12 h-12 text-white/30 mb-4" />
                <p className="text-xl font-medium mb-6 leading-relaxed">
                  "Technology has the power to make justice more accessible. This project is a step towards that future."
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                    NB
                  </div>
                  <div>
                    <p className="font-semibold">Nyay Booker Team</p>
                    <p className="text-blue-200 text-sm">College Project 2024-25</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Core Values</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">The academic and ethical principles guiding our project development.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, idx) => {
              const Icon = value.icon;
              return (
                <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow border border-gray-100">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{value.title}</h3>
                  <p className="text-gray-600 text-sm">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Project Journey</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">From concept to code: our development timeline.</p>
          </div>
          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 hidden lg:block" />
            <div className="space-y-8 lg:space-y-0">
              {milestones.map((milestone, idx) => (
                <div key={idx} className={`lg:flex items-center gap-8 ${idx % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                  <div className={`flex-1 ${idx % 2 === 0 ? 'lg:text-right' : 'lg:text-left'}`}>
                    <div className={`bg-gray-50 rounded-2xl p-6 inline-block ${idx % 2 === 0 ? 'lg:ml-auto' : 'lg:mr-auto'}`}>
                      <span className="text-blue-600 font-bold text-lg">{milestone.year}</span>
                      <h3 className="text-xl font-bold text-gray-900 mt-1">{milestone.title}</h3>
                      <p className="text-gray-600 mt-2">{milestone.description}</p>
                    </div>
                  </div>
                  <div className="hidden lg:flex w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-md z-10" />
                  <div className="flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">The Project Team</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Meet the students and mentor behind this project.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 text-center shadow-sm hover:shadow-lg transition-shadow border border-gray-100">
                <img src={member.image} alt={member.name} className="w-40 h-40 rounded-3xl mx-auto mb-5 border-4 border-gray-100 object-cover shadow-lg" />
                <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                <p className="text-blue-600 font-medium text-sm mb-2">{member.role}</p>
                <p className="text-gray-500 text-sm">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">Ready to Find Your Lawyer?</h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">Join thousands of satisfied clients who've found expert legal help through our platform.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/lawyers" className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 shadow-lg transition-all flex items-center justify-center gap-2">
              Browse Lawyers
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/contact" className="px-8 py-4 border-2 border-white/20 text-white font-semibold rounded-xl hover:bg-white/10 transition-all">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
