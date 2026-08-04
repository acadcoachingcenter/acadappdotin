import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Coffee, Heart, Sparkles, Users, BookOpen, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SupportUs() {
  const [customAmount, setCustomAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState(null);

  const presetAmounts = [
    { amount: 50, label: "₹50", description: "A cup of chai" },
    { amount: 100, label: "₹100", description: "Support our servers" },
    { amount: 250, label: "₹250", description: "Fund new content" },
    { amount: 500, label: "₹500", description: "Generous supporter" }
  ];

  const paymentLink = "https://pmny.in/xJuAmT6XgxX7";

  const handleDonation = () => {
    window.open(paymentLink, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-orange-500 rounded-2xl flex items-center justify-center">
            <Coffee className="w-10 h-10 text-white" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900">Support ACAD ☕</h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Love our free educational content? Your support helps us create more resources and keep the platform running!
        </p>
      </div>

      {/* Why Support Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500" />
            Why Your Support Matters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Free Content</h3>
              <p className="text-sm text-slate-600">All educational resources remain free for students</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-slate-900">New Features</h3>
              <p className="text-sm text-slate-600">Develop more tools and study materials</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Server Costs</h3>
              <p className="text-sm text-slate-600">Keep the platform running smoothly</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Donation Options */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Your Support Amount</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preset Amounts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {presetAmounts.map((preset) => (
              <button
                key={preset.amount}
                onClick={() => {
                  setSelectedAmount(preset.amount);
                  setCustomAmount("");
                }}
                className={`p-4 rounded-lg border-2 transition-all text-center hover:shadow-md ${
                  selectedAmount === preset.amount
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <div className="text-2xl font-bold text-slate-900">{preset.label}</div>
                <div className="text-xs text-slate-600 mt-1">{preset.description}</div>
              </button>
            ))}
          </div>

          {/* Single Donation Button */}
          <Button
            onClick={handleDonation}
            className="w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-lg py-6"
          >
            <Coffee className="w-5 h-5 mr-2" />
            Support ACAD Now
          </Button>

          {/* Payment Info */}
          <div className="bg-slate-50 p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium text-slate-700">Secure Payment Gateway</p>
            <p className="text-sm text-slate-600">Pay via UPI, Card, Net Banking or any payment method</p>
            <p className="text-xs text-slate-500">Powered by secure payment processing</p>
          </div>
        </CardContent>
      </Card>

      {/* Thank You Message */}
      <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-pink-50">
        <CardContent className="p-6 text-center">
          <Award className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">Thank You for Considering!</h3>
          <p className="text-slate-700 mb-4">
            Every contribution, big or small, helps us continue providing quality education to students across India.
          </p>
          <Badge className="bg-gradient-to-r from-pink-500 to-orange-500 text-white border-0">
            <Heart className="w-4 h-4 mr-1" />
            Made with love by Team ACAD
          </Badge>
        </CardContent>
      </Card>

      {/* Note */}
      <p className="text-center text-sm text-slate-500">
        💡 All our educational content remains free. Donations are optional and help us grow!
      </p>
    </div>
  );
}