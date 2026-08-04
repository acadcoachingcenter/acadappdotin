
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, IndianRupee, Calendar, ClipboardPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AddWardModal from '../components/parent/AddWardModal';

export default function ParentDashboard() {
  const [user, setUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddWardModalOpen, setIsAddWardModalOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);

      if (userData.children_ids && userData.children_ids.length > 0) {
        const childrenData = await Promise.all(
          userData.children_ids.map(id => User.get(id).catch(() => null))
        );
        setChildren(childrenData.filter(Boolean)); // Filter out nulls if a child was deleted
      } else {
        setChildren([]);
      }

    } catch (error) {
      console.error("Error loading user data:", error);
      // Optionally, set user to null or handle error state more explicitly
      setUser(null);
      setChildren([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">
        Welcome, {user?.full_name || 'Parent'}!
      </h1>
      
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Children</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{children.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
            <IndianRupee className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹0</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Classes</CardTitle>
            <Calendar className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Home Tuition</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button asChild className="bg-[#1565C0] hover:bg-[#1e88e5]">
            <Link to={createPageUrl("PostTuitionRequest")}>
              <ClipboardPlus className="w-4 h-4 mr-2" />
              Post a Home Tuition Request
            </Link>
          </Button>
           <Button asChild variant="outline">
            <Link to={createPageUrl("MyTuitionRequests")}>
              View My Requests
            </Link>
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Child Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {children.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium">Linked Children:</p>
              {children.map(child => (
                <div key={child.id} className="p-2 bg-slate-100 rounded-md">
                  {child.full_name || child.email}
                </div>
              ))}
            </div>
          )}
          <Button onClick={() => setIsAddWardModalOpen(true)} className="bg-[#1565C0] hover:bg-[#1e88e5]">
            Add Child
          </Button>
        </CardContent>
      </Card>
      
      {isAddWardModalOpen && (
        <AddWardModal
          open={isAddWardModalOpen}
          onOpenChange={setIsAddWardModalOpen}
          onChildAdded={loadData}
        />
      )}
    </div>
  );
}
