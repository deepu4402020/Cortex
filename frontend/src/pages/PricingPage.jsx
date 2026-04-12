import { useState } from "react";
import { FiCheck, FiArrowRight } from "react-icons/fi";
import { Link } from "react-router-dom";

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);

  const tiers = [
    {
      name: "Basic",
      price: "Free",
      description: "Perfect for taking casual notes and starting your digital brain.",
      features: ["Up to 50 Pages", "Basic Block Editor", "Standard Search", "7-Day Version History"],
      buttonText: "Get Started",
      highlighted: false,
    },
    {
      name: "Pro",
      price: annual ? "$8" : "$10",
      period: "/month",
      description: "For professionals needing advanced organization and collaboration.",
      features: ["Unlimited Pages", "Real-Time Collaboration", "Fuzzy Search & Filters", "30-Day Version History", "API Gateway Access (10k req/mo)"],
      buttonText: "Upgrade to Pro",
      highlighted: true,
    },
    {
      name: "Unlimited",
      price: annual ? "$24" : "$30",
      period: "/month",
      description: "Enterprise scale. Complete access to all tools and unlimited API usage.",
      features: ["Everything in Pro", "Unlimited API Gateway Access", "Forever Version History", "Custom Domain Publishing", "Dedicated Support"],
      buttonText: "Contact Sales",
      highlighted: false,
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans py-20 px-4 md:px-10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Link to="/" className="inline-block mb-8 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center">
             &larr; Back to App
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Invest in your second brain.</h1>
          <p className="text-muted-foreground text-lg mb-8">
            Start for free, then upgrade when your thoughts demand more power.
          </p>

          <div className="flex items-center justify-center space-x-3">
            <span className={`text-sm ${!annual ? 'font-bold' : 'text-muted-foreground'}`}>Monthly</span>
            <button 
              onClick={() => setAnnual(!annual)} 
              className="relative rounded-full w-12 h-6 bg-muted border border-border transition-colors duration-200 ease-in-out focus:outline-none"
            >
              <div className={`absolute left-1 top-1 bg-foreground w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${annual ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <span className={`text-sm ${annual ? 'font-bold' : 'text-muted-foreground'}`}>Annually (Save 20%)</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <div 
              key={tier.name} 
              className={`relative flex flex-col p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
                tier.highlighted 
                  ? 'border-foreground shadow-xl bg-muted/10' 
                  : 'border-border shadow-minimal bg-background'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-foreground text-background text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Most Popular
                </div>
              )}
              
              <h3 className="text-xl font-semibold mb-2">{tier.name}</h3>
              <p className="text-sm text-muted-foreground mb-6 h-10">{tier.description}</p>
              
              <div className="mb-8">
                <span className="text-4xl font-bold">{tier.price}</span>
                {tier.period && <span className="text-muted-foreground">{tier.period}</span>}
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {tier.features.map(f => (
                  <li key={f} className="flex items-start">
                    <FiCheck className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{f}</span>
                  </li>
                ))}
              </ul>
              
              <button 
                onClick={() => window.alert("Pricing Simulation. In a real app, this redirects to Stripe Checkout!")}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${
                  tier.highlighted 
                    ? 'bg-foreground text-background hover:bg-foreground/90' 
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                {tier.buttonText}
                {tier.highlighted && <FiArrowRight className="ml-2 w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
