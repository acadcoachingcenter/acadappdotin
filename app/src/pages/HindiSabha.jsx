import React, { useState, useEffect } from "react";
import { apiClient } from "@/api/apiClient";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import LevelSelector from "../components/hindi-sabha/LevelSelector";
import ModuleTabs from "../components/hindi-sabha/ModuleTabs";

export default function HindiSabha() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [levels, setLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [userType, setUserType] = useState("student");
  const [activeTab, setActiveTab] = useState("grammar");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [levelsRes, authRes] = await Promise.allSettled([
        apiClient.entities.ExamLevel.list(),
        apiClient.auth.me()
      ]);
      if (levelsRes.status === "fulfilled") {
        const sortedLevels = levelsRes.value.sort((a, b) => a.difficulty_level - b.difficulty_level);
        setLevels(sortedLevels);
      } else {
        console.error("Error fetching levels:", levelsRes.reason);
      }
      if (authRes.status === "fulfilled") {
        setUser(authRes.value);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#1565C0] mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading Hindi Sabha Exam Preparation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-8 md:p-12 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <BookOpen className="w-8 h-8" />
          </div>
          <Badge className="bg-white/20 text-white border-0 text-base">Hindi Sabha Exam Prep</Badge>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Hindi Sabha Examination Preparation
        </h1>
        <p className="text-xl text-orange-100 max-w-3xl">
          Structured preparation for all Hindi Sabha levels - from Prathamic to Visharad/Praveen
        </p>
      </div>

      {/* Selection Panel */}
      <LevelSelector
        levels={levels}
        selectedLevel={selectedLevel}
        onLevelChange={setSelectedLevel}
        userType={userType}
        onUserTypeChange={setUserType}
      />

      {/* Module Navigation Tabs */}
      <ModuleTabs
        selectedLevel={selectedLevel}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        levels={levels}
      />
    </div>
  );
}