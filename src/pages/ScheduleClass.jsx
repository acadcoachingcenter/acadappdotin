import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from 'lucide-react';

export default function ScheduleClass() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Calendar className="w-8 h-8 text-[#1565C0]" />
        <h1 className="text-3xl font-bold text-slate-900">Schedule a Live Class</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">The interface to schedule new live classes is under construction. Please check back later!</p>
        </CardContent>
      </Card>
    </div>
  );
}