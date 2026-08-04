import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Shield, Globe } from "lucide-react";

export default function Settings() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    classReminders: true,
    assignmentReminders: true,
    paymentReminders: true
  });

  const [preferences, setPreferences] = useState({
    language: 'english',
    theme: 'light',
    timezone: 'Asia/Kolkata'
  });

  const handleNotificationChange = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Settings</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Email Notifications</Label>
              <Switch 
                checked={notifications.email} 
                onCheckedChange={() => handleNotificationChange('email')}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Push Notifications</Label>
              <Switch 
                checked={notifications.push} 
                onCheckedChange={() => handleNotificationChange('push')}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>SMS Notifications</Label>
              <Switch 
                checked={notifications.sms} 
                onCheckedChange={() => handleNotificationChange('sms')}
              />
            </div>
            <hr />
            <div className="flex items-center justify-between">
              <Label>Class Reminders</Label>
              <Switch 
                checked={notifications.classReminders} 
                onCheckedChange={() => handleNotificationChange('classReminders')}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Assignment Reminders</Label>
              <Switch 
                checked={notifications.assignmentReminders} 
                onCheckedChange={() => handleNotificationChange('assignmentReminders')}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Payment Reminders</Label>
              <Switch 
                checked={notifications.paymentReminders} 
                onCheckedChange={() => handleNotificationChange('paymentReminders')}
              />
            </div>
          </CardContent>
        </Card>

        {/* App Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={preferences.language} onValueChange={(value) => setPreferences(prev => ({ ...prev, language: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="hindi">Hindi</SelectItem>
                  <SelectItem value="tamil">Tamil</SelectItem>
                  <SelectItem value="telugu">Telugu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select value={preferences.theme} onValueChange={(value) => setPreferences(prev => ({ ...prev, theme: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={preferences.timezone} onValueChange={(value) => setPreferences(prev => ({ ...prev, timezone: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              Change Password
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Two-Factor Authentication
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Privacy Settings
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Download My Data
            </Button>
          </CardContent>
        </Card>

        {/* Support */}
        <Card>
          <CardHeader>
            <CardTitle>Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              Help Center
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Contact Support
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Report a Bug
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Terms of Service
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Privacy Policy
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button className="bg-[#1565C0] hover:bg-[#1e88e5]">
          Save All Settings
        </Button>
      </div>
    </div>
  );
}