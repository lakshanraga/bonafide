"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section
      className="relative h-[60vh] md:h-[80vh] bg-cover bg-center flex items-center justify-center text-white overflow-hidden"
      style={{ backgroundImage: "url('/ace pic.jpg')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/70 to-blue-600/70"></div>
      <div className="relative z-10 text-center px-4 animate-fade-in">
        <h1 className="text-4xl md:text-7xl font-extrabold mb-4 drop-shadow-lg animate-fade-in delay-100">
          Welcome to Adhiyamaan College of Engineering
        </h1>
        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto animate-fade-in delay-200">
          Empowering minds, shaping futures. Discover excellence in education and innovation.
        </p>
        <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 transition-colors duration-300 animate-fade-in delay-300">
          <Link to="/login">Login</Link>
        </Button>
      </div>
    </section>
  );
};

export default HeroSection;