import { useState } from "react";
import { GraduationCap, Search, Upload, Database, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "react-router-dom";

const Index = () => {
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");

  const handleAdminLogin = () => {
    const correctUsername = "admin";
    const correctPassword = "admin123";

    if (adminUser === correctUsername && adminPass === correctPassword) {
      setShowAdminLogin(false);
      window.location.href = "/admin"; // redirect
    } else {
      alert("❌ Invalid username or password");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-primary text-primary-foreground py-20 shadow-elevated">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <div className="flex justify-center mb-6">
              <GraduationCap className="h-20 w-20" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              College Result Portal
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8">
              Fast, secure, and reliable result management system with multi-course support
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary" className="gap-2 text-lg">
                <Link to="/results">
                  <Search className="h-5 w-5" />
                  View Results
                </Link>
              </Button>

              {/* ✅ Admin Login Trigger Button */}
              <Button
                size="lg"
                variant="outline"
                className="gap-2 text-lg bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => setShowAdminLogin(true)}
              >
                <Upload className="h-5 w-5" />
                Admin Login
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-lg text-muted-foreground">
              Built with modern technology for optimal performance
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="shadow-card hover:shadow-elevated transition-all animate-fade-in">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Multi-Course Support</CardTitle>
                <CardDescription>
                  Flexible schema supporting MCA, BCA, B.Sc CS, and more with dynamic subject management
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-card hover:shadow-elevated transition-all animate-fade-in">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Load Balanced Backend</CardTitle>
                <CardDescription>
                  5 backend instances with custom Python load balancer for high availability and performance
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-card hover:shadow-elevated transition-all animate-fade-in">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
                  <Upload className="h-6 w-6 text-success" />
                </div>
                <CardTitle>Easy CSV Upload</CardTitle>
                <CardDescription>
                  Simple admin interface for bulk result uploads with automatic data validation
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 College Result Portal. All rights reserved.</p>
        </div>
      </footer>

      {/* ✅ Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
          <div className="bg-card text-card-foreground p-8 rounded-xl shadow-elevated w-full max-w-sm animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 text-center text-primary">Admin Login</h2>

            <input
              type="text"
              placeholder="Username"
              onChange={(e) => setAdminUser(e.target.value)}
              className="w-full border p-2 rounded mb-4 focus:ring-2 focus:ring-primary outline-none bg-background"
            />

            <input
              type="password"
              placeholder="Password"
              onChange={(e) => setAdminPass(e.target.value)}
              className="w-full border p-2 rounded mb-6 focus:ring-2 focus:ring-primary outline-none bg-background"
            />

            <div className="flex flex-col gap-3">
              <Button onClick={handleAdminLogin} className="w-full">
                Login
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setShowAdminLogin(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
