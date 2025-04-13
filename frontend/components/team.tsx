"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Microscope, Github, Linkedin, Mail } from "lucide-react";

export default function TeamPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="flex justify-center items-center gap-2 mb-4">
          <Microscope className="h-8 w-8 text-teal-600" />
          <h1 className="text-4xl font-bold text-teal-800 dark:text-teal-300">Our Team</h1>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          We're a passionate group of medical technologists and developers dedicated to improving surgical education through AI-powered learning tools.
        </p>
      </div>

      {/* Mission Section */}
      <Card className="p-8 mb-16 bg-gradient-to-br from-teal-50 to-white dark:from-gray-900 dark:to-gray-800 border-teal-100 dark:border-teal-900">
        <h2 className="text-2xl font-semibold text-teal-700 dark:text-teal-400 mb-4">Our Mission</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          At StitchMaster, our mission is to revolutionize how medical students learn and practice suturing techniques. We leverage artificial intelligence to provide instant, objective feedback on suture placement, helping students develop proper techniques with less trial and error.
        </p>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          We believe that high-quality surgical education should be accessible to medical students everywhere, regardless of resource limitations. Our platform bridges the gap between classroom learning and real-world application, offering a safe environment to practice and perfect surgical skills.
        </p>
        <div className="flex justify-center mt-6">
          <Button variant="default" className="bg-teal-600 hover:bg-teal-700">
            Learn More About Our Technology
          </Button>
        </div>
      </Card>

      {/* Team Members Section */}
      <h2 className="text-3xl font-bold text-center mb-10 text-teal-800 dark:text-teal-300">Meet Our Team</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {[
          {
            name: "Marin Gazvoda de Reggi",
            bio: "The CS student who led the development of the whole project maintained such immaculate GitHub repositories that even his commit messages have their own fan club.",
            image: "/team/member1.jpg"
          },
          {
            name: "Ana Bračić",
            bio: "The CS student crafted an intuitive interface and delivered such a compelling pitch that even the backend engineers momentarily forgot their love of command lines.",
            image: "/team/member2.jpg"
          },
          {
            name: "Urban Malavašič",
            bio: "The medical student applied their clinical expertise to the project while having practiced so much on synthetic skin that their suturing precision could make a fashion designer question their career choices.",
            image: "/team/member3.jpg"
          },
          {
            name: "Feliks Fortuna",
            bio: "The computer science graduate applied their backend and AI expertise while creating algorithms so intelligent they started suggesting more efficient ways to procrastinate.",
            image: "/team/member4.jpg"
          }
        ].map((member, i) => (
          <Card key={i} className="overflow-hidden flex flex-col h-full">
            <div className="h-48 relative bg-gray-200 dark:bg-gray-700">
              {/* Replace with actual team member images */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-gray-400">[Team Photo]</span>
              </div>
            </div>
            <div className="p-4 flex-grow">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{member.name}</h3>
              <p className="text-sm text-teal-600 dark:text-teal-400 mb-2">{member.role}</p>
              <p className="text-gray-600 dark:text-gray-300 text-sm">{member.bio}</p>
            </div>
            <div className="flex gap-2 p-4 pt-0 justify-start">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Github className="h-4 w-4" />
                <span className="sr-only">GitHub</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Linkedin className="h-4 w-4" />
                <span className="sr-only">LinkedIn</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Mail className="h-4 w-4" />
                <span className="sr-only">Email</span>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Our Values Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-10 text-teal-800 dark:text-teal-300">Our Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-3 text-teal-700 dark:text-teal-400">Innovation</h3>
            <p className="text-gray-600 dark:text-gray-300">
              We continuously push the boundaries of what's possible by combining medical expertise with cutting-edge AI technology.
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-3 text-teal-700 dark:text-teal-400">Accessibility</h3>
            <p className="text-gray-600 dark:text-gray-300">
              We're committed to making quality surgical education tools available to medical students regardless of geographical or institutional constraints.
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-3 text-teal-700 dark:text-teal-400">Accuracy</h3>
            <p className="text-gray-600 dark:text-gray-300">
              We strive for the highest standards in our AI analysis, focusing on providing medically accurate and clinically relevant feedback.
            </p>
          </Card>
        </div>
      </div>

      {/* Contact Section */}
      <Card className="p-8 text-center bg-teal-50 dark:bg-gray-800">
        <h2 className="text-2xl font-bold mb-4 text-teal-800 dark:text-teal-300">Get In Touch</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Interested in learning more about our platform or collaborating with us? We'd love to hear from you!
        </p>
        <Button variant="default" className="bg-teal-600 hover:bg-teal-700">
          Contact Us
        </Button>
      </Card>
    </div>
  );
}
