import TeamPage from "@/components/team";
import Header from "@/components/header"
import Footer from "@/components/footer"

export const metadata = {
  title: "Our Team | StitchMaster",
  description: "Learn about the team behind StitchMaster and our mission to improve surgical education."
};

export default function Team() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <TeamPage />
      </main>
      <Footer />
    </div>
  );
}