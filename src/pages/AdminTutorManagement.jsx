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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Search,
  Info,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  UserX,
  UserMinus,
  Phone,
  MessageCircle,
  Pencil,
  BookOpen,
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
  { value: "tutor", label: "Tutor" },
  { value: "student", label: "Student" },
  { value: "parent", label: "Parent" },
  { value: "unassigned", label: "Unassigned" },
];


/* ============================================================
   ACCOUNT STATUS
============================================================ */

const ACCOUNT_STATUSES = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
  { value: "deleted", label: "Deleted" },
];


/* ============================================================
   SUBJECT EXPERTISE

   Stored on the User record as an array of strings in the
   field `subject_expertise`, e.g. ["Physics", "Mathematics"].
   Add or remove subjects here to change the choices.
============================================================ */

const SUBJECT_OPTIONS = [
  "Physics",
  "Chemistry",
  "Botany",
  "Zoology",
  "Biology",
  "Mathematics",
  "English",
  "Computer Science",
  "Hindi",
  "Accountancy",
  "Science",
  "Tamil",
];


/* ============================================================
   HELPERS
============================================================ */

/* Accepts an array, a comma-separated string, or nothing. */
const getUserSubjects = (user) => {

  const raw = user?.subject_expertise;

  if (Array.isArray(raw)) {
    return raw.filter(Boolean);
  }

  if (typeof raw === "string" && raw.trim()) {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return [];

};


/* Phone can live under a few different field names. */
const getUserPhone = (user) => {

  return (
    user?.phone ||
    user?.phone_number ||
    user?.mobile ||
    user?.whatsapp ||
    ""
  );

};


/* Digits only; a bare 10-digit number is treated as Indian. */
const getDialNumber = (phone) => {

  const digits = String(phone || "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.length === 10) {
    return "91" + digits;
  }

  return digits;

};


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

  const [filterSubject, setFilterSubject] =
    useState("all");

  const [isLoading, setIsLoading] =
    useState(true);

  const [updatingUserId, setUpdatingUserId] =
    useState(null);

  const [pendingChange, setPendingChange] =
    useState(null);

  const [isUpdating, setIsUpdating] =
    useState(false);

  /* Subject editor */

  const [editingUser, setEditingUser] =
    useState(null);

  const [editSubjects, setEditSubjects] =
    useState([]);

  const [isSavingSubjects, setIsSavingSubjects] =
    useState(false);


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
     SUBJECT FILTER CHANGE

     Picking a subject means the admin is looking for a tutor,
     so switch the role filter to Tutors automatically.
  ========================================================== */

  const handleSubjectFilterChange = (value) => {

    setFilterSubject(value);

    if (value !== "all") {
      setFilterType("tutor");
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
       SUBJECT FILTER
    -------------------------------------------------------- */

    if (filterSubject !== "all") {

      filtered = filtered.filter((user) =>
        getUserSubjects(user).includes(
          filterSubject
        )
      );

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

          ||

          getUserSubjects(user).some((subject) =>
            subject.toLowerCase().includes(search)
          )

        );

      });

    }


    return filtered;

  }, [
    users,
    searchTerm,
    filterType,
    filterStatus,
    filterSubject,
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
     SUBJECT EDITOR
  ========================================================== */

  const openSubjectEditor = (user) => {

    setEditingUser(user);

    setEditSubjects(getUserSubjects(user));

  };


  const closeSubjectEditor = () => {

    if (isSavingSubjects) {
      return;
    }

    setEditingUser(null);

    setEditSubjects([]);

  };


  const toggleEditSubject = (subject) => {

    setEditSubjects((current) =>
      current.includes(subject)
        ? current.filter((s) => s !== subject)
        : [...current, subject]
    );

  };


  const saveSubjects = async () => {

    if (!editingUser) {
      return;
    }


    setIsSavingSubjects(true);


    try {

      await User.update(
        editingUser.id,
        {
          subject_expertise: editSubjects,
        }
      );


      /* Update the row in place so filters and scroll
         position are not disturbed by a full reload. */

      setUsers((current) =>
        current.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                subject_expertise: editSubjects,
              }
            : u
        )
      );


      setEditingUser(null);

      setEditSubjects([]);


    } catch (error) {

      console.error(
        "Error saving subjects:",
        error
      );

      alert(
        "Failed to save subjects: " +
          (error.message ||
            "Unknown error")
      );

    } finally {

      setIsSavingSubjects(false);

    }

  };


  /* ==========================================================
     CONTACT LINKS
  ========================================================== */

  const getWhatsAppLink = (user) => {

    const number =
      getDialNumber(getUserPhone(user));

    if (!number) {
      return "";
    }


    const subjectText =
      filterSubject !== "all"
        ? " for a " + filterSubject + " class"
        : " for a class";


    const message =
      "Hello " +
      (user.full_name || "") +
      ", this is ACAD Online Coaching. Are you available" +
      subjectText +
      "?";


    return (
      "https://wa.me/" +
      number +
      "?text=" +
      encodeURIComponent(message)
    );

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
            Manage user roles, account status
            and tutor subject expertise without
            creating duplicate ACAD accounts.
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

            <p className="
              text-sm
              text-blue-800
              mt-2
            ">

              To find a tutor for a class, filter
              by subject, then call or message
              them on WhatsApp from their row.

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
              md:flex-wrap
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
                  placeholder="Search name, email, ID or subject..."
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


              {/* SUBJECT FILTER */}

              <Select
                value={filterSubject}
                onValueChange={
                  handleSubjectFilterChange
                }
              >

                <SelectTrigger
                  className="w-full md:w-48"
                >

                  <SelectValue />

                </SelectTrigger>


                <SelectContent>

                  <SelectItem value="all">
                    All Subjects
                  </SelectItem>

                  {SUBJECT_OPTIONS.map(
                    (subject) => (

                      <SelectItem
                        key={subject}
                        value={subject}
                      >

                        {subject}

                      </SelectItem>

                    )
                  )}

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


                  const isTutor =
                    currentType ===
                    "tutor";


                  const isUpdatingThisUser =
                    updatingUserId ===
                    user.id;


                  const subjects =
                    getUserSubjects(user);


                  const phone =
                    getUserPhone(user);


                  const dialNumber =
                    getDialNumber(phone);


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
                          items-start
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


                            {isTutor && phone && (

                              <p className="
                                text-sm
                                text-slate-600
                              ">

                                {phone}

                              </p>

                            )}


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


                            {/* SUBJECT EXPERTISE (tutors only) */}

                            {isTutor && (

                              <div className="
                                flex
                                flex-wrap
                                items-center
                                gap-1.5
                                mt-2
                              ">

                                <BookOpen className="
                                  w-4
                                  h-4
                                  text-slate-400
                                " />

                                {subjects.length > 0 ? (

                                  subjects.map(
                                    (subject) => (

                                      <Badge
                                        key={subject}
                                        className={`
                                          border
                                          ${
                                            subject ===
                                            filterSubject
                                              ? "bg-blue-600 text-white border-blue-600"
                                              : "bg-slate-100 text-slate-700 border-slate-200"
                                          }
                                        `}
                                      >

                                        {subject}

                                      </Badge>

                                    )
                                  )

                                ) : (

                                  <span className="
                                    text-xs
                                    text-amber-700
                                  ">

                                    No subjects set

                                  </span>

                                )}


                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() =>
                                    openSubjectEditor(
                                      user
                                    )
                                  }
                                >

                                  <Pencil className="
                                    w-3
                                    h-3
                                    mr-1
                                  " />

                                  Edit

                                </Button>

                              </div>

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


                          {/* CONTACT (tutors only) */}

                          {isTutor && (

                            dialNumber ? (

                              <div className="
                                flex
                                items-center
                                gap-2
                              ">

                                <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                >

                                  <a
                                    href={`tel:+${dialNumber}`}
                                  >

                                    <Phone className="
                                      w-4
                                      h-4
                                      mr-1
                                    " />

                                    Call

                                  </a>

                                </Button>


                                <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                  className="
                                    text-green-700
                                    border-green-200
                                    hover:bg-green-50
                                  "
                                >

                                  <a
                                    href={getWhatsAppLink(
                                      user
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >

                                    <MessageCircle className="
                                      w-4
                                      h-4
                                      mr-1
                                    " />

                                    WhatsApp

                                  </a>

                                </Button>

                              </div>

                            ) : (

                              <span className="
                                text-xs
                                text-slate-400
                              ">

                                No phone number

                              </span>

                            )

                          )}


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

                    {filterSubject !== "all"
                      ? "No tutors found for " +
                        filterSubject +
                        ". Set subjects on a tutor with Edit."
                      : "No users found for this filter."}

                  </p>

                </div>

              )}

            </div>

          )}

        </CardContent>

      </Card>


      {/* ======================================================
          SUBJECT EXPERTISE DIALOG
      ======================================================= */}

      <Dialog
        open={!!editingUser}
        onOpenChange={(open) => {

          if (!open) {
            closeSubjectEditor();
          }

        }}
      >

        <DialogContent>

          <DialogHeader>

            <DialogTitle>
              Subject expertise
            </DialogTitle>

            <DialogDescription>

              Select every subject{" "}

              <strong>
                {editingUser?.full_name ||
                  editingUser?.email}
              </strong>

              {" "}can teach.

            </DialogDescription>

          </DialogHeader>


          <div className="
            flex
            flex-wrap
            gap-2
            py-2
          ">

            {SUBJECT_OPTIONS.map((subject) => {

              const selected =
                editSubjects.includes(subject);

              return (

                <button
                  key={subject}
                  type="button"
                  onClick={() =>
                    toggleEditSubject(subject)
                  }
                  aria-pressed={selected}
                  className={`
                    px-3
                    py-1.5
                    rounded-full
                    border
                    text-sm
                    transition-colors
                    focus:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-blue-500
                    ${
                      selected
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }
                  `}
                >

                  {subject}

                </button>

              );

            })}

          </div>


          <DialogFooter>

            <Button
              variant="outline"
              onClick={closeSubjectEditor}
              disabled={isSavingSubjects}
            >

              Cancel

            </Button>


            <Button
              onClick={saveSubjects}
              disabled={isSavingSubjects}
              className="
                bg-blue-600
                hover:bg-blue-700
                text-white
              "
            >

              {isSavingSubjects
                ? "Saving..."
                : "Save subjects"}

            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>


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
                  "deleted"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }
              `}
            >

              {isUpdating
                ? "Updating..."
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
