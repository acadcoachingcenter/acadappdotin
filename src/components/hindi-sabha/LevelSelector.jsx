import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function LevelSelector({ levels, selectedLevel, onLevelChange, userType, onUserTypeChange }) {
  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-2xl">Configure Your Study Path</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Level Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">
              Select Your Hindi Sabha Level
            </Label>
            <Select value={selectedLevel} onValueChange={onLevelChange}>
              <SelectTrigger className="w-full h-12 text-base">
                <SelectValue placeholder="Choose examination level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((level) => (
                  <SelectItem key={level.id} value={level.id}>
                    {level.name} {level.description && `(${level.description})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* User Type Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">
              I am a
            </Label>
            <div className="flex gap-4 h-12 items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="userType"
                  value="student"
                  checked={userType === "student"}
                  onChange={(e) => onUserTypeChange(e.target.value)}
                  className="w-4 h-4 text-[#1565C0]"
                />
                <span className="text-base">Student</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="userType"
                  value="professional"
                  checked={userType === "professional"}
                  onChange={(e) => onUserTypeChange(e.target.value)}
                  className="w-4 h-4 text-[#1565C0]"
                />
                <span className="text-base">Working Professional</span>
              </label>
            </div>
          </div>
        </div>

        {selectedLevel && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Selected:</strong> {levels.find(l => l.id === selectedLevel)?.name} • {userType === "student" ? "Student" : "Working Professional"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}