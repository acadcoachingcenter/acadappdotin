import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BookOpen, FileText, Languages, ClipboardCheck, BarChart } from "lucide-react";
import ModulePlaceholder from "./ModulePlaceholder";
import GrammarModule from "./GrammarModule";
import WritingModule from "./WritingModule";

export default function ModuleTabs({ selectedLevel, activeTab, onTabChange, levels }) {
  const modules = [
    { id: "grammar", label: "Grammar", icon: BookOpen },
    { id: "writing", label: "Writing Practice", icon: FileText },
    { id: "translation", label: "Translation", icon: Languages },
    { id: "mock-tests", label: "Mock Tests", icon: ClipboardCheck },
    { id: "performance", label: "Performance", icon: BarChart }
  ];

  const isDisabled = !selectedLevel;

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2 h-auto bg-slate-100 p-2">
          {modules.map((module) => (
            <TabsTrigger
              key={module.id}
              value={module.id}
              disabled={isDisabled}
              className="flex items-center gap-2 py-3 data-[state=active]:bg-white data-[state=active]:text-[#1565C0]"
            >
              <module.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{module.label}</span>
              <span className="sm:hidden">{module.label.split(' ')[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {modules.map((module) => (
          <TabsContent key={module.id} value={module.id} className="mt-6">
            {module.id === "grammar" ? (
              <GrammarModule 
                selectedLevel={selectedLevel}
                levels={levels}
              />
            ) : module.id === "writing" ? (
              <WritingModule 
                selectedLevel={selectedLevel}
                levels={levels}
              />
            ) : (
              <ModulePlaceholder 
                title={module.label}
                icon={module.icon}
                selectedLevel={selectedLevel}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>

      {isDisabled && (
        <div className="text-center py-8 text-slate-500">
          <p className="text-lg font-medium">Please select a Hindi Sabha level to access modules</p>
        </div>
      )}
    </div>
  );
}