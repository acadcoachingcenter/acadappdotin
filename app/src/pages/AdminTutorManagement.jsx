import React, { useState, useEffect, useMemo } from "react";
import { User } from "@/entities/User";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

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
  UserCheck,
  UserX,
  UserMinus,
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


/* ============================================================
   USER ROLES
============================================================ */

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


/* ============================================================
   ACCOUNT STATUS
============================================================ */

const ACCOUNT_STATUSES = [
  {
    value: "active",
    label: "Active",
  },
  {
    value: "inactive",
    label: "Inactive",
  },
  {
    value: "suspended",
    label: "Suspended",
  },
  {
    value: "deleted",
    label: "Deleted",
  },
];


/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function AdminTutorManagement() {

  const [users, setUsers] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [filterType, setFilterType] =
    useState("unassigned");

  const [filterStatus, setFilterStatus] =
    useState("all");

  const [isLoading, setIsLoading] =
    useState(true);

  const [updatingUserId, setUpdatingUserId] =
    useState(null);

  const [pendingChange, setPendingChange] =
    useState(null);

  const [isUpdating, setIsUpdating] =
    useState(false);

  const [phoneDrafts, setPhoneDrafts] =
    useState({});

  const [savingPhoneId, setSavingPhoneId] =
    useState(null);


  /* ==========================================================
     LOAD USERS
  ========================================================== */

  const loadUsers = async () => {

    setIsLoading(true);

    try {

      const allUsers =
        await User.list("-created_date");

      setUsers(allUsers || []);

    } catch (error) {

      console.error(
        "Error loading users:",
        error
      );

      alert(
        "Failed to load users: " +
          (error.message || "Unknown error")
      );

    } finally {

      setIsLoading(false);

    }
  };


  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {

    loadUsers();

  }, []);


  /* ==========================================================
     NORMALIZE USER TYPE
  ========================================================== */

  const normalizeUserType = (type) => {

    if (!type) {
      return "unassigned";
    }

    return type;

  };


  /* ==========================================================
     NORMALIZE ACCOUNT STATUS
     
     Existing users without account_status are treated
     as ACTIVE.
  ========================================================== */

  const normalizeAccountStatus = (status) => {

    if (!status) {
      return "active";
    }

    return status;

  };


  /* ==========================================================
     USER TYPE LABEL
  ========================================================== */

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

      case "unassigned":
      case null:
      case undefined:
        return "Unassigned";

      default:
        return "Unassigned";

    }

  };


  /* ==========================================================
     USER TYPE COLOR
  ========================================================== */

  const getUserTypeColor = (type) => {

    switch (type) {

      case "admin":
        return "bg-red-100 text-red-800 border-red-200";

      case "tutor":
        return "bg-blue-100 text-blue-800 border-blue-200";

      case "student":
        return "bg-green-100 text-green-800 border-green-200";

      case "parent":
        return "bg-purple-100 text-purple-800 border-purple-200";

      default:
        return "bg-gray-100 text-gray-800 border-gray-200";

    }

  };


  /* ==========================================================
     ACCOUNT STATUS LABEL
  ========================================================== */

  const getAccountStatusLabel = (status) => {

    switch (status) {

      case "active":
        return "Active";

      case "inactive":
        return "Inactive";

      case "suspended":
        return "Suspended";

      case "deleted":
        return "Deleted";

      default:
        return "Active";

    }

  };


  /* ==========================================================
     ACCOUNT STATUS COLOR
  ========================================================== */

  const getAccountStatusColor = (status) => {

    switch (status) {

      case "active":
        return "bg-green-100 text-green-800 border-green-200";

      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-200";

      case "suspended":
        return "bg-orange-100 text-orange-800 border-orange-200";

      case "deleted":
        return "bg-red-100 text-red-800 border-red-200";

      default:
        return "bg-green-100 text-green-800 border-green-200";

    }

  };


  /* ==========================================================
     FILTER USERS
  ========================================================== */

  const filteredUsers = useMemo(() => {

    let filtered = users;


    /* --------------------------------------------------------
       ROLE FILTER
    -------------------------------------------------------- */

    if (filterType !== "all") {

      filtered = filtered.filter((user) => {

        const type =
          normalizeUserType(
            user.user_type
          );

        return type === filterType;

      });

    }


    /* --------------------------------------------------------
       STATUS FILTER
    -------------------------------------------------------- */

    if (filterStatus !== "all") {

      filtered = filtered.filter((user) => {

        const status =
          normalizeAccountStatus(
            user.account_status
          );

        return status === filterStatus;

      });

    }


    /* --------------------------------------------------------
       SEARCH
    -------------------------------------------------------- */

    if (searchTerm.trim()) {

      const search =
        searchTerm.toLowerCase().trim();

      filtered = filtered.filter((user) => {

        return (

          user.full_name
            ?.toLowerCase()
            .includes(search)

          ||

          user.email
            ?.toLowerCase()
            .includes(search)

          ||

          String(user.id)
            .toLowerCase()
            .includes(search)

        );

      });

    }


    return filtered;

  }, [
    users,
    searchTerm,
    filterType,
    filterStatus,
  ]);


  /* ==========================================================
     ROLE CHANGE REQUEST
  ========================================================== */

  const handleUserTypeChange = (
    user,
    newType
  ) => {

    const currentType =
      normalizeUserType(
        user.user_type
      );


    if (currentType === newType) {
      return;
    }


    if (user.user_type === "admin") {

      alert(
        "Admin accounts cannot be changed from this screen."
      );

      return;

    }


    setPendingChange({

      action: "role",

      user,

      currentValue: currentType,

      newValue: newType,

    });

  };


  /* ==========================================================
     ACCOUNT STATUS CHANGE REQUEST
  ========================================================== */

  const handleAccountStatusChange = (
    user,
    newStatus
  ) => {

    const currentStatus =
      normalizeAccountStatus(
        user.account_status
      );


    if (currentStatus === newStatus) {
      return;
    }


    if (user.user_type === "admin") {

      alert(
        "Admin account status cannot be changed from this screen."
      );

      return;

    }


    setPendingChange({

      action: "status",

      user,

      currentValue: currentStatus,

      newValue: newStatus,

    });

  };


  /* ==========================================================
     PHONE NUMBER EDITING
  ========================================================== */

  const getPhoneDraft = (user) =>
    phoneDrafts[user.id] !== undefined
      ? phoneDrafts[user.id]
      : user.phone || "";

  const handlePhoneDraftChange = (user, value) => {
    setPhoneDrafts((prev) => ({
      ...prev,
      [user.id]: value,
    }));
  };

  const handleSavePhone = async (user) => {
    const draft = getPhoneDraft(user).trim();

    setSavingPhoneId(user.id);

    try {
      await User.update(user.id, { phone: draft });
      await loadUsers();
    } catch (error) {
      console.error("Error updating phone:", error);
      alert("Failed to update phone number: " + (error.message || "Unknown error"));
    } finally {
      setSavingPhoneId(null);
    }
  };


  /* ==========================================================
     DELETE USER PERMANENTLY
  ========================================================== */

  const handleDeleteUser = (user) => {
    if (user.user_type === "admin") {
      alert("Admin accounts cannot be deleted from this screen.");
      return;
    }

    setPendingChange({
      action: "delete",
      user,
    });
  };


  /* ==========================================================
     CONFIRM CHANGE
  ========================================================== */

  const confirmChange = async () => {

    if (!pendingChange) {
      return;
    }


    const {
      action,
      user,
      newValue,
    } = pendingChange;


    setIsUpdating(true);

    setUpdatingUserId(user.id);


    try {

      /* ======================================================
         ROLE CHANGE
      ======================================================= */

      if (action === "role") {

        const databaseUserType =
          newValue === "unassigned"
            ? null
            : newValue;


        await User.update(
          user.id,
          {
            user_type:
              databaseUserType,
          }
        );

      }


      /* ======================================================
         ACCOUNT STATUS CHANGE
      ======================================================= */

      if (action === "status") {

        await User.update(
          user.id,
          {
            account_status:
              newValue,
          }
        );

      }


      /* ======================================================
         PERMANENT DELETE
      ======================================================= */

      if (action === "delete") {
        await User.delete(user.id);
      }


      await loadUsers();

      setPendingChange(null);


    } catch (error) {

      console.error(
        "Error updating user:",
        error
      );

      alert(
        "Failed to update user: " +
          (error.message ||
            "Unknown error")
      );

    } finally {

      setIsUpdating(false);

      setUpdatingUserId(null);

    }

  };


  /* ==========================================================
     REFRESH
  ========================================================== */

  const handleRefresh = () => {

    loadUsers();

  };


  /* ==========================================================
     CONFIRMATION TEXT
  ========================================================== */

  const getConfirmationTitle = () => {

    if (!pendingChange) {
      return "";
    }


    if (
      pendingChange.action ===
      "role"
    ) {

      return "Change User Type?";

    }


    if (pendingChange.action === "delete") {
      return "Delete This Account Permanently?";
    }


    return "Change Account Status?";

  };


  const getConfirmationDescription = () => {

    if (!pendingChange) {
      return null;
    }


    const user =
      pendingChange.user;


    if (
      pendingChange.action ===
      "role"
    ) {

      return (
        <>
          You are changing{" "}

          <strong>
            {user.full_name ||
              user.email}
          </strong>

          {" "}from{" "}

          <strong>
            {getUserTypeLabel(
              pendingChange.currentValue
            )}
          </strong>

          {" "}to{" "}

          <strong>
            {getUserTypeLabel(
              pendingChange.newValue
            )}
          </strong>

          .


          <br />
          <br />


          This changes the role of
          the existing ACAD account.
          No new user account will
          be created.
        </>
      );

    }


    if (pendingChange.action === "delete") {
      return (
        <span className="text-red-700">
          You are about to <strong>permanently delete</strong> the account for{" "}
          <strong>{user.full_name || user.email}</strong>. This removes the user record itself and
          cannot be undone. Their historical ACAD records (past classes, enrollments, etc.) that
          reference this user by ID will be left in place but will no longer resolve to a real
          account. If you just want to deactivate them, use the Account Status dropdown instead of
          deleting.
        </span>
      );
    }


    return (
      <>
        You are changing the account
        status of{" "}

        <strong>
          {user.full_name ||
            user.email}
        </strong>

        {" "}from{" "}

        <strong>
          {getAccountStatusLabel(
            pendingChange.currentValue
          )}
        </strong>

        {" "}to{" "}

        <strong>
          {getAccountStatusLabel(
            pendingChange.newValue
          )}
        </strong>

        .


        <br />
        <br />


        {pendingChange.newValue ===
          "deleted" ? (

          <span className="text-red-700">
            This is a soft delete.
            The user record will be
            retained, but the account
            will be marked as Deleted.
            The user's historical ACAD
            records will not be removed.
          </span>

        ) : (

          <>
            The user's existing ACAD
            account will remain intact.
            Only the account status
            will change.
          </>

        )}

      </>
    );

  };


  /* ==========================================================
     PAGE
  ========================================================== */

  return (

    <div className="space-y-6">


      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="
        flex
        flex-col
        md:flex-row
        md:items-center
        md:justify-between
        gap-4
      ">

        <div>

          <h1 className="
            text-3xl
            font-bold
            text-slate-900
          ">
            Tutor & User Management
          </h1>

          <p className="
            text-sm
            text-slate-600
            mt-1
          ">
            Manage user roles and account
            status without creating duplicate
            ACAD accounts.
          </p>

        </div>


        <Button
          onClick={handleRefresh}
          variant="outline"
          disabled={isLoading}
        >

          <RefreshCw
            className={`
              w-4
              h-4
              mr-2
              ${
                isLoading
                  ? "animate-spin"
                  : ""
              }
            `}
          />

          Refresh

        </Button>

      </div>


      {/* ======================================================
          INFORMATION CARD
      ======================================================= */}

      <Card className="
        bg-blue-50
        border-blue-200
      ">

        <CardHeader className="
          flex
          flex-row
          items-start
          gap-4
        ">

          <Info className="
            w-6
            h-6
            text-blue-600
            mt-1
          " />

          <div>

            <CardTitle className="
              text-blue-900
            ">
              User & Account Management
            </CardTitle>

            <p className="
              text-sm
              text-blue-800
              mt-1
            ">

              Each person has one ACAD
              account. The user type controls
              whether the account is a Tutor,
              Student, Parent, or Unassigned.

              Account status controls whether
              the account is Active, Inactive,
              Suspended, or Deleted.

              No duplicate account is created.

            </p>

          </div>

        </CardHeader>

      </Card>


      {/* ======================================================
          FILTER CARD
      ======================================================= */}

      <Card>

        <CardHeader>

          <div className="
            flex
            flex-col
            xl:flex-row
            xl:items-center
            xl:justify-between
            gap-4
          ">


            {/* TITLE */}

            <CardTitle>

              Users ({filteredUsers.length})

            </CardTitle>


            <div className="
              flex
              flex-col
              md:flex-row
              gap-2
            ">


              {/* SEARCH */}

              <div className="relative">

                <Search
                  className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    text-slate-400
                    w-4
                    h-4
                  "
                />

                <Input
                  placeholder="
                    Search name, email or ID...
                  "
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(
                      e.target.value
                    )
                  }
                  className="
                    pl-10
                    w-full
                    md:w-72
                  "
                />

              </div>


              {/* ROLE FILTER */}

              <Select
                value={filterType}
                onValueChange={
                  setFilterType
                }
              >

                <SelectTrigger
                  className="w-full md:w-44"
                >

                  <SelectValue />

                </SelectTrigger>


                <SelectContent>

                  <SelectItem value="unassigned">
                    Unassigned
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
                    All Roles
                  </SelectItem>

                </SelectContent>

              </Select>


              {/* STATUS FILTER */}

              <Select
                value={filterStatus}
                onValueChange={
                  setFilterStatus
                }
              >

                <SelectTrigger
                  className="w-full md:w-44"
                >

                  <SelectValue />

                </SelectTrigger>


                <SelectContent>

                  <SelectItem value="all">
                    All Statuses
                  </SelectItem>

                  <SelectItem value="active">
                    Active
                  </SelectItem>

                  <SelectItem value="inactive">
                    Inactive
                  </SelectItem>

                  <SelectItem value="suspended">
                    Suspended
                  </SelectItem>

                  <SelectItem value="deleted">
                    Deleted
                  </SelectItem>

                </SelectContent>

              </Select>

            </div>

          </div>

        </CardHeader>


        <CardContent>


          {/* ==================================================
              LOADING
          =================================================== */}

          {isLoading ? (

            <div className="
              text-center
              py-10
            ">

              <RefreshCw
                className="
                  w-6
                  h-6
                  mx-auto
                  mb-3
                  animate-spin
                  text-blue-600
                "
              />

              <p className="
                text-slate-500
              ">
                Loading users...
              </p>

            </div>

          ) : (


            <div className="
              space-y-4
            ">


              {/* ==================================================
                  USER LIST
              =================================================== */}

              {filteredUsers.map(
                (user) => {

                  const currentType =
                    normalizeUserType(
                      user.user_type
                    );


                  const currentStatus =
                    normalizeAccountStatus(
                      user.account_status
                    );


                  const isAdmin =
                    user.user_type ===
                    "admin";


                  const isUpdatingThisUser =
                    updatingUserId ===
                    user.id;


                  return (

                    <div
                      key={user.id}
                      className="
                        border
                        rounded-lg
                        p-4
                        hover:bg-slate-50
                        transition-colors
                      "
                    >

                      <div className="
                        flex
                        flex-col
                        xl:flex-row
                        xl:items-center
                        xl:justify-between
                        gap-4
                      ">


                        {/* ========================================
                            USER DETAILS
                        ========================================= */}

                        <div className="
                          flex
                          items-center
                          gap-3
                        ">

                          <Avatar
                            className="
                              w-12
                              h-12
                            "
                          >

                            <AvatarImage
                              src={
                                user.profile_image
                              }
                            />

                            <AvatarFallback
                              className="
                                bg-blue-100
                                text-blue-700
                                font-semibold
                              "
                            >

                              {(
                                user.full_name
                                  ?.charAt(0) ||

                                user.email
                                  ?.charAt(0) ||

                                "U"
                              ).toUpperCase()}

                            </AvatarFallback>

                          </Avatar>


                          <div>

                            <h4 className="
                              font-semibold
                              text-slate-900
                            ">

                              {user.full_name ||
                                "Unnamed User"}

                            </h4>


                            <p className="
                              text-sm
                              text-slate-600
                            ">

                              {user.email ||
                                "No email"}

                            </p>


                            <div className="
                              flex
                              items-center
                              gap-2
                              mt-1
                            ">

                              <Input
                                value={getPhoneDraft(user)}
                                onChange={(e) =>
                                  handlePhoneDraftChange(user, e.target.value)
                                }
                                placeholder="WhatsApp number (e.g. 919790818436)"
                                className="h-8 text-sm w-full md:w-56"
                              />

                              {getPhoneDraft(user) !== (user.phone || "") && (
                                <Button
                                  size="sm"
                                  className="h-8 bg-blue-600 hover:bg-blue-700 shrink-0"
                                  disabled={savingPhoneId === user.id}
                                  onClick={() => handleSavePhone(user)}
                                >
                                  {savingPhoneId === user.id ? "Saving…" : "Save"}
                                </Button>
                              )}

                            </div>


                            <p className="
                              text-xs
                              text-slate-400
                            ">

                              ID: {user.id}

                            </p>


                            {user.created_date && (

                              <p className="
                                text-xs
                                text-slate-400
                              ">

                                Joined:{" "}

                                {new Date(
                                  user.created_date
                                ).toLocaleDateString()}

                              </p>

                            )}

                          </div>

                        </div>


                        {/* ========================================
                            MANAGEMENT CONTROLS
                        ========================================= */}

                        <div className="
                          flex
                          flex-col
                          md:flex-row
                          md:items-center
                          gap-3
                        ">


                          {/* ROLE BADGE */}

                          <Badge
                            className={`
                              ${getUserTypeColor(
                                user.user_type
                              )}
                            `}
                          >

                            {getUserTypeLabel(
                              user.user_type
                            )}

                          </Badge>


                          {/* STATUS BADGE */}

                          <Badge
                            className={`
                              ${getAccountStatusColor(
                                currentStatus
                              )}
                            `}
                          >

                            {getAccountStatusLabel(
                              currentStatus
                            )}

                          </Badge>


                          {/* ROLE DROPDOWN */}

                          {isAdmin ? (

                            <div className="
                              flex
                              items-center
                              gap-2
                            ">

                              <ShieldCheck
                                className="
                                  w-4
                                  h-4
                                  text-red-600
                                "
                              />

                              <span className="
                                text-sm
                                text-red-700
                                font-medium
                              ">

                                Admin

                              </span>

                            </div>

                          ) : (

                            <Select
                              value={
                                currentType
                              }
                              onValueChange={(
                                value
                              ) =>
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

                              <SelectTrigger
                                className="
                                  w-full
                                  md:w-36
                                "
                              >

                                <SelectValue />

                              </SelectTrigger>


                              <SelectContent>

                                {USER_TYPES.map(
                                  (type) => (

                                    <SelectItem
                                      key={
                                        type.value
                                      }
                                      value={
                                        type.value
                                      }
                                    >

                                      {type.label}

                                    </SelectItem>

                                  )
                                )}

                              </SelectContent>

                            </Select>

                          )}


                          {/* STATUS DROPDOWN */}

                          {!isAdmin && (

                            <Select
                              value={
                                currentStatus
                              }
                              onValueChange={(
                                value
                              ) =>
                                handleAccountStatusChange(
                                  user,
                                  value
                                )
                              }
                              disabled={
                                isUpdatingThisUser ||
                                isUpdating
                              }
                            >

                              <SelectTrigger
                                className="
                                  w-full
                                  md:w-36
                                "
                              >

                                <SelectValue />

                              </SelectTrigger>


                              <SelectContent>

                                {ACCOUNT_STATUSES.map(
                                  (status) => (

                                    <SelectItem
                                      key={
                                        status.value
                                      }
                                      value={
                                        status.value
                                      }
                                    >

                                      {status.label}

                                    </SelectItem>

                                  )
                                )}

                              </SelectContent>

                            </Select>

                          )}


                          {/* DELETE PERMANENTLY */}

                          {!isAdmin && (

                            <Button
                              size="sm"
                              variant="outline"
                              className="
                                border-red-300
                                text-red-600
                                hover:bg-red-50
                              "
                              disabled={
                                isUpdatingThisUser ||
                                isUpdating
                              }
                              onClick={() =>
                                handleDeleteUser(user)
                              }
                            >
                              <UserX className="w-4 h-4 mr-1" />
                              Delete
                            </Button>

                          )}

                        </div>

                      </div>

                    </div>

                  );

                }
              )}


              {/* ==================================================
                  NO RESULTS
              =================================================== */}

              {filteredUsers.length === 0 && (

                <div className="
                  text-center
                  py-10
                ">

                  <p className="
                    text-slate-500
                  ">

                    No users found
                    for this filter.

                  </p>

                </div>

              )}

            </div>

          )}

        </CardContent>

      </Card>


      {/* ======================================================
          CONFIRMATION DIALOG
      ======================================================= */}

      <AlertDialog
        open={
          !!pendingChange
        }
        onOpenChange={(open) => {

          if (
            !open &&
            !isUpdating
          ) {

            setPendingChange(
              null
            );

          }

        }}
      >

        <AlertDialogContent>

          <AlertDialogHeader>

            <AlertDialogTitle>

              {getConfirmationTitle()}

            </AlertDialogTitle>


            <AlertDialogDescription>

              {getConfirmationDescription()}

            </AlertDialogDescription>

          </AlertDialogHeader>


          <AlertDialogFooter>

            <AlertDialogCancel
              disabled={isUpdating}
            >

              Cancel

            </AlertDialogCancel>


            <AlertDialogAction
              onClick={
                confirmChange
              }
              disabled={isUpdating}
              className={`
                text-white
                ${
                  pendingChange?.newValue ===
                    "deleted" ||
                  pendingChange?.action ===
                    "delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }
              `}
            >

              {isUpdating
                ? "Updating..."
                : pendingChange?.action ===
                  "delete"
                ? "Yes, Delete Permanently"
                : pendingChange?.newValue ===
                  "deleted"
                ? "Yes, Mark Deleted"
                : "Yes, Update"}

            </AlertDialogAction>

          </AlertDialogFooter>

        </AlertDialogContent>

      </AlertDialog>

    </div>

  );

}
