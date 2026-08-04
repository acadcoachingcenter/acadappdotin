
import React, { useState, useEffect, useRef } from "react";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Camera, Save } from "lucide-react";
import { UploadFile } from "@/integrations/Core";

const SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology", "English", "Hindi",
  "Social Science", "Computer Science", "Economics", "Accountancy",
  "Business Studies", "Yoga"
];

const GRADES = [
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
  "Class 11", "Class 12", "Undergraduate", "Graduate"
];

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [childLinkingCode, setChildLinkingCode] = useState(''); // New state for child linking code
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      setFormData(userData);
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await User.updateMyUserData(formData);
      const updatedUser = await User.me();
      setUser(updatedUser);
      setFormData(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to save changes. Please try again.");
    }
    setIsSaving(false);
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const generateNewCode = async () => {
    // Generate a random 6-character uppercase alphanumeric code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      // Assuming User.updateMyUserData can handle setting this field
      await User.updateMyUserData({ parent_linking_code: code });
      // Reload user profile to show the new code
      loadUserProfile();
    } catch (error) {
      console.error("Failed to generate linking code:", error);
      alert("Could not generate a new linking code. Please try again.");
    }
  };

  const handleAddChild = async () => {
    if (!childLinkingCode) {
      alert("Please enter a child's linking code.");
      return;
    }

    setIsSaving(true);
    try {
      // Assuming User.addChildByLinkingCode is an API call that links a child to the current parent user
      await User.addChildByLinkingCode(childLinkingCode);
      alert("Child successfully linked!");
      setChildLinkingCode(''); // Clear input after success
      loadUserProfile(); // Reload user profile to reflect the linked child, if visible anywhere
    } catch (error) {
      console.error("Failed to link child:", error);
      alert("Could not link child. Please check the code and try again.");
    }
    setIsSaving(false);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsSaving(true);
    try {
      const { file_url } = await UploadFile({ file });
      await User.updateMyUserData({ profile_image: file_url });
      loadUserProfile(); // Reload profile to reflect new image immediately
    } catch (error) {
      console.error("Error uploading profile image:", error);
      alert("Failed to upload profile image. Please try again.");
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-slate-200 rounded animate-pulse"></div>
        <div className="h-64 bg-slate-200 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Picture & Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Avatar className="w-32 h-32 mx-auto">
              <AvatarImage src={user?.profile_image} />
              <AvatarFallback className="bg-cyan-400 text-2xl font-semibold flex h-full w-full items-center justify-center rounded-full">
                {user?.full_name?.charAt(0) || user?.email?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current.click()} disabled={isSaving}>
              <Camera className="w-4 h-4 mr-2" />
              {isSaving ? 'Uploading...' : 'Change Photo'}
            </Button>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{user?.full_name}</h3>
              <Badge className="capitalize">{user?.user_type}</Badge>
              <p className="text-sm text-slate-600">{user?.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={formData.full_name || ""}
                    onChange={(e) => updateField('full_name', e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone || ""}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={formData.location || ""}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="City, State"
                />
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea
                  value={formData.bio || ""}
                  onChange={(e) => updateField('bio', e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="h-24"
                />
              </div>
            </CardContent>
          </Card>

          {/* Role-specific fields */}
          {user?.user_type === 'student' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Academic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Grade/Class</Label>
                    <Select value={formData.grade_class || ""} onValueChange={(value) => updateField('grade_class', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {GRADES.map((grade) => (
                          <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Subjects of Interest</Label>
                    <div className="flex flex-wrap gap-2">
                      {SUBJECTS.map((subject) => (
                        <Badge
                          key={subject}
                          variant={formData.subjects_interested?.includes(subject) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            const current = formData.subjects_interested || [];
                            const updated = current.includes(subject) ?
                              current.filter((s) => s !== subject) :
                              [...current, subject];
                            updateField('subjects_interested', updated);
                          }}
                        >
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Parent Linking</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600">
                    To allow a parent to view your progress, generate a code and share it with them. They can use this code on their Parent Dashboard.
                  </p>
                  {formData.parent_linking_code ? (
                    <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
                      <div>
                        <p className="text-xs text-slate-500">Your current linking code:</p>
                        <p className="text-2xl font-bold font-mono tracking-widest text-slate-900">{formData.parent_linking_code}</p>
                      </div>
                      <Button onClick={generateNewCode} variant="outline" size="sm">Generate New Code</Button>
                    </div>
                  ) : (
                    <Button onClick={generateNewCode}>Generate Linking Code</Button>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {user?.user_type === 'parent' && (
            <Card>
              <CardHeader>
                <CardTitle>Add Child</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  Enter your child's linking code to connect their profile with yours.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={childLinkingCode}
                    onChange={(e) => setChildLinkingCode(e.target.value)}
                    placeholder="Enter child's linking code"
                    maxLength={6}
                    className="flex-grow"
                  />
                  <Button onClick={handleAddChild} disabled={isSaving || !childLinkingCode}>
                    {isSaving ? "Adding..." : "Add Child"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {user?.user_type === 'tutor' && (
            <Card>
              <CardHeader>
                <CardTitle>Teaching Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Experience (Years)</Label>
                    <Input
                      type="number"
                      value={formData.experience_years || ""}
                      onChange={(e) => updateField('experience_years', parseInt(e.target.value))}
                      placeholder="5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hourly Rate (₹)</Label>
                    <Input
                      type="number"
                      value={formData.hourly_rate || ""}
                      onChange={(e) => updateField('hourly_rate', parseInt(e.target.value))}
                      placeholder="500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Subjects Teaching</Label>
                  <div className="flex flex-wrap gap-2">
                    {SUBJECTS.map((subject) => (
                      <Badge
                        key={subject}
                        variant={formData.subjects_teaching?.includes(subject) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const current = formData.subjects_teaching || [];
                          const updated = current.includes(subject) ?
                            current.filter((s) => s !== subject) :
                            [...current, subject];
                          updateField('subjects_teaching', updated);
                        }}
                      >
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Qualifications</Label>
                  <Textarea
                    value={formData.qualifications?.join(', ') || ""}
                    onChange={(e) => updateField('qualifications', e.target.value.split(', ').filter((q) => q.trim()))}
                    placeholder="B.Tech, M.Tech, PhD..."
                    className="h-20"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving} className="bg-[#1565C0] hover:bg-[#1e88e5]">
              {isSaving ? "Saving..." : "Save Changes"}
              <Save className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
