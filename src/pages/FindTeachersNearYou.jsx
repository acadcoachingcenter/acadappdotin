import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { getUserLocation } from "@/lib/getUserLocation";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useToast } from "@/components/ui/use-toast";
import LocationMap from "@/components/hometuition/LocationMap";

import {
  LocateFixed,
  Loader2,
  MapPin,
  Star,
  GraduationCap,
  Clock,
  IndianRupee,
  MessageSquare,
} from "lucide-react";


/* =========================================================
   DISTANCE CALCULATION
========================================================= */

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;

  const toRad = (degree) => (degree * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};


/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function FindTeachersNearYou() {
  const { toast } = useToast();

  const [user, setUser] = useState(null);

  const [tutors, setTutors] = useState([]);

  const [loading, setLoading] = useState(true);

  const [locating, setLocating] = useState(false);

  const [origin, setOrigin] = useState(null);

  const [address, setAddress] = useState("");

  const [radius, setRadius] = useState(5);

  const [subjectFilter, setSubjectFilter] = useState("all");

  const [contactingId, setContactingId] = useState(null);


  /* =========================================================
     LOAD USER + APPROVED TUTORS
  ========================================================= */

  useEffect(() => {
    const loadPage = async () => {
      /*
       * Authentication is optional on this page.
       *
       * A visitor must be able to search approved tutors
       * without logging in.
       */
      try {
        const currentUser = await base44.auth.me();

        setUser(currentUser);
      } catch (error) {
        console.log("User not logged in");

        setUser(null);
      }


      /*
       * IMPORTANT:
       *
       * Only tutors satisfying BOTH:
       *
       * status = active
       * approval_status = approved
       *
       * are requested from the Worker/D1 database.
       */
      try {
        const approvedTutors =
          await base44.entities.HomeTutor.filter({
            status: "active",
            approval_status: "approved",
          });

        console.log(
          "Approved active tutors:",
          approvedTutors
        );

        setTutors(
          Array.isArray(approvedTutors)
            ? approvedTutors
            : []
        );
      } catch (error) {
        console.error(
          "Failed to load approved tutors:",
          error
        );

        setTutors([]);

        toast({
          title: "Unable to load tutors",
          description:
            error?.message ||
            "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [toast]);


  /* =========================================================
     GPS LOCATION
  ========================================================= */

  const useGPS = async () => {
    setLocating(true);

    try {
      const { lat, lng } =
        await getUserLocation();

      setOrigin({
        lat: Number(lat),
        lng: Number(lng),
      });

      toast({
        title: "Location found",
      });
    } catch (error) {
      toast({
        title: "Location error",
        description:
          error?.message ||
          "Unable to detect your location.",
        variant: "destructive",
      });
    } finally {
      setLocating(false);
    }
  };


  /* =========================================================
     ADDRESS SEARCH
  ========================================================= */

  const geocodeAddress = async () => {
    if (!address.trim()) {
      toast({
        title: "Enter an address",
        description:
          "Please enter your area, town or city.",
      });

      return;
    }

    setLocating(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
          address.trim()
        )}`
      );

      if (!response.ok) {
        throw new Error(
          "Location search failed"
        );
      }

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const latitude =
          parseFloat(data[0].lat);

        const longitude =
          parseFloat(data[0].lon);

        setOrigin({
          lat: latitude,
          lng: longitude,
        });

        toast({
          title: "Location found",
        });
      } else {
        toast({
          title: "Address not found",
          description:
            "Try another area name or use GPS.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(
        "Geocoding error:",
        error
      );

      toast({
        title: "Could not find location",
        description:
          "Please try GPS or another address.",
        variant: "destructive",
      });
    } finally {
      setLocating(false);
    }
  };


  /* =========================================================
     FILTER TUTORS BY DISTANCE + SUBJECT
  ========================================================= */

  const matches = useMemo(() => {
    if (!origin) {
      return [];
    }

    return tutors

      /*
       * Extra frontend safety.
       *
       * The backend query already requests only
       * approved + active tutors.
       *
       * We verify it again before displaying them.
       */
      .filter(
        (tutor) =>
          tutor.status === "active" &&
          tutor.approval_status ===
            "approved"
      )

      /*
       * Tutor must have valid coordinates.
       */
      .filter((tutor) => {
        const lat =
          Number(tutor.latitude);

        const lng =
          Number(tutor.longitude);

        return (
          Number.isFinite(lat) &&
          Number.isFinite(lng)
        );
      })

      /*
       * Calculate distance between
       * parent/student and tutor.
       */
      .map((tutor) => {
        const tutorLatitude =
          Number(tutor.latitude);

        const tutorLongitude =
          Number(tutor.longitude);

        const distance =
          haversine(
            origin.lat,
            origin.lng,
            tutorLatitude,
            tutorLongitude
          );

        const tutorTravelRadius =
          Number(
            tutor.travel_radius_km ?? 5
          );

        return {
          ...tutor,

          latitude: tutorLatitude,

          longitude: tutorLongitude,

          _dist: distance,

          _inTutorRadius:
            distance <=
            tutorTravelRadius,
        };
      })

      /*
       * Parent selected search radius.
       */
      .filter(
        (tutor) =>
          tutor._dist <= radius
      )

      /*
       * Tutor must also agree to travel
       * this distance.
       */
      .filter(
        (tutor) =>
          tutor._inTutorRadius
      )

      /*
       * Subject filter.
       */
      .filter((tutor) => {
        if (
          subjectFilter === "all"
        ) {
          return true;
        }

        const subjects =
          Array.isArray(tutor.subjects)
            ? tutor.subjects
            : [];

        return subjects.includes(
          subjectFilter
        );
      })

      /*
       * Closest tutors first.
       */
      .sort(
        (a, b) =>
          a._dist - b._dist
      );
  }, [
    tutors,
    origin,
    radius,
    subjectFilter,
  ]);


  /* =========================================================
     SUBJECT LIST
  ========================================================= */

  const allSubjects = useMemo(() => {
    const subjects = new Set();

    tutors.forEach((tutor) => {
      if (
        !Array.isArray(tutor.subjects)
      ) {
        return;
      }

      tutor.subjects.forEach(
        (subject) => {
          if (subject) {
            subjects.add(subject);
          }
        }
      );
    });

    return Array.from(subjects).sort();
  }, [tutors]);


  /* =========================================================
     CONTACT TUTOR
  ========================================================= */

  const handleContact = async (tutor) => {
    /*
     * Searching is public.
     * Contacting requires login.
     */
    if (!user) {
      toast({
        title: "Login required",
        description:
          "Please log in to contact this tutor.",
      });

      try {
        base44.auth.redirectToLogin(
          window.location.href
        );
      } catch (error) {
        console.error(
          "Login redirect failed:",
          error
        );
      }

      return;
    }

    setContactingId(tutor.id);

    try {
      /*
       * Avoid duplicate contact requests.
       */
      const existing =
        await base44.entities.TutorInterest.filter(
          {
            tutor_id: tutor.id,
            student_id: user.id,
          }
        );

      if (
        Array.isArray(existing) &&
        existing.length > 0
      ) {
        toast({
          title:
            "Tutor already contacted",
          description:
            "You have already sent an interest request to this tutor.",
        });

        return;
      }


      await base44.entities.TutorInterest.create(
        {
          tutor_id: tutor.id,

          tutor_name:
            tutor.tutor_name,

          student_id: user.id,

          student_name:
            user.full_name ||
            user.email,

          student_email:
            user.email,

          status: "pending",

          date:
            new Date().toISOString(),
        }
      );


      toast({
        title: "Interest sent",
        description:
          "The tutor can now respond to your request.",
      });
    } catch (error) {
      console.error(
        "Contact tutor error:",
        error
      );

      toast({
        title:
          "Unable to contact tutor",
        description:
          error?.message ||
          "Please try again.",
        variant: "destructive",
      });
    } finally {
      setContactingId(null);
    }
  };


  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* PAGE HEADING */}

      <div className="flex items-center gap-3">

        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">

          <MapPin className="w-7 h-7 text-white" />

        </div>

        <div>

          <h1 className="text-3xl font-bold text-slate-900">
            Find Teachers Near You
          </h1>

          <p className="text-slate-600">
            Discover approved home tutors
            near your location.
          </p>

        </div>

      </div>


      {/* SEARCH CARD */}

      <Card>

        <CardContent className="p-4 space-y-4">

          <div className="grid md:grid-cols-3 gap-3">

            {/* ADDRESS */}

            <div>

              <Label>
                Search by address
              </Label>

              <div className="flex gap-2">

                <Input
                  value={address}
                  onChange={(event) =>
                    setAddress(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      geocodeAddress();
                    }
                  }}
                  placeholder="Enter your area / city"
                />

                <Button
                  onClick={
                    geocodeAddress
                  }
                  disabled={locating}
                >
                  Search
                </Button>

              </div>

            </div>


            {/* GPS */}

            <div className="flex items-end">

              <Button
                variant="outline"
                onClick={useGPS}
                disabled={locating}
                className="w-full"
              >

                {locating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <LocateFixed className="w-4 h-4 mr-2" />
                )}

                Use my GPS location

              </Button>

            </div>


            {/* RADIUS */}

            <div>

              <Label>
                Search radius: {radius} km
              </Label>

              <input
                type="range"
                min={1}
                max={50}
                step={1}
                value={radius}
                onChange={(event) =>
                  setRadius(
                    Number(
                      event.target.value
                    )
                  )
                }
                className="w-full"
              />

            </div>

          </div>


          {/* SUBJECT FILTER */}

          {allSubjects.length > 0 && (

            <div className="flex items-center gap-2 flex-wrap">

              <Label className="whitespace-nowrap">
                Subject:
              </Label>

              <Select
                value={subjectFilter}
                onValueChange={
                  setSubjectFilter
                }
              >

                <SelectTrigger className="w-60">

                  <SelectValue placeholder="Select subject" />

                </SelectTrigger>

                <SelectContent>

                  <SelectItem value="all">
                    All subjects
                  </SelectItem>

                  {allSubjects.map(
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


              {subjectFilter !==
                "all" && (

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setSubjectFilter(
                      "all"
                    )
                  }
                >
                  Clear
                </Button>

              )}

            </div>

          )}


          {/* MAP */}

          {origin && (

            <LocationMap
              center={[
                origin.lat,
                origin.lng,
              ]}
              radiusKm={radius}
              markers={matches.map(
                (tutor) => ({
                  lat:
                    tutor.latitude,

                  lng:
                    tutor.longitude,

                  popup:
                    `${tutor.tutor_name} • ${tutor._dist.toFixed(
                      1
                    )} km`,
                })
              )}
              height={320}
            />

          )}

        </CardContent>

      </Card>


      {/* LOADING */}

      {loading ? (

        <div className="flex justify-center py-12">

          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />

        </div>

      ) : !origin ? (

        /* NO LOCATION */

        <Card>

          <CardContent className="p-10 text-center text-slate-500">

            <MapPin className="w-10 h-10 mx-auto mb-3 opacity-50" />

            <p>
              Use GPS or enter your
              address to find nearby
              approved tutors.
            </p>

          </CardContent>

        </Card>

      ) : matches.length === 0 ? (

        /* NO TUTORS */

        <Card>

          <CardContent className="p-10 text-center text-slate-500">

            <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-50" />

            <p className="font-medium">
              No approved tutors found
              within {radius} km.
            </p>

            <p className="text-sm mt-2">
              Try increasing the search
              radius or selecting all
              subjects.
            </p>

          </CardContent>

        </Card>

      ) : (

        /* TUTOR CARDS */

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

          {matches.map((tutor) => (

            <Card
              key={tutor.id}
              className="flex flex-col"
            >

              <CardContent className="p-4 flex-grow flex flex-col">

                {/* NAME + RATING */}

                <div className="flex items-start justify-between gap-2">

                  <div>

                    <p className="font-semibold text-lg">

                      {tutor.tutor_name ||
                        "Tutor"}

                    </p>

                    <p className="text-sm text-blue-600 flex items-center gap-1">

                      <MapPin className="w-3 h-3" />

                      {tutor._dist.toFixed(
                        1
                      )}{" "}
                      km away

                    </p>

                  </div>


                  {Number(
                    tutor.rating
                  ) > 0 && (

                    <Badge className="flex items-center gap-1">

                      <Star className="w-3 h-3" />

                      {Number(
                        tutor.rating
                      ).toFixed(1)}

                    </Badge>

                  )}

                </div>


                {/* SUBJECTS */}

                <div className="flex flex-wrap gap-1 mt-2">

                  {(Array.isArray(
                    tutor.subjects
                  )
                    ? tutor.subjects
                    : []
                  ).map((subject) => (

                    <Badge
                      key={subject}
                      variant="secondary"
                    >
                      {subject}
                    </Badge>

                  ))}

                </div>


                {/* DETAILS */}

                <div className="text-sm text-slate-600 mt-3 space-y-1">

                  <p className="flex items-center gap-1">

                    <GraduationCap className="w-3 h-3" />

                    {Array.isArray(
                      tutor.grades
                    ) &&
                    tutor.grades.length >
                      0
                      ? tutor.grades.join(
                          ", "
                        )
                      : "Grades not specified"}

                  </p>


                  <p className="flex items-center gap-1">

                    <Clock className="w-3 h-3" />

                    {tutor.availability ||
                      "Availability not specified"}

                  </p>


                  {Number(
                    tutor.hourly_rate
                  ) > 0 && (

                    <p className="flex items-center gap-1">

                      <IndianRupee className="w-3 h-3" />

                      {Number(
                        tutor.hourly_rate
                      ).toLocaleString(
                        "en-IN"
                      )}
                      /hr

                    </p>

                  )}


                  <p>
                    Experience:{" "}
                    {Number(
                      tutor.experience_years
                    ) || 0}{" "}
                    yrs
                  </p>


                  <p>
                    Mode:{" "}
                    {tutor.teaching_mode ||
                      "Not specified"}
                  </p>

                </div>


                {/* BIO */}

                {tutor.bio && (

                  <p className="text-xs text-slate-500 mt-3 line-clamp-3">

                    {tutor.bio}

                  </p>

                )}


                {/* CONTACT */}

                <div className="mt-auto pt-4">

                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() =>
                      handleContact(
                        tutor
                      )
                    }
                    disabled={
                      contactingId ===
                      tutor.id
                    }
                  >

                    {contactingId ===
                    tutor.id ? (

                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />

                    ) : (

                      <MessageSquare className="w-4 h-4 mr-2" />

                    )}

                    Contact Tutor

                  </Button>

                </div>

              </CardContent>

            </Card>

          ))}

        </div>

      )}

    </div>
  );
}
