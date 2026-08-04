import React, { useState, useEffect, useMemo } from "react";
import { User } from "@/entities/User";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, UserPlus, Info, UserMinus } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import PromoteToTutorModal from "../components/admin/PromoteToTutorModal";

export default function AdminTutorManagement() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("unassigned");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [removingUser, setRemovingUser] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const allUsers = await User.list("-created_date");
      setUsers(allUsers);
    } catch (error) {
      console.error("Error loading users:", error);
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (filterType !== "all") {
      filtered = filtered.filter(user => {
        if (filterType === 'unassigned') return !user.user_type;
        return user.user_type === filterType;
      });
    }

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  }, [searchTerm, filterType, users]);

  const handlePromotionSuccess = () => {
    setSelectedUser(null);
    loadUsers(); // Refresh the user list
  };

  const handleRemoveTutor = async () => {
    if (!removingUser) return;
    setIsRemoving(true);
    try {
      await User.update(removingUser.id, { user_type: null });
      // Also pause their HomeTutor profile so they no longer appear in Find Teachers Near You
      try {
        await base44.entities.HomeTutor.updateMany(
          { tutor_id: removingUser.id, status: "active" },
          { $set: { status: "paused" } }
        );
      } catch (e) {
        console.error("Error pausing HomeTutor profile:", e);
      }
      setRemovingUser(null);
      loadUsers();
    } catch (error) {
      console.error("Error removing tutor:", error);
      alert("Failed to remove tutor: " + error.message);
    }
    setIsRemoving(false);
  };

  const getUserTypeColor = (type) => {
    switch(type) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'tutor': return 'bg-blue-100 text-blue-800';
      case 'parent': return 'bg-purple-100 text-purple-800';
      case 'student': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Tutor & User Management</h1>
      
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="flex flex-row items-start gap-4">
          <Info className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <CardTitle className="text-blue-900">How to Add New Users</CardTitle>
            <p className="text-sm text-blue-800 mt-1">
              To invite a new student, parent, or tutor, go to the <strong>Data</strong> tab in the main platform menu on the left. Select the <strong>User</strong> entity and click the 'Invite User' button. Once they accept the invitation, they will appear in the list below.
            </p>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{filterType === 'unassigned' ? 'Unassigned Users' : 'All Users'} ({filteredUsers.length})</span>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned Users</SelectItem>
                  <SelectItem value="tutor">Tutors</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="parent">Parents</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="all">All Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? <p>Loading users...</p> : filteredUsers.map((user) => (
              <div key={user.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.profile_image} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                        {user.full_name?.charAt(0) || user.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h4 className="font-semibold">{user.full_name || 'Unnamed User'}</h4>
                      <p className="text-sm text-slate-600">{user.email}</p>
                      <p className="text-xs text-slate-400">ID: {user.id}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge className={getUserTypeColor(user.user_type)}>
                      {user.user_type || 'Unassigned'}
                    </Badge>
                    <p className="text-sm text-slate-500 hidden md:block">
                      Joined: {new Date(user.created_date).toLocaleDateString()}
                    </p>
                    {!user.user_type && (
                      <Button size="sm" onClick={() => setSelectedUser(user)}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Promote to Tutor
                      </Button>
                    )}
                    {user.user_type === 'tutor' && (
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setRemovingUser(user)}>
                        <UserMinus className="w-4 h-4 mr-2" />
                        Remove Tutor
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
             {filteredUsers.length === 0 && !isLoading && (
              <div className="text-center py-10">
                <p className="text-slate-500">No users found for this filter.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedUser && (
        <PromoteToTutorModal
          user={selectedUser}
          open={!!selectedUser}
          onOpenChange={() => setSelectedUser(null)}
          onTutorPromoted={handlePromotionSuccess}
        />
      )}

      <AlertDialog open={!!removingUser} onOpenChange={(open) => !open && setRemovingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Tutor Role?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the tutor designation from <strong>{removingUser?.full_name || removingUser?.email}</strong>. They will be moved back to "Unassigned", removed from the tutor list, and their Home Tutor profile will be paused so they no longer appear in "Find Teachers Near You". This action can be reversed by promoting them again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveTutor}
              disabled={isRemoving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isRemoving ? "Removing..." : "Yes, Remove Tutor"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}