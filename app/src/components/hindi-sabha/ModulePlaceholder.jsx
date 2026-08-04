import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function ModulePlaceholder({ title, icon: Icon, selectedLevel }) {
  return (
    <Card className="border-2">
      <CardContent className="p-12 text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center">
            <Icon className="w-10 h-10 text-slate-400" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
          <p className="text-slate-600">
            Module content will be implemented in the next step
          </p>
        </div>

        <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 max-w-md mx-auto">
          <div className="flex items-center gap-3 text-amber-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm text-left">
              This module is under development. AI-powered learning features will be added soon.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}