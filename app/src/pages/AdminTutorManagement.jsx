import React, { useState, useEffect, useMemo } from "react";
import { User } from "@/entities/User";
import { base44 } from "@/api/base44Client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Search,
  Info,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


const USER_TYPES = [
  {
    value: "tutor",
    label: "Tutor",
  },
  {
    value: "student",
    label: "Student",
  },
  {
    value: "parent",
    label: "Parent",
  },
  {
    value: "unassigned",
    label: "Unassigned",
  },
];


export default function AdminTutorManagement() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("unassigned");

  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const [pendingChange, setPendingChange] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);


  // ============================================================
  // LOAD USERS
  // ============================================================

  const loadUsers = async () => {
    setIsLoading(true);

    try {
      const allUsers = await User.list("-created_date");
      setUsers(allUsers || []);
    } catch (error) {
      console.error("Error loading users:", error);
      alert("Failed to load users: " + (error.message || "Unknown error"));
    }

    setIsLoading(false);
  };


  useEffect(() => {
    loadUsers();
  }, []);


  // ============================================================
  // FILTER USERS
  // ============================================================

  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (filterType !== "all") {
      filtered = filtered.filter((user) => {
        if (filterType === "unassigned") {
          return !user.user_type;
        }

        return user.user_type === filterType;
      });
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();

      filtered = filtered.filter((user) => {
        return (
          user.full_name?.toLowerCase().includes(search) ||
          user.email?.toLowerCase().includes(search) ||
          user.id?.toLowerCase().includes(search)
        );
      });
    }

    return filtered;
  }, [searchTerm, filterType, users]);


  // ============================================================
  // USER TYPE HELPERS
  // ============================================================

  const normalizeUserType = (type) => {
    if (!type) {
      return "unassigned";
    }

    return type;
  };


  const getUserTypeLabel = (type) => {
    switch (type) {
      case "tutor":
        return "Tutor";

      case "student":
        return "Student";

      case "parent":
        return "Parent";

      case "admin":
        return "Admin";

      default:
        return "Unassigned";
    }
  };


  const getUserTypeColor = (type) => {
    switch (type) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200";

      case "tutor":
        return "bg-blue-100 text-blue-800 border-blue-200";

      case "parent":
        return "bg-purple-100 text-purple-800 border-purple-200";

      case "student":
        return "bg-green-100 text-green-800 border-green-200";

      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };


  // ============================================================
  // REQUEST ROLE CHANGE
  // ============================================================

  const handleUserTypeChange = (user, newType) => {
    const currentType = normalizeUserType(user.user_type);

    if (currentType === newType) {
      return;
    }

    // Never allow an admin account to be changed
    if (user.user_type === "admin") {
      alert("Admin accounts cannot be changed from this screen.");
      return;
    }

    setPendingChange({
      user,
      newType,
      currentType,
    });
  };


  // ============================================================
  // CONFIRM ROLE CHANGE
  // ============================================================

  const confirmUserTypeChange = async () => {
    if (!pendingChange) {
      return;
    }

    const { user, newType, currentType } = pendingChange;

    setIsUpdating(true);
    setUpdatingUserId(user.id);

    try {
      // --------------------------------------------------------
      // Convert "unassigned" to null
      // --------------------------------------------------------

      const databaseUserType =
        newType === "unassigned" ? null : newType;


      // --------------------------------------------------------
      // Update the EXISTING user
      // --------------------------------------------------------

      await User.update(user.id, {
        user_type: databaseUserType,
      });


      // --------------------------------------------------------
      // If user is being moved AWAY from tutor,
      // pause their HomeTutor profile.
      // --------------------------------------------------------

      if (
        currentType === "tutor" &&
        newType !== "tutor"
      ) {
        try {
          await base44.entities.HomeTutor.updateMany(
            {
              tutor_id: user.id,
              status: "active",
            },
            {
              $set: {
                status: "paused",
              },
            }
          );
        } catch (homeTutorError) {
          console.error(
            "Error pausing HomeTutor profile:",
            homeTutorError
          );
        }
      }


      // --------------------------------------------------------
      // Refresh users
      // --------------------------------------------------------

      await loadUsers();

      setPendingChange(null);

    } catch (error) {
      console.error("Error changing user type:", error);

      alert(
        "Failed to change user type: " +
          (error.message || "Unknown error")
      );
    } finally {
      setIsUpdating(false);
      setUpdatingUserId(null);
    }
  };


  // ============================================================
  // REFRESH
  // ============================================================

  const handleRefresh = () => {
    loadUsers();
  };


  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="space-y-6">

      {/* ======================================================
          PAGE HEADER
      ======================================================= */}

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Tutor & User Management
          </h1>

          <p className="text-sm text-slate-600 mt-1">
            Manage the role of existing ACAD users without creating
            duplicate accounts.
          </p>
        </div>

        <Button
          onClick={handleRefresh}
          variant="outline"
          disabled={isLoading}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${
              isLoading ? "animate-spin" : ""
            }`}
          />

          Refresh
        </Button>

      </div>


      {/* ======================================================
          INFORMATION
      ======================================================= */}

      <Card className="bg-blue-50 border-blue-200">

        <CardHeader className="flex flex-row items-start gap-4">

          <Info className="w-6 h-6 text-blue-600 mt-1" />

          <div>

            <CardTitle className="text-blue-900">
              User Role Management
            </CardTitle>

            <p className="text-sm text-blue-800 mt-1">
              Each person has one ACAD user account. Use the
              dropdown below to assign the account as Tutor,
              Student, Parent, or Unassigned. This changes the
              existing user's role and does not create a duplicate
              account.
            </p>

          </div>

        </CardHeader>

      </Card>


      {/* ======================================================
          USERS CARD
      ======================================================= */}

      <Card>

        <CardHeader>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

            <CardTitle>
              {filterType === "unassigned"
                ? "Unassigned Users"
                : filterType === "all"
                ? "All Users"
                : `${getUserTypeLabel(filterType)}s`}
              {" "}({filteredUsers.length})
            </CardTitle>


            <div className="flex flex-col sm:flex-row gap-2">

              {/* SEARCH */}

              <div className="relative">

                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />

                <Input
                  placeholder="Search name, email or ID..."
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(e.target.value)
                  }
                  className="pl-10 w-full sm:w-72"
                />

              </div>


              {/* FILTER */}

              <Select
                value={filterType}
                onValueChange={setFilterType}
              >

                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>

                  <SelectItem value="unassigned">
                    Unassigned Users
                  </SelectItem>

                  <SelectItem value="tutor">
                    Tutors
                  </SelectItem>

                  <SelectItem value="student">
                    Students
                  </SelectItem>

                  <SelectItem value="parent">
                    Parents
                  </SelectItem>

                  <SelectItem value="all">
                    All Users
                  </SelectItem>

                </SelectContent>

              </Select>

            </div>

          </div>

        </CardHeader>


        <CardContent>

          {isLoading ? (

            <div className="text-center py-10">
              <RefreshCw className="w-6 h-6 mx-auto mb-3 animate-spin text-blue-600" />
              <p className="text-slate-500">
                Loading users...
              </p>
            </div>

          ) : (

            <div className="space-y-4">

              {filteredUsers.map((user) => {

                const currentType =
                  normalizeUserType(user.user_type);

                const isAdmin =
                  user.user_type === "admin";

                const isUpdatingThisUser =
                  updatingUserId === user.id;


                return (

                  <div
                    key={user.id}
                    className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                  >

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                      {/* USER DETAILS */}

                      <div className="flex items-center gap-3">

                        <Avatar className="w-12 h-12">

                          <AvatarImage
                            src={user.profile_image}
                          />

                          <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">

                            {(
                              user.full_name?.charAt(0) ||
                              user.email?.charAt(0) ||
                              "U"
                            ).toUpperCase()}

                          </AvatarFallback>

                        </Avatar>


                        <div>

                          <h4 className="font-semibold text-slate-900">
                            {user.full_name ||
                              "Unnamed User"}
                          </h4>

                          <p className="text-sm text-slate-600">
                            {user.email || "No email"}
                          </p>

                          <p className="text-xs text-slate-400">
                            ID: {user.id}
                          </p>

                          {user.created_date && (
                            <p className="text-xs text-slate-400">
                              Joined:{" "}
                              {new Date(
                                user.created_date
                              ).toLocaleDateString()}
                            </p>
                          )}

                        </div>

                      </div>


                      {/* ROLE MANAGEMENT */}

                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">

                        {/* CURRENT ROLE */}

                        <Badge
                          className={`${getUserTypeColor(
                            user.user_type
                          )} capitalize`}
                        >
                          {getUserTypeLabel(
                            user.user_type
                          )}
                        </Badge>


                        {/* ROLE DROPDOWN */}

                        {isAdmin ? (

                          <div className="flex items-center gap-2">

                            <ShieldCheck className="w-4 h-4 text-red-600" />

                            <span className="text-sm text-red-700 font-medium">
                              Admin account
                            </span>

                          </div>

                        ) : (

                          <Select
                            value={currentType}
                            onValueChange={(value) =>
                              handleUserTypeChange(
                                user,
                                value
                              )
                            }
                            disabled={
                              isUpdatingThisUser ||
                              isUpdating
                            }
                          >

                            <SelectTrigger className="w-44">

                              <SelectValue placeholder="Select role" />

                            </SelectTrigger>

                            <SelectContent>

                              {USER_TYPES.map((type) => (

                                <SelectItem
                                  key={type.value}
                                  value={type.value}
                                >
                                  {type.label}
                                </SelectItem>

                              ))}

                            </SelectContent>

                          </Select>

                        )}

                      </div>

                    </div>

                  </div>

                );

              })}


              {/* NO RESULTS */}

              {filteredUsers.length === 0 && (

                <div className="text-center py-10">

                  <p className="text-slate-500">
                    No users found for this filter.
                  </p>

                </div>

              )}

            </div>

          )}

        </CardContent>

      </Card>


      {/* ======================================================
          ROLE CHANGE CONFIRMATION
      ======================================================= */}

      <AlertDialog
        open={!!pendingChange}
        onOpenChange={(open) => {
          if (!open && !isUpdating) {
            setPendingChange(null);
          }
        }}
      >

        <AlertDialogContent>

          <AlertDialogHeader>

            <AlertDialogTitle>
              Change User Type?
            </AlertDialogTitle>

            <AlertDialogDescription>

              {pendingChange && (
                <span>

                  You are changing{" "}
                  <strong>
                    {pendingChange.user.full_name ||
                      pendingChange.user.email}
                  </strong>{" "}

                  from{" "}
                  <strong>
                    {getUserTypeLabel(
                      pendingChange.currentType
                    )}
                  </strong>{" "}

                  to{" "}
                  <strong>
                    {getUserTypeLabel(
                      pendingChange.newType
                    )}
                  </strong>
                  .

                  <br />
                  <br />

                  This changes the role of the existing ACAD
                  account. No new user account will be created.

                  {pendingChange.currentType === "tutor" &&
                    pendingChange.newType !== "tutor" && (
                      <>
                        <br />
                        <br />

                        Their active Home Tutor profile will also
                        be paused.
                      </>
                    )}

                </span>
              )}

            </AlertDialogDescription>

          </AlertDialogHeader>


          <AlertDialogFooter>

            <AlertDialogCancel disabled={isUpdating}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={confirmUserTypeChange}
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUpdating
                ? "Updating..."
                : "Yes, Change Role"}
            </AlertDialogAction>

          </AlertDialogFooter>

        </AlertDialogContent>

      </AlertDialog>

    </div>
  );
}
